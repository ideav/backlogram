import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'

const kbDataSource = readFileSync(
  new URL('../src/data/knowledgeBase.ts', import.meta.url),
  'utf8',
)
const kbArticlePage = readFileSync(
  new URL('../src/pages/KnowledgeBaseArticle.tsx', import.meta.url),
  'utf8',
)

function extractArticleBlock(slug) {
  const re = new RegExp(
    `slug: '${slug}'[\\s\\S]*?sourceUrl: \`\\$\\{'https://github.com/ideav/crm/blob/main/docs/integram-article-reviews'\\}/${slug}\\.md\`,`,
  )
  const match = kbDataSource.match(re)
  assert.ok(match, `article ${slug} block should be present`)
  return match[0]
}

test('article #04 keeps the concrete scenario block about the orders model', () => {
  const block = extractArticleBlock('04-related-tables')
  assert.match(block, /scenario:\s*\{[\s\S]*?symptoms:/)
  assert.match(block, /Компания ведёт учёт заказов\./)
  assert.match(block, /клиенты, заказы, товары, позиции заказа, платежи/)
  assert.match(block, /#Н\/Д/)
  assert.match(block, /СУММЕСЛИ/)
})

test('article #04 enumerates four Integram differences with detailed bodies', () => {
  const block = extractArticleBlock('04-related-tables')
  assert.match(block, /integramDifferenceDetailed:/)
  assert.match(block, /Реляционные ссылки вместо формул/)
  assert.match(block, /Справочники как отдельные таблицы/)
  assert.match(block, /Подчинённые таблицы вместо формул/)
  assert.match(block, /Отчёты по связанным данным/)
})

test('article #04 documents limitations around Excel-level formulas and external analytics', () => {
  const block = extractArticleBlock('04-related-tables')
  assert.match(block, /массивных формул/)
  assert.match(block, /условного форматирования/)
  assert.match(block, /JSON API/)
})

test('article #04 ships per-article SEO metaDescription and metaKeywords', () => {
  const block = extractArticleBlock('04-related-tables')
  assert.match(block, /metaDescription:/)
  assert.match(block, /metaKeywords:/)
  assert.match(block, /впр,vlookup/)
})

test('article #04 links to related knowledge-base articles', () => {
  const block = extractArticleBlock('04-related-tables')
  const related = block.match(/relatedSlugs:\s*\[([\s\S]*?)\]/)
  assert.ok(related, 'article #04 should declare relatedSlugs')
  const list = related[1]
  assert.match(list, /'01-google-sheets-150k'/)
  assert.match(list, /'02-excel-row-limit'/)
  assert.match(list, /'03-excel-file-versions'/)
  assert.match(list, /'07-notion-relational-data'/)
})

test('article page renders dynamic SEO meta tags and scenario section used by article #04', () => {
  assert.match(kbArticlePage, /meta\[name="description"\]/)
  assert.match(kbArticlePage, /meta\[property="og:title"\]/)
  assert.match(kbArticlePage, /meta\[property="og:description"\]/)
  assert.match(kbArticlePage, /meta\[property="og:url"\]/)
  assert.match(kbArticlePage, /meta\[name="twitter:card"\]/)
  assert.match(kbArticlePage, /link\[rel="canonical"\]/)
  assert.match(kbArticlePage, /Конкретный сценарий/)
  assert.match(kbArticlePage, /Смежные статьи/)
})
