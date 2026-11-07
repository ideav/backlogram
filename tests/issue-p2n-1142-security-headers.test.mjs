import assert from 'node:assert/strict'
import { test } from 'node:test'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

// ideav/python2node#1142 (аудит #872 A8): ответы вебрута ideav.ru — лендинг, блог и
// движок Интеграма (index.php) — шли без защитных заголовков. Вебрут обслуживает
// один public/.htaccess (Vite копирует его в dist/, деплой корня кладёт поверх),
// поэтому заголовки живут здесь и переживают переустановку.
//
// Тест разбирает директивы `Header always set` (вне FilesMatch: они должны
// действовать на ВСЕ ответы, в том числе на ответы PHP) и сверяет значения.

const repo = new URL('..', import.meta.url).pathname
const htaccess = readFileSync(process.env.HTACCESS_PATH || resolve(repo, 'public/.htaccess'), 'utf8')

/** Header always set <имя> "<значение>" [условие] — только вне <FilesMatch>/<Files>. */
function globalHeaders(text) {
  const out = new Map()
  let depth = 0
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim()
    if (/^<Files(Match)?\b/i.test(line)) { depth++; continue }
    if (/^<\/Files(Match)?>/i.test(line)) { depth--; continue }
    if (depth) continue
    const m = line.match(/^Header\s+always\s+set\s+(\S+)\s+"([^"]*)"\s*(.*)$/i)
    if (m) out.set(m[1].toLowerCase(), { value: m[2], cond: m[3] })
  }
  return out
}

const h = globalHeaders(htaccess)

test('X-Frame-Options: SAMEORIGIN', () => {
  assert.equal(h.get('x-frame-options')?.value, 'SAMEORIGIN')
})

test('X-Content-Type-Options: nosniff', () => {
  assert.equal(h.get('x-content-type-options')?.value, 'nosniff')
})

test('Referrer-Policy: strict-origin-when-cross-origin', () => {
  assert.equal(h.get('referrer-policy')?.value, 'strict-origin-when-cross-origin')
})

test('HSTS: только по https, без includeSubDomains', () => {
  const hsts = h.get('strict-transport-security')
  assert.ok(hsts, 'Strict-Transport-Security не задан')
  assert.match(hsts.value, /^max-age=\d+$/)
  assert.match(hsts.cond, /HTTPS/)
})

test('CSP: только frame-ancestors — self и Вебвизор Метрики, без политики скриптов', () => {
  const csp = h.get('content-security-policy')?.value
  assert.ok(csp, 'Content-Security-Policy не задан')
  const directives = csp.split(';').map(s => s.trim()).filter(Boolean)
  assert.deepEqual(directives.map(d => d.split(/\s+/)[0]), ['frame-ancestors'])
  const sources = directives[0].split(/\s+/).slice(1)
  assert.ok(sources.includes("'self'"))
  assert.ok(sources.some(s => /webvisor\.com$/.test(s)), 'Вебвизор не пущен во фрейм')
  assert.ok(sources.some(s => /metrika\.yandex\.ru$/.test(s)), 'metrika.yandex.ru не пущена во фрейм')
  assert.ok(!sources.includes('*'))
})
