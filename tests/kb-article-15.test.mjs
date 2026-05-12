import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'

const kbDataSource = readFileSync(
  new URL('../src/data/knowledgeBase.ts', import.meta.url),
  'utf8',
)

function extractArticleBlock(slug) {
  const re = new RegExp(
    `slug: '${slug}'[\\s\\S]*?sourceUrl: \`\\$\\{'https://github.com/ideav/crm/blob/main/docs/integram-article-reviews'\\}/${slug}\\.md\`,\\n(?:[\\s\\S]*?relatedSlugs:[\\s\\S]*?\\],\\n)?`,
  )
  const match = kbDataSource.match(re)
  assert.ok(match, `article ${slug} block should be present`)
  return match[0]
}

test('article #15 mirrors the source scenario about local control requirements', () => {
  const block = extractArticleBlock('15-local-control-files')

  assert.match(block, /scenario:\s*\{[\s\S]*?symptoms:/)
  assert.match(block, /Проектное бюро на 40 человек/)
  assert.match(block, /данные не должны покидать контур организации/)
  assert.match(block, /где физически хранятся данные/)
  assert.match(block, /что происходит с данными при прекращении подписки/)
})

test('article #15 keeps five detailed Integram control advantages', () => {
  const block = extractArticleBlock('15-local-control-files')

  assert.match(block, /integramDifferenceDetailed:/)
  assert.match(block, /Локальное развёртывание/)
  assert.match(block, /Файловая система базы/)
  assert.match(block, /Роли и маски/)
  assert.match(block, /Шаблоны через Git/)
  assert.match(block, /Отключение от интернета/)
})

test('article #15 ships page-specific SEO and related article links', () => {
  const block = extractArticleBlock('15-local-control-files')

  assert.match(block, /seoTitle:/)
  assert.match(block, /seoDescription:/)
  assert.match(block, /ogTitle:/)
  assert.match(block, /ogDescription:/)
  assert.match(block, /metaKeywords:/)

  const related = block.match(/relatedSlugs:\s*\[([\s\S]*?)\]/)
  assert.ok(related, 'article #15 should declare relatedSlugs')
  const list = related[1]
  assert.match(list, /'05-access-rights'/)
  assert.match(list, /'08-html-templates'/)
  assert.match(list, /'13-api-json-export'/)
  assert.match(list, /'14-forms'/)
  assert.match(list, /'14a-reports'/)
  assert.match(list, /'14b-dashboards'/)
  assert.doesNotMatch(list, /'14-forms-reports-dashboards'/)
})
