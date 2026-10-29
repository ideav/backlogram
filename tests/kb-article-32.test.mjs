// issue #817 — статья базы знаний № 32 «Кастомизация ERP».
//
// Проверяем, что статья на месте, держит три пути (доработка коробки,
// заказная разработка, сборка под процесс), честные ограничения (учёт
// остаётся в 1С, повторяется подход, а не код, 89% — ориентир), ссылку на
// рекламный раздел /erp-sistema.html; попадание в группу, sitemap, llms.txt,
// OG и обратные ссылки из соседних статей.

import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { test } from 'node:test'

const kbDataSource = readFileSync(
  new URL('../src/data/knowledgeBase.ts', import.meta.url),
  'utf8',
)
const sitemap = readFileSync(new URL('../public/sitemap.xml', import.meta.url), 'utf8')
const llms = readFileSync(new URL('../public/llms.txt', import.meta.url), 'utf8')
const SLUG = '32-erp-customization'

function extractArticleBlock(slug) {
  const start = kbDataSource.indexOf(`slug: '${slug}'`)
  assert.notEqual(start, -1, `article ${slug} block should be present`)
  const sourceUrl = kbDataSource.indexOf('sourceUrl:', start)
  assert.notEqual(sourceUrl, -1, `article ${slug} should declare sourceUrl`)
  const end = kbDataSource.indexOf('\n  },', sourceUrl)
  assert.notEqual(end, -1, `article ${slug} block should close after sourceUrl`)
  return kbDataSource.slice(start, end)
}

test('article #32 publishes the ERP customization article', () => {
  const block = extractArticleBlock(SLUG)

  assert.match(block, /number: '32'/)
  assert.match(block, /Кастомизация ERP/)
  assert.match(block, /publishedAt: '2026-10-29'/)
  assert.match(block, /sourceUrl: 'https:\/\/github\.com\/ideav\/backlogram\/issues\/817'/)
})

test('article #32 compares three paths and keeps honest limits', () => {
  const block = extractArticleBlock(SLUG)

  assert.match(block, /'Доработка коробки', 'Заказная разработка', 'Сборка под процесс'/)
  assert.match(block, /остаются в 1С/)
  assert.match(block, /повторённый подход, а не перенесённый код/)
  assert.match(block, /89%/)
  assert.match(block, /https:\/\/ideav\.ru\/erp-sistema\.html/)
})

test('article #32 is wired into the index, sitemap, llms.txt, OG and neighbours', () => {
  const prerenderSource = readFileSync(
    new URL('../scripts/prerender-knowledge-base.mjs', import.meta.url),
    'utf8',
  )
  assert.match(prerenderSource, /'32-erp-customization'/)
  assert.match(sitemap, /knowledge-base\/32-erp-customization\.html/)
  assert.match(llms, /knowledge-base\/32-erp-customization\.html/)
  assert.ok(
    existsSync(new URL('../public/og/32-erp-customization.png', import.meta.url)),
    'expected public/og/32-erp-customization.png to be committed',
  )
  for (const neighbour of ['19-ai-agent-app-build', '31-1c-wrappers']) {
    const nb = extractArticleBlock(neighbour)
    assert.match(nb, /'32-erp-customization'/, `${neighbour} should link back to №32`)
  }
})
