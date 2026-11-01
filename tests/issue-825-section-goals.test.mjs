// issue #825 — реклама ведёт сразу в раздел сайта, поэтому Метрика должна
// видеть выбор раздела на главной (`section_choice`), целевое действие раздела
// (`section_cta`), сам раздел как параметр визита и заявки с формы `/#cta`,
// пришедшие из раздела «Автоматизация бизнеса» (`lead` с source раздела).
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { readFileSync } from 'node:fs'
import { SITE_SECTIONS } from '../src/data/siteSections.mjs'

// new URL прямо в readFileSync — pathname на Windows даёт «/C:/…».
const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8')
const home = read('src/pages/Home.tsx')
const section = read('src/pages/SiteSection.tsx')
const metrika = read('src/lib/metrika.ts')

test('карточка выбора раздела на главной шлёт section_choice со slug раздела', () => {
  const cards = home.slice(home.indexOf('SITE_SECTIONS.map'))
  const link = cards.slice(0, cards.indexOf('</Link>'))
  assert.match(link, /onClick=\{\(\) => reachGoal\('section_choice', \{ section: section\.slug \}\)\}/)
})

test('главная кнопка раздела — сверху и в синем блоке — шлёт section_cta', () => {
  assert.match(section, /reachGoal\('section_cta', \{ section: slug, place \}\)/)
  assert.match(section, /<Cta cta=\{page\.cta\} primary onClick=\{\(\) => trackSectionCta\(page\.slug, page\.cta, 'top'\)\}/)
  assert.match(section, /onClick=\{\(\) => trackSectionCta\(page\.slug, page\.cta, 'bottom'\)\}/)
  // Все три вида ссылок (роутер, внешняя как у песочницы, якорь своей
  // страницы как #zayavka) передают onClick.
  assert.equal((section.match(/className=\{className\} onClick=\{onClick\}/g) ?? []).length, 3)
})

test('вход на страницу раздела пишет параметр визита section', () => {
  const effect = section.slice(section.indexOf('useEffect('), section.indexOf('}, [page])'))
  assert.match(effect, /visitParams\(\{ section: page\.slug \}\)/)
})

test('заявка из раздела уходит с source раздела, а не home', () => {
  // #827: форма стоит прямо в разделе «Автоматизация бизнеса» и получает его slug.
  const auto = SITE_SECTIONS.find((s) => s.slug === 'avtomatizaciya-biznesa')
  assert.equal(auto.cta.href, '#zayavka', 'кнопка раздела ведёт на форму на той же странице')
  assert.ok(auto.blocks.some((b) => b.type === 'form' && b.id === 'zayavka'))
  assert.match(section, /<LeadForm source=\{slug\} \/>/)
  // Кнопка раздела, ведущая на форму главной, по-прежнему запоминает раздел.
  assert.match(section, /if \(cta\.href\.startsWith\('\/#cta'\)\) rememberLeadFrom\(slug\)/)
  const form = read('src/components/LeadForm.tsx')
  assert.match(form, /reachGoal\('lead', \{ source: source \?\? leadSource\('home'\) \}\)\s*\n\s*forgetLeadFrom\(\)/)
  assert.doesNotMatch(form, /reachGoal\('lead', \{ source: 'home' \}\)/)
  assert.match(home, /<LeadForm \/>/)
  // sessionStorage, а не хэш: App.tsx скроллит к id = hash.
  assert.match(metrika, /sessionStorage\.setItem\(LEAD_FROM_KEY, section\)/)
})
