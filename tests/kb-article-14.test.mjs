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

test('article #14 keeps the unified service-request scenario across forms, reports and dashboards', () => {
  const block = extractArticleBlock('14-forms-reports-dashboards')
  assert.match(block, /scenario:\s*\{[\s\S]*?symptoms:/)
  assert.match(block, /сервисные заявки/)
  assert.match(block, /публичную форму приёма заявки/)
  assert.match(block, /модальной форме редактирования/)
  assert.match(block, /оперативный отчёт/)
  assert.match(block, /KPI открытых \/ просроченных \/ закрытых/)
})

test('article #14 enumerates differences covering forms, reports and dashboards', () => {
  const block = extractArticleBlock('14-forms-reports-dashboards')
  assert.match(block, /integramDifferenceDetailed:/)
  assert.match(block, /Форма — это представление таблицы/)
  assert.match(block, /Модальная форма редактирования с подчинёнными таблицами/)
  assert.match(block, /Отчёт по тому же URL/)
  assert.match(block, /Инлайн-редактирование и `ref`-колонки/)
  assert.match(block, /Дашборд на тех же отчётах/)
  assert.match(block, /Единый фильтр периода поверх всех плиток/)
  assert.match(block, /Инлайн-правка KPI прямо на дашборде/)
  assert.match(block, /Единая модель прав и экспорт для внешнего слоя/)
})

test('article #14 mentions the specific technical anchors from the source articles', () => {
  const block = extractArticleBlock('14-forms-reports-dashboards')
  assert.match(block, /templates\/forms\.html/)
  assert.match(block, /templates\/dash\.html/)
  assert.match(block, /\?JSON/)
  assert.match(block, /_m_save/)
  assert.match(block, /_m_set/)
  assert.match(block, /FR_\*/)
  assert.match(block, /PivotTable\.js/)
})

test('article #14 records limitations beyond the BI and automation scope', () => {
  const block = extractArticleBlock('14-forms-reports-dashboards')
  assert.match(block, /OLAP-кубы/)
  assert.match(block, /ML-аналитика/)
  assert.match(block, /Tally/)
  assert.match(block, /Zapier/)
})

test('article #14 ships per-article SEO copy and OG tags', () => {
  const block = extractArticleBlock('14-forms-reports-dashboards')
  assert.match(block, /seoTitle:/)
  assert.match(block, /seoDescription:/)
  assert.match(block, /ogTitle:/)
  assert.match(block, /ogDescription:/)
  assert.match(block, /metaDescription:/)
  assert.match(block, /metaKeywords:/)
  assert.match(block, /дашборд на тех же данных/)
})

test('article #14 links to the three upstream sources in ideav/crm', () => {
  const block = extractArticleBlock('14-forms-reports-dashboards')
  assert.match(block, /sources:/)
  assert.match(block, /14-forms\.md/)
  assert.match(block, /14a-reports\.md/)
  assert.match(block, /14b-dashboards\.md/)
})

test('article #14 declares relatedSlugs to neighbouring knowledge-base entries', () => {
  const block = extractArticleBlock('14-forms-reports-dashboards')
  const related = block.match(/relatedSlugs:\s*\[([\s\S]*?)\]/)
  assert.ok(related, 'article #14 should declare relatedSlugs')
  const list = related[1]
  assert.match(list, /'13-api-json-export'/)
  assert.match(list, /'08-html-templates'/)
  assert.match(list, /'05-access-rights'/)
  assert.match(list, /'04-related-tables'/)
})

test('article page renders sources and related sections used by article #14', () => {
  assert.match(kbArticlePage, /Источники/)
  assert.match(kbArticlePage, /Смежные статьи/)
  assert.match(kbArticlePage, /article\.sources/)
  assert.match(kbArticlePage, /article\.relatedSlugs/)
})
