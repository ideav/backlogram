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
  assert.match(block, /Инструменты бережливого производства: справочник «потеря → инструмент → как устроен»/)
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

// Пост и статья не конкурируют за один запрос: блог — введение и кейсы,
// база знаний — справочник инструментов. Заголовки разные, ссылки идут
// в обе стороны с анкорами, которые называют назначение страницы.
const frontmatter = (field) => post.match(new RegExp(`^${field}: '([^']*)'$`, 'm'))?.[1]
const kbField = (field) => extractArticleBlock(SLUG).match(new RegExp(`\\n    ${field}: '([^']*)'`))?.[1]

test('blog post and article #35 split intent: intro and cases vs reference', () => {
  const postSeo = frontmatter('seoTitle')
  const kbSeo = kbField('seoTitle')
  assert.ok(postSeo && kbSeo)
  assert.notEqual(`${postSeo} — Интеграм`, kbSeo, 'titles must differ')
  assert.match(postSeo, /что это|простыми словами/)
  assert.match(postSeo, /пример/)
  assert.doesNotMatch(postSeo, /инструмент/i, 'the post does not target the tools query')
  assert.match(kbSeo, /^Инструменты бережливого производства: справочник/)
  assert.ok(kbSeo.length <= 60, 'prerender keeps seoTitle only up to 60 chars')
  assert.match(kbField('shortTitle'), /^Инструменты бережливого производства$/)
  // таблица «потеря → инструмент» живёт только в справочнике
  assert.doesNotMatch(post, /^\| Инструмент Lean \|/m)
  // вопрос «что такое… простыми словами» — интент поста, не справочника
  assert.doesNotMatch(extractArticleBlock(SLUG), /question: 'Что такое бережливое производство/)
})

test('blog post and article #35 link each other with descriptive anchors', () => {
  const kbLinks = [...post.matchAll(/\[([^\]]+)\]\(https:\/\/ideav\.ru\/knowledge-base\/35-lean-manufacturing-tools\.html\)/g)]
  assert.ok(kbLinks.length >= 2, 'post links the reference in the intro and before the next steps')
  for (const [, anchor] of kbLinks) {
    assert.match(anchor, /справочник/i, `anchor «${anchor}» should name the reference`)
    assert.match(anchor, /инструмент/i)
  }
  assert.match(frontmatter('  secondaryLabel'), /Справочник инструментов/)
  const block = extractArticleBlock(SLUG)
  const source = block.slice(block.indexOf('sources:'))
  assert.match(
    source,
    /title: 'Бережливое производство \(Lean\) простыми словами: [^']*примеры[^']*',\n\s+url: 'https:\/\/ideav\.ru\/blog\/posts\/berezhlivoe-proizvodstvo-lean-instrumenty\/'/,
  )
  assert.match(source, /note: 'Введение в Lean/)
  const titleInPost = frontmatter('title')
  assert.ok(source.includes(`title: '${titleInPost}'`), 'source anchor matches the post title')
  // краулер видит пререндер, а не SPA: источники (и ссылка на пост) должны быть в нём
  const prerender = readFileSync(new URL('../scripts/prerender-knowledge-base.mjs', import.meta.url), 'utf8')
  assert.match(prerender, /<h2>Источники<\/h2>/)
  assert.match(prerender, /\$\{sourcesHtml\}/)
})
