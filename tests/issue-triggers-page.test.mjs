import assert from 'node:assert/strict'
import { test } from 'node:test'
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, cpSync, existsSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { resolve } from 'node:path'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { TRIGGER_META, TRIGGER_SECTIONS } from '../src/data/triggerDocs.mjs'
import { footerNavGroups } from '../src/data/nav.mjs'

// Триггеры кнопок (python2node#866, ideav/crm#5116): страница /triggers.html
// рядом со справочником API. Тест держит маршрут, снапшот без JS, покрытие
// событий/запросов/формул и валидность JSON-примеров `action`.

const repo = fileURLToPath(new URL('..', import.meta.url))
const indexHtml = readFileSync(resolve(repo, 'index.html'), 'utf8')
const router = readFileSync(resolve(repo, 'src/router.tsx'), 'utf8')
const htaccess = readFileSync(resolve(repo, 'public/.htaccess'), 'utf8')
const sitemap = readFileSync(resolve(repo, 'public/sitemap.xml'), 'utf8')

function makeWorkspace(prefix) {
  const work = mkdtempSync(resolve(tmpdir(), prefix))
  mkdirSync(resolve(work, 'dist'), { recursive: true })
  mkdirSync(resolve(work, 'scripts'), { recursive: true })
  cpSync(resolve(repo, 'scripts/prerender-triggers.mjs'), resolve(work, 'scripts/prerender-triggers.mjs'))
  cpSync(resolve(repo, 'src/data'), resolve(work, 'src/data'), { recursive: true })
  writeFileSync(resolve(work, 'dist/index.html'), indexHtml)
  return work
}

const allTopics = TRIGGER_SECTIONS.flatMap((s) => s.topics)
const allText = JSON.stringify(TRIGGER_SECTIONS)

test('подвал ведёт на /triggers.html рядом с API', () => {
  const links = footerNavGroups.flatMap((g) => g.links)
  assert.ok(links.some((l) => l.href === '/triggers.html'), 'в подвале нет /triggers.html')
})

test('SPA знает маршрут, build пререндерит страницу до главной, /triggers уводит на /triggers.html', () => {
  assert.match(router, /path: 'triggers\.html'/)
  assert.match(router, /import\('\.\/pages\/TriggerDocs'\)/)
  const build = JSON.parse(readFileSync(resolve(repo, 'package.json'), 'utf8')).scripts.build
  assert.ok(build.includes('prerender-triggers.mjs'))
  assert.ok(build.indexOf('prerender-triggers.mjs') < build.indexOf('prerender-landing.mjs'))
  assert.match(htaccess, /^\s*RewriteRule \^triggers\/\?\$ \/triggers\.html \[R=301,L\]/m)
  assert.ok(
    htaccess.indexOf('^triggers/?$') < htaccess.search(/^\s*RewriteRule \^ index\.php/m),
    'правило /triggers должно стоять выше front controller движка',
  )
  assert.match(sitemap, /<loc>https:\/\/ideav\.ru\/triggers\.html<\/loc>/)
})

test('справочник покрывает события, запросы, формулы и API-команды; якоря уникальны', () => {
  const ids = TRIGGER_SECTIONS.flatMap((s) => [s.id, ...s.topics.map((t) => t.id)])
  assert.equal(new Set(ids).size, ids.length, 'якоря разделов и тем должны быть уникальны')
  for (const id of ['events', 't-query', 'query-on', 'query-params', 'formula-syntax', 'when', 'runner-user', 'd-action', 'm-action', 'order', 'chains', 'limits', 'logs', 'cases', 'checklist']) {
    assert.ok(allTopics.some((t) => t.id === id), `нет темы ${id}`)
  }
  // Ключевые факты из docs/kb/button-columns.md и include/button_triggers.php.
  for (const s of ['`PRESS`', '`CREATE`', '`UPDATE`', '`DELETE`', '`READ`', '`recompute`', '`when`', '`user`', 'bt_chain', 'BUTTON_TRIGGER_BASE_URL', '_m_action', 'JSON_KV', '[ID]', '[VAL]', '{Колонка}', '60 задач']) {
    assert.ok(allText.includes(s), `в справочнике нет «${s}»`)
  }
})

test('ссылка описана как событие только PRESS', () => {
  const linkTopic = allTopics.find((t) => t.id === 't-link')
  assert.ok(linkTopic, 'нет темы про ссылку')
  assert.ok(JSON.stringify(linkTopic).includes('не бывает триггером'))
})

test('JSON-описания action в примерах — валидный JSON', () => {
  const codes = allTopics.flatMap((t) => t.blocks.filter((b) => b.t === 'code' && b.lang === 'bash').map((b) => b.code))
  let checked = 0
  for (const code of codes) {
    for (const m of code.matchAll(/-F 'action=([\s\S]*?)'/g)) {
      assert.doesNotThrow(() => JSON.parse(m[1]), `action не JSON: ${m[1].slice(0, 80)}`)
      checked++
    }
  }
  assert.ok(checked >= 3, `проверено только ${checked} JSON-описаний действия`)
})

test('prerender-triggers пишет crawlable dist/triggers.html со всем справочником', () => {
  const work = makeWorkspace('triggers-prerender-')
  execFileSync('node', ['scripts/prerender-triggers.mjs'], { cwd: work })
  const outPath = resolve(work, 'dist/triggers.html')
  assert.ok(existsSync(outPath))
  const out = readFileSync(outPath, 'utf8')

  assert.doesNotMatch(out, /<div id="root"><\/div>/)
  assert.match(out, /<div id="root">\s*<article id="triggers-prerender"/)
  assert.match(out, /<link rel="canonical" href="https:\/\/ideav\.ru\/triggers\.html" \/>/)
  const title = out.match(/<title>([\s\S]*?)<\/title>/)[1]
  assert.equal(title, TRIGGER_META.title)
  assert.ok(title.length <= 60, `title длиннее 60: ${title.length}`)
  const desc = out.match(/<meta name="description" content="([\s\S]*?)"/)[1]
  assert.ok(desc.length <= 158, `description длиннее 158: ${desc.length}`)

  for (const t of allTopics) assert.ok(out.includes(`<article id="${t.id}">`), `в снапшоте нет темы ${t.id}`)
  // Без JS конструктор заменяется указанием на интерактивную версию.
  assert.match(out, /Конструктор работает на странице в браузере[\s\S]{0,300}#builder/)
  // Код экранирован, токены на месте.
  assert.ok(out.includes('X-Authorization: $TOKEN'))
  assert.ok(out.includes('&quot;Оплачен&quot;') || out.includes('&quot;текст&quot;'), 'кавычки в коде не экранированы')
})
