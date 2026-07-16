import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'

const kbDataSource = readFileSync(
  new URL('../src/data/knowledgeBase.ts', import.meta.url),
  'utf8',
)
const prerenderSource = readFileSync(
  new URL('../scripts/prerender-knowledge-base.mjs', import.meta.url),
  'utf8',
)
const sitemap = readFileSync(
  new URL('../public/sitemap.xml', import.meta.url),
  'utf8',
)
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

test('article #23 publishes the security and fault-tolerance article', () => {
  const block = extractArticleBlock('23-security-fault-tolerance')

  assert.match(block, /number: '23'/)
  assert.match(block, /Безопасность и отказоустойчивость/)
  assert.match(block, /крупн/i)
})

test('article #23 covers the two client worries: outsiders and data loss', () => {
  const block = extractArticleBlock('23-security-fault-tolerance')

  assert.match(block, /от посторонних/)
  assert.match(block, /от потери/)
  assert.match(block, /Защита от посторонних/)
  assert.match(block, /Защита от потери/)
})

test('article #23 explains ordinary-DB techniques and flexible topology', () => {
  const block = extractArticleBlock('23-security-fault-tolerance')

  assert.match(block, /реляционн[а-яё]* (СУБД|баз)/i)
  assert.match(block, /шифрован/)
  assert.match(block, /георезервирован/)
  assert.match(block, /on-premise/)
  assert.match(block, /Yandex Cloud/)
  assert.match(block, /VK Cloud/)
  assert.match(block, /гибрид/i)
})

test('article #23 makes the no-lock-in / export escape-hatch argument', () => {
  const block = extractArticleBlock('23-security-fault-tolerance')

  assert.match(block, /вендор-лок/)
  assert.match(block, /Excel/)
  assert.match(block, /просмотрщик/)
  assert.match(block, /перестан[а-яё]+ (работать|существовать)/)
})

test('article #23 links related knowledge-base articles and cites its source', () => {
  const block = extractArticleBlock('23-security-fault-tolerance')

  assert.match(block, /relatedSlugs:/)
  assert.match(block, /'05-access-rights'/)
  assert.match(block, /'15-local-control-files'/)
  assert.match(block, /'18-on-premise-procurement'/)
  assert.match(block, /'13-api-json-export'/)
  assert.match(block, /sourceUrl: 'https:\/\/github\.com\/ideav\/backlogram\/issues\/426'/)
})

test('access-rights article links back to the security article', () => {
  const article05 = kbDataSource.match(
    /slug: '05-access-rights'[\s\S]*?relatedSlugs:\s*\[([\s\S]*?)\]/,
  )
  assert.ok(article05, 'article #05 should declare relatedSlugs')
  assert.match(article05[1], /'23-security-fault-tolerance'/)
})

test('article #23 is grouped, sitemapped and listed in llms.txt', () => {
  assert.match(prerenderSource, /'23-security-fault-tolerance'/)
  assert.match(sitemap, /knowledge-base\/23-security-fault-tolerance\.html/)
  assert.match(llms, /knowledge-base\/23-security-fault-tolerance\.html/)
})
