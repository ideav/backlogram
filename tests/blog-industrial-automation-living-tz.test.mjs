import assert from 'node:assert/strict'
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { test } from 'node:test'

const postsDir = new URL('../blog-v2/src/content/posts/', import.meta.url)
const postFile = 'promyshlennaya-avtomatizaciya-i-zhivoe-tz.md'
const postPath = new URL(postFile, postsDir)

function frontmatterValue(source, field) {
  const match = source.match(new RegExp(`^${field}:\\s*['"]?(.*?)['"]?$`, 'm'))
  return match?.[1]
}

/**
 * Publication coverage for https://github.com/ideav/backlogram/issues/286
 * ("Опубликуй в блоге"). Locks in that the industrial-automation / «Живое ТЗ»
 * article stays published: present, not a draft, with valid frontmatter and the
 * expected, de-ribbonized body requested in issue #273.
 */
test('blog publishes the industrial automation / Living TZ article (issue 286)', () => {
  assert.ok(existsSync(postPath), `expected ${postFile} to exist`)

  const post = readFileSync(postPath, 'utf8')

  // Frontmatter — published, not a draft, on the new blog (no canonical).
  assert.match(
    post,
    /title:\s*Как уложить промышленную автоматизацию в бюджет и сроки — подход «Интеграм» и философия «Живого ТЗ»/,
  )
  assert.match(post, /pubDate:\s*['"]?2026-05-30['"]?/)
  assert.match(post, /category:\s*['"]?Проекты['"]?/)
  assert.match(post, /author:\s*['"]?Команда Интеграм['"]?/)
  assert.doesNotMatch(post, /^draft:\s*true/m)
  assert.doesNotMatch(post, /^canonical:/m, 'new article should use the new blog canonical URL')

  // Regression for issue #284: the description contains a ": " and therefore
  // MUST stay quoted, otherwise YAML parses it as a nested mapping and the
  // article fails to render.
  assert.match(
    post,
    /^description:\s*'.*low-code «Конструктор Интеграм».*'$/m,
    'description must be quoted (issue #284)',
  )

  // Body — the value proposition requested in issue #273.
  assert.match(post, /«Конструктор Интеграм»/)
  assert.match(post, /MES\/APS/)
  assert.match(post, /400 000 рублей/)
  assert.match(post, /low-code/)
  assert.match(post, /RBAC/)
  assert.match(post, /диаграмме Ганта/)
  assert.match(post, /интеграцией в 1С/)

  // Section structure.
  assert.match(post, /## Отказ от «программирования ради программирования»/)
  assert.match(post, /## «Живое ТЗ» как методология/)
  assert.match(post, /## Что входит в проект/)
  assert.match(post, /## Интеграция и прозрачность/)
  assert.match(post, /## Условия, в которых мы работаем/)
  assert.match(post, /## Вывод/)

  // Issue #273 asked to drop the ribbon-specific framing and make the piece
  // about an abstract production task.
  assert.doesNotMatch(post, /риббон/i, 'article should describe an abstract production task, not ribbons')
})

test('industrial automation article is the latest issue in the chronological archive', () => {
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

  const position = posts.findIndex((post) => post.file === postFile) + 1
  assert.ok(position > 0, 'published article should appear in the archive')
  assert.equal(position, posts.length, 'article with the newest pubDate should be the latest issue')
})
