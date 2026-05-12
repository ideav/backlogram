import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'

const dataSource = readFileSync(
  new URL('../src/data/knowledgeBase.ts', import.meta.url),
  'utf8',
)

const articleSource = readFileSync(
  new URL('../src/pages/KnowledgeBaseArticle.tsx', import.meta.url),
  'utf8',
)

test('knowledge base data exposes Excel row-limit article with enriched fields', () => {
  assert.match(dataSource, /slug: '02-excel-row-limit'/)
  assert.match(dataSource, /scenarioPoints:/)
  assert.match(dataSource, /1 048 576/)
  assert.match(dataSource, /Microsoft Support: Excel specifications and limits/)
  assert.match(dataSource, /relatedSlugs: \['01-google-sheets-150k', '03-excel-file-versions', '04-related-tables'\]/)
  assert.match(dataSource, /integramDifferenceDetailed:/)
})

test('knowledge base article page renders dynamic SEO meta tags', () => {
  assert.match(articleSource, /setMetaTag\(/)
  assert.match(articleSource, /og:title/)
  assert.match(articleSource, /og:description/)
  assert.match(articleSource, /og:url/)
  assert.match(articleSource, /twitter:card/)
  assert.match(articleSource, /setCanonical\(/)
})

test('knowledge base article page renders scenario, sources and related sections', () => {
  assert.match(articleSource, /Конкретный сценарий/)
  assert.match(articleSource, /Источники/)
  assert.match(articleSource, /Смежные статьи/)
})
