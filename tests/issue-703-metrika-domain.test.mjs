// Issue #703: счётчик excel-to-app.ru собирал визиты с локальных превью
// (127.0.0.1:8765/… в отчёте «Просмотры URL»). Сниппет обязан стартовать
// только на домене из SITE_URL и его поддоменах.
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import vm from 'node:vm'

import { metrikaSnippet } from '../site-excel/src/metrika.ts'

const viteSource = readFileSync(new URL('../site-excel/vite.config.ts', import.meta.url), 'utf8')

/** Выполняет <script> сниппета на «странице» с данным hostname; true — счётчик стартовал. */
function startsOn(hostname, html) {
  const code = html.match(/<script[^>]*>([\s\S]*?)<\/script>/)[1]
  const inserted = []
  const window = {}
  const document = {
    scripts: [],
    createElement: () => ({}),
    getElementsByTagName: () => [{ parentNode: { insertBefore: (el) => inserted.push(el) } }],
  }
  window.window = window
  window.document = document
  window.location = { hostname }
  vm.runInNewContext(code, window)
  return typeof window.ym === 'function' && inserted.length === 1
}

test('счётчик стартует только на своём домене и поддоменах', () => {
  const html = metrikaSnippet('112716451', 'excel-to-app.ru')
  assert.equal(startsOn('excel-to-app.ru', html), true)
  assert.equal(startsOn('www.excel-to-app.ru', html), true)
  for (const host of ['127.0.0.1', 'localhost', 'excel-to-app.ru.evil.com', 'notexcel-to-app.ru']) {
    assert.equal(startsOn(host, html), false, host)
  }
})

test('без домена поведение прежнее, без счётчика — пусто', () => {
  assert.equal(startsOn('127.0.0.1', metrikaSnippet('112716451')), true)
  assert.match(metrikaSnippet(''), /METRIKA_ID не задан/)
})

test('сборка передаёт в сниппет домен из SITE_URL', () => {
  assert.match(viteSource, /new URL\(ORIGIN\)\.hostname/)
  assert.match(viteSource, /metrikaSnippet\(METRIKA_ID, SITE_HOST\)/)
})
