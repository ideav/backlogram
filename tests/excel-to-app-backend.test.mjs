import assert from 'node:assert/strict'
import { test } from 'node:test'
import { execFileSync, spawn } from 'node:child_process'
import { readFileSync, existsSync, mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import net from 'node:net'

const root = new URL('..', import.meta.url).pathname
const sharedPhp = join(root, 'public/intake-shared.php')
const endpointPhp = join(root, 'public/excel-to-app.php')

function php(args, opts = {}) {
  return execFileSync('php', args, { encoding: 'utf8', ...opts })
}

function getFreePort() {
  return new Promise((resolve, reject) => {
    const srv = net.createServer()
    srv.unref()
    srv.on('error', reject)
    srv.listen(0, '127.0.0.1', () => {
      const { port } = srv.address()
      srv.close(() => resolve(port))
    })
  })
}

async function waitForPort(port, timeoutMs = 8000) {
  const start = Date.now()
  while (Date.now() - start < timeoutMs) {
    const up = await new Promise(resolve => {
      const sock = net.connect(port, '127.0.0.1')
      sock.on('connect', () => { sock.destroy(); resolve(true) })
      sock.on('error', () => resolve(false))
    })
    if (up) return
    await new Promise(r => setTimeout(r, 100))
  }
  throw new Error(`port ${port} did not open in time`)
}

test('php -l reports no syntax errors in intake PHP files', () => {
  for (const file of [sharedPhp, endpointPhp]) {
    const out = php(['-l', file])
    assert.match(out, /No syntax errors detected/, `${file} should lint clean`)
  }
})

test('pure intake helpers pass their unit assertions', () => {
  const out = php([join(root, 'tests/fixtures/intake-unit.php')])
  assert.match(out, /all intake unit assertions passed/)
})

test('endpoint requires GitHub configuration and the criteria features are present', () => {
  const src = readFileSync(endpointPhp, 'utf8')
  // Criterion: создание issue через GitHub API
  assert.match(src, /intake_github_create_issue/, 'should create a GitHub issue')
  // Criterion: вложение файлов
  assert.match(src, /intake_github_upload_file/, 'should upload attachments')
  assert.match(src, /\$_FILES/, 'should read uploaded files')
  // Criterion: уведомление в Telegram
  assert.match(src, /intake_telegram_send_message/, 'should notify Telegram')
  // Criterion: защита от спама (captcha + лимиты)
  assert.match(src, /intake_verify_captcha/, 'should verify captcha')
  assert.match(src, /intake_rate_limit/, 'should rate-limit by IP')
  // Criterion: токен из env, не в репозитории
  assert.match(src, /intake_config\('GITHUB_TOKEN'/, 'token must come from config/env, not be hardcoded')
})

test('telegram-config.php is git-ignored (token never committed)', () => {
  const gitignore = readFileSync(join(root, '.gitignore'), 'utf8')
  assert.match(gitignore, /public\/telegram-config\.php/, 'config with secrets must be git-ignored')
})

test('end-to-end: form upload creates issue, attaches file, notifies Telegram', async () => {
  const mockPort = await getFreePort()
  const appPort = await getFreePort()
  const workdir = mkdtempSync(join(tmpdir(), 'excel-to-app-e2e-'))
  const mockLog = join(workdir, 'mock.log')

  const mockProc = spawn('php', ['-S', `127.0.0.1:${mockPort}`, join(root, 'tests/fixtures/intake-mock-api.php')], {
    env: { ...process.env, MOCK_LOG: mockLog },
    stdio: 'ignore',
  })

  const appProc = spawn('php', ['-S', `127.0.0.1:${appPort}`, '-t', join(root, 'public')], {
    env: {
      ...process.env,
      INTAKE_SKIP_HOST_CHECK: '1',
      SMARTCAPTCHA_SERVER_KEY: '',
      GITHUB_TOKEN: 'test-token',
      GITHUB_ISSUE_REPO: 'mock/repo',
      GITHUB_UPLOAD_REPO: 'mock/repo',
      GITHUB_API_BASE: `http://127.0.0.1:${mockPort}`,
      TELEGRAM_BOT_TOKEN: 'bot:test',
      TELEGRAM_CHAT_ID: '123',
      TELEGRAM_API_BASE: `http://127.0.0.1:${mockPort}`,
      INTAKE_RATE_LIMIT_DIR: join(workdir, 'rl'),
    },
    stdio: 'ignore',
  })

  try {
    await waitForPort(mockPort)
    await waitForPort(appPort)

    const form = new FormData()
    form.set('name', 'Иван')
    form.set('company', 'ООО Пекарня')
    form.set('contact', 'ivan@example.com')
    form.set('topic', 'Учёт заказов из 3 Excel-файлов')
    form.set('files', new Blob(['col1;col2\n1;2\n'], { type: 'text/csv' }), 'orders.csv')

    const res = await fetch(`http://127.0.0.1:${appPort}/excel-to-app.php`, { method: 'POST', body: form })
    const json = await res.json()

    assert.equal(res.status, 200, `expected 200, got ${res.status}: ${JSON.stringify(json)}`)
    assert.equal(json.ok, true, JSON.stringify(json))
    assert.equal(json.attachments, 1)
    assert.equal(json.issue_number, 4242)
    assert.match(json.issue_url, /issues\/4242/)
    assert.equal(json.telegram, true)

    const log = existsSync(mockLog) ? readFileSync(mockLog, 'utf8').trim().split('\n').filter(Boolean).map(l => JSON.parse(l)) : []
    const putContents = log.find(e => e.method === 'PUT' && e.path.includes('/contents/'))
    const postIssue = log.find(e => e.method === 'POST' && e.path.endsWith('/issues'))
    const sendMessage = log.find(e => e.path.includes('/sendMessage'))

    assert.ok(putContents, 'attachment should be uploaded via Contents API')
    assert.match(putContents.path, /orders\//, 'attachment should land under orders/')
    assert.ok(postIssue, 'an issue should be created')
    assert.match(postIssue.body, /Excel/, 'issue body should describe the order')
    assert.ok(sendMessage, 'Telegram notification should be sent')
  } finally {
    mockProc.kill()
    appProc.kill()
    rmSync(workdir, { recursive: true, force: true })
  }
})

test('end-to-end: missing contact is rejected with 400', async () => {
  const appPort = await getFreePort()
  const appProc = spawn('php', ['-S', `127.0.0.1:${appPort}`, '-t', join(root, 'public')], {
    env: {
      ...process.env,
      INTAKE_SKIP_HOST_CHECK: '1',
      SMARTCAPTCHA_SERVER_KEY: '',
      GITHUB_TOKEN: 'test-token',
      GITHUB_ISSUE_REPO: 'mock/repo',
    },
    stdio: 'ignore',
  })
  try {
    await waitForPort(appPort)
    const form = new FormData()
    form.set('name', 'No Contact')
    const res = await fetch(`http://127.0.0.1:${appPort}/excel-to-app.php`, { method: 'POST', body: form })
    const json = await res.json()
    assert.equal(res.status, 400)
    assert.equal(json.ok, false)
  } finally {
    appProc.kill()
  }
})
