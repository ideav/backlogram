import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'

const articlePath = new URL(
  '../content/habr-effort-estimate/articles/skolko-chasov-stoit-promyshlennoe-prilozhenie.md',
  import.meta.url,
)

/**
 * Coverage for https://github.com/ideav/backlogram/issues/545
 *
 * Ориентирующие разделы («где ломается» и «сделаю сам с ИИ») читатель должен
 * увидеть до расчётов, а не после них. Порядок легко потерять при следующей
 * правке текста, поэтому он зафиксирован тестом.
 */

const body = readFileSync(articlePath, 'utf8').replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n/, '')

function at(heading) {
  const index = body.indexOf(heading)
  assert.notEqual(index, -1, `missing section: ${heading}`)
  return index
}

test('ориентирующие разделы стоят до первых чисел', () => {
  const breaks = at('## Где такие оценки ломаются')
  const ai = at('## Отдельно про «сделаю сам с ИИ»')

  // После вводной части «Откуда я смотрю на эту тему», где и звучит возражение.
  assert.ok(at('## Откуда я смотрю на эту тему') < breaks, 'после раздела об авторе')

  // И до инвентаризации системы, с которой начинаются счётчики и таблицы.
  for (const heading of [
    '## Что за система',
    '## Метод 1: снизу вверх, по действиям',
    '## Метод 2: функциональные точки и отраслевая производительность',
    '## Метод 3: COCOMO II',
    '## Сводка: три метода, один объём',
  ]) {
    assert.ok(breaks < at(heading), `«где ломается» должен идти до «${heading}»`)
    assert.ok(ai < at(heading), `«сделаю сам с ИИ» должен идти до «${heading}»`)
  }

  assert.ok(breaks < ai, 'порядок из тикета: сначала «где ломается», затем «сам с ИИ»')
})

test('перенесённые разделы не ссылаются на ещё не прочитанное', () => {
  const ai = body.slice(at('## Отдельно про «сделаю сам с ИИ»'), at('## Что за система'))

  // Раздел стоит до расчётов, поэтому «те же 90 действий» здесь читать нечем.
  assert.doesNotMatch(ai, /те же 90 действий/)
  assert.match(ai, /которые я считаю дальше/)

  // Сохранены все три подтверждающих источника про ИИ-сборку.
  for (const url of [
    'https://addyo.substack.com/p/the-70-problem-hard-truths-about',
    'https://arxiv.org/abs/2510.00328',
    'https://arxiv.org/abs/2601.20245',
  ]) {
    assert.ok(ai.includes(url), `источник должен переехать вместе с разделом: ${url}`)
  }
})
