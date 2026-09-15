// issue #399 — форма отправки как в ИИ-чатах: большое окно ввода + кнопка
// прикрепления файлов. Вложения пересылаются ботом прямо в Telegram-чат заявок
// (sendDocument), чтобы их не приходилось выкачивать и копировать руками.
//
// Инварианты, которые легко разъезжаются:
//   - лимиты и список расширений на фронте (Home.tsx) и бэке (telegram-notify.php)
//     должны совпадать, иначе форма принимает то, что сервер отвергает;
//   - фронт обязан слать FormData (не JSON), иначе $_FILES пуст;
//   - e2e: multipart с файлом доходит до sendMessage + sendDocument мока.
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { spawn, spawnSync } from 'node:child_process'
import { mkdtempSync, readFileSync, writeFileSync, cpSync, rmSync, existsSync, mkdirSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import net from 'node:net'

// fileURLToPath, а не url.pathname: pathname на Windows даёт «/C:/…» и ломает join.
const root = fileURLToPath(new URL('..', import.meta.url))
const read = (p) => readFileSync(join(root, p), 'utf8')

const homeTsx = read('src/pages/Home.tsx')
const notifyPhp = read('public/telegram-notify.php')
const sharedPhp = read('public/intake-shared.php')

const hasPhp = spawnSync('php', ['--version'], { stdio: 'ignore' }).error === undefined

// ── 1. Фронт: чат-форма с вложениями ─────────────────────────────────────
test('Home.tsx: скрытый file input (multiple) и кнопка «Прикрепить файлы»', () => {
  assert.ok(homeTsx.includes('type="file"'), 'нет file input')
  assert.ok(homeTsx.includes('multiple'), 'input должен принимать несколько файлов')
  assert.ok(homeTsx.includes('Прикрепить файлы'), 'нет кнопки прикрепления')
  assert.ok(homeTsx.includes('Paperclip'), 'нет иконки скрепки')
})

test('Home.tsx: заявка уходит как FormData c files[], без JSON-заголовка', () => {
  assert.ok(homeTsx.includes(`data.append('files[]', f, f.name)`), 'файлы не кладутся в FormData')
  assert.ok(homeTsx.includes('new FormData()'), 'нет FormData')
  const submitChunk = homeTsx.slice(homeTsx.indexOf('async function handleSubmit'), homeTsx.indexOf('async function handleSubmit') + 2000)
  assert.ok(!submitChunk.includes(`'Content-Type': 'application/json'`), 'JSON-заголовок ломает multipart')
})

test('лимиты фронта совпадают с дефолтами бэка (10 файлов, 10 МБ, расширения)', () => {
  assert.ok(homeTsx.includes('ATTACH_MAX_FILES = 10'))
  assert.ok(homeTsx.includes('ATTACH_MAX_BYTES = 10 * 1024 * 1024'))
  assert.ok(notifyPhp.includes(`intake_config('INTAKE_UPLOAD_MAX_FILES', '10')`))
  assert.ok(notifyPhp.includes(`(string) (10 * 1024 * 1024)`))

  const front = homeTsx.match(/ATTACH_ACCEPT = '([^']+)'/)[1]
    .split(',').map((s) => s.trim().replace(/^\./, '')).sort()
  const back = notifyPhp.match(/'NOTIFY_ALLOWED_EXT', '([^']+)'/)[1]
    .split(',').map((s) => s.trim()).sort()
  assert.deepEqual(front, back, 'списки расширений фронта и бэка разъехались')
})

// ── 2. Бэк: приём файлов и sendDocument ──────────────────────────────────
test('telegram-notify.php подключает intake-shared и шлёт sendDocument', () => {
  assert.ok(notifyPhp.includes(`require_once __DIR__ . '/intake-shared.php'`))
  assert.ok(notifyPhp.includes(`$_FILES['files']`), 'файлы не читаются из $_FILES')
  assert.ok(notifyPhp.includes('intake_telegram_send_document('), 'нет пересылки документов')
  assert.ok(sharedPhp.includes('function intake_telegram_send_document('), 'нет хелпера в intake-shared')
  assert.ok(sharedPhp.includes('/sendDocument'), 'хелпер должен звать Bot API sendDocument')
})

// ── 3. PHP-синтаксис и e2e (пропускаются без php в PATH — Windows) ───────
test('php -l: intake-shared.php и telegram-notify.php без синтаксических ошибок', { skip: !hasPhp && 'php не найден в PATH' }, () => {
  for (const f of ['public/intake-shared.php', 'public/telegram-notify.php', 'tests/fixtures/intake-mock-api.php']) {
    const out = spawnSync('php', ['-l', join(root, f)], { encoding: 'utf8' })
    assert.equal(out.status, 0, out.stdout + out.stderr)
  }
})

