/**
 * Меняет цену конверсии у уже созданных кампаний «оплата за конверсии» (issue #666).
 *
 * Кампании находятся по началу имени (по умолчанию «Практикум-CPA », кампании #668),
 * смена — по слову «день»/«ночь» в имени. Меняется только Cpa: цель и недельный
 * лимит берутся из кабинета как есть, остальные настройки кампании не трогаются.
 *
 *   node scripts/direct-update-cpa.mjs            # сухой прогон: что и на что поменяется
 *   node scripts/direct-update-cpa.mjs --apply    # отправить
 *
 * Окружение:
 *   DIRECT_TOKEN   OAuth-токен кабинета excel-to-app (обязателен)
 *   NAME_PREFIX    начало имени кампаний (по умолчанию «Практикум-CPA »)
 *   CPA_RUB        цена днём, ₽ (по умолчанию 200 — решение владельца 07.10.2026)
 *   NIGHT_CPA_RUB  цена ночью, ₽ (по умолчанию 10)
 */

import { fileURLToPath } from 'node:url'

import { call } from './lib/direct-api.mjs'

const MICRO = 1_000_000
const UPDATE_BATCH = 10

/** Смена кампании по имени: «… поиск день» → day, «… сети ночь» → night. */
export function shiftOf(name) {
  if (/\sночь$/i.test(name)) return 'night'
  if (/\sдень$/i.test(name)) return 'day'
  return null
}

/**
 * Изменения стратегии для одной кампании из campaigns.get.
 * null — менять нечего (цена уже та или стратегия не оплата за конверсии).
 */
export function cpaUpdate(campaign, prices) {
  const shift = shiftOf(campaign.Name)
  if (!shift) return null
  const strategy = campaign.TextCampaign?.BiddingStrategy ?? {}
  const where = ['Search', 'Network'].find(side => strategy[side]?.BiddingStrategyType === 'PAY_FOR_CONVERSION')
  if (!where) return null

  const current = strategy[where].PayForConversion
  const cpa = Math.round(prices[shift] * MICRO)
  if (current.Cpa === cpa) return null

  return {
    id: campaign.Id,
    name: campaign.Name,
    where,
    from: current.Cpa / MICRO,
    to: cpa / MICRO,
    payload: {
      Id: campaign.Id,
      TextCampaign: {
        BiddingStrategy: {
          [where]: {
            BiddingStrategyType: 'PAY_FOR_CONVERSION',
            PayForConversion: { Cpa: cpa, GoalId: current.GoalId, WeeklySpendLimit: current.WeeklySpendLimit },
          },
        },
      },
    },
  }
}

async function main() {
  const apply = process.argv.includes('--apply')
  const token = process.env.DIRECT_TOKEN ?? ''
  if (!token) {
    console.error('DIRECT_TOKEN: нужен токен кабинета excel-to-app (и для сухого прогона — он читает кабинет).')
    process.exit(1)
  }
  const prefix = process.env.NAME_PREFIX ?? 'Практикум-CPA '
  const prices = {
    day: Number(process.env.CPA_RUB ?? 200),
    night: Number(process.env.NIGHT_CPA_RUB ?? 10),
  }

  const { Campaigns = [] } = await call('campaigns', 'get', {
    SelectionCriteria: {},
    FieldNames: ['Id', 'Name', 'State'],
    TextCampaignFieldNames: ['BiddingStrategy'],
  }, token)
  const ours = Campaigns.filter(c => c.Name.startsWith(prefix))
  if (!ours.length) {
    console.error(`Кампаний с именем «${prefix}…» в кабинете нет.`)
    process.exit(1)
  }

  console.log(apply ? 'Меняю цену конверсии.' : 'Сухой прогон: ничего не отправляю.')
  const updates = []
  for (const campaign of ours) {
    const update = cpaUpdate(campaign, prices)
    if (!update) {
      console.log(`  ${campaign.Name} (${campaign.Id}, ${campaign.State}): без изменений`)
      continue
    }
    console.log(`  ${update.name} (${update.id}, ${campaign.State}): ${update.from} → ${update.to} ₽`)
    updates.push(update)
  }
  if (!apply || !updates.length) return

  // Директ меняет не больше 10 кампаний за запрос, лишнее отклоняет целиком.
  let failed = false
  for (let i = 0; i < updates.length; i += UPDATE_BATCH) {
    const batch = updates.slice(i, i + UPDATE_BATCH).map(u => u.payload)
    const result = await call('campaigns', 'update', { Campaigns: batch }, token)
    for (const item of result.UpdateResults ?? []) {
      for (const warning of item.Warnings ?? []) console.warn(`  ${item.Id}: предупреждение: ${warning.Message} ${warning.Details ?? ''}`)
      for (const error of item.Errors ?? []) {
        failed = true
        console.error(`  ошибка: ${error.Message} ${error.Details ?? ''}`)
      }
    }
  }
  if (failed) process.exit(1)
  console.log(`Готово: обновлено ${updates.length}.`)
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch(error => {
    console.error(error.message)
    process.exit(1)
  })
}
