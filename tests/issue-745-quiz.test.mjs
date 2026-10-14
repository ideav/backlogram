// issue #745 — квиз «оценка проекта за 2 минуты» (/quiz.html), перенесён с
// заготовки ideav.ru/victor/. По задаче: hero — «Приложение для вашего бизнеса
// в 4 раза дешевле и быстрее заказной разработки», шапка/футер — общие по
// сайту (layout), тексты без пафоса, финал ведёт к живому разговору.
//
// Классификатор и клиенты без JS смотрят сырой HTML, поэтому проверяем именно
// пререндер (scripts/prerender-quiz.mjs) — и заодно то, что страница, снапшот
// и тесты читают одни и те же данные (src/data/quizCalc.mjs), а заявка уходит
// тем же механизмом, что форма на главной.
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { cpSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { resolve } from 'node:path'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import {
  AUDIENCE,
  PROBLEMS,
  QUIZ_META,
  SYSTEM_TYPES,
  USER_COUNTS,
  FEATURES,
  analyzeEstimate,
} from '../src/data/quizCalc.mjs'

// fileURLToPath, а не url.pathname: pathname на Windows даёт «/C:/…» и ломает resolve.
const repo = fileURLToPath(new URL('..', import.meta.url))
const read = (p) => readFileSync(resolve(repo, p), 'utf8')

/** Прогоняет пререндер квиза в песочнице и отдаёт получившийся dist/quiz.html. */
function prerender() {
  const work = mkdtempSync(resolve(tmpdir(), 'issue-745-'))
  mkdirSync(resolve(work, 'dist'), { recursive: true })
  mkdirSync(resolve(work, 'scripts'), { recursive: true })
  cpSync(resolve(repo, 'scripts/prerender-quiz.mjs'), resolve(work, 'scripts/prerender-quiz.mjs'))
  cpSync(resolve(repo, 'src/data'), resolve(work, 'src/data'), { recursive: true })
  writeFileSync(resolve(work, 'dist/index.html'), read('index.html'))
  execFileSync('node', ['scripts/prerender-quiz.mjs'], { cwd: work })
  return readFileSync(resolve(work, 'dist/quiz.html'), 'utf8')
}

const out = prerender()
const page = read('src/pages/Quiz.tsx')
const prerenderScript = read('scripts/prerender-quiz.mjs')
const router = read('src/router.tsx')
const htaccess = read('public/.htaccess')
const sitemap = read('public/sitemap.xml')
const llms = read('public/llms.txt')
const pkg = read('package.json')

// ── 1. Hero — призыв из задачи, дословно ─────────────────────────────────
test('hero несёт призыв из задачи «в 4 раза дешевле и быстрее»', () => {
  // «4 раза» — неразрывными пробелами (issue #757): H1 рендерится React без
  // apply-typography, обычный пробел оставляет «4» оторванным от «раза».
  assert.ok(QUIZ_META.h1.includes('в\u00A04\u00A0раза'), 'нет nbsp между «4» и «раза» в h1')
  assert.match(
    QUIZ_META.h1,
    /Приложение для вашего бизнеса в[\u00A0 ]4[\u00A0 ]раза дешевле и быстрее заказной разработки/,
  )
  assert.ok(out.includes(QUIZ_META.h1), 'h1 из quizCalc отсутствует в пререндере')
  assert.match(out, /<h1>[^<]*в[\u00A0 ]4[\u00A0 ]раза дешевле и быстрее заказной разработки<\/h1>/)
})

// ── 2. Логика оценки: пороги и вилки из заготовки ────────────────────────
test('analyzeEstimate: минимум — Базовый, обвеска с крупной командой — Расширенный', () => {
  const base = analyzeEstimate({ systemType: SYSTEM_TYPES[0].value, userCount: '1', features: [] })
  assert.equal(base.category, 'Базовый')
  assert.match(base.cost, /75 000/)

  // Между ними: CRM + личные кабинеты — уже Стандарт (порог 5 сущностей/2 форм).
  const mid = analyzeEstimate({ systemType: 'Учет клиентов (CRM)', userCount: '1', features: ['Личные кабинеты для входа (логин/пароль)'] })
  assert.equal(mid.category, 'Стандарт')

  const heavy = analyzeEstimate({
    systemType: SYSTEM_TYPES[0].value,
    userCount: USER_COUNTS[3].value,
    features: FEATURES.map((f) => f.value),
  })
  assert.equal(heavy.category, 'Расширенный')
  assert.ok(heavy.features.length <= 5, 'список функций в результате не раздувается')
})

test('каждый вариант вопросов несёт ключевое слово, по которому считает оценка', () => {
  // analyzeEstimate матчится по подстрокам value; если варианты переименуют,
  // оценка молча скатится в ветку «Другое» — ловим это по составу функций.
  const expectedFirst = {
    'Учет клиентов (CRM)': 'База клиентов и контактов',
    'Склад, заказы, поставщики': 'Учёт товаров и остатков',
    'Проекты и задачи': 'Проекты и задачи',
    'Портал для сотрудников': 'Портал для сотрудников',
    'Другое — расскажу при созвоне': 'Система под ваши процессы',
  }
  for (const t of SYSTEM_TYPES) {
    const est = analyzeEstimate({ systemType: t.value })
    assert.equal(
      est.features[0],
      expectedFirst[t.value],
      `вариант «${t.label}» ушёл не в свою ветку оценки`,
    )
  }
  assert.ok(USER_COUNTS.every((u) => ['1', '2-10', '11-50', '50+'].includes(u.value)))
  const keywords = ['кабинет', 'Таблицы', 'загружать', 'Дашборд', 'Интеграция', 'уведомления']
  for (const kw of keywords) assert.ok(FEATURES.some((f) => f.value.includes(kw)), `нет варианта с ключом «${kw}»`)
})

// ── 3. Статический снапшот: SEO-обвязка и честное содержание ─────────────
test('снапшот: title/description/canonical/JSON-LD и мета из quizCalc', () => {
  assert.ok(out.includes(`<title>${QUIZ_META.title}</title>`))
  assert.ok(out.includes(`content="${QUIZ_META.description}"`))
  assert.ok(out.includes(`<link rel="canonical" href="https://ideav.ru/quiz.html" />`))
  const jsonLd = JSON.parse(
    out.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1].replace(/\\u003c/g, '<'),
  )
  const webpage = jsonLd['@graph'].find((n) => n['@type'] === 'WebPage')
  assert.equal(webpage.url, 'https://ideav.ru/quiz.html')
  const breadcrumb = jsonLd['@graph'].find((n) => n['@type'] === 'BreadcrumbList')
  assert.equal(breadcrumb.itemListElement.length, 2)
})

