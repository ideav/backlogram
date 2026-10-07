import assert from 'node:assert/strict'
import { test } from 'node:test'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

// fileURLToPath, а не pathname: на Windows pathname даёт «/C:/…» и resolve()
// склеивает «C:\C:\…» — файл не читался вовсе.
const repo = fileURLToPath(new URL('..', import.meta.url))
const read = (p) => readFileSync(resolve(repo, p), 'utf8')

// Список «Ещё…» переехал из разметки Header.tsx в данные (src/data/nav.mjs):
// те же ссылки нужны статическому блоку навигации в сыром HTML (issue #627, п. 3).
const navSource = read('src/data/nav.mjs')

function moreLinksBlock() {
  const match = navSource.match(/export const headerMoreLinks = \[([\s\S]*?)\n\]/)
  assert.ok(match, 'nav.mjs should declare a headerMoreLinks array')
  return match[1]
}

test('«Ещё» menu links to the Информационная система pillar page', () => {
  const block = moreLinksBlock()
  assert.match(
    block,
    /name:\s*'Информационная система',\s*href:\s*'\/informatsionnaya-sistema\.html'/,
    'moreLinks should contain the Информационная система entry pointing at /informatsionnaya-sistema.html',
  )
})

test('«Ещё» menu links to the Платформы с ИИ-агентами page', () => {
  // Страница выпадала из общего меню: входящие ссылки были только с главной и
  // с excel-to-app, остальные пять страниц раздела на неё не ссылались
  // (issue #559, п. 8).
  const block = moreLinksBlock()
  assert.match(
    block,
    /name:\s*'Платформы с ИИ-агентами',\s*href:\s*'\/agent-platforms\.html'/,
    'moreLinks should contain the Платформы с ИИ-агентами entry pointing at /agent-platforms.html',
  )
})

test('«Ещё» menu holds exactly 9 items', () => {
  // Сравнение с Битрикс24/AmoCRM вынесено в верхнее меню как «Больше CRM»
  // (issue #4264); в «Ещё» осталось 6 пунктов, седьмым добавлены платформы с
  // ИИ-агентами (issue #559, п. 8), восьмым — опросник «Квинтеты или таблицы»
  // (issue #605). Проверка стояла на 7 и этого пункта не заметила: на Windows
  // файл не читался из-за «C:\C:\…» и тест не запускался вовсе (issue #627).
  // Девятым — хаб «Автоматизация бизнеса с ИИ» (issue #642).
  const block = moreLinksBlock()
  const count = (block.match(/href:/g) || []).length
  assert.equal(count, 9, 'the «Ещё» dropdown must have 9 entries')
})
