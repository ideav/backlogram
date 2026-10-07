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
 * Профиль (CAMPAIGN_PROFILE) выбирает посадочную и всё, что от неё зависит:
 * тексты, быстрые ссылки, фразы, минус-слова, имена кампаний.
 *   excel      главная, цель signup_click (по умолчанию)
 *   praktikum  /praktikum/, цель praktikum_click (issue #668)
 *   praktikum-roles  та же посадочная, гипотезы по ролям: на каждую группу
 *              фраз свои 4 кампании и свои объявления (issue #670)
 *   adept      /adept/, цель adept_click (issue #674)
 *   partner    /partner/, цель partner_click (issue #674)
 *
 * Окружение:
 *   DIRECT_TOKEN     OAuth-токен Директа (обязателен для --apply)
 *   SITE_URL         адрес лендинга, например https://example.ru
 *   METRIKA_ID       счётчик Метрики нового домена
 *   CAMPAIGN_PROFILE excel | praktikum | praktikum-roles | adept | partner
 *                    (по умолчанию excel)
 *   GOAL_ID          id целевой цели профиля в этом счётчике
 *   CPA_RUB          цена конверсии днём, ₽ (по умолчанию — у профиля, иначе 500)
 *   NIGHT_CPA_RUB    цена конверсии ночью, ₽ (по умолчанию — у профиля, иначе CPA_RUB / 10)
 *   WEEKLY_RUB       недельный лимит расхода, ₽ (по умолчанию 10000)
 *   GOAL_VALUE_RUB   ценность цели для Директа, ₽ (по умолчанию — у профиля)
 *   CAMPAIGN_ONLY    создать только кампании, в slug которых есть эта строка,
 *                    например network — досоздать сети, если Директ оборвал прогон
 */

import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

import { call as apiCall } from './lib/direct-api.mjs'
import { CORE_FILE, loadNegatives } from './excel-cpa-import-core.mjs'

const MICRO = 1_000_000
const REGION_RUSSIA = 225

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const KEYWORDS_FILE = path.resolve(__dirname, '../docs/marketing/excel-cpa-campaign.keywords.json')
const PRAKTIKUM_KEYWORDS_FILE = path.resolve(__dirname, '../docs/marketing/praktikum-cpa.keywords.json')
const ROLES_KEYWORDS_FILE = path.resolve(__dirname, '../docs/marketing/praktikum-roles.keywords.json')
const ROLES_ADS_FILE = path.resolve(__dirname, '../docs/marketing/praktikum-roles.ads.json')
const marketing = name => path.resolve(__dirname, '../docs/marketing', name)

const apply = process.argv.includes('--apply')

/**
 * Посадочные, под которые умеет собирать кампании скрипт. Общее у всех —
 * стратегия, смены день/ночь и раздельные поиск и сети; различается всё,
 * что видит человек и по чему Директ ищет аудиторию.
 */
export const PROFILES = {
  excel: {
    title: 'Excel-CPA',
    slug: 'excel-cpa',
    path: '/',
    goalName: 'signup_click',
    // Ценность цели — не чек разбора, а ожидаемая выручка с одной записи:
    // 20 000 ₽ при гипотезе «продаётся каждая пятая». Гипотеза не проверена,
    // см. раздел «Чего в этой схеме нет» в описании кампании.
    goalValueRub: 4000,
    keywordFiles: [KEYWORDS_FILE, CORE_FILE],
    allowedNegatives: [],
    // Цифры в текстах — ровно те, что на лендинге (site-excel/src/Pricing.tsx,
    // Landing.tsx): расхождение с посадочной модерация Директа отбивает.
    ads: [
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
    ],
    sitelinks: [
      { Title: 'Сколько стоит', Description: 'Демонстрация бесплатно, облако от 1 950 ₽ в месяц', anchor: 'ceny' },
      { Title: 'Кейсы клиентов', Description: 'Было в Excel — стало приложением: корма, рулоны, продажи', anchor: 'keysy' },
      { Title: 'Как это работает', Description: 'Как агент читает структуру ваших таблиц', anchor: 'kak' },
      { Title: 'Сравнение с Power Apps', Description: 'Чем Интеграм отличается от Power Apps и Quickbase', anchor: 'sravnenie' },
    ],
    callouts: ['Демонстрация бесплатно', 'Сервер в России', 'Реестр российского ПО', 'Облако от 1 950 ₽/мес'],
  },
  praktikum: {
    title: 'Практикум-CPA',
    slug: 'praktikum-cpa',
    path: '/praktikum/',
    goalName: 'praktikum_click',
    // Цена практикума: та же ценность, что у цели praktikum_lead.
    goalValueRub: 4900,
    // Решение владельца 07.10.2026 (#666): 200 ₽ днём, 10 ₽ ночью.
    cpaRub: 200,
    nightCpaRub: 10,
    keywordFiles: [PRAKTIKUM_KEYWORDS_FILE],
    // Практикум — это и есть обучение: человек, который ищет курс или урок
    // по нейросетям, здесь целевой. Остальная «учёба» (школа, ЕГЭ, студент,
    // диплом) по-прежнему минусуется.
    allowedNegatives: ['курс', 'обучение', 'практикум', 'вебинар', 'урок', 'тренинг', 'семинар'],
    // Цифры — с /praktikum/ (site-excel/src/content.ts, PRAKTIKUM).
    ads: [
      {
        Title: 'Свой первый ИИ-проект за час',
        Title2: 'На вашем файле Excel',
        Text: 'ИИ-агент собирает приложение из вашей таблицы, за час разбираем его вместе.',
      },
      {
        Title: 'Практикум по ИИ: 1 час онлайн',
        Title2: '4 900 ₽, на ваших данных',
        Text: 'Программировать и писать промпты не нужно. Уходите со ссылкой на приложение.',
      },
      {
        Title: 'Нейросеть и ваш Excel',
        Title2: 'Практикум для новичков',
        Text: 'Формы, роли и отчёты из вашей таблицы. Час с ведущим — 4 900 ₽, онлайн.',
      },
    ],
    sitelinks: [
      { Title: 'Что нужно уметь', Description: 'Хватит Excel на уровне пользователя и видеосвязи', anchor: 'porog' },
      { Title: 'Программа часа', Description: 'От цели до ссылки на приложение — по минутам', anchor: 'programma' },
      { Title: 'Как подготовиться', Description: 'Рабочий файл, одна фраза о цели и пара расчётов', anchor: 'podgotovka' },
      { Title: 'Записаться', Description: 'Час онлайн на вашем файле — 4 900 ₽', anchor: 'zapis' },
    ],
    callouts: ['1 час онлайн', 'На вашем файле', 'Без программирования', 'Ссылка на приложение'],
  },
  // Рекрутинг (issue #674): адепты и партнёры — две раздельные четвёрки
  // кампаний, по 4 группы фраз × 12 объявлений, как у практикума (#670).
  // Денег с заявки сразу нет — ни у адепта, ни у партнёра, — поэтому ценность
  // цели условная: гипотеза для обучения стратегии, менять решает владелец.
  adept: {
    title: 'Адепты-CPA',
    slug: 'adept-cpa',
    path: '/adept/',
    goalName: 'adept_click',
    goalValueRub: 1000,
    keywordFiles: [marketing('adept-cpa.keywords.json')],
    adsFile: marketing('adept-cpa.ads.json'),
    ads: [],
    // Адепт ищет подработку, профессию и обучение — общие минус-слова главной
    // эти запросы бы погасили. Вакансии, резюме, школа и студенты минусуются
    // по-прежнему: адепт — не найм и не учёба ради диплома.
    allowedNegatives: ['подработка', 'фриланс', 'фрилансер', 'профессия', 'преподаватель', 'обучение', 'курс', 'вебинар'],
    sitelinks: [
      { Title: 'Кого ищем', Description: 'Объясняете просто и уверенно работаете с таблицами', anchor: 'kogo-ishchem' },
      { Title: 'Что получает адепт', Description: 'Обучение и платформа бесплатно, заказчики от партнёров', anchor: 'chto-poluchite' },
      { Title: 'Кто кому платит', Description: 'Платформа, адепт, заказчик и партнёр — правило денег', anchor: 'model' },
      { Title: 'Оставить заявку', Description: 'Пара строк о себе — в телеграм или на почту', anchor: 'zayavka' },
    ],
    callouts: ['Обучение бесплатно', 'Платформа бесплатно', 'Оплата вам напрямую', 'Заказчики от партнёров'],
  },
  partner: {
    title: 'Партнёры-CPA',
    slug: 'partner-cpa',
    path: '/partner/',
    goalName: 'partner_click',
    goalValueRub: 1000,
    keywordFiles: [marketing('partner-cpa.keywords.json')],
    adsFile: marketing('partner-cpa.ads.json'),
    ads: [],
    // «Процент» у главной минусуется как приём Excel; здесь это суть предложения.
    allowedNegatives: ['процент'],
    sitelinks: [
      { Title: 'Кому подходит', Description: 'Консультантам, бухгалтерам, интеграторам и агентствам', anchor: 'komu-podhodit' },
      { Title: 'Как это работает', Description: 'Вы знакомите заказчика, адепт делает проект', anchor: 'kak-ustroeno' },
      { Title: 'Кто кому платит', Description: 'Процент тому, кто привёл заказчика, — всегда', anchor: 'model' },
      { Title: 'Стать партнёром', Description: 'Напишите — договоримся о проценте от 15 до 40%', anchor: 'zayavka' },
    ],
    callouts: ['15–40% с выручки', 'Проект делает адепт', 'Программировать не нужно', 'Процент платит платформа'],
  },
}

/**
 * Гипотезы по ролям (issue #670): та же посадочная и цель, но фразы разбиты по
 * роли, чью работу на практикуме делает ИИ, и у каждой роли свои кампании —
 * так результат каждой гипотезы виден отдельно. Кампании профиля praktikum
 * (#668) не трогаются.
 */
PROFILES['praktikum-roles'] = {
  ...PROFILES.praktikum,
  title: 'Практикум-роль',
  slug: 'praktikum-role',
  // Гипотезы по ролям (#670) созданы по 500/50 ₽; #666 их цены не менял.
  cpaRub: 500,
  nightCpaRub: 50,
  keywordFiles: [ROLES_KEYWORDS_FILE],
  // У каждой группы 12 своих объявлений; profile.ads — запасные.
  adsFile: ROLES_ADS_FILE,
  campaignPerGroup: true,
}

export const PROFILE = PROFILES[process.env.CAMPAIGN_PROFILE ?? 'excel']

const cfg = {
  token: process.env.DIRECT_TOKEN ?? '',
  siteUrl: (process.env.SITE_URL ?? '').replace(/\/+$/, ''),
  counterId: Number(process.env.METRIKA_ID ?? 0),
  goalId: Number(process.env.GOAL_ID ?? 0),
  cpaRub: Number(process.env.CPA_RUB ?? PROFILE?.cpaRub ?? 500),
  nightCpaRub: Number(process.env.NIGHT_CPA_RUB ?? (process.env.CPA_RUB ? Number(process.env.CPA_RUB) / 10 : PROFILE?.nightCpaRub ?? 50)),
  weeklyRub: Number(process.env.WEEKLY_RUB ?? 10000),
  goalValueRub: Number(process.env.GOAL_VALUE_RUB ?? PROFILE?.goalValueRub ?? 0),
}

/** Чего не хватает в окружении, чтобы запуск имел смысл. */
export function configProblems(config = cfg, willApply = apply) {
  const problems = []
  if (!PROFILE) problems.push(`CAMPAIGN_PROFILE: нет профиля «${process.env.CAMPAIGN_PROFILE}», есть ${Object.keys(PROFILES).join(', ')}`)
  if (!config.siteUrl.startsWith('https://')) problems.push('SITE_URL: нужен адрес лендинга с https')
  if (!config.counterId) problems.push('METRIKA_ID: нужен счётчик нового домена')
  if (!config.goalId) problems.push(`GOAL_ID: нужен id цели ${PROFILE?.goalName ?? 'профиля'}`)
  if (willApply && !config.token) problems.push('DIRECT_TOKEN: без токена создавать нечем')
  return problems
}

/**
 * Группы фраз профиля. У главной — ручные группы (hot, pain) и коммерческий срез
 * SEO-ядра. Если у профиля есть adsFile, группа получает свои объявления (`ads`).
 */
export function groupsFor(profile = PROFILE) {
  const groups = profile.keywordFiles.flatMap(file => JSON.parse(readFileSync(file, 'utf8')).groups)
  if (!profile.adsFile) return groups
  const adsByGroup = JSON.parse(readFileSync(profile.adsFile, 'utf8')).groups
  return groups.map(group => (adsByGroup[group.slug] ? { ...group, ads: adsByGroup[group.slug] } : group))
}

/** Ограничения Директа на длину полей текстового объявления. */
export const AD_LIMITS = { Title: 56, Title2: 30, Text: 81 }

/**
 * Title и Title2 вместе тоже ограничены: длиннее — Директ молча выбрасывает
 * Title2 (только предупреждение), и объявление уходит с одним заголовком.
 */
export const AD_TITLES_TOTAL = 56

/** Ссылка объявления с UTM; {ad_id}/{keyword} подставляет сам Директ. */
export function href(campaignSlug, siteUrl = cfg.siteUrl, profile = PROFILE) {
  const utm = [
    'utm_source=yandex',
    'utm_medium=cpc',
    `utm_campaign=${campaignSlug}`,
    'utm_content={ad_id}',
    'utm_term={keyword}',
  ].join('&')
  return `${siteUrl}${profile.path}?${utm}`
}

/**
 * Больше трёх объявлений в группе Директ не держит: текстовые он теперь создаёт
 * комбинаторными, а их в группе максимум 3 (ошибка 7001, проверено 07.10.2026).
 */
export const ADS_PER_GROUP = 3

/**
 * Три объявления на группу. Тексты рассчитаны на человека, который искал совсем
 * другое и видит объявление боковым зрением, — отсюда короткие заголовки и
 * длина в пределах AD_LIMITS (за превышение Директ отбивает объявление).
 *
 * Если у группы свой набор объявлений длиннее трёх, каждая кампания берёт из
 * него свою тройку по номеру (campaignIndex — порядок campaignsFor): так
 * 12 объявлений группы расходятся по четырём кампаниям без повторов.
 */
export function adsFor(campaignSlug, siteUrl = cfg.siteUrl, profile = PROFILE, group = undefined, campaignIndex = 0) {
  const pool = group?.ads ?? profile.ads
  const start = (campaignIndex * ADS_PER_GROUP) % pool.length
  return pool.slice(start, start + ADS_PER_GROUP).map(ad => ({ ...ad, Href: href(campaignSlug, siteUrl, profile) }))
}

/** Ограничения Директа на быстрые ссылки и уточнения. */
export const SITELINK_LIMITS = { Title: 30, Description: 60, TitlesTotal: 66 }
export const CALLOUT_LIMIT = 25

/** Быстрые ссылки — на якоря разделов, которые есть на странице без клика. */
export function sitelinksFor(campaignSlug, siteUrl = cfg.siteUrl, profile = PROFILE) {
  return profile.sitelinks.map(({ anchor, ...link }) => ({ ...link, Href: `${href(campaignSlug, siteUrl, profile)}#${anchor}` }))
}

export const CALLOUTS = PROFILE?.callouts ?? []

/**
 * Минус-слова на всю кампанию. Прошлый запуск (714501622, сентябрь) собрал
 * 33 клика и ноль заявок, и шли они в основном с автотаргетинга по «эксель
 * скачать»: человек ищет файл, а не систему учёта. Список по категориям —
 * docs/marketing/excel-cpa-negatives.json (там же — что и почему НЕ минусуется).
 */
export function negativesFor(profile = PROFILE) {
  return loadNegatives().filter(word => !profile.allowedNegatives.includes(word))
}

export const CAMPAIGN_NEGATIVES = PROFILE ? negativesFor(PROFILE) : []

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

export function campaignPayload(name, slug, where, shift = 'day', profile = PROFILE) {
  return {
    Name: name,
    StartDate: new Date().toISOString().slice(0, 10),
    NegativeKeywords: { Items: negativesFor(profile) },
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

/**
 * Четыре кампании профиля: поиск и сети × день и ночь. С campaignPerGroup —
 * по четыре на каждую группу фраз: в имени кампании роль из имени группы
 * (до двоеточия), в `_group` — slug группы, в `_index` — номер внутри четвёрки.
 */
export function campaignsFor(profile = PROFILE) {
  const where = { search: 'поиск', network: 'сети' }
  const shift = { day: 'день', night: 'ночь' }
  const four = (title, slug, extra = {}) => Object.keys(where).flatMap(w => Object.keys(shift).map(sh =>
    ({ ...campaignPayload(`${title} ${where[w]} ${shift[sh]}`, `${slug}-${w}-${sh}`, w, sh, profile), ...extra })))
    .map((campaign, _index) => ({ ...campaign, _index }))
  if (!profile.campaignPerGroup) return four(profile.title, profile.slug)
  return groupsFor(profile).flatMap(group =>
    four(`${profile.title} ${group.name.split(':')[0].toLowerCase()}`, `${profile.slug}-${group.slug}`, { _group: group.slug }))
}

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
  console.log(`Лендинг: ${cfg.siteUrl}${PROFILE.path} | счётчик: ${cfg.counterId} | цель: ${cfg.goalId}`)
  console.log(`Цена конверсии: днём ${cfg.cpaRub} ₽, ночью ${cfg.nightCpaRub} ₽ | недельный лимит: ${cfg.weeklyRub} ₽ на кампанию`)

  // Уточнения — общие для аккаунта, заводятся один раз на все объявления.
  const calloutsAdded = await call('adextensions', 'add', {
    AdExtensions: CALLOUTS.map(CalloutText => ({ Callout: { CalloutText } })),
  })
  const calloutIds = apply ? idsOf(calloutsAdded, 'AddResults') : ['<id уточнений>']

  const groups = groupsFor()
  for (const campaign of campaignsFor()) {
    const { _slug: slug, _autotargeting: autotargeting, _group: onlyGroup, _index: campaignIndex, ...payload } = campaign
    if (process.env.CAMPAIGN_ONLY && !slug.includes(process.env.CAMPAIGN_ONLY)) continue
    console.log(`\n=== ${payload.Name} ===`)

    const added = await call('campaigns', 'add', { Campaigns: [payload] })
    const [campaignId] = apply ? idsOf(added, 'AddResults') : [`<id ${slug}>`]
    if (!campaignId) throw new Error('кампания не создана — см. ошибку выше')
    console.log(`кампания: ${campaignId}`)

    // Набор быстрых ссылок свой на кампанию: в ссылках её UTM.
    const setAdded = await call('sitelinks', 'add', { SitelinksSets: [{ Sitelinks: sitelinksFor(slug) }] })
    const [sitelinkSetId] = apply ? idsOf(setAdded, 'AddResults') : [`<id ссылок ${slug}>`]
    if (!sitelinkSetId) throw new Error('быстрые ссылки не созданы — см. ошибку выше')

    for (const group of groups.filter(g => !onlyGroup || g.slug === onlyGroup)) {
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
        Ads: adsFor(slug, cfg.siteUrl, PROFILE, group, campaignIndex).map(ad => ({
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
      : `\nСухой прогон закончен. Повторите с --apply, когда цель ${PROFILE.goalName} проверена на живой странице.`,
  )
}

// Запускаемся только как скрипт: тесты импортируют отсюда чистые функции.
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch(error => {
    console.error('\n' + error.message)
    process.exit(1)
  })
}
