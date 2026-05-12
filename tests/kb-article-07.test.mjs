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

test('article #07 keeps the concrete scenario block about a 8-person team in Notion', () => {
  const block = extractArticleBlock('07-notion-relational-data')
  assert.match(block, /scenario:\s*\{[\s\S]*?symptoms:/)
  assert.match(block, /Команда из 8 человек ведёт в Notion базу клиентов и сделок/)
  assert.match(block, /менеджер видит только своих клиентов/)
  assert.match(block, /внешняя интеграция \(BI-дашборд\) забирает срез данных раз в минуту/)
})

test('article #07 enumerates six Integram differences with detailed bodies', () => {
  const block = extractArticleBlock('07-notion-relational-data')
  assert.match(block, /integramDifferenceDetailed:/)
  assert.match(block, /Строгие типы полей/)
  assert.match(block, /Связи как часть модели/)
  assert.match(block, /Отчёты с фильтрами и агрегатами/)
  assert.match(block, /Права на уровне строк/)
  assert.match(block, /Интерактивный отчёт/)
  assert.match(block, /API без посредника/)
})

test('article #07 documents that limitations include wiki and block editor', () => {
  const block = extractArticleBlock('07-notion-relational-data')
  assert.match(block, /Wiki-страницы команды/)
  assert.match(block, /Блочного редактора/)
})

test('article #07 ships per-article SEO metaDescription and metaKeywords', () => {
  const block = extractArticleBlock('07-notion-relational-data')
  assert.match(block, /metaDescription:/)
  assert.match(block, /metaKeywords:/)
  assert.match(block, /notion vs интеграм/)
  assert.match(block, /реляционная база/)
})

test('article #07 cites official Notion documentation as sources', () => {
  const block = extractArticleBlock('07-notion-relational-data')
  assert.match(block, /sources:/)
  assert.match(block, /Notion Help: Database properties/)
  assert.match(block, /Notion Developers: Request limits/)
  assert.match(block, /https:\/\/developers\.notion\.com\/reference\/request-limits/)
})

test('article #07 links to related knowledge-base articles', () => {
  const block = extractArticleBlock('07-notion-relational-data')
  const related = block.match(/relatedSlugs:\s*\[([\s\S]*?)\]/)
  assert.ok(related, 'article #07 should declare relatedSlugs')
  const list = related[1]
  assert.match(list, /'04-related-tables'/)
  assert.match(list, /'05-access-rights'/)
  assert.match(list, /'13-api-json-export'/)
  assert.match(list, /'06-airtable-control'/)
})

test('article page renders dynamic SEO meta tags and sections used by article #07', () => {
  assert.match(kbArticlePage, /meta\[name="description"\]/)
  assert.match(kbArticlePage, /meta\[property="og:title"\]/)
  assert.match(kbArticlePage, /meta\[property="og:description"\]/)
  assert.match(kbArticlePage, /meta\[property="og:url"\]/)
  assert.match(kbArticlePage, /meta\[name="twitter:card"\]/)
  assert.match(kbArticlePage, /link\[rel="canonical"\]/)
  assert.match(kbArticlePage, /Конкретный сценарий/)
  assert.match(kbArticlePage, /Источники/)
  assert.match(kbArticlePage, /Смежные статьи/)
})
