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
    `slug: '${slug}'[\\s\\S]*?sourceUrl: \`\\$\\{'https://github.com/ideav/crm/blob/main/docs/integram-article-reviews'\\}/[^\`]+\\.md\`,`,
  )
  const match = kbDataSource.match(re)
  assert.ok(match, `article ${slug} block should be present`)
  return match[0]
}

test('article #14 (forms) keeps the service-request scenario', () => {
  const block = extractArticleBlock('14-forms')
  assert.match(block, /scenario:\s*\{[\s\S]*?symptoms:/)
  assert.match(block, /сервисн/)
  assert.match(block, /модальной форме редактирования|заявки на сервисное/)
})

test('article #14 (forms) enumerates differences covering forms', () => {
  const block = extractArticleBlock('14-forms')
  assert.match(block, /integramDifferenceDetailed:/)
  assert.match(block, /Поля формы и поля таблицы/)
  assert.match(block, /Модальная форма редактирования/)
  assert.match(block, /Подчинённые таблицы/)
  assert.match(block, /Права доступа/)
})

test('article #14a (reports) covers reporting scenario', () => {
  const block = extractArticleBlock('14a-reports')
  assert.match(block, /scenario:\s*\{[\s\S]*?symptoms:/)
  assert.match(block, /оперативный отчёт/)
  assert.match(block, /JSON/)
})

test('article #14a (reports) enumerates differences covering reports', () => {
  const block = extractArticleBlock('14a-reports')
  assert.match(block, /integramDifferenceDetailed:/)
  assert.match(block, /Отчёт — это запрос к тем же таблицам/)
  assert.match(block, /Фильтры и группировки/)
  assert.match(block, /Редактируемый отчёт/)
  assert.match(block, /Экспорт/)
})

test('article #14b (dashboards) covers dashboard scenario', () => {
  const block = extractArticleBlock('14b-dashboards')
  assert.match(block, /scenario:\s*\{[\s\S]*?symptoms:/)
  assert.match(block, /KPI/)
  assert.match(block, /фильтр периода/)
})

test('article #14b (dashboards) enumerates differences covering dashboards', () => {
  const block = extractArticleBlock('14b-dashboards')
  assert.match(block, /integramDifferenceDetailed:/)
  assert.match(block, /Дашборд на тех же отчётах/)
  assert.match(block, /Один фильтр периода/)
  assert.match(block, /Редактирование KPI/)
})

test('article page renders sources and related sections used by article #14', () => {
  assert.match(kbArticlePage, /Источники|Смежные статьи|article\.relatedSlugs/)
})
