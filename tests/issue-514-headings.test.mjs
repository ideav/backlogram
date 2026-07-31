/**
 * issue #514 — структура заголовков главной.
 *
 * Было: 83 заголовка на ~2800 слов (1 × H1, 17 × H2, 55 × H3, 10 × H4) —
 * заголовком был выделен почти каждый абзац и каждая карточка, из-за чего
 * «скелет» страницы для поисковика размывался. Стало: заголовки остались
 * только у смысловых разделов и их подпунктов, а подписи карточек, вопросы
 * FAQ и колонки подвала размечены обычным текстом и списками определений.
 *
 * Тест сторожит бюджет заголовков в двух местах: в исходниках React (то, что
 * увидит краулер с исполнением JS) и в статическом снапшоте главной (то, что
 * увидят все остальные). Ключевое правило — заголовки не генерируются в
 * `.map()`: именно карточки в циклах раздували счётчик.
 */
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { execFileSync } from 'node:child_process'
import { cpSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { resolve } from 'node:path'
import { HOME_FAQ } from '../src/data/home-faq.mjs'

const repo = new URL('..', import.meta.url).pathname
const read = (path) => readFileSync(resolve(repo, path), 'utf8')

/** Все теги-заголовки файла целиком, включая многострочные и <motion.h1>. */
function headings(source) {
  return [...source.matchAll(/<(?:motion\.)?(h[1-6])\b[\s\S]*?<\/(?:motion\.)?\1>/g)].map((m) => ({
    tag: m[1],
    html: m[0],
  }))
}

const HOME_COMPONENTS = [
  'src/pages/Home.tsx',
  'src/components/Header.tsx',
  'src/components/Footer.tsx',
  'src/components/ClientLogos.tsx',
  'src/components/BlogSlider.tsx',
  'src/components/CookieConsent.tsx',
]

test('на главной один H1 и не больше десяти H2', () => {
  const home = headings(read('src/pages/Home.tsx'))
  const byTag = (tag) => home.filter((h) => h.tag === tag).length

  assert.equal(byTag('h1'), 1, 'H1 на странице ровно один')
  assert.ok(byTag('h2') <= 10, `H2 не больше 10, сейчас ${byTag('h2')}`)
  assert.ok(byTag('h3') <= 15, `H3 не больше 15, сейчас ${byTag('h3')}`)
})

test('H4–H6 на главной не используются', () => {
  for (const file of HOME_COMPONENTS) {
    const deep = headings(read(file)).filter((h) => ['h4', 'h5', 'h6'].includes(h.tag))
    assert.deepEqual(
      deep.map((h) => h.html.slice(0, 60)),
      [],
      `${file}: подписи вместо H4–H6 — обычный текст или dl/dt/dd`,
    )
  }
})

test('заголовки не генерируются в циклах по карточкам', () => {
  // Подпись карточки внутри .map() множится на число элементов: девять статей
  // блога, десять отраслей, семь вопросов FAQ. Такие заголовки и дали 55 × H3.
  for (const file of HOME_COMPONENTS) {
    for (const h of headings(read(file))) {
      assert.doesNotMatch(
        h.html,
        /\{\s*(item|post|label|entry|card|plan|faq)\b/,
        `${file}: заголовок ${h.tag} печатается из данных цикла — ${h.html.slice(0, 80)}`,
      )
    }
  }
})

test('вопросы FAQ размечены списком определений, а не заголовками', () => {
  const home = read('src/pages/Home.tsx')
  assert.match(home, /<dl className="space-y-4">/)
  assert.match(home, /<dt className="[^"]*">\{item\.q\}<\/dt>/)
  assert.match(home, /<dd className="[^"]*">\s*<p>\{item\.a\}<\/p>/)
})

test('статический снапшот главной держит тот же бюджет заголовков', () => {
  const work = mkdtempSync(resolve(tmpdir(), 'headings-'))
  mkdirSync(resolve(work, 'dist'), { recursive: true })
  mkdirSync(resolve(work, 'scripts'), { recursive: true })
  cpSync(resolve(repo, 'scripts/prerender-landing.mjs'), resolve(work, 'scripts/prerender-landing.mjs'))
  cpSync(resolve(repo, 'src/data'), resolve(work, 'src/data'), { recursive: true })
  writeFileSync(resolve(work, 'dist/index.html'), read('index.html'))

  execFileSync('node', ['scripts/prerender-landing.mjs'], { cwd: work })
  const out = readFileSync(resolve(work, 'dist/index.html'), 'utf8')
  const snapshot = out.slice(out.indexOf('<div id="root">'))

  const tags = [...snapshot.matchAll(/<(h[1-6])\b[^>]*>([\s\S]*?)<\/\1>/g)]
  const count = (tag) => tags.filter((m) => m[1] === tag).length

  assert.equal(count('h1'), 1)
  assert.ok(count('h2') <= 10, `H2 в снапшоте не больше 10, сейчас ${count('h2')}`)
  assert.equal(count('h3') + count('h4') + count('h5') + count('h6'), 0)

  // Дублей заголовков (например, отдельные блоки для мобильной и десктопной
  // вёрстки) в разметке быть не должно — их считает любой SEO-парсер.
  const texts = tags.map((m) => m[2].replace(/<[^>]+>/g, '').trim())
  assert.equal(new Set(texts).size, texts.length, `дубли заголовков: ${texts.join(' | ')}`)

  // Вопросы ушли из заголовков в dt/dd, но остались в разметке FAQPage —
  // именно она даёт расширенный сниппет в выдаче.
  for (const item of HOME_FAQ) {
    assert.ok(snapshot.includes(`<dt>${item.q}</dt>`), `нет <dt> для вопроса: ${item.q}`)
  }
  const ld = JSON.parse(
    out.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1].replace(/\\u003c/g, '<'),
  )
  const faqNode = ld['@graph'].find((n) => n['@type'] === 'FAQPage')
  assert.equal(faqNode.mainEntity.length, HOME_FAQ.length)
})
