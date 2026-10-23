import assert from 'node:assert/strict'
import { test } from 'node:test'
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, cpSync, existsSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { resolve } from 'node:path'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { API_META, API_SECTIONS } from '../src/data/apiDocs.mjs'
import { footerNavGroups } from '../src/data/nav.mjs'

// Описание API переехало на ideav.ru (ideav/crm#5247): подвал вёл на
// недоделанную integram.io/api.html. Тест держит маршрут, снапшот без JS и
// разделы, которых не было на старой странице: системные объекты и запросы.

const repo = fileURLToPath(new URL('..', import.meta.url))
const indexHtml = readFileSync(resolve(repo, 'index.html'), 'utf8')
const router = readFileSync(resolve(repo, 'src/router.tsx'), 'utf8')
const htaccess = readFileSync(resolve(repo, 'public/.htaccess'), 'utf8')
const sitemap = readFileSync(resolve(repo, 'public/sitemap.xml'), 'utf8')

function makeWorkspace(prefix) {
  const work = mkdtempSync(resolve(tmpdir(), prefix))
  mkdirSync(resolve(work, 'dist'), { recursive: true })
  mkdirSync(resolve(work, 'scripts'), { recursive: true })
  cpSync(resolve(repo, 'scripts/prerender-api.mjs'), resolve(work, 'scripts/prerender-api.mjs'))
  cpSync(resolve(repo, 'src/data'), resolve(work, 'src/data'), { recursive: true })
  writeFileSync(resolve(work, 'dist/index.html'), indexHtml)
  return work
}

const allTopics = API_SECTIONS.flatMap((s) => s.topics)
const allText = JSON.stringify(API_SECTIONS)

test('подвал ведёт на своё /api.html, а не на integram.io', () => {
  const links = footerNavGroups.flatMap((g) => g.links)
  assert.ok(links.some((l) => l.href === '/api.html'), 'в подвале нет /api.html')
  assert.ok(!links.some((l) => l.href.includes('integram.io/api')), 'подвал всё ещё ведёт на integram.io/api.html')
})

test('SPA знает маршрут, build пререндерит страницу до главной, /api уводит на /api.html', () => {
  assert.match(router, /path: 'api\.html'/)
  assert.match(router, /import\('\.\/pages\/ApiDocs'\)/)
  const build = JSON.parse(readFileSync(resolve(repo, 'package.json'), 'utf8')).scripts.build
  assert.ok(build.includes('prerender-api.mjs'))
  assert.ok(build.indexOf('prerender-api.mjs') < build.indexOf('prerender-landing.mjs'))
  assert.match(htaccess, /^\s*RewriteRule \^api\/\?\$ \/api\.html \[R=301,L\]/m)
  assert.ok(
    htaccess.indexOf('^api/?$') < htaccess.search(/^\s*RewriteRule \^ index\.php/m),
    'правило /api должно стоять выше front controller движка',
  )
  assert.match(sitemap, /<loc>https:\/\/ideav\.ru\/api\.html<\/loc>/)
})

test('справочник покрывает системные объекты и запросы, якоря уникальны', () => {
  const ids = API_SECTIONS.flatMap((s) => [s.id, ...s.topics.map((t) => t.id)])
  assert.equal(new Set(ids).size, ids.length, 'якоря разделов и тем должны быть уникальны')
  for (const id of ['auth-token', 'auth-xsrf', 'role-new', 'user-new', 'grants', 'masks', 'menu', 'report-new', 'report-formula', 'report-filters', 'report-run', 'batch']) {
    assert.ok(allTopics.some((t) => t.id === id), `нет темы ${id}`)
  }
  // Ключевые команды и поля системных таблиц из docs/kb ядра.
  for (const s of ['_m_new/18', 't20=', 't115=', '_m_new/42', '_m_new/116', 't136=53', 't49=[USER_ID]', '_m_new/22', '_m_new/28', 't104=SUM', 't101=', 'FR_', '_m_batch']) {
    assert.ok(allText.includes(s), `в справочнике нет «${s}»`)
  }
})

test('примеры с заголовком токена несут параметр JSON — без него ядро заголовок не читает', () => {
  const codes = allTopics.flatMap((t) => t.blocks.filter((b) => b.t === 'code' && b.lang === 'bash').map((b) => b.code))
  for (const code of codes) {
    for (const line of code.split('\n')) {
      if (!line.includes('X-Authorization')) continue
      const url = line.match(/"(https:\/\/[^"]+)"/)
      if (!url) continue
      assert.match(url[1], /[?&]JSON/, `запрос без JSON-параметра: ${line.trim()}`)
    }
  }
})

test('обращение по именам: тема есть, после имени таблицы в адресе нет косой черты', () => {
  assert.ok(allTopics.some((t) => t.id === 'names'), 'нет темы «Имена вместо кодов»')
  const codes = allTopics.flatMap((t) => t.blocks.filter((b) => b.t === 'code').map((b) => b.code))
  // object/Роль/?JSON_OBJ читает запись с пустым именем и отдаёт [] — в примерах только object/Роль?…
  const named = codes.flatMap((c) => [...c.matchAll(/\/mydb\/[a-z_]+\/([^/?"\s]+)\/\?/g)])
    .map((m) => m[1]).filter((seg) => !/^\d+$/.test(seg))
  assert.deepEqual(named, [], 'имя таблицы с косой чертой перед ?')
  for (const s of ['metadata/Пользователь', 'object/Роль?JSON_OBJ&F_Роль=', 'report/Клиенты%20по%20категориям', 'edit_obj/Роль/admin']) {
    assert.ok(allText.includes(s), `нет примера «${s}»`)
  }
})

test('prerender-api пишет crawlable dist/api.html со всем справочником', () => {
  const work = makeWorkspace('api-prerender-')
  execFileSync('node', ['scripts/prerender-api.mjs'], { cwd: work })
  const outPath = resolve(work, 'dist/api.html')
  assert.ok(existsSync(outPath))
  const out = readFileSync(outPath, 'utf8')

  assert.doesNotMatch(out, /<div id="root"><\/div>/)
  assert.match(out, /<div id="root">\s*<article id="api-prerender"/)
  assert.match(out, /<link rel="canonical" href="https:\/\/ideav\.ru\/api\.html" \/>/)
  const title = out.match(/<title>([\s\S]*?)<\/title>/)[1]
  assert.equal(title, API_META.title)
  assert.ok(title.length <= 60, `title длиннее 60: ${title.length}`)
  const desc = out.match(/<meta name="description" content="([\s\S]*?)"/)[1]
  assert.ok(desc.length <= 158, `description длиннее 158: ${desc.length}`)

  for (const t of allTopics) assert.ok(out.includes(`<article id="${t.id}">`), `в снапшоте нет темы ${t.id}`)
  // Код экранирован: HTML иконки меню не превратился в разметку, $TOKEN на месте.
  assert.ok(out.includes('&lt;i class=&quot;pi pi-users&quot;&gt;&lt;/i&gt;'))
  assert.ok(out.includes('X-Authorization: $TOKEN'))
})
