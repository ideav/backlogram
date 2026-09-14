#!/usr/bin/env node
/**
 * Традиционная кампания в РСЯ: оплата за клики, показы только на доверенных
 * площадках. «Только на доверенных» в Директе недостижимо напрямую — белого
 * списка нет, есть лишь запрет до 1000 доменов, поэтому кампания создаётся
 * сразу с запретом всего, что уже видели в отчётах, а дальше список пополняет
 * scripts/direct-rsya-whitelist-sync.mjs.
 *
 * Отличия от кампании с оплатой за конверсии (direct-create-cpa-campaign.mjs):
 *
 *   - платим за клик, значит мусорный трафик здесь стоит денег;
 *   - поэтому мусорной группы ключей нет вовсе, только горячие и смежные;
 *   - ставка высокая. На 1–1,4 ₽ за клик премиальный инвентарь не покупается:
 *     в текущих кампаниях аккаунта по такой ставке пришли мобильные игры и
 *     биржи, а РБК, Хабра и Авито в отчёте нет ни одного показа.
 *
 * Создаёт всё ОСТАНОВЛЕННЫМ, объявления остаются черновиками.
 *
 *   node scripts/direct-create-trusted-rsya-campaign.mjs           # сухой прогон
 *   node scripts/direct-create-trusted-rsya-campaign.mjs --apply
 *
 * Окружение: DIRECT_TOKEN, SITE_URL, METRIKA_ID, GOAL_ID (цель для отчётности),
 * NETWORK_CPC_RUB (средняя цена клика, по умолчанию 25), WEEKLY_RUB (недельный
 * лимит, по умолчанию 7000).
 */

import { existsSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

import { adsFor } from './direct-create-cpa-campaign.mjs'
import { EXCLUDED_SITES_LIMIT } from './direct-rsya-whitelist-sync.mjs'
import { call as apiCall } from './lib/direct-api.mjs'

const MICRO = 1_000_000
const REGION_RUSSIA = 225
const CAMPAIGN_SLUG = 'excel-rsya-trusted'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const KEYWORDS_FILE = path.resolve(__dirname, '../docs/marketing/excel-cpa-campaign.keywords.json')
const EXCLUDED_FILE = path.resolve(__dirname, '../docs/marketing/rsya-excluded-sites.json')

const apply = process.argv.includes('--apply')

const cfg = {
  token: process.env.DIRECT_TOKEN ?? '',
  siteUrl: (process.env.SITE_URL ?? '').replace(/\/+$/, ''),
  counterId: Number(process.env.METRIKA_ID ?? 0),
  goalId: Number(process.env.GOAL_ID ?? 0),
  cpcRub: Number(process.env.NETWORK_CPC_RUB ?? 25),
  weeklyRub: Number(process.env.WEEKLY_RUB ?? 7000),
}

/** Группы без мусорной: за клики платим деньгами. */
export function trustedGroups(groups) {
  return groups.filter(group => group.slug !== 'junk')
}

/** Запрет, накопленный синхронизатором. Нет файла — стартуем с пустым. */
export function storedExclusions(file = EXCLUDED_FILE) {
  if (!existsSync(file)) return []
  const { excluded } = JSON.parse(readFileSync(file, 'utf8'))
  return (excluded ?? []).slice(0, EXCLUDED_SITES_LIMIT)
}

export function campaignPayload(excluded) {
  return {
    Name: 'Excel-РСЯ доверенные площадки',
    StartDate: new Date().toISOString().slice(0, 10),
    // Запрещённые площадки — поле самой кампании, а не TextCampaign.
    ExcludedSites: { Items: excluded },
    TextCampaign: {
      BiddingStrategy: {
        // Поиск выключен: кампания про площадки сетей, и смешивать их нельзя —
        // иначе непонятно, за что заплатили.
        Search: { BiddingStrategyType: 'SERVING_OFF' },
        Network: {
          BiddingStrategyType: 'AVERAGE_CPC',
          AverageCpc: {
            AverageCpc: Math.round(cfg.cpcRub * MICRO),
            WeeklySpendLimit: Math.round(cfg.weeklyRub * MICRO),
          },
        },
      },
      CounterIds: { Items: [cfg.counterId] },
      ...(cfg.goalId ? { PriorityGoals: { Items: [{ GoalId: cfg.goalId, Value: 4000 * MICRO }] } } : {}),
      Settings: [{ Option: 'ADD_METRICA_TAG', Value: 'YES' }],
    },
  }
}

async function call(service, method, params) {
  const body = JSON.stringify({ method, params })
  if (!apply) {
    console.log(`\n— ${service}.${method}\n${body.slice(0, 600)}${body.length > 600 ? ' …' : ''}`)
    return { dryRun: true }
  }
  return apiCall(service, method, params, cfg.token)
}

function idsOf(result, key) {
  const items = result?.[key] ?? []
  for (const item of items) {
    for (const warning of item.Warnings ?? []) console.warn('  предупреждение:', warning.Message)
    for (const error of item.Errors ?? []) console.error('  ошибка:', error.Message, error.Details ?? '')
  }
  return items.map(item => item.Id).filter(Boolean)
}

async function main() {
  const problems = []
  if (!cfg.siteUrl.startsWith('https://')) problems.push('SITE_URL: нужен адрес лендинга с https')
  if (!cfg.counterId) problems.push('METRIKA_ID: нужен счётчик лендинга')
  if (apply && !cfg.token) problems.push('DIRECT_TOKEN: без токена создавать нечем')
  if (problems.length) {
    console.error('Не хватает настроек:\n  ' + problems.join('\n  '))
    process.exit(1)
  }

  const { groups } = JSON.parse(readFileSync(KEYWORDS_FILE, 'utf8'))
  const excluded = storedExclusions()

  console.log(apply ? 'Создаю кампанию (остановленной).' : 'Сухой прогон: ничего не отправляю.')
  console.log(`Ставка в сетях: ${cfg.cpcRub} ₽ | недельный лимит: ${cfg.weeklyRub} ₽`)
  if (excluded.length > EXCLUDED_SITES_LIMIT / 2) {
    // По замеру 14.09.2026 мусор старых кампаний — 987 площадок из 1000
    // возможных: перенести его целиком значит израсходовать лимит в день старта.
    console.warn(
      `ВНИМАНИЕ: переносится ${excluded.length} запрещённых площадок из ${EXCLUDED_SITES_LIMIT} возможных.`,
    )
    console.warn('  Это мусор, налипший на ставке 1 ₽; на ставке 25 ₽ инвентарь другой.')
    console.warn('  Разумнее стартовать с пустым запретом — удалите docs/marketing/rsya-excluded-sites.json.')
  }
  console.log(
    excluded.length
      ? `Запрещённых площадок на старте: ${excluded.length}`
      : 'Стартуем с пустым запретом — список наполнится тем, что покажется на новой ставке.',
  )

  const added = await call('campaigns', 'add', { Campaigns: [campaignPayload(excluded)] })
  const [campaignId] = apply ? idsOf(added, 'AddResults') : ['<id кампании>']
  console.log(`кампания: ${campaignId}`)

  for (const group of trustedGroups(groups)) {
    const groupAdded = await call('adgroups', 'add', {
      AdGroups: [
        {
          Name: group.name,
          CampaignId: campaignId,
          RegionIds: [REGION_RUSSIA],
          ...(group.minusWords.length ? { NegativeKeywords: { Items: group.minusWords } } : {}),
        },
      ],
    })
    const [groupId] = apply ? idsOf(groupAdded, 'AddResults') : [`<id ${group.slug}>`]
    console.log(`  группа ${group.name}: ${groupId} (${group.keywords.length} фраз)`)

    await call('keywords', 'add', {
      Keywords: group.keywords.map(Keyword => ({
        Keyword,
        AdGroupId: groupId,
        Bid: Math.round(cfg.cpcRub * MICRO),
      })),
    })
    await call('ads', 'add', {
      Ads: adsFor(CAMPAIGN_SLUG, cfg.siteUrl).map(TextAd => ({ AdGroupId: groupId, TextAd })),
    })
  }

  if (apply) {
    await call('campaigns', 'suspend', { SelectionCriteria: { Ids: [campaignId] } })
    console.log('  кампания остановлена')
  }

  console.log(
    apply
      ? '\nГотово. Кампания остановлена, объявления — черновики. Перед включением прогоните синхронизатор ещё раз.'
      : '\nСухой прогон закончен.',
  )
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch(error => {
    console.error('\n' + error.message)
    process.exit(1)
  })
}
