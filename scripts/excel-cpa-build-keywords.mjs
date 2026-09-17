#!/usr/bin/env node
/**
 * Сборка семантического ядра кампании «Excel → приложение» (см.
 * docs/marketing/excel-cpa-campaign.md).
 *
 * Зачем скрипт, а не руками. Группа в Директе держит до 200 фраз, а при оплате
 * за конверсии охват — единственный рычаг: стратегии нужно порядка десяти
 * конверсий в неделю, иначе Директ душит показы. Собрать 400 фраз руками и не
 * наплодить дублей и мёртвых хвостов невозможно, поэтому фразы собираются из
 * шаблонов и объектов, а потом каждая проверяется на реальный охват через
 * keywordsresearch.hasSearchVolume — фраза без показов занимает место в группе
 * и не приносит ничего.
 *
 * Мусорной группы здесь нет намеренно. Прежняя схема брала широкий офисный
 * мусор («калькулятор отпускных», «mind map», «производственный календарь»),
 * потому что при оплате за конверсии клик бесплатен. От неё отказались:
 * охват такие фразы дают, а конверсий не дают никогда и только зашумляют
 * обучение стратегии. Взамен до лимита расширены две осмысленные группы.
 *
 *   node scripts/excel-cpa-build-keywords.mjs            # собрать и проверить охват
 *   node scripts/excel-cpa-build-keywords.mjs --write    # записать keywords.json
 *
 * Окружение: DIRECT_TOKEN — токен кабинета (нужен только для проверки охвата).
 */

import { writeFileSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const API = 'https://api.direct.yandex.com/json/v5'
const RUSSIA = 225
const LIMIT = 200

const write = process.argv.includes('--write')
const token = process.env.DIRECT_TOKEN ?? ''

/** Раскрыть шаблоны вида ['учет %s в excel'] по списку объектов. */
export function expand(templates, objects) {
  const out = []
  for (const template of templates) {
    for (const object of objects) out.push(template.replace('%s', object))
  }
  return out
}

/** Нормализация: Директ не различает регистр, лишние пробелы — наши дубли. */
export function normalize(phrase) {
  return phrase.toLowerCase().replace(/\s+/g, ' ').trim()
}

/** Убрать дубли внутри списка и всё, что уже занято другой группой. */
export function dedupe(phrases, taken = new Set()) {
  const out = []
  for (const phrase of phrases.map(normalize)) {
    if (!phrase || taken.has(phrase)) continue
    taken.add(phrase)
    out.push(phrase)
  }
  return out
}

// ── Группа 1: горячие ────────────────────────────────────────────────────────
// Человек уже понял, чего хочет: уйти с таблиц на нормальную программу.

const HOT_CORE = [
  'excel в приложение', 'из excel сделать программу', 'из excel сделать приложение',
  'сделать приложение из excel', 'сделать программу из таблицы', 'приложение из таблицы excel',
  'веб приложение из excel', 'веб приложение из таблицы', 'сайт из excel таблицы',
  'база данных вместо excel', 'программа вместо excel', 'заменить excel на программу',
  'чем заменить excel', 'замена excel', 'уйти от excel', 'отказаться от excel',
  'перейти с excel на базу данных', 'перенести excel в базу данных',
  'перенести таблицу в базу данных', 'конвертировать excel в базу данных',
  'импорт excel в базу данных', 'excel в базу данных онлайн',
  'crm из excel', 'crm вместо excel', 'сделать crm из таблицы', 'erp вместо excel',
  'учетная система вместо excel', 'программа учета вместо excel',
  'excel для совместной работы', 'общая таблица для сотрудников',
  'совместная работа в excel онлайн', 'одновременная работа в excel',
  'excel не справляется', 'excel тормозит большая таблица', 'excel слишком большой файл',
  'excel виснет большая таблица', 'ограничение строк в excel',
  'автоматизация учета в excel', 'автоматизировать excel', 'автоматизация таблиц excel',
  'автоматизация отчетов в excel', 'автоматизация учета на предприятии',
  'учет в таблицах excel на производстве', 'учет на производстве в excel',
  'заказать программу учета', 'разработка программы учета', 'программа учета на заказ',
  'разработка базы данных на заказ', 'создать базу данных для учета',
  'создать базу данных онлайн', 'своя база данных для бизнеса',
  'программа для учета заявок', 'программа для складского учета на заказ',
  'приложение для учета на предприятии', 'приложение для учета заявок',
  'внутренний портал для сотрудников', 'система учета для малого бизнеса',
  'excel или база данных', 'excel или crm', 'excel или 1с',
]

// Тот же смысл через «превратить/перевести/оцифровать» — так спрашивают чаще,
// чем кажется, и это те же люди.
const HOT_PATTERNS = expand(
  [
    'перевести %s в базу данных',
    'оцифровать %s',
    'автоматизировать %s',
    'программа вместо %s',
  ],
  ['excel', 'эксель', 'таблицы', 'excel таблицы', 'гугл таблицы', 'учет в excel'],
)

// Человек ищет готовую программу под свой процесс — то есть уже согласен, что
// таблицы не хватает. Это самый коммерческий спрос в ядре, поэтому шаблоны
// раскрываются по всем процессам, которые сервис закрывает.
const HOT_PROGRAM = expand(
  [
    'программа для учета %s',
    'приложение для учета %s',
    'система учета %s',
    'база данных для учета %s',
    'онлайн учет %s',
    'программа для ведения учета %s',
  ],
  [
    'заявок', 'заказов', 'клиентов', 'склада', 'товаров', 'материалов', 'договоров',
    'сотрудников', 'рабочего времени', 'ремонта', 'оборудования', 'транспорта',
    'документов', 'задач', 'продаж', 'услуг', 'работ', 'остатков', 'закупок',
  ],
)

// ── Группа 2: смежная боль ───────────────────────────────────────────────────
// Человек ведёт процесс в таблице и ищет, как этот процесс вести. Про нас он
// ещё не думает — но таблица у него на экране прямо сейчас.
//
// Граница с выброшенным мусором проходит здесь: берём того, кто ВЕДЁТ учёт
// («учет заявок в excel», «журнал сменных отчетов»), и не берём того, кому
// нужен разовый документ («приказ образец», «должностная инструкция»).

const PAIN_OBJECTS = [
  'заявок', 'заказов', 'клиентов', 'договоров', 'материалов', 'товаров', 'остатков',
  'поставок', 'закупок', 'расходов', 'рабочего времени', 'сотрудников', 'персонала',
  'сменных отчетов', 'простоев оборудования', 'ремонта оборудования', 'оборудования',
  'спецодежды', 'инструмента', 'транспорта', 'путевых листов', 'топлива', 'брака',
  'качества', 'отгрузок', 'продукции', 'выпуска продукции', 'смен', 'командировок',
  'объектов', 'работ', 'услуг', 'счетов', 'платежей', 'актов', 'инвентаря',
  'обращений', 'задач', 'поручений', 'документов',
]

const PAIN_PATTERNS = expand(
  ['учет %s в excel', 'журнал учета %s', 'таблица учета %s', 'реестр %s excel', 'ведомость %s'],
  PAIN_OBJECTS,
)

const PAIN_CORE = [
  'журнал сменных отчетов', 'сменный отчет на производстве', 'отчет мастера смены',
  'табель учета рабочего времени excel', 'график работы смен excel', 'график сменности excel',
  'складской учет в excel', 'складской учет в таблице', 'складской учет без 1с',
  'учет остатков на складе excel', 'приход расход excel таблица',
  'ведомость контроля качества', 'журнал контроля качества', 'чек лист на производстве',
  'учет простоев оборудования', 'график ппр excel', 'журнал ремонта оборудования',
  'учет заявок на ремонт', 'заявки на закупку таблица', 'спецификация в excel',
  'акт выполненных работ таблица', 'смета в excel', 'калькуляция в excel',
  'план производства в excel', 'планирование производства excel',
  'график выполнения работ excel', 'диаграмма ганта в excel',
  'учет рабочего времени сотрудников программа', 'учет заказов в excel',
  'база клиентов в excel', 'клиентская база в таблице', 'воронка продаж в excel',
  'отчет по продажам в excel', 'бюджет проекта в excel', 'управленческий учет в excel',
]

// ── Проверка охвата ──────────────────────────────────────────────────────────

/** Запрос к API через curl: node-овский fetch не проходит через tun-прокси. */
function call(service, body) {
  const args = [
    '-sS', '-m', '180', '-X', 'POST', `${API}/${service}`,
    '-H', `Authorization: Bearer ${token}`,
    '-H', 'Accept-Language: ru',
    '-H', 'Content-Type: application/json; charset=utf-8',
    '--data-binary', '@-',
  ]
  const result = spawnSync('curl', args, { input: body, encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 })
  if (result.error || result.status !== 0) throw new Error('curl не смог выполнить запрос')
  const parsed = JSON.parse(result.stdout)
  if (parsed.error) throw new Error(`${parsed.error.error_string}: ${parsed.error.error_detail}`)
  return parsed.result
}

/** Какие из фраз реально что-то ищут. Директ отвечает булевым флагом на фразу. */
export async function withVolume(phrases, chunkSize = 100) {
  const alive = []
  for (let i = 0; i < phrases.length; i += chunkSize) {
    const chunk = phrases.slice(i, i + chunkSize)
    const body = JSON.stringify({
      method: 'hasSearchVolume',
      params: {
        SelectionCriteria: { Keywords: chunk, RegionIds: [RUSSIA] },
        FieldNames: ['Keyword', 'AllDevices'],
      },
    })
    const { HasSearchVolumeResults: results = [] } = call('keywordsresearch', body)
    for (const row of results) if (row.AllDevices) alive.push(row.Keyword)
    process.stdout.write(`  проверено ${Math.min(i + chunkSize, phrases.length)}/${phrases.length}\r`)
  }
  console.log('')
  return alive
}

async function main() {
  const taken = new Set()
  const hot = dedupe([...HOT_CORE, ...HOT_PROGRAM, ...HOT_PATTERNS], taken)
  const pain = dedupe([...PAIN_CORE, ...PAIN_PATTERNS], taken)
  console.log(`кандидатов: горячие ${hot.length}, смежная боль ${pain.length}`)

  if (!token) {
    console.error('DIRECT_TOKEN не задан — охват не проверить')
    process.exit(1)
  }

  console.log('Горячие: проверка охвата')
  const hotAlive = (await withVolume(hot)).slice(0, LIMIT)
  console.log('Смежная боль: проверка охвата')
  const painAlive = (await withVolume(pain)).slice(0, LIMIT)

  console.log(`\nс охватом: горячие ${hotAlive.length} из ${hot.length}, смежная боль ${painAlive.length} из ${pain.length}`)
  const dead = [...hot.filter(p => !hotAlive.includes(p)), ...pain.filter(p => !painAlive.includes(p))]
  if (dead.length) console.log(`отброшено без показов (${dead.length}): ${dead.slice(0, 12).join(' | ')}${dead.length > 12 ? ' …' : ''}`)

  const data = {
    _comment: 'Канонические списки фраз для кампании с оплатой за конверсии (docs/marketing/excel-cpa-campaign.md). Собирается scripts/excel-cpa-build-keywords.mjs, читается scripts/direct-create-cpa-campaign.mjs. Лимит Директа — 200 фраз на группу.',
    groups: [
      {
        name: 'Горячие',
        slug: 'hot',
        minusWords: ['работа', 'вакансии', 'курсы', 'обучение', 'скачать', 'бесплатно', 'урок'],
        keywords: hotAlive,
      },
      {
        // Минус-слов почти нет: при оплате за конверсии лишний клик стоит ноль,
        // и резать охват здесь незачем. Убираем только соискателей и учащихся —
        // эти не станут клиентами никогда.
        name: 'Смежная боль',
        slug: 'pain',
        minusWords: ['вакансии', 'работа', 'курсы', 'обучение', 'резюме'],
        keywords: painAlive,
      },
    ],
  }

  if (!write) {
    console.log('\nСухой прогон. Повторите с --write, чтобы записать keywords.json')
    return
  }
  const file = path.resolve(fileURLToPath(new URL('../docs/marketing/excel-cpa-campaign.keywords.json', import.meta.url)))
  writeFileSync(file, JSON.stringify(data, null, 2) + '\n', 'utf8')
  console.log(`\nЗаписано: ${file}`)
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch(error => { console.error('\n' + error.message); process.exit(1) })
}
