// Кампании Директа на ideav.ru/put-adepta.html: проверка гипотезы «два
// настоящих проекта с цифрами привлекают адептов лучше, чем /adept/». Фразы —
// те же, что у адептов, объявления свои, оплата за клики.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

import {
  ADS_PER_GROUP,
  AD_LIMITS,
  AD_TITLES_TOTAL,
  CALLOUT_LIMIT,
  PROFILES,
  SITELINK_LIMITS,
  adsFor,
  campaignsFor,
  groupsFor,
  maximumClicks,
  sitelinksFor,
} from '../scripts/direct-create-cpa-campaign.mjs'

const SITE = 'https://ideav.ru'
const P = PROFILES['put-adepta']
const groups = groupsFor(P)
const campaigns = campaignsFor(P)
const page = readFileSync(new URL('../src/pages/AdeptPath.tsx', import.meta.url), 'utf8')
const data = readFileSync(new URL('../src/data/adeptPath.mjs', import.meta.url), 'utf8')

test('put-adepta: фразы адептов, у всех групп общие 12 объявлений', () => {
  assert.equal(P.path, '/put-adepta.html')
  assert.deepEqual(groups.map(g => g.slug), groupsFor(PROFILES.adept).map(g => g.slug))
  for (const g of groups) assert.equal(g.ads?.length, campaigns.length * ADS_PER_GROUP, g.slug)
  const ads = groups[0].ads
  assert.equal(new Set(ads.map(a => a.Title)).size, 12, 'заголовки повторяются')
  assert.equal(new Set(ads.map(a => a.Text)).size, 12, 'тексты повторяются')
})

test('put-adepta: каждая из четырёх кампаний берёт свою тройку, ссылки с UTM', () => {
  assert.equal(campaigns.length, 4)
  const titles = campaigns.flatMap(({ _slug }, i) => {
    const ads = adsFor(_slug, SITE, P, groups[0], i)
    for (const ad of ads) assert.ok(ad.Href.startsWith(`${SITE}/put-adepta.html?utm_source=yandex&utm_medium=cpc&utm_campaign=${_slug}&`), ad.Href)
    return ads.map(ad => ad.Title)
  })
  assert.equal(new Set(titles).size, 12)
})

test('put-adepta: длины в пределах Директа, рубли и проценты — только со страницы', () => {
  for (const ad of groups[0].ads) {
    const text = `${ad.Title} ${ad.Text}`
    assert.ok(ad.Title.length <= AD_TITLES_TOTAL, `${ad.Title.length}: ${ad.Title}`)
    assert.ok(ad.Text.length <= AD_LIMITS.Text, `${ad.Text.length}: ${ad.Text}`)
    for (const word of text.split(/\s+/)) assert.ok(word.length <= 22, word)
    assert.ok(!/gpt|deepseek|1с|битрикс|amocrm|лучш|№\s?1|самый|гарантир/i.test(text), text)
    for (const [num] of text.matchAll(/\d[\d ]*\d(?= ₽)/g)) assert.ok(data.includes(num.replace(/ /g, '')), `${num} ₽ нет на странице`)
    for (const [pct] of text.matchAll(/\d+%/g)) assert.ok(data.includes(pct), `${pct} нет на странице`)
  }
})

test('put-adepta: максимум кликов, кампании без обязательной цели', () => {
  for (const c of campaigns) {
    const s = c.TextCampaign.BiddingStrategy
    const [on, off] = c._slug.includes('-search-') ? [s.Search, s.Network] : [s.Network, s.Search]
    assert.equal(on.BiddingStrategyType, 'WB_MAXIMUM_CLICKS', c.Name)
    assert.equal(off.BiddingStrategyType, 'SERVING_OFF', c.Name)
  }
  assert.deepEqual(maximumClicks('search', P, 300).WbMaximumClicks, { WeeklySpendLimit: 300_000_000, BidCeiling: 25_000_000 })
  assert.equal(maximumClicks('network', P, 300).WbMaximumClicks.BidCeiling, 10_000_000)
})

test('put-adepta: быстрые ссылки ведут на якоря страницы, уточнения в лимите', () => {
  const sitelinks = sitelinksFor('put-adepta-search-day', SITE, P)
  for (const s of sitelinks) {
    assert.ok(page.includes(`id="${s.Href.split('#')[1]}"`), s.Href)
    assert.ok(s.Title.length <= SITELINK_LIMITS.Title && s.Description.length <= SITELINK_LIMITS.Description, s.Title)
  }
  assert.ok(sitelinks.reduce((n, s) => n + s.Title.length, 0) <= SITELINK_LIMITS.TitlesTotal)
  for (const c of P.callouts) assert.ok(c.length <= CALLOUT_LIMIT, c)
})
