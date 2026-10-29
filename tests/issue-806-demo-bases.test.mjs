// Демо-базы «нужна табличка» (issue #806): адрес онлайн-версии ведёт на базу,
// которую можно создать в ЛК, и на её таблицу, а не на пустую стартовую.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import vm from 'node:vm'
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

// Скрипт страницы шаблона дописывает UTM к ссылкам; внешняя ссылка на демо
// должна остаться на ideav.ru, а не стать путём на excel-to-app.ru.
test('UTM к «Открыть онлайн» не уводит ссылку с ideav.ru', () => {
  const src = readFileSync(new URL('../scripts/prerender-site-excel.mjs', import.meta.url), 'utf8')
  const fn = src.match(/function tplScript\([\s\S]*?\n}\n/)[0]
  const html = new Function('METRIKA_ID', `${fn}; return tplScript('t', 'p')`)('1')
  const code = html.replace(/^<script>|<\/script>$/g, '')
  const mk = (href, attr) => ({ attr, h: href, getAttribute() { return this.h },
    set href(v) { this.h = String(v) }, get href() { return this.h }, addEventListener() {} })
  const demo = mk('https://ideav.ru/tabelt13/table/471', 'data-tpl-demo')
  const cta = mk('/', 'data-cta')
  const document = { querySelectorAll: (q) => [demo, cta].filter((a) => q.includes(a.attr)), querySelector: () => null }
  const location = { search: '?utm_source=yandex&yclid=7', href: 'https://excel-to-app.ru/tabel-ucheta-rabochego-vremeni/?utm_source=yandex&yclid=7' }
  vm.runInNewContext(code, { document, location, URL, URLSearchParams, Date, ym() {} })
  assert.equal(demo.h, 'https://ideav.ru/tabelt13/table/471?utm_source=yandex&yclid=7')
  assert.equal(new URL(cta.h, location.href).href, 'https://excel-to-app.ru/?utm_source=yandex&yclid=7')
})
