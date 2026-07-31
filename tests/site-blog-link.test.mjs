import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'

const headerSource = readFileSync(new URL('../src/components/Header.tsx', import.meta.url), 'utf8')
const footerSource = readFileSync(new URL('../src/components/Footer.tsx', import.meta.url), 'utf8')

// Блог переехал с поддомена в подпапку основного домена (issue #522). Ссылки
// сайта обязаны вести на конечный адрес: путь через 301 работает, но тратит
// краулинговый бюджет и разжижает передачу веса на каждом хопе.
test('main site blog links point to the blog in the /blog/ subfolder', () => {
  for (const source of [headerSource, footerSource]) {
    assert.doesNotMatch(source, /https:\/\/blog\.ideav\.online\//)
    assert.doesNotMatch(source, /https:\/\/blog\.ideav\.ru/)
    assert.match(source, /https:\/\/ideav\.ru\/blog\//)
  }

  assert.match(
    headerSource,
    /\{ name: 'Блог', href: 'https:\/\/ideav\.ru\/blog\/', external: true \}/,
  )
  assert.match(footerSource, /href="https:\/\/ideav\.ru\/blog\/"[\s\S]*>Блог/)
})
