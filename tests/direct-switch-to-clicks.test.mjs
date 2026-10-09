import { test } from 'node:test'
import assert from 'node:assert/strict'

import { clicksUpdate } from '../scripts/direct-switch-to-clicks.mjs'

const settings = { weeklyLimit: 300, ceilings: { Search: 25, Network: 10 } }
const campaign = (search, network) => ({
  Id: 1,
  Name: 'Excel-CPA поиск день',
  TextCampaign: { BiddingStrategy: { Search: search, Network: network } },
})
const cpa = { BiddingStrategyType: 'PAY_FOR_CONVERSION', PayForConversion: { Cpa: 500_000_000, GoalId: 627071305, WeeklySpendLimit: 10_000_000_000 } }
const off = { BiddingStrategyType: 'SERVING_OFF' }

test('поисковая кампания: максимум кликов на поиске, сети не трогаются', () => {
  const update = clicksUpdate(campaign(cpa, off), settings)
  assert.deepEqual(update.payload.TextCampaign.BiddingStrategy, {
    Search: { BiddingStrategyType: 'WB_MAXIMUM_CLICKS', WbMaximumClicks: { WeeklySpendLimit: 300_000_000, BidCeiling: 25_000_000 } },
  })
})

test('кампания в сетях получает потолок клика для сетей', () => {
  const update = clicksUpdate(campaign(off, cpa), settings)
  assert.equal(update.where, 'Network')
  assert.equal(update.payload.TextCampaign.BiddingStrategy.Network.WbMaximumClicks.BidCeiling, 10_000_000)
})

test('кампания уже не на оплате за конверсии — пропускается', () => {
  const clicks = { BiddingStrategyType: 'WB_MAXIMUM_CLICKS' }
  assert.equal(clicksUpdate(campaign(clicks, off), settings), null)
})
