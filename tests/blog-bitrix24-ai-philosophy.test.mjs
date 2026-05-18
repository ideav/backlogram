import assert from 'node:assert/strict'
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { test } from 'node:test'

const postsDir = new URL('../blog-v2/src/content/posts/', import.meta.url)
const postFile = 'bitrix24-ai-vibecode-i-sistemnaya-prostota.md'
const postPath = new URL(postFile, postsDir)

function frontmatterValue(source, field) {
  const match = source.match(new RegExp(`^${field}:\\s*['"]?(.*?)['"]?$`, 'm'))
  return match?.[1]
}

test('blog ships the Bitrix24 AI philosophy article requested in issue 257', () => {
  assert.ok(existsSync(postPath), `expected ${postFile} to exist`)

  const post = readFileSync(postPath, 'utf8')

  assert.match(post, /title:\s*["']Битрикс24 прикручивает AI к сложности/)
  assert.match(post, /pubDate:\s*['"]?2026-05-18['"]?/)
  assert.doesNotMatch(post, /^draft:\s*true/m)
  assert.doesNotMatch(post, /^canonical:/m, 'new article should use the new blog canonical URL')

  assert.match(post, /Битрикс24 Вайбкод/)
  assert.match(post, /BitrixGPT 5\.5/)
  assert.match(post, /Проекты AI/)
  assert.match(post, /бот-платформ/)
  assert.match(post, /проблему сложности собственной платформы/)
  assert.match(post, /философии продукта/)
  assert.match(post, /Интеграм/)

  assert.match(post, /## Короткий ответ/)
  assert.match(post, /## Что показал Битрикс24/)
  assert.match(post, /## Где здесь уязвимость/)
  assert.match(post, /## Почему подход Интеграма другой/)
  assert.match(post, /## FAQ/)

  assert.match(post, /\| Критерий \| Битрикс24 AI \/ Вайбкод \| Интеграм \|/)
  assert.match(post, /https:\/\/www\.bitrix24\.ru\/journal\/novyy-bitriks24-vaybkod\//)
  assert.match(post, /https:\/\/apidocs\.bitrix24\.ru\/ai-tools\/vibecode\.html/)
})

test('Bitrix24 AI philosophy article is issue 54 in the chronological blog archive', () => {
  assert.ok(existsSync(postPath), `expected ${postFile} to exist`)

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

  assert.equal(posts.findIndex((post) => post.file === postFile) + 1, 54)
})
