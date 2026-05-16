import assert from 'node:assert/strict'
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { test } from 'node:test'

const postsDir = new URL('../blog-v2/src/content/posts/', import.meta.url)
const postFile = 'prikladnoe-geo-optimizaciya-dlya-generativnyh-sistem.md'
const postPath = new URL(postFile, postsDir)

function frontmatterValue(source, field) {
  const match = source.match(new RegExp(`^${field}:\\s*['"]?(.*?)['"]?$`, 'm'))
  return match?.[1]
}

test('GEO article is scheduled for May 17 as issue 53', () => {
  assert.ok(existsSync(postPath), `expected ${postFile} to exist`)

  const post = readFileSync(postPath, 'utf8')

  assert.match(post, /title:\s*'Прикладное GEO: как попасть в ответ ИИ-ассистента'/)
  assert.match(post, /pubDate:\s*['"]?2026-05-17['"]?/)
  assert.doesNotMatch(post, /^canonical:/m, 'new article should use the new blog canonical URL')
  assert.match(post, /Generative Engine Optimization/)
})

test('GEO article remains blog issue number 53 after rescheduling', () => {
  const posts = readdirSync(postsDir)
    .filter((file) => file.endsWith('.md'))
    .map((file) => {
      const source = readFileSync(new URL(file, postsDir), 'utf8')
      return {
        file,
        pubDate: frontmatterValue(source, 'pubDate'),
        draft: frontmatterValue(source, 'draft') === 'true',
      }
    })
    .filter((post) => !post.draft)
    .sort((a, b) => a.pubDate.localeCompare(b.pubDate) || a.file.localeCompare(b.file))

  assert.equal(posts.findIndex((post) => post.file === postFile) + 1, 53)
})
