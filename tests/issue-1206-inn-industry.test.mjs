// python2node#1206 — со страницы оценки по ИНН в конфигуратор ideav.ru/ai-transform/
// уходит только отрасль (хэш #<id>), цифры и ИНН — нет.
import assert from 'node:assert/strict'
import { test } from 'node:test'

import { LOSS_CTA_URL } from '../src/data/lossLandings.mjs'
import { aiTransformUrl, okvedToIndustry } from '../src/lib/innProfile.mjs'

// id отраслей конфигуратора — python2node docs/pitch/bootcamps/data.mjs (industries).
const INDUSTRIES = ['make-to-order', 'food', 'construction', 'retail', 'auto', 'projects', 'finance', 'hr',
  'leisure', 'funds', 'distribution', 'logistics', 'agro', 'clinics', 'realty']

test('ОКВЭД → отрасль конфигуратора', () => {
  const cases = {
    '01.11': 'agro', '10.71': 'food', '11.07': 'food', '17.21': 'make-to-order', '23.61': 'construction',
    '28.29': 'make-to-order', '41.20': 'construction', '45.11': 'auto', '46.90': 'distribution', '47.91': 'retail',
    '49.41': 'logistics', '52.10': 'logistics', '62.01': 'projects', '64.19': 'finance', '68.32': 'realty',
    '71.12': 'projects', '78.10': 'hr', '86.21': 'clinics', '93.13': 'leisure',
  }
  for (const [okved, id] of Object.entries(cases)) {
    assert.equal(okvedToIndustry(okved), id, okved)
    assert.ok(INDUSTRIES.includes(id), id)
  }
  for (const okved of ['', null, undefined, '85.41', '56.10', 'abc']) assert.equal(okvedToIndustry(okved), null, String(okved))
})

test('ссылка: отрасль в хэше, без ИНН и названия', () => {
  const url = aiTransformUrl({ ok: true, inn: '7707083893', name: 'ООО «Ромашка»', okved: '10.71' })
  assert.equal(url, `${LOSS_CTA_URL}#food`)
  assert.ok(!url.includes('7707083893'))
  assert.equal(aiTransformUrl({ ok: true, okved: '85.41' }), LOSS_CTA_URL)
  assert.equal(aiTransformUrl(null), LOSS_CTA_URL)
})
