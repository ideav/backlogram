import assert from 'node:assert/strict'
import { test } from 'node:test'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const repo = new URL('..', import.meta.url).pathname
const read = (p) => readFileSync(resolve(repo, p), 'utf8')

// Регрессия #410: Яндекс.Вебмастер жаловался «Канонический адрес не указан»
// на legacy-страницах /terms.html и /acct.html. Они лежат в public/ и
// копируются в dist/ как есть, поэтому self-canonical должен быть прямо в них.
const pages = [
  { file: 'public/terms.html', url: 'https://ideav.ru/terms.html' },
  { file: 'public/acct.html', url: 'https://ideav.ru/acct.html' },
]

for (const { file, url } of pages) {
  test(`${file} declares a self-referential canonical`, () => {
    const src = read(file)
    const canonical = new RegExp(
      `<link\\s+rel="canonical"\\s+href="${url.replace(/[.]/g, '\\$&')}"\\s*/?>`,
    )
    assert.match(src, canonical, `${file} must contain <link rel="canonical" href="${url}">`)
  })

  test(`${file} keeps the canonical inside <head>`, () => {
    const src = read(file)
    const head = src.slice(0, src.indexOf('</head>'))
    assert.ok(head.includes('rel="canonical"'), `canonical in ${file} must be inside <head>`)
  })
}
