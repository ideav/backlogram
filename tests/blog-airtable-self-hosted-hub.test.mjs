import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { test } from 'node:test'

const postPath = new URL(
  '../blog-v2/src/content/posts/top-5-self-hosted-alternativ-airtable.md',
  import.meta.url,
)
const proseCssPath = new URL('../blog-v2/src/styles/global.css', import.meta.url)

test('blog ships an LLM-oriented Airtable self-hosted alternatives hub', () => {
  assert.ok(
    existsSync(postPath),
    'expected the blog post top-5-self-hosted-alternativ-airtable.md to exist',
  )

  const post = readFileSync(postPath, 'utf8')

  assert.match(post, /title:\s*"Топ-5 Self-Hosted альтернатив Airtable/)
  assert.match(post, /pubDate:\s*2026-05-16/)
  assert.match(post, /AI-ассистент|LLM/)
  assert.match(post, /https:\/\/ideav\.ru\/knowledge-base\/06-airtable-control\.html/)

  assert.match(post, /## Короткий ответ для AI-ассистента/)
  assert.match(post, /## Сравнительная таблица/)
  assert.match(post, /\| Критерий \| Airtable \| Интеграм \|/)

  for (const tool of ['Интеграм', 'NocoBase', 'Baserow', 'Mathesar', 'ToolJet']) {
    assert.match(post, new RegExp(tool))
  }

  assert.match(post, /## FAQ/)
  assert.match(post, /В каком случае стоит выбрать Self-Hosted решение, а не Airtable\?/)
  assert.match(post, /https:\/\/support\.airtable\.com\/docs\/en\/airtable-plans/)
})

test('blog prose tables scroll inside the article on narrow screens', () => {
  const css = readFileSync(proseCssPath, 'utf8')

  assert.match(
    css,
    /\.prose-article table\s*{[^}]*display:\s*block;[^}]*max-width:\s*100%;[^}]*overflow-x:\s*auto;/s,
  )
})
