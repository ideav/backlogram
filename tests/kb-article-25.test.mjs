// issue #565 — статья базы знаний № 25 «План, который помнит факт».
//
// Материал — из реального дефекта планирования производства (ideav/crm#4885,
// исправление ideav/crm#4895): выполненная наладка терялась при урегулировании
// на следующий день. Проверяем, что статья на месте, держит ключевые тезисы
// (сохранность сделанного, независимость от момента нажатия), ссылается на
// первоисточники, спутована с блог-постом и попадает в sitemap/llms.txt/OG.

import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { test } from 'node:test'

const kbDataSource = readFileSync(
  new URL('../src/data/knowledgeBase.ts', import.meta.url),
  'utf8',
)
const sitemap = readFileSync(new URL('../public/sitemap.xml', import.meta.url), 'utf8')
const llms = readFileSync(new URL('../public/llms.txt', import.meta.url), 'utf8')
const post = readFileSync(
  new URL('../blog-v2/src/content/posts/plan-pomnit-naladku.md', import.meta.url),
  'utf8',
)

function extractArticleBlock(slug) {
  const start = kbDataSource.indexOf(`slug: '${slug}'`)
  assert.notEqual(start, -1, `article ${slug} block should be present`)
  const sourceUrl = kbDataSource.indexOf('sourceUrl:', start)
  assert.notEqual(sourceUrl, -1, `article ${slug} should declare sourceUrl`)
  const end = kbDataSource.indexOf('\n  },', sourceUrl)
  assert.notEqual(end, -1, `article ${slug} block should close after sourceUrl`)
  return kbDataSource.slice(start, end)
}

test('article #25 publishes the plan-remembers-fact article', () => {
  const block = extractArticleBlock('25-production-plan-fact')

  assert.match(block, /number: '25'/)
  assert.match(block, /План, который помнит факт/)
  assert.match(block, /производствен/i)
})

test('article #25 keeps the two key theses of the fix', () => {
  const block = extractArticleBlock('25-production-plan-fact')

  // сделанная работа не теряется при переносах
  assert.match(block, /наладк/i)
  assert.match(block, /нулевой выработк/i)
  // результат не зависит от момента нажатия
  assert.match(block, /не зависит от того, когда нажали кнопк/i)
  // сходимость «сделано + осталось»
  assert.match(block, /сделано \+ осталось/)
})

test('article #25 describes the flow: факт отмечается, решение за человеком', () => {
  const block = extractArticleBlock('25-production-plan-fact')

  assert.match(block, /flowDiagram:/)
  assert.match(block, /integramScenario:/)
  assert.match(block, /Урегулировать/)
  assert.match(block, /отклонени/i)
  assert.match(block, /решение остаётся за человеком|Решение принимает человек|человек всё равно решает/i)
})

test('article #25 cites the real fix and the companion blog post', () => {
  const block = extractArticleBlock('25-production-plan-fact')

  assert.match(block, /github\.com\/ideav\/crm\/issues\/4885/)
  assert.match(block, /github\.com\/ideav\/crm\/pull\/4895/)
  assert.match(block, /ideav\.ru\/blog\/posts\/plan-pomnit-naladku\//)
  assert.match(block, /sourceUrl: 'https:\/\/github\.com\/ideav\/backlogram\/issues\/565'/)
})

test('article #25 is grouped, sitemapped and listed in llms.txt', () => {
  const prerenderSource = readFileSync(
    new URL('../scripts/prerender-knowledge-base.mjs', import.meta.url),
    'utf8',
  )

  assert.match(prerenderSource, /'25-production-plan-fact'/)
  assert.match(sitemap, /knowledge-base\/25-production-plan-fact\.html/)
  assert.match(llms, /knowledge-base\/25-production-plan-fact\.html/)
  assert.ok(
    existsSync(new URL('../public/og/25-production-plan-fact.png', import.meta.url)),
    'expected public/og/25-production-plan-fact.png to be committed',
  )
})

test('the companion blog post is published and points at the knowledge-base article', () => {
  assert.match(post, /^title: "Вечером план помнил наладку/m)
  assert.match(post, /^pubDate: '2026-09-07'$/m)
  assert.match(post, /^category: "О платформе"$/m)
  assert.doesNotMatch(post, /^draft:\s*true/m)
  assert.doesNotMatch(post, /^canonical:/m)
  assert.match(post, /knowledge-base\/25-production-plan-fact\.html/)
  assert.match(post, /github\.com\/ideav\/crm\/issues\/4885/)
})
