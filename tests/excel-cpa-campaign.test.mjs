import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'

import { AD_LIMITS, adsFor, campaignPayload, configProblems, href } from '../scripts/direct-create-cpa-campaign.mjs'

const read = (p) => readFileSync(new URL(p, import.meta.url), 'utf8')

const landingSource = read('../site-excel/src/Landing.tsx')
const conversionSource = read('../site-excel/src/conversion.ts')
const viteSource = read('../site-excel/vite.config.ts')
const scriptSource = read('../scripts/direct-create-cpa-campaign.mjs')
const keywords = JSON.parse(read('../docs/marketing/excel-cpa-campaign.keywords.json'))

// ── Лендинг: цель спрятана за первым кликом ──────────────────────────────────

test('целевой кнопки нет в разметке, пока не нажата первая', () => {
  // Вся воронка (форма демонстрации и блок с ценой, внутри которого кнопка
  // «Записаться») рендерится только при funnelOpen (issue #596 переименовал
  // priceOpen). Если однажды кнопку вынесут наружу, схема рушится: автомат,
  // жмущий всё подряд, начнёт приносить оплачиваемые конверсии.
  const priceBlock = landingSource.split('{funnelOpen && (')[1]
  assert.ok(priceBlock, 'воронка должна рендериться по условию funnelOpen')
  assert.ok(
    priceBlock.includes('Записаться на разбор'),
    'кнопка «Записаться на разбор» должна быть внутри условного блока',
  )
  assert.equal(
    landingSource.split('Записаться на разбор').length - 1,
    1,
    'кнопка должна быть ровно одна — вторая копия обойдёт защиту',
  )
})

