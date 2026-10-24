// crm#5270 — статья базы знаний № 28 «Запросы Интеграма: что умеет движок
// отчётов» по docs/query-engine-capabilities.md из ideav/crm.
//
// Проверяем, что статья на месте, держит ключевые тезисы (компиляция в один
// SQL, автосоединения по метаданным, подзапросы и WITH RECURSIVE, параметры
// URL, форматы JSON, потребители от кнопок до DWH), ссылается на
// первоисточник, спутована со статьёй 29 и попадает в sitemap/llms.txt/OG.

import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { test } from 'node:test'

const kbDataSource = readFileSync(
  new URL('../src/data/knowledgeBase.ts', import.meta.url),
  'utf8',
)
const sitemap = readFileSync(new URL('../public/sitemap.xml', import.meta.url), 'utf8')
const llms = readFileSync(new URL('../public/llms.txt', import.meta.url), 'utf8')

function extractArticleBlock(slug) {
  const start = kbDataSource.indexOf(`slug: '${slug}'`)
  assert.notEqual(start, -1, `article ${slug} block should be present`)
  const sourceUrl = kbDataSource.indexOf('sourceUrl:', start)
  assert.notEqual(sourceUrl, -1, `article ${slug} should declare sourceUrl`)
  const end = kbDataSource.indexOf('\n  },', sourceUrl)
  assert.notEqual(end, -1, `article ${slug} block should close after sourceUrl`)
  return kbDataSource.slice(start, end)
}

test('article #28 publishes the query-engine capabilities article', () => {
  const block = extractArticleBlock('28-query-engine-capabilities')

  assert.match(block, /number: '28'/)
  assert.match(block, /что умеет движок/i)
})

test('article #28 keeps the key theses: один SQL, автосоединения, рекурсия', () => {
  const block = extractArticleBlock('28-query-engine-capabilities')

  // компиляция декларативного определения в SQL
  assert.match(block, /компилирует/i)
  assert.match(block, /LEFT JOIN/)
  // соединения выводятся из метаданных, JOIN руками не пишут
  assert.match(block, /метаданн/i)
  assert.match(block, /сам[ао]? находит путь/i)
  // аналитический охват
  assert.match(block, /HAVING/)
  assert.match(block, /WITH RECURSIVE/)
  assert.match(block, /подзапрос/i)
  // параметры URL и форматы
  assert.match(block, /FR_/)
  assert.match(block, /JSON_KV/)
  assert.match(block, /X-Query-Id/)
})

test('article #28 lists the consumers: кнопки, дашборды, MCP, планировщик', () => {
  const block = extractArticleBlock('28-query-engine-capabilities')

  assert.match(block, /дашборд/i)
  assert.match(block, /integram-mcp/)
  assert.match(block, /Airflow|планировщик/i)
  // SET-механика и права — не здесь, а в статье 29
  assert.match(block, /29-query-as-stored-procedure/)
})

test('article #28 is honest about the limits: не OLAP, тяжёлая агрегация — в DWH', () => {
  const block = extractArticleBlock('28-query-engine-capabilities')

  assert.match(block, /OLAP/i)
  assert.match(block, /колоночн/i)
  assert.match(block, /накопител/i)
})

test('article #28 cites the crm source document', () => {
  const block = extractArticleBlock('28-query-engine-capabilities')

  assert.match(
    block,
    /github\.com\/ideav\/crm\/blob\/main\/docs\/query-engine-capabilities\.md/,
  )
  assert.match(
    block,
    /sourceUrl: 'https:\/\/github\.com\/ideav\/crm\/blob\/main\/docs\/query-engine-capabilities\.md'/,
  )
})

test('article #28 is grouped, sitemapped and listed in llms.txt with an OG card', () => {
  const prerenderSource = readFileSync(
    new URL('../scripts/prerender-knowledge-base.mjs', import.meta.url),
    'utf8',
  )

  // группа «Релизы, отчёты, формы и интеграции»
  const reportsGroup = prerenderSource.slice(
    prerenderSource.indexOf('Релизы, отчёты, формы и интеграции'),
    prerenderSource.indexOf('Бизнес-практика no-code'),
  )
  assert.match(reportsGroup, /'28-query-engine-capabilities'/)
  assert.match(sitemap, /knowledge-base\/28-query-engine-capabilities\.html/)
  assert.match(llms, /knowledge-base\/28-query-engine-capabilities\.html/)
  assert.ok(
    existsSync(new URL('../public/og/28-query-engine-capabilities.png', import.meta.url)),
    'expected public/og/28-query-engine-capabilities.png to be committed',
  )
})
