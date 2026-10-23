import assert from 'node:assert/strict'
import { test } from 'node:test'
import { API_SECTIONS } from '../src/data/apiDocs.mjs'

// ideav/crm#5250: metadata отдаёт атрибуты колонки объектом field_attrs рядом с сырой
// строкой attrs. Раздел «Метаданные» показывает оба поля в примере ответа.

const topics = API_SECTIONS.flatMap((s) => s.topics || [])
const metadata = topics.find((t) => t.id === 'metadata')

test('пример ответа metadata — валидный JSON, field_attrs у каждой колонки', () => {
  assert.ok(metadata, 'нет темы metadata')
  const sample = metadata.blocks.find((b) => b.t === 'code' && b.lang === 'json')
  const table = JSON.parse(sample.code)
  assert.ok(table.reqs.length > 0)
  for (const req of table.reqs) {
    assert.deepEqual(Object.keys(req.field_attrs), ['required', 'multi', 'key', 'alias', 'default'], `колонка ${req.val}`)
  }
  const role = table.reqs.find((r) => r.val === 'Роль')
  assert.equal(role.attrs, ':!NULL:')
  assert.equal(role.field_attrs.required, true)
  const date = table.reqs.find((r) => r.val === 'Дата')
  assert.equal(JSON.parse(date.attrs).default, date.field_attrs.default)
})
