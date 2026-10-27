import assert from 'node:assert/strict'
import { test } from 'node:test'
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, cpSync, existsSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { resolve } from 'node:path'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { PROC_META, PROC_SECTIONS } from '../src/data/procDocs.mjs'
import { footerNavGroups } from '../src/data/nav.mjs'

// Запрос как хранимая процедура (ideav/crm#5260, источник — crm docs/
// query-as-stored-procedure.md из PR #5259): страница /stored-procedures.html
// рядом со справочником API и триггерами. Тест держит маршрут, снапшот без JS
// и ключевые факты о защите изменений и проверке прав вызывающего.

const repo = fileURLToPath(new URL('..', import.meta.url))
const indexHtml = readFileSync(resolve(repo, 'index.html'), 'utf8')
const router = readFileSync(resolve(repo, 'src/router.tsx'), 'utf8')
const htaccess = readFileSync(resolve(repo, 'public/.htaccess'), 'utf8')
const sitemap = readFileSync(resolve(repo, 'public/sitemap.xml'), 'utf8')
const llms = readFileSync(resolve(repo, 'public/llms.txt'), 'utf8')

function makeWorkspace(prefix) {
  const work = mkdtempSync(resolve(tmpdir(), prefix))
  mkdirSync(resolve(work, 'dist'), { recursive: true })
  mkdirSync(resolve(work, 'scripts'), { recursive: true })
  cpSync(resolve(repo, 'scripts/prerender-procedures.mjs'), resolve(work, 'scripts/prerender-procedures.mjs'))
  cpSync(resolve(repo, 'src/data'), resolve(work, 'src/data'), { recursive: true })
  writeFileSync(resolve(work, 'dist/index.html'), indexHtml)
  return work
}

const allTopics = PROC_SECTIONS.flatMap((s) => s.topics)
const allText = JSON.stringify(PROC_SECTIONS)

test('подвал и llms.txt ведут на /stored-procedures.html', () => {
  const links = footerNavGroups.flatMap((g) => g.links)
  assert.ok(links.some((l) => l.href === '/stored-procedures.html'), 'в подвале нет /stored-procedures.html')
  assert.ok(llms.includes('https://ideav.ru/stored-procedures.html'), 'в llms.txt нет страницы')
})

test('SPA знает маршрут, build пререндерит страницу до главной, /stored-procedures уводит на .html', () => {
  assert.match(router, /path: 'stored-procedures\.html'/)
  assert.match(router, /import\('\.\/pages\/ProcDocs'\)/)
  const build = JSON.parse(readFileSync(resolve(repo, 'package.json'), 'utf8')).scripts.build
  assert.ok(build.includes('prerender-procedures.mjs'))
  assert.ok(build.indexOf('prerender-procedures.mjs') < build.indexOf('prerender-landing.mjs'))
  assert.match(htaccess, /^\s*RewriteRule \^stored-procedures\/\?\$ \/stored-procedures\.html \[R=301,L\]/m)
  assert.ok(
    htaccess.indexOf('^stored-procedures/?$') < htaccess.search(/^\s*RewriteRule \^ index\.php/m),
    'правило /stored-procedures должно стоять выше front controller движка',
  )
  assert.match(sitemap, /<loc>https:\/\/ideav\.ru\/stored-procedures\.html<\/loc>/)
})

test('справочник покрывает сборку, вызов, права вызывающего и целостность; якоря уникальны', () => {
  const ids = PROC_SECTIONS.flatMap((s) => [s.id, ...s.topics.map((t) => t.id)])
  assert.equal(new Set(ids).size, ids.length, 'якоря разделов и тем должны быть уникальны')
  for (const id of ['why', 'set-column', 'example', 'preview', 'confirm', 'execute', 'grant', 'caller', 'limiters', 'in-transaction', 'journal', 'checklist']) {
    assert.ok(allTopics.some((t) => t.id === id), `нет темы ${id}`)
  }
  // Ключевые факты из crm docs/query-as-stored-procedure.md и index.php.
  for (const s of ['`t132`', '`confirmed=1`', '`_xsrf`', 'EXECUTE', 'InTransaction', '[USER_ID]', '[ROLE_ID]', '`t100`', '!%', '_sql.jsonl']) {
    assert.ok(allText.includes(s), `в справочнике нет «${s}»`)
  }
})

test('ограничитель без «Имени в отчёте» описан как защита от подмены фильтра', () => {
  const limiters = allTopics.find((t) => t.id === 'limiters')
  assert.ok(JSON.stringify(limiters).includes('t100'))
  assert.match(JSON.stringify(limiters), /подмен/)
})

test('prerender-procedures пишет crawlable dist/stored-procedures.html со всем справочником', () => {
  const work = makeWorkspace('procedures-prerender-')
  execFileSync('node', ['scripts/prerender-procedures.mjs'], { cwd: work })
  const outPath = resolve(work, 'dist/stored-procedures.html')
  assert.ok(existsSync(outPath))
  const out = readFileSync(outPath, 'utf8')

  assert.doesNotMatch(out, /<div id="root"><\/div>/)
  assert.match(out, /<div id="root">\s*<article id="procedures-prerender"/)
  assert.match(out, /<link rel="canonical" href="https:\/\/ideav\.ru\/stored-procedures\.html" \/>/)
  const title = out.match(/<title>([\s\S]*?)<\/title>/)[1]
  assert.equal(title, PROC_META.title)
  assert.ok(title.length <= 60, `title длиннее 60: ${title.length}`)
  const desc = out.match(/<meta name="description" content="([\s\S]*?)"/)[1]
  assert.ok(desc.length <= 158, `description длиннее 158: ${desc.length}`)

  for (const t of allTopics) assert.ok(out.includes(`<article id="${t.id}">`), `в снапшоте нет темы ${t.id}`)
  assert.ok(out.includes('X-Authorization: $TOKEN'))
})
