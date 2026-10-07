/**
 * Issue #659 — страница практикума для новичков на excel-to-app.ru.
 *
 * Задача просит описать порог вхождения: что должен уметь человек. План
 * практикума (приложен к issue) добавляет программу часа, честные границы и
 * форму с выбором «практикум / демонстрация» с раздельной аналитикой.
 *
 * Как и тест #626, проверяем исходники: сборка требует SITE_URL и не годится
 * для быстрого `npm test`.
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { test } from 'node:test'

const read = (p) => readFileSync(fileURLToPath(new URL(p, import.meta.url)), 'utf8')

const content = read('../site-excel/src/content.ts')
const page = read('../site-excel/src/pages/PraktikumPage.tsx')
const prerender = read('../site-excel/src/prerender.tsx')
const seo = read('../site-excel/src/seo.ts')
const landing = read('../site-excel/src/Landing.tsx')
const conversion = read('../site-excel/src/conversion.ts')
const order = read('../site-excel/public/order.php')
const og = read('../scripts/generate-excel-og.mjs')

const praktikum = content.slice(content.indexOf('export const PRAKTIKUM'), content.indexOf('/** Все адреса сайта'))

test('порог вхождения: что нужно уметь и чего уметь не нужно', () => {
  assert.match(praktikum, /skills: \[/)
  assert.match(praktikum, /notNeeded: \[/)
  assert.match(praktikum, /equipment: \[/)
  // Порог стоит первым содержательным блоком страницы.
  assert.ok(page.indexOf('Что нужно уметь') < page.indexOf('Программа часа'))
  assert.ok(page.includes('PRAKTIKUM.skills.map'))
  assert.ok(page.includes('PRAKTIKUM.notNeeded.map'))
})

test('название из плана, без обещания «овладеете ИИ за час»', () => {
  assert.match(praktikum, /title: 'Свой первый ИИ-проект за час: на ваших данных'/)
  assert.doesNotMatch(praktikum + page, /овладе/i)
})

test('программа часа покрывает все 60 минут', () => {
  const minutes = [...praktikum.matchAll(/minutes: '(\d+)–(\d+)'/g)].map(m => [+m[1], +m[2]])
  assert.equal(minutes[0][0], 0)
  assert.equal(minutes.at(-1)[1], 60)
  for (let i = 1; i < minutes.length; i++) assert.equal(minutes[i][0], minutes[i - 1][1], 'интервалы без дыр')
})

test('страница собирается, попадает в карту сайта и получает разметку и карточку', () => {
  assert.match(prerender, /renderToStaticMarkup\(<PraktikumPage \/>\)/)
  assert.match(prerender, /og\/praktikum\.png/)
  assert.match(content, /path: `\/\$\{PRAKTIKUM\.slug\}\/`/)
  assert.match(seo, /'@type': 'Course'/)
  assert.match(seo, /coursePrerequisites: PRAKTIKUM\.skills/)
  assert.match(og, /'praktikum\.png'/)
})

test('форма на главной: выбор «практикум / демонстрация» и раздельная цель', () => {
  assert.match(landing, /const PRAKTIKUM_HASH = '#praktikum'/)
  assert.match(landing, /data\.set\('format', format\)/)
  assert.match(conversion, /praktikum: 'praktikum_lead'/)
  assert.match(landing, /reachGoal\(GOALS\.praktikum/)
  // Ссылка со страницы практикума открывает только форму демонстрации:
  // блок разбора с целевой кнопкой кампании остаётся за первым кликом.
  assert.match(landing, /\{\(funnelOpen \|\| demoOpen\) && \(/)
  assert.match(landing, /\{funnelOpen && \(\s*<>\s*\{\/\* Следующий шаг: разбор \*\/\}/)
})

test('order.php помечает заявку на практикум, не меняя вид заявки', () => {
  assert.match(order, /\$praktikum = \$kind === 'demo' && \(\$data\['format'\] \?\? ''\) === 'praktikum';/)
  assert.match(order, /Заявка на практикум/)
})
