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
 *   CPA_RUB          цена конверсии днём, ₽ (по умолчанию 500)
 *   NIGHT_CPA_RUB    цена конверсии ночью, ₽ (по умолчанию CPA_RUB / 10)
 *   WEEKLY_RUB       недельный лимит расхода, ₽ (по умолчанию 10000)
 *   GOAL_VALUE_RUB   ценность цели для Директа, ₽ (по умолчанию 4000)
 */

import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

import { call as apiCall } from './lib/direct-api.mjs'

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
  nightCpaRub: Number(process.env.NIGHT_CPA_RUB ?? Number(process.env.CPA_RUB ?? 500) / 10),
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

/**
 * Title и Title2 вместе тоже ограничены: длиннее — Директ молча выбрасывает
 * Title2 (только предупреждение), и объявление уходит с одним заголовком.
 */
export const AD_TITLES_TOTAL = 56

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
  // Цифры в текстах — ровно те, что на лендинге (site-excel/src/Pricing.tsx,
  // Landing.tsx): расхождение с посадочной модерация Директа отбивает.
  return [
    {
      Title: 'Excel остаётся Excel’ем',
      Title2: 'Сделаем из него приложение',
      Text: 'Пришлите таблицу — через 45 минут покажем приложение на ваших данных. Бесплатно.',
    },
    {
      Title: 'Учёт из Excel — в приложение',
      Title2: 'Демо бесплатно, 45 минут',
      Text: 'Формы, права доступа и отчёты вместо файла в почте. Облако от 1 950 ₽/мес.',
    },
    {
      Title: 'Из таблиц — в систему учёта',
      Title2: 'Покажем на ваших файлах',
      Text: 'Кейсы: корма, рулоны, продажи. Разбор процесса с ТЗ — 20 000 ₽. Сервер в России.',
    },
  ].map(ad => ({ ...ad, Href: href(campaignSlug, siteUrl) }))
}

/** Ограничения Директа на быстрые ссылки и уточнения. */
export const SITELINK_LIMITS = { Title: 30, Description: 60, TitlesTotal: 66 }
export const CALLOUT_LIMIT = 25

/** Быстрые ссылки — на якоря разделов, которые есть на странице без клика. */
export function sitelinksFor(campaignSlug, siteUrl = cfg.siteUrl) {
  return [
    { Title: 'Сколько стоит', Description: 'Демонстрация бесплатно, облако от 1 950 ₽ в месяц', anchor: 'ceny' },
    { Title: 'Кейсы клиентов', Description: 'Было в Excel — стало приложением: корма, рулоны, продажи', anchor: 'keysy' },
    { Title: 'Как это работает', Description: 'Как агент читает структуру ваших таблиц', anchor: 'kak' },
    { Title: 'Сравнение с Power Apps', Description: 'Чем Интеграм отличается от Power Apps и Quickbase', anchor: 'sravnenie' },
  ].map(({ anchor, ...link }) => ({ ...link, Href: `${href(campaignSlug, siteUrl)}#${anchor}` }))
}

export const CALLOUTS = ['Демонстрация бесплатно', 'Сервер в России', 'Реестр российского ПО', 'Облако от 1 950 ₽/мес']

/**
 * Минус-слова на всю кампанию. Прошлый запуск (714501622, сентябрь) собрал
 * 33 клика и ноль заявок, и шли они в основном с автотаргетинга по «эксель
 * скачать»: человек ищет файл, а не систему учёта. «бесплатно» сюда не входит —
 * демонстрация на лендинге и правда бесплатная.
 */
export const CAMPAIGN_NEGATIVES = ['скачать', 'шаблон', 'образец', 'бланк', 'торрент']

/** Автотаргетинг поиска: только запросы, прямо совпадающие с тем, что мы продаём. */
export const EXACT_ONLY = ['EXACT', 'ALTERNATIVE', 'COMPETITOR', 'BROADER', 'ACCESSORY']
  .map(Category => ({ Category, Value: Category === 'EXACT' ? 'YES' : 'NO' }))

