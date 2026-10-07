/**
 * Issue #657 — посадочные страницы excel-to-app.ru (ТЗ «массовый запуск»).
 *
 * Страница = JSON в site-excel/landings/, шаблон — LandingPage.tsx, проверки
 * раздела 11.2 ТЗ — site-excel/landings.mjs. Тесты ниже гоняют проверки на
 * настоящих данных и на заведомо бракованных, а сборку не запускают: она
 * требует SITE_URL и идёт секунды (как и в issue-626-excel-seo.test.mjs).
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { test } from 'node:test'
import { CTA_LABEL, LIMITS, loadLandings, validateLandings } from '../site-excel/landings.mjs'

const read = p => readFileSync(fileURLToPath(new URL(p, import.meta.url)), 'utf8')

// Существующие страницы домена — как их отдаёт PAGES из content.ts.
const EXISTING = [
  { path: '/', title: 'Excel остаётся Excel’ем — сделаем из него приложение', description: 'Главная.' },
  { path: '/keysy/proizvodstvo-kormov/', title: 'Кейс ПЕТФУД', description: 'Кейс 1.' },
  { path: '/keysy/rezka-termorulonov/', title: 'Кейс Атекс', description: 'Кейс 2.' },
  { path: '/keysy/sopostavlenie-zayavok/', title: 'Кейс XCOM', description: 'Кейс 3.' },
  { path: '/keysy/upravlenie-kompaniej/', title: 'Кейс Спортзания', description: 'Кейс 4.' },
  { path: '/sravnenie-power-apps/', title: 'Сравнение', description: 'Сравнение.' },
]

const landings = loadLandings()
const main = landings.find(p => p.slug === 'mgnovennyj-start')

/** Копия страницы с другим адресом и своими текстами — «чистая» вторая страница. */
function sibling(slug, patch = {}) {
  const tag = s => `${s} (${slug})`
  return {
    ...structuredClone(main),
    _file: `${slug}.json`,
    slug,
    title: tag('Склад'),
    description: tag('Описание'),
    h1: tag('Приложение из Excel для склада'),
    was: main.was.map(tag),
    now: main.now.map(tag),
    build: main.build.map(r => ({ ...r, what: tag(r.what) })),
    formulas: main.formulas.map(r => ({ ...r, excel: tag(r.excel) })),
    roles: main.roles.map(r => ({ ...r, role: tag(r.role) })),
    faq: main.faq.map(r => ({ ...r, q: tag(r.q) })),
    ...patch,
  }
}

const errorsFor = (...pages) => validateLandings([main, ...pages], EXISTING)

test('главный лендинг волны 1 лежит отдельным файлом и проходит проверки', () => {
  assert.ok(main, 'нет site-excel/landings/mgnovennyj-start.json')
  assert.equal(main.group, 'main')
  assert.deepEqual(validateLandings(landings, EXISTING), [])
})

test('title, description и H1 в пределах ТЗ, H1 содержит главный запрос', () => {
  for (const page of landings) {
    assert.ok(page.title.length <= LIMITS.title, page.title)
    assert.ok(page.description.length <= LIMITS.description, page.description)
    assert.ok(page.h1.length <= LIMITS.h1, page.h1)
    assert.ok(page.h1.toLowerCase().includes(page.query.toLowerCase()), page.h1)
  }
})

test('чистая вторая страница проходит — проверка не ловит ложных повторов', () => {
  assert.deepEqual(errorsFor(sibling('excel-dlya-sklada')), [])
})

