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

test('article #09 keeps the source scenario about partner requests', () => {
  assert.match(kbDataSource, /slug: '09-custom-development-prototype'/)
  assert.match(
    kbDataSource,
    /Компания принимает заявки от партнёров\. Нужно: форма приёма заявки/,
  )
  assert.match(kbDataSource, /первое демо — выясняется, что в форме не хватает поля «канал заявки»/)
  assert.match(kbDataSource, /процесс продолжает жить в почте, чатах и таблицах/)
})

test('article #09 describes how Integram assembles the same scenario without a contractor', () => {
  assert.match(kbDataSource, /integramScenario:/)
  assert.match(kbDataSource, /Администратор Интеграма повторяет ту же постановку, но без подрядчика/)
  assert.match(kbDataSource, /создаёт таблицу «Заявки»/)
  assert.match(kbDataSource, /выносит рабочее место в меню/)
  assert.match(kbDataSource, /Точка проверки идеи сдвигается раньше/)
})

test('article #09 keeps structured limitations and related knowledge-base links', () => {
  const article09 = kbDataSource.match(
    /slug: '09-custom-development-prototype'[\s\S]*?relatedSlugs:\s*\[([\s\S]*?)\]/,
  )
  assert.ok(article09, 'article #09 should declare relatedSlugs')
  const relatedSlugs = article09[1]

  assert.match(kbDataSource, /limitationsList:/)
  assert.match(kbDataSource, /бизнес-логика требует сложных вычислений и собственного движка правил/)
  assert.match(kbDataSource, /требования регулятора предписывают отдельное архитектурное решение/)
  assert.match(relatedSlugs, /'10-no-release-changes'/)
  assert.match(relatedSlugs, /'12-ai-prototype-rewrite'/)
  assert.match(relatedSlugs, /'14-forms'/)
  assert.match(relatedSlugs, /'14a-reports'/)
  assert.match(relatedSlugs, /'14b-dashboards'/)
  assert.match(relatedSlugs, /'05-access-rights'/)
})

test('article page renders optional Integram scenario and limitations lists', () => {
  assert.match(kbArticlePage, /Тот же сценарий в Интеграме/)
  assert.match(kbArticlePage, /article\.integramScenario/)
  assert.match(kbArticlePage, /article\.limitationsList/)
})
