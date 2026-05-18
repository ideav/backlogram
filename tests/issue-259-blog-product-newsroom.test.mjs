import assert from 'node:assert/strict'
import { existsSync, readFileSync, statSync } from 'node:fs'
import { test } from 'node:test'

const indexPath = new URL('../blog-v2/src/pages/index.astro', import.meta.url)
const layoutPath = new URL('../blog-v2/src/layouts/BaseLayout.astro', import.meta.url)
const headerPath = new URL('../blog-v2/src/components/Header.astro', import.meta.url)
const globalCssPath = new URL('../blog-v2/src/styles/global.css', import.meta.url)
const screenshotPath = new URL(
  '../docs/screenshots/issue-265-after-desktop.png',
  import.meta.url
)

test('blog home keeps product-blog basics after the issue 265 visual restyle', () => {
  const index = readFileSync(indexPath, 'utf8')
  const layout = readFileSync(layoutPath, 'utf8')
  const header = readFileSync(headerPath, 'utf8')
  const globalCss = readFileSync(globalCssPath, 'utf8')

  assert.match(index, /product-blog-page/)
  assert.match(index, /product-blog-hero/)
  assert.match(index, /action="\/search\/"/)
  assert.match(index, /name="q"/)
  assert.match(index, /product-blog-category-pills/)
  assert.match(index, /product-blog-featured/)
  assert.match(index, /product-blog-card-grid/)
  assert.match(index, /О no-code, данных и автоматизации/)

  assert.match(header, /Все статьи/)
  assert.match(header, /О платформе/)
  assert.match(header, /Технологии/)
  assert.match(header, /Кейсы/)
  assert.match(header, /Открыть Интеграм/)

  assert.doesNotMatch(layout, /Fraunces|fonts\.googleapis/i)
  assert.doesNotMatch(globalCss, /paper grain|drop cap|first-letter|Fraunces/i)
  assert.match(globalCss, /--color-product-blue/)
  assert.match(globalCss, /font-family:\s*var\(--font-sans\)/)

  assert.ok(existsSync(screenshotPath), 'expected the issue 265 rendered screenshot')
  assert.ok(statSync(screenshotPath).size > 50_000, 'screenshot should be a rendered PNG')
})
