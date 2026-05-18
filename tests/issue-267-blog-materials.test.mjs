import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { test } from 'node:test'

const indexPath = new URL('../blog-v2/src/pages/index.astro', import.meta.url)
const globalCssPath = new URL('../blog-v2/src/styles/global.css', import.meta.url)

test('blog home hides content after three rows of cards behind all materials control', () => {
  const index = readFileSync(indexPath, 'utf8')
  const globalCss = readFileSync(globalCssPath, 'utf8')

  assert.match(index, /const cards = display\.slice\(1, 10\)/)
  assert.match(index, /const archive = display\.slice\(10\)/)
  assert.match(index, /<details class="product-blog-all-materials">/)
  assert.match(index, /<summary>[\s\S]*Все материалы[\s\S]*<\/summary>/)
  assert.match(index, /product-blog-all-materials[\s\S]*product-blog-archive/)
  assert.match(globalCss, /\.product-blog-card-grid\s*{[^}]*grid-template-columns:\s*repeat\(3,\s*minmax\(0,\s*1fr\)\)/s)
  assert.match(globalCss, /\.product-blog-all-materials summary\s*{[^}]*cursor:\s*pointer/s)
})

test('blog home uses abstract image assets instead of placeholder fallback markup', () => {
  const index = readFileSync(indexPath, 'utf8')

  assert.match(index, /abstractImage/)
  assert.match(index, /\/abstract\/blog-material-/)
  assert.doesNotMatch(index, /product-media-pattern/)
  assert.doesNotMatch(index, /visual:\s*`product-visual-/)

  for (let i = 1; i <= 6; i += 1) {
    const assetPath = new URL(`../blog-v2/public/abstract/blog-material-${i}.svg`, import.meta.url)
    assert.ok(existsSync(assetPath), `expected abstract asset ${i}`)
    assert.match(readFileSync(assetPath, 'utf8'), /<svg[^>]+viewBox="0 0 1200 720"/)
  }
})
