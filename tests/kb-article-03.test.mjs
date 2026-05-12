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

test('article #03 keeps the concrete scenario block about the contract registry', () => {
  const block = extractArticleBlock('03-excel-file-versions')
  assert.match(block, /scenario:\s*\{[\s\S]*?symptoms:/)
  assert.match(block, /Отдел ведёт реестр договоров\./)
  assert.match(block, /Четыре менеджера, руководитель и финансист/)
  assert.match(block, /OneDrive или SharePoint/)
})

test('article #03 enumerates four Integram differences with detailed bodies', () => {
  const block = extractArticleBlock('03-excel-file-versions')
  assert.match(block, /integramDifferenceDetailed:/)
  assert.match(block, /Одна запись для всех ролей/)
  assert.match(block, /История изменения процесса через формы и отчёты/)
  assert.match(block, /Запрет удаления связанных данных/)
  assert.match(block, /Экспорт нужного среза без копирования всей базы/)
})

test('article #03 documents that limitations include document workflow and audit log', () => {
  const block = extractArticleBlock('03-excel-file-versions')
  assert.match(block, /документооборота/)
  assert.match(block, /аудит-лог/)
})

test('article #03 ships per-article SEO metaDescription and metaKeywords', () => {
  const block = extractArticleBlock('03-excel-file-versions')
  assert.match(block, /metaDescription:/)
  assert.match(block, /metaKeywords:/)
  assert.match(block, /excel рассылки/)
})

test('article #03 links to related knowledge-base articles', () => {
  const block = extractArticleBlock('03-excel-file-versions')
  const related = block.match(/relatedSlugs:\s*\[([\s\S]*?)\]/)
  assert.ok(related, 'article #03 should declare relatedSlugs')
  const list = related[1]
  assert.match(list, /'02-excel-row-limit'/)
  assert.match(list, /'05-access-rights'/)
  assert.match(list, /'04-related-tables'/)
  assert.match(list, /'01-google-sheets-150k'/)
})

test('article page renders dynamic SEO meta tags and scenario section used by article #03', () => {
  assert.match(kbArticlePage, /meta\[name="description"\]/)
  assert.match(kbArticlePage, /meta\[property="og:title"\]/)
  assert.match(kbArticlePage, /meta\[property="og:description"\]/)
  assert.match(kbArticlePage, /meta\[property="og:url"\]/)
  assert.match(kbArticlePage, /meta\[name="twitter:card"\]/)
  assert.match(kbArticlePage, /link\[rel="canonical"\]/)
  assert.match(kbArticlePage, /Конкретный сценарий/)
  assert.match(kbArticlePage, /Смежные статьи/)
})
