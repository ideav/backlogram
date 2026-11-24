// Кампании «Решения» (issue #1017): по кампании на карточку ideav.ru/solutions/<slug> и одна
// на каталог, только поиск, оплата за конверсии 150 ₽ по цели sol_lead (crm#5698), 3–5 объявлений.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'

import {
  AD_LIMITS, AD_TITLES_TOTAL, ADS_PER_GROUP, CALLOUT_LIMIT, PROFILES, SITELINK_LIMITS,
  adsFor, campaignKey, campaignsFor, groupsFor, imageFileFor, negativesFor, sitelinksFor,
} from '../scripts/direct-create-cpa-campaign.mjs'
import { hits } from '../scripts/excel-cpa-import-core.mjs'

const P = PROFILES.solutions
const groups = groupsFor(P)
const campaigns = campaignsFor(P)
const site = 'https://ideav.ru'
// Карточки каталога на 24.11.2026 (база solutions, «Опубликовано» = 1)
const SLUGS = ['wfm', 'mdm', 'sverka', 'bi', 'loyalty', 'budgeting', 'srm', 'b2b-portal', 'service-desk', 'resource-planning',
  'toir', 'field-service', 'pim', 'mes', 'kedo', 'debitorka', 'cpq', 'task-tracker', 'bpm-camunda', 'ohrana-truda', 'llm-router']
const byCampaign = key => groups.filter(g => campaignKey(g) === key)

test('22 кампании: карточка = кампания, плюс каталог', () => {
  assert.deepEqual([...new Set(groups.map(campaignKey))].sort(), ['catalog', ...SLUGS].sort())
  assert.equal(campaigns.length, 22)
  assert.equal(new Set(campaigns.map(c => c.Name)).size, 22)
})

test('в кампании две группы: система и задача, посадочная — своя карточка', () => {
  for (const key of ['catalog', ...SLUGS]) {
    const gs = byCampaign(key)
    assert.deepEqual(gs.map(g => g.slug), [key, `${key}-zadacha`], key)
    for (const g of gs) {
      assert.equal(g.path, key === 'catalog' ? '/solutions/catalog' : `/solutions/${key}`)
      assert.equal(g.utm, `sol-${key}`)
      assert.ok(g.keywords.length >= 3, `${g.slug}: мало фраз`)
    }
  }
})

test('поиск, будни днём, оплата за конверсии 150 ₽', () => {
  assert.equal(P.cpaRub, 150)
  assert.equal(P.goalName, 'sol_lead')
  for (const c of campaigns) {
    assert.match(c.Name, /^Решения .+ поиск день$/)
    assert.equal(c.TextCampaign.BiddingStrategy.Network.BiddingStrategyType, 'SERVING_OFF')
    assert.equal(c.TextCampaign.BiddingStrategy.Search.BiddingStrategyType, 'PAY_FOR_CONVERSION')
    assert.equal(c._autotargeting, false)
  }
})

test('фразы не повторяются, минус-слова не режут свои фразы', () => {
  const all = groups.flatMap(g => g.keywords)
  assert.equal(new Set(all).size, all.length, 'повтор фразы между группами')
  const negatives = negativesFor(P)
  for (const g of groups) {
    for (const k of g.keywords) {
      for (const m of [...negatives, ...g.minusWords]) assert.ok(!hits(k, m), `${g.slug}: «${m}» режет «${k}»`)
    }
  }
})

test('объявления: 3 + 2 на кампанию, в лимитах Директа, ссылка на карточку', () => {
  for (const key of ['catalog', ...SLUGS]) {
    const ads = byCampaign(key).flatMap(g => adsFor(g.utm, site, P, g))
    assert.ok(ads.length >= 3 && ads.length <= 5, `${key}: ${ads.length} объявлений`)
    assert.equal(new Set(ads.map(a => a.Title)).size, ads.length, `${key}: повтор заголовка`)
    for (const g of byCampaign(key)) assert.ok(adsFor(g.utm, site, P, g).length <= ADS_PER_GROUP)
    for (const ad of ads) {
      for (const [field, max] of Object.entries(AD_LIMITS)) assert.ok((ad[field] ?? '').length <= max, `${key}: ${field} «${ad[field]}» длиннее ${max}`)
      assert.ok(ad.Title.length + ad.Title2.length <= AD_TITLES_TOTAL)
      for (const field of ['Title', 'Text']) {
        assert.doesNotMatch(ad[field], /[^\p{L}\p{N}\s.,:;!?«»"'()\-—–%₽№+/]/u, `${key}: ${ad[field]}`)
        assert.ok(ad[field].split(/\s+/).every(w => w.length <= 23), `${key}: слово длиннее 23 знаков`)
      }
      const path = key === 'catalog' ? '/solutions/catalog' : `/solutions/${key}`
      assert.ok(ad.Href.startsWith(`${site}${path}?utm_source=yandex&`), ad.Href)
      assert.match(ad.Href, new RegExp(`utm_campaign=sol-${key}&`))
    }
  }
})

test('у каждой группы есть картинка карточки (широкая, JPEG)', () => {
  for (const g of groups) {
    const file = imageFileFor(g, P)
    assert.ok(file && existsSync(file), `${g.slug}: нет картинки`)
    const b = readFileSync(file)
    assert.ok(b[0] === 0xff && b[1] === 0xd8, `${g.slug}: не JPEG`)
    assert.ok(b.length < 10 * 1024 * 1024)
  }
})

test('быстрые ссылки: заявка на портале, каталог, уточнения в лимитах', () => {
  for (const g of groups) {
    const links = sitelinksFor(g.utm, site, P, g)
    assert.ok(links.reduce((n, l) => n + l.Title.length, 0) <= SITELINK_LIMITS.TitlesTotal)
    for (const l of links) assert.ok(l.Title.length <= SITELINK_LIMITS.Title && l.Description.length <= SITELINK_LIMITS.Description, l.Title)
    assert.match(links.find(l => l.Title === 'Оставить заявку').Href, /#\/apply$/)
    assert.ok(links.find(l => l.Title === 'Каталог решений').Href.startsWith(`${site}/solutions/catalog?utm_source`))
  }
  for (const c of P.callouts) assert.ok(c.length <= CALLOUT_LIMIT, c)
})

test('старые профили не сломаны полем campaign: Фокус — по кампании на группу', () => {
  const focus = campaignsFor(PROFILES.focus)
  assert.equal(focus.length, groupsFor(PROFILES.focus).length)
})

test('фразы не повторяют кампании «Фокус» того же кабинета: свои не бьются в одном аукционе', () => {
  const focus = new Set(groupsFor(PROFILES.focus).flatMap(g => g.keywords))
  for (const g of groups) for (const k of g.keywords) assert.ok(!focus.has(k), `${g.slug}: «${k}» уже в «Фокусе»`)
})
