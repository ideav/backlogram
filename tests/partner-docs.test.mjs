import assert from 'node:assert/strict'
import { test } from 'node:test'
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, cpSync, existsSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { resolve } from 'node:path'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { PARTNER_DOCS } from '../src/data/partner-docs.mjs'

// ideav/courses#3: оферта партнёрской программы, оферта для адептов и страница
// взаимодействия. Тест держит маршруты, порядок пререндера, снапшоты без JS и
// ключевые условия, утверждённые владельцем 04.11.2026.

const repo = fileURLToPath(new URL('..', import.meta.url))
const indexHtml = readFileSync(resolve(repo, 'index.html'), 'utf8')
const router = readFileSync(resolve(repo, 'src/router.tsx'), 'utf8')
const sitemap = readFileSync(resolve(repo, 'public/sitemap.xml'), 'utf8')
const data = readFileSync(resolve(repo, 'src/data/partner-docs.mjs'), 'utf8')
const FILES = ['partner-offer.html', 'adept-offer.html', 'partner-adept.html']

test('SPA знает маршруты трёх документов', () => {
  for (const f of FILES) assert.match(router, new RegExp(`path: '${f.replace('.', '\\.')}'`))
  assert.match(router, /import\('\.\/pages\/PartnerDoc'\)/)
})

test('build: пререндер документов после базы знаний и до главной', () => {
  const build = JSON.parse(readFileSync(resolve(repo, 'package.json'), 'utf8')).scripts.build
  const i = build.indexOf('prerender-partner-docs.mjs')
  assert.ok(i > 0)
  assert.ok(build.indexOf('prerender-knowledge-base.mjs') < i)
  assert.ok(i < build.indexOf('prerender-landing.mjs'))
})

test('документы есть в sitemap', () => {
  for (const f of FILES) assert.match(sitemap, new RegExp(`<loc>https://ideav\\.ru/${f.replace('.', '\\.')}</loc>`))
})

test('ключевые условия, утверждённые владельцем', () => {
  assert.match(data, /15% от каждой Оплаты Привлечённого клиента/)
  assert.match(data, /40% начисляются вместо 15%, а не в дополнение к ним/)
  assert.match(data, /начисляется бессрочно/)
  assert.match(data, /Основание для вознаграждения — регистрация клиента в Интеграме по Партнёрской ссылке/)
  assert.match(data, /50% от суммы, которую клиент оплатил Интеграму за фазу/)
  assert.match(data, /брендовым запросам/)
  assert.doesNotMatch(data, /Интегром/, 'опечатка в названии')
  assert.doesNotMatch(data, /35%/, 'доля Интеграма — внутренняя, на сайт не выносится')
})

test('title и description в лимитах выдачи', () => {
  for (const d of Object.values(PARTNER_DOCS)) {
    assert.ok(d.meta.title.length <= 60, `${d.key}: title ${d.meta.title.length}`)
    assert.ok(d.meta.description.length <= 158, `${d.key}: description ${d.meta.description.length}`)
  }
})

test('prerender-partner-docs пишет три crawlable страницы и не трогает index.html', () => {
  const work = mkdtempSync(resolve(tmpdir(), 'partner-docs-'))
  mkdirSync(resolve(work, 'dist'), { recursive: true })
  mkdirSync(resolve(work, 'scripts'), { recursive: true })
  cpSync(resolve(repo, 'scripts/prerender-partner-docs.mjs'), resolve(work, 'scripts/prerender-partner-docs.mjs'))
  cpSync(resolve(repo, 'src/data'), resolve(work, 'src/data'), { recursive: true })
  writeFileSync(resolve(work, 'dist/index.html'), indexHtml)

  execFileSync('node', ['scripts/prerender-partner-docs.mjs'], { cwd: work })

  for (const d of Object.values(PARTNER_DOCS)) {
    const out = readFileSync(resolve(work, 'dist', d.meta.path.slice(1)), 'utf8')
    assert.match(out, /<div id="root">\s*<article id="pd-prerender"/)
    assert.ok(out.includes(`<h1 itemprop="headline">${d.meta.h1}</h1>`), d.key)
    assert.ok(out.includes(`<link rel="canonical" href="https://ideav.ru${d.meta.path}" />`), d.key)
    assert.match(out, /"@type":"WebPage"/)
    assert.match(out, /ИНН: 9716002710/)
    assert.doesNotMatch(out, /\{link\}/, 'плейсхолдер ссылки должен быть развёрнут')
  }
  const model = readFileSync(resolve(work, 'dist/partner-adept.html'), 'utf8')
  assert.match(model, /<a href="\/partner-offer\.html">/)
  assert.match(model, /<a href="\/self-hosting\.html">/)
  assert.equal(readFileSync(resolve(work, 'dist/index.html'), 'utf8'), indexHtml)
  assert.ok(existsSync(resolve(work, 'dist/adept-offer.html')))
})

// ideav/courses#26: агентские условия по курсам — раздел той же оферты, без
// второго договора; ставки и механика совпадают с courses/pricing/commissions.
test('раздел «Курсы Интеграма» в оферте партнёрской программы', () => {
  const offer = PARTNER_DOCS['partner-offer']
  const kursy = offer.sections.find((s) => s.id === 'kursy')
  assert.ok(kursy, 'нет раздела #kursy — на него ссылается ideav.ru/kurs/agents.html')
  const text = JSON.stringify(kursy.blocks)
  assert.match(text, /\?aff=<номер Партнёра>/)
  assert.match(text, /AG<номер Партнёра>/)
  assert.match(text, /скидку 5%/)
  assert.match(text, /на 180 дней/)
  assert.match(text, /40% от первой оплаты/)
  assert.match(text, /15% от последующих оплат/)
  assert.match(text, /5% от оплат курсов/)
  assert.match(text, /через 14 дней после оплаты курса/)
  assert.match(text, /Отдельный договор для этого не заключается/)
})
