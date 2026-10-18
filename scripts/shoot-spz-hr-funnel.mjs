// Кадр HR-воронки для /put-adepta.html (#773): /spz/funnel демо-базы снимается
// headless Chrome, а ответ отчёта 7701 подменяется. После обезличивания этапы в демо
// заполнены выборочно и суммы не убывают — масштабируем значения строк до итогов TARGET.
// Запуск: SPZ_TOKEN=<cookie idb_spz> node scripts/shoot-spz-hr-funnel.mjs <report-7701.json> <out.png>
// (report-7701.json — ответ GET /spz/report/7701?JSON_KV; png → webp через sharp)
import { spawn } from 'node:child_process'
import fs from 'node:fs'
const SRC = process.argv[2], OUT = process.argv[3]
const TARGET = { 'Первый контакт': 5367, 'Анкета': 2150, 'Скрининг': 1420, 'Интервью': 759,
  'Отправлено руководителю': 378, 'Интервью с НМ': 160, 'Оффер': 100, 'Оффер принят': 76,
  'Старт обучения': 19, 'Аттестация сдана': 5, 'Отказ от оффера': 24 }
const data = JSON.parse(fs.readFileSync(SRC, 'utf8'))
for (const [s, t] of Object.entries(TARGET)) {
  const rows = data.filter(r => +r[s] > 0)
  const sum = rows.reduce((a, r) => a + +r[s], 0)
  let acc = 0
  rows.forEach(r => { const v = Math.max(1, Math.round(+r[s] * t / sum)); r[s] = String(v); acc += v })
  rows.sort((a, b) => +b[s] - +a[s])
  let i = 0
  while (acc !== t) { const r = rows[i++ % rows.length]; const d = acc > t ? -1 : 1; if (+r[s] + d >= 1) { r[s] = String(+r[s] + d); acc += d } }
}
const body = Buffer.from(JSON.stringify(data)).toString('base64')
const chrome = spawn(process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe', ['--headless=new', '--remote-debugging-port=9333',
  '--user-data-dir=' + (process.env.TEMP || '/tmp') + '/spz-funnel-prof', '--window-size=1440,1000', '--hide-scrollbars', 'about:blank'])
await new Promise(r => setTimeout(r, 2500))
const tabs = await (await fetch('http://127.0.0.1:9333/json')).json()
const ws = new WebSocket(tabs.find(t => t.type === 'page').webSocketDebuggerUrl)
await new Promise(r => ws.onopen = r)
let id = 0; const pend = new Map()
const send = (method, params = {}) => new Promise(res => { const i = ++id; pend.set(i, res); ws.send(JSON.stringify({ id: i, method, params })) })
ws.onmessage = e => { const m = JSON.parse(e.data)
  if (m.id && pend.has(m.id)) { pend.get(m.id)(m.result ?? m.error); pend.delete(m.id) }
  if (m.method === 'Fetch.requestPaused') send('Fetch.fulfillRequest', { requestId: m.params.requestId, responseCode: 200,
    responseHeaders: [{ name: 'Content-Type', value: 'application/json; charset=utf-8' }], body }) }
await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false })
await send('Network.enable')
await send('Network.setCookie', { name: 'idb_spz', value: process.env.SPZ_TOKEN, domain: 'ideav.ru', path: '/', secure: true })
await send('Fetch.enable', { patterns: [{ urlPattern: '*report/7701*' }] })
await send('Page.enable')
await send('Page.navigate', { url: 'https://ideav.ru/spz/funnel' })
await new Promise(r => setTimeout(r, 8000))
await send('Runtime.evaluate', { expression: "document.getElementById('cookie-consent')?.remove()" })
const y = await send('Runtime.evaluate', { returnByValue: true, expression:
  "(()=>{let e=[...document.querySelectorAll('*')].find(x=>x.children.length===0&&/HR-воронка/.test(x.textContent));while(e&&e.getBoundingClientRect().width<1100)e=e.parentElement;const r=e.getBoundingClientRect();return {x:r.left+scrollX,y:r.top+scrollY,w:r.width,cls:e.className}})()" })
const R = y.result.value; console.log(R)
const shot = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true,
  clip: { x: R.x, y: R.y, width: R.w, height: 720, scale: 1 } })
fs.writeFileSync(OUT, Buffer.from(shot.data, 'base64'))
ws.close(); chrome.kill()
