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

const article11 = kbDataSource.match(
  /slug: '11-ai-interface-data-safety'[\s\S]*?sourceUrl:[\s\S]*?11-ai-interface-data-safety\.md`,\n(?:[\s\S]*?relatedSlugs:[\s\S]*?\],\n)?  \}/,
)

test('article #11 mirrors the source scenario about service requests', () => {
  assert.ok(article11, 'article #11 should exist in knowledgeBase.ts')
  const source = article11[0]

  assert.match(source, /scenario:/)
  assert.match(source, /Команда из 12 человек ведёт заявки на ремонт оборудования/)
  assert.match(source, /где хранятся данные и как делать резервную копию/)
  assert.match(source, /кто имеет право видеть чужие заявки и редактировать их/)
  assert.match(source, /что происходит при одновременном редактировании одной записи/)
  assert.match(source, /подключить нового подрядчика с доступом только к своим заявкам/)
  assert.match(source, /кто будет поддерживать этот код, если автор сменит работу/)
})

test('article #11 keeps the platform-vs-interface structure from the source', () => {
  assert.ok(article11, 'article #11 should exist in knowledgeBase.ts')
  const source = article11[0]

  assert.match(source, /integramDifferenceDetailed:/)
  assert.match(source, /Данные — в платформе/)
  assert.match(source, /Права — в платформе/)
  assert.match(source, /Роль ИИ — интерфейс/)
  assert.match(source, /Поддержка/)
  assert.match(source, /Шаблон подключается к данным через отчёт или API Интеграма/)
})

test('article #11 has page-specific SEO copy and related article links', () => {
  assert.ok(article11, 'article #11 should exist in knowledgeBase.ts')
  const source = article11[0]

  assert.match(source, /seoTitle:/)
  assert.match(source, /seoDescription:/)
  assert.match(source, /relatedSlugs:/)
  assert.match(source, /'12-ai-prototype-rewrite'/)
  assert.match(source, /'08-html-templates'/)
  assert.match(source, /'05-access-rights'/)
  assert.match(source, /'10-no-release-changes'/)
})

test('article page renders detailed differences used by article #11', () => {
  assert.match(kbArticlePage, /differenceDetailed/)
  assert.match(kbArticlePage, /item\.title/)
  assert.match(kbArticlePage, /item\.body/)
})
