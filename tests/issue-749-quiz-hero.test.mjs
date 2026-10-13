// issue #749 — hero квиза /quiz.html: тематическая фоновая картинка про
// оценку разработки, промежуток под кнопкой «Рассчитать за 2 минуты» и
// надпись о немедленном ответе «Озвучим **сумму и срок сразу**, без регистрации».
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { existsSync, mkdirSync, mkdtempSync, cpSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { resolve } from 'node:path'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { HERO_IMAGE, HERO_INSTANT } from '../src/data/quizCalc.mjs'

const repo = fileURLToPath(new URL('..', import.meta.url))
const read = (p) => readFileSync(resolve(repo, p), 'utf8')
const page = read('src/pages/Quiz.tsx')

function prerender() {
  const work = mkdtempSync(resolve(tmpdir(), 'issue-749-'))
  mkdirSync(resolve(work, 'dist'), { recursive: true })
  mkdirSync(resolve(work, 'scripts'), { recursive: true })
  cpSync(resolve(repo, 'scripts/prerender-quiz.mjs'), resolve(work, 'scripts/prerender-quiz.mjs'))
  cpSync(resolve(repo, 'src/data'), resolve(work, 'src/data'), { recursive: true })
  writeFileSync(resolve(work, 'dist/index.html'), read('index.html'))
  execFileSync('node', ['scripts/prerender-quiz.mjs'], { cwd: work })
  return readFileSync(resolve(work, 'dist/quiz.html'), 'utf8')
}

test('надпись о немедленном ответе — дословно из задачи, выделена «сумма и срок сразу»', () => {
  assert.equal(
    HERO_INSTANT.before + HERO_INSTANT.strong + HERO_INSTANT.after,
    'Озвучим сумму и срок сразу, без регистрации',
  )
  assert.equal(HERO_INSTANT.strong, 'сумму и срок сразу')
  assert.match(page, /<strong[^>]*>\{HERO_INSTANT\.strong\}<\/strong>/)
  assert.ok(
    prerender().includes('Озвучим <strong>сумму и срок сразу</strong>, без регистрации'),
    'надписи нет в пререндере',
  )
})

test('надпись стоит под кнопкой «Рассчитать за 2 минуты» с отступом', () => {
  const button = page.indexOf('Рассчитать за 2 минуты')
  const instant = page.indexOf('{HERO_INSTANT.before}')
  assert.ok(button > 0 && instant > button, 'надпись должна идти после кнопки')
  const between = page.slice(button, instant)
  assert.match(between, /<\/button>\s*<p className="mt-\d/, 'под кнопкой нужен отступ (mt-*)')
})

test('у hero есть фоновая картинка, и файл лежит в public/', () => {
  assert.equal(HERO_IMAGE, '/quiz-hero.webp')
  assert.ok(existsSync(resolve(repo, 'public', HERO_IMAGE.slice(1))), 'нет public/quiz-hero.webp')
  assert.match(page, /<img\s+src=\{HERO_IMAGE\}\s+alt=""\s+aria-hidden="true"/)
  assert.ok(existsSync(resolve(repo, 'scripts/generate-quiz-hero.mjs')), 'нет генератора картинки')
})
