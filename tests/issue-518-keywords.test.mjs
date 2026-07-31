/**
 * issue #518 — высокочастотные ключи из семантики вынесены в заголовки главной.
 *
 * Аудит: кластеры «замена Excel» и «no-code» проработаны, а «информационная
 * система» (51 188), «управление бизнес-процессами» (1 679), «описание/анализ
 * бизнес-процессов» (3 881 / 599) и «автоматизация рутинных задач» (1 759) на
 * странице почти не встречались и не стояли ни в одном H2.
 *
 * Тест держит два инварианта: ключевые фразы остаются в заголовках (а не
 * растворяются при следующей правке текста) и бюджет заголовков из issue #514
 * при этом не нарушен — ровно 10 H2, ни одного H4.
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
const homeTsx = read('src/pages/Home.tsx')

/** Заголовки Home.tsx с текстом без разметки. Пробелы — включая неразрывные. */
function headings(source) {
  return [...source.matchAll(/<(?:motion\.)?(h[1-6])\b[^>]*>([\s\S]*?)<\/(?:motion\.)?\1>/g)].map(
    (m) => ({
      tag: m[1],
      text: m[2].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim(),
    }),
  )
}

const homeHeadings = headings(homeTsx)
const h2Text = homeHeadings.filter((h) => h.tag === 'h2').map((h) => h.text).join(' | ')

test('высокочастотные ключи стоят в H2 главной', () => {
  for (const phrase of [
    'информационные системы',
    'управление бизнес-процессами',
    'автоматизация бизнес-процессов',
  ]) {
    assert.ok(
      h2Text.toLowerCase().includes(phrase.toLowerCase()),
      `ключ «${phrase}» пропал из H2. Сейчас: ${h2Text}`,
    )
  }
})

test('процессные ключи есть в тексте главной', () => {
  // В текстах стоят неразрывные пробелы (issue #41) — для поиска фраз
  // приводим их к обычным, иначе «и анализ» не совпадёт с «и анализ».
  const text = homeTsx.replace(/ /g, ' ').toLowerCase()
  for (const phrase of [
    'описание и анализ бизнес-процессов',
    'описываем бизнес-процессы',
    'автоматизация рутинных задач',
  ]) {
    assert.ok(text.includes(phrase.toLowerCase()), `фраза «${phrase}» пропала со страницы`)
  }
})

test('бюджет заголовков из issue #514 не нарушен', () => {
  const count = (tag) => homeHeadings.filter((h) => h.tag === tag).length
  assert.equal(count('h1'), 1)
  assert.equal(count('h2'), 10, 'ровно 10 H2 — как договорились в issue #514')
  assert.ok(count('h3') <= 15)
  assert.equal(count('h4') + count('h5') + count('h6'), 0)
})

test('FAQ закрывает кластеры «информационная система» и «рутинные задачи»', () => {
  const questions = HOME_FAQ.map((item) => item.q.toLowerCase())
  assert.ok(
    questions.some((q) => q.includes('информационная система')),
    'нет вопроса про информационную систему',
  )
  assert.ok(
    questions.some((q) => q.includes('рутинные задачи') && q.includes('бизнес-процесс')),
    'нет вопроса про автоматизацию рутинных задач и бизнес-процессы',
  )

  // Ответы ведут на профильные страницы — иначе длинный хвост никуда не тянет.
  const links = HOME_FAQ.map((item) => item.link?.href)
  assert.ok(links.includes('/informatsionnaya-sistema.html'))
})

test('SEO-блок подвала — список, а не абзац-перечисление', () => {
  // Один абзац на ~100 слов со сплошным перечислением читался как переспам.
  const footer = homeTsx.slice(homeTsx.indexOf('16. SEO-текст в подвал'))
  assert.match(footer, /<ul className=/, 'подвальный SEO-блок должен быть списком')
  assert.match(footer, /информационных систем/)
  assert.match(footer, /Управление бизнес-процессами/)
  assert.match(footer, /to="\/informatsionnaya-sistema\.html"/)
})

test('снапшот главной несёт те же ключи в заголовках', () => {
  const work = mkdtempSync(resolve(tmpdir(), 'issue-518-'))
  mkdirSync(resolve(work, 'dist'), { recursive: true })
  mkdirSync(resolve(work, 'scripts'), { recursive: true })
  cpSync(resolve(repo, 'scripts/prerender-landing.mjs'), resolve(work, 'scripts/prerender-landing.mjs'))
  cpSync(resolve(repo, 'src/data'), resolve(work, 'src/data'), { recursive: true })
  writeFileSync(resolve(work, 'dist/index.html'), read('index.html'))
  execFileSync('node', ['scripts/prerender-landing.mjs'], { cwd: work })
  const out = readFileSync(resolve(work, 'dist/index.html'), 'utf8')

  const snapshotH2 = [...out.matchAll(/<h2[^>]*>([\s\S]*?)<\/h2>/g)]
    .map((m) => m[1].replace(/<[^>]+>/g, '').trim())
    .join(' | ')

  for (const phrase of ['информационные системы', 'управление бизнес-процессами', 'бизнес-процессов']) {
    assert.ok(
      snapshotH2.toLowerCase().includes(phrase.toLowerCase()),
      `ключ «${phrase}» не доехал до снапшота. Сейчас: ${snapshotH2}`,
    )
  }
})
