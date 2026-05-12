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

test('article #01 keeps the concrete scenario block with the Google Sheets cell limit', () => {
  assert.match(kbDataSource, /slug: '01-google-sheets-150k'/)
  assert.match(
    kbDataSource,
    /Компания ведёт в Google Sheets реестр сделок: 150 000 записей/,
  )
  assert.match(kbDataSource, /не более 10 млн ячеек на файл/)
})

test('article #01 links to related knowledge-base articles', () => {
  const article01 = kbDataSource.match(
    /slug: '01-google-sheets-150k'[\s\S]*?relatedSlugs:\s*\[([\s\S]*?)\]/,
  )
  assert.ok(article01, 'article #01 should declare relatedSlugs')
  const list = article01[1]
  assert.match(list, /'04-related-tables'/)
  assert.match(list, /'05-access-rights'/)
  assert.match(list, /'03-excel-file-versions'/)
  assert.match(list, /'07-notion-relational-data'/)
})

test('article page injects SEO meta tags and a canonical link', () => {
  assert.match(kbArticlePage, /meta\[name="description"\]/)
  assert.match(kbArticlePage, /meta\[property="og:title"\]/)
  assert.match(kbArticlePage, /meta\[property="og:description"\]/)
  assert.match(kbArticlePage, /meta\[property="og:type"\]/)
  assert.match(kbArticlePage, /meta\[property="og:url"\]/)
  assert.match(kbArticlePage, /meta\[name="twitter:card"\]/)
  assert.match(kbArticlePage, /link\[rel="canonical"\]/)
})

test('article page renders the optional scenario section', () => {
  assert.match(kbArticlePage, /Конкретный сценарий/)
  assert.match(kbArticlePage, /article\.scenario/)
})

test('article page renders a related articles section', () => {
  assert.match(kbArticlePage, /Смежные статьи/)
  assert.match(kbArticlePage, /relatedArticles\.map/)
})
