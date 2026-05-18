import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'

const indexPath = new URL('../blog-v2/src/pages/index.astro', import.meta.url)
const globalCssPath = new URL('../blog-v2/src/styles/global.css', import.meta.url)

test('blog home follows the amoCRM-inspired masthead and article grid direction', () => {
  const index = readFileSync(indexPath, 'utf8')
  const globalCss = readFileSync(globalCssPath, 'utf8')

  assert.match(index, /amo-blog-page/)
  assert.match(index, /amo-blog-hero/)
  assert.match(index, /О no-code, данных и автоматизации/)
  assert.match(index, /amo-category-pills/)
  assert.match(index, /amo-featured-card/)
  assert.match(index, /amo-post-grid/)
  assert.match(index, /firstImage/)

  assert.doesNotMatch(index, /product-panel/)
  assert.doesNotMatch(index, /product-card-grid/)

  assert.match(globalCss, /--color-amo-blue:\s*#35a3c9/)
  assert.match(globalCss, /\.amo-blog-hero\s*{[^}]*background:\s*var\(--color-amo-blue\)/s)
  assert.match(globalCss, /\.amo-category-pill\s*{[^}]*text-transform:\s*uppercase/s)
  assert.match(
    globalCss,
    /\.amo-post-grid\s*{[^}]*grid-template-columns:\s*repeat\(3,\s*minmax\(0,\s*1fr\)\)/s,
  )
})