/**
 * Смены по московскому времени (решение владельца 29.09.2026): днём с 8:00 до
 * 21:00 конверсия стоит CPA_RUB, ночью — вдесятеро дешевле. Поэтому каждая
 * площадка разведена на две кампании с непересекающимся расписанием: одна
 * кампания не умеет платить за конверсию по-разному в разные часы.
 */
export const DAY_HOURS = { from: 8, to: 21 }

/** Строки расписания Директа: «день недели,ставка на час 0,…,час 23»; 100 — показ, 0 — нет. */
export function scheduleFor(shift) {
  const hours = Array.from({ length: 24 }, (_, h) => {
    const isDay = h >= DAY_HOURS.from && h < DAY_HOURS.to
    return (shift === 'day') === isDay ? 100 : 0
  })
  return [1, 2, 3, 4, 5, 6, 7].map(day => [day, ...hours].join(','))
}

/** Стратегия оплаты за конверсии для одной площадки (поиск или сети). */
export function payForConversion(shift = 'day') {
  return {
    BiddingStrategyType: 'PAY_FOR_CONVERSION',
    PayForConversion: {
      Cpa: Math.round((shift === 'night' ? cfg.nightCpaRub : cfg.cpaRub) * MICRO),
      GoalId: cfg.goalId,
      WeeklySpendLimit: Math.round(cfg.weeklyRub * MICRO),
    },
  }
}

export function campaignPayload(name, slug, where, shift = 'day') {
  return {
    Name: name,
    StartDate: new Date().toISOString().slice(0, 10),
    NegativeKeywords: { Items: CAMPAIGN_NEGATIVES },
    TimeZone: 'Europe/Moscow',
    TimeTargeting: {
      Schedule: { Items: scheduleFor(shift) },
      ConsiderWorkingWeekends: 'YES',
    },
    TextCampaign: {
      BiddingStrategy: {
        Search: where === 'search' ? payForConversion(shift) : { BiddingStrategyType: 'SERVING_OFF' },
        Network: where === 'network' ? payForConversion(shift) : { BiddingStrategyType: 'SERVING_OFF' },
      },
      CounterIds: { Items: [cfg.counterId] },
      PriorityGoals: {
        Items: [{ GoalId: cfg.goalId, Value: Math.round(cfg.goalValueRub * MICRO) }],
      },
      Settings: [{ Option: 'ADD_METRICA_TAG', Value: 'YES' }],
    },
    _slug: slug,
    // На поиске автотаргетинг и привёл «эксель скачать» — там он сужен до
    // целевых запросов (EXACT_ONLY). В сетях — включён: см. «Сети отдельной кампанией».
    _autotargeting: where === 'network',
  }
}

const CAMPAIGNS = [
  campaignPayload('Excel-CPA поиск день', 'excel-cpa-search-day', 'search', 'day'),
  campaignPayload('Excel-CPA поиск ночь', 'excel-cpa-search-night', 'search', 'night'),
  campaignPayload('Excel-CPA сети день', 'excel-cpa-network-day', 'network', 'day'),
  campaignPayload('Excel-CPA сети ночь', 'excel-cpa-network-night', 'network', 'night'),
]

