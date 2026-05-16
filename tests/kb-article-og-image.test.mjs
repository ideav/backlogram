import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'

const kbArticlePage = readFileSync(
  new URL('../src/pages/KnowledgeBaseArticle.tsx', import.meta.url),
  'utf8',
)

const prerenderScript = readFileSync(
  new URL('../scripts/prerender-knowledge-base.mjs', import.meta.url),
  'utf8',
)

test('interactive article pages render the generated Open Graph card visibly', () => {
  assert.match(kbArticlePage, /const articleOgImage = `\/og\/\$\{article\.slug\}\.png`/)
  assert.match(kbArticlePage, /src=\{articleOgImage\}/)
  assert.match(kbArticlePage, /alt=\{`Обложка статьи: \$\{article\.shortTitle\}`\}/)
})

test('interactive article pages expose the generated card in social metadata', () => {
  assert.match(kbArticlePage, /const absoluteArticleOgImage =/)
  assert.match(kbArticlePage, /meta\[property="og:image"\]/)
  assert.match(kbArticlePage, /meta\[property="og:image:width"\]/)
  assert.match(kbArticlePage, /meta\[property="og:image:height"\]/)
  assert.match(kbArticlePage, /meta\[name="twitter:image"\]/)
  assert.match(kbArticlePage, /image: absoluteArticleOgImage/)
})

test('static prerendered article HTML includes the generated card as article content', () => {
  assert.match(prerenderScript, /const articleImage = `\/og\/\$\{article\.slug\}\.png`/)
  assert.match(prerenderScript, /const articleImageAlt = `Обложка статьи:/)
  assert.match(prerenderScript, /<img src="\$\{articleImage\}"/)
  assert.match(prerenderScript, /alt="\$\{escape\(articleImageAlt\)\}"/)
})
