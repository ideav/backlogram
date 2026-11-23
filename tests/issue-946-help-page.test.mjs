import assert from 'node:assert/strict'
import { test } from 'node:test'
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, cpSync, existsSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { resolve } from 'node:path'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { HELP_META, HELP_INTRO, HELP_SECTIONS, HELP_ARTICLES, HELP_SAMPLE_QUESTIONS } from '../src/data/helpCenter.mjs'
import { buildIndex, consult, search, stem } from '../src/lib/helpSearch.mjs'
import { API_SECTIONS } from '../src/data/apiDocs.mjs'
import { QUERY_SECTIONS } from '../src/data/queryDocs.mjs'
import { TEMPLATER_SECTIONS } from '../src/data/templaterDocs.mjs'
import { TRIGGER_SECTIONS } from '../src/data/triggerDocs.mjs'
import { PROC_SECTIONS } from '../src/data/procDocs.mjs'
import { DOCS_RING } from '../src/data/docsRing.mjs'
import { footerNavGroups } from '../src/data/nav.mjs'

// backlogram#946 (эпик ideav/crm#5603): сайт помощи /help.html — ликбез,
// псевдо-ИИ-консультант по базе приёмов, оглавление с поиском, статьи по шагам.

const repo = fileURLToPath(new URL('..', import.meta.url))
const read = (p) => readFileSync(resolve(repo, p), 'utf8')
const index = buildIndex(HELP_ARTICLES)

test('разделы на месте и статей много', () => {
  const ids = HELP_SECTIONS.map((s) => s.id)
  for (const id of ['recipes', 'structure', 'data', 'queries', 'templater', 'access', 'automation', 'api']) {
    assert.ok(ids.includes(id), `нет раздела ${id}`)
  }
  for (const s of HELP_SECTIONS) {
    assert.ok(s.title && s.lead, `${s.id}: нет title/lead`)
    assert.ok(s.articles.length >= 10, `${s.id}: всего ${s.articles.length} статей`)
  }
  assert.ok(HELP_ARTICLES.length >= 180, `всего ${HELP_ARTICLES.length} статей`)
})

test('ликбез: что это, архитектура, применение, словарик', () => {
  assert.ok(HELP_INTRO.lead.length >= 1)
  const ids = HELP_INTRO.blocks.map((b) => b.id)
  for (const id of ['what', 'architecture', 'uses']) assert.ok(ids.includes(id), `нет блока ${id}`)
  assert.ok(HELP_INTRO.glossary.length >= 8)
})

test('у каждой статьи: уникальный id-якорь, задача, ответ, шаги, формулировки вопроса', () => {
  const seen = new Set(['basics', 'consultant', ...HELP_SECTIONS.map((s) => s.id)])
  const BLOCKS = new Set(['p', 'note', 'list', 'code', 'table', 'img'])
  for (const a of HELP_ARTICLES) {
    assert.match(a.id, /^[a-z0-9]+(-[a-z0-9]+)*$/, `плохой id ${a.id}`)
    assert.ok(a.id.startsWith(`${a.sectionId}-`), `${a.id}: префикс раздела ${a.sectionId}`)
    assert.ok(!seen.has(a.id), `повтор id ${a.id}`)
    seen.add(a.id)
    assert.ok(a.title && a.summary, `${a.id}: нет title/summary`)
    assert.ok((a.ask ?? []).length >= 2, `${a.id}: меньше двух формулировок ask`)
    assert.ok((a.steps ?? []).length >= 1 || (a.blocks ?? []).length >= 1, `${a.id}: ни шагов, ни блоков`)
    for (const b of a.blocks ?? []) assert.ok(BLOCKS.has(b.t), `${a.id}: неизвестный блок ${b.t}`)
    if (a.level) assert.ok(['start', 'pro'].includes(a.level), `${a.id}: level ${a.level}`)
  }
})

