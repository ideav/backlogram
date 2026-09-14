#!/usr/bin/env node
/**
 * Создаёт в Яндекс.Директе пару кампаний «Excel → приложение» со стратегией
 * оплаты за конверсии — поисковую и сетевую. Всё создаётся ОСТАНОВЛЕННЫМ:
 * объявления остаются черновиками (на модерацию не отправляются), кампании
 * приостанавливаются сразу после создания. Включает человек руками.
 *
 * Схема кампании и обоснование цифр — docs/marketing/excel-cpa-campaign.md.
 * Лендинг, цели и защита целевой цели — site-excel/README.md.
 *
 * Без --apply скрипт ничего не отправляет, а печатает запросы: так видно, что
 * именно уйдёт в боевой кабинет.
 *
 *   node scripts/direct-create-cpa-campaign.mjs            # сухой прогон
 *   node scripts/direct-create-cpa-campaign.mjs --apply    # создать
 *
 * Окружение:
 *   DIRECT_TOKEN     OAuth-токен Директа (обязателен для --apply)
 *   SITE_URL         адрес лендинга, например https://example.ru
 *   METRIKA_ID       счётчик Метрики нового домена
 *   GOAL_ID          id цели signup_click в этом счётчике
 *   CPA_RUB          цена конверсии, ₽ (по умолчанию 500)
 *   WEEKLY_RUB       недельный лимит расхода, ₽ (по умолчанию 10000)
 *   GOAL_VALUE_RUB   ценность цели для Директа, ₽ (по умолчанию 4000)
 */

import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const API = 'https://api.direct.yandex.com/json/v5'
const MICRO = 1_000_000
const REGION_RUSSIA = 225

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const KEYWORDS_FILE = path.resolve(__dirname, '../docs/marketing/excel-cpa-campaign.keywords.json')

const apply = process.argv.includes('--apply')

const cfg = {
  token: process.env.DIRECT_TOKEN ?? '',
  siteUrl: (process.env.SITE_URL ?? '').replace(/\/+$/, ''),
  counterId: Number(process.env.METRIKA_ID ?? 0),
  goalId: Number(process.env.GOAL_ID ?? 0),
  cpaRub: Number(process.env.CPA_RUB ?? 500),
  weeklyRub: Number(process.env.WEEKLY_RUB ?? 10000),
  // Ценность цели — не чек разбора, а ожидаемая выручка с одной записи:
  // 20 000 ₽ при гипотезе «продаётся каждая пятая». Гипотеза не проверена,
  // см. раздел «Чего в этой схеме нет» в описании кампании.
  goalValueRub: Number(process.env.GOAL_VALUE_RUB ?? 4000),
}

/** Чего не хватает в окружении, чтобы запуск имел смысл. */
export function configProblems(config = cfg, willApply = apply) {
  const problems = []
  if (!config.siteUrl.startsWith('https://')) problems.push('SITE_URL: нужен адрес лендинга с https')
  if (!config.counterId) problems.push('METRIKA_ID: нужен счётчик нового домена')
  if (!config.goalId) problems.push('GOAL_ID: нужен id цели signup_click')
  if (willApply && !config.token) problems.push('DIRECT_TOKEN: без токена создавать нечем')
  return problems
}

const { groups } = JSON.parse(readFileSync(KEYWORDS_FILE, 'utf8'))

/** Ограничения Директа на длину полей текстового объявления. */
export const AD_LIMITS = { Title: 56, Title2: 30, Text: 81 }

/** Ссылка объявления с UTM; {ad_id}/{keyword} подставляет сам Директ. */
export function href(campaignSlug, siteUrl = cfg.siteUrl) {
  const utm = [
    'utm_source=yandex',
    'utm_medium=cpc',
    `utm_campaign=${campaignSlug}`,
    'utm_content={ad_id}',
    'utm_term={keyword}',
  ].join('&')
  return `${siteUrl}/?${utm}`
}

/**
 * Три объявления на группу. Тексты рассчитаны на человека, который искал совсем
 * другое и видит объявление боковым зрением, — отсюда короткие заголовки и
 * длина в пределах AD_LIMITS (за превышение Директ отбивает объявление).
 */
export function adsFor(campaignSlug, siteUrl = cfg.siteUrl) {
  return [
    {
      Title: 'Excel остаётся Excel’ем',
      Title2: 'Сделаем из него приложение',
      Text: 'Пришлите таблицу — через 45 минут вернём приложение с вашими данными. Бесплатно.',
    },
    {
      Title: 'Таблица на весь цех — не учёт',
      Title2: 'Покажем, как это выглядит',
      Text: 'Формы, права доступа и отчёты вместо файла в почте. Демонстрация бесплатно.',
    },
    {
      Title: 'Ваши таблицы — рабочая система',
      Title2: 'За 45 минут, без внедрения',
      Text: 'Присылаете файл как есть — получаете ссылку на готовую базу. Без настройки.',
    },
  ].map(ad => ({ ...ad, Href: href(campaignSlug, siteUrl), Mobile: 'NO' }))
}

