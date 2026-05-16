import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'

const headerSource = readFileSync(new URL('../src/components/Header.tsx', import.meta.url), 'utf8')
const footerSource = readFileSync(new URL('../src/components/Footer.tsx', import.meta.url), 'utf8')

test('main site blog links point to the new blog', () => {
  for (const source of [headerSource, footerSource]) {
    assert.doesNotMatch(source, /https:\/\/blog\.ideav\.online\//)
    assert.match(source, /https:\/\/blog\.ideav\.ru\//)
  }

  assert.match(
    headerSource,
    /\{ name: 'Блог', href: 'https:\/\/blog\.ideav\.ru\/', external: true \}/,
  )
  assert.match(footerSource, /href="https:\/\/blog\.ideav\.ru\/"[\s\S]*>Блог/)
})
