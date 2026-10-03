#!/usr/bin/env node
/**
 * Проверка SEO-аудита по ideav.ru командой, а не на глаз (issue #627).
 *
 * Аудит от 02.10.2026 (вложение в issue #627) задаёт по каждому пункту
 * «критерий приёмки, который проверяется командой». Скрипт выполняет эти
 * критерии: тянет сырой HTML (то, что видит краулер без JS) и считает по нему
 * то же, что считал аудит. Отрендеренный DOM скрипт не трогает — для него
 * нужен Chromium; метод аудита «сырой отдельно от рендера» сохранён.
 *
 * Запуск:
 *   node scripts/audit-seo-live.mjs                 # весь набор по https://ideav.ru
 *   node scripts/audit-seo-live.mjs --base http://localhost:4173
 *   node scripts/audit-seo-live.mjs --dist          # по локальной сборке dist/
 *   node scripts/audit-seo-live.mjs --only nav,focus
 *   node scripts/audit-seo-live.mjs --json
 *
 * Сеть идёт через curl, а не fetch: в рабочей сети fake-ip прокси node-fetch
 * не доходит, curl доходит (та же грабля, что в scripts/direct-*.mjs).
 */
import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')

const argv = process.argv.slice(2)
function flag(name, fallback = null) {
  const i = argv.indexOf(`--${name}`)
  return i === -1 ? fallback : argv[i + 1]
}
const BASE = (flag('base') ?? 'https://ideav.ru').replace(/\/$/, '')
const FROM_DIST = argv.includes('--dist')
const AS_JSON = argv.includes('--json')
const ONLY = (flag('only') ?? '').split(',').filter(Boolean)

// ───────────────────────────────────────────────────────────── загрузка страниц
const cache = new Map()

