import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'

const appSource = readFileSync(new URL('../src/App.tsx', import.meta.url), 'utf8')

test('hashless route changes reset the viewport to the top of the next page', () => {
  assert.match(
    appSource,
    /const\s+\{\s*pathname,\s*search,\s*hash\s*\}\s*=\s*useLocation\(\)/,
    'Route scroll logic must observe path, query string, and hash changes.',
  )
  assert.match(
    appSource,
    /if\s*\(!hash\)\s*\{[\s\S]*window\.scrollTo\(\{\s*top:\s*0,\s*left:\s*0,\s*behavior:\s*'auto'\s*\}\)[\s\S]*return[\s\S]*\}/,
    'Navigating to another page without a hash should scroll to the page top.',
  )
  assert.match(
    appSource,
    /\[pathname,\s*search,\s*hash\]/,
    'The effect must rerun for page changes, not only hash changes.',
  )
})

test('hash route changes keep scrolling to the requested element', () => {
  assert.match(
    appSource,
    /hash\.slice\(1\)/,
    'Hash navigation should still resolve the target element id.',
  )
  assert.match(
    appSource,
    /el\.scrollIntoView\(\{\s*behavior:\s*'smooth'\s*\}\)/,
    'Hash navigation should keep smooth scrolling to the target element.',
  )
})
