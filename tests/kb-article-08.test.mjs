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

test('article #08 keeps the concrete scenario block about dispatcher dashboard and printed client card', () => {
  const block = extractArticleBlock('08-html-templates')
  assert.match(block, /scenario:\s*\{[\s\S]*?symptoms:/)
  assert.match(block, /рабочее место диспетчера/)
  assert.match(block, /Leaflet или Яндекс\.Карт/)
  assert.match(block, /карточка клиента в фирменном формате/)
  assert.match(block, /печатный лист A4/)
})

test('article #08 enumerates six Integram differences with detailed bodies', () => {
  const block = extractArticleBlock('08-html-templates')
  assert.match(block, /integramDifferenceDetailed:/)
  assert.match(block, /HTML-шаблоны как файлы/)
  assert.match(block, /Подстановка данных через \{ИмяПоля\}/)
  assert.match(block, /Повторяющиеся блоки/)
  assert.match(block, /Подключение отчётов внутри шаблона/)
  assert.match(block, /Произвольный JS и CSS/)
  assert.match(block, /Права работают независимо от шаблона/)
})

test('article #08 mentions the templates/ folder and the {ИмяПоля} placeholder syntax', () => {
  const block = extractArticleBlock('08-html-templates')
  assert.match(block, /templates\//)
  assert.match(block, /main\.html/)
  assert.match(block, /info\.html/)
  assert.match(block, /cards\.html/)
  assert.match(block, /dash\.html/)
  assert.match(block, /\{ИмяПоля\}/)
  assert.match(block, /Begin:ИмяБлока/)
  assert.match(block, /End:ИмяБлока/)
})

test('article #08 documents limitations: HTML knowledge required and no widget gallery', () => {
  const block = extractArticleBlock('08-html-templates')
  assert.match(block, /базовый технический навык/)
  assert.match(block, /не drag-and-drop/)
  assert.match(block, /галерей виджетов/)
})

test('article #08 ships per-article SEO metaDescription, metaKeywords and OG titles', () => {
  const block = extractArticleBlock('08-html-templates')
  assert.match(block, /seoTitle:/)
  assert.match(block, /seoDescription:/)
  assert.match(block, /ogTitle:/)
  assert.match(block, /ogDescription:/)
  assert.match(block, /metaDescription:/)
  assert.match(block, /metaKeywords:/)
  assert.match(block, /airtable interfaces/)
  assert.match(block, /notion views/)
})

test('article #08 links to related knowledge-base articles', () => {
  const block = extractArticleBlock('08-html-templates')
  const related = block.match(/relatedSlugs:\s*\[([\s\S]*?)\]/)
  assert.ok(related, 'article #08 should declare relatedSlugs')
  const list = related[1]
  assert.match(list, /'06-airtable-control'/)
  assert.match(list, /'07-notion-relational-data'/)
  assert.match(list, /'11-ai-interface-data-safety'/)
  assert.match(list, /'15-local-control-files'/)
})

test('article page renders dynamic SEO meta tags and scenario section used by article #08', () => {
  assert.match(kbArticlePage, /meta\[name="description"\]/)
  assert.match(kbArticlePage, /meta\[property="og:title"\]/)
  assert.match(kbArticlePage, /meta\[property="og:description"\]/)
  assert.match(kbArticlePage, /meta\[property="og:url"\]/)
  assert.match(kbArticlePage, /meta\[name="twitter:card"\]/)
  assert.match(kbArticlePage, /link\[rel="canonical"\]/)
  assert.match(kbArticlePage, /Конкретный сценарий/)
  assert.match(kbArticlePage, /Смежные статьи/)
})
