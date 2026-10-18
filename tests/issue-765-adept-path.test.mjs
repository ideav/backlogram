// issue #765 — «Путь адепта Интеграм» (/put-adepta.html): раздел для тех, кто
// хочет присоединиться к сообществу и зарабатывать. По задаче: два реальных
// проекта с бюджетами и часами (имена заменены — ПакЛайн и СПЗ), пять шагов
// (изучить проекты → собрать приложение → зарегистрироваться разработчиком и
// пройти собеседование → найти заказчика → стать партнёром) и заявка с сайта:
// имя, Telegram, опыт работы, согласие на обработку ПДн.
//
// Классификатор и клиенты без JS смотрят сырой HTML, поэтому проверяем и
// пререндер (scripts/prerender-put-adepta.mjs).
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { resolve } from 'node:path'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import {
  ADEPT_META,
  CASES,
  HERO_CHIPS,
  HOURLY_RATE,
  LINK_TARGET,
  LINKS,
  RATE_NOTE,
  REGISTER_URL,
  SELF_CHECK,
  STEPS,
} from '../src/data/adeptPath.mjs'

const repo = fileURLToPath(new URL('..', import.meta.url))
const read = (p) => readFileSync(resolve(repo, p), 'utf8')

/** Прогоняет пререндер в песочнице и отдаёт получившийся dist/put-adepta.html. */
function prerender() {
  const work = mkdtempSync(resolve(tmpdir(), 'issue-765-'))
  mkdirSync(resolve(work, 'dist'), { recursive: true })
  mkdirSync(resolve(work, 'scripts'), { recursive: true })
  cpSync(resolve(repo, 'scripts/prerender-put-adepta.mjs'), resolve(work, 'scripts/prerender-put-adepta.mjs'))
  cpSync(resolve(repo, 'src/data'), resolve(work, 'src/data'), { recursive: true })
  writeFileSync(resolve(work, 'dist/index.html'), read('index.html'))
  execFileSync('node', ['scripts/prerender-put-adepta.mjs'], { cwd: work })
  return readFileSync(resolve(work, 'dist/put-adepta.html'), 'utf8')
}

const out = prerender()
const page = read('src/pages/AdeptPath.tsx')
const data = read('src/data/adeptPath.mjs')
const prerenderScript = read('scripts/prerender-put-adepta.mjs')

const byKey = Object.fromEntries(CASES.map((c) => [c.key, c]))

// ── 1. Два проекта — цифры из задачи ─────────────────────────────────────
test('ПакЛайн: 37 500 ₽ двумя счетами по 18 750 ₽, около 8 часов, пришёл с Хабра', () => {
  const c = byKey.pakline
  assert.equal(c.name, 'ПакЛайн')
  assert.equal(c.budget, 37500)
  assert.equal(c.hoursSpent, 8)
  assert.deepEqual(c.phases.map((p) => p.budget), [18750, 18750])
  assert.equal(c.hoursBilled * HOURLY_RATE, c.budget, 'ставка не сходится с бюджетом')
  assert.match(c.origin, /Хабр/)
  // путь из задачи: excel-to-app → мало данных → Telegram → ТЗ по промпту → бот → ИИ-чат
  const t = c.timeline.map((s) => s.t).join(' ')
  for (const re of [/excel-to-app/, /мало/, /Telegram/, /ТЗ/, /бот/, /ИИ-чат/, /около 3/]) {
    assert.match(t, re, `в пути ПакЛайна нет ${re}`)
  }
})

test('СПЗ: 206 250 ₽, три фазы 25+25+8 часов, по рекомендации, Битрикс24 и Google-таблицы', () => {
  const c = byKey.spz
  assert.equal(c.name, 'СПЗ')
  assert.equal(c.budget, 206250)
  assert.equal(c.hoursSpent, 25 + 25 + 8)
  assert.equal(c.phases.length, 3)
  assert.match(c.origin, /рекомендации/)
  const t = c.timeline.map((s) => s.t).join(' ')
  for (const re of [/Битрикс24/, /Google-таблиц/, /вручную/, /задачами и вакансиями/, /двойной ввод/]) {
    assert.match(t, re, `в пути СПЗ нет ${re}`)
  }
})

test('в тексте — только псевдонимы ПакЛайн и СПЗ', () => {
  for (const [name, source] of [['данные', data], ['страница', page], ['снапшот', out]]) {
    assert.ok(!/петфуд|ламистр|спортзани/i.test(source), `${name}: настоящее имя заказчика`)
  }
})

