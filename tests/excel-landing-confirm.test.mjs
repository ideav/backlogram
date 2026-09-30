/**
 * Тот же замкнутый контур (issue #624) на лендинге excel-to-app.ru, где приём
 * заявок свой — order.php со спулом в Telegram, без GitHub и капчи.
 *
 * Проверяем главное: до перехода по ссылке из письма оператор заявку не видит
 * и сборка не начинается, а после — заявка уходит тем же путём, что и раньше,
 * и сборщик может отчитаться письмом клиенту.
 *
 * Отдельно проверяем две вещи, в которых легко промахнуться именно на двух
 * доменах: сгенерированные копии общей библиотеки не разошлись с источником, и
 * каталоги очередей двух сайтов по умолчанию РАЗНЫЕ (сайты стоят на одном
 * сервере, и общая очередь означала бы, что мост одного забирает заявки
 * другого).
 */

import assert from 'node:assert/strict'
import { test } from 'node:test'
import { execFileSync, spawn } from 'node:child_process'
import { readFileSync, existsSync, mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import net from 'node:net'

import { SHARED_FILES, render } from '../scripts/sync-excel-intake.mjs'

// fileURLToPath, а не URL.pathname: на Windows pathname отдаёт «/C:/…».
const root = fileURLToPath(new URL('..', import.meta.url))
const landingDir = join(root, 'site-excel/public')
const phpFiles = [
  'order.php',
  'order-intake.php',
  'order-confirm.php',
  'order-build.php',
  'order-deliver.php',
  ...SHARED_FILES,
].map(f => join(landingDir, f))

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

function readJsonLines(file) {
  if (!existsSync(file)) return []
  return readFileSync(file, 'utf8').trim().split('\n').filter(Boolean).map(l => JSON.parse(l))
}

/** Декодировать MIME-тему письма (=?UTF-8?B?…?=), включая складку. */
function decodeSubject(subject) {
  return subject
    .split(/\r\n /)
    .map(word => {
      const m = /^=\?UTF-8\?B\?(.*)\?=$/i.exec(word)
      return m ? Buffer.from(m[1], 'base64').toString('utf8') : word
    })
    .join('')
}

/**
 * Стенд лендинга: мок Telegram + встроенный сервер над site-excel/public.
 *
 * Каталог временных файлов подменяется на свой: order.php считает заявки с
 * одного IP через sys_get_temp_dir(), и без подмены тесты мешали бы друг другу
 * (все запросы идут с 127.0.0.1).
 */
async function startStand(extraEnv = {}) {
  const mockPort = await getFreePort()
  const appPort = await getFreePort()
  const workdir = mkdtempSync(join(tmpdir(), 'excel-landing-confirm-'))
  const mockLog = join(workdir, 'mock.log')
  const mailLog = join(workdir, 'mail.log')
  const queueDir = join(workdir, 'queue')

  const mockProc = spawn('php', ['-S', `127.0.0.1:${mockPort}`, join(root, 'tests/fixtures/intake-mock-api.php')], {
    env: { ...process.env, MOCK_LOG: mockLog },
    stdio: 'ignore',
  })

  const env = {
    ...process.env,
    TMPDIR: workdir,
    TMP: workdir,
    TEMP: workdir,
    TELEGRAM_BOT_TOKEN: 'bot:test',
    TELEGRAM_CHAT_ID: '123',
    TELEGRAM_API_BASE: `http://127.0.0.1:${mockPort}`,
    ORDER_SPOOL_DIR: join(workdir, 'spool'),
    ORDER_QUEUE_DIR: queueDir,
    ORDER_CONFIRM_URL: `http://127.0.0.1:${appPort}/order-confirm.php`,
    ORDER_BUILD_TOKEN: 'build-secret',
    ORDER_EMAIL_TO: '', // почтовый дубль оператору в тестах не нужен
    INTAKE_MAIL_TRANSPORT: 'file',
    INTAKE_MAIL_FILE: mailLog,
    ...extraEnv,
  }

  const appProc = spawn('php', ['-S', `127.0.0.1:${appPort}`, '-t', landingDir], { env, stdio: 'ignore' })

  await waitForPort(mockPort)
  await waitForPort(appPort)

  return {
    appPort,
    mockLog,
    mailLog,
    queueDir,
    env,
    mail: () => readJsonLines(mailLog),
    calls: () => readJsonLines(mockLog),
    stop() {
      mockProc.kill()
      appProc.kill()
      rmSync(workdir, { recursive: true, force: true })
    },
  }
}

/** Отправить заявку с формы лендинга (order.php требует свой Referer). */
async function submitOrder(appPort, fields, files = [['orders.csv', 'col1;col2\n1;2\n']]) {
  const form = new FormData()
  form.set('consent', 'on')
  for (const [k, v] of Object.entries(fields)) form.set(k, v)
  for (const [name, content] of files) {
    form.append('files[]', new Blob([content], { type: 'text/csv' }), name)
  }
  const res = await fetch(`http://127.0.0.1:${appPort}/order.php`, {
    method: 'POST',
    body: form,
    headers: { Referer: `http://127.0.0.1:${appPort}/` },
  })
  return { res, json: await res.json().catch(() => ({})) }
}

function buildCall(appPort, payload, token = 'build-secret') {
  const headers = { 'Content-Type': 'application/json' }
  if (token !== null) headers.Authorization = `Bearer ${token}`
  return fetch(`http://127.0.0.1:${appPort}/order-build.php`, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  })
}

