// Issue #668: кампании Директа на /praktikum/ — оплата за конверсию,
// двухэтапная целевая кнопка, день/ночь × поиск/РСЯ.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

import {
  AD_LIMITS,
  AD_TITLES_TOTAL,
  CALLOUT_LIMIT,
  PROFILES,
  SITELINK_LIMITS,
  adsFor,
  campaignsFor,
  groupsFor,
  href,
  negativesFor,
  sitelinksFor,
} from '../scripts/direct-create-cpa-campaign.mjs'

const read = rel => readFileSync(fileURLToPath(new URL(rel, import.meta.url)), 'utf8')
const P = PROFILES.praktikum
const SITE = 'https://example.ru'
const page = read('../site-excel/src/pages/PraktikumPage.tsx')
const prerender = read('../scripts/prerender-site-excel.mjs')

// ── Страница ─────────────────────────────────────────────────────────────────

test('целевой ссылки нет в разметке до первого клика: она в <template>', () => {
  const [before, after] = page.split('id="pk-step2-tpl"')
  assert.ok(after, 'нет шаблона pk-step2-tpl')
  assert.doesNotMatch(before, /data-pk-go/, 'целевая ссылка до шаблона — её видно без клика')
  assert.match(after.split('</template>')[0] ?? after, /data-pk-go=""/)
  assert.match(page, /<template[\s\S]*?id="pk-step2-tpl"/)
})

test('первые кнопки без JS скрыты, вместо них — noscript со ссылкой на форму', () => {
  assert.match(page, /data-pk-open="" hidden/)
  assert.match(page, /<noscript>\s*<a href=\{PRAKTIKUM_FORM_HREF\}/)
  // Кроме noscript и шаблона, прямых ссылок на форму на странице нет.
  assert.equal(page.split('href={PRAKTIKUM_FORM_HREF}').length - 1, 2)
})

test('ссылка на форму помечена страницей практикума', () => {
  assert.match(page, /PRAKTIKUM_FORM_HREF = `\$\{SITE_BASE\}\?from=praktikum#praktikum`/)
})

test('цель уходит через проверку на человека, иначе — praktikum_blocked', () => {
  const script = prerender.slice(prerender.indexOf('function praktikumScript'))
  assert.match(script, /ok\?'praktikum_click':'praktikum_blocked'/)
  assert.match(script, /e\.isTrusted/)
  assert.match(script, /!navigator\.webdriver/)
  assert.match(script, />=2500/)
  assert.match(script, /\^utm_\|\^yclid\$/)
  assert.match(read('../site-excel/src/prerender.tsx'), /praktikum: true,/)
})

// ── Кампании ─────────────────────────────────────────────────────────────────

test('четыре кампании: поиск и сети × день и ночь, вторая площадка выключена', () => {
  const list = campaignsFor(P)
  assert.deepEqual(list.map(c => c._slug), [
    'praktikum-cpa-search-day',
    'praktikum-cpa-search-night',
    'praktikum-cpa-network-day',
    'praktikum-cpa-network-night',
  ])
  for (const c of list) {
    const { Search, Network } = c.TextCampaign.BiddingStrategy
    const on = c._slug.includes('search') ? Search : Network
    const off = c._slug.includes('search') ? Network : Search
    assert.equal(on.BiddingStrategyType, 'PAY_FOR_CONVERSION')
    assert.equal(off.BiddingStrategyType, 'SERVING_OFF')
    assert.equal(on.PayForConversion.WeeklySpendLimit, 10000 * 1_000_000)
  }
})

test('объявления и расширения влезают в лимиты Директа', () => {
  for (const ad of adsFor('praktikum-cpa-search-day', SITE, P)) {
    for (const [field, limit] of Object.entries(AD_LIMITS)) {
      assert.ok(ad[field].length <= limit, `${field} ${ad[field].length} > ${limit}: «${ad[field]}»`)
    }
    assert.ok(ad.Title.length + ad.Title2.length <= AD_TITLES_TOTAL, `«${ad.Title}» + «${ad.Title2}»`)
  }
  const links = sitelinksFor('praktikum-cpa-search-day', SITE, P)
  assert.ok(links.reduce((n, l) => n + l.Title.length, 0) <= SITELINK_LIMITS.TitlesTotal)
  for (const link of links) {
    assert.ok(link.Title.length <= SITELINK_LIMITS.Title && !/[!?]/.test(link.Title), link.Title)
    assert.ok(link.Description.length <= SITELINK_LIMITS.Description, link.Description)
  }
  for (const text of P.callouts) assert.ok(text.length <= CALLOUT_LIMIT, text)
})

test('цена в объявлениях — та, что на странице', () => {
  const price = read('../site-excel/src/content.ts').match(/price: '([\d\s]+ ₽)'/)[1]
  for (const ad of P.ads) for (const m of `${ad.Title2} ${ad.Text}`.matchAll(/[\d\s]+ ₽/g)) {
    assert.equal(m[0].trim(), price)
  }
})

test('объявления и быстрые ссылки ведут на /praktikum/ с UTM и на якоря страницы', () => {
  const link = href('praktikum-cpa-network-night', SITE, P)
  assert.ok(link.startsWith(`${SITE}/praktikum/?utm_source=yandex&utm_medium=cpc&utm_campaign=praktikum-cpa-network-night`))
  for (const s of sitelinksFor('praktikum-cpa-search-day', SITE, P)) {
    const anchor = s.Href.split('#')[1]
    assert.ok(page.includes(`id="${anchor}"`), `на странице нет якоря #${anchor}`)
  }
})

test('фразы: в пределах лимита группы, без дублей, минус-слова их не режут', () => {
  const groups = groupsFor(P)
  const all = groups.flatMap(g => g.keywords)
  for (const g of groups) assert.ok(g.keywords.length > 0 && g.keywords.length <= 200, `${g.name}: ${g.keywords.length}`)
  assert.equal(new Set(all).size, all.length)
  for (const minus of negativesFor(P)) {
    const hit = all.find(k => k.split(/\s+/).includes(minus))
    assert.ok(!hit, `минус-слово «${minus}» есть во фразе «${hit}»`)
  }
})

test('для практикума обучение не минусуется, школа и студенты — по-прежнему', () => {
  const neg = negativesFor(P)
  for (const word of ['курс', 'обучение', 'практикум', 'урок']) assert.ok(!neg.includes(word), word)
  for (const word of ['школа', 'студент', 'егэ', 'вакансия']) assert.ok(neg.includes(word), word)
  // У главной список прежний.
  assert.ok(negativesFor(PROFILES.excel).includes('практикум'))
})
