// python2node#1203 — посадочные с калькулятором потерь и служебная /cost-of-inaction.
// Пути — через fileURLToPath (на Windows .pathname даёт «/C:/…»).
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { LOSS_LANDINGS, LOSS_INDEXABLE } from '../src/data/lossLandings.mjs'
import { USE_CASES } from '../src/data/usecases.mjs'
import { staticNavLinks } from '../src/data/nav.mjs'
import { computeLoss, defaultValues, formatRub } from '../src/lib/lossCalc.mjs'

const repo = fileURLToPath(new URL('..', import.meta.url))
const read = (p) => readFileSync(resolve(repo, p), 'utf8')
const sitemap = read('public/sitemap.xml')
const llms = read('public/llms.txt')

const INDEXED = ['poisk-po-dokumentam', 'planirovanie-zakupok', 'platezhnyj-kalendar']
const bySlug = (s) => LOSS_LANDINGS.find((p) => p.slug === s)
const totalOf = (s) => {
  const { calc } = bySlug(s)
  return computeLoss(calc, defaultValues(calc)).total
}

test('три индексируемые страницы и одна служебная есть в данных', () => {
  assert.deepEqual(LOSS_INDEXABLE.map((p) => p.slug), INDEXED)
  assert.equal(bySlug('cost-of-inaction')?.indexable, false)
})

test('slug закупок не конкурирует с upravlenie-zakupkami', () => {
  assert.ok(!USE_CASES.some((u) => INDEXED.includes(u.slug)))
  assert.notEqual(bySlug('planirovanie-zakupok').slug, 'upravlenie-zakupkami')
})

test('индексируемые страницы — в sitemap, llms.txt и статической навигации', () => {
  const nav = new Set(staticNavLinks().map((l) => l.href))
  for (const s of INDEXED) {
    assert.ok(sitemap.includes(`<loc>https://ideav.ru/${s}.html</loc>`), `${s} не в sitemap`)
    assert.ok(llms.includes(`https://ideav.ru/${s}.html`), `${s} не в llms.txt`)
    assert.ok(nav.has(`/${s}.html`), `${s} не в nav`)
  }
})

test('cost-of-inaction: не в sitemap, llms.txt и nav', () => {
  assert.ok(!sitemap.includes('cost-of-inaction'))
  assert.ok(!llms.includes('cost-of-inaction'))
  assert.ok(!staticNavLinks().some((l) => l.href.includes('cost-of-inaction')))
})

test('title/description укладываются в лимиты выдачи, title с суффиксом сайта', () => {
  for (const p of LOSS_LANDINGS) {
    assert.ok(p.seoTitle.endsWith(' | Интеграм'), p.slug)
    assert.ok(p.seoTitle.length <= 66, `${p.slug}: title ${p.seoTitle.length}`)
    assert.ok(p.metaDescription.length <= 158, `${p.slug}: description ${p.metaDescription.length}`)
  }
})

test('формулы при значениях по умолчанию дают суммы генератора', () => {
  assert.equal(Math.round(totalOf('poisk-po-dokumentam')), 4020000)
  assert.equal(Math.round(totalOf('planirovanie-zakupok')), 5522400)
  assert.equal(Math.round(totalOf('platezhnyj-kalendar')), 2300942)
  assert.equal(Math.round(totalOf('cost-of-inaction')), 11676000)
  assert.equal(formatRub(4020000), '4\u00a0020\u00a0000\u00a0₽')
})

test('в частях расчёта 1–4 формулы, все функции; id полей уникальны', () => {
  for (const p of LOSS_LANDINGS) {
    const ids = [...p.calc.fields, ...p.calc.assumptions].map((f) => f.id)
    assert.equal(new Set(ids).size, ids.length, p.slug)
    assert.ok(p.calc.parts.length >= 1 && p.calc.parts.length <= 4, p.slug)
    for (const part of p.calc.parts) assert.equal(typeof part.fn, 'function')
  }
})

test('пустое и мусорное значение поля не ломает расчёт', () => {
  const { calc } = bySlug('planirovanie-zakupok')
  const r = computeLoss(calc, { ...defaultValues(calc), vol: '', buyers: 'abc', stock: '-5' })
  assert.ok(Number.isFinite(r.total) && r.total >= 0)
})

test('страницы без eval и со ссылкой на буткемп; FAQ у индексируемых', () => {
  const src = read('src/data/lossLandings.mjs') + read('src/lib/lossCalc.mjs') + read('src/components/LossCalculator.tsx')
  assert.ok(!/\beval\s*\(|new Function\s*\(/.test(src))
  for (const p of LOSS_INDEXABLE) assert.ok(p.faq.length > 0 && p.case && p.steps && p.pains, p.slug)
})

test('перелинковка: новые → upravlenie-zakupkami / finansovyy-uchet, и обратно', () => {
  assert.ok(bySlug('planirovanie-zakupok').related.some((r) => r.href === '/upravlenie-zakupkami.html'))
  assert.ok(bySlug('platezhnyj-kalendar').related.some((r) => r.href === '/finansovyy-uchet.html'))
  const rel = (s) => USE_CASES.find((u) => u.slug === s).related.map((r) => r.href)
  assert.ok(rel('upravlenie-zakupkami').includes('/planirovanie-zakupok.html'))
  assert.ok(rel('finansovyy-uchet').includes('/platezhnyj-kalendar.html'))
})

test('router и build подключают страницы', () => {
  assert.match(read('src/router.tsx'), /LOSS_LANDINGS/)
  assert.match(read('package.json'), /prerender-loss-landings\.mjs/)
})
