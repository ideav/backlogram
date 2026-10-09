/**
 * Переводит кампании кабинета excel-to-app с оплаты за конверсии на оплату за клики.
 *
 * Почему: за 29.09–09.10.2026 кампании «оплата за конверсии» почти не показывались
 * (Excel-CPA — 3 показа за 10 дней). У целей нет истории, прогноз конверсии около
 * нуля, и при цене 10–500 ₽ Директ просто не входит в аукцион. Решение владельца
 * 09.10.2026: перевести всё на клики и ждать, пока уйдёт около 5 000 ₽, —
 * так цели наберут конверсии, и стратегию можно будет вернуть.
 *
 * Стратегия — WB_MAXIMUM_CLICKS («максимум кликов») на той площадке, где кампания
 * сейчас работает: недельный лимит плюс потолок цены клика. Вторая площадка
 * (SERVING_OFF) не трогается. Общий расход дополнительно держит дневной бюджет
 * аккаунта (1 000 ₽ на 09.10.2026): 5 000 ₽ уйдут не быстрее чем за пять дней.
 *
 *   node scripts/direct-switch-to-clicks.mjs            # сухой прогон: что и на что поменяется
 *   node scripts/direct-switch-to-clicks.mjs --apply    # отправить
 *
 * Окружение:
 *   DIRECT_TOKEN        OAuth-токен кабинета excel-to-app (обязателен)
 *   NAME_PREFIX         менять только кампании с таким началом имени (по умолчанию — все)
 *   WEEKLY_LIMIT_RUB    недельный лимит одной кампании, ₽ (по умолчанию 300 — минимум Директа)
 *   SEARCH_CEILING_RUB  потолок цены клика на поиске, ₽ (по умолчанию 25)
 *   NETWORK_CEILING_RUB потолок цены клика в сетях, ₽ (по умолчанию 10)
 */

import { fileURLToPath } from 'node:url'

import { call } from './lib/direct-api.mjs'

const MICRO = 1_000_000
const UPDATE_BATCH = 10

/**
 * Изменения стратегии для одной кампании из campaigns.get.
 * null — менять нечего (кампания не на оплате за конверсии).
 */
export function clicksUpdate(campaign, { weeklyLimit, ceilings }) {
  const strategy = campaign.TextCampaign?.BiddingStrategy ?? {}
  const where = ['Search', 'Network'].find(side => strategy[side]?.BiddingStrategyType === 'PAY_FOR_CONVERSION')
  if (!where) return null

  const current = strategy[where].PayForConversion
  const ceiling = ceilings[where]
  return {
    id: campaign.Id,
    name: campaign.Name,
    where,
    from: `оплата за конверсии, ${current.Cpa / MICRO} ₽`,
    to: `максимум кликов, ${weeklyLimit} ₽/нед, клик до ${ceiling} ₽`,
    payload: {
      Id: campaign.Id,
      TextCampaign: {
        BiddingStrategy: {
          [where]: {
            BiddingStrategyType: 'WB_MAXIMUM_CLICKS',
            WbMaximumClicks: {
              WeeklySpendLimit: Math.round(weeklyLimit * MICRO),
              BidCeiling: Math.round(ceiling * MICRO),
            },
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
  const prefix = process.env.NAME_PREFIX ?? ''
  const settings = {
    weeklyLimit: Number(process.env.WEEKLY_LIMIT_RUB ?? 300),
    ceilings: {
      Search: Number(process.env.SEARCH_CEILING_RUB ?? 25),
      Network: Number(process.env.NETWORK_CEILING_RUB ?? 10),
    },
  }

  const { Campaigns = [] } = await call('campaigns', 'get', {
    SelectionCriteria: { States: ['ON', 'SUSPENDED'] },
    FieldNames: ['Id', 'Name', 'State'],
    TextCampaignFieldNames: ['BiddingStrategy'],
  }, token)
  const ours = Campaigns.filter(c => c.Name.startsWith(prefix))
  if (!ours.length) {
    console.error(`Кампаний с именем «${prefix}…» в кабинете нет.`)
    process.exit(1)
  }

  console.log(apply ? 'Перевожу на клики.' : 'Сухой прогон: ничего не отправляю.')
  const updates = []
  for (const campaign of ours) {
    const update = clicksUpdate(campaign, settings)
    if (!update) {
      console.log(`  ${campaign.Name} (${campaign.Id}, ${campaign.State}): не оплата за конверсии, без изменений`)
      continue
    }
    console.log(`  ${update.name} (${update.id}, ${campaign.State}): ${update.from} → ${update.to}`)
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
        console.error(`  ${item.Id ?? ''} ошибка: ${error.Message} ${error.Details ?? ''}`)
      }
    }
  }
  if (failed) process.exit(1)
  console.log(`Готово: переведено на клики ${updates.length}.`)
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch(error => {
    console.error(error.message)
    process.exit(1)
  })
}