function distPath(pathname) {
  const clean = pathname.replace(/^\//, '').split('?')[0]
  if (clean === '') return join(root, 'dist', 'index.html')
  if (clean.endsWith('/')) return join(root, 'dist', clean, 'index.html')
  return join(root, 'dist', clean)
}

function get(pathname) {
  if (cache.has(pathname)) return cache.get(pathname)
  let body = ''
  if (FROM_DIST) {
    const file = distPath(pathname)
    body = existsSync(file) ? readFileSync(file, 'utf8') : ''
  } else {
    try {
      body = execFileSync('curl', ['-sL', '--max-time', '30', `${BASE}${pathname}`], {
        encoding: 'utf8',
        maxBuffer: 64 * 1024 * 1024,
      })
    } catch {
      body = ''
    }
  }
  cache.set(pathname, body)
  return body
}

// ────────────────────────────────────────────────────────────────── измерители
const count = (html, re) => (html.match(re) ?? []).length

/** Слова в видимом тексте: выбрасываем script/style и теги, как в probe аудита. */
function words(html) {
  const text = html
    .replace(/<(script|style|template)[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<[^>]+>/g, ' ')
  return (text.match(/[A-Za-zА-Яа-яЁё0-9]+/g) ?? []).length
}

/**
 * Пропущенные неразрывные пробелы после однобуквенных слов и перед тире.
 *
 * Неразрывный пробел здесь — маркер «место уже исправлено», поэтому к обычному
 * пробелу он НЕ приводится: иначе проверка считала бы все вхождения подряд и не
 * могла стать зелёной ни при какой правке (так она и была написана поначалу).
 * Теги вырезаются пустой строкой, а не пробелом: склейка живёт внутри текстового
 * узла, и «и</strong>&nbsp;цены» должно читаться как исправленное.
 */
function missingNbsp(html) {
  const text = html
    .replace(/<(script|style|template|textarea)[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<[^>]+>/g, '')
  const afterShort = count(text, /(^|[\s(«"])[вксоуиая]\s/gi)
  const beforeDash = count(text, /\s[—–]/g)
  return afterShort + beforeDash
}

const meta = (html, name) =>
  html.match(new RegExp(`<meta\\s+name=["']${name}["']\\s+content=["']([^"']*)["']`, 'i'))?.[1] ?? null
const prop = (html, property) =>
  html.match(new RegExp(`<meta\\s+property=["']${property}["']\\s+content=["']([^"']*)["']`, 'i'))?.[1] ?? null
const title = (html) => html.match(/<title>([\s\S]*?)<\/title>/i)?.[1]?.trim() ?? null

function jsonLd(html) {
  const out = []
  for (const m of html.matchAll(/<script[^>]+application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      out.push(JSON.parse(m[1]))
    } catch {
      out.push({ __parseError: true })
    }
  }
  return out
}

/** Все @type из графа разметки, плоским списком. */
function ldTypes(html) {
  const types = []
  const walk = (node) => {
    if (Array.isArray(node)) return node.forEach(walk)
    if (!node || typeof node !== 'object') return
    if (node['@type']) types.push(...[node['@type']].flat())
    Object.values(node).forEach(walk)
  }
  jsonLd(html).forEach(walk)
  return types
}

/** Первый узел графа с нужным @type. */
function ldNode(html, type) {
  let found = null
  const walk = (node) => {
    if (found) return
    if (Array.isArray(node)) return node.forEach(walk)
    if (!node || typeof node !== 'object') return
    if ([node['@type']].flat().includes(type)) {
      found = node
      return
    }
    Object.values(node).forEach(walk)
  }
  jsonLd(html).forEach(walk)
  return found
}

const sitemapLocs = (xml) => [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1])

// ──────────────────────────────────────────────────────────────────── наборы
const MAIN_PAGES = [
  '/',
  '/excel-to-app.html',
  '/tokens.html',
  '/knowledge-base.html',
  '/skladskoy-uchet.html',
  '/uslugi.html',
  '/kvintety-ili-tablicy.html',
  '/agent-platforms.html',
  '/catalog-matching.html',
]
const USECASES = [
  'upravlenie-proektami',
  'planirovanie-proizvodstva',
  'skladskoy-uchet',
  'upravlenie-zakupkami',
  'finansovyy-uchet',
  'kadrovyy-uchet',
  'crm-uchet-klientov',
  'uchet-dogovorov',
  'upravlencheskiy-uchet',
].map((s) => `/${s}.html`)
const BLOG_SAMPLE = [
  '/blog/posts/excel-v-prilozhenie-za-45-minut-kak-rabotaet-ii-agent-integrama/',
  '/blog/posts/predposylki-no-code-konstruktora-integram/',
  '/blog/',
  '/blog/category/keysy/',
  '/blog/search/',
]

// Блог — отдельная сборка Astro (blog-v2), в dist/ основного сайта её нет:
// `npm run build` блог не трогает, он собирается и выкладывается своей командой.
// Поэтому пункты 1, 6 и 12 при --dist не «красные», а пропущенные: судить о них
// можно только по живому сайту (запуск без --dist).
const BLOG_IN_DIST = existsSync(join(root, 'dist', 'blog', 'index.html'))
const blogSkip = () =>
  FROM_DIST && !BLOG_IN_DIST
    ? { skip: 'блог собирается отдельно (blog-v2) — в dist/ его нет, проверяйте без --dist' }
    : null

// ───────────────────────────────────────────────────────────────────── проверки
const checks = []
const check = (id, item, title, fn) => checks.push({ id, item, title, fn })

check('blog-jsonld', 1, 'JSON-LD в блоге', () => {
  const skipped = blogSkip()
  if (skipped) return skipped
  const rows = BLOG_SAMPLE.map((p) => {
    const html = get(p)
    const node = ldNode(html, 'BlogPosting') ?? ldNode(html, 'Article')
    return {
      page: p,
      ldJson: count(html, /application\/ld\+json/g),
      types: [...new Set(ldTypes(html))].join(','),
      datePublished: node?.datePublished ?? null,
      dateModified: node?.dateModified ?? null,
    }
  })
  const posts = rows.filter((r) => r.page.includes('/posts/'))
  return {
    ok: rows.every((r) => r.ldJson >= 1) && posts.every((r) => r.datePublished && r.dateModified),
    rows,
  }
})

check('prerender-gap', 2, 'Разрыв «рендер − сырой»: слова в сыром HTML', () => {
  const pages = [
    '/catalog-matching.html',
    '/kvintety-ili-tablicy.html',
    '/knowledge-base/25-counterparty-three-views.html',
    ...USECASES,
    '/tokens.html',
    '/agent-platforms.html',
    '/sravnenie-s-bitrix-amocrm.html',
    '/informatsionnaya-sistema.html',
    '/konstruktor-prilozhenij.html',
    '/excel-to-app.html',
  ]
  const rows = pages.map((p) => {
    const html = get(p)
    return {
      page: p,
      rawWords: words(html),
      inputs: count(html, /<input\b/g),
      labels: count(html, /<label\b/g),
      h2: count(html, /<h2\b/g),
      forms: count(html, /<form\b/g),
    }
  })
  const quiz = rows.find((r) => r.page === '/kvintety-ili-tablicy.html')
  const catalog = rows.find((r) => r.page === '/catalog-matching.html')
  return {
    ok: quiz.inputs >= 13 && quiz.h2 >= 14 && catalog.forms >= 1,
    rows,
  }
})

check('nav', 3, 'Навигация в статическом HTML', () => {
  const rows = MAIN_PAGES.map((p) => {
    const html = get(p)
    return {
      page: p,
      uslugi: count(html, /uslugi\.html/g),
      kvintety: count(html, /kvintety-ili-tablicy\.html/g),
      agentPlatforms: count(html, /agent-platforms\.html/g),
      resheniya: count(html, /resheniya\.html/g),
    }
  })
  return {
    ok: rows.every((r) => r.uslugi >= 1 && r.kvintety >= 1 && r.agentPlatforms >= 1 && r.resheniya >= 1),
    rows,
  }
})

check('focus', 4, 'Видимый фокус: правило :focus-visible в CSS сборки', () => {
  // Проверяем источник: правило должно быть в собранном CSS, иначе фокус
  // держится только на браузерном умолчании, которое снимает Tailwind preflight.
  const home = get('/')
  const cssHref = home.match(/href="(\/assets\/[^"]+\.css)"/)?.[1]
  const css = cssHref ? get(cssHref) : ''
  return {
    ok: /:focus-visible/.test(css) && /outline/.test(css),
    rows: [
      {
        css: cssHref ?? '(не найден)',
        focusVisibleRules: count(css, /:focus-visible/g),
        outlineNone: count(css, /outline:\s*(none|0)/g),
      },
    ],
  }
})

check('kb-dates', 5, 'datePublished в базе знаний', () => {
  const xml = get('/sitemap.xml')
  const pages = sitemapLocs(xml)
    .map((u) => u.replace(BASE, '').replace('https://ideav.ru', ''))
    .filter((p) => /^\/knowledge-base\/.+\.html$/.test(p))
  const rows = pages.map((p) => {
    const html = get(p)
    const node = ldNode(html, 'TechArticle') ?? ldNode(html, 'Article')
    return { page: p, datePublished: node?.datePublished ?? null, dateModified: node?.dateModified ?? null }
  })
  return {
    ok: rows.length > 0 && rows.every((r) => r.datePublished && r.dateModified && r.datePublished <= r.dateModified),
    rows,
    summary: { pages: rows.length, withoutPublished: rows.filter((r) => !r.datePublished).length },
  }
})

check('blog-index-hygiene', 6, 'Блог: noindex на поиске и тонких тегах, lastmod в карте', () => {
  const skipped = blogSkip()
  if (skipped) return skipped
  const search = get('/blog/search/')
  const sitemap = get('/blog/sitemap-0.xml')
  const locs = sitemapLocs(sitemap)
  const lastmods = count(sitemap, /<lastmod>/g)
  const tagLocs = locs.filter((u) => u.includes('/blog/tag/'))
  // «Тонкий тег» аудит оставил на решение владельца; принят счётчик статей —
  // меньше THIN_TAG_MIN_POSTS (blog-v2/src/lib/tag-slug.mjs). Проверяем
  // следствие, а не порог: страница тега либо в карте и индексируется, либо
  // noindex и не в карте. Внутренней противоречивости быть не должно.
  const tagsInMap = []
  for (const u of tagLocs.slice(0, 60)) {
    const p = u.replace(/^https?:\/\/[^/]+/, '')
    const html = get(p)
    tagsInMap.push({ page: p, words: words(html), robots: meta(html, 'robots') })
  }
  const noindexInMap = tagsInMap.filter((t) => /noindex/.test(t.robots ?? ''))
  return {
    ok:
      /noindex/.test(meta(search, 'robots') ?? '') &&
      !locs.some((u) => u.includes('/blog/search')) &&
      locs.length > 0 &&
      lastmods === locs.length &&
      noindexInMap.length === 0,
    rows: [
      { what: '/blog/search/ robots', value: meta(search, 'robots') },
      { what: 'search в карте', value: locs.some((u) => u.includes('/blog/search')) },
      { what: 'URL в карте блога', value: locs.length },
      { what: '<lastmod> в карте блога', value: lastmods },
      { what: 'страниц тегов в карте', value: tagLocs.length },
      { what: 'в карте, но с noindex', value: noindexInMap.length },
      {
        what: 'самая короткая страница тега в карте, слов',
        value: Math.min(Infinity, ...tagsInMap.map((t) => t.words)),
      },
    ],
    noindexInMap,
  }
})

check('phrase', 7, 'Точная фраза на странице сравнения', () => {
  const html = get('/sravnenie-s-bitrix-amocrm.html')
  const text = html.replace(/<[^>]+>/g, ' ').replace(/&nbsp;| /g, ' ')
  const hits = count(text, /crm\s+система\s+что\s+это\s+такое/gi)
  return { ok: hits >= 1, rows: [{ page: '/sravnenie-s-bitrix-amocrm.html', hits }] }
})

check('kb-link', 8, 'Ссылка /knowledge-base без .html', () => {
  const rows = ['/', '/excel-to-app.html', '/agent-platforms.html'].map((p) => ({
    page: p,
    bad: count(get(p), /href="\/knowledge-base"/g),
  }))
  return { ok: rows.every((r) => r.bad === 0), rows }
})

check('og', 9, 'og:image и превью', () => {
  const pages = ['/uslugi.html', '/kvintety-ili-tablicy.html', '/konstruktor-prilozhenij.html', '/catalog-matching.html', ...USECASES]
  const seen = new Map()
  const rows = pages.map((p) => {
    const html = get(p)
    const og = prop(html, 'og:image')
    const tw = html.match(/<meta\s+name=["']twitter:image["']\s+content=["']([^"']*)["']/i)?.[1] ?? null
    seen.set(og, (seen.get(og) ?? 0) + 1)
    return { page: p, ogImage: og, twitterImage: tw }
  })
  return {
    ok: rows.every((r) => r.ogImage && r.twitterImage && seen.get(r.ogImage) === 1),
    rows,
    shared: [...seen.entries()].filter(([, n]) => n > 1),
  }
})

check('uslugi-offer', 10, 'Offer на uslugi.html', () => {
  const html = get('/uslugi.html')
  const offers = []
  const walk = (node) => {
    if (Array.isArray(node)) return node.forEach(walk)
    if (!node || typeof node !== 'object') return
    if ([node['@type']].flat().includes('Offer')) offers.push(node)
    Object.values(node).forEach(walk)
  }
  jsonLd(html).forEach(walk)
  const rows = offers.map((o) => ({
    name: o.name ?? o.itemOffered?.name ?? '(без имени)',
    url: o.url ?? null,
    availability: o.availability ?? null,
    seller: o.seller ? (o.seller.name ?? true) : null,
  }))
  return {
    ok:
      rows.length >= 5 &&
      rows.every((r) => r.url && !/^https:\/\/ideav\.ru\/#/.test(r.url) && r.availability && r.seller),
    rows,
  }
})

check('kvintety', 11, 'kvintety-ili-tablicy: заголовки, разметка, llms.txt', () => {
  const html = get('/kvintety-ili-tablicy.html')
  const h2s = [...html.matchAll(/<h2[^>]*>([\s\S]*?)<\/h2>/gi)].map((m) =>
    m[1].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim(),
  )
  const glued = h2s.filter((t) => /[а-яё?][Вв]ес\s*\d/.test(t))
  const node = ldNode(html, 'Article') ?? ldNode(html, 'WebApplication') ?? ldNode(html, 'WebPage')
  const llms = get('/llms.txt')
  // aria-live живёт в React-компоненте, в сыром HTML его быть не может: #root
  // заменяется при загрузке. Эту часть проверяет tests/issue-627-seo-audit.test.mjs
  // по исходнику src/pages/KvintetyIliTablicy.tsx.
  return {
    ok:
      glued.length === 0 &&
      h2s.length >= 14 &&
      Boolean(node?.datePublished && node?.dateModified) &&
      /kvintety-ili-tablicy/.test(llms),
    rows: [
      { what: 'h2 в сыром HTML', value: h2s.length },
      { what: 'h2 со слитым «вес»', value: glued.length, sample: glued[0] ?? null },
      { what: 'даты в разметке', value: node ? `${node.datePublished ?? 'нет'} / ${node.dateModified ?? 'нет'}` : 'нет узла' },
      { what: 'страница в llms.txt', value: /kvintety-ili-tablicy/.test(llms) },
    ],
  }
})

check('blog-meta-length', 12, 'Длина title и description блога', () => {
  const skipped = blogSkip()
  if (skipped) return skipped
  const sitemap = get('/blog/sitemap-0.xml')
  const posts = sitemapLocs(sitemap).filter((u) => u.includes('/blog/posts/'))
  const rows = []
  for (const u of posts) {
    const p = u.replace(/^https?:\/\/[^/]+/, '')
    const html = get(p)
    const t = title(html) ?? ''
    const d = meta(html, 'description') ?? ''
    rows.push({ page: p, title: t.length, description: d.length })
  }
  const longTitles = rows.filter((r) => r.title > 70)
  const badDesc = rows.filter((r) => r.description < 70 || r.description > 170)
  return {
    ok: longTitles.length === 0 && badDesc.length === 0,
    rows: [
      { what: 'статей', value: rows.length },
      { what: 'title > 70', value: longTitles.length },
      { what: 'description вне 70–170', value: badDesc.length },
      { what: 'самый длинный title', value: Math.max(0, ...rows.map((r) => r.title)) },
    ],
    longTitles,
    badDesc,
  }
})

check('nbsp', 13, 'Неразрывные пробелы', () => {
  const pages = ['/', '/informatsionnaya-sistema.html', '/excel-to-app.html', '/sravnenie-s-bitrix-amocrm.html', '/agent-platforms.html', '/catalog-matching.html', '/konstruktor-prilozhenij.html', '/tokens.html', '/kvintety-ili-tablicy.html', '/uslugi.html']
  const rows = pages.map((p) => ({ page: p, missingNbsp: missingNbsp(get(p)) }))
  return { ok: rows.every((r) => r.missingNbsp <= 5), rows }
})

check('new-anchor', 14, 'Анкор пункта «Квинтеты или таблицы»', () => {
  const rows = MAIN_PAGES.map((p) => {
    const html = get(p)
    const anchors = [...html.matchAll(/<a\b[^>]*href="\/kvintety-ili-tablicy\.html"[^>]*>([\s\S]*?)<\/a>/gi)].map(
      (m) => m[1].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim(),
    )
    return { page: p, anchors, glued: anchors.filter((a) => /[а-яё]New/i.test(a.replace(/\s/g, ''))).length }
  }).filter((r) => r.anchors.length > 0)
  return { ok: rows.every((r) => r.glued === 0), rows }
})

// ───────────────────────────────────────────────────────────────────────── run
const selected = ONLY.length ? checks.filter((c) => ONLY.includes(c.id)) : checks
const results = []
for (const c of selected) {
  let out
  try {
    out = c.fn()
  } catch (e) {
    out = { ok: false, rows: [{ error: String(e?.message ?? e) }] }
  }
  results.push({ id: c.id, item: c.item, title: c.title, ...out })
}

if (AS_JSON) {
  console.log(JSON.stringify({ base: FROM_DIST ? 'dist/' : BASE, results }, null, 2))
} else {
  console.log(`Источник: ${FROM_DIST ? 'dist/ (локальная сборка)' : BASE}\n`)
  for (const r of results) {
    const mark = r.skip ? '⏭' : r.ok ? '✅' : '❌'
    console.log(`${mark} п.${r.item} ${r.title} [${r.id}]`)
    if (r.skip) console.log('    пропущено:', r.skip)
    for (const row of r.rows ?? []) console.log('   ', JSON.stringify(row))
    if (r.summary) console.log('    итого:', JSON.stringify(r.summary))
    console.log('')
  }
  const skipped = results.filter((r) => r.skip).length
  const failed = results.filter((r) => !r.skip && !r.ok).length
  console.log(
    `Проверок: ${results.length}, не выполнено: ${failed}` + (skipped ? `, пропущено: ${skipped}` : ''),
  )
}
process.exitCode = 0
