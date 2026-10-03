import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'

const headerSource = readFileSync(new URL('../src/components/Header.tsx', import.meta.url), 'utf8')
const footerSource = readFileSync(new URL('../src/components/Footer.tsx', import.meta.url), 'utf8')
// Шапка и подвал рисуют ссылки из src/data/nav.mjs — тот же список уезжает в
// статический HTML каждой страницы (issue #627, п. 3). Адреса проверяем там,
// где они теперь живут; у компонентов — что старых доменов в них не осталось.
const navSource = readFileSync(new URL('../src/data/nav.mjs', import.meta.url), 'utf8')

// Блог переехал с поддомена в подпапку основного домена (issue #522). Ссылки
// сайта обязаны вести на конечный адрес: путь через 301 работает, но тратит
// краулинговый бюджет и разжижает передачу веса на каждом хопе.
test('main site blog links point to the blog in the /blog/ subfolder', () => {
  for (const source of [headerSource, footerSource, navSource]) {
    assert.doesNotMatch(source, /https:\/\/blog\.ideav\.online\//)
    assert.doesNotMatch(source, /https:\/\/blog\.ideav\.ru/)
  }
  assert.match(navSource, /https:\/\/ideav\.ru\/blog\//)

  // Пункт есть и в шапке, и в подвале: оба списка лежат в одном модуле.
  const blogEntries = navSource.match(
    /\{ name: 'Блог', href: 'https:\/\/ideav\.ru\/blog\/', external: true[^}]*\}/g,
  )
  assert.equal(blogEntries?.length, 2, 'ожидались пункты «Блог» в шапке и в подвале')
})