async function call(service, method, params) {
  const body = JSON.stringify({ method, params })
  if (!apply) {
    console.log(`\n— ${service}.${method}\n${body}`)
    // В сухом прогоне возвращаем правдоподобные идентификаторы, чтобы было
    // видно всю цепочку запросов, а не только первый.
    return { dryRun: true }
  }
  return apiCall(service, method, params, cfg.token)
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
  console.log(`Цена конверсии: днём ${cfg.cpaRub} ₽, ночью ${cfg.nightCpaRub} ₽ | недельный лимит: ${cfg.weeklyRub} ₽ на кампанию`)

  // Уточнения — общие для аккаунта, заводятся один раз на все объявления.
  const calloutsAdded = await call('adextensions', 'add', {
    AdExtensions: CALLOUTS.map(CalloutText => ({ Callout: { CalloutText } })),
  })
  const calloutIds = apply ? idsOf(calloutsAdded, 'AddResults') : ['<id уточнений>']

  for (const campaign of CAMPAIGNS) {
    const { _slug: slug, _autotargeting: autotargeting, ...payload } = campaign
    console.log(`\n=== ${payload.Name} ===`)

    const added = await call('campaigns', 'add', { Campaigns: [payload] })
    const [campaignId] = apply ? idsOf(added, 'AddResults') : [`<id ${slug}>`]
    if (!campaignId) throw new Error('кампания не создана — см. ошибку выше')
    console.log(`кампания: ${campaignId}`)

    // Набор быстрых ссылок свой на кампанию: в ссылках её UTM.
    const setAdded = await call('sitelinks', 'add', { SitelinksSets: [{ Sitelinks: sitelinksFor(slug) }] })
    const [sitelinkSetId] = apply ? idsOf(setAdded, 'AddResults') : [`<id ссылок ${slug}>`]
    if (!sitelinkSetId) throw new Error('быстрые ссылки не созданы — см. ошибку выше')

    for (const group of groups) {
      const groupPayload = {
        Name: `${group.name}`,
        CampaignId: campaignId,
        RegionIds: [REGION_RUSSIA],
        ...(group.minusWords.length ? { NegativeKeywords: { Items: group.minusWords } } : {}),
      }
      const groupAdded = await call('adgroups', 'add', { AdGroups: [groupPayload] })
      const [groupId] = apply ? idsOf(groupAdded, 'AddResults') : [`<id ${slug}-${group.slug}>`]
      if (!groupId) throw new Error(`группа ${group.name} не создана — см. ошибку выше`)
      console.log(`  группа ${group.name}: ${groupId} (${group.keywords.length} фраз)`)

      const keywordsAdded = await call('keywords', 'add', {
        Keywords: group.keywords.map(Keyword => ({ Keyword, AdGroupId: groupId })),
      })
      // Отказы Директ кладёт внутрь ответа при HTTP 200 — без разбора их не видно.
      if (apply) idsOf(keywordsAdded, 'AddResults')

      const adsAdded = await call('ads', 'add', {
        Ads: adsFor(slug).map(ad => ({
          AdGroupId: groupId,
          TextAd: { ...ad, SitelinkSetId: sitelinkSetId, AdExtensionIds: calloutIds },
        })),
      })
      if (apply) idsOf(adsAdded, 'AddResults')
    }

    // ---autotargeting Директ заводит в каждой группе сам и удалить не даёт
    // (5005). Дальше площадки ведут себя по-разному (проверено 29.09.2026):
    // на поиске его нельзя и остановить (8305), можно только сузить до
    // целевых запросов; в сетевой кампании Директ, наоборот, сам его
    // останавливает, а по схеме он там нужен — включаем.
    const found = await call('keywords', 'get', {
      SelectionCriteria: { CampaignIds: [campaignId] },
      FieldNames: ['Id', 'Keyword'],
    })
    const autoIds = (found?.Keywords ?? []).filter(k => k.Keyword.startsWith('---autotargeting')).map(k => k.Id)
    if (autoIds.length && autotargeting) {
      idsOf(await call('keywords', 'resume', { SelectionCriteria: { Ids: autoIds } }), 'ResumeResults')
    } else if (autoIds.length) {
      idsOf(await call('keywords', 'update', {
        Keywords: autoIds.map(Id => ({ Id, AutotargetingCategories: EXACT_ONLY })),
      }), 'UpdateResults')
    }
    console.log(`  автотаргетинг: ${autotargeting ? 'включён' : 'только целевые запросы'} (${apply ? autoIds.length : '…'} групп)`)

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
