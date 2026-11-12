// Кампании «Фокус» под шаблон ideav.ru/reshenie.html?f=<id> (issue #933, PR #931):
// по кампании на фокус, поиск по будням днём, оплата за конверсии.
import { test } from 'node:test'
import assert from 'node:assert/strict'

import {
  AD_LIMITS, AD_TITLES_TOTAL, ADS_PER_GROUP, CALLOUT_LIMIT, PROFILES, SITELINK_LIMITS,
  adsFor, campaignsFor, groupsFor, negativesFor, sitelinksFor,
} from '../scripts/direct-create-cpa-campaign.mjs'
import { hits } from '../scripts/excel-cpa-import-core.mjs'
import { FOCUS_LANDINGS } from '../src/data/focusLandings.mjs'

const P = PROFILES.focus
const groups = groupsFor(P)
const campaigns = campaignsFor(P)
const site = 'https://ideav.ru'
// Фраза замера без охвата в Директе (hasSearchVolume = NO, 12.11.2026) — в группу не берём.
const NO_VOLUME = new Set(['консолидация бюджетов филиалов'])

test('десять групп — десять фокусов посадочной, фразы замера на месте', () => {
  assert.deepEqual(groups.map(g => g.slug), FOCUS_LANDINGS.map(f => f.id))
  for (const g of groups) {
    const focus = FOCUS_LANDINGS.find(f => f.id === g.slug)
    assert.equal(g.path, `/reshenie.html?f=${g.slug}`)
    assert.equal(g.utm, `focus-${g.slug}`)
    for (const phrase of focus.phrases.filter(p => !NO_VOLUME.has(p))) assert.ok(g.keywords.includes(phrase), `${g.slug}: нет фразы замера «${phrase}»`)
  }
})

test('фразы не повторяются между группами', () => {
  const all = groups.flatMap(g => g.keywords)
  assert.equal(new Set(all).size, all.length)
})

test('минус-слова кампании и группы не режут свои фразы', () => {
  const negatives = negativesFor(P)
  for (const g of groups) {
    for (const k of g.keywords) {
      for (const m of [...negatives, ...g.minusWords]) assert.ok(!hits(k, m), `${g.slug}: «${m}» режет «${k}»`)
    }
  }
})

test('кросс-минусовка: склад ↔ склад на производстве', () => {
  const sklad = groups.find(g => g.slug === 'sklad')
  const prod = groups.find(g => g.slug === 'proizvodstvo-sklad')
  for (const k of prod.keywords.filter(k => /производств|сырь|материал/.test(k))) {
    assert.ok(sklad.minusWords.some(m => hits(k, m)), `«${k}» уйдёт и в группу «Склад»`)
  }
})

test('по кампании на фокус: поиск, будни, оплата за конверсии', () => {
  assert.equal(campaigns.length, 10)
  assert.equal(new Set(campaigns.map(c => c.Name)).size, 10)
  for (const c of campaigns) {
    assert.match(c.Name, /^Фокус .+ поиск день$/)
    assert.equal(c.TextCampaign.BiddingStrategy.Network.BiddingStrategyType, 'SERVING_OFF')
    assert.equal(c.TextCampaign.BiddingStrategy.Search.BiddingStrategyType, 'PAY_FOR_CONVERSION')
    assert.equal(c._autotargeting, false)
    const weekend = c.TimeTargeting.Schedule.Items.filter(row => /^[67],/.test(row))
    assert.ok(weekend.every(row => row.split(',').slice(1).every(v => v === '0')))
  }
})

test('объявления: по три, в лимитах, ссылка на свой фокус с {keyword}', () => {
  for (const g of groups) {
    const ads = adsFor(g.utm, site, P, g)
    assert.equal(ads.length, ADS_PER_GROUP, g.slug)
    for (const ad of ads) {
      for (const [field, max] of Object.entries(AD_LIMITS)) {
        assert.ok((ad[field] ?? '').length <= max, `${g.slug}: ${field} «${ad[field]}» длиннее ${max}`)
      }
      assert.ok(ad.Title.length + ad.Title2.length <= AD_TITLES_TOTAL)
      // Директ отбивает не-буквы и не-пунктуацию (стрелку «→» в «Партиях», 12.11.2026).
      for (const field of ['Title', 'Text']) assert.doesNotMatch(ad[field], /[^\p{L}\p{N}\s.,:;!?«»"'()\-—–%₽№+/]/u, `${g.slug}: ${ad[field]}`)
      assert.ok(ad.Href.startsWith(`${site}/reshenie.html?f=${g.slug}&utm_source=yandex&`), ad.Href)
      assert.equal(ad.Href.split('?').length, 2, `${ad.Href}: второй «?»`)
      assert.match(ad.Href, new RegExp(`utm_campaign=${g.utm}&`))
      assert.match(ad.Href, /utm_term=\{keyword\}/)
    }
  }
})

test('быстрые ссылки: якоря посадочной, список задач и конфигуратор', () => {
  for (const g of groups) {
    const links = sitelinksFor(g.utm, site, P, g)
    assert.ok(links.reduce((n, l) => n + l.Title.length, 0) <= SITELINK_LIMITS.TitlesTotal)
    for (const l of links) {
      assert.ok(l.Title.length <= SITELINK_LIMITS.Title && l.Description.length <= SITELINK_LIMITS.Description, l.Title)
      assert.equal(l.Href.split('?').length, 2, l.Href)
    }
    assert.ok(links.find(l => l.Title === 'Пример внедрения').Href.endsWith('#case'))
    assert.ok(links.find(l => l.Title === 'Обсудить пилот').Href.startsWith(`${site}/reshenie.html?f=${g.slug}&`))
    assert.ok(links.find(l => l.Title === 'Все задачи').Href.startsWith(`${site}/reshenie.html?utm_source`))
    assert.ok(!links.find(l => l.Title === 'Конфигуратор').Href.includes('#'))
  }
  for (const c of P.callouts) assert.ok(c.length <= CALLOUT_LIMIT, c)
})
