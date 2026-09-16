// issue #589 — `integram.io/sitemap.xml` отвечал HTTP 200 с телом «Invalid database».
//
// У веб-корня integram.io, как и у ideav.ru, стоит front controller: путь, под
// который нет файла, уходит движку Интеграма. Имя с точкой не проходит маску
// имени базы, и движок печатал «Invalid database» БЕЗ статуса — то есть 200.
// Для поисковика это хуже честной 404: карта считается прочитанной, а в ней
// мусор. Лечится тем, что файл физически существует.
//
// Здесь проверяется то, что ломается молча при следующей правке сайта: новая
// страница в веб-корне, не попавшая в карту, и расхождение между картой и
// строкой Sitemap в robots.txt.
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { readFileSync, readdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { splitUrlBlocks } from '../scripts/lib/sitemap-urls.mjs'

// fileURLToPath, а не .pathname: на Windows .pathname даёт «/C:/…», resolve()
// приписывает диск ещё раз, и чтение падает на «C:\C:\…». Остальные тесты
// репозитория набраны прежней идиомой и на Windows не запускаются вовсе.
const repo = fileURLToPath(new URL('..', import.meta.url))
const read = (p) => readFileSync(resolve(repo, p), 'utf8')

const HOST = 'https://integram.io'
const sitemap = read('integram.io/sitemap.xml')
const robots = read('integram.io/robots.txt')
const blocks = splitUrlBlocks(sitemap)
const locs = blocks.map((b) => b.loc)

test('карта не пуста и разбирается', () => {
  assert.ok(blocks.length > 0, 'в integram.io/sitemap.xml должны быть блоки <url>')
  assert.ok(
    sitemap.trimStart().startsWith('<?xml'),
    'карта обязана начинаться с XML-пролога, иначе поисковик её не примет',
  )
})

test('адреса канонические: тот же хост, без якорей и дублей', () => {
  for (const loc of locs) {
    assert.ok(loc.startsWith(`${HOST}/`), `адрес не на канонический хост: ${loc}`)
    assert.ok(!loc.includes('#'), `якорь — это та же страница, в карте ему не место: ${loc}`)
    assert.ok(!loc.includes('index.html'), `корень адресуется как «/», а не index.html: ${loc}`)
  }
  assert.equal(new Set(locs).size, locs.length, 'адреса в карте не должны повторяться')
  assert.ok(locs.includes(`${HOST}/`), 'главная обязана быть в карте')
})

test('каждая страница веб-корня попала в карту', () => {
  // Ровно то место, где карта протухает: страницу добавили, карту забыли.
  const pages = readdirSync(resolve(repo, 'integram.io'))
    .filter((name) => name.endsWith('.html'))
    .map((name) => (name === 'index.html' ? `${HOST}/` : `${HOST}/${name}`))

  for (const page of pages) {
    assert.ok(locs.includes(page), `страница ${page} лежит в веб-корне, но её нет в карте сайта`)
  }
})

test('robots.txt указывает на эту же карту', () => {
  const declared = (robots.match(/^\s*Sitemap:\s*(\S+)/im) ?? [])[1]
  assert.equal(
    declared,
    `${HOST}/sitemap.xml`,
    'без строки Sitemap в robots.txt поисковик ищет карту вслепую',
  )
})
