import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'

const read = (p) => readFileSync(new URL(p, import.meta.url), 'utf8')

const chromeSource = read('../site-excel/src/Chrome.tsx')

/** Тело SiteHeader — от объявления до следующего экспорта. */
const headerSource = chromeSource.split('export function SiteHeader(')[1]?.split('\nexport ')[0]

// ── Над шапкой нет цветной полоски (issue #680) ──────────────────────────────
// Синяя градиентная полоска у верхнего края окна выглядела как индикатор
// загрузки браузера и сбивала с толку.

test('SiteHeader найден в Chrome.tsx', () => {
  assert.ok(headerSource, 'не нашли export function SiteHeader')
})

test('в шапке нет тонкой фирменной полоски bg-brand', () => {
  assert.doesNotMatch(headerSource, /className="h-\[\d+px\][^"]*bg-brand/)
  assert.doesNotMatch(headerSource, /<header[^>]*>\s*(\{\/\*[^]*?\*\/\}\s*)?<div[^>]*bg-brand/)
})