// Якоря справочников сайта: id разделов и тем.
const anchorsOf = (sections) => new Set(sections.flatMap((s) => [s.id, ...(s.topics ?? []).map((t) => t.id)]))
const PAGE_ANCHORS = {
  '/api.html': anchorsOf(API_SECTIONS),
  '/queries.html': anchorsOf(QUERY_SECTIONS),
  '/templater.html': anchorsOf(TEMPLATER_SECTIONS),
  '/triggers.html': anchorsOf(TRIGGER_SECTIONS),
  '/stored-procedures.html': anchorsOf(PROC_SECTIONS),
  // С #961 приёмы живут на страницах разделов, на хабе — ликбез и оглавление.
  '/help.html': new Set(['basics', 'consultant', 'sections', ...HELP_SECTIONS.map((s) => s.id)]),
  ...Object.fromEntries(HELP_SECTIONS.map((s) => [s.path, new Set(s.articles.map((a) => a.id))])),
}
const KB_SLUGS = new Set([...read('src/data/knowledgeBase.ts').matchAll(/slug: '([^']+)'/g)].map((m) => m[1]))
const SITE_PAGES = new Set(
  [...read('public/sitemap.xml').matchAll(/<loc>https:\/\/ideav\.ru(\/[^<]*)<\/loc>/g)].map((m) => m[1]),
)

test('ссылки статей ведут на живые страницы и якоря сайта', () => {
  for (const a of HELP_ARTICLES) {
    for (const l of a.links ?? []) {
      assert.ok(l.text, `${a.id}: ссылка без текста`)
      assert.match(l.href, /^\/|^https:\/\/dev\.mysql\.com\/|^https:\/\/www\.php\.net\//, `${a.id}: внешняя ссылка ${l.href}`)
      if (!l.href.startsWith('/')) continue
      const [path, hash] = l.href.split('#')
      const kb = path.match(/^\/knowledge-base\/([^/]+)\/?$/)
      if (kb) {
        assert.ok(KB_SLUGS.has(kb[1]), `${a.id}: нет статьи базы знаний ${kb[1]}`)
        continue
      }
      if (PAGE_ANCHORS[path]) {
        if (hash) assert.ok(PAGE_ANCHORS[path].has(hash), `${a.id}: нет якоря ${l.href}`)
        continue
      }
      assert.ok(SITE_PAGES.has(path) || path === '/knowledge-base.html', `${a.id}: неизвестная страница ${l.href}`)
    }
  }
})

test('клиенты обезличены, секретов нет', () => {
  const text = JSON.stringify({ HELP_INTRO, HELP_SECTIONS }).toLowerCase()
  for (const name of ['sportzania', 'спортзани', 'xcom', 'timepad', 'petfood', 'петфуд', 'паклайн', 'pakline', 'upsound', 'promprib', 'промприбор', 'arenavladimir', 'спз', 'r7ohr', 'finmo', 'ateh', 'db1341', 'db3130', 'pilots', 'ideav.online', 'adeptetalon', 'x2a']) {
    assert.ok(!text.includes(name), `в тексте помощи клиент «${name}»`)
  }
  // Адреса баз — только учебные.
  for (const m of text.matchAll(/https?:\/\/ideav\.ru\/([a-z0-9_]+)/g)) {
    assert.ok(['mydb', 'my', 'download', 'api', 'help', 'queries', 'templater', 'triggers', 'stored', 'knowledge', 'blog', 'demo', 'mydb2', 'otherdb', 'newdb', 'sourcedb', 'targetdb', 'db', 'yourdb', 'test'].some((ok) => m[1] === ok || m[1].startsWith(ok)), `живая база в примере: ${m[0]}`)
  }
  assert.doesNotMatch(text, /x-authorization: (?!\$token)[a-z0-9]{16,}/, 'токен в примере')
})

test('лёгкий стемминг сводит формы слова', () => {
  assert.equal(stem('отчеты'), stem('отчетов'))
  assert.equal(stem('кнопки'), stem('кнопкой'))
})

test('консультант отвечает на типовые вопросы со встречи', () => {
  for (const q of HELP_SAMPLE_QUESTIONS) {
    const a = consult(index, q)
    assert.ok(a.best, `нет ответа на «${q}»`)
  }
  const expect = [
    ['как сделать выпадающий список', ['structure', 'recipes']],
    ['чтобы менеджер видел только своих клиентов', ['access', 'recipes']],
    ['кнопка, которая меняет статус', ['automation', 'recipes']],
    ['загрузить данные из Excel', ['data', 'recipes']],
    ['график продаж на дашборде', ['queries', 'recipes']],
    ['подключить ИИ-агента к базе', ['api', 'recipes']],
    ['своя страница с формой', ['templater', 'recipes']],
  ]
  for (const [q, sections] of expect) {
    const top = search(index, q, 3).map((h) => h.article.sectionId)
    assert.ok(top.some((s) => sections.includes(s)), `«${q}» → ${top.join(', ')}`)
  }
  assert.equal(consult(index, 'и или но').best, null, 'на стоп-слова ответа нет')
})

test('страница подключена: роут, сборка, .htaccess, sitemap, кольцо, подвал', () => {
  const router = read('src/router.tsx')
  assert.match(router, /path: 'help\.html',\s*element: <HelpCenter \/>/)
  assert.match(read('package.json'), /prerender-help\.mjs/)
  assert.match(read('public/.htaccess'), /RewriteRule \^help\/\?\$ \/help\.html \[R=301,L\]/)
  assert.match(read('public/sitemap.xml'), /<loc>https:\/\/ideav\.ru\/help\.html<\/loc>/)
  assert.ok(DOCS_RING.some((d) => d.href === HELP_META.path))
  const footerHrefs = footerNavGroups.flatMap((g) => g.links.map((l) => l.href))
  assert.ok(footerHrefs.includes('/help.html'), 'помощь в подвале')
  assert.ok(HELP_META.description.length <= 160)
})

test('пререндер кладёт ликбез в хаб, а каждую статью — на страницу её раздела', () => {
  const work = mkdtempSync(resolve(tmpdir(), 'help-prerender-'))
  mkdirSync(resolve(work, 'dist'), { recursive: true })
  mkdirSync(resolve(work, 'scripts'), { recursive: true })
  cpSync(resolve(repo, 'scripts/lib/root-main.mjs'), resolve(work, 'scripts/lib/root-main.mjs'))
  cpSync(resolve(repo, 'scripts/prerender-help.mjs'), resolve(work, 'scripts/prerender-help.mjs'))
  cpSync(resolve(repo, 'src/data'), resolve(work, 'src/data'), { recursive: true })
  // Подпись «обновлено» пререндер берёт из src/lib/dates.mjs (#959).
  cpSync(resolve(repo, 'src/lib/dates.mjs'), resolve(work, 'src/lib/dates.mjs'))
  writeFileSync(resolve(work, 'dist/index.html'), read('index.html'))
  execFileSync('node', ['scripts/prerender-help.mjs'], { cwd: work })
  const out = resolve(work, 'dist/help.html')
  assert.ok(existsSync(out))
  const html = readFileSync(out, 'utf8')
  assert.match(html, /<link rel="canonical" href="https:\/\/ideav\.ru\/help\.html"/)
  assert.match(html, /id="basics"/)
  for (const s of HELP_SECTIONS) {
    const page = readFileSync(resolve(work, 'dist', s.path.slice(1)), 'utf8')
    for (const a of s.articles) {
      assert.ok(page.includes(`id="${a.id}"`), `нет статьи ${a.id} на ${s.path}`)
      assert.ok(html.includes(`href="${s.path}#${a.id}"`), `хаб не ссылается на ${a.id}`)
      assert.ok(!html.includes(`id="${a.id}"`), `текст ${a.id} продублирован на хабе`)
    }
  }
})