test('снапшот отражает разделы страницы: боли, шаги, аудитория', () => {
  for (const p of PROBLEMS) assert.ok(out.includes(p.h) && out.includes(p.p), `нет боли «${p.h}»`)
  for (const a of AUDIENCE) assert.ok(out.includes(a), `нет аудитории «${a}»`)
  assert.ok(out.includes('От идеи до работающей системы'))
})

test('без наследства заготовки victor: фейковые контакты и ссылки на integram.io не уехали', () => {
  for (const [name, source] of [['страница', page], ['снапшот', out], ['данные', read('src/data/quizCalc.mjs')]]) {
    assert.ok(!/8 800 000|ИНН 0000|ОГРН 0000/.test(source), `${name}: фейковые реквизиты заготовки на месте`)
    assert.ok(!source.includes('integram.io'), `${name}: ссылка на integram.io вместо ideav.ru`)
    assert.ok(!source.includes('acct.html') && !source.includes('terms.html'), `${name}: локальные страницы заготовки на месте`)
  }
})

// ── 4. Заявка — тем же механизмом, что форма на главной ──────────────────
test('заявка уходит на telegram-notify.php с source=quiz и целью lead', () => {
  assert.ok(page.includes("fetch('/telegram-notify.php'"), 'эндпоинт не telegram-notify.php')
  assert.ok(page.includes("data.set('source', 'quiz')"))
  assert.match(page, /reachGoal\('lead', \{ source: 'quiz' \}\)/)
  const php = read('public/telegram-notify.php')
  assert.match(php, /'quiz'\s+=>\s+'Квиз: оценка проекта за 2 минуты'/)
})

test('согласие на обработку ПДн со ссылкой на политику, как на всём сайте', () => {
  assert.ok(page.includes('обработку персональных данных'))
  assert.match(page, /href="\/privacy\.html"/)
})

test('капча: анониму нужен токен, вошедшим в Интеграм (idb_*) — нет', () => {
  assert.ok(page.includes('VITE_SMARTCAPTCHA_CLIENT_KEY'))
  assert.match(page, /if \(CAPTCHA_CLIENT_KEY && !idbCookieFound && !captchaToken\)/)
  assert.ok(page.includes('captcha_token'))
})

// ── 5. Маршрут, сборка, редирект, sitemap, llms.txt ──────────────────────
test('роутер знает quiz.html и /quiz, страница ленивая', () => {
  assert.match(router, /const Quiz = lazy\(\(\) => import\('\.\/pages\/Quiz'\)\)/)
  assert.ok(router.includes("path: 'quiz.html'"))
  assert.ok(router.includes("path: 'quiz'"))
})

test('сборка: пререндер в цепочке до prerender-landing', () => {
  const build = pkg.match(/"build": "([^"]+)"/)[1]
  const quizAt = build.indexOf('node scripts/prerender-quiz.mjs')
  const landingAt = build.indexOf('node scripts/prerender-landing.mjs')
  const kbAt = build.indexOf('node scripts/prerender-knowledge-base.mjs')
  assert.ok(quizAt > 0, 'prerender-quiz.mjs не в цепочке build')
  assert.ok(quizAt < landingAt, 'prerender-quiz должен идти до prerender-landing (шаблон index.html)')
  assert.ok(quizAt > kbAt, 'prerender-quiz должен идти после prerender-knowledge-base (чистый шаблон)')
})

test('безрасширенный /quiz — 301 на /quiz.html, мимо front controller', () => {
  assert.match(htaccess, /RewriteRule \^quiz\/\?\$ \/quiz\.html \[R=301,L\]/)
})

test('quiz.html в sitemap и llms.txt — не сирота', () => {
  assert.ok(sitemap.includes('<loc>https://ideav.ru/quiz.html</loc>'))
  assert.ok(llms.includes('https://ideav.ru/quiz.html'))
})

test('страница и снапшот читают общий источник данных', () => {
  assert.match(page, /from '\.\.\/data\/quizCalc'/)
  assert.match(prerenderScript, /from '\.\.\/src\/data\/quizCalc\.mjs'/)
})
