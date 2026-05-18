import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'

const indexPath = new URL('../blog-v2/src/pages/index.astro', import.meta.url)
const globalCssPath = new URL('../blog-v2/src/styles/global.css', import.meta.url)

test('blog home adapts the PR 264 layout idea with Integram product colors', () => {
  const index = readFileSync(indexPath, 'utf8')
  const globalCss = readFileSync(globalCssPath, 'utf8')

  assert.match(index, /product-blog-page/)
  assert.match(index, /product-blog-hero/)
  assert.match(index, /product-blog-shell/)
  assert.match(index, /product-blog-category-pills/)
  assert.match(index, /product-blog-featured/)
  assert.match(index, /product-blog-card-grid/)
  assert.match(index, /product-visual-frame/)
  assert.match(index, /firstImage/)

  assert.doesNotMatch(index, /amo-blog/)
  assert.doesNotMatch(globalCss, /--color-amo|#35a3c9/i)
  assert.match(globalCss, /--color-product-blue:\s*#1447e6/)
  assert.match(globalCss, /--color-product-line:/)
  assert.match(
    globalCss,
    /\.product-blog-card-grid\s*{[^}]*grid-template-columns:\s*repeat\(3,\s*minmax\(0,\s*1fr\)\)/s,
  )
  assert.match(globalCss, /\.product-blog-shell\s*{[^}]*border:\s*1px solid var\(--color-product-line\)/s)
})
