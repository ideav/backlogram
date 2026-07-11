import assert from 'node:assert/strict'
import { test } from 'node:test'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const repo = new URL('..', import.meta.url).pathname
const read = (p) => readFileSync(resolve(repo, p), 'utf8')

const pageSource = read('src/pages/InformationSystem.tsx')

// Вырезаем блок ссылки «← На главную» из хедера пиллар-страницы.
function backLinkClass() {
  const match = pageSource.match(
    /<Link\s+to="\/"\s+className="([^"]*)"[\s\S]*?На главную/,
  )
  assert.ok(match, 'InformationSystem should have a "На главную" back-link')
  return match[1]
}

// Регрессия #408 / #385: ссылка «На главную» и бейдж «Основы…» слипались,
// потому что оба были inline-flex и садились в одну строку без отступа.
// Ссылка должна быть блочной (flex w-fit) — тогда бейдж уходит на строку ниже.
test('«На главную» back-link is block-level so it cannot glue to the badge', () => {
  const cls = backLinkClass()
  assert.match(cls, /\bflex\b/, 'back-link must be a flex (block-level) element')
  assert.match(cls, /\bw-fit\b/, 'back-link must hug its content with w-fit')
  assert.doesNotMatch(
    cls,
    /\binline-flex\b/,
    'back-link must NOT be inline-flex — that glues it to the «Основы…» badge',
  )
})

test('the "Основы: информационные системы" badge sits in its own element', () => {
  assert.match(
    pageSource,
    /<div className="[^"]*"[^>]*>\s*<BookOpen[^>]*\/>\s*Основы: информационные системы/,
    'the category badge must render in its own block element',
  )
})
