// Вебмастер по integram.io: «На многих страницах сайта отсутствуют или некорректно
// заполнены метатеги Description».
//
// Причин было две. Страницы сайта (terms, acct, reestr, презентации партнёрам)
// либо не имели description, либо делили один общий текст «Простой и мощный
// инструмент…». А в веб-корне рядом лежат шаблоны движка, старые копии главной
// и чужие разделы — у них описаний нет и быть не должно, их закрывает robots.txt.
//
// Тест держит обе стороны: у каждой страницы из integram.io/ своё описание,
// и запреты robots.txt не задевают ни одного адреса из карты сайта.
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { readFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const repo = fileURLToPath(new URL('..', import.meta.url))
const read = (p) => readFileSync(resolve(repo, p), 'utf8')

const pages = execFileSync('git', ['ls-files', 'integram.io/*.html', 'integram.io/**/*.html'], { cwd: repo, encoding: 'utf8' })
  .split('\n')
  .filter(Boolean)

const description = (html) => (html.match(/<meta\s+name="description"\s+content="([^"]*)"/i) ?? [])[1]

test('у каждой страницы integram.io есть description', () => {
  assert.ok(pages.length > 0)
  for (const p of pages) {
    const d = description(read(p))
    assert.ok(d && d.trim().length >= 50, `${p}: description нет или он слишком короткий`)
  }
})

test('description не повторяются между страницами', () => {
  const seen = new Map()
  for (const p of pages) {
    const d = description(read(p))
    assert.ok(!seen.has(d), `${p} и ${seen.get(d)} делят один description`)
    seen.set(d, p)
  }
})

test('Disallow в robots.txt не закрывает адреса из карты сайта', () => {
  const disallow = [...read('integram.io/robots.txt').matchAll(/^\s*Disallow:\s*(\S+)/gim)].map((m) => m[1])
  assert.ok(disallow.length > 0)
  const locs = [...read('integram.io/sitemap.xml').matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => new URL(m[1]).pathname)
  for (const path of locs) {
    const hit = disallow.find((d) => path.startsWith(d))
    assert.equal(hit, undefined, `${path} из карты сайта закрыт строкой Disallow: ${hit}`)
  }
})
