import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { test } from 'node:test'

const manifestPath = new URL('../content/habr-effort-estimate/manifest.json', import.meta.url)
const articlePath = new URL(
  '../content/habr-effort-estimate/articles/skolko-chasov-stoit-promyshlennoe-prilozhenie.md',
  import.meta.url,
)

/**
 * Coverage for https://github.com/ideav/backlogram/issues/506
 *
 * Habr-версия блоговой статьи об оценке трудоёмкости. Тикет ставит два
 * условия, и оба проверяемы автоматически:
 *
 *  1. «Убрать всё, что похоже на рекламу» — в теле статьи не должно быть
 *     названий компании/продукта и ссылок на свои домены;
 *  2. «Расчёты более развёрнуто и подтверждённо» — арифметика в статье
 *     должна сходиться, а внешние цифры иметь ссылку на источник.
 *
 * Второй пункт тест проверяет буквально: он парсит таблицы функциональных
 * точек и оценки снизу вверх прямо из markdown и пересчитывает их.
 */

const manifest = existsSync(manifestPath) ? JSON.parse(readFileSync(manifestPath, 'utf8')) : null
const article = existsSync(articlePath) ? readFileSync(articlePath, 'utf8') : ''
const body = article.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n/, '')

/** Разбирает строку markdown-таблицы в массив ячеек. */
function cells(line) {
  return line
    .trim()
    .replace(/^\|/, '')
    .replace(/\|$/, '')
    .split('|')
    .map((c) => c.trim())
}

/** Вычисляет выражение вида «6×10 + 4×7». */
function evalWeights(expr) {
  return expr
    .split('+')
    .map((part) => part.trim().split('×').map((n) => Number(n.trim())))
    .reduce((sum, [count, weight]) => sum + count * weight, 0)
}

function tableRows(prefixes) {
  return body
    .split('\n')
    .filter((line) => line.startsWith('|'))
    .map(cells)
    .filter((row) => prefixes.some((p) => row[0] === p))
}

test('пакет habr-effort-estimate описан манифестом', () => {
  assert.ok(manifest, 'expected content/habr-effort-estimate/manifest.json')

  assert.equal(manifest.pipeline, 'habr-effort-estimate')
  assert.equal(manifest.format, 'habr_analytical')
  assert.deepEqual(manifest.targetPlatforms, ['Habr'])
  assert.equal(manifest.sourceArticle, 'promyshlennoe-prilozhenie-shansy-riski-trudoemkost')
  assert.equal(manifest.articlePath, 'articles/skolko-chasov-stoit-promyshlennoe-prilozhenie.md')
  assert.ok(existsSync(articlePath), 'articlePath must point at an existing draft')

  // Политика без рекламы — часть контракта пакета, а не пожелание.
  assert.equal(manifest.promoPolicy.productMentions, 0)
  assert.equal(manifest.promoPolicy.outboundProductLinks, 0)

  // Каждая внешняя цифра статьи должна быть привязана к проверенному источнику.
  const sources = manifest.verifiedSources.map((s) => s.url)
  for (const url of sources) assert.ok(body.includes(url) || url.includes('isbsg.org'), url)
  assert.ok(sources.length >= 5, 'ожидаем список проверенных источников')
})

