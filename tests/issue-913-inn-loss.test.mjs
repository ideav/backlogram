// backlogram#913 — «Сколько вы теряете в год без автоматизации» с данными по ИНН.
// Пути — через fileURLToPath (на Windows .pathname даёт «/C:/…»).
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { LOSS_LANDINGS } from '../src/data/lossLandings.mjs'
import { computeLoss, defaultValues } from '../src/lib/lossCalc.mjs'
import { companyAge, innValid, profileToValues } from '../src/lib/innProfile.mjs'
import { staticNavLinks } from '../src/data/nav.mjs'

const repo = fileURLToPath(new URL('..', import.meta.url))
const read = (p) => readFileSync(resolve(repo, p), 'utf8')
const page = LOSS_LANDINGS.find((p) => p.slug === 'poteri-po-inn')
const base = LOSS_LANDINGS.find((p) => p.slug === 'cost-of-inaction')

// Живой ответ /inn-lookup.php (ООО «Яндекс ДС», 09.11.2026), без лишних полей.
const PROFILE = {
  ok: true, found: true, inn: '7734454184', kind: 'ul', name: 'ООО "ЯНДЕКС ДС"', regDate: '2022-05-06',
  revenue: { year: 2025, rub: 372393000 }, expense: { year: 2025, rub: 483177000 },
  employees: { year: 2025, n: 112 }, contributions: { year: 2025, rub: 25239621.91 },
}

test('страница есть: служебная, со шагом ИНН и тем же расчётом, что /cost-of-inaction', () => {
  assert.ok(page)
  assert.equal(page.indexable, false)
  assert.equal(page.inn, true)
  assert.equal(page.h1, base.h1)
  assert.deepEqual(page.calc.parts, base.calc.parts)
  assert.deepEqual(page.calc.fields, base.calc.fields)
  assert.notEqual(page.calc.goal, base.calc.goal)
})

test('служебная: не в sitemap, llms.txt и nav', () => {
  assert.ok(!read('public/sitemap.xml').includes('poteri-po-inn'))
  assert.ok(!read('public/llms.txt').includes('poteri-po-inn'))
  assert.ok(!staticNavLinks().some((l) => l.href.includes('poteri-po-inn')))
})

test('контрольные цифры ИНН — как в PHP', () => {
  assert.equal(innValid('7734454184'), true)
  assert.equal(innValid('7707083893'), true)
  assert.equal(innValid('771675966776'), true)
  assert.equal(innValid('7734454185'), false)
  assert.equal(innValid('771675966777'), false)
  assert.equal(innValid('12345'), false)
  assert.equal(innValid(''), false)
  const php = read('public/inn-lookup.php')
  assert.match(php, /\[2, 4, 10, 3, 5, 9, 4, 6, 8\]/)
  assert.match(php, /\[3, 7, 2, 4, 10, 3, 5, 9, 4, 6, 8\]/)
})

test('данные ФНС → поля калькулятора', () => {
  const { values, facts } = profileToValues(PROFILE, 47)
  assert.equal(values.rev, 372.4)
  assert.equal(values.emp, 112)
  assert.equal(values.xls, 22)
  // (25,24 млн / 0,3 + 25,24 млн) / 112 / (47 × 40) ≈ 519 ₽ → 500
  assert.equal(values.a_rate, 500)
  assert.deepEqual(facts.map((f) => f.id), ['rev', 'emp', 'xls', 'a_rate'])
  const r = computeLoss(page.calc, { ...defaultValues(page.calc), ...values })
  assert.ok(r.total > 0 && Number.isFinite(r.total))
})

test('пустой профиль (ИП, банк, не найдено) ничего не подставляет', () => {
  assert.deepEqual(profileToValues({ ok: true, found: false, inn: '7707083893' }).values, {})
  assert.deepEqual(profileToValues({ ok: true, found: true, revenue: null, employees: null }).values, {})
  assert.deepEqual(profileToValues(null).values, {})
})

test('неправдоподобная стоимость часа не подставляется', () => {
  const tiny = { ...PROFILE, contributions: { year: 2025, rub: 1000 } }
  assert.equal(profileToValues(tiny).values.a_rate, undefined)
})

test('возраст компании — полных лет', () => {
  assert.equal(companyAge('2022-05-06', new Date(2026, 10, 9)), 4)
  assert.equal(companyAge('2022-11-10', new Date(2026, 10, 9)), 3)
  assert.equal(companyAge(null), null)
})

test('прокси: только GET, кэш, лимит, у ИП без ФИО', () => {
  const php = read('public/inn-lookup.php')
  assert.match(php, /INN_CACHE_TTL/)
  assert.match(php, /inn_rate_limited\(\)/)
  assert.match(php, /'Индивидуальный предприниматель'/)
  assert.match(php, /X-Robots-Tag: noindex/)
})

test('пререндер даёт форму ИНН, которая работает без JS', () => {
  const pre = read('scripts/prerender-loss-landings.mjs')
  assert.match(pre, /<form method="get" action="\/\$\{p\.slug\}\.html">/)
  assert.match(read('src/components/InnLookup.tsx'), /get\('inn'\)/)
})
