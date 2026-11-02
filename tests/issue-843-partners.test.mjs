// issue #843 — «Партнёрам» переехала с integram.io/partners.html на ideav.ru.
//
// Держим: путь и meta, заявку через /telegram-notify.php с source=partners
// (на integram.io форма уходила в отчёт ideav.online и падала с CORS),
// разводку по роутеру/сборке/навигации/sitemap/llms.txt/OG, деки в public/,
// и что integram.io больше не держит свою копию страницы.

import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { test } from 'node:test'
import * as pt from '../src/data/partners.mjs'
import { headerMoreLinks, footerNavGroups } from '../src/data/nav.mjs'

const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8')
const exists = (p) => existsSync(new URL(`../${p}`, import.meta.url))

test('meta: путь, H1, description ≤ 160 знаков', () => {
  assert.equal(pt.PARTNERS_META.path, '/partners.html')
  assert.match(pt.PARTNERS_META.h1, /Партнёрам/)
  assert.ok(pt.PARTNERS_META.description.length <= 160, `description ${pt.PARTNERS_META.description.length} > 160`)
  assert.match(pt.PARTNERS_META.description, /30%/)
  assert.match(pt.PARTNERS_META.description, /40%/)
})

test('условия программы перенесены без потерь', () => {
  const money = pt.MONEY.cards.map((c) => `${c.big ?? ''} ${c.p}`).join(' ')
  assert.match(money, /30%/)
  assert.match(money, /40%/)
  assert.match(money, /590 000 ₽/)
  assert.match(money, /236 000 ₽/)
  assert.equal(pt.STEPS.items.length, 6)
  assert.equal(pt.LEVELS.cards.length, 3)
  assert.equal(pt.OWN_TEMPLATE.link.href, '/shablony-reshenij.html')
})

test('заявка: telegram-notify.php, source=partners, метка источника, e-mail в task', () => {
  assert.equal(pt.LEAD_SOURCE, 'partners')
  const php = read('public/telegram-notify.php')
  assert.match(php, /'partners'\s*=>\s*'Партнёрам: заявка на партнёрство'/)
  const page = read('src/pages/Partners.tsx')
  assert.match(page, /fetch\('\/telegram-notify\.php'/)
  assert.match(page, /data\.set\('source', LEAD_SOURCE\)/)
  assert.ok(!/ideav\.online|report\/299/.test(page), 'старый эндпоинт integram.io не должен вернуться')
  const t = pt.leadSummary({ email: ' a@b.ru ', comment: '' })
  assert.match(t, /partners\.html/)
  assert.match(t, /E-mail: a@b\.ru/)
  assert.ok(!/Комментарий/.test(t))
})

test('разводка: роутер, сборка, навигация, sitemap, llms.txt, OG', () => {
  assert.match(read('src/router.tsx'), /path: 'partners\.html',\s*element: <Partners \/>/)
  const build = JSON.parse(read('package.json')).scripts.build
  const i = build.indexOf('prerender-partners.mjs')
  assert.ok(i > build.indexOf('vite build') && i < build.indexOf('prerender-landing.mjs'), 'пререндер — после vite build и до prerender-landing')
  const links = [...headerMoreLinks, ...footerNavGroups.flatMap((g) => g.links)]
  assert.ok(links.some((l) => l.href === '/partners.html'), 'нет ссылки в навигации')
  assert.match(read('public/sitemap.xml'), /<loc>https:\/\/ideav\.ru\/partners\.html<\/loc>/)
  assert.match(read('public/llms.txt'), /\(https:\/\/ideav\.ru\/partners\.html\)/)
  assert.match(read('scripts/generate-og-images.mjs'), /slug: 'partners'/)
})

test('деки переехали в public/partners/, копии на integram.io в репо нет', () => {
  for (const d of pt.DECKS) assert.ok(exists(`public${d.href}`), `нет ${d.href}`)
  assert.ok(!exists('integram.io/partners.html'))
  assert.ok(!exists('integram.io/partners'))
  assert.ok(!read('integram.io/sitemap.xml').includes('partners'))
  const io = read('integram.io/index.html')
  assert.ok(!io.includes('href="/partners.html"'), 'integram.io ссылается на удалённую страницу')
  assert.match(io, /href="https:\/\/ideav\.ru\/partners\.html"/)
})
