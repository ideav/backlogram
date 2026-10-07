// issue #642 — кластер страниц под запрос «автоматизация бизнеса с ИИ» и смежные.
//
// Яндекс смотрит сырой HTML без JS, поэтому проверяем пререндер
// (scripts/prerender-ai-pages.mjs): у каждой страницы свой title/description в
// лимитах выдачи, H1 с ключевой фразой, canonical, FAQPage и хлебные крошки в
// JSON-LD, и страница вшита в сайт — роутер, меню, sitemap, llms.txt, .htaccess.
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, cpSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { resolve } from 'node:path'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { AI_PAGES, AI_HUB, SEVEN_QUESTIONS } from '../src/data/aiPages.mjs'
import { SERVICES, formatPrice } from '../src/data/services.mjs'
import { staticNavLinks, headerMoreLinks } from '../src/data/nav.mjs'

// fileURLToPath, а не url.pathname: pathname на Windows даёт «/C:/…» и ломает resolve.
const repo = fileURLToPath(new URL('..', import.meta.url))
const read = (p) => readFileSync(resolve(repo, p), 'utf8')

/** Прогоняет пререндер кластера в песочнице и отдаёт { slug: html }. */
function prerender() {
  const work = mkdtempSync(resolve(tmpdir(), 'issue-642-'))
  mkdirSync(resolve(work, 'dist'), { recursive: true })
  mkdirSync(resolve(work, 'scripts'), { recursive: true })
  cpSync(resolve(repo, 'scripts/prerender-ai-pages.mjs'), resolve(work, 'scripts/prerender-ai-pages.mjs'))
  cpSync(resolve(repo, 'src/data'), resolve(work, 'src/data'), { recursive: true })
  writeFileSync(resolve(work, 'dist/index.html'), read('index.html'))
  execFileSync('node', ['scripts/prerender-ai-pages.mjs'], { cwd: work })
  return Object.fromEntries(
    AI_PAGES.map((p) => [p.slug, readFileSync(resolve(work, `dist/${p.slug}.html`), 'utf8')]),
  )
}

const out = prerender()
const jsonLdOf = (html) => JSON.parse(
  html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1].replace(/\\u003c/g, '<'),
)

// ── 1. Ключевые запросы: у каждого — своя страница ───────────────────────
test('каждый целевой запрос стоит в title и H1 своей страницы', () => {
  const targets = {
    'avtomatizaciya-biznesa-s-ii': /автоматизация бизнеса с ии/i,
    'ii-agenty-dlya-biznesa': /ии-агенты для бизнеса/i,
    'vnedrenie-ii-v-biznes': /внедрение ии в бизнес/i,
    'ii-v-1c-bitrix24-amocrm': /ии в 1с, битрикс24 и amocrm/i,
    'lokalnyj-ii-dlya-biznesa': /локальный ии для бизнеса/i,
    'ii-dlya-integratorov': /интеграторов/i,
  }
  assert.deepEqual(AI_PAGES.map((p) => p.slug).sort(), Object.keys(targets).sort())
  for (const p of AI_PAGES) {
    assert.match(p.seoTitle, targets[p.slug], `${p.slug}: запроса нет в title`)
    assert.match(`${p.h1} ${p.h1accent}`, targets[p.slug], `${p.slug}: запроса нет в H1`)
  }
})

test('title и description держат лимиты выдачи и не повторяются', () => {
  for (const p of AI_PAGES) {
    assert.ok(p.seoTitle.length <= 60, `${p.slug}: title ${p.seoTitle.length} симв.`)
    assert.ok(p.seoTitle.endsWith('| Интеграм'), `${p.slug}: в title нет бренда`)
    assert.ok(p.metaDescription.length <= 158, `${p.slug}: description ${p.metaDescription.length} симв.`)
  }
  assert.equal(new Set(AI_PAGES.map((p) => p.seoTitle)).size, AI_PAGES.length)
  assert.equal(new Set(AI_PAGES.map((p) => p.metaDescription)).size, AI_PAGES.length)
})

// ── 2. Сырой HTML ────────────────────────────────────────────────────────
test('сырой HTML: title, description, canonical, H1 и FAQ без JS', () => {
  for (const p of AI_PAGES) {
    const html = out[p.slug]
    assert.ok(html.includes(`<title>${p.seoTitle}</title>`), `${p.slug}: title`)
    assert.ok(html.includes(`<link rel="canonical" href="https://ideav.ru/${p.slug}.html" />`), `${p.slug}: canonical`)
    assert.ok(html.includes(`<meta property="og:image" content="https://ideav.ru/og/${p.slug}.png" />`), `${p.slug}: og:image`)
    assert.equal((html.match(/<h1>/g) ?? []).length, 1, `${p.slug}: H1 должен быть один`)
    for (const f of p.faq) assert.ok(html.includes(f.q), `${p.slug}: нет вопроса FAQ «${f.q}»`)
    assert.ok(html.includes('https://excel-to-app.ru/'), `${p.slug}: нет ссылки на пробу`)
  }
})

