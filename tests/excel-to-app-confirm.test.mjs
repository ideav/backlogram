/**
 * Замкнутый контур заявки (issue #624):
 *   форма с email → письмо-подтверждение → переход по ссылке → публикация
 *   заявки и постановка в очередь сборщику → отчёт сборщика → письмо клиенту.
 *
 * Проверяем именно то, ради чего затевался double opt-in: до перехода по
 * ссылке из письма НИЧЕГО не публикуется и сборка не начинается.
 */

import assert from 'node:assert/strict'
import { test } from 'node:test'
import { execFileSync, spawn } from 'node:child_process'
import { readFileSync, existsSync, mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import net from 'node:net'

// fileURLToPath, а не URL.pathname: на Windows pathname отдаёт «/C:/…», и
// join() склеивает «C:\C:\…» — встроенный сервер тогда не поднимается вовсе.
const root = fileURLToPath(new URL('..', import.meta.url))
const phpFiles = [
  'public/intake-mail.php',
  'public/intake-queue.php',
  'public/intake-publish.php',
  'public/excel-to-app-confirm.php',
  'public/excel-to-app-build.php',
  'public/excel-to-app-queue.php',
].map(f => join(root, f))

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

/** Письма, снятые файловым транспортом (INTAKE_MAIL_TRANSPORT=file). */
function readMail(file) {
  if (!existsSync(file)) return []
  return readFileSync(file, 'utf8').trim().split('\n').filter(Boolean).map(l => JSON.parse(l))
}

function readMockLog(file) {
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
 * Поднять стенд: мок GitHub/Telegram + встроенный сервер над public/.
 * Возвращает порты, пути к логам и функцию остановки.
 */
async function startStand(extraEnv = {}) {
  const mockPort = await getFreePort()
  const appPort = await getFreePort()
  const workdir = mkdtempSync(join(tmpdir(), 'excel-to-app-confirm-'))
  const mockLog = join(workdir, 'mock.log')
  const mailLog = join(workdir, 'mail.log')
  const queueDir = join(workdir, 'queue')

  const mockProc = spawn('php', ['-S', `127.0.0.1:${mockPort}`, join(root, 'tests/fixtures/intake-mock-api.php')], {
    env: { ...process.env, MOCK_LOG: mockLog },
    stdio: 'ignore',
  })

  const env = {
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
    INTAKE_QUEUE_DIR: queueDir,
    INTAKE_MAIL_TRANSPORT: 'file',
    INTAKE_MAIL_FILE: mailLog,
    INTAKE_CONFIRM_URL: `http://127.0.0.1:${appPort}/excel-to-app-confirm.php`,
    INTAKE_BUILD_TOKEN: 'build-secret',
    ...extraEnv,
  }

  const appProc = spawn('php', ['-S', `127.0.0.1:${appPort}`, '-t', join(root, 'public')], {
    env,
    stdio: 'ignore',
  })

  await waitForPort(mockPort)
  await waitForPort(appPort)

  return {
    appPort,
    mockLog,
    mailLog,
    queueDir,
    env,
    stop() {
      mockProc.kill()
      appProc.kill()
      rmSync(workdir, { recursive: true, force: true })
    },
  }
}

/** Отправить заявку с лендинга. */
async function submitOrder(appPort, fields, files = [['orders.csv', 'col1;col2\n1;2\n']]) {
  const form = new FormData()
  for (const [k, v] of Object.entries(fields)) form.set(k, v)
  for (const [name, content] of files) {
    form.append('files[]', new Blob([content], { type: 'text/csv' }), name)
  }
  const res = await fetch(`http://127.0.0.1:${appPort}/excel-to-app.php`, { method: 'POST', body: form })
  return { res, json: await res.json() }
}

function buildCall(appPort, payload) {
  return fetch(`http://127.0.0.1:${appPort}/excel-to-app-build.php`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer build-secret' },
    body: JSON.stringify(payload),
  })
}

test('php -l reports no syntax errors in the confirmation-loop PHP files', () => {
  for (const file of phpFiles) {
    const out = execFileSync('php', ['-l', file], { encoding: 'utf8' })
    assert.match(out, /No syntax errors detected/, `${file} should lint clean`)
  }
})

test('pure helpers of the confirmation loop pass their unit assertions', () => {
  const out = execFileSync('php', [join(root, 'tests/fixtures/intake-confirm-unit.php')], { encoding: 'utf8' })
  assert.match(out, /all intake confirm unit assertions passed/)
})

test('e2e: заявка с email ждёт подтверждения и ничего не запускает', async () => {
  const stand = await startStand()
  try {
    const { res, json } = await submitOrder(stand.appPort, {
      source: 'excel-to-app',
      name: 'Иван',
      contact: 'ivan@example.com',
      topic: 'Учёт заказов из 3 Excel-файлов',
    })

    assert.equal(res.status, 200, JSON.stringify(json))
    assert.equal(json.ok, true, JSON.stringify(json))
    assert.equal(json.status, 'pending_confirmation', 'заявка должна ждать подтверждения адреса')
    assert.ok(json.request_id, 'ответ должен нести идентификатор заявки')
    assert.match(json.message, /ivan@example\.com/, 'человеку нужно сказать, куда ушло письмо')

    // Главное: до подтверждения ни одного обращения к GitHub и Telegram.
    const log = readMockLog(stand.mockLog)
    assert.equal(log.length, 0, `до подтверждения не должно быть вызовов API, а были: ${JSON.stringify(log)}`)

    // Письмо-подтверждение ушло, тема читаемая, ссылка внутри.
    const mail = readMail(stand.mailLog)
    assert.equal(mail.length, 1, 'должно уйти ровно одно письмо-подтверждение')
    assert.equal(mail[0].to, 'ivan@example.com')
    assert.match(decodeSubject(mail[0].subject), /Подтвердите заявку/)
    assert.match(mail[0].headers, /From: .*<welcome@ideav\.ru>/)
    assert.match(mail[0].headers, /charset=UTF-8/)
    assert.match(mail[0].body, /excel-to-app-confirm\.php\?token=/, 'в письме должна быть ссылка подтверждения')
    assert.match(mail[0].body, /24 ч/, 'в письме должен быть назван срок жизни ссылки')
  } finally {
    stand.stop()
  }
})

test('e2e: переход по ссылке публикует заявку, повторный — нет', async () => {
  const stand = await startStand()
  try {
    const { json } = await submitOrder(stand.appPort, {
      source: 'excel-to-app',
      company: 'ООО Пекарня',
      contact: 'ivan@example.com',
      topic: 'Учёт заказов',
    })
    assert.equal(json.status, 'pending_confirmation')

    const mail = readMail(stand.mailLog)
    const confirmUrl = /(http:\/\/\S+excel-to-app-confirm\.php\?token=[^\s]+)/.exec(mail[0].body)?.[1]
    assert.ok(confirmUrl, `ссылка подтверждения не найдена в письме: ${mail[0].body}`)

    const page = await fetch(confirmUrl)
    const html = await page.text()
    assert.equal(page.status, 200)
    assert.match(page.headers.get('content-type') ?? '', /text\/html/)
    assert.match(page.headers.get('x-robots-tag') ?? '', /noindex/, 'персональную ссылку нельзя индексировать')
    assert.match(html, /подтверждена/i, 'клиенту нужно подтверждение, что заявка пошла в работу')

    // Теперь — и только теперь — заявка опубликована.
    const log = readMockLog(stand.mockLog)
    const putContents = log.find(e => e.method === 'PUT' && e.path.includes('/contents/'))
    const postIssue = log.find(e => e.method === 'POST' && e.path.endsWith('/issues'))
    const sendMessage = log.find(e => e.path.includes('/sendMessage'))
    assert.ok(putContents, 'вложение должно уйти в репозиторий после подтверждения')
    assert.match(putContents.path, /orders\//)
    assert.ok(postIssue, 'issue должна создаваться после подтверждения')
    assert.ok(sendMessage, 'оператор должен получить уведомление после подтверждения')
    const issuePayload = JSON.parse(postIssue.body)
    assert.match(`${issuePayload.title}\n${issuePayload.body}`, /подтверждён/i, 'в issue должно быть видно, что адрес подтверждён')
    assert.match(issuePayload.body, /ООО Пекарня/)

    // Повторный переход (двойной клик, префетч почтовика) — второй сборки нет.
    const again = await fetch(confirmUrl)
    const againHtml = await again.text()
    assert.equal(again.status, 200)
    assert.match(againHtml, /уже подтверждена/i)
    const log2 = readMockLog(stand.mockLog)
    assert.equal(
      log2.filter(e => e.method === 'POST' && e.path.endsWith('/issues')).length,
      1,
      'повторный переход по ссылке не должен создавать вторую заявку',
    )
  } finally {
    stand.stop()
  }
})

test('e2e: подтверждённая заявка доходит до сборщика и до письма с результатом', async () => {
  const stand = await startStand()
  try {
    const { json } = await submitOrder(stand.appPort, {
      source: 'excel-to-app',
      contact: 'ivan@example.com',
      topic: 'интернет-магазин чая',
    })
    const requestId = json.request_id

    const confirmUrl = /(http:\/\/\S+excel-to-app-confirm\.php\?token=[^\s]+)/.exec(readMail(stand.mailLog)[0].body)[1]
    await fetch(confirmUrl)

    // Сборщик забирает работу сам (pull): confirmed → building.
    const claim = await buildCall(stand.appPort, { action: 'claim', limit: 5 })
    const claimJson = await claim.json()
    assert.equal(claim.status, 200, JSON.stringify(claimJson))
    assert.equal(claimJson.count, 1, 'сборщику должна достаться одна заявка')
    assert.equal(claimJson.jobs[0].id, requestId)
    assert.equal(claimJson.jobs[0].contact, 'ivan@example.com')
    assert.equal(claimJson.jobs[0].issue_number, 4242, 'сборщик должен получить номер issue заявки')
    assert.equal(claimJson.jobs[0].attachments.length, 1, 'сборщику нужны ссылки на вложения')

    // Повторный claim не должен выдать ту же работу второй раз.
    const claim2 = await (await buildCall(stand.appPort, { action: 'claim' })).json()
    assert.equal(claim2.count, 0, 'взятая в работу заявка не выдаётся снова')

    // Сборщик отчитался — клиенту уходит письмо по шаблону #622.
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

    const mail = readMail(stand.mailLog)
    assert.equal(mail.length, 2, 'должны уйти два письма: подтверждение и результат')
    const result = mail[1]
    assert.equal(result.to, 'ivan@example.com')
    assert.match(decodeSubject(result.subject), /Ваше приложение для интернет-магазина готово/)
    assert.match(result.body, /https:\/\/ideav\.ru\/nteaclub\//)
    assert.match(result.body, /nteaclub/)
    assert.match(result.body, /NteaAdmin2026/)
    assert.match(result.body, /Каталог: 198 товаров/)
    // Форма #622: пароли ролей в письме не перечисляем.
    assert.match(result.body, /главной странице приложения/)

    // Повторный отчёт о той же сборке второго письма не рассылает.
    const twice = await (await buildCall(stand.appPort, {
      action: 'deliver',
      request_id: requestId,
      app_url: 'https://ideav.ru/nteaclub/',
      admin_login: 'nteaclub',
      admin_password: 'NteaAdmin2026',
    })).json()
    assert.equal(twice.already, true, 'повторный deliver должен быть идемпотентным')
    assert.equal(readMail(stand.mailLog).length, 2, 'второго письма с результатом быть не должно')
  } finally {
    stand.stop()
  }
})

test('e2e: мост к сборщику закрыт без токена', async () => {
  const stand = await startStand()
  try {
    const noToken = await fetch(`http://127.0.0.1:${stand.appPort}/excel-to-app-build.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'claim' }),
    })
    assert.equal(noToken.status, 401, 'без токена claim невозможен')

    const wrongToken = await fetch(`http://127.0.0.1:${stand.appPort}/excel-to-app-build.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer nope' },
      body: JSON.stringify({ action: 'claim' }),
    })
    assert.equal(wrongToken.status, 401, 'чужой токен не подходит')

    const getMethod = await fetch(`http://127.0.0.1:${stand.appPort}/excel-to-app-build.php`)
    assert.equal(getMethod.status, 405, 'мост отвечает только на POST')
  } finally {
    stand.stop()
  }
})

test('e2e: мост не настроен — 503, а не открытая дверь', async () => {
  const stand = await startStand({ INTAKE_BUILD_TOKEN: '' })
  try {
    const res = await fetch(`http://127.0.0.1:${stand.appPort}/excel-to-app-build.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'claim' }),
    })
    assert.equal(res.status, 503)
  } finally {
    stand.stop()
  }
})

test('e2e: испорченный и чужой токен подтверждения не открывают заявку', async () => {
  const stand = await startStand()
  try {
    await submitOrder(stand.appPort, { source: 'excel-to-app', contact: 'ivan@example.com', topic: 'учёт' })
    const confirmUrl = /(http:\/\/\S+excel-to-app-confirm\.php\?token=[^\s]+)/.exec(readMail(stand.mailLog)[0].body)[1]

    const noToken = await fetch(`http://127.0.0.1:${stand.appPort}/excel-to-app-confirm.php`)
    assert.equal(noToken.status, 400, 'без токена — понятная страница, а не 500')

    const traversal = await fetch(`http://127.0.0.1:${stand.appPort}/excel-to-app-confirm.php?token=${encodeURIComponent('../../etc/passwd.' + 'ab'.repeat(32))}`)
    assert.equal(traversal.status, 404, 'обход каталога через токен не проходит')

    // Тот же id, но подменённый секрет.
    const id = /token=([^.]+)\./.exec(confirmUrl)[1]
    const forged = await fetch(`http://127.0.0.1:${stand.appPort}/excel-to-app-confirm.php?token=${id}.${'cd'.repeat(32)}`)
    assert.equal(forged.status, 404, 'подобранный секрет не подтверждает заявку')

    assert.equal(readMockLog(stand.mockLog).length, 0, 'ни одна неудачная попытка не должна публиковать заявку')

    // Настоящая ссылка при этом продолжает работать.
    const ok = await fetch(confirmUrl)
    assert.equal(ok.status, 200)
    assert.ok(readMockLog(stand.mockLog).some(e => e.method === 'POST' && e.path.endsWith('/issues')))
  } finally {
    stand.stop()
  }
})

test('e2e: неподтверждённая заявка с истёкшим сроком убирается из очереди', async () => {
  // TTL в одну секунду: проверяем и то, что ссылка перестаёт работать, и то,
  // что cron-скрипт удаляет файлы клиента, как обещано в письме.
  const stand = await startStand({ INTAKE_CONFIRM_TTL: '1' })
  try {
    const { json } = await submitOrder(stand.appPort, { source: 'excel-to-app', contact: 'ghost@example.com', topic: 'учёт' })
    const confirmUrl = /(http:\/\/\S+excel-to-app-confirm\.php\?token=[^\s]+)/.exec(readMail(stand.mailLog)[0].body)[1]
    assert.match(readMail(stand.mailLog)[0].body, /1 ч/, 'срок в письме считается из настройки')

    // TTL меряется в целых секундах: ждём с запасом больше двух, иначе на
    // границе секунды заявка ещё не просрочена и тест мигает.
    await new Promise(r => setTimeout(r, 2300))

    const late = await fetch(confirmUrl)
    assert.equal(late.status, 410, 'просроченная ссылка должна честно говорить, что устарела')
    assert.match(await late.text(), /устарела/i)
    assert.equal(readMockLog(stand.mockLog).length, 0, 'просроченная заявка не публикуется')

    const out = execFileSync('php', [join(root, 'public/excel-to-app-queue.php')], {
      encoding: 'utf8',
      env: stand.env,
    })
    assert.match(out, /expired=1/, `cron должен удалить просроченную заявку, вывод: ${out}`)
    assert.ok(!existsSync(join(stand.queueDir, json.request_id)), 'файлы неподтверждённой заявки должны быть удалены')
  } finally {
    stand.stop()
  }
})

test('e2e: заявка с телеграм-контактом публикуется сразу, как и раньше', async () => {
  // Решение владельца: заявки без email оставляем как есть — подтверждать
  // адрес там нечем, а ручной запуск сборки никуда не делся.
  const stand = await startStand()
  try {
    const { res, json } = await submitOrder(stand.appPort, {
      source: 'excel-to-app',
      contact: '@ivanov',
      topic: 'Учёт заказов',
    })
    assert.equal(res.status, 200, JSON.stringify(json))
    assert.equal(json.status, 'accepted')
    assert.equal(json.issue_number, 4242, 'телеграм-заявка публикуется сразу')
    assert.equal(json.attachments, 1)
    assert.equal(readMail(stand.mailLog).length, 0, 'письмо-подтверждение тут отправлять некуда')
  } finally {
    stand.stop()
  }
})

test('e2e: формы без автосборки подтверждения не требуют', async () => {
  // «Сопоставление каталогов» — обращение к оператору, а не сборка: лишний шаг
  // там только теряет лид.
  const stand = await startStand()
  try {
    const { res, json } = await submitOrder(stand.appPort, {
      source: 'catalog-matching',
      contact: 'buyer@example.com',
      task: 'Подобрать аналоги к 22 000 позиций',
    })
    assert.equal(res.status, 200, JSON.stringify(json))
    assert.equal(json.status, 'accepted')
    assert.equal(json.issue_number, 4242)
    assert.equal(readMail(stand.mailLog).length, 0)
  } finally {
    stand.stop()
  }
})

test('e2e: лимит заявок на один адрес', async () => {
  const stand = await startStand({ INTAKE_CONFIRM_MAX_PER_EMAIL: '2', INTAKE_RATE_LIMIT_MAX: '50' })
  try {
    const fields = { source: 'excel-to-app', contact: 'spam@example.com', topic: 'учёт' }
    assert.equal((await submitOrder(stand.appPort, fields)).res.status, 200)
    assert.equal((await submitOrder(stand.appPort, fields)).res.status, 200)
    const third = await submitOrder(stand.appPort, fields)
    assert.equal(third.res.status, 429, 'третья заявка на тот же адрес за сутки отбивается')
    assert.equal(readMail(stand.mailLog).length, 2, 'третьего письма на чужой адрес не уходит')
  } finally {
    stand.stop()
  }
})

test('e2e: письмо-подтверждение не ушло — заявку не теряем', async () => {
  // Транспорт file без пути к файлу = почта недоступна. Заявка в этом случае
  // публикуется сразу: оператор увидит её в Telegram и ответит руками.
  const stand = await startStand({ INTAKE_MAIL_FILE: '' })
  try {
    const { res, json } = await submitOrder(stand.appPort, {
      source: 'excel-to-app',
      contact: 'ivan@example.com',
      topic: 'Учёт заказов',
    })
    assert.equal(res.status, 200, JSON.stringify(json))
    assert.equal(json.status, 'accepted', 'при недоступной почте заявка идёт прежним путём')
    assert.equal(json.issue_number, 4242)
    assert.equal(json.attachments, 1, 'вложение из очереди должно доехать до репозитория')
  } finally {
    stand.stop()
  }
})
