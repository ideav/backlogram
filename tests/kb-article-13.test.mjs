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

const article13 = kbDataSource.match(
  /slug: '13-api-json-export'[\s\S]*?sourceUrl:[\s\S]*?13-api-json-export\.md`,\n(?:[\s\S]*?relatedSlugs:[\s\S]*?\],\n)?  \}/,
)

test('article #13 mirrors the source Power BI integration scenario', () => {
  assert.ok(article13, 'article #13 should exist in knowledgeBase.ts')
  const source = article13[0]

  assert.match(source, /scenario:/)
  assert.match(source, /ежедневный отчёт по продажам в Power BI/)
  assert.match(source, /в 9:00 менеджер открывает таблицу со сделками и сохраняет CSV/)
  assert.match(source, /финансовый отдел раз в неделю просит «выгрузку по закрытым сделкам за период»/)
  assert.match(source, /данные в Power BI отстают на сутки/)
  assert.match(source, /цикл «экспорт → отправка → загрузка» повторяется с нуля/)
})

test('article #13 keeps API differences as structured source sections', () => {
  assert.ok(article13, 'article #13 should exist in knowledgeBase.ts')
  const source = article13[0]

  assert.match(source, /flowDiagram:/)
  assert.match(source, /Схема обмена данными/)
  assert.match(source, /JSON-URL/)
  assert.match(source, /Дашборд обновляет источник по расписанию без ручного CSV/)
  assert.match(source, /integramDifferenceDetailed:/)
  assert.match(source, /title: 'JSON-экспорт отчёта'/)
  assert.match(source, /title: 'Серверный API'/)
  assert.match(source, /title: 'API-пользователь с ограниченными правами'/)
  assert.match(source, /title: 'Power BI как потребитель данных'/)
  assert.match(source, /добавить к URL параметр запроса/)
  assert.match(source, /API работает с теми же правами, что и пользовательский интерфейс/)
})

test('article #13 has page-specific SEO and related knowledge-base links', () => {
  assert.ok(article13, 'article #13 should exist in knowledgeBase.ts')
  const source = article13[0]

  assert.match(source, /seoTitle:/)
  assert.match(source, /seoDescription:/)
  assert.match(source, /ogTitle:/)
  assert.match(source, /ogDescription:/)
  assert.match(source, /metaKeywords:/)
  assert.match(source, /relatedSlugs:/)
  assert.match(source, /'05-access-rights'/)
  assert.match(source, /'06-airtable-control'/)
  assert.match(source, /'14-forms'/)
  assert.match(source, /'12-ai-prototype-rewrite'/)
})

test('article #13 separates API limitations and renders optional lists', () => {
  assert.ok(article13, 'article #13 should exist in knowledgeBase.ts')
  const source = article13[0]

  assert.match(source, /limitationsList:/)
  assert.match(source, /не универсальный стандарт вроде REST с OpenAPI-спецификацией/)
  assert.match(source, /двусторонняя синхронизация/)
  assert.match(source, /событийные вебхуки в реальном времени/)
  assert.match(source, /инкрементальную выгрузку/)
  assert.match(kbArticlePage, /article\.limitationsList/)
  assert.match(kbArticlePage, /article\.flowDiagram/)
})
