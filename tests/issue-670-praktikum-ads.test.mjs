// Issue #670: 48 объявлений практикума — по 12 на группу фраз, у каждой
// кампании своя тройка в группе (больше трёх Директ в группе не держит).
import { test } from 'node:test'
import assert from 'node:assert/strict'

import {
  ADS_PER_GROUP,
  AD_LIMITS,
  AD_TITLES_TOTAL,
  PROFILES,
  adsFor,
  campaignsFor,
  groupsFor,
} from '../scripts/direct-create-cpa-campaign.mjs'

const P = PROFILES.praktikum
const SITE = 'https://example.ru'
const groups = groupsFor(P)
const campaigns = campaignsFor(P)
const allAds = groups.flatMap(g => g.ads ?? [])

test('четыре группы по ролям, у каждой 12 своих объявлений — всего 48', () => {
  assert.deepEqual(groups.map(g => g.slug), ['analyst', 'coder', 'integrator', 'consultant'])
  for (const g of groups) assert.equal(g.ads?.length, campaigns.length * ADS_PER_GROUP, g.slug)
  assert.equal(allAds.length, 48)
  assert.equal(new Set(allAds.map(a => a.Title)).size, 48, 'заголовки повторяются')
  assert.equal(new Set(allAds.map(a => a.Text)).size, 48, 'тексты повторяются')
})

test('каждая кампания берёт в группе свою тройку, вместе — все 12 без повторов', () => {
  for (const g of groups) {
    const titles = campaigns.flatMap(({ _slug }, i) => {
      const ads = adsFor(_slug, SITE, P, g, i)
      assert.equal(ads.length, ADS_PER_GROUP, `${g.slug} × ${_slug}`)
      for (const ad of ads) assert.ok(ad.Href.includes(`utm_campaign=${_slug}&`), ad.Href)
      return ads.map(ad => ad.Title)
    })
    assert.equal(new Set(titles).size, g.ads.length, g.slug)
  }
})

test('первая тройка каждой группы — с ролью из issue: «сами сделаете работу …»', () => {
  const roles = { analyst: 'аналитика', coder: 'программиста', integrator: 'внедренца', consultant: 'консультанта' }
  for (const g of groups) {
    const [first] = adsFor('praktikum-cpa-search-day', SITE, P, g, 0)
    assert.ok(first.Title.includes(`работу ${roles[g.slug]}`), first.Title)
  }
})

test('длины в пределах Директа, слова не длиннее 22 знаков', () => {
  for (const ad of allAds) {
    assert.ok(ad.Title.length <= AD_TITLES_TOTAL, `${ad.Title.length}: ${ad.Title}`)
    assert.ok(ad.Text.length <= AD_LIMITS.Text, `${ad.Text.length}: ${ad.Text}`)
    for (const word of `${ad.Title} ${ad.Text}`.split(/\s+/)) assert.ok(word.length <= 22, word)
  }
})

test('цена — только та, что на странице; без чужих марок и превосходных степеней', () => {
  for (const ad of allAds) {
    const text = `${ad.Title} ${ad.Text}`
    for (const m of text.matchAll(/[\d\s]+ ₽/g)) assert.equal(m[0].trim(), '4 900 ₽', text)
    assert.ok(!/gpt|chatgpt|deepseek|лучш|№\s?1|самый/i.test(text), text)
  }
})
