/**
 * Issue #738 — GEO excel-to-app.ru: редирект http → https, даты страниц,
 * `Article` и вопросы на кейсах, таблица сравнения, `sameAs` организации,
 * ссылки на посадочную и (мелко) на страницы адептов и партнёров.
 *
 * Как и тесты #659/#671, проверяем исходники: сборка требует SITE_URL и не
 * годится для быстрого `npm test`. Данные посадочных читаем через landings.mjs.
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { test } from 'node:test'
import { loadLandings, validateLandings } from '../site-excel/landings.mjs'

const read = (p) => readFileSync(fileURLToPath(new URL(p, import.meta.url)), 'utf8')

const content = read('../site-excel/src/content.ts')
const seo = read('../site-excel/src/seo.ts')
const viteConfig = read('../site-excel/vite.config.ts')
const landing = read('../site-excel/src/Landing.tsx')
const chrome = read('../site-excel/src/Chrome.tsx')
const casePage = read('../site-excel/src/pages/CasePage.tsx')
const comparePage = read('../site-excel/src/pages/ComparePage.tsx')
const staticPage = read('../site-excel/src/pages/StaticPage.tsx')

test('.htaccess сам переводит http на https одним 301, кроме POST и ACME', () => {
  // RewriteEngine On в .htaccess отменяет правило <Directory> хостинга —
  // поэтому редирект обязан жить здесь.
  assert.match(viteConfig, /RewriteCond %\{HTTPS\} off/)
  assert.match(viteConfig, /RewriteCond %\{REQUEST_METHOD\} \^\(GET\|HEAD\)\$/)
  assert.match(viteConfig, /!\^\/\\\\\.well-known\//)
  assert.match(viteConfig, /RewriteRule \^ https:\/\/%\{HTTP_HOST\}%\{REQUEST_URI\} \[L,R=301\]/)
})

test('у каждой страницы есть даты, sitemap отдаёт lastmod', () => {
  assert.match(content, /export type PageDates = \{ published: string; updated: string \}/)
  assert.match(content, /export const PAGES: \(\{ path: string; title: string; description: string \} & PageDates\)\[\]/)
  assert.match(viteConfig, /<lastmod>\$\{page\.updated\}<\/lastmod>/)
  const dates = [...content.matchAll(/(published|updated): '(\d{4}-\d{2}-\d{2})'/g)]
  assert.ok(dates.length >= 14, `дат слишком мало: ${dates.length}`)
  for (const [, , day] of dates) assert.ok(!Number.isNaN(Date.parse(day)), day)
})

test('посадочные без дат не проходят проверку', () => {
  const [page] = loadLandings()
  assert.ok(page.published && page.updated, 'у посадочной есть published и updated')
  const broken = { ...page, updated: '2020-01-01' }
  delete broken.published
  const errors = validateLandings([broken])
  assert.ok(errors.some(e => e.includes('published')), errors.join('\n'))
})

test('JSON-LD: даты, Article и FAQPage на кейсах', () => {
  assert.match(seo, /datePublished: page\.published, dateModified: page\.updated/)
  assert.match(seo, /'@type': 'Article'/)
  assert.match(seo, /mainEntity: item\.faq\.map/)
  for (const fn of ['compareJsonLd', 'landingPageJsonLd', 'praktikumJsonLd', 'programJsonLd', 'landingJsonLd']) {
    const body = seo.split(`export function ${fn}`)[1]?.split('\nexport function')[0] ?? ''
    assert.match(body, /\.\.\.dates\(/, `${fn} без дат`)
  }
})

test('у каждого кейса свои 3 вопроса, они же видны на странице', () => {
  const cases = content.split('export const CASES')[1].split('\n]\n')[0]
  assert.equal((cases.match(/^    faq: \[/gm) ?? []).length, 4)
  assert.equal((cases.match(/^        q: '/gm) ?? []).length, 12)
  assert.match(casePage, /<Faq items=\{item\.faq\}/)
  assert.match(casePage, /dates=\{item\}/)
  assert.match(staticPage, /<time dateTime=\{dates\.published\}>/)
})

test('страница сравнения — с таблицей по пунктам и датами', () => {
  assert.match(content, /export const COMPARE_TABLE = \{/)
  assert.match(comparePage, /<table/)
  assert.match(comparePage, /COMPARE_TABLE\.rows\.map/)
  assert.match(comparePage, /scope="row"/)
  assert.match(comparePage, /overflow-x-auto/, 'на телефоне таблица скроллится внутри себя, а не страница')
  assert.match(comparePage, /dates=\{COMPARE_PAGE\}/)
})

test('организация связана с профилями через sameAs', () => {
  assert.match(seo, /sameAs: ORG_SAME_AS/)
  for (const url of ['https://ideav.ru/', 'https://integram.io', 'https://reestr.digital.gov.ru/reestr/4638631/']) {
    assert.ok(seo.includes(`'${url}'`), url)
  }
})

test('главная ссылается на посадочную, адепты и партнёры — только мелко в подвале', () => {
  assert.match(landing, /href=\{`\$\{SITE_BASE\}mgnovennyj-start\/`\}/)
  assert.doesNotMatch(landing, /ADEPT|PARTNER/, 'клиенту на главной эти страницы не предлагаем')
  const footer = chrome.split('export function SiteFooter')[1]
  assert.match(footer, /\[ADEPT, PARTNER\]\.map\(program =>/)
  assert.match(footer, /text-xs/)
})
