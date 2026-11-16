// Регистрация на эфир (public/ai-transform/efir.html):
//   - поля уходят по отдельности, а не склейкой в task;
//   - капча сбрасывается после неудачной отправки (токен одноразовый);
//   - telegram-notify.php пишет регистрацию в список участников (<dir>/efir.jsonl)
//     и шлёт телефон/должность/отрасль своими строками;
//   - registrations-export.php (CLI) выгружает CSV: одна строка на почту,
//     формулы погашены, телефоны «+7» целы.
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { spawn, spawnSync } from 'node:child_process'
import { mkdtempSync, readFileSync, writeFileSync, cpSync, rmSync, mkdirSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import net from 'node:net'

const root = fileURLToPath(new URL('..', import.meta.url))
const read = (p) => readFileSync(join(root, p), 'utf8')
const page = read('public/ai-transform/efir.html')
const hasPhp = spawnSync('php', ['--version'], { stdio: 'ignore' }).error === undefined

test('efir.html: поля по отдельности, сброс капчи, проверка почты', () => {
  for (const f of ['phone:', 'role:', 'industry:', "source: 'efir'"]) {
    assert.ok(page.includes(f), `нет ${f} в payload`)
  }
  assert.ok(!page.includes('task: details'), 'поля снова склеены в task')
  assert.ok(page.includes('smartCaptcha.reset(widgetId)'), 'нет сброса капчи после ошибки')
  assert.ok(page.includes('e.serverText'), 'текст ошибки сервера не показывается')
})

test('php -l: новые и изменённые PHP-файлы', { skip: !hasPhp && 'php не найден в PATH' }, () => {
  for (const f of ['public/intake-shared.php', 'public/courses-register.php', 'public/telegram-notify.php', 'public/registrations-export.php']) {
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

test('e2e: регистрация → список участников → CSV', { skip: !hasPhp && 'php не найден в PATH' }, async () => {
  const mockPort = await getFreePort()
  const appPort = await getFreePort()
  const workdir = mkdtempSync(join(tmpdir(), 'efir-e2e-'))
  const mockLog = join(workdir, 'mock.log')
  const webroot = join(workdir, 'public')
  mkdirSync(webroot, { recursive: true })
  for (const f of ['telegram-notify.php', 'intake-shared.php', 'courses-register.php', 'registrations-export.php']) {
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
  const post = (body) => fetch(`http://127.0.0.1:${appPort}/telegram-notify.php`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Referer: `http://127.0.0.1:${appPort}/ai-transform/efir.html` },
    body: JSON.stringify({ source: 'efir', ...body }),
  })
  try {
    await waitForPort(mockPort)
    await waitForPort(appPort)
    const a = { name: 'Анна', contact: 'anna@example.ru', phone: '+7 900 000-00-00', company: 'Завод', role: 'ИТ-директор', industry: 'Логистика' }
    for (const body of [a, { ...a, contact: 'ANNA@example.ru', role: 'Директор' }, { name: '=HYPERLINK("x")', contact: 'b@example.ru' }]) {
      const res = await post(body)
      assert.equal(res.status, 200, JSON.stringify(await res.json()))
    }
    // Не-регистрация в список не пишется.
    assert.equal((await post({ source: 'quiz', contact: 'q@example.ru', task: 'x' })).status, 200)

    const lines = readFileSync(join(workdir, 'registrations', 'efir.jsonl'), 'utf8').trim().split('\n')
    assert.equal(lines.length, 3)
    assert.equal(JSON.parse(lines[0]).industry, 'Логистика')

    const msgs = readFileSync(mockLog, 'utf8').trim().split('\n').map((l) => JSON.parse(l))
      .filter((e) => e.path.includes('/sendMessage')).map((e) => JSON.parse(e.body).text)
    assert.ok(msgs[0].includes('Телефон:') && msgs[0].includes('Отрасль:'), msgs[0])
    assert.ok(!msgs[0].includes('Задача'), 'поля регистрации ушли под «Задачей»')

    const out = spawnSync('php', [join(webroot, 'registrations-export.php'), 'efir'], { encoding: 'utf8' })
    assert.equal(out.status, 0, out.stderr)
    assert.ok(out.stdout.startsWith('﻿'), 'нет BOM для Excel')
    const rows = out.stdout.slice(1).trim().split('\n')
    assert.equal(rows.length, 3, out.stdout) // заголовок + 2 почты
    assert.ok(rows[1].includes('Директор') && !rows[1].includes('ИТ-директор'), 'повтор не обновил поля')
    assert.ok(rows[1].includes('+7 900 000-00-00') && !rows[1].includes("'+7"), 'телефон испорчен')
    assert.ok(rows[2].includes(`"'=HYPERLINK`), 'формула не погашена: ' + rows[2])
  } finally {
    mockProc.kill()
    appProc.kill()
    rmSync(workdir, { recursive: true, force: true })
  }
})