function confirmUrlFromMail(mail) {
  const url = /(http:\/\/\S+order-confirm\.php\?token=[^\s]+)/.exec(mail.body)?.[1]
  assert.ok(url, `ссылка подтверждения не найдена в письме: ${mail.body}`)
  return url
}

test('php -l reports no syntax errors in the landing confirmation files', () => {
  for (const file of phpFiles) {
    const out = execFileSync('php', ['-l', file], { encoding: 'utf8' })
    assert.match(out, /No syntax errors detected/, `${file} should lint clean`)
  }
})

test('сгенерированные копии общей библиотеки не разошлись с источником', () => {
  for (const name of SHARED_FILES) {
    const source = readFileSync(join(root, 'public', name), 'utf8')
    const copy = readFileSync(join(landingDir, name), 'utf8')
    assert.equal(
      copy,
      render(source, name),
      `site-excel/public/${name} отстал от public/${name} — выполните: node scripts/sync-excel-intake.mjs`,
    )
  }
})

test('очереди двух сайтов по умолчанию не совпадают', () => {
  // Оба сайта стоят на одном сервере, у их вебрутов общий родитель. Общий
  // каталог очереди означал бы, что мост одного сайта забирает заявки другого.
  const script = `
    $_SERVER['DOCUMENT_ROOT'] = '/var/www/site/data/www/excel-to-app.ru';
    require '${join(landingDir, 'order-intake.php').replace(/\\/g, '/')}';
    echo order_queue_dir(), "\\n", intake_queue_dir(), "\\n";
  `
  const out = execFileSync('php', ['-r', script], { encoding: 'utf8', env: { ...process.env, ORDER_QUEUE_DIR: '', INTAKE_QUEUE_DIR: '' } })
  const [landingQueue, siteQueue] = out.trim().split('\n')
  assert.ok(landingQueue, out)
  assert.notEqual(landingQueue, siteQueue, 'каталоги очередей лендинга и ideav.ru обязаны различаться')
})

test('e2e: заявка на демонстрацию с email ждёт подтверждения и не идёт оператору', async () => {
  const stand = await startStand()
  try {
    const { res, json } = await submitOrder(stand.appPort, {
      kind: 'demo',
      name: 'Иван',
      contact: 'ivan@example.com',
      task: 'Учёт заказов из трёх Excel-файлов',
    })

    assert.equal(res.status, 200, JSON.stringify(json))
    assert.equal(json.ok, true, JSON.stringify(json))
    assert.equal(json.status, 'pending_confirmation', 'заявка должна ждать подтверждения адреса')
    assert.ok(json.request_id, 'ответ должен нести идентификатор заявки')
    assert.match(json.message, /ivan@example\.com/, 'человеку нужно сказать, куда ушло письмо')

    // Главное: оператор о заявке пока не знает, файлы ему не ушли.
    assert.deepEqual(stand.calls(), [], 'до подтверждения в Telegram ничего не уходит')

    const mail = stand.mail()
    assert.equal(mail.length, 1, 'должно уйти ровно одно письмо-подтверждение')
    assert.equal(mail[0].to, 'ivan@example.com')
    assert.match(decodeSubject(mail[0].subject), /Подтвердите заявку/)
    // Отправитель — ideav.ru: у excel-to-app.ru нет ни SPF, ни DMARC, и письмо
    // от его имени с большой вероятностью не дойдёт.
    assert.match(mail[0].headers, /From: .*<welcome@ideav\.ru>/)
    assert.match(mail[0].body, /order-confirm\.php\?token=/)
    assert.match(mail[0].body, /24 ч/, 'в письме должен быть назван срок жизни ссылки')
    assert.match(mail[0].body, /Файлов приложено: 1/, 'человеку видно, что файл дошёл')
  } finally {
    stand.stop()
  }
})

