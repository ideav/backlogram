// issue #719 (тема 12 контент-плана) — статья базы знаний № 31
// «Обвязки вокруг 1С: что выносить в отдельную систему».
//
// Проверяем, что статья на месте, держит разделение «1С — учётное ядро,
// оперативный слой — отдельная база с обменом», честные ограничения (второй
// источник данных, нет коробочного коннектора, 1С не заменяется), опорный
// публичный кейс по резке рулонов без названий клиентов; попадание в группу,
// sitemap, llms.txt, OG и обратные ссылки из соседних статей.

import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { test } from 'node:test'

const kbDataSource = readFileSync(
  new URL('../src/data/knowledgeBase.ts', import.meta.url),
  'utf8',
)
const sitemap = readFileSync(new URL('../public/sitemap.xml', import.meta.url), 'utf8')
const llms = readFileSync(new URL('../public/llms.txt', import.meta.url), 'utf8')
const SLUG = '31-1c-wrappers'

function extractArticleBlock(slug) {
  const start = kbDataSource.indexOf(`slug: '${slug}'`)
  assert.notEqual(start, -1, `article ${slug} block should be present`)
  const sourceUrl = kbDataSource.indexOf('sourceUrl:', start)
  assert.notEqual(sourceUrl, -1, `article ${slug} should declare sourceUrl`)
  const end = kbDataSource.indexOf('\n  },', sourceUrl)
  assert.notEqual(end, -1, `article ${slug} block should close after sourceUrl`)
  return kbDataSource.slice(start, end)
}

test('article #31 publishes the 1C-wrappers article', () => {
  const block = extractArticleBlock(SLUG)

  assert.match(block, /number: '31'/)
  assert.match(block, /Обвязки вокруг 1С/)
  assert.match(block, /publishedAt: '2026-10-29'/)
  assert.match(block, /sourceUrl: 'https:\/\/github\.com\/ideav\/backlogram\/issues\/719'/)
})

test('article #31 keeps the split: учётное ядро в 1С, оперативный слой отдельно', () => {
  const block = extractArticleBlock(SLUG)

  assert.match(block, /бухгалтерия, склад/)
  assert.match(block, /регламентированн/)
  assert.match(block, /производственные задания/)
  assert.match(block, /согласования/)
  assert.match(block, /полевые пульты/)
  assert.match(block, /обмен/i)
  assert.match(block, /по API и JSON/)
  assert.match(block, /учёт заявок отдельно от 1С/)
  assert.match(block, /доработка 1С или отдельная система|Доработка 1С против отдельной/)
})

test('article #31 states the honest limits and when to extend 1C itself', () => {
  const block = extractArticleBlock(SLUG)

  assert.match(block, /второй источник данных/i)
  assert.match(block, /Коробочного коннектора/)
  assert.match(block, /доработка самой 1С проще и надёжнее/)
  assert.match(block, /остаются в 1С/)
  assert.match(block, /не заменяет|Нет\. Бухгалтерия/)
})

test('article #31 uses the public roll-cutting case and mentions the AI chat', () => {
  const block = extractArticleBlock(SLUG)

  assert.match(block, /keis-masterskaya-rezki-rulonov-perestala-teryat-zakazy/)
  assert.match(block, /резк[ие] рулонов/)
  assert.match(block, /ИИ-чат/)
  assert.match(block, /'11-ai-interface-data-safety'/)
  assert.match(block, /'27-text-to-sql-russian'/)
  // клиентов не называем
  assert.doesNotMatch(block, /Андрей/)
})

test('article #31 has FAQ, flowDiagram, scenario and the comparison table', () => {
  const block = extractArticleBlock(SLUG)

  assert.match(block, /faq: \[/)
  assert.match(block, /question: 'Как вести учёт заявок отдельно от 1С\?'/)
  assert.match(block, /flowDiagram:/)
  assert.match(block, /scenario:/)
  assert.match(block, /comparisonTable:/)
  assert.match(block, /integramScenario:/)
})

test('article #31 is grouped, sitemapped, listed in llms.txt, has an OG card and backlinks', () => {
  const prerenderSource = readFileSync(
    new URL('../scripts/prerender-knowledge-base.mjs', import.meta.url),
    'utf8',
  )

  const group = prerenderSource.slice(
    prerenderSource.indexOf("'10-no-release-changes'"),
    prerenderSource.indexOf('Бизнес-практика no-code'),
  )
  assert.match(group, /'31-1c-wrappers'/)
  assert.match(sitemap, /knowledge-base\/31-1c-wrappers\.html/)
  assert.match(llms, /knowledge-base\/31-1c-wrappers\.html/)
  assert.ok(
    existsSync(new URL('../public/og/31-1c-wrappers.png', import.meta.url)),
    'expected public/og/31-1c-wrappers.png to be committed',
  )
  for (const neighbour of ['13-api-json-export', '27-text-to-sql-russian']) {
    const nb = extractArticleBlock(neighbour)
    assert.match(nb, /'31-1c-wrappers'/, `${neighbour} should link back to №31`)
  }
})
