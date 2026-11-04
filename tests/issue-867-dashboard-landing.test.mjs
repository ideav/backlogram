// issue #867 — лендинг «Дашборд собственника поверх Битрикс24 и Google-таблиц».
// Держим: маршрут и пререндер идут из USE_CASES, страница есть в sitemap,
// llms.txt, статической навигации и форме заявки, цены берутся из services.mjs,
// а имя клиента нигде не просачивается.
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { existsSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { DASHBOARD_UC, SETUP_MIN_HOURS } from '../src/data/dashboardLanding.mjs'
import { USE_CASES } from '../src/data/usecases.mjs'
import { SERVICES, formatPrice } from '../src/data/services.mjs'
import { staticNavLinks } from '../src/data/nav.mjs'

const file = (p) => fileURLToPath(new URL(`../${p}`, import.meta.url))
const read = (p) => readFileSync(file(p), 'utf8')
const SLUG = 'dashbord-sobstvennika-bitrix24'
const URL_PATH = `/${SLUG}.html`

test('лендинг зарегистрирован в USE_CASES, поэтому получает маршрут и пререндер', () => {
  assert.equal(DASHBOARD_UC.slug, SLUG)
  assert.ok(USE_CASES.includes(DASHBOARD_UC))
  assert.match(read('src/router.tsx'), /USE_CASES\.flatMap/)
  assert.match(read('scripts/prerender-usecases.mjs'), /for \(const uc of USE_CASES\)/)
})

test('страница есть в sitemap.xml, llms.txt и статической навигации', () => {
  assert.ok(read('public/sitemap.xml').includes(`<loc>https://ideav.ru${URL_PATH}</loc>`))
  assert.ok(read('public/llms.txt').includes(`https://ideav.ru${URL_PATH}`))
  assert.ok(staticNavLinks().some((l) => l.href === URL_PATH))
})

test('форма: source известен обработчику заявок', () => {
  assert.match(read('public/excel-to-app.php'), new RegExp(`'${DASHBOARD_UC.source}'\\s*=>`))
})

test('og-картинка генерируется и закоммичена', () => {
  assert.equal(DASHBOARD_UC.ogImage, `/og/${SLUG}.png`)
  assert.match(read('scripts/generate-og-images.mjs'), /DASHBOARD_UC\.slug/)
  assert.ok(existsSync(file(`public/og/${SLUG}.png`)))
})

test('цены берутся из каталога услуг: 3 750 ₽/час x 5 часов = 18 750 ₽, облако от 1 950 ₽/мес', () => {
  const hour = SERVICES.find((s) => s.id === 'development').price
  const cloud = SERVICES.find((s) => s.id === 'cloud').price
  assert.equal(hour, 3750)
  assert.equal(cloud, 1950)
  assert.equal(SETUP_MIN_HOURS, 5)
  const text = JSON.stringify(DASHBOARD_UC)
  assert.ok(text.includes(`${formatPrice(hour * SETUP_MIN_HOURS)} ₽`))
  assert.ok(text.includes(`${formatPrice(cloud)} ₽/мес`))
  assert.ok(text.includes('Шаблон бесплатный'))
})

test('есть демо, перекрёстные ссылки и позиционирование «поверх Битрикс24»', () => {
  assert.equal(DASHBOARD_UC.demoUrl, 'https://ideav.ru/spz/')
  const hrefs = DASHBOARD_UC.related.map((r) => r.href)
  assert.ok(hrefs.some((h) => h.includes('dashbordy-integram-prodazhi-personal-byudzhet')))
  assert.ok(hrefs.includes('/knowledge-base/14b-dashboards.html'))
  assert.ok(hrefs.includes('/sravnenie-s-bitrix-amocrm.html'))
  assert.match(DASHBOARD_UC.lead, /Битрикс24 никуда не уходит/)
})

test('статья блога ведёт на лендинг из cta', () => {
  const post = read('blog-v2/src/content/posts/dashbordy-integram-prodazhi-personal-byudzhet.md')
  const start = post.indexOf('cta:')
  const cta = post.slice(start, post.indexOf('\n---', start))
  assert.ok(cta.includes(`https://ideav.ru${URL_PATH}`))
})

test('имя клиента не просачивается в лендинг', () => {
  const sources = [
    JSON.stringify(DASHBOARD_UC),
    read('src/data/dashboardLanding.mjs'),
    read('public/llms.txt').split('\n').filter((l) => l.includes(SLUG)).join('\n'),
  ].join('\n')
  assert.doesNotMatch(sources, /спортзан|sportzania|спорт/i)
  // «spz» допустимо только в адресе демо и в именах файлов скриншотов
  const rest = sources
    .replaceAll('https://ideav.ru/spz/', '')
    .replaceAll(/\/adept\/spz-[a-z-]+\.webp/g, '')
    .replace(/«spz» остаётся только в адресе демо-базы/, '')
  assert.doesNotMatch(rest, /\bspz\b/i)
})
