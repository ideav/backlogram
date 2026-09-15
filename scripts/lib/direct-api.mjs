/**
 * Транспорт до API Яндекс.Директа.
 *
 * Почему не просто fetch: на рабочей машине поднят sing-box в режиме tun, и
 * node-овский fetch уезжает в его fake-ip подсеть — запрос висит до
 * `connect ETIMEDOUT 127.104.0.192:443`. curl через тот же туннель ходит
 * нормально, поэтому при сетевой ошибке повторяем запрос им.
 *
 * Сетевая ошибка — это только недоступность: ответ 4xx/5xx от самого Директа
 * возвращается как есть, подменять его вторым запросом нельзя.
 */

import { spawnSync } from 'node:child_process'

const API = 'https://api.direct.yandex.com/json/v5'

/** POST JSON и разбор ответа. Возвращает { status, text }. */
export async function postJson(url, { headers = {}, body }) {
  try {
    const response = await fetch(url, { method: 'POST', headers, body })
    return { status: response.status, text: await response.text() }
  } catch (error) {
    const viaCurl = curlPost(url, headers, body)
    if (viaCurl) return viaCurl
    throw error
  }
}

function curlPost(url, headers, body) {
  const args = ['-s', '-m', '120', '-w', '\n%{http_code}', '-X', 'POST', url, '--data-binary', '@-']
  for (const [name, value] of Object.entries(headers)) args.push('-H', `${name}: ${value}`)

  const result = spawnSync('curl', args, { input: body, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 })
  if (result.error || result.status !== 0) return null

  const output = result.stdout ?? ''
  const cut = output.lastIndexOf('\n')
  return { status: Number(output.slice(cut + 1).trim()) || 0, text: output.slice(0, cut) }
}

/** Вызов метода API: сам разбирает конверт и бросает ошибку Директа как есть. */
export async function call(service, method, params, token) {
  const { status, text } = await postJson(`${API}/${service}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Accept-Language': 'ru',
      'Content-Type': 'application/json; charset=utf-8',
    },
    body: JSON.stringify({ method, params }),
  })
  if (status !== 200) throw new Error(`${service}.${method}: HTTP ${status} ${text.slice(0, 300)}`)

  const payload = JSON.parse(text)
  if (payload.error) {
    throw new Error(`${service}.${method}: ${payload.error.error_string} — ${payload.error.error_detail}`)
  }
  return payload.result
}

/**
 * Отчёт. Директ собирает его в очереди и отвечает 201/202, пока не готов, —
 * поэтому запрос повторяется с тем же ReportName до 200.
 */
export async function report(params, token, { attempts = 10, pauseMs = 8000 } = {}) {
  const headers = {
    Authorization: `Bearer ${token}`,
    'Accept-Language': 'ru',
    'Content-Type': 'application/json; charset=utf-8',
    processingMode: 'auto',
    returnMoneyInMicros: 'false',
    skipReportHeader: 'true',
    skipReportSummary: 'true',
  }
  const body = JSON.stringify({ params })

  for (let attempt = 0; attempt < attempts; attempt++) {
    const { status, text } = await postJson(`${API}/reports`, { headers, body })
    if (status === 200) return text
    if (status !== 201 && status !== 202) throw new Error(`reports: HTTP ${status} ${text.slice(0, 300)}`)
    await new Promise(resolve => setTimeout(resolve, pauseMs))
  }
  throw new Error('reports: отчёт не собрался за отведённое время')
}
