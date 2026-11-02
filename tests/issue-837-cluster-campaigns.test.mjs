// Кампании «Excel→приложение» под шесть посадочных по кластерам (issue #837):
// по кампании на страницу, только поиск, будни днём, максимум кликов.
import { test } from 'node:test'
import assert from 'node:assert/strict'

import {
  AD_LIMITS, AD_TITLES_TOTAL, ADS_PER_GROUP, CALLOUT_LIMIT, EXACT_ONLY, ALL_CATEGORIES, PROFILES, SITELINK_LIMITS,
  adsFor, autotargetingSettings, campaignsFor, groupsFor, negativesFor, sitelinksFor,
} from '../scripts/direct-create-cpa-campaign.mjs'
import { hits } from '../scripts/excel-cpa-import-core.mjs'
import { loadLandings } from '../site-excel/landings.mjs'

const P = PROFILES.cluster
const groups = groupsFor(P)
const campaigns = campaignsFor(P)
const site = 'https://excel-to-app.ru'

test('шесть групп — шесть существующих посадочных', () => {
  const landings = new Set(loadLandings().map(l => `/${l.slug}/`))
  assert.equal(groups.length, 6)
  for (const g of groups) assert.ok(landings.has(g.path), `${g.path}: такой посадочной нет`)
  assert.equal(new Set(groups.map(g => g.utm)).size, 6)
})

test('по кампании на страницу: поиск, будни, максимум кликов', () => {
  assert.equal(campaigns.length, 6)
  for (const c of campaigns) {
    assert.equal(c.TextCampaign.BiddingStrategy.Network.BiddingStrategyType, 'SERVING_OFF')
    assert.equal(c.TextCampaign.BiddingStrategy.Search.BiddingStrategyType, 'WB_MAXIMUM_CLICKS')
    assert.equal(c._autotargeting, false)
    const weekend = c.TimeTargeting.Schedule.Items.filter(row => /^[67],/.test(row))
    assert.ok(weekend.every(row => row.split(',').slice(1).every(v => v === '0')))
  }
})

test('объявления: по три на группу, в лимитах Директа, ссылка на свою посадочную', () => {
  for (const g of groups) {
    const ads = adsFor(`cl-${g.slug}`, site, P, g)
    assert.equal(ads.length, ADS_PER_GROUP, g.slug)
    for (const ad of ads) {
      for (const [field, max] of Object.entries(AD_LIMITS)) {
        assert.ok((ad[field] ?? '').length <= max, `${g.slug}: ${field} «${ad[field]}» длиннее ${max}`)
      }
      assert.ok(ad.Title.length + ad.Title2.length <= AD_TITLES_TOTAL, `${g.slug}: «${ad.Title}» + «${ad.Title2}» длиннее ${AD_TITLES_TOTAL}`)
      assert.ok(ad.Href.startsWith(`${site}${g.path}?`), ad.Href)
      assert.match(ad.Href, new RegExp(`utm_campaign=${g.utm}&`))
    }
  }
})

test('быстрые ссылки и уточнения в лимитах; разделы главной — на главную', () => {
  for (const g of groups) {
    const links = sitelinksFor(`cl-${g.slug}`, site, P, g)
    assert.ok(links.reduce((n, l) => n + l.Title.length, 0) <= SITELINK_LIMITS.TitlesTotal)
    for (const l of links) {
      assert.ok(l.Title.length <= SITELINK_LIMITS.Title && l.Description.length <= SITELINK_LIMITS.Description, l.Title)
    }
    assert.ok(links.find(l => l.Title === 'Цены').Href.startsWith(`${site}/?`))
    assert.ok(links.find(l => l.Title === 'Оставить заявку').Href.startsWith(`${site}${g.path}?`))
  }
  for (const c of P.callouts) assert.ok(c.length <= CALLOUT_LIMIT, c)
})

test('минус-слова не гасят ни одной фразы', () => {
  const minus = negativesFor(P)
  assert.ok(minus.length > 20)
  for (const g of groups) for (const k of g.keywords) for (const m of minus) {
    assert.ok(!hits(k, m.replace(/[!+]/g, '')), `«${m}» гасит «${k}»`)
  }
})

test('автотаргетинг пишется новой структурой: только целевые, без конкурентов', () => {
  assert.deepEqual(autotargetingSettings(EXACT_ONLY), {
    Categories: { Exact: 'YES', Narrow: 'NO', Alternative: 'NO', Accessory: 'NO', Broader: 'NO' },
    BrandOptions: { WithoutBrands: 'YES', WithAdvertiserBrand: 'YES', WithCompetitorsBrand: 'NO' },
  })
  const all = autotargetingSettings(ALL_CATEGORIES)
  assert.ok(Object.values(all.Categories).every(v => v === 'YES'))
  assert.equal(all.BrandOptions.WithCompetitorsBrand, 'YES')
})
