/**
 * Issue #5091 (ideav/crm) — живые контакты в подвале excel-to-app.ru.
 *
 * Пункт меню «Контакты» (#5085) вёл в подвал, где была только юридическая
 * справка оператора ПДн — самих контактов не было. Просили те же, что на
 * ideav.ru: Telegram, телефон с часами работы и почта. Часы работы телефона —
 * с 9:00 до 21:00 мск.
 *
 * Тесты стерегут исходники по образцу tests/issue-5085-excel-header.test.mjs:
 * собранный dist они не трогают (см. README site-excel про выкладку).
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { test } from 'node:test'

const read = (p) => readFileSync(fileURLToPath(new URL(p, import.meta.url)), 'utf8')

const chrome = read('../site-excel/src/Chrome.tsx')
const content = read('../site-excel/src/content.ts')

const footer = () => {
  const part = chrome.split('<footer')[1]?.split('</footer>')[0]
  assert.ok(part, 'подвал должен существовать')
  return part
}

test('в подвале есть контакты: телеграм, телефон с часами и почта', () => {
  const f = footer()
  assert.match(f, /CONTACT_TELEGRAM_URL/, 'телеграм, как на ideav.ru')
  assert.match(f, /@qdmadept/)
  assert.match(f, /href=\{CONTACT_PHONE_HREF\}/, 'телефон — телефонной ссылкой')
  assert.match(f, /\{CONTACT_PHONE\}/, 'номер телефона виден в подвале')
  assert.match(f, /CONTACT_PHONE_HOURS/, 'часы работы при телефоне')
  assert.match(f, /CONTACT_EMAIL/, 'почта')
})

test('часы работы телефона — с 9:00 до 21:00 мск, из content.ts', () => {
  assert.match(content, /CONTACT_PHONE_HOURS = 'с 9:00 до 21:00 мск'/)
})

test('почта в подвале — текстом, без mailto-ссылки', () => {
  // Клик по mailto — автоцель Метрики «Клик по email» (issue #619);
  // правило действует на любой части страницы, включая подвал.
  assert.doesNotMatch(footer(), /mailto:/)
})

test('контакты живут в content.ts — единственном источнике содержания', () => {
  // chrome.tsx берёт константы импортом, значения заданы один раз.
  assert.match(content, /CONTACT_TELEGRAM_URL = 'https:\/\/t\.me\/qdmadept'/)
  assert.match(content, /CONTACT_PHONE_HREF = 'tel:\+79955060167'/)
  assert.match(content, /CONTACT_PHONE = '\+7 \(995\) 506-01-67'/)
})

test('подвал с контактами общий у всех страниц домена', () => {
  // Страницы-спутники ставят тот же SiteFooter (#626), контакты там тоже нужны.
  assert.match(read('../site-excel/src/Landing.tsx'), /<SiteFooter \/>/)
  assert.match(read('../site-excel/src/pages/StaticPage.tsx'), /<SiteFooter \/>/)
})
