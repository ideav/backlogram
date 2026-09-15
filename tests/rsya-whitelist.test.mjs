import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'

import {
  EXCLUDED_SITES_LIMIT,
  isAllowed,
  normalizePlacement,
  planExclusions,
} from '../scripts/direct-rsya-whitelist-sync.mjs'
import { bidModifiers, storedExclusions, trustedGroups } from '../scripts/direct-create-trusted-rsya-campaign.mjs'

const read = (p) => readFileSync(new URL(p, import.meta.url), 'utf8')
const whitelist = JSON.parse(read('../docs/marketing/rsya-whitelist.json'))
const keywords = JSON.parse(read('../docs/marketing/excel-cpa-campaign.keywords.json'))

test('площадка приводится к домену', () => {
  assert.equal(normalizePlacement('www.RBC.ru'), 'rbc.ru')
  assert.equal(normalizePlacement('https://m.habr.com/ru/post/1'), 'm.habr.com')
  assert.equal(normalizePlacement('com.fungames.blockcraft'), 'com.fungames.blockcraft')
  assert.equal(normalizePlacement('  '), '')
})

test('разрешены домен из списка и его поддомены, но не похожие имена', () => {
  const allow = ['rbc.ru', 'habr.com']
  assert.ok(isAllowed('rbc.ru', allow))
  assert.ok(isAllowed('sport.rbc.ru', allow))
  assert.ok(isAllowed('m.habr.com', allow))
  assert.ok(!isAllowed('habr.com.evil.ru', allow))
  assert.ok(!isAllowed('nerbc.ru', allow), 'подстрока в имени домена — не поддомен')
  assert.ok(!isAllowed('com.fungames.blockcraft', allow))
})

test('в бан идёт всё, чего нет в белом списке, дороже — первым', () => {
  const plan = planExclusions({
    seen: [
      { placement: 'rbc.ru', clicks: 10, cost: 100 },
      { placement: 'game.yandex.ru', clicks: 5, cost: 40 },
      { placement: 'com.block.juggle', clicks: 20, cost: 90 },
    ],
    current: [],
    allow: ['rbc.ru'],
  })
  assert.deepEqual(plan.added.map(r => r.placement), ['com.block.juggle', 'game.yandex.ru'])
  assert.equal(plan.skipped.length, 0)
})

test('уже запрещённое не дублируется, дубли отчёта складываются', () => {
  const plan = planExclusions({
    seen: [
      { placement: 'www.gdz.ru', clicks: 1, cost: 1 },
      { placement: 'gdz.ru', clicks: 2, cost: 3 },
      { placement: 'ofont.ru', clicks: 1, cost: 2 },
    ],
    current: ['ofont.ru'],
    allow: [],
  })
  assert.deepEqual(plan.added.map(r => r.placement), ['gdz.ru'])
  assert.equal(plan.added[0].cost, 4, 'www. и голый домен — одна площадка')
  assert.equal(plan.total, 2)
})

test('при переполнении лимита остаётся то, что дороже стоило', () => {
  const seen = Array.from({ length: 5 }, (_, i) => ({
    placement: `site${i}.ru`,
    clicks: i,
    cost: i * 10,
  }))
  const plan = planExclusions({ seen, current: ['old.ru'], allow: [], limit: 3 })
  assert.deepEqual(plan.added.map(r => r.placement), ['site4.ru', 'site3.ru'])
  assert.equal(plan.skipped.length, 3)
  assert.equal(plan.total, 3)
})

test('лимит запрещённых площадок — тот, что вернул API аккаунта', () => {
  assert.equal(EXCLUDED_SITES_LIMIT, 1000)
})

test('белый список — непустой набор доменов без схемы и путей', () => {
  assert.ok(whitelist.allow.length >= 3)
  for (const domain of whitelist.allow) {
    assert.equal(domain, normalizePlacement(domain), `${domain}: домен должен быть нормализован`)
    assert.match(domain, /^[a-z0-9-]+(\.[a-z0-9-]+)+$/)
  }
  for (const named of ['rbc.ru', 'avito.ru', 'habr.com']) {
    assert.ok(whitelist.allow.includes(named), `${named} назван владельцем и должен быть в списке`)
  }
})

test('в традиционную кампанию мусорные ключи не попадают', () => {
  // За клик по «калькулятору отпускных» здесь платим деньгами, а не нулём.
  const slugs = trustedGroups(keywords.groups).map(g => g.slug)
  assert.deepEqual(slugs, ['hot', 'pain'])
})

test('без сохранённого списка кампания стартует с пустым запретом', () => {
  assert.deepEqual(storedExclusions('нет-такого-файла.json'), [])
})

test('корректировки по устройствам выключают мобильный инвентарь, десктоп остаётся', () => {
  // 696 из 990 площадок в отчёте — мобильные приложения; они живут только на
  // смартфонах и планшетах, поэтому одна корректировка заменяет 696 строк
  // чёрного списка. Обнулять заодно и десктоп нельзя — API отбивает.
  const modifiers = bidModifiers(123, { mobilePct: 0, tabletPct: 0, blockRetargetingId: 0 })
  assert.equal(modifiers.length, 2)
  assert.equal(modifiers[0].MobileAdjustment.BidModifier, 0)
  assert.equal(modifiers[1].TabletAdjustment.BidModifier, 0)
  assert.ok(modifiers.every(m => !('DesktopAdjustment' in m)))
})

test('сегмент-блокировка добавляется только когда задано условие ретаргетинга', () => {
  const without = bidModifiers(123, { mobilePct: 50, tabletPct: 50, blockRetargetingId: 0 })
  assert.equal(without.length, 2)

  const withSegment = bidModifiers(123, { mobilePct: 50, tabletPct: 50, blockRetargetingId: 777 })
  const retargeting = withSegment.at(-1).RetargetingAdjustment
  assert.equal(retargeting.RetargetingConditionId, 777)
  assert.equal(retargeting.BidModifier, 0, 'сегмент отсекается полностью, а не понижается')
})
