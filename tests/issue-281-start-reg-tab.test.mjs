import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'

const startHtml = readFileSync(new URL('../start.html', import.meta.url), 'utf8')
const homeSource = readFileSync(new URL('../src/pages/Home.tsx', import.meta.url), 'utf8')
const knowledgeBaseSource = readFileSync(new URL('../src/pages/KnowledgeBase.tsx', import.meta.url), 'utf8')

test('start.html activates the registration tab when #reg hash is present', () => {
  assert.match(
    startHtml,
    /location\.hash\s*===\s*['"]#reg['"]/,
    'start.html must check location.hash for #reg',
  )
  assert.match(
    startHtml,
    /Регистрация/,
    'start.html must look for the Регистрация tab by text',
  )
  assert.match(
    startHtml,
    /\.click\(\)/,
    'start.html must click the registration tab to activate it',
  )
  assert.match(
    startHtml,
    /setTimeout.*_openRegTab/s,
    'start.html must retry tab activation to handle deferred rendering',
  )
})

test('registration-intent CTAs in Home use start.html#reg', () => {
  const regIntentLabels = ['Попробовать самому', 'Начать бесплатно']

  for (const label of regIntentLabels) {
    const labelPos = homeSource.indexOf(label)
    assert.ok(labelPos !== -1, `Expected to find the "${label}" CTA`)

    // Search in the 600 chars surrounding the label (href comes before the text content)
    const surrounding = homeSource.slice(Math.max(0, labelPos - 600), labelPos + label.length)
    assert.match(
      surrounding,
      /href="https:\/\/ideav\.ru\/start\.html#reg"/,
      `The "${label}" CTA must link to start.html#reg`,
    )
  }
})

test('KnowledgeBase registration CTA uses start.html#reg', () => {
  const regSection = knowledgeBaseSource.match(
    /Зарегистрируйте бесплатный аккаунт[\s\S]*?href="([^"]+)"/,
  )
  assert.ok(regSection, 'Expected the registration CTA section in KnowledgeBase')
  assert.equal(
    regSection[1],
    'https://ideav.ru/start.html#reg',
    'KnowledgeBase registration CTA must link to start.html#reg',
  )
})
