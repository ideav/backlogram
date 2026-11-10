import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'

const homeSource = readFileSync(new URL('../src/pages/Home.tsx', import.meta.url), 'utf8')

function getHeroSection(source) {
  const match = source.match(/\{\/\* 1\. Hero Section \*\/\}[\s\S]*?<\/section>/)
  assert.ok(match, 'Expected the hero section to exist')
  return match[0]
}

// issue #488 (af.md, блок 1): hero переписан ДОСЛОВНО из af.md под семантическое ядро —
// бренд + «no-code конструктор приложений и баз данных: замена Excel и аналог Airtable».
// python2node#1212: H1 сменён на «российская платформа для автоматизации бизнеса,
// которая подстраивается под вас».
// Тест пинит новый заголовок и лид (заменил прежний #319-гвард), чтобы копия не «уплыла».
test('hero H1 is the brand + «platform that adapts to you» positioning (p2n#1212)', () => {
  const hero = getHeroSection(homeSource)
  const h1 = hero.match(/<motion\.h1[\s\S]*?<\/motion\.h1>/)
  assert.ok(h1, 'Expected the hero H1 to exist')
  assert.match(h1[0], /Интеграм/)
  assert.match(h1[0], /российская платформа для автоматизации бизнеса, которая подстраивается под вас/)
})

test('hero subtitle right under H1 explains the positioning (p2n#1212)', () => {
  const hero = getHeroSection(homeSource)
  const afterH1 = hero.split('</motion.h1>')[1]
  const sub = afterH1.match(/^\s*(?:\{\/\*[\s\S]*?\*\/\}\s*)?<motion\.p[^>]*data-hero-subtitle[\s\S]*?<\/motion\.p>/)
  assert.ok(sub, 'Expected the subtitle paragraph immediately after the H1')
  assert.match(sub[0], /Видите всё, что происходит в бизнесе, управляете сами и меняете систему без программистов/)
})

test('hero lead paragraph is the af.md «из Excel — приложение за 45 минут» offer', () => {
  const hero = getHeroSection(homeSource)
  const lead = [...hero.matchAll(/<motion\.p[\s\S]*?<\/motion\.p>/g)].find((m) => !/data-hero-subtitle/.test(m[0]))
  assert.ok(lead, 'Expected the hero lead paragraph to exist')
  assert.match(lead[0], /Из Excel-таблицы — рабочее веб-приложение за 45 минут/)
  assert.match(lead[0], /В реестре отечественного ПО \(запись №30872\)/)
})

test('hero primary CTA points to #cta contact form', () => {
  const hero = getHeroSection(homeSource)
  assert.match(hero, /href="#cta"/)
  assert.match(hero, /Отправить задачу из очереди задач/)
})

// #827: промо-блок 1b «Загрузите Excel» переехал с главной в раздел «Заменить
// Excel» — путь к загрузке теперь: карточка раздела в hero → кнопка раздела.
test('hero leads to the section pages instead of the removed 1b promo', () => {
  const hero = getHeroSection(homeSource)
  assert.match(hero, /SITE_SECTIONS\.map/)
  assert.doesNotMatch(homeSource, /id="excel-promo"/)
})
