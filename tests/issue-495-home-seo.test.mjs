// issue #495 — технические SEO-шаги по главной (хвост af.md из #488):
// Title/Description, совпадение H1, FAQPage на 7 вопросов, SoftwareApplication,
// alt-тексты, внутренняя перелинковка.
//
// Тесты держат ровно те инварианты, которые легко разъезжаются: главная —
// SPA с РУКОПИСНЫМ статическим снапшотом (scripts/prerender-landing.mjs), и
// краулер видит именно его, а не React. До #495 в снапшоте были старый H1 и
// 3 старых вопроса, пока на странице уже стояли новый H1 и 7 вопросов.
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, cpSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { resolve } from 'node:path'
import { execFileSync } from 'node:child_process'
import { HOME_FAQ } from '../src/data/home-faq.mjs'
import { USE_CASES } from '../src/data/usecases.mjs'

const repo = new URL('..', import.meta.url).pathname
const read = (p) => readFileSync(resolve(repo, p), 'utf8')

const indexHtml = read('index.html')
const homeTsx = read('src/pages/Home.tsx')

// Укорочены под пиксельные лимиты выдачи (issue #516): было 721 px и 1168 px
// при лимитах 580 px и 1000 px. Сам замер — в tests/index-seo-meta.test.mjs.
const TITLE = 'Интеграм — no-code конструктор приложений | Замена Excel'
const DESCRIPTION =
  'Из Excel-таблицы — веб-приложение за 45 минут. Реляционные данные, on-premise, права доступа. Российский no-code в реестре отечественного ПО.'
const H1 =
  'Интеграм — российский no-code конструктор приложений и баз данных: замена Excel и аналог Airtable для бизнеса'

/** Прогоняет пререндер главной в песочнице и отдаёт получившийся dist/index.html. */
function prerender() {
  const work = mkdtempSync(resolve(tmpdir(), 'issue-495-'))
  mkdirSync(resolve(work, 'dist'), { recursive: true })
  mkdirSync(resolve(work, 'scripts'), { recursive: true })
  cpSync(resolve(repo, 'scripts/prerender-landing.mjs'), resolve(work, 'scripts/prerender-landing.mjs'))
  cpSync(resolve(repo, 'src/data'), resolve(work, 'src/data'), { recursive: true })
  writeFileSync(resolve(work, 'dist/index.html'), indexHtml)
  execFileSync('node', ['scripts/prerender-landing.mjs'], { cwd: work })
  return readFileSync(resolve(work, 'dist/index.html'), 'utf8')
}

const out = prerender()
const jsonLd = JSON.parse(
  out.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1].replace(/\\u003c/g, '<'),
)
const node = (t) => jsonLd['@graph'].find((n) => n['@type'] === t)

// ── 1. Title и Description ────────────────────────────────────────────────
test('index.html несёт title и description из af.md (блок 15)', () => {
  assert.ok(indexHtml.includes(`<title>${TITLE}</title>`), 'title не совпадает с af.md')
  assert.ok(
    indexHtml.includes(`<meta name="description" content="${DESCRIPTION}" />`),
    'description не совпадает с af.md',
  )
  // Description держим в пределах разумного сниппета — иначе Google обрежет.
  assert.ok(DESCRIPTION.length <= 200, `description ${DESCRIPTION.length} символов — слишком длинный`)
})

// ── 2. H1 совпадает в React и в снапшоте ──────────────────────────────────
test('H1 в статическом снапшоте совпадает с H1 героя Home.tsx', () => {
  const hero = homeTsx.match(/<motion\.h1[\s\S]*?<\/motion\.h1>/)
  assert.ok(hero, 'не найден <motion.h1> в герое Home.tsx')
  const reactH1 = hero[0]
    .replace(/^<motion\.h1[^>]*>/, '')
    .replace(/<\/motion\.h1>$/, '')
    .replace(/<[^>]+>/g, '')
    .replace(/\s+/g, ' ')
    .trim()

  assert.equal(reactH1, H1, 'H1 в Home.tsx разошёлся с af.md')

  const snapshotH1 = out.match(/<h1[^>]*>([\s\S]*?)<\/h1>/)[1].replace(/\s+/g, ' ').trim()
  assert.equal(snapshotH1, H1, 'H1 в снапшоте разошёлся с H1 на странице')
})