test('e2e: переход по ссылке отправляет заявку оператору, повторный — нет', async () => {
  const stand = await startStand()
  try {
    const { json } = await submitOrder(stand.appPort, {
      kind: 'demo',
      contact: 'ivan@example.com',
      task: 'Учёт заказов',
    })
    assert.equal(json.status, 'pending_confirmation')

    const url = confirmUrlFromMail(stand.mail()[0])
    const page = await fetch(url)
    const html = await page.text()
    assert.equal(page.status, 200)
    assert.match(page.headers.get('content-type') ?? '', /text\/html/)
    assert.match(page.headers.get('x-robots-tag') ?? '', /noindex/, 'персональную ссылку нельзя индексировать')
    assert.match(html, /подтверждена/i)
    assert.match(html, /excel-to-app\.ru/, 'страница должна быть подписана тем сайтом, где заполняли форму')

    // Теперь — и только теперь — заявка у оператора, вместе с файлом.
    const calls = stand.calls()
    const message = calls.find(c => c.path.includes('/sendMessage'))
    // Мок пишет sendDocument двумя записями: общей и с разобранным multipart.
    const document = calls.find(c => c.path.includes('/sendDocument') && c.document)
    assert.ok(message, 'оператор должен получить заявку после подтверждения')
    assert.ok(document, `файл заявки должен уйти оператору, а вызовы были: ${JSON.stringify(calls)}`)
    assert.equal(document.document, 'orders.csv', 'файл должен дойти под своим именем')

    // Двойной клик и префетч почтовика не должны дублировать заявку.
    const again = await fetch(url)
    assert.equal(again.status, 200)
    assert.match(await again.text(), /уже подтверждена/i)
    assert.equal(
      stand.calls().filter(c => c.path.includes('/sendMessage')).length,
      1,
      'повторный переход по ссылке не отправляет заявку второй раз',
    )
  } finally {
    stand.stop()
  }
})

