import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'

/**
 * Подраздел «Кто на самом деле писал ТЗ и что туда просочилось» ссылается на
 * «следующий раздел» — на цифры 0,73 и 8,7 ч/FP. Ссылка вперёд живёт ровно до
 * первой перестановки разделов, поэтому она под тестом.
 */

const body = readFileSync(
  new URL(
    '../content/habr-effort-estimate/articles/skolko-chasov-stoit-promyshlennoe-prilozhenie.md',
    import.meta.url,
  ),
  'utf8',
).replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n/, '')

function at(heading) {
  const index = body.indexOf(heading)
  assert.notEqual(index, -1, `missing section: ${heading}`)
  return index
}

test('подраздел про авторство ТЗ стоит внутри первого метода', () => {
  const section = at('### Кто на самом деле писал ТЗ и что туда просочилось')

  assert.ok(at('## Метод 1: снизу вверх, по действиям') < section, 'после заголовка метода 1')
  assert.ok(section < at('## Метод 2: функциональные точки и отраслевая производительность'))

  // Вывод метода 1 остаётся замыкающим — подраздел не отрезает мост к методу 2.
  assert.ok(section < at('Это первый метод. Он честный'), 'мост к методу 2 идёт после подраздела')
})

test('«следующий раздел» действительно содержит 0,73 и 8,7 ч/FP', () => {
  const method2 = body.slice(
    at('## Метод 2: функциональные точки и отраслевая производительность'),
    at('## Метод 3: COCOMO II'),
  )

  assert.match(body.slice(at('### Кто на самом деле писал ТЗ')), /из следующего раздела/)
  for (const value of ['0,73', '8,7']) {
    assert.ok(method2.includes(value), `в методе 2 нет значения ${value}`)
  }
})
