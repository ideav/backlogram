import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'

const homeSource = readFileSync(new URL('../src/pages/Home.tsx', import.meta.url), 'utf8')

function getHeroSection(source) {
  const match = source.match(/\{\/\* 1\. Hero Section \*\/\}[\s\S]*?<\/section>/)
  assert.ok(match, 'Expected the hero section to exist')
  return match[0]
}


test('hero primary CTA leads to the #cta section (restored old offer, issue #319)', () => {
  const hero = getHeroSection(homeSource)
  // Primary CTA is a plain <a> pointing at #cta (the contact form)
  assert.match(hero, /href="#cta"/)
  assert.match(hero, /Отправить задачу из очереди задач/)
})

// #827: промо «Загрузите Excel» переехало с главной в раздел «Заменить Excel»:
// его главная кнопка ведёт на /excel-to-app.html, а первый блок описывает,
// что происходит с таблицей.
test('the Excel section leads to /excel-to-app.html and explains what happens to the table', async () => {
  const { SITE_SECTIONS } = await import('../src/data/siteSections.mjs')
  const excel = SITE_SECTIONS.find((s) => s.slug === 'zamena-excel')
  assert.equal(excel.cta.href, '/excel-to-app.html')
  assert.match(excel.cta.text, /Загрузит/)
  assert.equal(excel.blocks[0].h2, 'Что происходит с вашей таблицей')
})