test('JSON-LD: FAQPage совпадает с видимым FAQ, крошки ведут через хаб', () => {
  for (const p of AI_PAGES) {
    const g = jsonLdOf(out[p.slug])['@graph']
    const faq = g.find((n) => n['@type'] === 'FAQPage')
    assert.deepEqual(faq.mainEntity.map((q) => q.name), p.faq.map((f) => f.q))
    const crumbs = g.find((n) => n['@type'] === 'BreadcrumbList').itemListElement
    assert.equal(crumbs.at(-1).item, `https://ideav.ru/${p.slug}.html`)
    if (p.slug !== AI_HUB.slug) assert.equal(crumbs[1].item, `https://ideav.ru/${AI_HUB.slug}.html`)
  }
})

test('хаб несёт все семь вопросов, каждая страница ссылается на остальные', () => {
  for (const s of SEVEN_QUESTIONS) assert.ok(out[AI_HUB.slug].includes(s.q), `нет вопроса «${s.q}»`)
  for (const p of AI_PAGES) {
    for (const o of AI_PAGES.filter((x) => x.slug !== p.slug)) {
      assert.ok(out[p.slug].includes(`href="/${o.slug}.html"`), `${p.slug} не ссылается на ${o.slug}`)
    }
  }
})

test('цены на странице внедрения берутся из каталога услуг', () => {
  const html = out['vnedrenie-ii-v-biznes']
  for (const id of ['razbor-processa', 'pilot', 'cloud', 'license']) {
    const s = SERVICES.find((x) => x.id === id)
    assert.ok(html.includes(formatPrice(s.price)), `нет цены ${id}`)
    assert.ok(html.includes(`href="/uslugi.html#${id}"`), `нет ссылки на ${id}`)
  }
})

test('приватный репозиторий нового ядра не светится на страницах', () => {
  for (const p of AI_PAGES) assert.ok(!/python2node/i.test(out[p.slug]), `${p.slug} упоминает python2node`)
})

// ── 3. Страницы вшиты в сайт ─────────────────────────────────────────────
test('роутер отдаёт страницы из AI_PAGES с .html и без', () => {
  const router = read('src/router.tsx')
  assert.ok(router.includes('<AiLanding slug={p.slug} />'))
  assert.ok(router.includes('path: `${p.slug}.html`'))
})

test('хаб в меню «Ещё» и подвале, все страницы — в статической навигации', () => {
  assert.ok(headerMoreLinks.some((l) => l.href === `/${AI_HUB.slug}.html`))
  const linked = new Set(staticNavLinks().map((l) => l.href))
  for (const p of AI_PAGES) assert.ok(linked.has(`/${p.slug}.html`), `${p.slug} — сирота`)
})

test('страницы в sitemap и llms.txt', () => {
  const sitemap = read('public/sitemap.xml')
  const llms = read('public/llms.txt')
  for (const p of AI_PAGES) {
    assert.ok(sitemap.includes(`<loc>https://ideav.ru/${p.slug}.html</loc>`), `${p.slug} нет в sitemap`)
    assert.ok(llms.includes(`(https://ideav.ru/${p.slug}.html)`), `${p.slug} нет в llms.txt`)
  }
})

test('пререндер в build до prerender-landing, OG-карточки из тех же данных', () => {
  const build = JSON.parse(read('package.json')).scripts.build
  const idx = build.indexOf('prerender-ai-pages.mjs')
  assert.ok(idx !== -1, 'prerender-ai-pages.mjs не в build')
  assert.ok(idx < build.indexOf('prerender-landing.mjs'), 'должен идти ДО prerender-landing')
  assert.match(read('scripts/generate-og-images.mjs'), /AI_PAGES\.map/)
})

test('.htaccess редиректит безрасширенные пути выше front controller', () => {
  const ht = read('public/.htaccess')
  const rule = ht.split('\n').find((l) => l.includes('avtomatizaciya-biznesa-s-ii'))
  assert.ok(rule, 'нет правила')
  for (const p of AI_PAGES) assert.ok(rule.includes(p.slug), `${p.slug} нет в правиле`)
  assert.ok(ht.indexOf(rule) < ht.indexOf('RewriteCond %{REQUEST_FILENAME} !-f'), 'правило ниже front controller')
})