// Владелец (#765, после первой выкладки): «скрины переписки… дают ощущение
// реальности. И ссылки куда убрал?» — история должна быть проверяемой.
test('ссылки-доказательства из задачи на месте и попали в снапшот', () => {
  const expected = {
    excelToApp: 'https://excel-to-app.ru/',
    tzPrompt: 'https://github.com/ideav/crm/issues/4703',
    tz: 'https://github.com/ideav/crm/blob/main/docs/petfood_checklist_tz.md',
    paklineApp: 'https://ideav.ru/db13417569248up/',
    spzApp: 'https://ideav.ru/spz/',
  }
  for (const [k, href] of Object.entries(expected)) assert.equal(LINKS[k], href, `ссылка ${k}`)
  for (const href of Object.values(LINKS)) assert.ok(out.includes(`href="${href}"`), `снапшот без ${href}`)
  const pak = byKey.pakline.timeline.flatMap((s) => (s.links || []).map((l) => l.href))
  for (const href of [LINKS.paklineExcel, LINKS.tzPrompt, LINKS.tz, LINKS.botResult, LINKS.paklineApp]) {
    assert.ok(pak.includes(href), `в пути ПакЛайна нет ${href}`)
  }
  assert.equal(byKey.spz.app.href, LINKS.spzApp)
})

test('все ссылки страницы открываются в одной общей вкладке «put»', () => {
  assert.equal(LINK_TARGET, 'put')
  const anchors = out.match(/<a [^>]*href="[^"#][^"]*"[^>]*>/g) || []
  const inArticle = out.slice(out.indexOf('<article id="ap-prerender">'), out.indexOf('</article>'))
  const own = inArticle.match(/<a [^>]*>/g) || []
  assert.ok(own.length >= 10, 'мало ссылок в снапшоте')
  for (const tag of own) assert.match(tag, /target="put"/, `ссылка не в окне put: ${tag}`)
  assert.ok(anchors.length >= own.length)
  assert.ok(!/target="_blank"/.test(page), 'на странице осталась ссылка в новое окно')
  // rel="noopener"/"noreferrer" заставили бы браузер открывать каждую ссылку в новой вкладке
  assert.ok(!/rel="noopener|rel="noreferrer/.test(page))
  assert.equal((page.match(/target=\{LINK_TARGET\}/g) || []).length, 4, 'ссылки шагов пути, кнопка приложения, кнопка шага, политика ПДн')
})

test('скриншоты переписки в шагах ПакЛайна: Telegram с заказчиком и бот сборки', () => {
  const shots = byKey.pakline.timeline.filter((s) => s.shot).map((s) => s.shot.src)
  assert.deepEqual(shots, ['/adept/pakline-telegram.webp', '/adept/pakline-bot.webp'])
})

test('проекты — две вкладки, а не одна простыня', () => {
  assert.ok(page.includes('role="tablist"'))
  assert.ok(page.includes('role="tab"'))
  assert.ok(page.includes('role="tabpanel"'))
  assert.match(page, /hidden=\{activeCase !== c\.key\}/)
  assert.match(page, /aria-selected=\{activeCase === c\.key\}/)
})

test('скриншоты проектов лежат в public/adept и описаны alt-текстом', () => {
  for (const c of CASES) {
    for (const img of [...c.images, ...c.timeline.filter((s) => s.shot).map((s) => s.shot)]) {
      assert.ok(existsSync(resolve(repo, 'public', img.src.slice(1))), `нет файла ${img.src}`)
      assert.ok(img.alt.length > 20, `пустой alt у ${img.src}`)
      assert.ok(out.includes(img.src), `снапшот без ${img.src}`)
    }
  }
})

// ── 2. Пять шагов из задачи ──────────────────────────────────────────────
test('пять шагов по порядку задачи', () => {
  assert.equal(STEPS.length, 5)
  const expect = [/проект/, /приложение/, /разработчиком/, /заказчика/, /партнёром/]
  STEPS.forEach((s, i) => assert.match(s.h, expect[i], `шаг ${i + 1}: «${s.h}»`))
  assert.match(STEPS[2].p, /собеседование/)
  assert.match(STEPS[3].p, /у команды Интеграма/)
  assert.match(STEPS[4].p, /ссылк/)
  assert.equal(STEPS[1].cta.href, '/excel-to-app.html')
  for (const s of STEPS) assert.ok(out.includes(s.h), `снапшот без шага «${s.h}»`)
})

test('партнёрская ссылка — в личном кабинете после регистрации, а не через заявку', () => {
  // ЛК (crm templates/my/info.html) сам выдаёт ссылку ?aff=<user_id> на карточке «Рефералы».
  assert.match(STEPS[4].p, /личном кабинете/)
  assert.match(STEPS[4].p, /Рефералы/)
  // проценты — по владельцу (#766): 15% со всех оплат, 40% с лицензии только после аттестации партнёра
  assert.match(STEPS[4].p, /15% со всех оплат/)
  assert.match(STEPS[4].p, /после аттестации партнёра — 40% от оплаты лицензии/)
  assert.equal(STEPS[4].cta.href, REGISTER_URL)
  assert.equal(REGISTER_URL, 'https://ideav.ru/start.html#reg')
  assert.ok(out.includes(REGISTER_URL), 'снапшот без ссылки на регистрацию')
  assert.ok(!page.includes('adept-partner'), 'партнёрская заявка осталась в форме')
})

test('ставка команды — не ставка адепта: в hero её нет, свою адепт назначает сам', () => {
  assert.ok(!HERO_CHIPS.some((c) => /3[\s ]?750/.test(c)), 'ставка команды в hero')
  assert.match(RATE_NOTE, /назначает сам/)
  assert.ok(out.includes(RATE_NOTE))
  assert.equal(HOURLY_RATE, 3750)
})

test('самопроверка к первому шагу есть и попала в снапшот', () => {
  assert.ok(SELF_CHECK.length >= 3)
  for (const s of SELF_CHECK) assert.ok(out.includes(s))
  // формулировки владельца (#765): адепт не вычитывает ТЗ сам, а делегирует агенту
  assert.ok(SELF_CHECK.some((s) => /однозначную инструкцию/.test(s)))
  assert.ok(SELF_CHECK.some((s) => /делегировать максимум задач агентам/.test(s)))
  assert.ok(!SELF_CHECK.some((s) => /600 строк|давайте разберёмся/.test(s)))
})

// ── 3. Заявка: имя, Telegram, опыт, согласие ─────────────────────────────
test('форма: имя, Telegram, опыт работы и согласие на ПДн', () => {
  assert.ok(page.includes('id="adept-name"'))
  assert.ok(page.includes('id="adept-telegram"'))
  assert.ok(page.includes('id="adept-experience"'))
  assert.ok(page.includes('обработку персональных данных'))
  assert.match(page, /href="\/privacy\.html"/)
  assert.match(page, /disabled=\{stage === 'sending' \|\| !consentChecked\}/)
})

test('заявка в разработчики уходит на telegram-notify.php с source=adept', () => {
  assert.ok(page.includes("fetch('/telegram-notify.php'"))
  assert.ok(page.includes("data.set('source', 'adept')"))
  const php = read('public/telegram-notify.php')
  assert.match(php, /'adept'\s+=>\s+'Путь адепта: заявка в разработчики'/)
  assert.match(page, /if \(CAPTCHA_CLIENT_KEY && !idbCookieFound && !captchaToken\)/)
})

test('контакт без JS — @qdmadept, а не бот сборки приложений', () => {
  assert.ok(out.includes('https://t.me/qdmadept'))
  assert.ok(!/Integrammbot/.test(out + page))
})

// ── 4. Обвязка страницы ──────────────────────────────────────────────────
test('снапшот: title, description, canonical, JSON-LD', () => {
  assert.ok(out.includes(`<title>${ADEPT_META.title}</title>`))
  assert.ok(out.includes(`<link rel="canonical" href="https://ideav.ru/put-adepta.html" />`))
  const jsonLd = JSON.parse(
    out.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1].replace(/\\u003c/g, '<'),
  )
  assert.equal(jsonLd['@graph'].find((n) => n['@type'] === 'WebPage').url, 'https://ideav.ru/put-adepta.html')
})

