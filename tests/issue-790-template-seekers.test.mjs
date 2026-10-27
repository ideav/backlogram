// Страницы «нужна табличка» и кампания «Шаблоны» (issue #790): файл без
// формы, онлайн-версия в один клик, копия за контакт. План —
// docs/marketing/template-seekers-plan.md, кампания — его раздел 5.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, statSync } from 'node:fs'

import {
  AD_LIMITS, AD_TITLES_TOTAL, ADS_PER_GROUP, CALLOUT_LIMIT, PROFILES, SITELINK_LIMITS,
  adsFor, campaignsFor, groupsFor, href, negativesFor, scheduleFor, sitelinksFor,
} from '../scripts/direct-create-cpa-campaign.mjs'
import { loadLandings } from '../site-excel/landings.mjs'
import { loadTplPages, validateTplPages } from '../site-excel/tpl-pages.mjs'

const read = p => readFileSync(new URL(p, import.meta.url), 'utf8')

const P = PROFILES.tpl
const groups = groupsFor(P)
const campaigns = campaignsFor(P)
const tplPages = loadTplPages()
const existing = [
  // Главная — тоже существующая страница домена: «/» легальна в related.
  { path: '/', title: 'Excel остаётся Excel’ем — сделаем из него приложение', description: 'Демонстрация бесплатно, за 45 минут.' },
  ...loadLandings().map(l => ({ path: `/${l.slug}/`, title: l.title, description: l.description })),
]

// ── Страницы: отдать таблицу сразу, контакт — за копию ──────────────────────

test('три страницы «нужна табличка» проходят проверку данных', () => {
  assert.equal(tplPages.length, 3)
  const errors = validateTplPages(tplPages, existing, tplPages.map(p => `/${p.slug}/`))
  assert.deepEqual(errors, [])
})

test('каждой странице соответствует файл шаблона, и он не пустой', () => {
  for (const page of tplPages) {
    const file = new URL(`../site-excel/public${page.xlsx}`, import.meta.url)
    assert.ok(statSync(file).size > 8000, `${page.xlsx}: файл меньше 8 КБ — заглушка?`)
  }
})

test('у каждой страницы своя демо-база на ideav.ru', () => {
  const demos = new Set(tplPages.map(p => p.demo))
  assert.equal(demos.size, 3)
})

// ── Кампания: клики, поиск, будни днём ──────────────────────────────────────

test('профиль tpl: максимум кликов, только поиск и день', () => {
  assert.equal(P.strategy, 'clicks')
  assert.deepEqual(P.places, ['search'])
  assert.deepEqual(P.shifts, ['day'])
  assert.deepEqual(P.days, [1, 2, 3, 4, 5])
  assert.deepEqual(P.dayHours, { from: 8, to: 20 })
  assert.equal(P.weeklyRub, 1000)
  assert.equal(P.clickCeilingRub.search, 15)
})

test('расписание: будни, 8:00–20:00 по московскому времени', () => {
  const rows = scheduleFor('day', P)
  assert.equal(rows.length, 5, 'будни — пять строк расписания')
  const hours = rows[0].split(',').slice(1).map(Number)
  hours.forEach((v, h) => assert.equal(v, h >= 8 && h < 20 ? 100 : 0, `час ${h}: ожидалась ${h >= 8 && h < 20 ? 100 : 0}`))
})

test('по кампании на группу, каждая — поиск-день с потолком 15 ₽ и лимитом 1000 ₽', () => {
  assert.equal(campaigns.length, groups.length)
  for (const c of campaigns) {
    const search = c.TextCampaign.BiddingStrategy.Search
    assert.equal(search.BiddingStrategyType, 'WB_MAXIMUM_CLICKS')
    assert.equal(search.WbMaximumClicks.BidCeiling, 15_000_000)
    assert.equal(search.WbMaximumClicks.WeeklySpendLimit, 1_000_000_000)
    assert.equal(c.TextCampaign.BiddingStrategy.Network.BiddingStrategyType, 'SERVING_OFF')
    assert.ok(!('PriorityGoals' in c.TextCampaign), 'у кликов нет целевой конверсии')
  }
})

test('минус-слова — свой список из плана, общий excel-cpa не применяется', () => {
  const negatives = negativesFor(P)
  assert.ok(negatives.includes('семейный') && negatives.includes('1с') && negatives.includes('калькулятор отпускных'))
  assert.ok(!negatives.includes('шаблон') && !negatives.includes('скачать'), 'слова аудитории минусовать нельзя')
})

test('у каждой группы своя посадочная и своя метка utm_campaign', () => {
  const paths = new Set(tplPages.map(p => `/${p.slug}/`))
  for (const group of groups) {
    assert.ok(paths.has(group.path), `${group.path}: нет такой страницы среди tpl/*.json`)
    assert.equal(group.utm, `tpl-${group.slug}`)
    const link = href('tpl', 'https://excel-to-app.ru', P, group)
    assert.ok(link.startsWith(`https://excel-to-app.ru${group.path}?`), link)
    assert.ok(link.includes(`utm_campaign=tpl-${group.slug}`), link)
    const ad = adsFor('tpl', 'https://excel-to-app.ru', P, group)[0]
    assert.equal(ad.Href, link, 'объявление ведёт на ту же ссылку, что и href группы')
    const sitelink = sitelinksFor('tpl', 'https://excel-to-app.ru', P, group)[0]
    assert.ok(sitelink.Href.startsWith(`https://excel-to-app.ru${group.path}?`), sitelink.Href)
  }
})