test('в теле статьи нет рекламы: ни продукта, ни компании, ни ссылок на свои домены', () => {
  assert.doesNotMatch(body, /Интеграм/i)
  assert.doesNotMatch(body, /Integram/i)
  assert.doesNotMatch(body, /ideav\.(ru|online|io)/i)
  assert.doesNotMatch(body, /blog\.ideav/i)

  // Аффилиация при этом раскрыта — иначе текст читается как скрытое промо.
  // Формулировку автор смягчил (коммит 4fec250): прямых слов «конфликт
  // интересов» больше нет, раскрытие держится на двух фактах ниже.
  assert.match(body, /## Откуда я смотрю на эту тему/)
  assert.match(body, /занимаюсь low-code-платформой/i)
  assert.match(body, /к конкретной платформе не привязаны/i)
})

test('таблица функциональных точек сходится: строки, UFP и AFP', () => {
  const rows = tableRows(['ILF', 'EIF', 'EI', 'EO', 'EQ'])
  assert.equal(rows.length, 5, 'ожидаем пять типов функций IFPUG')

  let ufp = 0
  for (const row of rows) {
    const expr = row[2]
    const stated = Number(row[3])
    assert.equal(evalWeights(expr), stated, `строка ${row[0]}: ${expr} ≠ ${stated}`)
    ufp += stated
  }

  const statedUfp = Number(tableRows(['**UFP**'])[0].at(-1).replace(/\*/g, ''))
  assert.equal(ufp, statedUfp, `сумма строк ${ufp} ≠ заявленному UFP ${statedUfp}`)
  assert.equal(statedUfp, 392)

  // VAF = 0,65 + 0,01 × TDI; TDI = 40 → 1,05.
  assert.match(body, /VAF = 0,65 \+ 0,01 × TDI/)
  assert.match(body, /TDI ≈ 40, то есть VAF = 1,05/)
  const afp = Number(body.match(/AFP = 392 × 1,05 ≈ (\d+)/)[1])
  assert.equal(afp, Math.round(statedUfp * 1.05))
  assert.equal(afp, 412)
})

test('оценка снизу вверх сходится: классы действий, сумма и чувствительность', () => {
  const rows = tableRows(['Простое (CRUD по справочнику, переключатель, фильтр)'])
    .concat(tableRows(['Среднее (форма с расчётом, список с правами, экспорт)']))
    .concat(
      tableRows([
        'Тяжёлое (экономика со снапшотами, ролевая матрица, офлайн-очередь, сведение отчёта)',
      ]),
    )
  assert.equal(rows.length, 3, 'ожидаем три класса действий')

  let actions = 0
  let hours = 0
  for (const row of rows) {
    const [, , count, perAction, total] = row.map((c) => c.replace(/\*/g, ''))
    assert.equal(
      Number(count) * Number(perAction),
      Number(total),
      `класс ${row[0]}: ${count} × ${perAction} ≠ ${total}`,
    )
    actions += Number(count)
    hours += Number(total)
  }

  assert.equal(actions, 90, 'классы должны покрывать все 90 действий')
  assert.equal(hours, 306)

  // Итоговая строка именно этой таблицы (строк «Итого» в статье несколько).
  assert.ok(
    body.includes(`| **Итого** | | **${actions}** | | **${hours}** |`),
    `итоговая строка должна быть «${actions} действий → ${hours} ч»`,
  )

  // Чувствительность модели пересчитана честно.
  assert.ok(body.includes('**354 ч**'), '12 тяжёлых действий: 54 + 108 + 12×16 = 354')
  assert.equal(54 * 1 + 27 * 4 + 12 * 16, 354)
  assert.ok(body.includes('**333 ч**'), 'простые по 1,5 ч: 54×1,5 + 108 + 144 = 333')
  assert.equal(54 * 1.5 + 27 * 4 + 9 * 16, 333)
})

test('перевод в отраслевую шкалу PDR пересчитан верно', () => {
  const afp = 412
  // ISBSG: медиана Java 8,7 ч/FP и P90 low-code 2,4 ч/FP.
  assert.ok(Math.abs(afp * 8.7 - 3600) < 100, 'Java-медиана ≈ 3 600 ч')
  assert.ok(Math.abs(afp * 2.4 - 990) < 20, 'low-code P90 ≈ 990 ч')
  assert.match(body, /≈ 3 600 ч/)
  assert.match(body, /≈ 990 ч/)
  assert.match(body, /≈ 10 000 ч/)

  // Собственные оценки в той же шкале: 300 / 412 = 0,73 ч/FP.
  assert.equal(Number((300 / afp).toFixed(2)), 0.73)
  assert.match(body, /\*\*0,73\*\*/)
  assert.match(body, /ниже минимума всей low-code-выборки/)

  // Источник цифр ISBSG — прямая ссылка на PDF.
  assert.match(body, /isbsg\.org\/wp-content\/uploads\/2022\/05\/Short-Paper-2021-12/)
  assert.match(body, /648 Java-проектов и 58 low-code-проектов/)
})

test('COCOMO II посчитан по формуле из манула', () => {
  assert.match(body, /PM = 2,94 × KSLOC\^E × EAF/)
  assert.match(body, /E ≈ 1,0997/)
  assert.match(body, /152 часам/)

  const ksloc = (412 * 50) / 1000
  const pm = 2.94 * ksloc ** 1.0997
  assert.ok(Math.abs(ksloc - 20.6) < 0.1, 'KSLOC ≈ 20,6')
  assert.ok(Math.abs(pm - 82) < 1, 'PM ≈ 82')
  assert.ok(Math.abs(pm * 152 - 12400) < 200, 'номинал ≈ 12 400 ч')
  assert.match(body, /\*\*20,6 KSLOC\*\*/)
  assert.match(body, /\*\*82 человеко-месяца\*\* ≈ \*\*12 400 часов\*\*/)

  for (const [eaf, hours] of [
    [0.4, 5000],
    [0.5, 6200],
    [0.6, 7500],
  ]) {
    assert.ok(Math.abs(pm * eaf * 152 - hours) < 150, `EAF ${eaf} → ≈ ${hours} ч`)
  }
})

test('структура habr-черновика по конвенции пакета', () => {
  assert.match(article, /^pipeline: habr-effort-estimate$/m)
  assert.match(article, /^status: author_review$/m)
  assert.match(article, /^format: habr_analytical$/m)

  for (const heading of [
    '## TL;DR',
    '## Откуда я смотрю на эту тему',
    '## Что хотел заказчик',
    '## Метод 1: снизу вверх, по действиям',
    '## Метод 2: функциональные точки и отраслевая производительность',
    '## Метод 3: COCOMO II',
    '## Сводка: три метода, один объём',
    '## Как посчитать свой проект за час',
    '## Ответы на возможные вопросы',
    '## Вопросы к комментариям',
    '## Фактчек перед публикацией',
  ]) {
    assert.ok(body.includes(heading), `missing section: ${heading}`)
  }
})

test('клиент и его система не раскрыты', () => {
  assert.doesNotMatch(body, /WELL\s*DOM/i)
  assert.doesNotMatch(body, /github\.com\/ideav/i)
})
