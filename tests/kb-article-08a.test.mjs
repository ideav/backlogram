import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'

const kbDataSource = readFileSync(
  new URL('../src/data/knowledgeBase.ts', import.meta.url),
  'utf8',
)

function extractArticleBlock(slug) {
  const re = new RegExp(
    `slug: '${slug}'[\\s\\S]*?sourceUrl: \`\\$\\{'https://github.com/ideav/crm/blob/main/docs/integram-article-reviews'\\}/[^\`]+\\.md\`,`,
  )
  const match = kbDataSource.match(re)
  assert.ok(match, `article ${slug} block should be present`)
  return match[0]
}

test('article #08a documents vibe-coding of HTML templates for main.html', () => {
  const block = extractArticleBlock('08a-vibe-coding-templates')
  assert.match(block, /number: '08a'/)
  assert.match(block, /Вайб-кодинг/)
  assert.match(block, /main\.html/)
  assert.match(block, /templates\//)
  assert.match(block, /<!-- File: a -->/)
})

test('article #08a includes a ready-to-use AI prompt with key Integram rules', () => {
  const block = extractArticleBlock('08a-vibe-coding-templates')
  assert.match(block, /Промпт для ИИ/)
  assert.match(block, /\{ИмяПоля\}/)
  assert.match(block, /Begin:ИмяБлока/)
  assert.match(block, /End:ИмяБлока/)
  assert.match(block, /report\/\{ID\}\?JSON_KV/)
  assert.match(block, /без npm и сборки/)
})

test('article #08a enumerates concrete cases from ideav/crm closed issues', () => {
  const block = extractArticleBlock('08a-vibe-coding-templates')
  assert.match(block, /funnel\.html/)
  assert.match(block, /struct\.html/)
  assert.match(block, /table\.html/)
  assert.match(block, /dash\.html/)
  assert.match(block, /gssync\.html/)
  assert.match(block, /Leaflet/)
  assert.match(block, /A4/)
})

test('article #08a links back to article #08 and other related articles', () => {
  const block = extractArticleBlock('08a-vibe-coding-templates')
  const related = block.match(/relatedSlugs:\s*\[([\s\S]*?)\]/)
  assert.ok(related, 'article #08a should declare relatedSlugs')
  const list = related[1]
  assert.match(list, /'08-html-templates'/)
  assert.match(list, /'11-ai-interface-data-safety'/)
  assert.match(list, /'12-ai-prototype-rewrite'/)
  assert.match(list, /'15-local-control-files'/)
})

test('article #08a ships its own SEO metadata fields', () => {
  const block = extractArticleBlock('08a-vibe-coding-templates')
  assert.match(block, /seoTitle:/)
  assert.match(block, /seoDescription:/)
  assert.match(block, /ogTitle:/)
  assert.match(block, /ogDescription:/)
  assert.match(block, /metaDescription:/)
  assert.match(block, /metaKeywords:/)
  assert.match(block, /вайб-кодинг/)
})

test('article #08a cites the ideav/crm issues referenced in the issue description', () => {
  const block = extractArticleBlock('08a-vibe-coding-templates')
  assert.match(block, /github\.com\/ideav\/crm\/issues\/2109/)
  assert.match(block, /github\.com\/ideav\/crm\/issues\/2091/)
  assert.match(block, /github\.com\/ideav\/crm\/issues\/2061/)
  assert.match(
    block,
    /github\.com\/ideav\/crm\/issues\?q=is%3Aissue%20state%3Aclosed%20main\.html/,
  )
})

test('article #08 links to the new vibe-coding sub-article', () => {
  const article08 = kbDataSource.match(
    /slug: '08-html-templates'[\s\S]*?relatedSlugs:\s*\[([\s\S]*?)\]/,
  )
  assert.ok(article08, 'article #08 should declare relatedSlugs')
  assert.match(article08[1], /'08a-vibe-coding-templates'/)
})
