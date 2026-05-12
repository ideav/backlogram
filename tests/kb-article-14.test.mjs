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
  const needle = `slug: '${slug}'`
  const start = kbDataSource.indexOf(needle)
  assert.notEqual(start, -1, `article ${slug} block should be present`)
  const nextArticle = kbDataSource.indexOf('\n  {\n    slug:', start + needle.length)
  const end = nextArticle === -1 ? kbDataSource.indexOf('\n]', start) : nextArticle
  return kbDataSource.slice(start, end)
}

const forms = extractArticleBlock('14-forms')
const reports = extractArticleBlock('14a-reports')
const dashboards = extractArticleBlock('14b-dashboards')

test('article #14 is split into forms, reports, and dashboards with one service-request scenario', () => {
  assert.match(forms, /number: '14'/)
  assert.match(forms, /сервисное обслуживание/)
  assert.match(forms, /публичная форма/)
  assert.match(forms, /Модальная форма/)

  assert.match(reports, /number: '14a'/)
  assert.match(reports, /оперативный отчёт/)
  assert.match(reports, /JSON/)
  assert.match(reports, /руководитель может поправить ответственного прямо в отчёте/)

  assert.match(dashboards, /number: '14b'/)
  assert.match(dashboards, /KPI/)
  assert.match(dashboards, /единый фильтр периода/)
  assert.match(dashboards, /топ-5 просроченных заявок/)
})

test('split article #14 series enumerates differences for each product surface', () => {
  assert.match(forms, /Форма и таблица используют одно определение поля/)
  assert.match(forms, /Модальная форма редактирования записи/)
  assert.match(forms, /Подчинённые таблицы и формы прямо из карточки/)
  assert.match(forms, /Права доступа на уровне формы и поля/)

  assert.match(reports, /Отчёт — это запрос к тем же таблицам/)
  assert.match(reports, /Параметры в URL отчёта/)
  assert.match(reports, /Редактируемый отчёт/)
  assert.match(reports, /Сводные таблицы поверх отчёта/)

  assert.match(dashboards, /Дашборд на тех же отчётах/)
  assert.match(dashboards, /Один фильтр периода на все плитки/)
  assert.match(dashboards, /Редактирование KPI прямо на дашборде/)
  assert.match(dashboards, /Плиточный режим с управлением размером/)
})

test('split article #14 series mentions the specific technical anchors from the source articles', () => {
  assert.match(forms, /templates\/forms\.html/)
  assert.match(forms, /templates\/quiz\.html/)

  assert.match(reports, /\/report\/\{id\}\?JSON/)
  assert.match(reports, /\?JSON_KV/)
  assert.match(reports, /_m_save/)
  assert.match(reports, /_m_set/)
  assert.match(reports, /_ref_reqs\/\{type\}/)
  assert.match(reports, /FR_\*/)
  assert.match(reports, /PivotTable\.js/)

  assert.match(dashboards, /templates\/dash\.html/)
  assert.match(dashboards, /PivotTable\.js/)
})

test('split article #14 series records limitations beyond the forms, BI, and automation scope', () => {
  assert.match(forms, /Tally/)
  assert.match(forms, /Typeform/)
  assert.match(reports, /OLAP-срезов/)
  assert.match(reports, /ML-аналитики/)
  assert.match(dashboards, /ML-прогнозы/)
  assert.match(dashboards, /JSON-эндпоинт/)
})

test('split article #14 series ships per-article SEO copy and OG tags', () => {
  for (const block of [forms, reports, dashboards]) {
    assert.match(block, /seoTitle:/)
    assert.match(block, /seoDescription:/)
    assert.match(block, /ogTitle:/)
    assert.match(block, /ogDescription:/)
    assert.match(block, /metaDescription:/)
    assert.match(block, /metaKeywords:/)
  }
})

test('split article #14 series links to the three upstream sources in ideav/crm', () => {
  assert.match(forms, /14-forms\.md/)
  assert.match(reports, /14a-reports\.md/)
  assert.match(dashboards, /14b-dashboards\.md/)
  assert.doesNotMatch(kbDataSource, /slug: '14-forms-reports-dashboards'/)
})

test('split article #14 series declares relatedSlugs to neighbouring knowledge-base entries', () => {
  assert.match(forms, /relatedSlugs:\s*\[[\s\S]*'14a-reports'[\s\S]*'14b-dashboards'/)
  assert.match(forms, /'05-access-rights'/)
  assert.match(forms, /'04-related-tables'/)

  assert.match(reports, /relatedSlugs:\s*\[[\s\S]*'14-forms'[\s\S]*'14b-dashboards'/)
  assert.match(reports, /'13-api-json-export'/)
  assert.match(reports, /'02-excel-row-limit'/)

  assert.match(dashboards, /relatedSlugs:\s*\[[\s\S]*'14-forms'[\s\S]*'14a-reports'/)
  assert.match(dashboards, /'13-api-json-export'/)
  assert.match(dashboards, /'05-access-rights'/)
})

test('article page renders sources and related sections used by article #14 series', () => {
  assert.match(kbArticlePage, /Источники/)
  assert.match(kbArticlePage, /Смежные статьи/)
  assert.match(kbArticlePage, /article\.sourceUrl/)
  assert.match(kbArticlePage, /article\.relatedSlugs/)
})
