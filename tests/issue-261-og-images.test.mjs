import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { test } from 'node:test'

const blogLayoutSource = readFileSync(
  new URL('../blog-v2/src/layouts/BaseLayout.astro', import.meta.url),
  'utf8',
)

const knowledgeBaseSource = readFileSync(
  new URL('../src/pages/KnowledgeBase.tsx', import.meta.url),
  'utf8',
)

const blogDefaultOgPath = new URL('../blog-v2/public/og-default.png', import.meta.url)

function pngSize(fileUrl) {
  const bytes = readFileSync(fileUrl)
  assert.equal(bytes.slice(1, 4).toString('ascii'), 'PNG')
  return {
    width: bytes.readUInt32BE(16),
    height: bytes.readUInt32BE(20),
  }
}

test('blog layout has a real default Open Graph image for pages without article images', () => {
  assert.match(blogLayoutSource, /image = '\/og-default\.png'/)
  assert.match(blogLayoutSource, /property="og:image"/)
  assert.match(blogLayoutSource, /property="og:image:width"/)
  assert.match(blogLayoutSource, /property="og:image:height"/)
  assert.match(blogLayoutSource, /name="twitter:card"\s+content="summary_large_image"/)
  assert.match(blogLayoutSource, /name="twitter:image"/)

  assert.ok(existsSync(blogDefaultOgPath), 'expected blog-v2/public/og-default.png to exist')

  const size = pngSize(blogDefaultOgPath)
  assert.equal(size.width, 1200)
  assert.equal(size.height, 630)
})

test('knowledge base index exposes its generated cover in Open Graph metadata', () => {
  assert.match(knowledgeBaseSource, /const KB_OG_IMAGE = '\/og\/knowledge-base\.png'/)
  assert.match(knowledgeBaseSource, /absoluteKnowledgeBaseOgImage/)
  assert.match(knowledgeBaseSource, /meta\[property="og:url"\]/)
  assert.match(knowledgeBaseSource, /meta\[property="og:image"\]/)
  assert.match(knowledgeBaseSource, /meta\[property="og:image:width"\]/)
  assert.match(knowledgeBaseSource, /meta\[property="og:image:height"\]/)
  assert.match(knowledgeBaseSource, /meta\[name="twitter:card"\][\s\S]*summary_large_image/)
  assert.match(knowledgeBaseSource, /meta\[name="twitter:image"\]/)
})
