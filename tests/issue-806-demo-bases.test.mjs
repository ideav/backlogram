// Демо-базы «нужна табличка» (issue #806): адрес онлайн-версии ведёт на базу,
// которую можно создать в ЛК, и на её таблицу, а не на пустую стартовую.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { fileURLToPath } from 'node:url'
import ExcelJS from 'exceljs'

import { loadTplPages } from '../site-excel/tpl-pages.mjs'

const tplPages = loadTplPages()

test('демо — база ideav.ru с именем по правилу ЛК и сразу таблица', () => {
  for (const page of tplPages) {
    const m = page.demo.match(/^https:\/\/ideav\.ru\/([^/]+)\/table\/\d+$/)
    assert.ok(m, `${page.demo}: ожидается https://ideav.ru/<база>/table/<id>`)
    assert.match(m[1], /^[a-z][a-z0-9]{2,14}$/, `${m[1]}: имя базы — 3–15 латинских букв и цифр, с буквы`)
  }
})

test('журнал выдачи: примеры не затирают колонку «№»', async () => {
  const wb = new ExcelJS.Workbook()
  await wb.xlsx.readFile(fileURLToPath(new URL('../site-excel/public/files/zhurnal-vydachi-materialov.xlsx', import.meta.url)))
  const ws = wb.getWorksheet('Журнал')
  for (const r of [3, 4]) {
    assert.ok(ws.getCell(r, 1).formula, `A${r}: формула номера строки`)
    assert.ok(ws.getCell(r, 2).value instanceof Date, `B${r}: дата под шапкой «Дата»`)
    assert.equal(typeof ws.getCell(r, 3).value, 'string', `C${r}: «Кому выдано»`)
  }
})
