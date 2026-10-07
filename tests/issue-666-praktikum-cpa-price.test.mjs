// Issue #666: цена конверсии кампаний практикума — 200 ₽ днём, 10 ₽ ночью.
import { test } from 'node:test'
import assert from 'node:assert/strict'

import { PROFILES } from '../scripts/direct-create-cpa-campaign.mjs'
import { cpaUpdate, shiftOf } from '../scripts/direct-update-cpa.mjs'

const MICRO = 1_000_000
const prices = { day: 200, night: 10 }

const campaign = (Name, side, cpaRub) => ({
  Id: 1,
  Name,
  TextCampaign: {
    BiddingStrategy: {
      Search: side === 'Search'
        ? { BiddingStrategyType: 'PAY_FOR_CONVERSION', PayForConversion: { Cpa: cpaRub * MICRO, GoalId: 670663249, WeeklySpendLimit: 10000 * MICRO } }
        : { BiddingStrategyType: 'SERVING_OFF' },
      Network: side === 'Network'
        ? { BiddingStrategyType: 'PAY_FOR_CONVERSION', PayForConversion: { Cpa: cpaRub * MICRO, GoalId: 670663249, WeeklySpendLimit: 10000 * MICRO } }
        : { BiddingStrategyType: 'SERVING_OFF' },
    },
  },
})

test('профиль praktikum создаёт кампании по 200/10 ₽, гипотезы по ролям остаются 500/50 ₽', () => {
  assert.equal(PROFILES.praktikum.cpaRub, 200)
  assert.equal(PROFILES.praktikum.nightCpaRub, 10)
  assert.equal(PROFILES['praktikum-roles'].cpaRub, 500)
  assert.equal(PROFILES['praktikum-roles'].nightCpaRub, 50)
})

test('смена кампании берётся из последнего слова имени', () => {
  assert.equal(shiftOf('Практикум-CPA поиск день'), 'day')
  assert.equal(shiftOf('Практикум-CPA сети ночь'), 'night')
  assert.equal(shiftOf('Практикум-CPA поиск'), null)
})

test('меняется только Cpa на своей площадке, цель и лимит — из кабинета', () => {
  const day = cpaUpdate(campaign('Практикум-CPA поиск день', 'Search', 500), prices)
  assert.deepEqual(day.payload.TextCampaign.BiddingStrategy, {
    Search: {
      BiddingStrategyType: 'PAY_FOR_CONVERSION',
      PayForConversion: { Cpa: 200 * MICRO, GoalId: 670663249, WeeklySpendLimit: 10000 * MICRO },
    },
  })
  const night = cpaUpdate(campaign('Практикум-CPA сети ночь', 'Network', 50), prices)
  assert.equal(night.where, 'Network')
  assert.equal(night.payload.TextCampaign.BiddingStrategy.Network.PayForConversion.Cpa, 10 * MICRO)
})

test('повторный запуск ничего не меняет', () => {
  assert.equal(cpaUpdate(campaign('Практикум-CPA поиск день', 'Search', 200), prices), null)
  assert.equal(cpaUpdate(campaign('Практикум-CPA сети ночь', 'Network', 10), prices), null)
})
