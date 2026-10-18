// issue #771 — «Путь адепта»: перед «Что получил заказчик» у ПакЛайна рассказать,
// как делались доработки. Пожелания заказчик завёл задачами по шаблону (crm#4840–4845),
// мы выполнили их одной задачей агенту (crm#4872, PR #4873). Сейчас это делается
// в ИИ-чате приложения, но в тот раз было не так — страница не должна утверждать обратное.
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync, cpSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { resolve } from 'node:path'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { CASES, LINKS } from '../src/data/adeptPath.mjs'

const repo = fileURLToPath(new URL('..', import.meta.url))
const read = (p) => readFileSync(resolve(repo, p), 'utf8')

function prerender() {
  const work = mkdtempSync(resolve(tmpdir(), 'issue-771-'))
  mkdirSync(resolve(work, 'dist'), { recursive: true })
  mkdirSync(resolve(work, 'scripts'), { recursive: true })
  cpSync(resolve(repo, 'scripts/prerender-put-adepta.mjs'), resolve(work, 'scripts/prerender-put-adepta.mjs'))
  cpSync(resolve(repo, 'src/data'), resolve(work, 'src/data'), { recursive: true })
  writeFileSync(resolve(work, 'dist/index.html'), read('index.html'))
  execFileSync('node', ['scripts/prerender-put-adepta.mjs'], { cwd: work })
  return readFileSync(resolve(work, 'dist/put-adepta.html'), 'utf8')
}

const pakline = CASES.find((c) => c.key === 'pakline')

test('у ПакЛайна есть рассказ о доработках: шесть пожеланий, одна задача агенту, ссылки-доказательства', () => {
  const r = pakline.rework
  assert.ok(r, 'нет блока rework')
  assert.equal(r.wishes.length, 6, 'пожеланий было шесть (crm#4840–4845)')
  assert.match(r.intro, /шаблон/)
  assert.match(r.intro, /свободн/)
  assert.match(r.how, /одну задачу/)
  assert.match(r.note, /нехитрое/)
  assert.match(r.note, /ИИ-чате приложения/)
  assert.match(r.note, /не было/)
  assert.deepEqual(
    r.links.map((l) => l.href),
    [LINKS.paklineWishes, LINKS.paklineReworkTask, LINKS.paklineReworkPr],
  )
  assert.match(LINKS.paklineWishes, /author%3Af0rmatceft/)
  assert.match(LINKS.paklineReworkTask, /crm\/issues\/4872$/)
})

test('путь больше не утверждает, что доработки той фазы делались в ИИ-чате', () => {
  const t = pakline.timeline.map((s) => s.t).join(' ')
  assert.doesNotMatch(t, /доработки проведены прямо в ИИ-чате/)
  assert.doesNotMatch(pakline.phases.map((p) => p.name).join(' '), /ИИ-чат/)
})

test('и в SPA, и в снапшоте «Как делались доработки» стоит перед «Что получил заказчик»', () => {
  const page = read('src/pages/AdeptPath.tsx')
  assert.ok(page.indexOf('Как делались доработки') < page.indexOf('Что получил заказчик'))
  const out = prerender()
  const section = out.slice(out.indexOf('id="case-pakline"'), out.indexOf('id="case-spz"'))
  const i = section.indexOf('Как делались доработки')
  assert.ok(i > 0, 'в снапшоте нет блока о доработках')
  assert.ok(i < section.indexOf('Что получил заказчик'))
  assert.ok(section.includes('https://github.com/ideav/crm/issues/4872'))
  // у СПЗ такого блока нет
  assert.ok(!out.slice(out.indexOf('id="case-spz"')).includes('Как делались доработки'))
})
