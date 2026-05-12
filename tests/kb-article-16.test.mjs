import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'

const kbDataSource = readFileSync(
  new URL('../src/data/knowledgeBase.ts', import.meta.url),
  'utf8',
)

function extractArticleBlock(slug) {
  const re = new RegExp(
    "slug: '" +
      slug +
      "'[\\s\\S]*?sourceUrl: `\\$\\{'https://github.com/ideav/crm/blob/main/docs/integram-article-reviews'\\}/[^`]+\\.md`,",
  )
  const match = kbDataSource.match(re)
  assert.ok(match, `article ${slug} block should be present`)
  return match[0]
}

test('article #16 publishes the token pricing comparison from the source PR', () => {
  const block = extractArticleBlock('16-pricing-policy')

  assert.match(block, /number: '16'/)
  assert.match(block, /Тарифы в токенах, а не «за пользователя»/)
  assert.match(block, /Airtable, Notion и Google Workspace/)
  assert.match(block, /тарифицирует нагрузку/)
  assert.match(block, /16-pricing-policy\.md/)
})

test('article #16 keeps the service company scenario and seat-count contrast', () => {
  const block = extractArticleBlock('16-pricing-policy')

  assert.match(block, /scenario:/)
  assert.match(block, /25 штатных сотрудников/)
  assert.match(block, /100 внешних подрядчиков/)
  assert.match(block, /5 руководителей/)
  assert.match(block, /2 аудитора/)
  assert.match(block, /132 человека/)
  assert.match(block, /14-forms-reports-dashboards/)
})

test('article #16 records the published Integram cloud tariff facts', () => {
  const block = extractArticleBlock('16-pricing-policy')

  assert.match(block, /Знакомство/)
  assert.match(block, /3 000 токенов/)
  assert.match(block, /Стартап/)
  assert.match(block, /1 950 ₽\/мес/)
  assert.match(block, /5 000 токенов/)
  assert.match(block, /Масштабируемый/)
  assert.match(block, /от 4 900 ₽\/мес/)
  assert.match(block, /10 000 токенов/)
  assert.match(block, /каждый следующий пакет на 20% дешевле/)
  assert.match(block, /100 000 токенов/)
  assert.match(block, /21 890 ₽\/мес/)
})

test('article #16 explains the practical differences and limits of token pricing', () => {
  const block = extractArticleBlock('16-pricing-policy')

  assert.match(block, /integramDifferenceDetailed:/)
  assert.match(block, /Оплата за действия, а не за пользователей/)
  assert.match(block, /1 токен ≈ 1 действие/)
  assert.match(block, /Превышение лимита не блокирует работу/)
  assert.match(block, /Собственный контур выводит задачу из SaaS-тарификации/)
  assert.match(block, /limitationsList:/)
  assert.match(block, /тяжёлым импортом/)
  assert.match(block, /SLA/)
  assert.match(block, /Новую метрику нужно объяснить/)
})

test('article #16 has SEO copy, official pricing sources and related article links', () => {
  const block = extractArticleBlock('16-pricing-policy')

  assert.match(block, /seoTitle:/)
  assert.match(block, /seoDescription:/)
  assert.match(block, /ogTitle:/)
  assert.match(block, /ogDescription:/)
  assert.match(block, /sources:/)
  assert.match(block, /https:\/\/ideav\.ru\/start\.html#tarif/)
  assert.match(block, /https:\/\/airtable\.com\/pricing/)
  assert.match(block, /https:\/\/www\.notion\.com\/pricing/)
  assert.match(block, /https:\/\/workspace\.google\.com\/pricing/)
  assert.match(block, /relatedSlugs:/)
  assert.match(block, /'14-forms-reports-dashboards'/)
  assert.match(block, /'15-local-control-files'/)
  assert.match(block, /'06-airtable-control'/)
  assert.match(block, /'13-api-json-export'/)
})
