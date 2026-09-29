import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

import { CORE_FILE, GROUP_LIMIT, hits, loadNegatives, normalize, sameWord } from '../scripts/excel-cpa-import-core.mjs'

const read = p => JSON.parse(readFileSync(new URL(p, import.meta.url), 'utf8'))
const core = JSON.parse(readFileSync(CORE_FILE, 'utf8'))
const hand = read('../docs/marketing/excel-cpa-campaign.keywords.json')
const negatives = loadNegatives()
const all = [...hand.groups, ...core.groups]

test('срез ядра: группы в лимите Директа, фраз много', () => {
  const phrases = core.groups.flatMap(g => g.keywords)
  assert.ok(phrases.length >= 1500, `в срезе всего ${phrases.length} фраз`)
  for (const group of core.groups) {
    assert.ok(group.keywords.length <= GROUP_LIMIT, `${group.name}: ${group.keywords.length} > ${GROUP_LIMIT}`)
    assert.ok(group.name.length <= 255)
    for (const phrase of group.keywords) {
      const words = phrase.split(' ')
      assert.ok(words.length <= 7, `«${phrase}»: больше 7 слов`)
      assert.ok(words.every(w => w.length <= 35), `«${phrase}»: слово длиннее 35`)
      assert.match(phrase, /^[a-zа-яё0-9 -]+$/, `«${phrase}»: недопустимые символы`)
    }
  }
})

test('ни одна фраза не повторяется между группами и слаги уникальны', () => {
  const seen = new Set()
  for (const phrase of all.flatMap(g => g.keywords).map(normalize)) {
    assert.ok(!seen.has(phrase), `«${phrase}» повторяется`)
    seen.add(phrase)
  }
  const slugs = all.map(g => g.slug)
  assert.equal(new Set(slugs).size, slugs.length)
})

test('минус-слова кампании не гасят ни одной собственной фразы', () => {
  // Директ режет по всем словоформам: минус «журнал» молча выключил бы
  // «журнал учета заявок». Проверка — по основе слова, с запасом.
  for (const phrase of all.flatMap(g => g.keywords)) {
    const hit = negatives.find(m => hits(normalize(phrase), m))
    assert.ok(!hit, `минус «${hit}» гасит фразу «${phrase}»`)
  }
})

test('в срез не попали вопросы «что это»', () => {
  for (const phrase of core.groups.flatMap(g => g.keywords)) {
    assert.doesNotMatch(phrase, /(^| )(это|что|такое|какие|зачем|почему)( |$)/, phrase)
  }
})

test('минус-слова влезают в ограничения Директа', () => {
  // На кампанию — не больше 20 000 знаков минус-фраз, во фразе — до 7 слов.
  assert.ok(negatives.join(' ').length < 20000)
  for (const minus of negatives) {
    assert.ok(minus.split(' ').length <= 7, minus)
    assert.match(minus, /^[a-zа-яё0-9 -]+$/, `«${minus}»: недопустимые символы`)
  }
})

test('сравнительные запросы и конкуренты не минусуются', () => {
  for (const word of ['лучший', 'рейтинг', 'отзыв', 'сравнение', 'битрикс24', 'бесплатно', 'журнал', 'работа', 'график', '1с']) {
    assert.ok(!negatives.includes(word), `«${word}» в минус-словах`)
  }
})

test('сравнение слов сводит формы, но не разные слова', () => {
  assert.ok(sameWord('системы', 'систем'))
  assert.ok(sameWord('системой', 'система'))
  assert.ok(sameWord('являются', 'являться'))
  assert.ok(sameWord('включает', 'включать'))
  assert.ok(sameWord('журнал', 'журнала'))
  assert.ok(!sameWord('курс', 'курсовой'))
  assert.ok(!sameWord('учет', 'учетный'))
})
