import assert from 'node:assert/strict'
import { test } from 'node:test'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { API_SECTIONS } from '../src/data/apiDocs.mjs'

// Запрос = хранимая процедура (#786): права на запрос и защита ограничителя
// от подмены фильтра записаны на api.html явно, как контракт, а база знаний
// не обещает, что маски роли действуют на отчёты.

const repo = fileURLToPath(new URL('..', import.meta.url))

function topicText(topic) {
  return topic.blocks.map((b) => [b.text, b.code, ...(b.items || [])].filter(Boolean).join('\n')).join('\n')
}

test('#786: в разделе запросов есть тема «Права на запрос» с контрактом', () => {
  const reports = API_SECTIONS.find((s) => s.id === 'reports')
  const topic = reports.topics.find((t) => t.id === 'report-access')
  assert.ok(topic, 'нет темы report-access')
  const text = topicText(topic)
  assert.match(text, /хранимая процедура/)
  assert.match(text, /маски к запросу не применяются/)
  assert.match(text, /не переопределяется — это защита от подмены/)
  assert.match(text, /фильтруемость включается явно/)
})

test('#786: база знаний не говорит, что маски применяются к отчётам', () => {
  const kb = readFileSync(resolve(repo, 'src/data/knowledgeBase.ts'), 'utf8')
  assert.doesNotMatch(kb, /маска применяется ко всем запросам — таблице, отчётам/)
  assert.match(kb, /Отчёт работает как хранимая процедура/)
})
