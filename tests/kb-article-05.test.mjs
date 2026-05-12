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

test('article #05 keeps the concrete scenario block about the sales department roles', () => {
  const block = extractArticleBlock('05-access-rights')
  assert.match(block, /scenario:\s*\{[\s\S]*?symptoms:/)
  assert.match(block, /Отдел продаж/)
  assert.match(block, /10 менеджеров, 2 руководителя/)
  assert.match(block, /администратор CRM/)
  assert.match(block, /финансист/)
  assert.match(block, /новый партнёр заполняет форму заявки без учётной записи/)
  assert.match(block, /Apps Script/)
})

test('article #05 enumerates five Integram differences with detailed bodies', () => {
  const block = extractArticleBlock('05-access-rights')
  assert.match(block, /integramDifferenceDetailed:/)
  assert.match(block, /Роли и уровни доступа/)
  assert.match(block, /Маски по значениям/)
  assert.match(block, /Скрытые поля/)
  assert.match(block, /Гостевой доступ/)
  assert.match(block, /Отдельный флаг экспорта и удаления/)
  assert.match(block, /WRITE \(создание, редактирование, удаление\)/)
  assert.match(block, /\[CURRENT_USER\]/)
  assert.match(block, /BARRED/)
  assert.match(block, /встроенный пользователь guest/)
})

test('article #05 documents limitations around ERP/LDAP scenarios and SQL masks', () => {
  const block = extractArticleBlock('05-access-rights')
  assert.match(block, /ERP/)
  assert.match(block, /LDAP\/AD/)
  assert.match(block, /аудит-лог/)
  assert.match(block, /limitationsNote:/)
  assert.match(block, /SQL-условия/)
})

test('article #05 ships per-article SEO metaDescription and metaKeywords', () => {
  const block = extractArticleBlock('05-access-rights')
  assert.match(block, /metaDescription:/)
  assert.match(block, /metaKeywords:/)
  assert.match(block, /права доступа/)
  assert.match(block, /разграничение прав/)
  assert.match(block, /row-level security/)
})

test('article #05 links to related knowledge-base articles', () => {
  const block = extractArticleBlock('05-access-rights')
  const related = block.match(/relatedSlugs:\s*\[([\s\S]*?)\]/)
  assert.ok(related, 'article #05 should declare relatedSlugs')
  const list = related[1]
  assert.match(list, /'03-excel-file-versions'/)
  assert.match(list, /'01-google-sheets-150k'/)
  assert.match(list, /'06-airtable-control'/)
  assert.match(list, /'07-notion-relational-data'/)
})

test('article page renders dynamic SEO meta tags and scenario section used by article #05', () => {
  assert.match(kbArticlePage, /meta\[name="description"\]/)
  assert.match(kbArticlePage, /meta\[property="og:title"\]/)
  assert.match(kbArticlePage, /meta\[property="og:description"\]/)
  assert.match(kbArticlePage, /meta\[property="og:url"\]/)
  assert.match(kbArticlePage, /meta\[name="twitter:card"\]/)
  assert.match(kbArticlePage, /link\[rel="canonical"\]/)
  assert.match(kbArticlePage, /Конкретный сценарий/)
  assert.match(kbArticlePage, /Смежные статьи/)
})
