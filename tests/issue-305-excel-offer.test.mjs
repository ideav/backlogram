import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'

const homeSource = readFileSync(new URL('../src/pages/Home.tsx', import.meta.url), 'utf8')

function getHeroSection(source) {
  const match = source.match(/\{\/\* 1\. Hero Section \*\/\}[\s\S]*?<\/section>/)
  assert.ok(match, 'Expected the hero section to exist')
  return match[0]
}

test('hero leads with the single «Из Excel — приложение за час» offer', () => {
  const hero = getHeroSection(homeSource)

  const h1 = hero.match(/<motion\.h1[\s\S]*?<\/motion\.h1>/)
  assert.ok(h1, 'Expected the hero H1 to exist')
  assert.match(h1[0], /Из Excel —/)
  assert.match(h1[0], /приложение за час/)

  // The lead paragraph speaks to the accountant / logistician / shop-floor manager.
  const lead = hero.match(/<motion\.p[\s\S]*?<\/motion\.p>/)
  assert.ok(lead, 'Expected the hero lead paragraph to exist')
  assert.match(lead[0], /бухгалтеру, логисту, начальнику цеха/)

  // The old «ускорение внутренней разработки» framing must be gone from the hero.
  assert.doesNotMatch(hero, /ускорения<\/span> внутренней разработки/)
})

test('hero primary CTA leads to the A1 «Excel → приложение» landing (#303)', () => {
  const hero = getHeroSection(homeSource)
  const cta = hero.match(/<Link\b[\s\S]*?<\/Link>/)
  assert.ok(cta, 'Expected the hero primary CTA to be a react-router Link')
  assert.match(cta[0], /to="\/excel-to-app\.html"/)
  assert.match(cta[0], /Загрузить Excel/)
})
