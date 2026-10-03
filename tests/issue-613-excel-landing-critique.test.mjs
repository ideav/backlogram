import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { test } from 'node:test'

const read = (p) => readFileSync(fileURLToPath(new URL(p, import.meta.url)), 'utf8')

const landing = read('../site-excel/src/Landing.tsx')
const pricing = read('../site-excel/src/Pricing.tsx')
const cases = read('../site-excel/src/Cases.tsx')
const how = read('../site-excel/src/HowItWorks.tsx')
// С issue #626 цены, кейсы и тексты сравнения переехали в content.ts: их
// читают ещё отдельные страницы, /llms.txt, /pricing.md и JSON-LD. Разметка
// осталась в компонентах, поэтому проверяем и то и другое.
const content = read('../site-excel/src/content.ts')

// Критика в issue #613: на лендинге нет цен, кейсов, объяснения механизма и
// сравнения с Power Apps / Quickbase. Тесты держат ответ на каждый пункт.

test('цены из макета владельца на месте', () => {
  for (const price of ['20 000', 'от 93 750', '590 000', 'от 1 950', '3 750', '4 900']) {
    assert.ok(content.includes(price), `нет цены «${price}»`)
  }
  assert.match(pricing, /PRICING_GROUPS\.map/)
})

test('цены видны без клика, а целевая кнопка — по-прежнему только в воронке', () => {
  const [beforeFunnel] = landing.split('{funnelOpen && (')
  // С #619 карточки цен открывают модальную заявку, а не воронку.
  assert.match(beforeFunnel, /<Pricing onOrder=\{setExpressPlan\} \/>/)
  assert.match(beforeFunnel, /href="#ceny"/)
  // Карточки цен не шлют целевую цель сами.
  assert.ok(!pricing.includes('reachSignupGoal'), 'карточки цен не должны слать signup_click')
  assert.ok(!pricing.includes('Записаться на разбор'), 'вторая целевая кнопка обойдёт защиту')
})

test('price_open уходит один раз и только через проверку на человека', () => {
  assert.match(landing, /if \(!funnelOpen && looksHuman\(\)\) reachGoal\(GOALS\.priceOpen/)
})

test('слайдер «было → стало» — четыре реальных кейса', () => {
  for (const client of ['Атекс', 'ПЕТФУД', 'XCOM', 'Спортзания']) {
    assert.ok(content.includes(`client: '${client}'`), `нет кейса ${client}`)
  }
  assert.match(cases, /CASES\.map\(\(item, i\) =>/)
  assert.match(landing, /<Cases onZoom=\{setZoomed\} \/>/)
})

test('скриншоты в кейсах — только обезличенные, с заменённым логотипом', () => {
  // Исходники из ideav/crm/screenshots/articles несут логотип клиента; на
  // лендинг идут только перерисованные копии uc-demo-* и демо-экраны uc-petfood-*.
  const shots = [...content.matchAll(/src: '(img\/[^']+)'/g)].map(m => m[1])
  assert.deepEqual(shots, [
    'img/uc-petfood-1.png', 'img/uc-petfood-2.png', 'img/uc-petfood-3.png',
    'img/uc-atex-1.png', 'img/uc-atex-2.png', 'img/uc-atex-3.png',
    'img/uc-xcom-1.png', 'img/uc-xcom-2.png', 'img/uc-xcom-3.png',
    'img/uc-demo-ceo.png', 'img/uc-demo-grafiki.png', 'img/uc-demo-klienty.png',
  ])
  for (const shot of shots) readFileSync(fileURLToPath(new URL(`../site-excel/public/${shot}`, import.meta.url)))
  assert.ok(!/sportzania/i.test(shots.join()), 'исходные файлы с логотипом на лендинг не идут')
})

test('механизм и сравнение с конкурентами показаны, со ссылкой на подробности', () => {
  assert.match(how, /Как агент читает вашу структуру/)
  assert.match(content, /Power Apps/)
  assert.match(content, /Quickbase/)
  assert.match(content, /https:\/\/ideav\.ru\/blog\/posts\/excel-v-prilozhenie-za-45-minut/)
  assert.match(how, /href=\{BLOG_POST_URL\}/)
  assert.match(landing, /<HowItWorks \/>/)
})
