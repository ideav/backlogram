import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'

const homeSource = readFileSync(new URL('../src/pages/Home.tsx', import.meta.url), 'utf8')

function findAnchorByText(source, text) {
  const anchors = source.match(/<a\b[\s\S]*?<\/a>/g) ?? []
  return anchors.find((anchor) => anchor.includes(text))
}

test('special case CTA link stays in the current tab and lands below the fixed header', () => {
  const specialCaseLink = findAnchorByText(homeSource, 'У меня особый случай!')
  assert.ok(specialCaseLink, 'Expected the special case CTA link to exist')
  assert.match(specialCaseLink, /href="#cta"/)
  assert.doesNotMatch(
    specialCaseLink,
    /\btarget=/,
    'In-page CTA link should not open a named tab',
  )
  assert.doesNotMatch(
    specialCaseLink,
    /\brel=/,
    'In-page CTA link should not use external-link rel attributes',
  )

  const ctaSection = homeSource.match(/<section\s+id="cta"\s+className="([^"]+)"/)
  assert.ok(ctaSection, 'Expected the CTA section to exist')
  assert.match(
    ctaSection[1],
    /(?:^|\s)scroll-mt-\d+(?:\s|$)/,
    'CTA target needs scroll margin so the fixed header does not cover it',
  )
})

test('AI section exposes an in-page anchor for ad links', () => {
  const aiSection = homeSource.match(/\/\* 6\. AI Section \*\/[\s\S]*?<section\s+id="ai"\s+className="([^"]+)"/)
  assert.ok(aiSection, 'Expected the AI section to expose id="ai"')
})
