import assert from 'node:assert/strict'
import { readdirSync, readFileSync } from 'node:fs'
import { test } from 'node:test'

const postsDir = new URL('../blog-v2/src/content/posts/', import.meta.url)

const onPremiseFile = 'integram-on-premise-lokalno.md'
const selfHostedFile = 'top-5-self-hosted-alternativ-airtable.md'
const welcomeFile = 'dobro-pozhalovat-na-blog-ideav-ru.md'
const geoFile = 'prikladnoe-geo-optimizaciya-dlya-generativnyh-sistem.md'

function frontmatterValue(source, field) {
  const match = source.match(new RegExp(`^${field}:\\s*['"]?(.*?)['"]?$`, 'm'))
  return match?.[1]
}

function readPost(file) {
  return readFileSync(new URL(file, postsDir), 'utf8')
}

function publishedPosts() {
  return readdirSync(postsDir)
    .filter((file) => file.endsWith('.md'))
    .map((file) => {
      const source = readPost(file)
      return {
        file,
        pubDate: frontmatterValue(source, 'pubDate'),
        draft: frontmatterValue(source, 'draft') === 'true',
      }
    })
    .filter((post) => !post.draft)
    .sort((a, b) => a.pubDate.localeCompare(b.pubDate) || a.file.localeCompare(b.file))
}

function issueNumber(posts, file) {
  return String(posts.findIndex((post) => post.file === file) + 1).padStart(3, '0')
}

test('articles formerly numbered 51 and 52 are scheduled for March and April 2026', () => {
  assert.match(readPost(onPremiseFile), /pubDate:\s*['"]?2026-03-14['"]?/)
  assert.match(readPost(selfHostedFile), /pubDate:\s*['"]?2026-04-16['"]?/)
})

test('blog issue numbers follow the rescheduled publication order', () => {
  const posts = publishedPosts()

  assert.equal(issueNumber(posts, onPremiseFile), '050')
  assert.equal(issueNumber(posts, selfHostedFile), '051')
  assert.equal(issueNumber(posts, welcomeFile), '052')
  assert.equal(issueNumber(posts, geoFile), '053')
})
