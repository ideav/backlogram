// issue ideav/crm#5312 — SEO-проверка трёх ERP-страниц под кампании Директа:
// /erp-sistema.html, КБ №32 и пост блога про кастомизацию ERP.
//
// Держим: «ERP» в каждом H2 посадочной и в заголовках поста, вопросы FAQ под
// частые фразы кампаний (производство, российская ERP), <title> статьи КБ
// без отката на короткий shortTitle и сведения об исполнителе на посадочной —
// их смотрит модерация Директа.

import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import * as erp from '../src/data/erpSistema.mjs'
import { PRIVACY_OPERATOR } from '../src/data/privacy.mjs'

const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8')
const POST = 'blog-v2/src/content/posts/kastomizaciya-erp-luchshie-praktiki-pod-vash-biznes.md'

test('посадочная: «ERP» в каждом заголовке раздела, кроме реквизитов', () => {
  for (const [key, h] of Object.entries(erp.SECTIONS)) {
    if (key === 'seller') continue
    assert.match(h, /ERP/, `H2 «${h}» без ERP`)
  }
  assert.match(erp.HERO_LEAD, /ERP-систем/)
})

test('посадочная: заголовки разделов не дублируются руками в SPA и снапшоте', () => {
  const page = read('src/pages/ErpSistema.tsx')
  const prerender = read('scripts/prerender-erp-sistema.mjs')
  for (const key of Object.keys(erp.SECTIONS)) {
    assert.match(page, new RegExp(`SECTIONS\\.${key}\\b`), `SPA не выводит SECTIONS.${key}`)
    assert.match(prerender, new RegExp(`SECTIONS\\.${key}\\b`), `снапшот не выводит SECTIONS.${key}`)
  }
})

test('FAQ закрывает фразы кампаний: производство, российская ERP, малый бизнес', () => {
  const qs = erp.FAQ.map((f) => f.q).join(' | ')
  assert.match(qs, /ERP для производства/)
  assert.match(qs, /российская ERP/)
  assert.match(qs, /ERP-система малому бизнесу/)
  assert.ok(erp.FAQ.some((f) => /реестр отечественного ПО/.test(f.a)))
})

test('исполнитель: наименование, ИНН, ОГРН и контакты — из карточки оператора', () => {
  for (const k of ['name', 'inn', 'ogrn', 'email', 'phone', 'phoneHref']) {
    assert.equal(erp.SELLER[k], PRIVACY_OPERATOR[k])
  }
  const prerender = read('scripts/prerender-erp-sistema.mjs')
  assert.match(prerender, /id="ispolnitel"/)
  assert.match(prerender, /ИНН \$\{escape\(SELLER\.inn\)\}/)
  assert.match(read('src/pages/ErpSistema.tsx'), /id="ispolnitel"/)
})

test('КБ №32: seoTitle ≤ 60 знаков — в <title> попадает он, а не shortTitle', () => {
  const kb = read('src/data/knowledgeBase.ts')
  const block = kb.slice(kb.indexOf("slug: '32-erp-customization'"))
  const seoTitle = block.match(/seoTitle: '([^']+)'/)[1]
  assert.ok(seoTitle.length <= 60, `seoTitle ${seoTitle.length} > 60`)
  assert.match(seoTitle, /ERP-систем/)
})

test('пост: «ERP» в заголовках разделов', () => {
  const h2 = read(POST).match(/^## .+$/gm)
  assert.ok(h2.length >= 4)
  const withErp = h2.filter((h) => /ERP/.test(h))
  assert.ok(withErp.length >= 4, `ERP только в ${withErp.length} из ${h2.length} H2`)
})
