// Письма участникам эфира: подтверждение после регистрации и напоминания (cron).
// Без сети и реальной почты: сценарии в tests/fixtures/efir-mail-run.php идут через
// подменённый mailer, e2e-часть — через INTAKE_MAIL_TRANSPORT=file.
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { spawn, spawnSync } from 'node:child_process'
import { mkdtempSync, readFileSync, writeFileSync, cpSync, rmSync, mkdirSync, existsSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import net from 'node:net'

const root = fileURLToPath(new URL('..', import.meta.url))
const read = (p) => readFileSync(join(root, p), 'utf8')
const hasPhp = spawnSync('php', ['--version'], { stdio: 'ignore' }).error === undefined
const skip = !hasPhp && 'php не найден в PATH'

const MEET = 'https://telemost.yandex.ru/j/81637970749787'

test('efir.html: дата и время на странице совпадают с письмами и .ics, есть ссылка на календарь', () => {
  const page = read('public/ai-transform/efir.html')
  assert.ok(page.includes('Четверг, 3 декабря 2026'))
  assert.ok(page.includes('11:00–12:15 (МСК)'))
  assert.ok(page.includes('href="efir-2026-12-03.ics"'), 'нет ссылки на .ics')
  assert.ok(page.includes('Добавить в календарь'))
})

test('telegram-notify.php: подтверждение — в shutdown после ответа, не ломает регистрацию', () => {
  const src = read('public/telegram-notify.php')
  assert.ok(src.includes("require_once __DIR__ . '/efir-mail.php'"))
  const shutdown = src.slice(src.indexOf('register_shutdown_function'))
  assert.ok(shutdown.indexOf('fastcgi_finish_request') < shutdown.indexOf('efir_send_confirmation('), 'письмо до ответа посетителю')
  assert.ok(shutdown.indexOf('efir_send_confirmation(') < shutdown.indexOf('courses_register_safe('), 'письмо после courses: сеть задержит его')
  assert.ok(src.indexOf('intake_registration_append(') < src.indexOf('efir_send_confirmation('), 'письмо раньше записи в список')
})

test('efir-mail.php: свой отправитель не пишется, mail() не вызывается напрямую', () => {
  const src = read('public/efir-mail.php') + read('public/efir-reminders.php')
  assert.ok(src.includes('intake_mail_send('))
  assert.ok(!/\bmail\s*\(/.test(src.replace(/intake_mail_send\(/g, '')), 'прямой вызов mail()')
  assert.ok(!src.includes('mb_send_mail'))
})

test('php -l: efir-mail.php, efir-reminders.php', { skip }, () => {
  for (const f of ['public/efir-mail.php', 'public/efir-reminders.php', 'tests/fixtures/efir-mail-run.php']) {
    const out = spawnSync('php', ['-l', join(root, f)], { encoding: 'utf8' })
    assert.equal(out.status, 0, out.stdout + out.stderr)
  }
})

function run() {
  const r = spawnSync('php', [join(root, 'tests/fixtures/efir-mail-run.php')], { encoding: 'utf8' })
  assert.equal(r.status, 0, r.stderr)
  return JSON.parse(r.stdout)
}

test('подтверждение: текст, тема, не чаще раза в 10 минут, возврат слота после сбоя', { skip }, () => {
  const o = run()
  assert.equal(o.c1, 'sent')
  assert.equal(o.c2, 'throttled', 'второй запрос в пределах 10 минут')
  assert.equal(o.c2n, 0)
  assert.equal(o.c3, 'sent', 'через 10 минут повтор разрешён (почта без учёта регистра)')
  assert.equal(o.c4, 'failed')
  assert.equal(o.c5, 'sent', 'после сбоя отправки слот не должен залипать')
  assert.equal(o.c6, 'invalid')
  const m = o.c1mail[0]
  assert.equal(m.to, 'Anna@Example.ru')
  assert.equal(m.params, '-fwelcome@ideav.ru', 'конверт — домен с SPF/DKIM')
  assert.ok(m.headers.includes('Reply-To: care@integram.io'))
  assert.ok(m.subject.startsWith('=?UTF-8?B?'), 'тема MIME-кодирована')
  const c = o.kinds.confirm
  assert.ok(c.subject.includes('3 декабря') && c.subject.includes('11:00 МСК'))
  for (const part of ['Здравствуйте, Анна!', 'четверг, 3 декабря 2026, 11:00–12:15 (МСК)', MEET,
    'efir-2026-12-03.ics', 'ответьте', 'Что взять с собой']) {
    assert.ok(c.body.includes(part), `нет «${part}» в подтверждении`)
  }
  for (const k of Object.values(o.kinds)) assert.ok(k.maxline < 900, 'строка длиннее лимита exim (байты)')
  assert.ok(o.kinds.remind24.subject.startsWith('Завтра эфир'))
  assert.ok(o.kinds.remind1h.subject.startsWith('Через час эфир'))
  assert.ok(o.kinds.remind24.body.includes(MEET) && o.kinds.remind1h.body.includes(MEET))
})

test('обращение по имени: первое слово; странное и инъекции — безымянное', { skip }, () => {
  const o = run()
  assert.deepEqual(o.greet, ['Здравствуйте, Анна!', 'Здравствуйте!', 'Здравствуйте!', 'Здравствуйте, Иван!'])
})

test('напоминания: окна, один раз на почту, dry-run, отказавшиеся, без Bcc', { skip }, () => {
  const o = run()
  assert.equal(o.r_early.kind, null, 'раньше чем за 24 ч — рано')
  assert.equal(o.r_dry.sent, 2)
  assert.equal(o.r_dry_state, false, 'dry-run не пишет учёт')
  assert.equal(o.r24.kind, 'remind24')
  assert.deepEqual(o.r24_to.map((x) => x.toLowerCase()), ['a@example.ru', 'b@example.ru'], 'дубль, отказавшийся и не-почта пропущены')
  assert.ok(!o.r24_headers.includes('Bcc:'), 'напоминания без Bcc')
  assert.equal(o.r24_again.sent, 0, 'повторный запуск не шлёт дважды')
  assert.equal(o.r24_again_n, 0)
  assert.equal(o.r_gap.kind, null, 'между окнами тишина')
  assert.equal(o.r1h.kind, 'remind1h')
  assert.equal(o.r1h.sent, 2, 'за час — отдельный учёт от «за сутки»')
  assert.equal(o.r1h_again.sent, 0)
  assert.equal(o.after.kind, null, 'после начала напоминаний нет')
})

test('напоминания: поздний регистрант и сбой отправки', { skip }, () => {
  const o = run()
  assert.equal(o.late_24, 'remind24')
  assert.equal(o.late_gap.sent, 0)
  assert.equal(o.late_gap.pending, 1, 'сразу после подтверждения напоминание ждёт')
  assert.equal(o.late_ok.sent, 1)
  assert.equal(o.f1.failed, 1)
  assert.equal(o.f2.sent, 1, 'неудача не помечена отправленной — повтор на следующем запуске')
})

test('.ics: статический файл = вывод генератора; поля и переносы', { skip }, () => {
  const o = run()
  const file = readFileSync(join(root, 'public/ai-transform/efir-2026-12-03.ics'), 'utf8')
  assert.equal(file, o.ics, 'файл разошёлся с генератором: php public/efir-reminders.php --ics')
  assert.ok(file.includes('\r\n') && !/[^\r]\n/.test(file), 'переводы строк — CRLF')
  for (const part of ['BEGIN:VEVENT', 'UID:efir-20261203@ideav.ru', 'DTSTART:20261203T080000Z', 'DTEND:20261203T091500Z',
    `LOCATION:${MEET}`, `URL:${MEET}`, 'END:VCALENDAR']) {
    assert.ok(file.includes(part), `нет ${part}`)
  }
  assert.ok(o.ics_maxline <= 75, 'строка iCalendar длиннее 75 октетов')
  assert.ok(!file.includes('�'))
})

test('следующий эфир настраивается конфигом (EFIR_*)', { skip }, () => {
  const ov = run().override
  assert.equal(ov.when, 'четверг, 14 января 2027, 15:30–16:30 (МСК)')
  assert.ok(ov.ics.includes('DTSTART:20270114T123000Z') && ov.ics.includes('DTEND:20270114T133000Z'))
  assert.ok(ov.ics.includes('LOCATION:https://telemost.yandex.ru/j/other'))
  assert.equal(ov.uid, 'efir-20270114@ideav.ru')
  assert.equal(ov.ics_url, 'https://ideav.ru/ai-transform/efir-2027-01-14.ics')
})

function getFreePort() {
  return new Promise((resolve, reject) => {
    const srv = net.createServer()
    srv.listen(0, '127.0.0.1', () => { const p = srv.address().port; srv.close(() => resolve(p)) })
    srv.on('error', reject)
  })
}
function waitForPort(port, tries = 50) {
  return new Promise((resolve, reject) => {
    const attempt = (left) => {
      const s = net.connect(port, '127.0.0.1')
      s.on('connect', () => { s.destroy(); resolve() })
      s.on('error', () => { s.destroy(); left <= 0 ? reject(new Error('port')) : setTimeout(() => attempt(left - 1), 100) })
    }
    attempt(tries)
  })
}

test('e2e: регистрация → одно письмо с Bcc; повтор подряд не шлёт; CLI-скрипт из веба — 404', { skip }, async () => {
  const mockPort = await getFreePort()
  const appPort = await getFreePort()
  const workdir = mkdtempSync(join(tmpdir(), 'efir-mail-e2e-'))
  const webroot = join(workdir, 'public')
  const mailFile = join(workdir, 'mail.jsonl')
  mkdirSync(webroot, { recursive: true })
  for (const f of ['telegram-notify.php', 'intake-shared.php', 'intake-mail.php', 'courses-register.php',
    'efir-mail.php', 'efir-reminders.php']) {
    cpSync(join(root, 'public', f), join(webroot, f))
  }
  writeFileSync(join(webroot, 'telegram-config.php'), `<?php
define('TELEGRAM_BOT_TOKEN', 'bot:test');
define('TELEGRAM_CHAT_ID', '123');
define('TELEGRAM_API_BASE', 'http://127.0.0.1:${mockPort}');
`)
  const env = { ...process.env, INTAKE_MAIL_TRANSPORT: 'file', INTAKE_MAIL_FILE: mailFile, INTAKE_MAIL_BCC: 'copy@example.ru' }
  const mock = spawn('php', ['-S', `127.0.0.1:${mockPort}`, join(root, 'tests/fixtures/intake-mock-api.php')],
    { env: { ...process.env, MOCK_LOG: join(workdir, 'mock.log') }, stdio: 'ignore' })
  const app = spawn('php', ['-S', `127.0.0.1:${appPort}`, '-t', webroot], { env, stdio: 'ignore' })
  const post = (body) => fetch(`http://127.0.0.1:${appPort}/telegram-notify.php`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Referer: `http://127.0.0.1:${appPort}/ai-transform/efir.html` },
    body: JSON.stringify({ source: 'efir', ...body }),
  })
  try {
    await waitForPort(mockPort)
    await waitForPort(appPort)
    const a = { name: 'Анна Иванова', contact: 'anna@example.ru', role: 'Директор' }
    assert.equal((await post(a)).status, 200)
    assert.equal((await post(a)).status, 200) // повтор сразу
    assert.equal((await post({ source: 'quiz', contact: 'q@example.ru', task: 'x' })).status, 200)
    for (let i = 0; i < 30 && !existsSync(mailFile); i++) await new Promise((r) => setTimeout(r, 100))
    await new Promise((r) => setTimeout(r, 300))
    const mails = readFileSync(mailFile, 'utf8').trim().split('\n').map((l) => JSON.parse(l))
    assert.equal(mails.length, 1, 'ожидалось одно письмо (повтор в пределах 10 минут и чужой источник — без письма)')
    assert.equal(mails[0].to, 'anna@example.ru')
    assert.ok(mails[0].headers.includes('Bcc: copy@example.ru'), 'нет копии Bcc')
    assert.ok(mails[0].body.includes('Здравствуйте, Анна!') && mails[0].body.includes(MEET))
    assert.ok(existsSync(join(workdir, 'registrations', 'efir.sent.json')))
    const res = await fetch(`http://127.0.0.1:${appPort}/efir-reminders.php`)
    assert.equal(res.status, 404)
    // CLI: вне окон напоминаний — тихо, код 0; --dry-run ничего не пишет.
    const cli = spawnSync('php', [join(webroot, 'efir-reminders.php'), '--dry-run'], { encoding: 'utf8', env })
    assert.equal(cli.status, 0, cli.stderr)
  } finally {
    mock.kill()
    app.kill()
    rmSync(workdir, { recursive: true, force: true })
  }
})
