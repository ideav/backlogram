import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readdirSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const POSTS_DIR = join(__dirname, '..', 'blog-v2', 'src', 'content', 'posts')
const BASE_LAYOUT = join(__dirname, '..', 'blog-v2', 'src', 'layouts', 'BaseLayout.astro')
const POST_PAGE = join(__dirname, '..', 'blog-v2', 'src', 'pages', 'posts', '[...slug].astro')

/**
 * Regression coverage for https://github.com/ideav/backlogram/issues/331
 *
 * The WordPress import seeded every migrated post with a `canonical`
 * frontmatter field pointing at the OLD domain (blog.ideav.online). That
 * emits `<link rel="canonical" href="https://blog.ideav.online/...">` on the
 * live blog.ideav.ru pages, which tells Yandex/Google that the authoritative
 * copy lives elsewhere. Yandex therefore excluded all of these pages from its
 * index as "Малоценная или маловостребованная страница" (low-value/duplicate).
 *
 * The fix: posts on blog.ideav.ru must be self-canonical. The original
 * publication URL is preserved as display-only attribution under a separate
 * `originalUrl` field that does NOT influence <link rel="canonical">.
 */

function listPosts() {
  return readdirSync(POSTS_DIR)
    .filter((name) => name.endsWith('.md'))
    .map((name) => join(POSTS_DIR, name))
}

function extractFrontmatter(source) {
  const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---/)
  return match ? match[1] : null
}

// Dependency-free reader for a single top-level scalar key in frontmatter.
function readScalar(frontmatter, key) {
  for (const line of frontmatter.split(/\r?\n/)) {
    const m = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/)
    if (m && m[1] === key) {
      return m[2].replace(/^['"]|['"]$/g, '').trim()
    }
  }
  return null
}

const posts = listPosts()

test('no post declares a canonical on the old blog.ideav.online domain (issue #331)', () => {
  const offenders = []
  for (const file of posts) {
    const fm = extractFrontmatter(readFileSync(file, 'utf8'))
    if (fm === null) continue
    const canonical = readScalar(fm, 'canonical')
    if (canonical && /blog\.ideav\.online/i.test(canonical)) {
      offenders.push(`${file}: canonical -> ${canonical}`)
    }
  }
  assert.equal(
    offenders.length,
    0,
    `posts must be self-canonical on blog.ideav.ru, not point at the old domain:\n${offenders.join('\n')}`,
  )
})

test('no post is self-canonical via an explicit blog.ideav.ru override either', () => {
  // A hard-coded blog.ideav.ru canonical is harmless but redundant — the layout
  // already self-canonicalizes. Flag it so we keep relying on the default and
  // never accidentally hard-code a wrong slug.
  const offenders = []
  for (const file of posts) {
    const fm = extractFrontmatter(readFileSync(file, 'utf8'))
    if (fm === null) continue
    const canonical = readScalar(fm, 'canonical')
    if (canonical && /blog\.ideav\.ru/i.test(canonical)) {
      offenders.push(`${file}: canonical -> ${canonical}`)
    }
  }
  assert.equal(offenders.length, 0, offenders.join('\n'))
})

test('imported posts keep the original publication URL as display-only attribution', () => {
  // Whatever still references the old domain must do so through `originalUrl`,
  // never `canonical`.
  let attributed = 0
  for (const file of posts) {
    const fm = extractFrontmatter(readFileSync(file, 'utf8'))
    if (fm === null) continue
    const originalUrl = readScalar(fm, 'originalUrl')
    if (originalUrl && /blog\.ideav\.online/i.test(originalUrl)) attributed += 1
  }
  assert.ok(
    attributed > 0,
    'expected the migrated posts to retain blog.ideav.online attribution via originalUrl',
  )
})

test('BaseLayout self-canonicalizes when no canonical is provided', () => {
  const src = readFileSync(BASE_LAYOUT, 'utf8')
  // The page URL is the fallback canonical target.
  assert.match(
    src,
    /const\s+canonicalURL\s*=\s*canonical\s*\?\?\s*new URL\(\s*Astro\.url\.pathname\s*,\s*Astro\.site\s*\)/,
  )
  assert.match(src, /<link rel="canonical" href=\{canonicalURL\} \/>/)
})

test('the post page feeds attribution from originalUrl, not the canonical link', () => {
  const src = readFileSync(POST_PAGE, 'utf8')
  // "Первая публикация" sidebar uses originalUrl.
  assert.match(src, /post\.data\.originalUrl/)
  // The SEO canonical prop is still wired to the (now optional) canonical field.
  assert.match(src, /canonical=\{post\.data\.canonical\}/)
})
