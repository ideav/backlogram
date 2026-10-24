// crm#5270 — статья базы знаний № 29 «Запрос как хранимая процедура» по
// docs/query-as-stored-procedure.md из ideav/crm.
//
// Проверяем, что статья на месте, держит ключевые тезисы (права автора,
// грант на запрос вместо таблиц, маски — только при прямом доступе, SET
// с превью и подтверждением, EXECUTE, InTransaction «всё или ничего»,
// журнал), ссылается на первоисточник, спутована со статьёй 28 и попадает
// в sitemap/llms.txt/OG.

import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { test } from 'node:test'

const kbDataSource = readFileSync(
  new URL('../src/data/knowledgeBase.ts', import.meta.url),
  'utf8',
)
const sitemap = readFileSync(new URL('../public/sitemap.xml', import.meta.url), 'utf8')
const llms = readFileSync(new URL('../public/llms.txt', import.meta.url), 'utf8')

function extractArticleBlock(slug) {
  const start = kbDataSource.indexOf(`slug: '${slug}'`)
  assert.notEqual(start, -1, `article ${slug} block should be present`)
  const sourceUrl = kbDataSource.indexOf('sourceUrl:', start)
  assert.notEqual(sourceUrl, -1, `article ${slug} should declare sourceUrl`)
  const end = kbDataSource.indexOf('\n  },', sourceUrl)
  assert.notEqual(end, -1, `article ${slug} block should close after sourceUrl`)
  return kbDataSource.slice(start, end)
}

test('article #29 publishes the query-as-stored-procedure article', () => {
  const block = extractArticleBlock('29-query-as-stored-procedure')

  assert.match(block, /number: '29'/)
  assert.match(block, /хранимая процедура/i)
})

test('article #29 keeps the rights model: права автора, грант на запрос', () => {
  const block = extractArticleBlock('29-query-as-stored-procedure')

  // запрос выполняется с правами автора
  assert.match(block, /правами (своего )?автора/i)
  // роли достаточно гранта на сам запрос
  assert.match(block, /грант[а-я]* на сам(ом)? запрос/i)
  assert.match(block, /таблицы-источник/i)
  // маски — при прямом доступе, не к запросу
  assert.match(block, /маск[аи] строк/i)
  assert.match(block, /прямом доступе/i)
})

test('article #29 keeps the SET mechanics: присвоить, превью, подтверждение', () => {
  const block = extractArticleBlock('29-query-as-stored-procedure')

  assert.match(block, /Присвоить/)
  assert.match(block, /было ⇒ станет/)
  assert.match(block, /confirmed=1/)
  assert.match(block, /XSRF/)
  assert.match(block, /EXECUTE/)
  // идемпотентный повторный прогон
  assert.match(block, /идемпотентн/i)
  // согласование статуса — эталонный пример
  assert.match(block, /Согласован/)
  assert.match(block, /approve|кнопк/i)
})

test('article #29 keeps integrity: InTransaction, журнал, границы', () => {
  const block = extractArticleBlock('29-query-as-stored-procedure')

  assert.match(block, /InTransaction/)
  assert.match(block, /всё или ничего/i)
  assert.match(block, /откат/i)
  assert.match(block, /журнал/i)
  // честные границы: внешние HTTP-вызовы не откатываются
  assert.match(block, /HTTP-вызов/i)
})

test('article #29 cites the crm source document and cross-links article 28', () => {
  const block = extractArticleBlock('29-query-as-stored-procedure')

  assert.match(
    block,
    /github\.com\/ideav\/crm\/blob\/main\/docs\/query-as-stored-procedure\.md/,
  )
  assert.match(
    block,
    /sourceUrl: 'https:\/\/github\.com\/ideav\/crm\/blob\/main\/docs\/query-as-stored-procedure\.md'/,
  )
  assert.match(block, /28-query-engine-capabilities/)
})

test('article #29 is grouped, sitemapped and listed in llms.txt with an OG card', () => {
  const prerenderSource = readFileSync(
    new URL('../scripts/prerender-knowledge-base.mjs', import.meta.url),
    'utf8',
  )

  const reportsGroup = prerenderSource.slice(
    prerenderSource.indexOf('Релизы, отчёты, формы и интеграции'),
    prerenderSource.indexOf('Бизнес-практика no-code'),
  )
  assert.match(reportsGroup, /'29-query-as-stored-procedure'/)
  assert.match(sitemap, /knowledge-base\/29-query-as-stored-procedure\.html/)
  assert.match(llms, /knowledge-base\/29-query-as-stored-procedure\.html/)
  assert.ok(
    existsSync(new URL('../public/og/29-query-as-stored-procedure.png', import.meta.url)),
    'expected public/og/29-query-as-stored-procedure.png to be committed',
  )
})
