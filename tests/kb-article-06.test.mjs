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

function extractArticleBlock(slug) {
  const re = new RegExp(
    `slug: '${slug}'[\\s\\S]*?sourceUrl: \`\\$\\{'https://github.com/ideav/crm/blob/main/docs/integram-article-reviews'\\}/${slug}\\.md\`,`,
  )
  const match = kbDataSource.match(re)
  assert.ok(match, `article ${slug} block should be present`)
  return match[0]
}

test('article #06 keeps the SaaS-vs-own-perimeter context aligned with the source', () => {
  const block = extractArticleBlock('06-airtable-control')
  assert.match(block, /Airtable — облачный конструктор баз данных/)
  assert.match(block, /государственные структуры, медицина, юридические компании, банки/)
  assert.match(block, /Эта статья — не про «что лучше»/)
})

test('article #06 enumerates the concrete 60-user scenario with Airtable limits', () => {
  const block = extractArticleBlock('06-airtable-control')
  assert.match(block, /scenario:\s*\{[\s\S]*?symptoms:/)
  assert.match(block, /около 60 пользователей в системе учёта/)
  assert.match(block, /1 000 записей на базу/)
  assert.match(block, /Team — 50 000, на Business — 125 000/)
  assert.match(block, /Стоимость на пользователя/)
  assert.match(block, /Привязка к вендору/)
})

test('article #06 explains six Integram differences with detailed bodies', () => {
  const block = extractArticleBlock('06-airtable-control')
  assert.match(block, /integramDifferenceDetailed:/)
  assert.match(block, /Размещение на собственных серверах/)
  assert.match(block, /Без тарифного потолка на записи и файлы/)
  assert.match(block, /Открытый HTTP\/JSON-API/)
  assert.match(block, /HTML-шаблоны как первый класс интерфейса/)
  assert.match(block, /Импорт и экспорт без зависимости от тарифа/)
  assert.match(block, /Права без привязки к внешнему workspace/)
})

test('article #06 documents the operational tradeoff in limitations', () => {
  const block = extractArticleBlock('06-airtable-control')
  assert.match(block, /Самостоятельное развёртывание требует инфраструктуры/)
  assert.match(block, /мониторинг, резервные копии, обновления/)
  assert.match(block, /marketplace готовых расширений/)
  assert.match(block, /limitationsNote:/)
})

test('article #06 ships per-article SEO metaDescription and metaKeywords', () => {
  const block = extractArticleBlock('06-airtable-control')
  assert.match(block, /metaDescription:/)
  assert.match(block, /metaKeywords:/)
  assert.match(block, /собственных серверах компании/)
  assert.match(block, /airtable альтернатива/)
})

test('article #06 lists Airtable pricing sources for fact-checking', () => {
  const block = extractArticleBlock('06-airtable-control')
  assert.match(block, /sources:\s*\[/)
  assert.match(block, /https:\/\/www\.airtable\.com\/pricing/)
  assert.match(block, /https:\/\/support\.airtable\.com\/docs\/en\/airtable-plans/)
})

test('article #06 links to related knowledge-base articles', () => {
  const block = extractArticleBlock('06-airtable-control')
  const related = block.match(/relatedSlugs:\s*\[([\s\S]*?)\]/)
  assert.ok(related, 'article #06 should declare relatedSlugs')
  const list = related[1]
  assert.match(list, /'15-local-control-files'/)
  assert.match(list, /'08-html-templates'/)
  assert.match(list, /'13-api-json-export'/)
  assert.match(list, /'05-access-rights'/)
})

test('article page renders dynamic SEO, scenario, sources, and related sections used by article #06', () => {
  assert.match(kbArticlePage, /meta\[name="description"\]/)
  assert.match(kbArticlePage, /meta\[property="og:title"\]/)
  assert.match(kbArticlePage, /meta\[property="og:description"\]/)
  assert.match(kbArticlePage, /meta\[property="og:url"\]/)
  assert.match(kbArticlePage, /meta\[name="twitter:card"\]/)
  assert.match(kbArticlePage, /link\[rel="canonical"\]/)
  assert.match(kbArticlePage, /Конкретный сценарий/)
  assert.match(kbArticlePage, /Источники/)
  assert.match(kbArticlePage, /Смежные статьи/)
  assert.match(kbArticlePage, /article\.integramDifferenceDetailed/)
  assert.match(kbArticlePage, /article\.limitationsNote/)
})
