import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'

const kbDataSource = readFileSync(
  new URL('../src/data/knowledgeBase.ts', import.meta.url),
  'utf8',
)

const article12 = kbDataSource.match(
  /slug: '12-ai-prototype-rewrite'[\s\S]*?sourceUrl:[\s\S]*?12-ai-prototype-rewrite\.md`,\n(?:[\s\S]*?relatedSlugs:[\s\S]*?\],\n)?  \}/,
)

test('article #12 mirrors the source equipment-accounting scenario', () => {
  assert.ok(article12, 'article #12 should exist in knowledgeBase.ts')
  const source = article12[0]

  assert.match(source, /scenario:/)
  assert.match(source, /Производственная компания — три площадки/)
  assert.match(source, /импортировать исторические данные из Excel-файла на ~10 000 строк/)
  assert.match(source, /разделить видимость по площадкам/)
  assert.match(source, /ежедневно отдавать срез по балансовой стоимости/)
  assert.match(source, /прикреплять до пяти документов/)
  assert.match(source, /завести подрядчика по обслуживанию/)
  assert.match(source, /второй раунд разработки, по объёму близкий к первому/)
})

test('article #12 describes Integram configuration paths from the source', () => {
  assert.ok(article12, 'article #12 should exist in knowledgeBase.ts')
  const source = article12[0]

  assert.match(source, /integramDifferenceDetailed:/)
  assert.match(source, /Импорт данных/)
  assert.match(source, /Структура таблиц/)
  assert.match(source, /Отчёты и запросы/)
  assert.match(source, /Финансовая система получает данные через API Интеграма/)
  assert.match(source, /Файлы хранятся в файловой системе Интеграма/)
  assert.match(source, /Рабочее место подрядчика/)
})

test('article #12 has page-specific SEO copy and related article links', () => {
  assert.ok(article12, 'article #12 should exist in knowledgeBase.ts')
  const source = article12[0]

  assert.match(source, /seoTitle:/)
  assert.match(source, /seoDescription:/)
  assert.match(source, /ogTitle:/)
  assert.match(source, /ogDescription:/)
  assert.match(source, /relatedSlugs:/)
  assert.match(source, /'11-ai-interface-data-safety'/)
  assert.match(source, /'09-custom-development-prototype'/)
  assert.match(source, /'10-no-release-changes'/)
  assert.match(source, /'13-api-json-export'/)
})
