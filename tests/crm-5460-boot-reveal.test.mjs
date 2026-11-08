// ideav/crm#5460: страница не должна «моргать» — пререндер-снапшот и спиннер
// ленивого чанка не показываются, #root открывается с готовой страницей.
import assert from 'node:assert/strict'
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { test } from 'node:test'

const indexHtml = readFileSync(new URL('../index.html', import.meta.url), 'utf8')
const appSource = readFileSync(new URL('../src/App.tsx', import.meta.url), 'utf8')

test('index.html прячет #root до монтирования и страхуется таймаутом', () => {
  const head = indexHtml.slice(0, indexHtml.indexOf('</head>'))
  assert.match(head, /html\.boot #root \{ visibility: hidden; \}/)
  assert.match(head, /classList\.add\('boot'\)/)
  assert.match(head, /setTimeout\(function\(\) \{ root\.classList\.remove\('boot'\); \}, \d+\)/)
})

test('класс boot снимается внутри Suspense, рядом с Outlet', () => {
  assert.match(appSource, /<Suspense fallback=\{<RouteFallback \/>\}>\s*<Outlet \/>\s*<RevealWhenReady \/>\s*<\/Suspense>/)
  assert.match(appSource, /classList\.remove\('boot'\)/)
})

test('собранные страницы несут boot-скрипт в head (если dist собран)', (t) => {
  const dist = new URL('../dist/', import.meta.url)
  if (!existsSync(dist)) return t.skip('dist не собран')
  const pages = readdirSync(dist).filter((f) => f.endsWith('.html'))
  assert.ok(pages.includes('put-adepta.html'))
  for (const page of pages) {
    const html = readFileSync(new URL(page, dist), 'utf8')
    if (!html.includes('id="root"')) continue
    const head = html.slice(0, html.indexOf('</head>'))
    assert.match(head, /classList\.add\('boot'\)/, `${page}: нет boot-скрипта`)
  }
})
