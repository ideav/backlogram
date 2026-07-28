import assert from 'node:assert/strict'
import { existsSync, readFileSync, statSync } from 'node:fs'
import { test } from 'node:test'

const postsDir = new URL('../blog-v2/src/content/posts/', import.meta.url)
const postFile = 'promyshlennoe-prilozhenie-shansy-riski-trudoemkost.md'
const postPath = new URL(postFile, postsDir)
const coverPng = new URL(
  '../blog-v2/public/uploads/trudoemkost-90-deistvii-cover.png',
  import.meta.url,
)
const coverSvg = new URL(
  '../blog-v2/public/uploads/trudoemkost-90-deistvii-cover.svg',
  import.meta.url,
)

/**
 * Publication coverage for https://github.com/ideav/backlogram/issues/504
 *
 * Статья должна дать читателю посчитать свой проект: разбор оценки (40
 * поверхностей / 77 эндпоинтов / 90 действий → 300 часов), риски
 * самостоятельной сборки со ссылками на проверяемые источники и сравнение
 * трёх моделей разработки. Тест сторожит именно то, что делает статью
 * пригодной для «взвесить шансы»: цифры, атрибуцию источников и структуру.
 */

const post = existsSync(postPath) ? readFileSync(postPath, 'utf8') : ''

test('статья #504 опубликована с валидным frontmatter', () => {
  assert.ok(existsSync(postPath), `expected ${postFile} to exist`)

  assert.match(post, /^title: 'Оценка в 300 часов: .*'$/m)
  assert.match(post, /^pubDate: '2026-07-28'$/m)
  assert.match(post, /^category: Разработка$/m)
  assert.match(post, /^author: Команда Интеграм$/m)
  assert.match(post, /^image: \/uploads\/trudoemkost-90-deistvii-cover\.png$/m)
  assert.doesNotMatch(post, /^draft:\s*true/m)
  // Самоканоничность нового блога — canonical на чужой сайт не ставим (#331).
  assert.doesNotMatch(post, /^canonical:/m)

  // Regression for issue #284: title и description содержат ": ",
  // поэтому обязаны оставаться в кавычках, иначе YAML падает при сборке.
  assert.match(post, /^description: '.*'$/m)
})

test('обложка 1200×630 лежит рядом с исходником', () => {
  assert.ok(existsSync(coverPng), 'cover PNG must exist')
  assert.ok(existsSync(coverSvg), 'cover SVG source must exist')

  // Заголовок PNG: ширина/высота в байтах 16..24.
  const header = readFileSync(coverPng).subarray(16, 24)
  assert.equal(header.readUInt32BE(0), 1200, 'cover width must be 1200')
  assert.equal(header.readUInt32BE(4), 630, 'cover height must be 630')
  assert.ok(statSync(coverPng).size > 10_000, 'cover PNG looks empty')
})

test('разбор оценки даёт читателю посчитать свой проект', () => {
  // Счётные единицы из реального ТЗ — ядро статьи.
  assert.match(post, /≈ 40/, 'UI-поверхности')
  assert.match(post, /≈ 77/, 'эндпоинты')
  assert.match(post, /≈ 90/, 'пользовательские действия')
  assert.match(post, /300 часов/)
  assert.match(post, /3,3 часа/, 'часы на одно действие')

  // Таблица «невидимой» работы и её итог.
  assert.match(post, /\| \*\*Итого до первой бизнес-функции\*\* \| \*\*240–384\*\* \|/)

  // Сравнение трёх моделей: цифры каждой.
  assert.match(post, /700–1100/)
  assert.match(post, /400–650/)
  assert.match(post, /200–400/)
  assert.match(post, /60–70% первоначального объёма/)
})

test('цифры рисков подкреплены проверяемыми источниками', () => {
  const sources = [
    ['https://addyo.substack.com/p/the-70-problem-hard-truths-about', /«проблему 70%»/],
    ['https://arxiv.org/abs/2510.00328', /154 источника/],
    ['https://arxiv.org/abs/2601.20245', /на 17% худшее понимание/],
  ]
  for (const [url, claim] of sources) {
    assert.ok(post.includes(url), `missing source link ${url}`)
    assert.match(post, claim)
  }

  // Данные, которые нельзя приводить без оговорки о выборке.
  assert.match(post, /63%[^.]*вайб-кодинг/)
  assert.match(post, /демография активного сообщества/)
  assert.match(post, /1 645 приложений/)
  assert.match(post, /170 из них \(10,3%\)/)
  assert.match(post, /RLS/)
})

test('структура: от подсчёта к рискам, моделям и решению', () => {
  for (const heading of [
    '## Считают не приложения, а действия',
    '## Что такое «одно действие» на самом деле',
    '## Почему «сгенерируется за пару часов» не противоречит 300 часам',
    '## Что происходит, когда систему собирают самостоятельно',
    '## Где сгорают часы, которых нет в ТЗ',
    '## Три способа получить одну и ту же систему',
    '## Пять вопросов, чтобы взвесить свои шансы',
    '## Что делать с оценкой, которая кажется большой',
    '## Итог',
  ]) {
    assert.ok(post.includes(heading), `missing section: ${heading}`)
  }
})

test('перелинковка внутри блога ведёт на существующие статьи', () => {
  const links = [...post.matchAll(/\]\((\/posts\/[a-z0-9-]+\/)\)/g)].map((m) => m[1])
  assert.ok(links.length >= 3, 'ожидаем перелинковку минимум на три статьи блога')
  for (const link of links) {
    const slug = link.replace(/^\/posts\//, '').replace(/\/$/, '')
    assert.ok(
      existsSync(new URL(`${slug}.md`, postsDir)),
      `internal link ${link} points at a missing post`,
    )
  }
})

test('клиент не раскрыт: ни имени системы, ни ссылки на приватный тикет', () => {
  assert.doesNotMatch(post, /WELL\s*DOM/i)
  assert.doesNotMatch(post, /github\.com\/ideav\/atex/i)
})
