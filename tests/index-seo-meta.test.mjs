import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import {
  DESCRIPTION_LIMIT_PX,
  TITLE_LIMIT_PX,
  descriptionWidthPx,
  findLookalikeCyrillic,
  titleWidthPx,
} from '../scripts/lib/serp-width.mjs'

const indexSource = readFileSync(new URL('../index.html', import.meta.url), 'utf8')

const title = indexSource.match(/<title>([^<]*)<\/title>/)[1]
const description = indexSource.match(/<meta name="description" content="([^"]*)"/)[1]

// issue #488 (af.md, блок 15): мета главной под семантическое ядро.
// issue #516: заголовок и описание укорочены под пиксельные лимиты выдачи —
// было 721 px и 1168 px при лимитах 580 px и 1000 px.
test('index.html exposes SEO title, description and keywords', () => {
  assert.equal(title, 'Интеграм — no-code конструктор приложений | Замена Excel')
  assert.equal(
    description,
    'Из Excel-таблицы — веб-приложение за 45 минут. Реляционные данные, on-premise, права доступа. Российский no-code в реестре отечественного ПО.',
  )
  assert.match(
    indexSource,
    /<meta name="keywords" content="из excel приложение,excel в приложение,замена excel за час,приложение за час,приложение из excel,автоматизация бизнеса,гугл таблицы,создать базу данных,конструктор интеграм,интеграм,российский airtable,аналог airtable,airtable,конструктор приложений,приложение без программирования,no-code,nocode,low code,зерокод,замена excel" \/>/,
  )
})

test('index.html SEO leads with the brand + Excel substitution offer', () => {
  // Бренд идёт первым (issue #402: по запросу «конструктор интеграм» ранжируется
  // именно главная), дальше — что это и вместо чего. \b в JS кириллицу не видит,
  // поэтому границу слова не используем.
  assert.match(title, /^Интеграм —[^|]*конструктор приложений \|.*Замена Excel/)
  assert.match(description, /Excel-таблицы.*45 минут/)
})

test('заголовок и описание главной влезают в пиксельные лимиты выдачи (issue #516)', () => {
  const titlePx = titleWidthPx(title)
  const descriptionPx = descriptionWidthPx(description)

  assert.ok(
    titlePx <= TITLE_LIMIT_PX,
    `<title> шире выдачи: ${titlePx} px при лимите ${TITLE_LIMIT_PX} px — ${title}`,
  )
  assert.ok(
    descriptionPx <= DESCRIPTION_LIMIT_PX,
    `description шире выдачи: ${descriptionPx} px при лимите ${DESCRIPTION_LIMIT_PX} px`,
  )
})

test('в мета-тегах главной нет кириллических двойников (issue #516)', () => {
  // «дѾступа» вместо «доступа»: буква из старославянского блока Юникода
  // выглядит почти как «о», но выбивает слово из поискового запроса.
  for (const [name, value] of Object.entries({ title, description })) {
    assert.deepEqual(
      findLookalikeCyrillic(value),
      [],
      `${name}: посторонние кириллические символы`,
    )
  }
})
