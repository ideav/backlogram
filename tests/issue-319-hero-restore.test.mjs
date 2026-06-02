import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'

const homeSource = readFileSync(new URL('../src/pages/Home.tsx', import.meta.url), 'utf8')

function getHeroSection(source) {
  const match = source.match(/\{\/\* 1\. Hero Section \*\/\}[\s\S]*?<\/section>/)
  assert.ok(match, 'Expected the hero section to exist')
  return match[0]
}

function getPromoSection(source) {
  const match = source.match(/\{\/\* 1b\. Excel.*?promo \*\/\}[\s\S]*?<\/section>/)
  assert.ok(match, 'Expected the excel promo section (1b) to exist')
  return match[0]
}

test('hero H1 is the original «ускорение внутренней разработки» offer', () => {
  const hero = getHeroSection(homeSource)
  const h1 = hero.match(/<motion\.h1[\s\S]*?<\/motion\.h1>/)
  assert.ok(h1, 'Expected the hero H1 to exist')
  assert.match(h1[0], /ускорения/)
  assert.match(h1[0], /внутренней разработки/)
})

test('hero lead paragraph speaks to ИТ-teams about relieving programmers', () => {
  const hero = getHeroSection(homeSource)
  const lead = hero.match(/<motion\.p[\s\S]*?<\/motion\.p>/)
  assert.ok(lead, 'Expected the hero lead paragraph to exist')
  assert.match(lead[0], /Разгрузите программистов/)
})

test('hero primary CTA points to #cta contact form', () => {
  const hero = getHeroSection(homeSource)
  assert.match(hero, /href="#cta"/)
  assert.match(hero, /Отправить задачу из очереди задач/)
})

test('excel-to-app promo link is preserved below the hero (section 1b)', () => {
  const promo = getPromoSection(homeSource)
  assert.match(promo, /to="\/excel-to-app\.html"/)
})
