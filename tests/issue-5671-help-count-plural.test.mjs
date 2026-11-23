import assert from 'node:assert/strict'
import { test } from 'node:test'
import { readFileSync } from 'node:fs'
import { HELP_ARTICLES, helpCountLabel } from '../src/data/helpCenter.mjs'

// ideav/crm#5671: «381 приёмов по шагам» → «381 приём»: число согласуется со словом
// на хабе, в разделах и в их статических снапшотах.

test('helpCountLabel согласует число со словом «приём»', () => {
  const cases = { 0: 'приёмов', 1: 'приём', 2: 'приёма', 4: 'приёма', 5: 'приёмов', 11: 'приёмов', 13: 'приёмов',
    14: 'приёмов', 21: 'приём', 22: 'приёма', 41: 'приём', 111: 'приёмов', 112: 'приёмов', 381: 'приём' }
  for (const [n, word] of Object.entries(cases)) assert.equal(helpCountLabel(Number(n)), `${n} ${word}`)
})

test('счётчики приёмов не пишут «приёмов» после числа вручную', () => {
  for (const f of ['src/pages/HelpCenter.tsx', 'src/pages/HelpSection.tsx', 'scripts/prerender-help.mjs']) {
    const src = readFileSync(new URL(`../${f}`, import.meta.url), 'utf8')
    assert.doesNotMatch(src, /\}\s*приём(ов|а)?\s+по шагам/, f)
    assert.match(src, /helpCountLabel\(/, f)
  }
  assert.equal(helpCountLabel(HELP_ARTICLES.length).split(' ')[0], String(HELP_ARTICLES.length))
})
