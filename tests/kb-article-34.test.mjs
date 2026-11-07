// issue #719, тема 14 — статья базы знаний № 34 «Безопасность MCP».
//
// Проверяем, что статья на месте, держит главные тезисы (токен от пользователя,
// права не шире роли, галки и срок, запрет удаления структуры, журнал ~ai),
// честные ограничения и обвязку: группа, sitemap, llms.txt, OG, соседи.

import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { test } from 'node:test'

const kbDataSource = readFileSync(new URL('../src/data/knowledgeBase.ts', import.meta.url), 'utf8')
const sitemap = readFileSync(new URL('../public/sitemap.xml', import.meta.url), 'utf8')
const llms = readFileSync(new URL('../public/llms.txt', import.meta.url), 'utf8')
const SLUG = '34-mcp-security-agent-permissions'

function extractArticleBlock(slug) {
  const start = kbDataSource.indexOf(`slug: '${slug}'`)
  assert.notEqual(start, -1, `article ${slug} block should be present`)
  const sourceUrl = kbDataSource.indexOf('sourceUrl:', start)
  assert.notEqual(sourceUrl, -1, `article ${slug} should declare sourceUrl`)
  const end = kbDataSource.indexOf('\n  },', sourceUrl)
  assert.notEqual(end, -1, `article ${slug} block should close after sourceUrl`)
  return kbDataSource.slice(start, end)
}

test('article #34 publishes the MCP security article', () => {
  const block = extractArticleBlock(SLUG)
  assert.match(block, /number: '34'/)
  assert.match(block, /Безопасность MCP: какие действия можно открывать ИИ-агенту/)
  assert.match(block, /publishedAt: '2026-11-07'/)
  assert.match(block, /sourceUrl: 'https:\/\/github\.com\/ideav\/backlogram\/issues\/719'/)
})

test('article #34 keeps the core theses', () => {
  const block = extractArticleBlock(SLUG)
  assert.match(block, /токеном конкретного пользователя/)
  assert.match(block, /права не шире/)
  assert.match(block, /от 1 до 90 дней/)
  assert.match(block, /удалить колонку или таблицу через удалённый MCP нельзя/)
  assert.match(block, /пометкой ~ai/)
  assert.match(block, /'Действие', 'Когда открывать', 'Как ограничить'/)
})

test('article #34 keeps honest limits', () => {
  const block = extractArticleBlock(SLUG)
  assert.match(block, /уходит поставщику языковой модели/)
  assert.match(block, /Промпт-инъекции/)
  assert.match(block, /маски роли к ним не применяются/)
  assert.match(block, /делает клиент, а не сервер/)
  assert.match(block, /Супер-пользователь базы обходит гранты/)
  assert.match(block, /переходном режиме/)
})

test('article #34 is wired into the index, sitemap, llms.txt, OG and neighbours', () => {
  const prerender = readFileSync(new URL('../scripts/prerender-knowledge-base.mjs', import.meta.url), 'utf8')
  assert.match(prerender, new RegExp(`'${SLUG}'`))
  assert.match(sitemap, new RegExp(`knowledge-base/${SLUG}\\.html`))
  assert.match(llms, new RegExp(`knowledge-base/${SLUG}\\.html`))
  assert.ok(existsSync(new URL(`../public/og/${SLUG}.png`, import.meta.url)), `expected public/og/${SLUG}.png`)
  for (const neighbour of ['26-mcp-server-explained', '05-access-rights']) {
    assert.match(extractArticleBlock(neighbour), new RegExp(`'${SLUG}'`), `${neighbour} should link back to №34`)
  }
})
