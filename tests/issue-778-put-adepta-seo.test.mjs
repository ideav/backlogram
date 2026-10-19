// issue #778 — SEO- и дизайн-разбор /put-adepta.html (19.10.2026): превью для
// мессенджеров, Article/HowTo в JSON-LD, description под длину сниппета, капча
// не сдвигает страницу на 320 px и грузится только у формы, правки текста.
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { resolve } from 'node:path'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { ADEPT_META, CASES, COMMUNITY, RATE_NOTE, STEPS } from '../src/data/adeptPath.mjs'

const repo = fileURLToPath(new URL('..', import.meta.url))
const read = (p) => readFileSync(resolve(repo, p), 'utf8')

function prerender() {
  const work = mkdtempSync(resolve(tmpdir(), 'issue-778-'))
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
const graph = JSON.parse(
  out.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1].replace(/\\u003c/g, '<'),
)['@graph']
const node = (type) => graph.find((n) => n['@type'] === type)

test('description помещается в сниппет и держит обе цифры', () => {
  assert.ok(ADEPT_META.description.length <= 160, `${ADEPT_META.description.length} знаков`)
  assert.match(ADEPT_META.description, /37 500 ₽ за 8 часов/)
  assert.match(ADEPT_META.description, /206 250 ₽/)
})

test('превью: своя карточка 1200×630 и summary_large_image — в снапшоте и в SPA', () => {
  assert.ok(existsSync(resolve(repo, 'public/og/put-adepta.png')))
  assert.match(read('scripts/generate-og-images.mjs'), /slug: 'put-adepta'/)
  assert.ok(out.includes('<meta property="og:image" content="https://ideav.ru/og/put-adepta.png" />'))
  assert.ok(out.includes('<meta name="twitter:card" content="summary_large_image" />'))
  assert.ok(!out.includes('content="summary"'))
  assert.ok(page.includes("'twitter:card', 'summary_large_image'"))
  assert.ok(page.includes('/og/put-adepta.png'))
})

test('JSON-LD: Article с датами и автором, HowTo из пяти шагов', () => {
  const article = node('Article')
  assert.equal(article.headline, ADEPT_META.h1)
  assert.equal(article.datePublished, ADEPT_META.publishedAt)
  assert.equal(article.dateModified, ADEPT_META.updatedAt)
  assert.equal(article.author['@id'], 'https://ideav.ru/#organization')
  assert.equal(node('WebPage').datePublished, ADEPT_META.publishedAt)
  const howto = node('HowTo')
  assert.deepEqual(howto.step.map((s) => s.name), STEPS.map((s) => s.h))
  // якоря страницы (#cases, #zayavka) — не URL шага
  for (const s of howto.step) if (s.url) assert.match(s.url, /^https:\/\//)
  assert.equal(node('ImageObject').url, 'https://ideav.ru/og/put-adepta.png')
})

test('sitemap: lastmod равен updatedAt', () => {
  const block = read('public/sitemap.xml').match(/<loc>https:\/\/ideav\.ru\/put-adepta\.html<\/loc>\s*<lastmod>([^<]+)</)
  assert.equal(block[1], ADEPT_META.updatedAt)
})

test('320 px: форма во всю ширину на телефоне, капча грузится у формы', () => {
  const section = page.match(/<section id="zayavka" className="([^"]+)"/)[1]
  assert.doesNotMatch(section, /(^|\s)px-4(\s|$)/, 'боковой отступ секции сдвигает iframe капчи за край')
  assert.match(page, /new IntersectionObserver\(/)
  assert.ok(page.indexOf('observer.observe(captchaContainerRef.current)') > 0)
})

test('текст: строчная после «Откуда пришёл:», вопрос в самопроверке, чат «не было» — один раз', () => {
  for (const c of CASES) {
    assert.ok(out.includes(`Откуда пришёл: ${c.origin.charAt(0).toLowerCase()}${c.origin.slice(1)}.`))
  }
  assert.ok(out.includes('<h2>Справитесь ли вы с подобным?</h2>'))
  assert.ok(page.includes('Справитесь ли вы с подобным?'))
  const pakline = CASES.find((c) => c.key === 'pakline')
  const told = [...pakline.timeline.map((s) => s.t), pakline.rework.note].filter((t) => /не было/.test(t))
  assert.equal(told.length, 1)
  assert.match(RATE_NOTE, /часы в счёте и потраченные расходятся/)
  assert.doesNotMatch(COMMUNITY.solo, /^Хотя/)
})
