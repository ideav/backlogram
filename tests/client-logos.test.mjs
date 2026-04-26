import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'

const clientLogosSource = readFileSync(
  new URL('../src/components/ClientLogos.tsx', import.meta.url),
  'utf8',
)

test('UpSound logo is rendered about one third larger than the default client logos', () => {
  assert.match(
    clientLogosSource,
    /\{ name: 'UpSound', logo: '\/logos\/upsound\.png', large: true \}/,
    'UpSound should be marked for the larger logo treatment.',
  )
  assert.match(
    clientLogosSource,
    /client\.large \? 'w-4\/3 h-4\/3'/,
    'Large client logos should render at 4/3 of the default image size.',
  )
})
