// Issue #688: мусорные ключи для практикума, адептов и партнёров — как в статье
// «О пользе мусорных ключей в Яндекс.Директе». Цель — охватить всех: минус-слов
// нет, на поиске автотаргетинг по всем категориям, фразы трёх посадочных
// не пересекаются ни между собой, ни с остальными кампаниями кабинета.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

import {
  ADS_PER_GROUP,
  AD_LIMITS,
  AD_TITLES_TOTAL,
  ALL_CATEGORIES,
  PROFILES,
  adsFor,
  campaignPayload,
  campaignsFor,
  groupsFor,
  negativesFor,
} from '../scripts/direct-create-cpa-campaign.mjs'
import { JUNK, takenKeys } from '../scripts/junk-build-keywords.mjs'
import { phraseKey } from '../scripts/praktikum-roles-build-keywords.mjs'

const SITE = 'https://example.ru'
const NAMES = ['praktikum', 'adept', 'partner']
const script = readFileSync(new URL('../scripts/direct-create-cpa-campaign.mjs', import.meta.url), 'utf8')

for (const name of NAMES) {
  const P = PROFILES[`${name}-junk`]
  const base = PROFILES[name]
  const groups = groupsFor(P)
  const campaigns = campaignsFor(P)

  test(`${name}-junk: посадочная, цель и цена — как у основных кампаний`, () => {
    assert.equal(P.path, base.path)
    assert.equal(P.goalName, base.goalName)
    assert.equal(P.cpaRub, base.cpaRub)
    assert.equal(P.nightCpaRub, base.nightCpaRub)
    assert.deepEqual(campaigns.map(c => c._slug), ['search-day', 'search-night', 'network-day', 'network-night'].map(s => `${name}-junk-${s}`))
  })

  test(`${name}-junk: минус-слов нет ни на кампании, ни в группах`, () => {
    assert.deepEqual(negativesFor(P), [])
    for (const c of campaigns) assert.ok(!('NegativeKeywords' in c), c.Name)
    assert.ok(!('NegativeKeywords' in campaignPayload('x', 'x', 'search', 'day', P)))
    for (const g of groups) assert.deepEqual(g.minusWords, [], g.slug)
    assert.ok(negativesFor(base).length > 0, 'у основных кампаний минус-слова остаются')
  })

  test(`${name}-junk: все проверенные слова в кампании, группы до 200 фраз`, () => {
    const all = groups.flatMap(g => g.keywords)
    assert.ok(groups.length >= 2, `${groups.length} групп`)
    for (const g of groups) assert.ok(g.keywords.length > 0 && g.keywords.length <= 200, `${g.slug}: ${g.keywords.length}`)
    assert.equal(new Set(all.map(phraseKey)).size, all.length, 'дубли с точки зрения Директа')
  })

  test(`${name}-junk: 12 объявлений на всех, у каждой кампании своя тройка`, () => {
    for (const g of groups) {
      assert.equal(g.ads?.length, campaigns.length * ADS_PER_GROUP, g.slug)
      const titles = campaigns.flatMap(({ _slug }, i) => {
        const ads = adsFor(_slug, SITE, P, g, i)
        for (const ad of ads) assert.ok(ad.Href.startsWith(`${SITE}${P.path}?utm_source=yandex&utm_medium=cpc&utm_campaign=${_slug}&`), ad.Href)
        return ads.map(ad => ad.Title)
      })
      assert.equal(new Set(titles).size, 12, g.slug)
    }
    const ads = groups[0].ads
    assert.equal(new Set(ads.map(a => a.Text)).size, 12)
    for (const ad of ads) {
      const text = `${ad.Title} ${ad.Text}`
      assert.ok(ad.Title.length <= AD_TITLES_TOTAL, `${ad.Title.length}: ${ad.Title}`)
      assert.ok(ad.Text.length <= AD_LIMITS.Text, `${ad.Text.length}: ${ad.Text}`)
      for (const word of text.split(/\s+/)) assert.ok(word.length <= 22, word)
      assert.ok(!/gpt|deepseek|1с|битрикс|amocrm|тильд|лучш|№\s?1|самый|гарантир/i.test(text), text)
      if (name !== 'praktikum') assert.ok(!/₽/.test(text), `денег в рублях на странице нет: ${text}`)
      if (name === 'partner') for (const m of text.matchAll(/\d+/g)) assert.ok(['15', '40'].includes(m[0]), text)
      if (name === 'praktikum') for (const m of text.matchAll(/\d[\d ]*/g)) assert.ok(['4 900 ', '1 '].includes(m[0]), text)
    }
  })
}

test('мусор трёх посадочных не пересекается между собой и с остальными кампаниями', () => {
  const taken = takenKeys()
  const seen = new Set()
  for (const name of NAMES) {
    for (const phrase of groupsFor(PROFILES[`${name}-junk`]).flatMap(g => g.keywords)) {
      const key = phraseKey(phrase)
      assert.ok(!taken.has(key), `«${phrase}» уже есть в кампаниях кабинета`)
      assert.ok(!seen.has(key), `«${phrase}» повторяется у соседней посадочной`)
      seen.add(key)
    }
  }
})

test('слова из статьи на месте: кружка, подстаканник, мерседес', () => {
  const praktikum = groupsFor(PROFILES['praktikum-junk']).flatMap(g => g.keywords)
  for (const word of ['кружка', 'подстаканник', 'подлокотник', 'мерседес', 'bmw']) assert.ok(praktikum.includes(word), word)
  assert.deepEqual(JUNK.map(s => s.profile), NAMES)
})

test('автотаргетинг: у мусорных на поиске все категории, у остальных — только целевые', () => {
  assert.ok(ALL_CATEGORIES.every(c => c.Value === 'YES'))
  assert.match(script, /PROFILE\.noNegatives \? ALL_CATEGORIES : EXACT_ONLY/)
  assert.ok(!PROFILES.praktikum.noNegatives && !PROFILES.adept.noNegatives && !PROFILES.partner.noNegatives)
})
