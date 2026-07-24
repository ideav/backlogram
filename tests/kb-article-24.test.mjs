import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { test } from 'node:test'

const kbDataSource = readFileSync(
  new URL('../src/data/knowledgeBase.ts', import.meta.url),
  'utf8',
)
const prerenderSource = readFileSync(
  new URL('../scripts/prerender-knowledge-base.mjs', import.meta.url),
  'utf8',
)
const sitemap = readFileSync(new URL('../public/sitemap.xml', import.meta.url), 'utf8')
const llms = readFileSync(new URL('../public/llms.txt', import.meta.url), 'utf8')
const post = readFileSync(
  new URL('../blog-v2/src/content/posts/pure-business-design-chistoe-biznes-proektirovanie.md', import.meta.url),
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

test('article #24 publishes the Pure Business Design article', () => {
  const block = extractArticleBlock('24-pure-business-design')

  assert.match(block, /number: '24'/)
  assert.match(block, /Pure Business Design/)
  assert.match(block, /чистое бизнес-проектирование/i)
})

test('article #24 contrasts both alternatives: visual builders and human-in-the-loop', () => {
  const block = extractArticleBlock('24-pure-business-design')

  assert.match(block, /визуальн/i)
  assert.match(block, /конструктор/i)
  assert.match(block, /human-in-the-loop/)
  assert.match(block, /вайб?кодинг/i)
  // ключевой тезис: на выходе сервис, а не исходники
  assert.match(block, /исходн/i)
})

test('article #24 describes the full agent cycle as steps', () => {
  const block = extractArticleBlock('24-pure-business-design')

  assert.match(block, /integramScenario:/)
  assert.match(block, /структур[а-яё]+ базы/i)
  assert.match(block, /рол[а-яё]+ (модель|и права)/i)
  assert.match(block, /меню/)
  assert.match(block, /шаблон/i)
})

test('article #24 keeps the technical facts from the launch publication', () => {
  const block = extractArticleBlock('24-pure-business-design')

  assert.match(block, /QDM/)
  assert.match(block, /id, up, t, val, ord/)
  assert.match(block, /32 млрд/)
  assert.match(block, /30872/)
  assert.match(block, /Excel to App/)
})

test('article #24 states its limits honestly', () => {
  const block = extractArticleBlock('24-pure-business-design')

  assert.match(block, /limitationsList:/)
  assert.match(block, /метрик/i)
  assert.match(block, /Oracle APEX/)
})

test('article #24 links related articles and cites the launch publication', () => {
  const block = extractArticleBlock('24-pure-business-design')

  assert.match(block, /'19-ai-agent-app-build'/)
  assert.match(block, /'22-information-system-constructor'/)
  assert.match(block, /'12-ai-prototype-rewrite'/)
  assert.match(block, /'08a-vibe-coding-templates'/)
  assert.match(block, /tadviser\.ru/)
  assert.match(block, /sourceUrl: 'https:\/\/github\.com\/ideav\/backlogram\/issues\/490'/)
})

test('article #24 is grouped, sitemapped, listed in llms.txt and has an OG card', () => {
  assert.match(prerenderSource, /'24-pure-business-design'/)
  assert.match(sitemap, /knowledge-base\/24-pure-business-design\.html/)
  assert.match(llms, /knowledge-base\/24-pure-business-design\.html/)
  assert.ok(
    existsSync(new URL('../public/og/24-pure-business-design.png', import.meta.url)),
    'expected public/og/24-pure-business-design.png to be committed',
  )
})

test('the companion blog post is published and points at the knowledge-base article', () => {
  assert.match(post, /^title: "Pure Business Design/m)
  assert.match(post, /^pubDate: 2026-07-24$/m)
  assert.match(post, /^category: "О платформе"$/m)
  assert.doesNotMatch(post, /^draft:\s*true/m)
  assert.doesNotMatch(post, /^canonical:/m)
  assert.match(post, /tadviser\.ru/)
  assert.match(post, /knowledge-base\/24-pure-business-design\.html/)
})
