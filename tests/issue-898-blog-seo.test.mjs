/**
 * Issue #898 — правки по аудиту SEO/GEO поста «Бережливое производство (Lean)».
 * Большая часть замечаний оказалась шаблонной и касалась всех постов блога:
 *
 *  - автор «Команда Интеграм» шёл в разметку как Person — коллективный автор
 *    теперь ссылается на Organization;
 *  - третья хлебная крошка (раздел) вела на главную блога, а не на /category/…/;
 *  - Organization блога была урезанной (без description/sameAs) и с битым логотипом
 *    /logo.png — теперь тот же узел, что у главной;
 *  - даты отдавались как «полночь UTC» — без явного времени идёт чистая дата;
 *  - дата на странице без <time datetime>;
 *  - у обложки не было width/height (CLS);
 *  - CTA, «Следующий выпуск» и подвал были заголовками H2/H3 и попадали в структуру статьи;
 *  - <title> и meta description обрезались в выдаче — короткие версии в seoTitle/seoDescription;
 *  - нет оглавления и FAQ — добавлены оглавление и блок вопросов с FAQPage.
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, readdirSync } from 'node:fs'

const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8')
const jsonld = read('blog-v2/src/lib/jsonld.ts')
const page = read('blog-v2/src/pages/posts/[...slug].astro')
const footer = read('blog-v2/src/components/Footer.astro')
const POSTS = 'blog-v2/src/content/posts/'

test('коллективный автор — Organization, живой — Person', () => {
  // #905: третьим аргументом приходит профиль автора-человека
  assert.match(jsonld, /author: authorNode\(site, author, authorProfile\)/)
  assert.doesNotMatch(jsonld, /author: \{ '@type': 'Person', name: author \}/)
  const m = jsonld.match(/return (\/\^\(команда\|редакция\)[^\n]*?\/i)\.test/)
  assert.ok(m, 'регэксп коллективного автора на месте')
  const re = eval(m[1])
  assert.ok(re.test('Команда Интеграм'))
  assert.ok(re.test('Редакция'))
  assert.ok(!re.test('Алексей Семёнов'))
})

test('крошка раздела ведёт на страницу раздела', () => {
  assert.match(jsonld, /section && sectionUrl \? \[\{ name: section, url: sectionUrl \}\]/)
  assert.match(page, /sectionUrl: absoluteWithBase\(`\/category\/\$\{categorySlug\(post\.data\.category\)\}\/`/)
})

test('Organization блога совпадает с главной: description, sameAs, живой логотип', () => {
  const landing = read('scripts/prerender-landing.mjs')
  assert.match(jsonld, /sameAs: \[/)
  assert.match(jsonld, /logos\/integram-og\.png/)
  assert.doesNotMatch(jsonld, /\/logo\.png/)
  const desc = jsonld.match(/description:\s*'([^']+)'/)[1]
  assert.ok(landing.includes(desc), 'описание организации то же, что на главной')
})

test('дата без времени — чистая дата, на странице есть <time datetime>', async () => {
  const { machineDate } = await import('../blog-v2/src/lib/dates.mjs')
  assert.equal(machineDate(new Date('2026-11-07')), '2026-11-07')
  // #905: момент отдаётся по Москве с поясом, а не в Z
  assert.equal(machineDate(new Date('2026-11-07T09:30:00Z')), '2026-11-07T12:30:00+03:00')
  assert.match(page, /<time datetime=\{published\}/)
  assert.doesNotMatch(page, /toISOString\(\)/)
})

test('обложка с размерами и приоритетом загрузки', () => {
  assert.match(page, /width=\{heroSize\?\.width\}/)
  assert.match(page, /height=\{heroSize\?\.height\}/)
  assert.match(page, /fetchpriority="high"/)
})

test('CTA, «Следующий выпуск» и подвал — не заголовки', () => {
  const tail = page.slice(page.indexOf('<!-- CTA'))
  assert.doesNotMatch(tail.slice(0, tail.indexOf('<!-- Return link')), /<h2/)
  assert.doesNotMatch(footer, /<h3/)
})

test('оглавление и FAQ с разметкой FAQPage', () => {
  assert.match(page, /aria-label="Содержание"/)
  assert.match(page, /showToc = toc\.length >= 4/)
  assert.match(jsonld, /'@type': 'FAQPage'/)
  assert.match(page, /<h2 id=\{FAQ_ID\}>Частые вопросы<\/h2>/)
})

/**
 * Грубый разбор скалярного поля фронтматтера: кавычки по краям и продолжение
 * значения на следующих строках с отступом (plain-скаляр YAML склеивает их пробелом).
 */
function field(fm, key) {
  const m = fm.match(new RegExp(`^${key}:[ \\t]*(.*(?:\\r?\\n[ \\t]+\\S.*)*)`, 'm'))
  if (!m) return undefined
  return m[1].replace(/\r?\n[ \t]+/g, ' ').trim().replace(/^(['"])(.*)\1$/s, '$2').replace(/''/g, "'")
}

test('seo-поле не врезано в середину многострочного значения', () => {
  for (const f of readdirSync(new URL(`../${POSTS}`, import.meta.url))) {
    if (!f.endsWith('.md')) continue
    assert.doesNotMatch(read(POSTS + f), /^seo(Title|Description): .*\r?\n[ \t]+\S/m, f)
  }
})

test('у каждого поста <title> и description влезают в сниппет', () => {
  const bad = []
  for (const f of readdirSync(new URL(`../${POSTS}`, import.meta.url))) {
    if (!f.endsWith('.md')) continue
    const fm = read(POSTS + f).split(/^---$/m)[1]
    const title = field(fm, 'seoTitle') ?? field(fm, 'title')
    const desc = field(fm, 'seoDescription') ?? field(fm, 'description')
    if ((title + ' — Интеграм').length > 70) bad.push(`${f}: title ${title.length}`)
    if (desc.length > 160) bad.push(`${f}: description ${desc.length}`)
  }
  assert.deepEqual(bad, [])
})

test('пост Lean: без тавтологии в заголовке, с источниками и вопросами', () => {
  const post = read(POSTS + 'berezhlivoe-proizvodstvo-lean-instrumenty.md')
  assert.doesNotMatch(post, /собранные по Lean/)
  assert.match(post, /ru\.wikipedia\.org\/wiki\/Бережливое_производство/)
  assert.match(post, /ГОСТ Р 56020-2020/)
  assert.doesNotMatch(post, /до 90% усилий/)
  assert.ok((post.match(/^- q: /gm) ?? []).length >= 4)
})
