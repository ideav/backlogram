// issue #895 — статья базы знаний № 35 «Бережливое производство» и пост блога.
//
// Проверяем, что статья на месте, держит главные тезисы (Lean для Lean,
// инструменты под потери, цифры кейса), честные ограничения и обвязку:
// группа, sitemap, llms.txt, OG, соседи, пост блога с ключевыми словами.

import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { test } from 'node:test'

const kbDataSource = readFileSync(new URL('../src/data/knowledgeBase.ts', import.meta.url), 'utf8')
const sitemap = readFileSync(new URL('../public/sitemap.xml', import.meta.url), 'utf8')
const llms = readFileSync(new URL('../public/llms.txt', import.meta.url), 'utf8')
const post = readFileSync(
  new URL('../blog-v2/src/content/posts/berezhlivoe-proizvodstvo-lean-instrumenty.md', import.meta.url),
  'utf8',
)
const SLUG = '35-lean-manufacturing-tools'

function extractArticleBlock(slug) {
  const start = kbDataSource.indexOf(`slug: '${slug}'`)
  assert.notEqual(start, -1, `article ${slug} block should be present`)
  const sourceUrl = kbDataSource.indexOf('sourceUrl:', start)
  assert.notEqual(sourceUrl, -1, `article ${slug} should declare sourceUrl`)
  const end = kbDataSource.indexOf('\n  },', sourceUrl)
  assert.notEqual(end, -1, `article ${slug} block should close after sourceUrl`)
  return kbDataSource.slice(start, end)
}

test('article #35 publishes the lean manufacturing article', () => {
  const block = extractArticleBlock(SLUG)
  assert.match(block, /number: '35'/)
  assert.match(block, /Бережливое производство: цифровые инструменты Lean под процесс цеха/)
  assert.match(block, /publishedAt: '2026-11-07'/)
  assert.match(block, /sourceUrl: 'https:\/\/github\.com\/ideav\/backlogram\/issues\/895'/)
})

test('article #35 targets the lean keywords', () => {
  const block = extractArticleBlock(SLUG)
  for (const keyword of ['бережливое производство', 'lean manufacturing', 'lean production']) {
    const keywords = block.slice(block.indexOf("metaKeywords:"), block.indexOf("summary:"))
    assert.ok(keywords.includes(keyword), `metaKeywords should include ${keyword}`)
  }
})

test('article #35 keeps the core theses', () => {
  const block = extractArticleBlock(SLUG)
  assert.match(block, /на порядок ниже/)
  assert.match(block, /за три минуты вместо двух-трёх дней/)
  assert.match(block, /97% заказов/)
  assert.match(block, /нож 30, вал 60/)
  assert.match(block, /'Инструмент Lean', 'Какую потерю убирает', 'Как устроен в Интеграме'/)
})

test('article #35 keeps honest limits', () => {
  const block = extractArticleBlock(SLUG)
  assert.match(block, /Софт не делает завод бережливым/)
  assert.match(block, /вносит оператор/)
  assert.match(block, /остаются в 1С/)
})

test('article #35 is wired into the index, sitemap, llms.txt, OG and neighbours', () => {
  const prerender = readFileSync(new URL('../scripts/prerender-knowledge-base.mjs', import.meta.url), 'utf8')
  assert.match(prerender, new RegExp(`'${SLUG}'`))
  assert.match(sitemap, new RegExp(`knowledge-base/${SLUG}\\.html`))
  assert.match(llms, new RegExp(`knowledge-base/${SLUG}\\.html`))
  assert.ok(existsSync(new URL(`../public/og/${SLUG}.png`, import.meta.url)), `expected public/og/${SLUG}.png`)
  for (const neighbour of ['31-1c-wrappers', '32-erp-customization']) {
    assert.match(extractArticleBlock(neighbour), new RegExp(`'${SLUG}'`), `${neighbour} should link back to №35`)
  }
})

test('blog post on lean manufacturing is published today and links the article', () => {
  assert.match(post, /^pubDate: '2026-11-07'$/m)
  assert.match(post, /^image: \/uploads\/berezhlivoe-proizvodstvo-cover\.png$/m)
  assert.match(post, /lean manufacturing, lean production/)
  assert.match(post, new RegExp(`knowledge-base/${SLUG}\\.html`))
  assert.doesNotMatch(post, /atex|ateh|Атех|Андрей/i, 'clients stay anonymous')
  assert.ok(existsSync(new URL('../blog-v2/public/uploads/berezhlivoe-proizvodstvo-cover.png', import.meta.url)))
})
