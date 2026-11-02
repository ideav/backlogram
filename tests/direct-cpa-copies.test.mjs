// Копии кампаний с оплатой за конверсии (02.11.2026): STRATEGY=conversions
// меняет стратегию профиля, VARIANT помечает копию в имени и utm_campaign.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const script = fileURLToPath(new URL('../scripts/direct-create-cpa-campaign.mjs', import.meta.url))

const dryRun = env => execFileSync(process.execPath, [script], {
  encoding: 'utf8',
  env: { ...process.env, DIRECT_TOKEN: 'dry', SITE_URL: 'https://excel-to-app.ru', METRIKA_ID: '112716451', ...env },
})

test('STRATEGY=conversions + VARIANT: оплата за заявку, копия помечена', () => {
  const out = dryRun({ CAMPAIGN_PROFILE: 'cluster', STRATEGY: 'conversions', VARIANT: 'CPA', CPA_RUB: '200', GOAL_ID: '627071307' })
  assert.match(out, /"BiddingStrategyType":"PAY_FOR_CONVERSION","PayForConversion":\{"Cpa":200000000,"GoalId":627071307/)
  assert.doesNotMatch(out, /WB_MAXIMUM_CLICKS/)
  assert.match(out, /=== Excel→приложение склад поиск день · CPA ===/)
  assert.match(out, /utm_campaign=cl-sklad-cpa&/)
  assert.doesNotMatch(out, /utm_campaign=cl-sklad&/)
})

test('без STRATEGY и VARIANT профиль работает как раньше', () => {
  const out = dryRun({ CAMPAIGN_PROFILE: 'cluster', STRATEGY: '', VARIANT: '' })
  assert.match(out, /WB_MAXIMUM_CLICKS/)
  assert.match(out, /=== Excel→приложение склад поиск день ===/)
  assert.match(out, /utm_campaign=cl-sklad&/)
})

test('оплата за конверсии без GOAL_ID не запускается', () => {
  assert.throws(() => dryRun({ CAMPAIGN_PROFILE: 'cluster', STRATEGY: 'conversions', GOAL_ID: '' }), /GOAL_ID/)
})
