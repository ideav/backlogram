// issue #578 — страница «Услуги и цены» (/uslugi.html): коммерческие сигналы,
// чтобы Яндекс классифицировал ideav.ru как сайт услуг и показывал рейтинг в Поиске.
//
// Классификатор Яндекса смотрит сырой HTML без JS, поэтому проверяем именно
// пререндер (scripts/prerender-uslugi.mjs): каталог услуг с ценами в рублях,
// кнопки заказа, порядок оплаты, реквизиты продавца и JSON-LD Service→Offer.
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, cpSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { resolve } from 'node:path'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { SERVICES, SERVICES_META, formatPrice } from '../src/data/services.mjs'
import { PRIVACY_OPERATOR } from '../src/data/privacy.mjs'

// fileURLToPath, а не url.pathname: pathname на Windows даёт «/C:/…» и ломает resolve.
const repo = fileURLToPath(new URL('..', import.meta.url))
const read = (p) => readFileSync(resolve(repo, p), 'utf8')

/** Прогоняет пререндер услуг в песочнице и отдаёт получившийся dist/uslugi.html. */
function prerender() {
  const work = mkdtempSync(resolve(tmpdir(), 'issue-578-'))
  mkdirSync(resolve(work, 'dist'), { recursive: true })
  mkdirSync(resolve(work, 'scripts'), { recursive: true })
  cpSync(resolve(repo, 'scripts/prerender-uslugi.mjs'), resolve(work, 'scripts/prerender-uslugi.mjs'))
  cpSync(resolve(repo, 'src/data'), resolve(work, 'src/data'), { recursive: true })
  writeFileSync(resolve(work, 'dist/index.html'), read('index.html'))
  execFileSync('node', ['scripts/prerender-uslugi.mjs'], { cwd: work })
  return readFileSync(resolve(work, 'dist/uslugi.html'), 'utf8')
}

const out = prerender()
const jsonLd = JSON.parse(
  out.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1].replace(/\\u003c/g, '<'),
)
const node = (t) => jsonLd['@graph'].find((n) => n['@type'] === t)

// ── 1. JSON-LD: каталог Service → Offer с ценами в рублях ────────────────
test('JSON-LD несёт ItemList услуг, каждая — Service с Offer в RUB', () => {
  const list = node('ItemList')
  assert.ok(list, 'нет узла ItemList')
  assert.equal(list.itemListElement.length, SERVICES.length)
  for (const li of list.itemListElement) {
    assert.equal(li.item['@type'], 'Service')
    const offer = li.item.offers
    assert.equal(offer['@type'], 'Offer')
    assert.match(offer.price, /^\d+$/, `цена не число: ${offer.price}`)
    assert.equal(offer.priceCurrency, 'RUB')
    assert.ok(offer.url.startsWith('https://ideav.ru'), 'ссылка заказа не абсолютная')
  }
})

test('JSON-LD несёт Organization с ИНН и ОГРН продавца', () => {
  const org = node('Organization')
  assert.ok(org, 'нет узла Organization')
  assert.equal(org.taxID, PRIVACY_OPERATOR.inn)
  const ids = Object.fromEntries(org.identifier.map((p) => [p.propertyID, p.value]))
  assert.equal(ids['ИНН'], PRIVACY_OPERATOR.inn)
  assert.equal(ids['ОГРН'], PRIVACY_OPERATOR.ogrn)
})

// ── 2. Видимый снапшот: цены, заказ, реквизиты — без JS ──────────────────
test('снапшот показывает каждую услугу с ценой и кнопкой заказа', () => {
  for (const s of SERVICES) {
    assert.ok(out.includes(s.name), `нет услуги «${s.name}»`)
    assert.ok(
      out.includes(`${s.priceFrom ? 'от ' : ''}${formatPrice(s.price)} ${s.unit}`),
      `нет цены «${formatPrice(s.price)} ${s.unit}» у «${s.name}»`,
    )
    assert.ok(out.includes(`>${s.cta}</a>`), `нет кнопки «${s.cta}»`)
  }
})

test('снапшот несёт порядок оплаты и реквизиты продавца', () => {
  assert.ok(out.includes('Как заказать и оплатить'))
  assert.ok(out.includes(PRIVACY_OPERATOR.inn), 'нет ИНН')
  assert.ok(out.includes(PRIVACY_OPERATOR.ogrn), 'нет ОГРН')
  assert.ok(out.includes(PRIVACY_OPERATOR.email), 'нет email')
})

test('head: canonical и title страницы услуг', () => {
  assert.ok(out.includes(`<link rel="canonical" href="https://ideav.ru${SERVICES_META.path}" />`))
  assert.ok(/<title>[^<]*Услуги[^<]*<\/title>/.test(out), 'в title нет слова «Услуги»')
})

// ── 3. Страница вшита в сайт: роутер, меню, футер, sitemap, сборка ───────
test('роутер отдаёт /uslugi.html и /uslugi', () => {
  const router = read('src/router.tsx')
  assert.ok(router.includes(`path: 'uslugi.html'`))
  assert.ok(router.includes(`path: 'uslugi'`))
})

test('шапка и футер ссылаются на /uslugi.html', () => {
  assert.ok(read('src/components/Header.tsx').includes(`href: '/uslugi.html'`), 'нет пункта в шапке')
  assert.ok(read('src/components/Footer.tsx').includes('/uslugi.html'), 'нет ссылки в футере')
})

test('футер несёт реквизиты (ИНН/ОГРН) на каждой странице', () => {
  const footer = read('src/components/Footer.tsx')
  assert.ok(footer.includes(PRIVACY_OPERATOR.inn), 'нет ИНН в футере')
  assert.ok(footer.includes(PRIVACY_OPERATOR.ogrn), 'нет ОГРН в футере')
})

test('uslugi.html есть в sitemap и в цепочке сборки до prerender-landing', () => {
  assert.ok(read('public/sitemap.xml').includes('https://ideav.ru/uslugi.html'))
  const build = JSON.parse(read('package.json')).scripts.build
  const idx = build.indexOf('prerender-uslugi.mjs')
  assert.ok(idx !== -1, 'prerender-uslugi.mjs не в build')
  assert.ok(idx < build.indexOf('prerender-landing.mjs'), 'должен идти ДО prerender-landing')
})

test('.htaccess редиректит безрасширенный /uslugi на /uslugi.html выше front controller', () => {
  const ht = read('public/.htaccess')
  const rule = ht.indexOf('^uslugi/?$')
  assert.ok(rule !== -1, 'нет правила для /uslugi')
  assert.ok(rule < ht.indexOf('RewriteCond %{REQUEST_FILENAME} !-f'), 'правило ниже front controller')
})
