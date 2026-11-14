// Один шаблон посадочной для Директа с подменой заголовка (python2node#1233).
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { FOCUS_LANDINGS, FOCUS_PATH, focusById } from '../src/data/focusLandings.mjs'
import { focusIdFromSearch, headlineFromSearch, headlineFromTerm } from '../src/lib/focusHeadline.mjs'

test('топ-10 фокусов, id уникальны и годятся для ?f=', () => {
  assert.equal(FOCUS_LANDINGS.length, 10)
  const ids = FOCUS_LANDINGS.map((f) => f.id)
  assert.equal(new Set(ids).size, ids.length)
  for (const id of ids) {
    assert.equal(focusIdFromSearch(`?f=${id}`), id)
    assert.equal(focusById(id)?.id, id)
  }
})

test('уже сделанные страницы в шаблон не входят', () => {
  const titles = FOCUS_LANDINGS.map((f) => f.navTitle.toLowerCase()).join(' | ')
  for (const done of ['платёжный календарь', 'excel', 'дашборд', 'нси']) assert.ok(!titles.includes(done), done)
})

test('каждый фокус заполнен полностью', () => {
  for (const f of FOCUS_LANDINGS) {
    assert.equal(f.pains.length, 3, f.id)
    assert.ok(f.we.length >= 4, f.id)
    assert.equal(f.metrics.length, 3, f.id)
    assert.ok(f.case.segment && f.case.text && f.check, f.id)
    assert.ok(f.h1.length <= 70, `${f.id}: H1 длиннее 70`)
    assert.ok(f.phrases.length >= 2, f.id)
  }
})

test('кейсы обезличены: имён клиентов нет', () => {
  const text = JSON.stringify(FOCUS_LANDINGS)
  for (const name of [/атех/i, /atex/i, /ateh/i, /петфуд/i, /баир/i, /спортзани/i, /hr link/i, /xcom/i, /upsound/i, /промприбор/i]) {
    assert.ok(!name.test(text), String(name))
  }
})

test('фраза Директа становится заголовком', () => {
  assert.equal(headlineFromTerm('программа учета склада'), 'Программа учета склада')
  assert.equal(headlineFromTerm('erp для производства'), 'ERP для производства')
  assert.equal(headlineFromTerm('дашборд 1с'), 'Дашборд 1С')
  // Операторы и минус-слова Директа убираются.
  assert.equal(headlineFromTerm('"!сменное +задание" -бесплатно -скачать'), 'Сменное задание')
  assert.equal(headlineFromTerm('[план факт] анализ'), 'План факт анализ')
  // Каждая фраза замера подставляется.
  for (const f of FOCUS_LANDINGS) for (const p of f.phrases) assert.ok(headlineFromTerm(p), `${f.id}: ${p}`)
})

test('мусор не подставляется', () => {
  assert.equal(headlineFromTerm('---autotargeting'), null)
  assert.equal(headlineFromTerm('wms system'), null)
  assert.equal(headlineFromTerm('<script>alert(1)</script> склад'), null)
  assert.equal(headlineFromTerm('ск'), null)
  assert.equal(headlineFromTerm('склад '.repeat(20)), null)
  assert.equal(headlineFromTerm(null), null)
})

test('порядок источников заголовка: h, utm_term, keyword', () => {
  assert.equal(headlineFromSearch('?f=sklad&h=Свой%20текст&utm_term=склад'), 'Свой текст')
  assert.equal(headlineFromSearch('?f=sklad&utm_term=%D1%83%D1%87%D0%B5%D1%82+%D1%81%D0%BA%D0%BB%D0%B0%D0%B4%D0%B0'), 'Учет склада')
  assert.equal(headlineFromSearch('?keyword=автоматизация склада'), 'Автоматизация склада')
  assert.equal(headlineFromSearch('?f=sklad'), null)
  assert.equal(focusIdFromSearch('?f=../etc'), null)
  assert.equal(focusIdFromSearch(''), null)
})

test('маршрут, пререндер в сборке, noindex и нет в sitemap', () => {
  const router = readFileSync(new URL('../src/router.tsx', import.meta.url), 'utf8')
  assert.match(router, new RegExp(`path: '${FOCUS_PATH}\\.html', element: <FocusLanding`))
  const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'))
  const build = pkg.scripts.build
  assert.ok(build.indexOf('prerender-focus-landing.mjs') > 0)
  assert.ok(build.indexOf('prerender-focus-landing.mjs') < build.indexOf('prerender-landing.mjs'))
  const pre = readFileSync(new URL('../scripts/prerender-focus-landing.mjs', import.meta.url), 'utf8')
  assert.match(pre, /noindex, nofollow/)
  const sitemap = readFileSync(new URL('../public/sitemap.xml', import.meta.url), 'utf8')
  assert.ok(!sitemap.includes(`/${FOCUS_PATH}.html`))
})