test('объявления в пределах Директа и не повторяют чужие числа', () => {
  const adsByGroup = JSON.parse(read('../docs/marketing/template-seekers.ads.json')).groups
  for (const [slug, ads] of Object.entries(adsByGroup)) {
    assert.ok(ads.length > 0 && ads.length <= ADS_PER_GROUP, `${slug}: до ${ADS_PER_GROUP} объявлений`)
    for (const ad of ads) {
      assert.ok(ad.Title.length <= AD_LIMITS.Title, `${slug}: Title длиннее ${AD_LIMITS.Title}`)
      assert.ok(ad.Title2.length <= AD_LIMITS.Title2, `${slug}: Title2 длиннее ${AD_LIMITS.Title2}`)
      assert.ok(ad.Text.length <= AD_LIMITS.Text, `${slug}: Text длиннее ${AD_LIMITS.Text}`)
      assert.ok(ad.Title.length + ad.Title2.length <= AD_TITLES_TOTAL, `${slug}: Title+Title2 длиннее ${AD_TITLES_TOTAL}`)
      assert.ok(/бесплат/i.test(ad.Text) || /бесплат/i.test(ad.Title2), `${slug}: оффер «бесплатно» потерялся`)
    }
  }
})

test('минус-слово не встречается в собственных фразах', () => {
  const negatives = negativesFor(P)
  for (const group of groups) {
    for (const word of [...negatives, ...group.minusWords]) {
      for (const keyword of group.keywords) {
        assert.ok(!keyword.includes(word), `«${word}» встречается во фразе «${keyword}»`)
      }
    }
  }
})

test('уточнения короче лимита Директа', () => {
  for (const callout of P.callouts) assert.ok(callout.length <= CALLOUT_LIMIT, callout)
  for (const link of P.sitelinks) {
    assert.ok(link.Title.length <= SITELINK_LIMITS.Title, link.Title)
    assert.ok(link.Description.length <= SITELINK_LIMITS.Description, link.Description)
    assert.ok(link.Title.length + link.Description.length <= SITELINK_LIMITS.TitlesTotal, link.Title)
  }
})

// ── Приёмник заявок и страница: kind=copy ───────────────────────────────────

test('order.php принимает kind=copy с шаблоном и ролью', () => {
  const order = read('../site-excel/public/order.php')
  assert.ok(order.includes(`['demo', 'express', 'copy']`), 'kind=copy в белом списке')
  assert.ok(order.includes("$data['tpl']"), 'шаблон разбирается из заявки')
  assert.ok(order.includes("$data['who']"), 'роль разбирается из заявки')
  assert.ok(order.includes("'copy'    => 'Заявка на копию шаблона"), 'свой subject уведомления')
  // Заявке на копию файл и описание не нужны — копируют по шаблону.
  assert.ok(!order.includes("$kind !== 'razbor' && $task === ''"), 'условие материалов переписано на список видов')
  // Double opt-in остаётся только у demo: копию подтверждают звонком, не письмом.
  const intake = read('../site-excel/public/order-intake.php')
  assert.ok(intake.includes("$kind === 'demo'"), 'подтверждение письма по-прежнему только у demo')
})

test('страница: две кнопки, форма копии, согласие со ссылкой на политику', () => {
  const tplSource = read('../site-excel/src/pages/TplPage.tsx')
  assert.ok(tplSource.includes('data-tpl-download'), 'кнопка скачивания с целью tpl_download')
  assert.ok(tplSource.includes('data-tpl-demo'), 'кнопка онлайн-версии с целью tpl_demo_open')
  assert.ok(tplSource.includes('data-tpl-form'), 'форма kind=copy на странице')
  assert.ok(tplSource.includes("name=\"kind\" value=\"copy\""), 'заявка уходит с kind=copy')
  assert.ok(tplSource.includes('PRIVACY_URL'), 'согласие со ссылкой на политику, как на главной')
  assert.ok(tplSource.includes('name="website"'), 'honeypot как у главной формы')
})

test('скрипт пререндера ставит цели воронки из плана', () => {
  const prerender = read('../scripts/prerender-site-excel.mjs')
  for (const goal of ['tpl_view', 'tpl_download', 'tpl_demo_open', 'lead', 'landing_cta']) {
    assert.ok(prerender.includes(`'${goal}'`), `цель ${goal} не найдена в tplScript`)
  }
  assert.ok(prerender.includes('assertTplPages'), 'данные tpl-страниц проверяются до отрисовки')
  const vite = read('../site-excel/vite.config.ts')
  assert.ok(vite.includes('loadTplPages'), 'tpl-страницы попадают в sitemap')
})
