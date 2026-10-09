// Issue #674: кампании Директа на /adept/ и /partner/ — две раздельные четвёрки
// кампаний по образцу практикума (#670): 4 группы фраз × 12 объявлений,
// у каждой кампании в группе своя тройка. Цели adept_click / partner_click.
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
  negativesFor,
  sitelinksFor,
} from '../scripts/direct-create-cpa-campaign.mjs'

const SITE = 'https://example.ru'
const programPage = readFileSync(new URL('../site-excel/src/pages/ProgramPage.tsx', import.meta.url), 'utf8')
const prerender = readFileSync(new URL('../scripts/prerender-site-excel.mjs', import.meta.url), 'utf8')

const SLUGS = {
  adept: ['earn', 'teach', 'nocode', 'learn'],
  partner: ['affiliate', 'referral', 'integrator', 'consultant'],
}

for (const [name, slugs] of Object.entries(SLUGS)) {
  const P = PROFILES[name]
  const groups = groupsFor(P)
  const campaigns = campaignsFor(P)
  const allAds = groups.flatMap(g => g.ads ?? [])

  test(`${name}: четыре группы, у каждой 12 своих объявлений — всего 48`, () => {
    assert.equal(P.path, `/${name}/`)
    assert.equal(P.goalName, `${name}_click`)
    assert.deepEqual(groups.map(g => g.slug), slugs)
    for (const g of groups) assert.equal(g.ads?.length, campaigns.length * ADS_PER_GROUP, g.slug)
    assert.equal(allAds.length, 48)
    assert.equal(new Set(allAds.map(a => a.Title)).size, 48, 'заголовки повторяются')
    assert.equal(new Set(allAds.map(a => a.Text)).size, 48, 'тексты повторяются')
  })

  test(`${name}: каждая кампания берёт в группе свою тройку, ссылки — на /${name}/ с UTM`, () => {
    assert.equal(campaigns.length, 4)
    for (const g of groups) {
      const titles = campaigns.flatMap(({ _slug }, i) => {
        const ads = adsFor(_slug, SITE, P, g, i)
        assert.equal(ads.length, ADS_PER_GROUP, `${g.slug} × ${_slug}`)
        for (const ad of ads) assert.ok(ad.Href.startsWith(`${SITE}/${name}/?utm_source=yandex&utm_medium=cpc&utm_campaign=${_slug}&`), ad.Href)
        return ads.map(ad => ad.Title)
      })
      assert.equal(new Set(titles).size, g.ads.length, g.slug)
    }
  })

  test(`${name}: длины в пределах Директа, без чужих марок и превосходных степеней`, () => {
    for (const ad of allAds) {
      const text = `${ad.Title} ${ad.Text}`
      assert.ok(ad.Title.length <= AD_TITLES_TOTAL, `${ad.Title.length}: ${ad.Title}`)
      assert.ok(ad.Text.length <= AD_LIMITS.Text, `${ad.Text.length}: ${ad.Text}`)
      for (const word of text.split(/\s+/)) assert.ok(word.length <= 22, word)
      assert.ok(!/gpt|deepseek|1с|битрикс|amocrm|тильд|лучш|№\s?1|самый|гарантир/i.test(text), text)
      assert.ok(!/₽/.test(text), `денег в рублях на странице нет: ${text}`)
    }
  })

  test(`${name}: фразы в пределах лимита группы, без дублей, минус-слова их не режут`, () => {
    const all = groups.flatMap(g => g.keywords)
    for (const g of groups) assert.ok(g.keywords.length >= 30 && g.keywords.length <= 200, `${g.name}: ${g.keywords.length}`)
    assert.equal(new Set(all).size, all.length)
    for (const minus of negativesFor(P)) {
      const hit = all.find(k => k.split(/\s+/).includes(minus))
      assert.ok(!hit, `минус-слово «${minus}» есть во фразе «${hit}»`)
    }
  })

  test(`${name}: быстрые ссылки ведут на якоря страницы, уточнения в лимите`, () => {
    for (const s of sitelinksFor(`${name}-cpa-search-day`, SITE, P)) {
      assert.ok(programPage.includes(`id="${s.Href.split('#')[1]}"`), s.Href)
      assert.ok(s.Title.length <= SITELINK_LIMITS.Title && s.Description.length <= SITELINK_LIMITS.Description, s.Title)
    }
    for (const c of P.callouts) assert.ok(c.length <= CALLOUT_LIMIT, c)
  })
}

test('партнёрам — только процент со страницы: 15–40%', () => {
  for (const g of groupsFor(PROFILES.partner)) {
    for (const ad of g.ads) {
      const text = `${ad.Title} ${ad.Text}`
      for (const m of text.matchAll(/\d+/g)) assert.ok(['15', '40'].includes(m[0]), text)
    }
  }
})

test('адептам подработка и обучение не минусуются, вакансии и школа — по-прежнему', () => {
  const neg = negativesFor(PROFILES.adept)
  for (const word of ['подработка', 'обучение', 'курс', 'преподаватель']) assert.ok(!neg.includes(word), word)
  for (const word of ['вакансия', 'резюме', 'школа', 'студент']) assert.ok(neg.includes(word), word)
  assert.ok(!negativesFor(PROFILES.partner).includes('процент'))
  assert.ok(negativesFor(PROFILES.excel).includes('процент'))
})

test('цель: ссылки заявки помечены, пререндер шлёт <slug>_click или <slug>_blocked', () => {
  assert.ok(programPage.includes("data-program-go={tracked ? 'telegram' : undefined}"))
  assert.ok(programPage.includes("data-program-go={tracked ? 'mail' : undefined}"))
  assert.match(prerender, /page\.program \? .*programScript\(page\.program\)/)
  assert.match(prerender, /\(ok\?'_click':'_blocked'\)/)
  assert.match(prerender, /e\.isTrusted/)
  assert.match(prerender, /navigator\.webdriver/)
  assert.match(prerender, />=2500/)
})

test('ссылки заявки — второй этап: в <template>, до клика их в разметке нет', () => {
  const cta = programPage.slice(programPage.indexOf('function ProgramCta'), programPage.indexOf('function ContactLinks'))
  assert.match(cta, /data-program-open="" hidden/)
  assert.match(cta, /id="program-step2-tpl"[sS]*?<ContactLinks mailto={mailto} tracked />/)
  assert.match(cta, /<noscript>s*<ContactLinks mailto={mailto} />/)
  assert.equal(cta.split('<ContactLinks').length - 1, 2, 'кроме шаблона и noscript, ссылок заявки быть не должно')
  const script = prerender.slice(prerender.indexOf('function programScript'))
  assert.match(script, /tpl.content.cloneNode/)
  assert.match(script, /[data-program-open]/)
})
