#!/usr/bin/env node
/**
 * Коммерческий срез SEO-ядра в группы кампаний Excel-CPA (backlogram#593).
 *
 * Исходник — выгрузка ядра `*_keywords_all.csv` (31.07.2026, 19 тыс. строк:
 * «Направление;Ключевое слово;Частота Yandex;Частота Google;Подпапка»). Ядро
 * собиралось под SEO, поэтому больше половины его — справочные запросы
 * («информационная система это», «определение цифровой трансформации»).
 * Решение владельца 29.09: в рекламу берётся только коммерческий срез.
 *
 * Срез = фраза называет то, что можно купить (система, программа, учёт,
 * автоматизация, замена Excel…), в ней нет ни одного минус-слова кампании
 * (docs/marketing/excel-cpa-negatives.json) и у неё есть частотность. Второе
 * условие важно само по себе: минус-слово, совпавшее со словом ключа, молча
 * гасит этот ключ, поэтому фраза с ним в ядро не попадает вовсе.
 *
 *   node scripts/excel-cpa-import-core.mjs <keywords_all.csv>           # статистика
 *   node scripts/excel-cpa-import-core.mjs <keywords_all.csv> --write   # записать json
 */

import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const MARKETING = path.resolve(__dirname, '../docs/marketing')
export const CORE_FILE = path.join(MARKETING, 'excel-cpa-core.keywords.json')
export const NEGATIVES_FILE = path.join(MARKETING, 'excel-cpa-negatives.json')
const HAND_FILE = path.join(MARKETING, 'excel-cpa-campaign.keywords.json')

/** Директ: не больше 200 фраз в группе, 7 слов во фразе, 35 знаков в слове. */
export const GROUP_LIMIT = 200
const MAX_WORDS = 7
const MAX_WORD = 35
/** Ниже этой частотности фраза занимает место в группе и не приносит показов. */
export const MIN_FREQ = 5

/**
 * Вопросы «что это»: служебные слова Директ в минус-словах не учитывает, поэтому
 * такие фразы отсекаются здесь, на входе в ядро.
 */
const QUESTION = /(^| )(это|что|такое|какие|какой|какая|каких|каким|зачем|почему|чем|кто)( |$)/

/**
 * Подпапки ядра, справочные целиком: «информационная система и надёжность»,
 * «жизненный цикл ис», «структура и компоненты». Коммерческих слов в таких
 * фразах хватает («система», «разработка»), но ищет их студент, а не покупатель.
 */
export const INFO_FOLDERS = new Set([
  'Определения и понятия', 'Определения', 'Жизненный цикл', 'Структура и компоненты',
  'Назначение и функции', 'Основы', 'Технологии', 'Применение', 'Безопасность',
  'Персональные данные', 'Разработка и эксплуатация', 'Формулы Excel', 'Сводные таблицы',
])

/** Признак коммерческого запроса: человек называет то, что покупают. */
const PRODUCT = /excel|эксел|таблиц|уч[её]т|программ|приложени|систем|crm|срм|автоматизац|автоматизир|баз[аеуы]? данн|no.?code|low.?code|конструктор|сервис|платформ|внедрени|документооборот|купить|цен[аы]|стоимост|заказ|разработк|замен|аналог|вместо/