test('длинный title и повтор title существующей страницы роняют сборку', () => {
  const long = sibling('a1', { title: 'x'.repeat(LIMITS.title + 1) })
  assert.match(errorsFor(long).join('\n'), /title длиннее 65/)
  const dup = sibling('a2', { title: 'Кейс Атекс' })
  assert.match(errorsFor(dup).join('\n'), /title совпадает со страницей \/keysy\/rezka-termorulonov\//)
})

test('меньше трёх строк в блоке формул — брак', () => {
  const page = sibling('a3')
  page.formulas = page.formulas.slice(0, 2)
  assert.match(errorsFor(page).join('\n'), /formulas: минимум 3 строки/)
})

test('заглушки и запрещённые формулировки ловятся', () => {
  const lorem = sibling('a4', { lead: 'Lorem ipsum dolor' })
  assert.match(errorsFor(lorem).join('\n'), /заглушка/)
  const todo = sibling('a5', { lead: 'Текст TODO потом' })
  assert.match(errorsFor(todo).join('\n'), /заглушка/)
  for (const phrase of ['Формулы не переносятся', 'ИИ-агент вместо программиста', 'Уникальный сервис', 'К сожалению, нельзя']) {
    const bad = sibling('a6', { lead: phrase })
    assert.match(errorsFor(bad).join('\n'), /запрещённая формулировка/, phrase)
  }
})

test('строка уникального блока, повторяющая другую страницу, — брак', () => {
  const copy = sibling('a7', { was: [...main.was] })
  assert.match(errorsFor(copy).join('\n'), /блок «Было» повторяет страницу mgnovennyj-start/)
  const faq = sibling('a8')
  faq.faq[0] = { ...main.faq[0] }
  assert.match(errorsFor(faq).join('\n'), /блок «Вопросы» повторяет/)
})

test('ссылка на несуществующую соседнюю страницу и пропавший скриншот ловятся', () => {
  const page = sibling('a9', { related: ['net-takoj', '/keysy/proizvodstvo-kormov/', '/', '/sravnenie-power-apps/'] })
  assert.match(errorsFor(page).join('\n'), /соседняя страница net-takoj не существует/)
  const shot = sibling('a10', { screens: [main.screens[0], { ...main.screens[1], src: 'img/landing/net.webp' }] })
  assert.match(errorsFor(shot).join('\n'), /net\.webp не найден/)
  const png = sibling('a11', { screens: [main.screens[0], { ...main.screens[1], src: 'img/uc-sklad.png' }] })
  assert.match(errorsFor(png).join('\n'), /нужен WebP или AVIF/)
})

test('файл называется по адресу страницы', () => {
  const page = sibling('a12', { _file: 'drugoe.json' })
  assert.match(errorsFor(page).join('\n'), /файл должен называться a12\.json/)
})

test('текст CTA в шаблоне совпадает с тем, что ищет пререндер', () => {
  const tpl = read('../site-excel/src/pages/LandingPage.tsx')
  assert.ok(tpl.includes(`export const LANDING_CTA = '${CTA_LABEL}'`))
  assert.match(tpl, /data-cta=""/)
  assert.match(tpl, /\?from=\$\{encodeURIComponent\(slug\)\}/)
})

test('пререндер проверяет данные, CTA и битые ссылки и ставит скрипт UTM', () => {
  const pre = read('../scripts/prerender-site-excel.mjs')
  assert.match(pre, /assertLandings\(loadLandings\(\), PAGES\)/)
  assert.match(pre, /renderLandingPages\(CANONICAL, landings\)/)
  assert.match(pre, /Битые внутренние ссылки/)
  assert.match(pre, /includes\(CTA_LABEL\)/)
  assert.match(pre, /reachGoal','landing_cta'/)
})

test('посадочные попадают в sitemap.xml и llms.txt', () => {
  const vite = read('../site-excel/vite.config.ts')
  assert.match(vite, /loadLandings\(path\.resolve\(__dirname, 'landings'\)\)/)
  assert.match(vite, /\.\.\.SITE_PAGES\.flatMap\(page =>/)
  assert.match(vite, /const \[home, \.\.\.rest\] = SITE_PAGES/)
})

test('форма главной передаёт в заявку страницу-источник и UTM', () => {
  const landing = read('../site-excel/src/Landing.tsx')
  assert.match(landing, /data\.set\('page', source\.page\)/)
  assert.match(landing, /data\.set\('utm', source\.utm\)/)
  assert.match(landing, /page: source\.page \|\| 'main'/)
})