// ── 3. FAQPage на 7 вопросов из общего источника ──────────────────────────
test('FAQ главной — один источник на React и пререндер, 7 вопросов', () => {
  assert.equal(HOME_FAQ.length, 7, 'в af.md (блок 13) — ровно 7 вопросов')

  // React рендерит вопросы из общего модуля, а не из захардкоженного массива.
  assert.match(homeTsx, /import \{ HOME_FAQ \} from '\.\.\/data\/home-faq'/)
  assert.match(homeTsx, /HOME_FAQ\.map\(/)

  // Все 7 пар видны в статическом снапшоте…
  for (const { q, a } of HOME_FAQ) {
    assert.ok(out.includes(q), `вопрос отсутствует в снапшоте: ${q}`)
    assert.ok(out.includes(a.slice(0, 60)), `ответ отсутствует в снапшоте: ${q}`)
  }

  // …и ровно они же — в разметке FAQPage.
  const faqPage = node('FAQPage')
  assert.ok(faqPage, 'нет узла FAQPage')
  assert.equal(faqPage.mainEntity.length, 7)
  assert.deepEqual(
    faqPage.mainEntity.map((q) => q.name),
    HOME_FAQ.map((item) => item.q),
  )
  assert.deepEqual(
    faqPage.mainEntity.map((q) => q.acceptedAnswer.text),
    HOME_FAQ.map((item) => item.a),
    'текст ответа в разметке должен совпадать с видимым на странице',
  )
})

// ── 4. SoftwareApplication ────────────────────────────────────────────────
test('SoftwareApplication описывает продукт и не выдумывает рейтинг', () => {
  const app = node('SoftwareApplication')
  assert.ok(app, 'нет узла SoftwareApplication')
  assert.equal(app.applicationCategory, 'BusinessApplication')
  assert.equal(app.operatingSystem, 'Web')
  assert.ok(Array.isArray(app.featureList) && app.featureList.length >= 5, 'нужен featureList возможностей')
  assert.equal(app.offers.price, '0')
  assert.equal(app.offers.priceCurrency, 'RUB')
  assert.ok(!('aggregateRating' in app), 'фиктивный рейтинг запрещён правилами Google')
})

// ── 5. alt-тексты ─────────────────────────────────────────────────────────
test('у картинок главной есть содержательный alt (декоративные — пустой + aria-hidden)', () => {
  const images = homeTsx.match(/<img[\s\S]*?\/>/g) ?? []
  assert.ok(images.length >= 4, 'ожидались фон героя и три скриншота кейсов')

  for (const img of images) {
    const alt = img.match(/alt="([^"]*)"/)
    assert.ok(alt, `у <img> нет атрибута alt: ${img.slice(0, 80)}`)
    if (alt[1] === '') {
      // Пустой alt допустим только для декоративного изображения, спрятанного
      // от скринридера — иначе картинка молча выпадает из индекса и из озвучки.
      assert.match(img, /aria-hidden="true"/, `пустой alt без aria-hidden: ${img.slice(0, 80)}`)
      continue
    }
    assert.ok(alt[1].length >= 40, `alt слишком короткий и без ключевых слов: ${alt[1]}`)
    assert.match(alt[1], /Интеграм|Excel/i, `alt без ключевых слов: ${alt[1]}`)
  }
})

// ── 6. Внутренняя перелинковка ────────────────────────────────────────────
const KB_SLUGS = [...read('src/data/knowledgeBase.ts').matchAll(/^\s{4}slug: '([^']+)'/gm)].map((m) => m[1])
const PAGES = [
  '/excel-to-app.html',
  '/agent-platforms.html',
  '/catalog-matching.html',
  '/konstruktor-prilozhenij.html',
  '/informatsionnaya-sistema.html',
  '/sravnenie-s-bitrix-amocrm.html',
  '/tokens.html',
  '/knowledge-base',
  '/resheniya.html',
  '/privacy',
  ...USE_CASES.map((u) => `/${u.slug}.html`),
  ...KB_SLUGS.map((s) => `/knowledge-base/${s}.html`),
]

test('каждая внутренняя ссылка главной ведёт на существующий маршрут', () => {
  const hrefs = new Set([
    ...[...homeTsx.matchAll(/to="(\/[^"#]*)"/g)].map((m) => m[1]),
    ...[...homeTsx.matchAll(/href: '(\/[^']*)'/g)].map((m) => m[1]),
    ...HOME_FAQ.map((item) => item.link?.href).filter(Boolean),
  ])
  assert.ok(hrefs.size >= 15, `перелинковки мало: ${hrefs.size} ссылок`)
  for (const href of hrefs) {
    assert.ok(PAGES.includes(href), `битая внутренняя ссылка: ${href}`)
  }
})

test('ключевые блоки главной ведут на свою посадочную', () => {
  // Готовые типы проектов → решения; отрасли «Для кого» → решения;
  // карточки «конструкторы падают» и FAQ → база знаний.
  for (const href of [
    '/crm-uchet-klientov.html', // CRM и системы учёта клиентов
    '/baza-zayavok.html', // Service Desk / ИТ-компании
    '/skladskoy-uchet.html', // инвентаризация / логистика
    '/finansovyy-uchet.html', // бюджетирование / финансовые компании
    '/upravlenie-proektami.html', // строительные компании / кейс 1
    '/catalog-matching.html', // центры управления НСИ
  ]) {
    assert.ok(homeTsx.includes(href), `на главной нет ссылки на ${href}`)
  }

  // Ссылки перелинковки видны и краулеру — то есть попали в снапшот.
  assert.ok(out.includes('href="/excel-to-app.html"'))
  assert.ok(out.includes('href="/knowledge-base/02-excel-row-limit.html"'), 'ссылки FAQ не попали в снапшот')
})
