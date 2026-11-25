// #1026: в hero /zamena-excel.html — кнопка «Под ключ в Telegram-боте»,
// ведёт на https://t.me/Integrammbot в новой вкладке.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const { SITE_SECTIONS } = await import('../src/data/siteSections.mjs')
const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8')

test('#1026: у раздела zamena-excel третья кнопка hero — Telegram-бот', () => {
  const page = SITE_SECTIONS.find((s) => s.slug === 'zamena-excel')
  assert.deepEqual(page.cta3, { text: 'Под ключ в Telegram-боте', href: 'https://t.me/Integrammbot', external: true })
})

test('#1026: SPA рисует cta3 в hero, внешняя ссылка — в новой вкладке', () => {
  const tsx = read('src/pages/SiteSection.tsx')
  assert.match(tsx, /\{page\.cta3 && <Cta cta=\{page\.cta3\} \/>\}/)
  assert.match(tsx, /if \(external\) return <a href=\{href\} target="_blank"/)
})

test('#1026: пререндер выводит cta3 и открывает внешние ссылки в новой вкладке', () => {
  const pre = read('scripts/prerender-site-sections.mjs')
  assert.match(pre, /page\.cta3 \? ` · \$\{link\(page\.cta3\)\}` : ''/)
  assert.match(pre, /l\.external \? ' target="_blank" rel="noopener noreferrer"'/)
})
