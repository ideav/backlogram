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

test('article #14 is split into forms, reports, and dashboards articles', () => {
  const forms = extractArticleBlock('14-forms')
  const reports = extractArticleBlock('14a-reports')
  const dashboards = extractArticleBlock('14b-dashboards')

  assert.match(forms, /number: '14'/)
  assert.match(forms, /Формы рядом с данными/)
  assert.match(forms, /Google Forms \+ Google Sheets \+ Zapier/)

  assert.match(reports, /number: '14a'/)
  assert.match(reports, /Отчёты на той же базе/)
  assert.match(reports, /JSON-эндпоинт/)

  assert.match(dashboards, /number: '14b'/)
  assert.match(dashboards, /Дашборды на тех же данных/)
  assert.match(dashboards, /фильтр периода/)
})

test('old combined article is removed from article data and redirected to forms', () => {
  assert.doesNotMatch(kbDataSource, /slug: '14-forms-reports-dashboards'/)
  assert.match(kbArticlePage, /14-forms-reports-dashboards/)
  assert.match(kbArticlePage, /Navigate/)
  assert.match(kbArticlePage, /knowledge-base\/14-forms\.html/)
})

test('article #09 links to the split forms, reports, and dashboards articles', () => {
  const article09 = kbDataSource.match(
    /slug: '09-custom-development-prototype'[\s\S]*?relatedSlugs:\s*\[([\s\S]*?)\]/,
  )
  assert.ok(article09, 'article #09 should declare relatedSlugs')
  const relatedSlugs = article09[1]

  assert.match(relatedSlugs, /'14-forms'/)
  assert.match(relatedSlugs, /'14a-reports'/)
  assert.match(relatedSlugs, /'14b-dashboards'/)
  assert.doesNotMatch(relatedSlugs, /'14-forms-reports-dashboards'/)
})
