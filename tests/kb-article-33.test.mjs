// issue #845 — статья базы знаний № 33 «Событийная спецификация и онтология».
//
// Проверяем, что статья на месте, держит главные тезисы (онтология — данные,
// процесс — таблица событий, три рода неопределённости, агент решает сам в
// пределах проверок спеки и никогда не решает молча), честные ограничения;
// попадание в группу, sitemap, llms.txt, OG и обратные ссылки соседей.

import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { test } from 'node:test'

const kbDataSource = readFileSync(
  new URL('../src/data/knowledgeBase.ts', import.meta.url),
  'utf8',
)
const sitemap = readFileSync(new URL('../public/sitemap.xml', import.meta.url), 'utf8')
const llms = readFileSync(new URL('../public/llms.txt', import.meta.url), 'utf8')
const SLUG = '33-event-spec-ai-agents'

function extractArticleBlock(slug) {
  const start = kbDataSource.indexOf(`slug: '${slug}'`)
  assert.notEqual(start, -1, `article ${slug} block should be present`)
  const sourceUrl = kbDataSource.indexOf('sourceUrl:', start)
  assert.notEqual(sourceUrl, -1, `article ${slug} should declare sourceUrl`)
  const end = kbDataSource.indexOf('\n  },', sourceUrl)
  assert.notEqual(end, -1, `article ${slug} block should close after sourceUrl`)
  return kbDataSource.slice(start, end)
}

test('article #33 publishes the event-spec article', () => {
  const block = extractArticleBlock(SLUG)

  assert.match(block, /number: '33'/)
  assert.match(block, /Событийная спецификация и онтология/)
  assert.match(block, /publishedAt: '2026-11-02'/)
  assert.match(block, /sourceUrl: 'https:\/\/github\.com\/ideav\/backlogram\/issues\/845'/)
})

test('article #33 keeps the core theses', () => {
  const block = extractArticleBlock(SLUG)

  assert.match(block, /одна строка — одно событие/)
  assert.match(block, /у события нет следующего шага/)
  assert.match(block, /развилка не выбирает ровно один переход/)
  assert.match(block, /данные противоречат друг другу/)
  assert.match(block, /перекрёстные проверки спеки оставляют ровно один вариант/)
  assert.match(block, /никогда не решает молча/)
  assert.match(block, /'Автономный агент с промптом', 'BPMN-схема', 'Событийная спецификация'/)
})

test('article #33 keeps honest limits', () => {
  const block = extractArticleBlock(SLUG)

  assert.match(block, /процесс приходится описать/)
  assert.match(block, /отсекают только то, что в них записано/)
  assert.match(block, /для открытых творческих задач/)
})

test('article #33 is wired into the index, sitemap, llms.txt, OG and neighbours', () => {
  const prerenderSource = readFileSync(
    new URL('../scripts/prerender-knowledge-base.mjs', import.meta.url),
    'utf8',
  )
  assert.match(prerenderSource, /'33-event-spec-ai-agents'/)
  assert.match(sitemap, /knowledge-base\/33-event-spec-ai-agents\.html/)
  assert.match(llms, /knowledge-base\/33-event-spec-ai-agents\.html/)
  assert.ok(
    existsSync(new URL('../public/og/33-event-spec-ai-agents.png', import.meta.url)),
    'expected public/og/33-event-spec-ai-agents.png to be committed',
  )
  for (const neighbour of ['19-ai-agent-app-build', '26-mcp-server-explained']) {
    const nb = extractArticleBlock(neighbour)
    assert.match(nb, /'33-event-spec-ai-agents'/, `${neighbour} should link back to №33`)
  }
})