test('e2e: подтверждённая заявка доходит до сборщика и до письма с результатом', async () => {
  const stand = await startStand()
  try {
    const { json } = await submitOrder(stand.appPort, {
      kind: 'demo',
      contact: 'ivan@example.com',
      task: 'интернет-магазин чая',
    })
    const requestId = json.request_id
    await fetch(confirmUrlFromMail(stand.mail()[0]))

    const claim = await buildCall(stand.appPort, { action: 'claim', limit: 5 })
    const claimJson = await claim.json()
    assert.equal(claim.status, 200, JSON.stringify(claimJson))
    assert.equal(claimJson.count, 1, 'сборщику должна достаться одна заявка')
    assert.equal(claimJson.jobs[0].id, requestId)
    assert.equal(claimJson.jobs[0].contact, 'ivan@example.com')
    assert.match(claimJson.jobs[0].body, /интернет-магазин чая/, 'сборщик должен видеть текст заявки')
    assert.equal(claimJson.jobs[0].files[0].name, 'orders.csv', 'сборщику видно, какие файлы искать')

    const claim2 = await (await buildCall(stand.appPort, { action: 'claim' })).json()
    assert.equal(claim2.count, 0, 'взятая в работу заявка не выдаётся снова')

    const deliver = await buildCall(stand.appPort, {
      action: 'deliver',
      request_id: requestId,
      app_url: 'https://ideav.ru/nteaclub/',
      admin_login: 'nteaclub',
      admin_password: 'NteaAdmin2026',
      topic_short: 'интернет-магазина',
      what_inside: '— Каталог: 198 товаров.',
    })
    const deliverJson = await deliver.json()
    assert.equal(deliver.status, 200, JSON.stringify(deliverJson))
    assert.equal(deliverJson.status, 'delivered')

    const mail = stand.mail()
    assert.equal(mail.length, 2, 'должны уйти два письма: подтверждение и результат')
    assert.match(decodeSubject(mail[1].subject), /Ваше приложение для интернет-магазина готово/)
    assert.match(mail[1].body, /https:\/\/ideav\.ru\/nteaclub\//)
    assert.match(mail[1].body, /NteaAdmin2026/)

    const twice = await (await buildCall(stand.appPort, {
      action: 'deliver',
      request_id: requestId,
      app_url: 'https://ideav.ru/nteaclub/',
      admin_login: 'nteaclub',
      admin_password: 'NteaAdmin2026',
    })).json()
    assert.equal(twice.already, true, 'повторный deliver должен быть идемпотентным')
    assert.equal(stand.mail().length, 2, 'второго письма с результатом быть не должно')
  } finally {
    stand.stop()
  }
})

test('e2e: мост лендинга закрыт без токена и молчит без настройки', async () => {
  const stand = await startStand()
  try {
    assert.equal((await buildCall(stand.appPort, { action: 'claim' }, null)).status, 401)
    assert.equal((await buildCall(stand.appPort, { action: 'claim' }, 'nope')).status, 401)
    const get = await fetch(`http://127.0.0.1:${stand.appPort}/order-build.php`)
    assert.equal(get.status, 405, 'мост отвечает только на POST')
  } finally {
    stand.stop()
  }

  const closed = await startStand({ ORDER_BUILD_TOKEN: '' })
  try {
    assert.equal((await buildCall(closed.appPort, { action: 'claim' }, null)).status, 503)
  } finally {
    closed.stop()
  }
})

test('e2e: заявка на разбор и телеграм-контакт идут прежним путём', async () => {
  // За razbor нет автоматической сборки, а на @ivanov письмо отправить некуда:
  // подтверждение там только теряло бы лид.
  const stand = await startStand()
  try {
    const razbor = await submitOrder(stand.appPort, { kind: 'razbor', contact: 'buyer@example.com', task: 'Разбор заготовки' }, [])
    assert.equal(razbor.res.status, 200, JSON.stringify(razbor.json))
    assert.equal(razbor.json.status, undefined, 'заявке на разбор подтверждение не нужно')

    const telegram = await submitOrder(stand.appPort, { kind: 'demo', contact: '@ivanov', task: 'Учёт заказов' }, [])
    assert.equal(telegram.res.status, 200, JSON.stringify(telegram.json))
    assert.equal(telegram.json.status, undefined)

    assert.equal(stand.mail().length, 0, 'писем-подтверждений тут быть не должно')
    assert.equal(
      stand.calls().filter(c => c.path.includes('/sendMessage')).length,
      2,
      'обе заявки должны уйти оператору сразу',
    )
  } finally {
    stand.stop()
  }
})

test('e2e: письмо-подтверждение не ушло — заявку не теряем', async () => {
  // Транспорт file без пути к файлу = почта недоступна. Заявка уходит оператору
  // сразу, как до #624: человек ответит руками.
  const stand = await startStand({ INTAKE_MAIL_FILE: '' })
  try {
    const { res, json } = await submitOrder(stand.appPort, { kind: 'demo', contact: 'ivan@example.com', task: 'Учёт' })
    assert.equal(res.status, 200, JSON.stringify(json))
    assert.equal(json.status, undefined, 'при недоступной почте заявка идёт прежним путём')
    assert.ok(
      stand.calls().some(c => c.path.includes('/sendMessage')),
      'оператор должен получить заявку, которую нечем подтвердить',
    )
  } finally {
    stand.stop()
  }
})

test('e2e: просроченная заявка не подтверждается, и cron убирает её файлы', async () => {
  const stand = await startStand({ INTAKE_CONFIRM_TTL: '1' })
  try {
    const { json } = await submitOrder(stand.appPort, { kind: 'demo', contact: 'ghost@example.com', task: 'Учёт' })
    const url = confirmUrlFromMail(stand.mail()[0])
    assert.match(stand.mail()[0].body, /1 ч/, 'срок в письме считается из настройки')

    // TTL меряется в целых секундах: ждём с запасом больше двух, иначе на
    // границе секунды заявка ещё не просрочена и тест мигает.
    await new Promise(r => setTimeout(r, 2300))

    const late = await fetch(url)
    assert.equal(late.status, 410, 'просроченная ссылка должна честно говорить, что устарела')
    assert.match(await late.text(), /устарела/i)
    assert.deepEqual(stand.calls(), [], 'просроченная заявка оператору не уходит')

    const out = execFileSync('php', [join(landingDir, 'order-deliver.php')], { encoding: 'utf8', env: stand.env })
    assert.match(out, /expired=1/, `cron должен удалить просроченную заявку, вывод: ${out}`)
    assert.ok(!existsSync(join(stand.queueDir, json.request_id)), 'файлы неподтверждённой заявки должны быть удалены')
  } finally {
    stand.stop()
  }
})

test('e2e: лимит писем-подтверждений на один адрес', async () => {
  const stand = await startStand({ ORDER_CONFIRM_MAX_PER_EMAIL: '2' })
  try {
    const fields = { kind: 'demo', contact: 'spam@example.com', task: 'Учёт' }
    assert.equal((await submitOrder(stand.appPort, fields, [])).res.status, 200)
    assert.equal((await submitOrder(stand.appPort, fields, [])).res.status, 200)
    const third = await submitOrder(stand.appPort, fields, [])
    assert.equal(third.res.status, 429, 'третья заявка на тот же адрес за сутки отбивается')
    assert.match(third.json.error ?? '', /этот адрес/, 'отбой должен быть по адресу, а не по IP')
    assert.equal(stand.mail().length, 2, 'третьего письма на чужой адрес не уходит')
  } finally {
    stand.stop()
  }
})
