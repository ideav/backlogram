// backlogram#921 — на /ocenka-po-inn заметно сказать, как в решении используется ИИ:
// основное — запуск ИИ-агентами, редко — текучка, совсем редко — модели (векторы, поиск похожих).
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { LOSS_LANDINGS } from '../src/data/lossLandings.mjs'

const repo = fileURLToPath(new URL('..', import.meta.url))
const page = LOSS_LANDINGS.find((p) => p.slug === 'ocenka-po-inn')

test('блок про ИИ: три варианта по убыванию частоты', () => {
  assert.ok(page.ai)
  assert.deepEqual(page.ai.items.map((i) => i.freq), ['Основное', 'Редко', 'Совсем редко'])
  assert.match(page.ai.items[0].title, /ИИ-агенты/)
  assert.match(page.ai.items[0].title, /запуска/)
  assert.match(page.ai.items[1].title, /текучк/)
  assert.match(page.ai.items[2].text, /[Вв]екториз/)
  assert.match(page.ai.items[2].text, /эмбеддинг/)
  assert.match(page.ai.items[2].text, /похож/)
})

test('заметно: плашка в шапке ведёт на секцию #ai', () => {
  const tsx = readFileSync(resolve(repo, 'src/pages/LossLanding.tsx'), 'utf8')
  assert.ok(tsx.includes('href="#ai"'))
  assert.ok(tsx.includes('id="ai"'))
  const hero = tsx.indexOf('href="#ai"'), h1 = tsx.indexOf('<motion.h1')
  assert.ok(hero > 0 && hero < h1, 'плашка — над заголовком')
})