test('маршрут, сборка, редирект, sitemap, llms.txt и меню', () => {
  const router = read('src/router.tsx')
  assert.match(router, /const AdeptPath = lazy\(\(\) => import\('\.\/pages\/AdeptPath'\)\)/)
  assert.ok(router.includes("path: 'put-adepta.html'"))
  const build = read('package.json').match(/"build": "([^"]+)"/)[1]
  const at = build.indexOf('node scripts/prerender-put-adepta.mjs')
  assert.ok(at > build.indexOf('node scripts/prerender-knowledge-base.mjs'))
  assert.ok(at < build.indexOf('node scripts/prerender-landing.mjs'))
  assert.match(read('public/.htaccess'), /RewriteRule \^put-adepta\/\?\$ \/put-adepta\.html \[R=301,L\]/)
  assert.ok(read('public/sitemap.xml').includes('<loc>https://ideav.ru/put-adepta.html</loc>'))
  assert.ok(read('public/llms.txt').includes('https://ideav.ru/put-adepta.html'))
  assert.match(read('src/data/nav.mjs'), /href: '\/put-adepta\.html'/)
})

test('страница и снапшот читают общий источник данных', () => {
  assert.match(page, /from '\.\.\/data\/adeptPath'/)
  assert.match(prerenderScript, /from '\.\.\/src\/data\/adeptPath\.mjs'/)
})
