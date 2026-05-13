import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'

const kbDataSource = readFileSync(
  new URL('../src/data/knowledgeBase.ts', import.meta.url),
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

test('article #17 publishes the smart Google Sheets import article', () => {
  const block = extractArticleBlock('17-smart-google-import')

  assert.match(block, /number: '17'/)
  assert.match(block, /Умный импорт/)
  assert.match(block, /Google Sheets/)
  assert.match(block, /не ломается при перемещении строк и столбцов/)
  assert.match(block, /разрезов/)
})

test('article #17 explains the row and column intersection model from gssync', () => {
  const block = extractArticleBlock('17-smart-google-import')

  assert.match(block, /rows/)
  assert.match(block, /columns/)
  assert.match(block, /\[from, to, label\]/)
  assert.match(block, /wildcard `\*`/)
  assert.match(block, /\|\|/)
  assert.match(block, /объединённые ячейки/)
})

test('article #17 describes synchronization workflow and safety switches', () => {
  const block = extractArticleBlock('17-smart-google-import')

  assert.match(block, /templates\/custom\/\{db\}\/gss/)
  assert.match(block, /templates\/custom\/\{db\}\/logs/)
  assert.match(block, /BKI/)
  assert.match(block, /credentials\.json/)
  assert.match(block, /skip_empty_values/)
  assert.match(block, /allowEmptyValue/)
  assert.match(block, /Загрузка включена/)
})

test('article #17 cites the gssync issues and links related knowledge-base articles', () => {
  const block = extractArticleBlock('17-smart-google-import')

  assert.match(block, /sources:/)
  assert.match(block, /github\.com\/ideav\/crm\/issues\/2533/)
  assert.match(block, /github\.com\/ideav\/crm\/issues\/2576/)
  assert.match(block, /github\.com\/ideav\/crm\/issues\/2582/)
  assert.match(block, /github\.com\/ideav\/crm\/issues\/2584/)
  assert.match(block, /sourceUrl: 'https:\/\/github\.com\/ideav\/crm\/issues\?q=is%3Aissue%20state%3Aclosed%20gssync'/)
  assert.match(block, /relatedSlugs:/)
  assert.match(block, /'01-google-sheets-150k'/)
  assert.match(block, /'04-related-tables'/)
  assert.match(block, /'13-api-json-export'/)
  assert.match(block, /'14a-reports'/)
})

test('Google Sheets overview article links to the smart import article', () => {
  const article01 = kbDataSource.match(
    /slug: '01-google-sheets-150k'[\s\S]*?relatedSlugs:\s*\[([\s\S]*?)\]/,
  )
  assert.ok(article01, 'article #01 should declare relatedSlugs')
  assert.match(article01[1], /'17-smart-google-import'/)
})
