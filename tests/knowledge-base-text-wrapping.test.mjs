import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'

const cssSource = readFileSync(new URL('../src/index.css', import.meta.url), 'utf8')
const kbArticlePageSource = readFileSync(
  new URL('../src/pages/KnowledgeBaseArticle.tsx', import.meta.url),
  'utf8',
)
const kbIndexPageSource = readFileSync(
  new URL('../src/pages/KnowledgeBase.tsx', import.meta.url),
  'utf8',
)
const kbDataSource = readFileSync(
  new URL('../src/data/knowledgeBase.ts', import.meta.url),
  'utf8',
)

test('knowledge base pages have a utility for wrapping long technical tokens', () => {
  assert.match(cssSource, /\.wrap-anywhere\s*\{[\s\S]*overflow-wrap:\s*anywhere;/)
})

test('knowledge base page shells apply long-token wrapping', () => {
  assert.match(kbArticlePageSource, /<div className="overflow-hidden wrap-anywhere">/)
  assert.match(kbIndexPageSource, /<div className="overflow-hidden wrap-anywhere">/)
})

test('knowledge base article flex rows allow long text to shrink and wrap', () => {
  assert.match(kbArticlePageSource, /<span className="min-w-0">\{step\}<\/span>/)
  assert.match(kbArticlePageSource, /className="min-w-0 text-sm text-slate-700/)
})

test('smart Google import article keeps the long paths that require wrapping', () => {
  assert.match(kbDataSource, /templates\/custom\/\{db\}\/gss/)
  assert.match(kbDataSource, /templates\/custom\/\{db\}\/logs\/google_sheets_sync\.bki/)
})
