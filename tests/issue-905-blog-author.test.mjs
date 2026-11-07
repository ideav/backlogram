// issue #905, п. 1 — автор-человек с профилем вместо «Команды Интеграм».
//
// Владелец разрешил публиковать только имя и роль: «Ким Артамонов,
// предприниматель и инженер». Профиль — /blog/authors/kim-artamonov/, в
// разметке Person с тем же @id на посте и на профиле.

import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import { AUTHORS, authorByName, authorPath } from '../blog-v2/src/lib/authors.mjs'

const read = (p) => readFileSync(new URL(p, import.meta.url), 'utf8')

test('the author registry holds only what the owner allowed', () => {
  assert.deepEqual(AUTHORS, [
    { slug: 'kim-artamonov', name: 'Ким Артамонов', jobTitle: 'Предприниматель и инженер' },
  ])
  assert.equal(authorByName(' Ким Артамонов ')?.slug, 'kim-artamonov')
  assert.equal(authorByName('Команда Интеграм'), undefined)
  assert.equal(authorPath(AUTHORS[0]), '/authors/kim-artamonov/')
})

test('the Lean post is signed by the person', () => {
  const post = read('../blog-v2/src/content/posts/berezhlivoe-proizvodstvo-lean-instrumenty.md')
  assert.match(post, /^author: Ким Артамонов$/m)
})

test('post page links the profile and marks up a Person', () => {
  const page = read('../blog-v2/src/pages/posts/[...slug].astro')
  assert.match(page, /const person = authorByName\(post\.data\.author\)/)
  assert.match(page, /rel="author"/)
  assert.match(page, /person \? person\.jobTitle : 'Редакция журнала'/)
  // article:author — адрес профиля, а не строка имени
  assert.match(page, /author=\{authorProfileUrl \?\? post\.data\.author\}/)
  const jsonld = read('../blog-v2/src/lib/jsonld.ts')
  assert.match(jsonld, /'@id': `\$\{profile\.url\}#person`/)
  assert.match(jsonld, /worksFor: \{ '@id': `\$\{site\}\/#organization` \}/)
  assert.match(jsonld, /if \(profile\) return personNode\(site, author, profile\)/)
})

test('profile page is a ProfilePage with the same Person', () => {
  const page = read('../blog-v2/src/pages/authors/[slug].astro')
  assert.match(page, /profileGraph\(/)
  assert.match(page, /type="profile"/)
  assert.match(page, /Статьи автора/)
  const jsonld = read('../blog-v2/src/lib/jsonld.ts')
  assert.match(jsonld, /'@type': 'ProfilePage'/)
  assert.match(jsonld, /mainEntity: \{ '@id': `\$\{url\}#person` \}/)
})
