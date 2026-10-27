import assert from 'node:assert/strict'
import { test } from 'node:test'
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, cpSync, existsSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { resolve } from 'node:path'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { QUERY_SECTIONS } from '../src/data/queryDocs.mjs'
import { API_SECTIONS } from '../src/data/apiDocs.mjs'
import { DOCS_RING, docsRingFor, docsRingHtml } from '../src/data/docsRing.mjs'
import { footerNavGroups } from '../src/data/nav.mjs'

// backlogram#802: страница «Запросы» /queries.html — нормальный справочник
// вместо статьи базы знаний в кольце «См. также»; кольцо выведено и на
// /stored-procedures.html, где его не было.

const repo = fileURLToPath(new URL('..', import.meta.url))
const read = (p) => readFileSync(resolve(repo, p), 'utf8')
const indexHtml = read('index.html')
const router = read('src/router.tsx')
const procPage = read('src/pages/ProcDocs.tsx')
const procPrerender = read('scripts/prerender-procedures.mjs')
const htaccess = read('public/.htaccess')
const sitemap = read('public/sitemap.xml')

const allText = JSON.stringify(QUERY_SECTIONS)

function prerender(script, out) {
  const work = mkdtempSync(resolve(tmpdir(), 'queries-prerender-'))
  mkdirSync(resolve(work, 'dist'), { recursive: true })
  mkdirSync(resolve(work, 'scripts'), { recursive: true })
  cpSync(resolve(repo, `scripts/${script}`), resolve(work, `scripts/${script}`))
  cpSync(resolve(repo, 'src/data'), resolve(work, 'src/data'), { recursive: true })
  writeFileSync(resolve(work, 'dist/index.html'), indexHtml)
  execFileSync('node', [`scripts/${script}`], { cwd: work })
  const path = resolve(work, 'dist', out)
  assert.ok(existsSync(path), `нет dist/${out}`)
  return readFileSync(path, 'utf8')
}

test('страница «Запросы» покрывает движок: адрес, форматы, параметры, соединения, рекурсия, права', () => {
  for (const s of ['report/950?JSON_KV', 'JSON_KV', 'JSON_DATA', 'X-Query-Id', 'FR_', 'TO_', 'ORDER=', 'RECORD_COUNT', '[TODAY]', '[USER_ID]', '_request_.', 'LEFT JOIN', 'RECURSIVE', 'Именем в отчёте', 't102', 'производной таблицей']) {
    assert.ok(allText.includes(s), `в странице нет «${s}»`)
  }
  // Создание запросов командами API остаётся в api.html#reports — не дублируем.
  assert.ok(!allText.includes('_m_new/22'), 'создание запросов должно остаться в api.html#reports')
})

test('кольцо: /queries.html вместо статьи базы знаний, у stored-procedures появилось «См. также»', () => {
  assert.ok(DOCS_RING.some((d) => d.href === '/queries.html'))
  assert.ok(!DOCS_RING.some((d) => d.href.includes('knowledge-base')), 'кольцо не должно вести в базу знаний')
  // Порядок кольца: api → queries → triggers → stored-procedures → templater.
  assert.deepEqual(docsRingFor('/stored-procedures.html').map((d) => d.href), ['/templater.html', '/api.html', '/queries.html', '/triggers.html'])
  assert.ok(docsRingHtml('/queries.html').includes('docs-see-also'))
  // Кольцо на странице процедур — и в React, и в пререндере.
  assert.match(procPage, /DocsSeeAlso path=\{PROC_META\.path\}/)
  assert.match(procPrerender, /docsRingHtml\(PATH\)/)
})

test('маршрут, редирект, подвал, sitemap и сборка знают /queries.html', () => {
  assert.match(router, /path: 'queries\.html'/)
  assert.match(router, /import\('\.\/pages\/QueryDocs'\)/)
  const build = JSON.parse(read('package.json')).scripts.build
  assert.ok(build.includes('prerender-queries.mjs'))
  assert.ok(build.indexOf('prerender-queries.mjs') < build.indexOf('prerender-landing.mjs'))
  assert.match(htaccess, /^\s*RewriteRule \^queries\/\?\$ \/queries\.html \[R=301,L\]/m)
  assert.ok(htaccess.indexOf('^queries/?$') < htaccess.search(/^\s*RewriteRule \^ index\.php/m))
  assert.match(sitemap, /<loc>https:\/\/ideav\.ru\/queries\.html<\/loc>/)
  assert.ok(footerNavGroups.flatMap((g) => g.links).some((l) => l.href === '/queries.html'))
})

test('api.html#report-run ведёт на полный справочник /queries.html', () => {
  const reports = API_SECTIONS.find((s) => s.id === 'reports')
  const run = reports.topics.find((t) => t.id === 'report-run')
  assert.ok(run.blocks.some((b) => b.link?.href === '/queries.html'), 'нет ссылки на /queries.html')
})

test('пререндеры выдают снапшот с кольцом', () => {
  const queries = prerender('prerender-queries.mjs', 'queries.html')
  assert.ok(queries.includes('<h1>Запросы</h1>'))
  assert.ok(queries.includes('docs-see-also'))
  assert.ok(queries.includes('X-Query-Id'))
  const procedures = prerender('prerender-procedures.mjs', 'stored-procedures.html')
  assert.ok(procedures.includes('docs-see-also'), 'в снапшоте процедур нет кольца')
})
