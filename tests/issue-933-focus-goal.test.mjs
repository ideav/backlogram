// Целевая цель кампаний «Фокус» (#933): focus_click за второй кнопкой и с проверкой на человека.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const page = readFileSync(new URL('../src/pages/FocusLanding.tsx', import.meta.url), 'utf8')
const guard = readFileSync(new URL('../src/lib/humanGoal.ts', import.meta.url), 'utf8')
const prerender = readFileSync(new URL('../scripts/prerender-focus-landing.mjs', import.meta.url), 'utf8')

test('целевая кнопка рендерится только после первой', () => {
  const opened = page.indexOf('{opened ? (')
  const closed = page.indexOf(') : (', opened)
  const target = page.indexOf('onClick={onTarget}')
  assert.ok(opened > 0 && target > opened && target < closed, 'onTarget — только в ветке opened')
  assert.equal(page.match(/onClick=\{onTarget\}/g).length, 1)
  assert.match(page.slice(closed), /onClick=\{onOpen\}/)
})

test('focus_click уходит только через проверку на человека', () => {
  assert.match(page, /reachHumanGoal\('focus_click'/)
  assert.doesNotMatch(page, /reachGoal\('focus_click'/)
  assert.match(guard, /isTrusted/)
  assert.match(guard, /navigator\.webdriver/)
  assert.match(guard, /_blocked/)
})

test('в пререндере целевой кнопки нет', () => {
  assert.doesNotMatch(prerender, /focus_click|Записаться на разбор/)
})
