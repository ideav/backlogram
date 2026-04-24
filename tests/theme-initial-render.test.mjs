import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'

const themeSource = readFileSync(new URL('../src/context/ThemeContext.tsx', import.meta.url), 'utf8')

test('theme provider keeps the initial render independent from localStorage', () => {
  assert.match(
    themeSource,
    /useState<Theme>\('light'\)/,
    'Initial theme state should be deterministic for hydration.',
  )
  assert.doesNotMatch(
    themeSource,
    /useState<Theme>\(\(\) =>[\s\S]*localStorage\.getItem/,
    'Do not read browser storage inside the initial state function.',
  )
  assert.match(
    themeSource,
    /useEffect\(\(\) => \{[\s\S]*localStorage\.getItem\('theme'\)[\s\S]*setTheme\(stored\)[\s\S]*\}, \[\]\)/,
    'Stored theme should be applied after the first client render.',
  )
})
