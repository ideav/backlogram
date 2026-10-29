// issue #817 — рекламный раздел «ERP-система со 100% кастомизацией»
// (/erp-sistema.html), пост блога и статья базы знаний №32 про кастомизацию.
//
// Держим: УТП из задачи (лучшие практики → повторяем и подстраиваем → своё
// сверху), цены из общего каталога услуг, перекрёстные ссылки страница ↔ блог
// ↔ база знаний, неприметную ссылку только в подвале (в шапку раздел не
// выводится), заявку с source=erp и разводку по сборке/sitemap/OG.

import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { test } from 'node:test'
import * as erp from '../src/data/erpSistema.mjs'
import { SERVICES, formatPrice } from '../src/data/services.mjs'
import { footerNavGroups, headerMoreLinks, headerNavLinks } from '../src/data/nav.mjs'

const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8')
const POST = 'blog-v2/src/content/posts/kastomizaciya-erp-luchshie-praktiki-pod-vash-biznes.md'

test('meta: путь, H1 и description ≤ 160 знаков', () => {
  assert.equal(erp.ERP_META.path, '/erp-sistema.html')
  assert.match(erp.ERP_META.h1, /ERP-система со 100% кастомизацией/)
  assert.ok(erp.ERP_META.description.length <= 160, `description ${erp.ERP_META.description.length} > 160`)
  assert.match(erp.ERP_META.keywords, /erp система/)
})

test('УТП из задачи: берём лучшие практики, повторяем и подстраиваем, добавляем своё', () => {
  assert.equal(erp.FORMULA.length, 3)
  assert.match(erp.FORMULA[0].h, /лучшие практики/i)
  assert.match(erp.FORMULA[1].h, /подстраиваем/i)
  assert.match(erp.FORMULA[2].h, /своё/i)
  assert.match(erp.HERO_LEAD, /лучшие системы/)
  // «копируем функции» — подход, а не чужой код: оговорка обязана быть в FAQ
  assert.ok(erp.FAQ.some((f) => /код/.test(f.q) && /не используются/.test(f.a)))
})

test('цены берутся из каталога услуг, а не пишутся руками', () => {
  const price = (id) => {
    const s = SERVICES.find((x) => x.id === id)
    return `${s.priceFrom ? 'от ' : ''}${formatPrice(s.price)} ${s.unit}`
  }
  assert.equal(erp.PROCESS[0].price, price('razbor-processa'))
  assert.equal(erp.PROCESS[1].price, price('pilot'))
  assert.equal(erp.PROCESS[2].price, price('development'))
  const sp = (s) => s.replace(/\s/g, ' ')
  assert.ok(sp(erp.ERP_META.description).includes(sp(price('razbor-processa'))), 'цена разбора в description устарела')
})

test('перекрёстные ссылки: страница → блог и КБ, блог и КБ → страница', () => {
  const hrefs = erp.READ_MORE.map((l) => l.href).join(' ')
  assert.match(hrefs, /knowledge-base\/32-erp-customization\.html/)
  assert.match(hrefs, /blog\/posts\/kastomizaciya-erp-luchshie-praktiki-pod-vash-biznes\//)
  const post = read(POST)
  assert.match(post, /ideav\.ru\/erp-sistema\.html/)
  assert.match(post, /knowledge-base\/32-erp-customization\.html/)
  assert.match(post, /^image: \/uploads\/kastomizaciya-erp-cover\.png$/m)
  assert.ok(existsSync(new URL('../blog-v2/public/uploads/kastomizaciya-erp-cover.png', import.meta.url)))
  const kb = read('src/data/knowledgeBase.ts')
  const block = kb.slice(kb.indexOf("slug: '32-erp-customization'"))
  assert.match(block.slice(0, block.indexOf('sourceUrl:')), /https:\/\/ideav\.ru\/erp-sistema\.html/)
})

test('в шапку раздел не выводится — только неприметная ссылка в подвале', () => {
  for (const l of [...headerNavLinks, ...headerMoreLinks]) assert.notEqual(l.href, '/erp-sistema.html', 'раздел не выводится в шапку')
  const footer = footerNavGroups.flatMap((c) => c.links)
  assert.ok(footer.some((l) => l.href === '/erp-sistema.html'), 'нужна ссылка в подвале')
})

test('заявка: source=erp, подпись в telegram-notify.php, цели lead и erp_lead', () => {
  const page = read('src/pages/ErpSistema.tsx')
  assert.match(page, /data\.set\('source', 'erp'\)/)
  assert.match(page, /reachGoal\('lead', \{ source: 'erp' \}\)/)
  assert.match(page, /reachGoal\('erp_lead'\)/)
  assert.match(read('public/telegram-notify.php'), /'erp'\s*=>\s*'ERP со 100% кастомизацией/)
})

test('разводка: роутер, сборка, sitemap, OG, llms.txt', () => {
  assert.match(read('src/router.tsx'), /path: 'erp-sistema\.html'/)
  const build = JSON.parse(read('package.json')).scripts.build
  const at = build.indexOf('prerender-erp-sistema.mjs')
  assert.ok(at > 0 && at < build.indexOf('prerender-landing.mjs'), 'пререндер ERP — до prerender-landing')
  assert.match(read('public/sitemap.xml'), /<loc>https:\/\/ideav\.ru\/erp-sistema\.html<\/loc>/)
  assert.match(read('scripts/generate-og-images.mjs'), /slug: 'erp-sistema'/)
  assert.ok(existsSync(new URL('../public/og/erp-sistema.png', import.meta.url)))
  assert.match(read('public/llms.txt'), /ideav\.ru\/erp-sistema\.html/)
})
