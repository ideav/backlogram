import assert from 'node:assert/strict'
import { test } from 'node:test'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const repo = new URL('..', import.meta.url).pathname
const read = (p) => readFileSync(resolve(repo, p), 'utf8')

const headerSource = read('src/components/Header.tsx')

// Изолируем массив moreLinks («Ещё…») из исходника Header.
function moreLinksBlock() {
  const match = headerSource.match(/const moreLinks = \[([\s\S]*?)\n {2}\]/)
  assert.ok(match, 'Header should declare a moreLinks array')
  return match[1]
}

test('«Ещё» menu links to the Информационная система pillar page', () => {
  const block = moreLinksBlock()
  assert.match(
    block,
    /name:\s*'Информационная система',\s*href:\s*'\/informatsionnaya-sistema\.html'/,
    'moreLinks should contain the Информационная система entry pointing at /informatsionnaya-sistema.html',
  )
})

test('«Ещё» menu holds exactly 4 items', () => {
  const block = moreLinksBlock()
  const count = (block.match(/href:/g) || []).length
  assert.equal(count, 4, 'the «Ещё» dropdown must always have 4 entries')
})
