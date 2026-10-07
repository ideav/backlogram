// Issue #655: формулы и макросы на excel-to-app.ru подаются как преимущество
// («наводим порядок»), а не как оговорка «сами не переезжают».
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const read = rel => readFileSync(fileURLToPath(new URL(rel, import.meta.url)), 'utf8')

const content = read('../site-excel/src/content.ts')
const how = read('../site-excel/src/HowItWorks.tsx')
const compare = read('../site-excel/src/pages/ComparePage.tsx')

test('оговорки «не переезжают» на сайте больше нет', () => {
  for (const src of [content, how, compare]) {
    assert.doesNotMatch(src, /не переезжают/)
    assert.doesNotMatch(src, /граница(ми)? автоматизации/)
  }
})

test('блок FORMULAS подаёт пересборку логики как преимущество', () => {
  assert.match(content, /export const FORMULAS/)
  assert.match(content, /Формулы и макросы не копируем, а наводим в них порядок/)
  assert.match(content, /Расчёт остаётся тем же, что и в вашем Excel/)
  assert.match(content, /показываем на демонстрации, на ваших данных/)
})

test('блок стоит на главной и на странице сравнения', () => {
  assert.match(how, /export function FormulasNote\(\)/)
  assert.match(how, /<FormulasNote \/>/)
  assert.match(compare, /<FormulasNote \/>/)
})
