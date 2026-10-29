// issue #793 — статья базы знаний № 30 «Универсальный импорт из Excel».
//
// Проверяем, что статья на месте и держит фактуру из templates/upload.html
// (ideav/crm): три способа подачи, форматы и кодировки, сетка диапазона 60×40,
// порция 1000 записей, формулы — JavaScript, импорт только создаёт записи;
// ссылки на первоисточник (код) и vc.ru-разбор; попадание в группу, sitemap,
// llms.txt и OG. Номер 28 при создании был занят статьёй про движок запросов
// (#792), поэтому статья живёт под № 30.

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

test('article #30 publishes the universal-import article', () => {
  const block = extractArticleBlock('30-universal-import-excel')

  assert.match(block, /number: '30'/)
  assert.match(block, /Универсальный импорт из Excel/)
  assert.match(block, /publishedAt: '2026-10-24'/)
})

test('article #30 keeps the facts: форматы, кодировки, 60×40, 1000 записей', () => {
  const block = extractArticleBlock('30-universal-import-excel')

  assert.match(block, /XLSX\/XLSM\/XLSB\/XLS/)
  assert.match(block, /CSV/)
  assert.match(block, /JSON/)
  assert.match(block, /Windows-1251/)
  assert.match(block, /UTF-8/)
  assert.match(block, /60×40/)
  assert.match(block, /1000/)
  assert.match(block, /Shift\+клик/)
  assert.match(block, /«Создать новую таблицу из файла»/)
})

test('article #30 keeps the mechanics: справочники, подчинённые, формулы, статистика', () => {
  const block = extractArticleBlock('30-universal-import-excel')

  assert.match(block, /справочник/i)
  assert.match(block, /«Создавать родителя, если его нет»/)
  assert.match(block, /по значению или #ID/)
  assert.match(block, /\[Кол-во\]\*\[Цена\]/)
  assert.match(block, /JavaScript/)
  assert.match(block, /Math\.round/)
  assert.match(block, /avg\/sum/)
  assert.match(block, /min\/max/)
  assert.match(block, /TSV/)
})

test('article #30 states the honest limitations: только создание, один лист, не Excel-функции', () => {
  const block = extractArticleBlock('30-universal-import-excel')

  assert.match(block, /создаёт записи/)
  assert.match(block, /обновления существующих строк|Обновить существующие строки/i)
  assert.match(block, /Один лист Excel за загрузку/)
  assert.match(block, /а не Excel-функции/)
  assert.match(block, /проверяет сервер/)
})

test('article #30 has FAQ, flowDiagram, scenario and the comparison table', () => {
  const block = extractArticleBlock('30-universal-import-excel')

  assert.match(block, /faq: \[/)
  assert.match(block, /question: 'Как загрузить Excel в Интеграм\?'/)
  assert.match(block, /question: 'Импорт обновляет существующие записи или только создаёт новые\?'/)
  assert.match(block, /flowDiagram:/)
  assert.match(block, /scenario:/)
  assert.match(block, /comparisonTable:/)
  assert.match(block, /integramScenario:/)
})

test('article #30 cites the code source and the vc.ru walkthrough', () => {
  const block = extractArticleBlock('30-universal-import-excel')

  assert.match(block, /github\.com\/ideav\/crm\/blob\/main\/templates\/upload\.html/)
  assert.match(block, /vc\.ru\/dev\/1046757-normalizaciya-dannyh-iz-tablic-excel-v-integrale/)
  assert.match(
    block,
    /sourceUrl: 'https:\/\/github\.com\/ideav\/crm\/blob\/main\/templates\/upload\.html'/,
  )
})

test('article #30 is grouped, sitemapped, listed in llms.txt and has an OG card', () => {
  const prerenderSource = readFileSync(
    new URL('../scripts/prerender-knowledge-base.mjs', import.meta.url),
    'utf8',
  )

  // группа «Замена Excel и Google Sheets»
  const excelGroup = prerenderSource.slice(
    prerenderSource.indexOf("'01-google-sheets-150k'"),
    prerenderSource.indexOf('Реляционные данные: Airtable и Notion'),
  )
  assert.match(excelGroup, /'30-universal-import-excel'/)
  assert.doesNotMatch(prerenderSource, /'28-universal-import-excel'/)
  assert.match(sitemap, /knowledge-base\/30-universal-import-excel\.html/)
  assert.match(llms, /knowledge-base\/30-universal-import-excel\.html/)
  assert.match(llms, /серия из \d+ материалов/) // точное число держит issue-627-seo-audit
  assert.ok(
    existsSync(new URL('../public/og/30-universal-import-excel.png', import.meta.url)),
    'expected public/og/30-universal-import-excel.png to be committed',
  )
})