/** Стратегия оплаты за конверсии для одной площадки (поиск или сети). */
export function payForConversion() {
  return {
    BiddingStrategyType: 'PAY_FOR_CONVERSION',
    PayForConversion: {
      Cpa: Math.round(cfg.cpaRub * MICRO),
      GoalId: cfg.goalId,
      WeeklySpendLimit: Math.round(cfg.weeklyRub * MICRO),
    },
  }
}

export function campaignPayload(name, slug, where) {
  return {
    Name: name,
    StartDate: new Date().toISOString().slice(0, 10),
    TextCampaign: {
      BiddingStrategy: {
        Search: where === 'search' ? payForConversion() : { BiddingStrategyType: 'SERVING_OFF' },
        Network: where === 'network' ? payForConversion() : { BiddingStrategyType: 'SERVING_OFF' },
      },
      CounterIds: { Items: [cfg.counterId] },
      PriorityGoals: {
        Items: [{ GoalId: cfg.goalId, Value: Math.round(cfg.goalValueRub * MICRO) }],
      },
      Settings: [{ Option: 'ADD_METRICA_TAG', Value: 'YES' }],
    },
    _slug: slug,
  }
}

const CAMPAIGNS = [
  campaignPayload('Excel-CPA поиск', 'excel-cpa-search', 'search'),
  campaignPayload('Excel-CPA сети', 'excel-cpa-network', 'network'),
]

async function call(service, method, params) {
  const body = JSON.stringify({ method, params })
  if (!apply) {
    console.log(`\n— ${service}.${method}\n${body}`)
    // В сухом прогоне возвращаем правдоподобные идентификаторы, чтобы было
    // видно всю цепочку запросов, а не только первый.
    return { dryRun: true }
  }
  const response = await fetch(`${API}/${service}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${cfg.token}`,
      'Accept-Language': 'ru',
      'Content-Type': 'application/json; charset=utf-8',
    },
    body,
  })
  const payload = await response.json()
  if (payload.error) {
    throw new Error(`${service}.${method}: ${payload.error.error_string} — ${payload.error.error_detail}`)
  }
  return payload.result
}

/** Из ответа Директа достаёт id, попутно показывая предупреждения. */
function idsOf(result, key) {
  const items = result?.[key] ?? []
  for (const item of items) {
    for (const warning of item.Warnings ?? []) console.warn('  предупреждение:', warning.Message)
    for (const error of item.Errors ?? []) console.error('  ошибка:', error.Message, error.Details ?? '')
  }
  return items.map(item => item.Id).filter(Boolean)
}

async function main() {
  const problems = configProblems()
  if (problems.length) {
    console.error('Не хватает настроек:\n  ' + problems.join('\n  '))
    process.exit(1)
  }

  console.log(apply ? 'Создаю кампании в боевом кабинете (всё остановленным).' : 'Сухой прогон: ничего не отправляю.')
  console.log(`Лендинг: ${cfg.siteUrl} | счётчик: ${cfg.counterId} | цель: ${cfg.goalId}`)
  console.log(`Цена конверсии: ${cfg.cpaRub} ₽ | недельный лимит: ${cfg.weeklyRub} ₽`)

  for (const campaign of CAMPAIGNS) {
    const { _slug: slug, ...payload } = campaign
    console.log(`\n=== ${payload.Name} ===`)

    const added = await call('campaigns', 'add', { Campaigns: [payload] })
    const [campaignId] = apply ? idsOf(added, 'AddResults') : [`<id ${slug}>`]
    console.log(`кампания: ${campaignId}`)

    for (const group of groups) {
      const groupPayload = {
        Name: `${group.name}`,
        CampaignId: campaignId,
        RegionIds: [REGION_RUSSIA],
        ...(group.minusWords.length ? { NegativeKeywords: { Items: group.minusWords } } : {}),
      }
      const groupAdded = await call('adgroups', 'add', { AdGroups: [groupPayload] })
      const [groupId] = apply ? idsOf(groupAdded, 'AddResults') : [`<id ${slug}-${group.slug}>`]
      console.log(`  группа ${group.name}: ${groupId} (${group.keywords.length} фраз)`)

      await call('keywords', 'add', {
        Keywords: group.keywords.map(Keyword => ({ Keyword, AdGroupId: groupId })),
      })

      await call('ads', 'add', {
        Ads: adsFor(slug).map(TextAd => ({ AdGroupId: groupId, TextAd })),
      })
    }

    if (apply) {
      // Кампания создаётся активной — останавливаем сразу, до того как
      // объявления пройдут модерацию.
      await call('campaigns', 'suspend', { SelectionCriteria: { Ids: [campaignId] } })
      console.log('  кампания остановлена')
    }
  }

  console.log(
    apply
      ? '\nГотово. Кампании остановлены, объявления — черновики: проверьте в интерфейсе и отправьте на модерацию сами.'
      : '\nСухой прогон закончен. Повторите с --apply, когда цель signup_click проверена на живом лендинге.',
  )
}

// Запускаемся только как скрипт: тесты импортируют отсюда чистые функции.
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch(error => {
    console.error('\n' + error.message)
    process.exit(1)
  })
}
