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

const article10 = kbDataSource.match(
  /slug: '10-no-release-changes'[\s\S]*?sourceUrl:[\s\S]*?10-no-release-changes\.md`,\n(?:[\s\S]*?relatedSlugs:[\s\S]*?\],\n)?  \}/,
)

test('article #10 mirrors the source scenario about 15 change requests', () => {
  assert.ok(article10, 'article #10 should exist in knowledgeBase.ts')
  const source = article10[0]

  assert.match(source, /scenario:/)
  assert.match(source, /Внутренняя система учёта работает 6 месяцев/)
  assert.match(source, /5 запросов — новые поля в формах/)
  assert.match(source, /4 запроса — изменения в отчётах/)
  assert.match(source, /3 запроса — обновления прав доступа/)
  assert.match(source, /2 запроса — изменение структуры данных/)
  assert.match(source, /1 запрос — нестандартная интеграция/)
  assert.match(source, /все 14 первых запросов проходят через разработчика/)
})

test('article #10 has page-specific SEO copy and related article links', () => {
  assert.ok(article10, 'article #10 should exist in knowledgeBase.ts')
  const source = article10[0]

  assert.match(source, /seoTitle:/)
  assert.match(source, /seoDescription:/)
  assert.match(source, /relatedSlugs:/)
  assert.match(source, /'09-custom-development-prototype'/)
  assert.match(source, /'12-ai-prototype-rewrite'/)
  assert.match(source, /'08-html-templates'/)
  assert.match(source, /'05-access-rights'/)
})

test('article page prefers article-specific SEO values when present', () => {
  assert.match(kbArticlePage, /article\.seoTitle \?\?/)
  assert.match(kbArticlePage, /article\.seoDescription \?\?/)
})
