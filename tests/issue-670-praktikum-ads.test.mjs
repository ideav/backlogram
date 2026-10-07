// Issue #670: кампании-гипотезы практикума по ролям — 4 роли × 4 кампании,
// в каждой одна группа и своя тройка из 12 объявлений роли (больше трёх Директ
// в группе не держит). Кампании praktikum (#668) остаются как были.
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

const P = PROFILES['praktikum-roles']
const SITE = 'https://example.ru'
const groups = groupsFor(P)
const campaigns = campaignsFor(P)
const allAds = groups.flatMap(g => g.ads ?? [])
const campaignsOf = slug => campaigns.filter(c => c._group === slug)

test('кампании praktikum (#668) не меняются: 2 группы, 4 кампании, прежние 3 объявления', () => {
  const old = PROFILES.praktikum
  assert.deepEqual(groupsFor(old).map(g => g.slug), ['ai-work', 'ai-learn'])
  assert.ok(groupsFor(old).every(g => !g.ads))
  assert.deepEqual(campaignsFor(old).map(c => c.Name), [
    'Практикум-CPA поиск день', 'Практикум-CPA поиск ночь', 'Практикум-CPA сети день', 'Практикум-CPA сети ночь',
  ])
  assert.equal(adsFor('praktikum-cpa-search-day', SITE, old, groupsFor(old)[0], 0).length, old.ads.length)
})

test('16 кампаний: на каждую роль поиск/сети × день/ночь, фразы те же 294', () => {
  assert.equal(campaigns.length, 16)
  assert.equal(new Set(campaigns.map(c => c.Name)).size, 16)
  for (const g of groups) assert.deepEqual(campaignsOf(g.slug).map(c => c._index), [0, 1, 2, 3], g.slug)
  const all = groups.flatMap(g => g.keywords).sort()
  assert.deepEqual(all, groupsFor(PROFILES.praktikum).flatMap(g => g.keywords).sort())
})

test('четыре роли, у каждой 12 своих объявлений — всего 48', () => {
  assert.deepEqual(groups.map(g => g.slug), ['analyst', 'coder', 'integrator', 'consultant'])
  for (const g of groups) assert.equal(g.ads?.length, campaignsOf(g.slug).length * ADS_PER_GROUP, g.slug)
  assert.equal(allAds.length, 48)
  assert.equal(new Set(allAds.map(a => a.Title)).size, 48, 'заголовки повторяются')
  assert.equal(new Set(allAds.map(a => a.Text)).size, 48, 'тексты повторяются')
})

test('каждая кампания роли берёт свою тройку, вместе — все 12 без повторов', () => {
  for (const g of groups) {
    const titles = campaignsOf(g.slug).flatMap(({ _slug, _index }) => {
      const ads = adsFor(_slug, SITE, P, g, _index)
      assert.equal(ads.length, ADS_PER_GROUP, `${g.slug} × ${_slug}`)
      for (const ad of ads) assert.ok(ad.Href.includes(`utm_campaign=${_slug}&`), ad.Href)
      return ads.map(ad => ad.Title)
    })
    assert.equal(new Set(titles).size, g.ads.length, g.slug)
  }
})

test('в «поиск день» каждой роли — заголовок из issue: «сами сделаете работу …»', () => {
  const roles = { analyst: 'аналитика', coder: 'программиста', integrator: 'внедренца', consultant: 'консультанта' }
  for (const g of groups) {
    const [first] = adsFor(`praktikum-role-${g.slug}-search-day`, SITE, P, g, 0)
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