test('целевая цель уходит только через проверку на человека', () => {
  // Прямой reachGoal(GOALS.signup) минует looksHuman() — этого быть не должно.
  assert.ok(
    !landingSource.includes('GOALS.signup'),
    'лендинг не должен слать целевую цель напрямую — только reachSignupGoal()',
  )
  assert.match(landingSource, /reachSignupGoal\(/)
  assert.match(conversionSource, /looksHuman\(\) \? GOALS\.signup : GOALS\.signupBlocked/)
})

test('проверка на человека требует настоящего жеста и времени на странице', () => {
  assert.match(conversionSource, /event\.isTrusted/)
  assert.match(conversionSource, /MIN_DWELL_MS = (\d+)/)
  assert.match(conversionSource, /navigator\.webdriver/)
})

test('без METRIKA_ID счётчик не подключается, без SITE_URL сборка падает', () => {
  // Цель, отправленная в несуществующий счётчик, выглядит в Директе как
  // работающая цель с нулём конверсий — это хуже, чем отсутствие счётчика.
  assert.match(viteSource, /if \(METRIKA_ID === ''\) return '<!-- METRIKA_ID не задан/)
  assert.match(viteSource, /this\.error\('SITE_URL не задан/)
})

// ── Кампания ─────────────────────────────────────────────────────────────────

test('объявления влезают в лимиты Директа', () => {
  for (const ad of adsFor('excel-cpa-search', 'https://example.ru')) {
    for (const [field, limit] of Object.entries(AD_LIMITS)) {
      assert.ok(
        ad[field].length <= limit,
        `${field} длиной ${ad[field].length} > ${limit}: «${ad[field]}»`,
      )
    }
  }
})

test('ссылка объявления ведёт на лендинг и размечена UTM', () => {
  const link = href('excel-cpa-search', 'https://example.ru')
  assert.ok(link.startsWith('https://example.ru/?'))
  assert.match(link, /utm_source=yandex&utm_medium=cpc&utm_campaign=excel-cpa-search/)
  assert.match(link, /utm_content=\{ad_id\}&utm_term=\{keyword\}/)
})

test('стратегия — оплата за конверсии, суммы в микро, вторая площадка выключена', () => {
  process.env.GOAL_ID = process.env.GOAL_ID ?? '0'
  const search = campaignPayload('Excel-CPA поиск', 'excel-cpa-search', 'search').TextCampaign
  assert.equal(search.BiddingStrategy.Search.BiddingStrategyType, 'PAY_FOR_CONVERSION')
  assert.equal(search.BiddingStrategy.Network.BiddingStrategyType, 'SERVING_OFF')
  // 500 ₽ по умолчанию → 500 000 000 микро. Ошибка в множителе стоит в тысячу
  // раз дороже, чем задумано, поэтому проверяется числом.
  assert.equal(search.BiddingStrategy.Search.PayForConversion.Cpa, 500_000_000)

  const network = campaignPayload('Excel-CPA сети', 'excel-cpa-network', 'network').TextCampaign
  assert.equal(network.BiddingStrategy.Network.BiddingStrategyType, 'PAY_FOR_CONVERSION')
  assert.equal(network.BiddingStrategy.Search.BiddingStrategyType, 'SERVING_OFF')
})

test('скрипт по умолчанию ничего не создаёт и останавливает кампании после создания', () => {
  assert.match(scriptSource, /const apply = process\.argv\.includes\('--apply'\)/)
  assert.match(scriptSource, /if \(!apply\) \{/)
  assert.match(scriptSource, /call\('campaigns', 'suspend'/)
})

test('без обязательных настроек скрипт объясняет, чего не хватает', () => {
  const problems = configProblems({ siteUrl: '', counterId: 0, goalId: 0, token: '' }, true)
  assert.equal(problems.length, 4)
  assert.ok(problems.some(p => p.startsWith('SITE_URL')))
  assert.ok(problems.some(p => p.startsWith('DIRECT_TOKEN')))
})

// ── Ключевые фразы ───────────────────────────────────────────────────────────

test('фразы: две группы, без дублей, в пределах лимита Директа', () => {
  // Мусорной группы больше нет: широкий офисный мусор давал охват и ноль
  // конверсий, зашумляя обучение стратегии. Взамен hot и pain расширены
  // до лимита (scripts/excel-cpa-build-keywords.mjs).
  const slugs = keywords.groups.map(g => g.slug)
  assert.deepEqual(slugs, ['hot', 'pain'])

  const seen = new Set()
  for (const group of keywords.groups) {
    assert.ok(group.keywords.length <= 200, `${group.slug}: больше 200 фраз в группе`)
    for (const keyword of group.keywords) {
      assert.ok(!seen.has(keyword), `фраза «${keyword}» повторяется между группами`)
      seen.add(keyword)
    }
  }
})

test('обе группы набраны близко к лимиту — охват тут единственный рычаг', () => {
  // Стратегии «оплата за конверсии» нужно порядка десяти конверсий в неделю,
  // иначе Директ душит показы. Полупустая группа — это не аккуратность, а
  // риск, что кампания встанет от голода.
  for (const group of keywords.groups) {
    assert.ok(
      group.keywords.length >= 150,
      `${group.slug}: всего ${group.keywords.length} фраз — мало для оплаты за конверсии`,
    )
  }
})

test('минус-слова режут только соискателей и учащихся', () => {
  // При оплате за конверсии лишний клик стоит ноль, поэтому минус-слова здесь
  // не про экономию бюджета: они убирают тех, кто не станет клиентом никогда.
  const bySlug = Object.fromEntries(keywords.groups.map(g => [g.slug, g]))
  for (const slug of ['hot', 'pain']) {
    assert.ok(bySlug[slug].minusWords.includes('вакансии'), `${slug}: нет минус-слова «вакансии»`)
    assert.ok(bySlug[slug].minusWords.includes('курсы'), `${slug}: нет минус-слова «курсы»`)
  }
})

test('в ядре не осталось офисного мусора', () => {
  // Дословные фразы выброшенной группы: если они вернутся, значит кто-то
  // откатил решение, не заметив этого теста.
  const junk = ['калькулятор отпускных', 'mind map', 'производственный календарь 2026',
    'электронный бюджет', 'приказ образец', 'должностная инструкция образец']
  const all = keywords.groups.flatMap(g => g.keywords)
  for (const phrase of junk) {
    assert.ok(!all.includes(phrase), `мусорная фраза «${phrase}» вернулась в ядро`)
  }
})
