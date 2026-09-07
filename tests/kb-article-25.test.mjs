// issue #565 — статья базы знаний № 25 «Один контрагент — три способа на него
// смотреть» и блог-пост по тому же материалу (vecmory, статья 08 —
// «Один контрагент, три способа на него смотреть — архитектура вместо костыля»).
//
// Проверяем, что статья на месте, держит ключевые тезисы (запись контрагента
// одна, взгляды — связи с типами; новый взгляд — строка в справочнике, а не
// миграция; цена переиграть решение — час), ссылается на первоисточники,
// спутована с блог-постом и попадает в sitemap/llms.txt/OG и на индекс.

import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { test } from 'node:test'

const kbDataSource = readFileSync(
  new URL('../src/data/knowledgeBase.ts', import.meta.url),
  'utf8',
)
const sitemap = readFileSync(new URL('../public/sitemap.xml', import.meta.url), 'utf8')
const llms = readFileSync(new URL('../public/llms.txt', import.meta.url), 'utf8')
const post = readFileSync(
  new URL('../blog-v2/src/content/posts/odin-kontragent-tri-vzglyada.md', import.meta.url),
  'utf8',
)

function extractArticleBlock(slug) {
  const start = kbDataSource.indexOf(`slug: '${slug}'`)
  assert.notEqual(start, -1, `article ${slug} block should be present`)
  const sourceUrl = kbDataSource.indexOf('sourceUrl:', start)
  assert.notEqual(sourceUrl, -1, `article ${slug} should declare sourceUrl`)
  const end = kbDataSource.indexOf('\n  },', sourceUrl)
  assert.notEqual(end, -1, `article ${slug} block should close after sourceUrl`)
  return kbDataSource.slice(start, end)
}

test('article #25 publishes the counterparty-three-views article', () => {
  const block = extractArticleBlock('25-counterparty-three-views')

  assert.match(block, /number: '25'/)
  assert.match(block, /Один контрагент — три способа на него смотреть/)
  assert.match(block, /контрагент/i)
})

test('article #25 keeps the key theses: одна запись, взгляды — связи с типами', () => {
  const block = extractArticleBlock('25-counterparty-three-views')

  // сущность отдельно от её типизированных связей
  assert.match(block, /запись контрагента одна, а взгляды отделов — связи с типами/i)
  assert.match(block, /входит в холдинг по ИНН/)
  assert.match(block, /заказчик → подразделение/)
  // три разных взгляда названы поимённо
  assert.match(block, /бухгалтер/i)
  assert.match(block, /продаж/i)
  assert.match(block, /поставщик/i)
})

test('article #25 keeps the numbers: новый взгляд = строка, цена переиграть = час', () => {
  const block = extractArticleBlock('25-counterparty-three-views')

  // контрольные цифры из первоисточника
  assert.match(block, /418 типов/)
  assert.match(block, /133 731/)
  assert.match(block, /0,16 мс/)
  assert.match(block, /\+402/)
  // новый взгляд — строка в справочнике типов, а не миграция
  assert.match(block, /строка в справочнике/i)
  assert.match(block, /миграц/i)
  // цена переиграть решение
  assert.match(block, /стоит час/i)
})

test('article #25 describes the flow and the EAV cautionary tale', () => {
  const block = extractArticleBlock('25-counterparty-three-views')

  assert.match(block, /flowDiagram:/)
  assert.match(block, /integramScenario:/)
  // три слоя против «свалки из четырёх колонок»
  assert.match(block, /типы/i)
  assert.match(block, /контроллер/i)
  assert.match(block, /индекс/i)
  // честные ограничения
  assert.match(block, /договор[её]нност/i)
  assert.match(block, /переклассификац/i)
})

test('article #25 cites the engineering source and the companion blog post', () => {
  const block = extractArticleBlock('25-counterparty-three-views')

  assert.match(
    block,
    /github\.com\/ideav\/python2node\/blob\/main\/packages\/vecmory\/articles\/08-counterparty-three-views\.md/,
  )
  assert.match(block, /github\.com\/ideav\/python2node\/issues\/342/)
  assert.match(block, /ideav\.ru\/blog\/posts\/odin-kontragent-tri-vzglyada\//)
  assert.match(
    block,
    /sourceUrl: 'https:\/\/github\.com\/ideav\/python2node\/blob\/main\/packages\/vecmory\/articles\/08-counterparty-three-views\.md'/,
  )
})

test('article #25 is grouped, sitemapped, listed in llms.txt and has an OG card', () => {
  const prerenderSource = readFileSync(
    new URL('../scripts/prerender-knowledge-base.mjs', import.meta.url),
    'utf8',
  )

  // группа «Реляционные данные: Airtable и Notion»
  const relationalGroup = prerenderSource.slice(
    prerenderSource.indexOf("'04-related-tables'"),
    prerenderSource.indexOf('Альтернатива заказной разработке'),
  )
  assert.match(relationalGroup, /'25-counterparty-three-views'/)
  assert.doesNotMatch(prerenderSource, /'25-production-plan-fact'/)
  assert.match(sitemap, /knowledge-base\/25-counterparty-three-views\.html/)
  assert.doesNotMatch(sitemap, /25-production-plan-fact/)
  assert.match(llms, /knowledge-base\/25-counterparty-three-views\.html/)
  assert.doesNotMatch(llms, /25-production-plan-fact/)
  assert.ok(
    existsSync(new URL('../public/og/25-counterparty-three-views.png', import.meta.url)),
    'expected public/og/25-counterparty-three-views.png to be committed',
  )
})

test('the companion blog post is published and points at the knowledge-base article', () => {
  assert.match(post, /^title: "Бухгалтерия, продажи и закупки спорят/m)
  assert.match(post, /^pubDate: '2026-09-07'$/m)
  assert.match(post, /^category: "О платформе"$/m)
  assert.doesNotMatch(post, /^draft:\s*true/m)
  assert.doesNotMatch(post, /^canonical:/m)
  // скаляр с двоеточием не должен остаться без кавычек (issue #284)
  assert.doesNotMatch(post, /^description: [^"']/m)
  assert.match(post, /knowledge-base\/25-counterparty-three-views\.html/)
  assert.match(
    post,
    /github\.com\/ideav\/python2node\/blob\/main\/packages\/vecmory\/articles\/08-counterparty-three-views\.md/,
  )
})