function getFreePort() {
  return new Promise((resolve, reject) => {
    const srv = net.createServer()
    srv.listen(0, '127.0.0.1', () => {
      const port = srv.address().port
      srv.close(() => resolve(port))
    })
    srv.on('error', reject)
  })
}

function waitForPort(port, tries = 50) {
  return new Promise((resolve, reject) => {
    const attempt = (left) => {
      const sock = net.connect(port, '127.0.0.1')
      sock.on('connect', () => { sock.destroy(); resolve() })
      sock.on('error', () => {
        sock.destroy()
        if (left <= 0) return reject(new Error(`port ${port} never opened`))
        setTimeout(() => attempt(left - 1), 100)
      })
    }
    attempt(tries)
  })
}

test('e2e: multipart-заявка с файлом → sendMessage + sendDocument', { skip: !hasPhp && 'php не найден в PATH' }, async () => {
  const mockPort = await getFreePort()
  const appPort = await getFreePort()
  const workdir = mkdtempSync(join(tmpdir(), 'issue-399-e2e-'))
  const mockLog = join(workdir, 'mock.log')

  // telegram-notify.php требует telegram-config.php рядом; public/ репозитория
  // его не содержит (git-ignored) — собираем песочный вебрут с копиями.
  const webroot = join(workdir, 'public')
  mkdirSync(webroot, { recursive: true })
  for (const f of ['telegram-notify.php', 'intake-shared.php']) {
    cpSync(join(root, 'public', f), join(webroot, f))
  }
  writeFileSync(join(webroot, 'telegram-config.php'), `<?php
define('TELEGRAM_BOT_TOKEN', 'bot:test');
define('TELEGRAM_CHAT_ID', '123');
define('TELEGRAM_API_BASE', 'http://127.0.0.1:${mockPort}');
`)

  const mockProc = spawn('php', ['-S', `127.0.0.1:${mockPort}`, join(root, 'tests/fixtures/intake-mock-api.php')], {
    env: { ...process.env, MOCK_LOG: mockLog },
    stdio: 'ignore',
  })
  const appProc = spawn('php', ['-S', `127.0.0.1:${appPort}`, '-t', webroot], { stdio: 'ignore' })

  try {
    await waitForPort(mockPort)
    await waitForPort(appPort)

    const form = new FormData()
    form.set('name', 'Иван')
    form.set('contact', '@ivan')
    form.set('task', 'Перенести учёт из Excel')
    form.append('files[]', new Blob(['a;b\n1;2\n'], { type: 'text/csv' }), 'заказы.csv')
    form.append('files[]', new Blob(['x'.repeat(64)], { type: 'text/plain' }), 'notes.txt')

    const res = await fetch(`http://127.0.0.1:${appPort}/telegram-notify.php`, {
      method: 'POST',
      body: form,
      headers: { Referer: `http://127.0.0.1:${appPort}/` },
    })
    const json = await res.json()
    assert.equal(res.status, 200, JSON.stringify(json))
    assert.equal(json.ok, true, JSON.stringify(json))
    assert.equal(json.files_sent, 2, JSON.stringify(json))

    const log = existsSync(mockLog)
      ? readFileSync(mockLog, 'utf8').trim().split('\n').filter(Boolean).map((l) => JSON.parse(l))
      : []
    assert.ok(log.some((e) => e.path.includes('/sendMessage')), 'нет sendMessage')
    const docs = log.filter((e) => e.path.includes('/sendDocument') && e.document)
    assert.deepEqual(docs.map((d) => d.document).sort(), ['notes.txt', 'заказы.csv'].sort())
    assert.ok(docs.every((d) => d.caption.includes('@ivan')), 'в подписи файла нет контакта')

    // Запрещённое расширение отбивается с 400 до любых отправок.
    const bad = new FormData()
    bad.set('contact', '@ivan')
    bad.set('task', 'x')
    bad.append('files[]', new Blob(['MZ']), 'virus.exe')
    const badRes = await fetch(`http://127.0.0.1:${appPort}/telegram-notify.php`, {
      method: 'POST',
      body: bad,
      headers: { Referer: `http://127.0.0.1:${appPort}/` },
    })
    assert.equal(badRes.status, 400)
    const badJson = await badRes.json()
    assert.equal(badJson.ok, false)
  } finally {
    mockProc.kill()
    appProc.kill()
    rmSync(workdir, { recursive: true, force: true })
  }
})
