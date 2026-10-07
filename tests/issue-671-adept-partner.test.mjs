/**
 * Issue #671 — страницы рекрутинга адептов и партнёров на excel-to-app.ru.
 *
 * Две аудитории — две страницы (/adept/ и /partner/), общий у них только блок
 * бизнес-модели «кто кому платит». Как и тест #659, проверяем исходники:
 * сборка требует SITE_URL и не годится для быстрого `npm test`.
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { test } from 'node:test'

const read = (p) => readFileSync(fileURLToPath(new URL(p, import.meta.url)), 'utf8')

const content = read('../site-excel/src/content.ts')
const page = read('../site-excel/src/pages/ProgramPage.tsx')
const praktikumPage = read('../site-excel/src/pages/PraktikumPage.tsx')
const prerender = read('../site-excel/src/prerender.tsx')
const seo = read('../site-excel/src/seo.ts')

const model = content.slice(content.indexOf('export const BUSINESS_MODEL'), content.indexOf('export const ADEPT'))

test('две страницы со своими адресами', () => {
  assert.match(content, /slug: 'adept'/)
  assert.match(content, /slug: 'partner'/)
  assert.match(prerender, /\[ADEPT, AdeptPage\]/)
  assert.match(prerender, /\[PARTNER, PartnerPage\]/)
  assert.match(seo, /export function programJsonLd/)
})

test('страницы попадают в карту сайта', () => {
  assert.match(content, /\.\.\.\[ADEPT, PARTNER\]\.map\(p => \(\{ path: `\/\$\{p\.slug\}\/`/)
})

test('бизнес-модель: четыре роли и правило денег из задачи', () => {
  for (const role of ['Платформа', 'Адепт', 'Заказчик', 'Партнёр']) assert.ok(model.includes(`title: '${role}'`), role)
  assert.match(model, /от 15 до 40%/)
  assert.match(model, /напрямую от заказчика и не отдаёт с неё процент/)
  assert.match(model, /всегда платит процент тому, кто привёл заказчика/)
  assert.ok(page.includes('BUSINESS_MODEL.roles.map'))
  assert.ok(page.includes('BUSINESS_MODEL.rules.map'))
})

test('обучение адепта бесплатное, партнёрский процент 15–40%', () => {
  const adept = content.slice(content.indexOf('export const ADEPT'), content.indexOf('export const PARTNER'))
  const partner = content.slice(content.indexOf('export const PARTNER'), content.indexOf('/** Все адреса сайта'))
  assert.match(adept, /обучение бесплатно/)
  assert.match(partner, /15–40%/)
})

test('страницы ссылаются друг на друга, практикум — на обе', () => {
  assert.match(page, /href=\{`\$\{SITE_BASE\}\$\{other\.slug\}\/`\}/)
  assert.match(praktikumPage, /\$\{ADEPT\.slug\}/)
  assert.match(praktikumPage, /\$\{PARTNER\.slug\}/)
})

test('тема письма кодируется — в mailto не уходит сырая кириллица', () => {
  assert.match(page, /encodeURIComponent\(program\.mailSubject\)/)
})
