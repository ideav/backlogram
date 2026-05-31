import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'

const blogLayoutSource = readFileSync(
  new URL('../blog-v2/src/layouts/BaseLayout.astro', import.meta.url),
  'utf8',
)

const faviconSource = readFileSync(
  new URL('../blog-v2/public/favicon.svg', import.meta.url),
  'utf8',
)

test('blog exposes a 120x120 svg favicon', () => {
  assert.match(blogLayoutSource, /<link rel="icon" type="image\/svg\+xml" href="\/favicon\.svg" \/>/)
  assert.match(faviconSource, /<svg[^>]+width="120"[^>]+height="120"/)
  assert.match(faviconSource, /viewBox="0 0 120 120"/)
})
