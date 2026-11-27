// backlogram#1041: у плашки «Большую часть работы делают ИИ-агенты» — крестик «Закрыть»;
// закрыли один раз — скрыта всегда (флаг в localStorage), на хабе и в разделах.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const src = readFileSync(new URL('../src/pages/HelpCenter.tsx', import.meta.url), 'utf8')
const note = src.slice(src.indexOf('export const AGENTS_NOTE_KEY'), src.indexOf('export function Steps'))

test('плашка: кнопка «Закрыть» с крестиком справа вверху', () => {
  assert.match(note, /<button type="button" onClick=\{close\} aria-label="Закрыть"/)
  assert.match(note, /absolute top-2 right-2/)
  assert.match(note, /<X size=/)
})

test('плашка: состояние в localStorage, закрытая не рендерится', () => {
  assert.match(note, /localStorage\.getItem\(AGENTS_NOTE_KEY\) === '1'/)
  assert.match(note, /localStorage\.setItem\(AGENTS_NOTE_KEY, '1'\)/)
  assert.match(note, /if \(closed\) return null/)
  // Доступ к localStorage обёрнут — в приватном режиме страница не падает.
  assert.equal((note.match(/try \{ (return )?localStorage/g) || []).length, 2)
})
