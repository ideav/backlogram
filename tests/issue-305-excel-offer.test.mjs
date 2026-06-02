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
  assert.ok(match, 'Expected the excel promo section to exist')
  return match[0]
}

test('hero primary CTA leads to the #cta section (restored old offer, issue #319)', () => {
  const hero = getHeroSection(homeSource)
  // Primary CTA is a plain <a> pointing at #cta (the contact form)
  assert.match(hero, /href="#cta"/)
  assert.match(hero, /Отправить задачу из очереди задач/)
})

test('excel-to-app promo section is present below the hero with a link to /excel-to-app.html', () => {
  const promo = getPromoSection(homeSource)
  assert.match(promo, /to="\/excel-to-app\.html"/)
  assert.match(promo, /Загрузит/)
})