export function normalize(phrase) {
  return phrase
    .toLowerCase()
    .replace(/[^a-zа-яё0-9\s-]/g, ' ')
    .replace(/(^|\s)-+|-+(?=\s|$)/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Грубая основа русского слова. Директ сравнивает минус-слова по лемме; здесь
 * достаточно отрезать окончание, чтобы «систем», «системы», «системой» сошлись,
 * а «курс» и «курсовой» — нет (у Директа это тоже разные слова).
 */
export function stem(word) {
  if (word.length < 5) return word
  // Глаголы: «являются» и «являться», «включает» и «включать» — одно слово.
  const verb = word.replace(/(ся|сь)$/, '')
  if (verb !== word || /(ть|ешь|ишь)$/.test(word) || /[аяеиую](ет|ют)$/.test(word)) {
    return verb.replace(/(ть|ешь|ишь|ет|ют|ут|ит|ат|ят)$/, '')
  }
  return word.replace(/(иями|ями|ами|иях|ях|ах|ого|его|ому|ему|ыми|ими|ой|ей|ий|ый|ая|яя|ое|ее|ые|ие|ую|юю|ам|ям|ов|ев|а|я|о|е|ы|и|у|ю|ь|й)$/, '')
}

const words = phrase => phrase.split(' ').filter(Boolean)

/** Все минус-слова (одно- и многословные) плоским списком. */
export function loadNegatives(file = NEGATIVES_FILE) {
  const { categories } = JSON.parse(readFileSync(file, 'utf8'))
  return [...new Set(Object.values(categories).flat().map(normalize))]
}

/**
 * Одно ли это слово. Основа выше грубая, поэтому с запасом: совпадают и
 * основы, одна из которых продолжает другую на 1–2 буквы. Ложная тревога
 * здесь дешевле пропуска — пропущенный конфликт молча гасит ключ в Директе.
 */
export function sameWord(a, b) {
  const x = stem(a)
  const y = stem(b)
  if (x === y) return true
  const [short, long] = x.length <= y.length ? [x, y] : [y, x]
  return short.length >= 5 && long.startsWith(short) && long.length - short.length <= 2
}

/** Минус-фраза бьёт ключ, если все её слова есть в ключе. */
export function hits(phrase, minus) {
  const ws = words(phrase)
  return words(minus).every(m => ws.some(w => sameWord(w, m)))
}

export function parseCsv(text) {
  const out = new Map()
  const lines = text.replace(/^﻿/, '').split(/\r?\n/)
  for (const line of lines.slice(1)) {
    if (!line.trim()) continue
    const [direction, keyword, freqY, , folder = ''] = line.split(';')
    const phrase = normalize(keyword ?? '')
    if (!phrase) continue
    const freq = Number(freqY) || 0
    const prev = out.get(phrase)
    // Одна фраза лежит в нескольких подпапках — берём ту, где она частотнее,
    // а при равенстве ту, где подпапка названа.
    if (!prev || freq > prev.freq || (freq === prev.freq && !prev.folder && folder)) {
      out.set(phrase, { phrase, freq, direction: direction.trim(), folder: folder.trim() })
    }
  }
  return [...out.values()]
}

/** Отбор: коммерческое, частотное, влезает в ограничения Директа, без минус-слов. */
export function select(rows, negatives, taken = new Set()) {
  const kept = []
  const dropped = { info: 0, freq: 0, shape: 0, minus: 0, taken: 0 }
  const byMinus = new Map()
  for (const row of rows) {
    const ws = words(row.phrase)
    if (taken.has(row.phrase)) { dropped.taken++; continue }
    if (!PRODUCT.test(row.phrase) || QUESTION.test(row.phrase) || INFO_FOLDERS.has(row.folder)) { dropped.info++; continue }
    if (row.freq < MIN_FREQ) { dropped.freq++; continue }
    if (ws.length > MAX_WORDS || ws.some(w => w.length > MAX_WORD)) { dropped.shape++; continue }
    const hit = negatives.find(m => hits(row.phrase, m))
    if (hit) {
      dropped.minus++
      byMinus.set(hit, (byMinus.get(hit) ?? 0) + 1)
      continue
    }
    kept.push(row)
  }
  return { kept, dropped, byMinus }
}

function slugify(text) {
  const map = { а:'a',б:'b',в:'v',г:'g',д:'d',е:'e',ё:'e',ж:'zh',з:'z',и:'i',й:'y',к:'k',л:'l',м:'m',н:'n',о:'o',п:'p',р:'r',с:'s',т:'t',у:'u',ф:'f',х:'h',ц:'c',ч:'ch',ш:'sh',щ:'sch',ы:'y',э:'e',ю:'yu',я:'ya' }
  return text.toLowerCase().split('').map(c => map[c] ?? (/[a-z0-9]/.test(c) ? c : '-')).join('')
    .replace(/-+/g, '-').replace(/^-|-$/g, '').slice(0, 40)
}

/**
 * Группы — по подпапкам ядра (внутри направления фразы про одно и то же, им
 * подходит одно объявление), самые частотные первыми, кусками по 200.
 */
export function toGroups(kept) {
  const buckets = new Map()
  for (const row of kept) {
    const key = row.folder || row.direction
    if (!buckets.has(key)) buckets.set(key, [])
    buckets.get(key).push(row)
  }
  const groups = []
  for (const [key, rows] of [...buckets].sort((a, b) => b[1].length - a[1].length)) {
    rows.sort((a, b) => b.freq - a.freq || a.phrase.localeCompare(b.phrase))
    for (let i = 0; i < rows.length; i += GROUP_LIMIT) {
      const part = i / GROUP_LIMIT + 1
      const many = rows.length > GROUP_LIMIT
      groups.push({
        slug: `core-${slugify(key)}${many ? `-${part}` : ''}`,
        name: `Ядро: ${key}${many ? ` ${part}` : ''}`.slice(0, 255),
        keywords: rows.slice(i, i + GROUP_LIMIT).map(r => r.phrase),
        minusWords: [],
      })
    }
  }
  return groups
}

function main() {
  const csv = process.argv.slice(2).find(a => !a.startsWith('--'))
  if (!csv) {
    console.error('Укажите путь к выгрузке ядра: node scripts/excel-cpa-import-core.mjs <keywords_all.csv>')
    process.exit(1)
  }
  const negatives = loadNegatives()
  const hand = JSON.parse(readFileSync(HAND_FILE, 'utf8'))
  const taken = new Set(hand.groups.flatMap(g => g.keywords).map(normalize))

  const rows = parseCsv(readFileSync(csv, 'utf8'))
  const { kept, dropped, byMinus } = select(rows, negatives, taken)
  const groups = toGroups(kept)

  console.log(`уникальных фраз в ядре: ${rows.length}`)
  console.log(`отброшено: справочные ${dropped.info}, частота < ${MIN_FREQ}: ${dropped.freq}, длина: ${dropped.shape}, минус-слова: ${dropped.minus}, уже в ручных группах: ${dropped.taken}`)
  console.log(`в срез: ${kept.length} фраз, ${groups.length} групп; минус-слов: ${negatives.length}`)
  console.log('\nсильнее всего режут минус-слова:')
  for (const [m, n] of [...byMinus].sort((a, b) => b[1] - a[1]).slice(0, 40)) console.log(`  ${n}\t${m}`)

  const handHits = []
  for (const phrase of taken) for (const m of negatives) if (hits(phrase, m)) handHits.push(`${m} → ${phrase}`)
  console.log(`\nконфликтов с ручными группами: ${handHits.length}`)
  for (const h of handHits) console.log('  ' + h)

  if (process.argv.includes('--write')) {
    writeFileSync(CORE_FILE, JSON.stringify({
      _comment: 'Коммерческий срез SEO-ядра (выгрузка 31.07.2026) для кампаний Excel-CPA. Генерируется scripts/excel-cpa-import-core.mjs — руками не править.',
      minFreq: MIN_FREQ,
      groups,
    }, null, 2) + '\n')
    console.log(`\nзаписано: ${path.relative(process.cwd(), CORE_FILE)}`)
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main()
