import assert from 'node:assert/strict'
import { test } from 'node:test'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const repo = new URL('..', import.meta.url).pathname
const read = (p) => readFileSync(resolve(repo, p), 'utf8')

const headerSource = read('src/components/Header.tsx')

// Изолируем массив moreLinks («Ещё…») из исходника Header.
function moreLinksBlock() {
  const match = headerSource.match(/const moreLinks = \[([\s\S]*?)\n {2}\]/)
  assert.ok(match, 'Header should declare a moreLinks array')
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

test('«Ещё» menu holds exactly 7 items', () => {
  // Сравнение с Битрикс24/AmoCRM вынесено в верхнее меню как «Больше CRM»
  // (issue #4264); в «Ещё» осталось 6 пунктов, седьмым добавлены платформы с
  // ИИ-агентами (issue #559, п. 8).
  const block = moreLinksBlock()
  const count = (block.match(/href:/g) || []).length
  assert.equal(count, 7, 'the «Ещё» dropdown must have 7 entries')
})
