#!/usr/bin/env node
/**
 * Генератор .xlsx-шаблонов для страниц «нужна табличка» (issue #790).
 *
 * План (docs/marketing/template-seekers-plan.md, раздел 4.3): «Шаблон должен
 * быть по-настоящему хорошим» — поэтому шаблоны собираются кодом: ширины,
 * границы, формулы итогов и листы-справки. Файлы пишутся в
 * site-excel/public/files/ и коммитятся; скрипт запускается при изменении
 * шаблонов:
 *
 *   node scripts/make-tpl-workbooks.mjs
 *
 * Формулы — на английских именах функций: внутри .xlsx Excel хранит имена
 * по-английски и локализует при показе сам.
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import ExcelJS from 'exceljs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUT_DIR = resolve(__dirname, '../site-excel/public/files')

const BORDER = { style: 'thin', color: { argb: 'FFB0BEC5' } }
const THIN = { top: BORDER, left: BORDER, bottom: BORDER, right: BORDER }

/** Рамка диапазона ячеек. */
function box(ws, r1, c1, r2, c2) {
  for (let r = r1; r <= r2; r++) for (let c = c1; c <= c2; c++) ws.getCell(r, c).border = THIN
}

/** Заголовок: жирный, серый фон, перенос строк. */
function headerStyle(cell) {
  cell.font = { bold: true }
  cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFECEFF1' } }
  cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true }
}

/** Лист-справка: заголовок + абзацы построчно. */
function howTo(wb, name, lines) {
  const ws = wb.addWorksheet(name)
  ws.getColumn(1).width = 110
  const title = ws.getCell(1, 1)
  title.value = name
  title.font = { bold: true, size: 13 }
  let r = 3
  for (const line of lines) {
    const cell = ws.getCell(r, 1)
    cell.value = line
    cell.alignment = { wrapText: true, vertical: 'top' }
    r += 1
  }
}

const moneyFmt = '#,##0.00'

// ── 1. Табель Т-13 ───────────────────────────────────────────────────────────
function buildTabel() {
  const wb = new ExcelJS.Workbook()
  wb.creator = 'excel-to-app.ru'
  const ws = wb.addWorksheet('Табель', { views: [{ state: 'frozen', xSplit: 4, ySplit: 5 }] })
  const DAY0 = 5 // колонка дня 1
  const PAIRS = 20 // мест под сотрудников: пара строк на человека (коды + часы)

  ws.columns = [
    { width: 4 }, { width: 26 }, { width: 20 }, { width: 10 },
    ...Array.from({ length: 31 }, () => ({ width: 4.2 })),
    { width: 9 }, { width: 9 }, { width: 8 }, { width: 9 },
  ]

  // Шапка бланка
  ws.mergeCells(1, 1, 1, 35)
  const t = ws.getCell(1, 1)
  t.value = 'Табель учёта рабочего времени (форма № Т-13, Госкомстат 0301008)'
  t.font = { bold: true, size: 13 }
  t.alignment = { horizontal: 'center' }
  ws.mergeCells(2, 1, 2, 12)
  ws.getCell(2, 1).value = 'Организация: ________________________________________'
  ws.mergeCells(2, 13, 2, 24)
  ws.getCell(2, 13).value = 'Структурное подразделение: ____________________'
  ws.mergeCells(3, 1, 3, 12)
  ws.getCell(3, 1).value = 'Номер документа и дата составления: __.__.2026'
  ws.mergeCells(3, 13, 3, 24)
  ws.getCell(3, 13).value = 'Отчётный период: с __.__.2026 по __.__.2026'

  // Шапка таблицы (строки 4–5): подписи, дни 1..31
  for (const c of [1, 2, 3, 4, 36, 37, 38, 39]) ws.mergeCells(4, c, 5, c)
  for (let d = 1; d <= 31; d++) ws.getCell(5, DAY0 + d - 1).value = d
  const heads = ['№', 'Фамилия И. О.', 'Должность', 'Таб. №']
  for (const [i, name] of heads.entries()) ws.getCell(4, i + 1).value = name
  const tails = ['Часы 1-я половина', 'Часы 2-я половина', 'Дней явки', 'Всего часов']
  for (const [i, name] of tails.entries()) ws.getCell(4, 36 + i).value = name
  for (let c = 1; c <= 39; c++) {
    headerStyle(ws.getCell(4, c))
    headerStyle(ws.getCell(5, c))
  }

  // Пары строк на сотрудника: коды (верхняя) + часы (нижняя)
  const row1 = 6
  for (let i = 0; i < PAIRS; i++) {
    const rc = row1 + i * 2 // строка кодов
    const rh = rc + 1
    ws.getCell(rc, 1).value = i + 1
    ws.getCell(rc, 1).alignment = { horizontal: 'center' }
    // Итоги считаются всегда, у кодовой строки пары
    ws.getCell(rc, 36).value = { formula: `SUM(E${rh}:R${rh})` }
    ws.getCell(rc, 37).value = { formula: `SUM(S${rh}:AI${rh})` }
    ws.getCell(rc, 38).value = { formula: `COUNTIF(E${rc}:AI${rc},"Я")+COUNTIF(E${rc}:AI${rc},"РВ")+COUNTIF(E${rc}:AI${rc},"С")` }
    ws.getCell(rc, 39).value = { formula: `AJ${rc}+AK${rc}` }
  }

  // Пример: ноябрь 2026, рабочие дни — Я/8, выходные — В
  const wknd = [1, 7, 8, 15, 16, 22, 23, 29, 30]
  ws.getCell(6, 2).value = 'Иванов И. И. (пример — удалите строку)'
  ws.getCell(6, 3).value = 'Слесарь'

  ws.getCell(6, 4).value = '001'
  for (let d = 1; d <= 30; d++) {
    ws.getCell(6, DAY0 + d - 1).value = wknd.includes(d) ? 'В' : 'Я'
    ws.getCell(7, DAY0 + d - 1).value = wknd.includes(d) ? null : 8
  }
  box(ws, 4, 1, 5 + 2 * PAIRS, 39)
  box(ws, 6, 5, 5 + 2 * PAIRS, 35)
  howTo(wb, 'Коды и календарь', [
    'Коды явок (по альбому Госкомстата):',
    'Я — работа в дневное время; Н — ночная; РВ — работа в выходной; С — сверхурочная',
    'В — выходной или праздник; ОТ — ежегодный отпуск; Б — больничный; НН — неявка по невыясненным причинам',
    '',
    'Нерабочие праздничные дни 2026 года (статья 112 ТК РФ):',
    '1–8 января; 23 февраля; 8 марта; 1 мая; 9 мая; 12 июня; 4 ноября',
    'Точные переносы выходных смотрите в производственном календаре на 2026 год.',
    '',
    'Итоговые колонки справа считаются сами: AJ — часы за 1-ю половину месяца, AK — за 2-ю,',
    'AL — дней явки, AM — всего часов. Руками складывать не нужно.',
  ])
  howTo(wb, 'Как заполнять', [
    '1. В шапке впишите организацию, подразделение и отчётный период.',
    '2. Строка «Иванов И. И.» — пример заполнения: удалите её содержимое и вносите своих людей.',
    '3. Верхняя строка пары — коды (Я, В, Б, ОТ и другие), нижняя — часы. Один человек — две строки.',
    '4. В месяце из 30 дней колонку дня 31 оставьте пустой.',
    '5. Итоговые колонки справа считаются сами, руками складывать не нужно.',
    '6. Внизу бланка ставятся подписи: ответственный, руководитель, кадровик.',
  ])
  return wb
}

// ── 2. Приход-расход-остаток ────────────────────────────────────────────────
function buildSklad() {
  const wb = new ExcelJS.Workbook()
  wb.creator = 'excel-to-app.ru'
  const ws = wb.addWorksheet('Учёт')
  const N0 = 3
  const NROWS = 200
  ws.columns = [
    { width: 12 }, { width: 22 }, { width: 30 }, { width: 8 },
    { width: 10 }, { width: 10 }, { width: 10 }, { width: 12 }, { width: 12 },
  ]
  const t = ws.getCell(1, 1)
  t.value = 'Учёт материалов: приход, расход, остаток'
  t.font = { bold: true, size: 13 }
  const heads = ['Дата', 'Документ', 'Наименование', 'Ед.', 'Приход', 'Расход', 'Цена', 'Сумма', 'Остаток']
  for (const [i, name] of heads.entries()) {
    const cell = ws.getCell(2, i + 1)
    cell.value = name
    headerStyle(cell)
  }
  box(ws, 2, 1, 2, 9)
  // 200 строк с формулами: сумма и остаток считаются сами
  for (let r = N0; r < N0 + NROWS; r++) {
    ws.getCell(r, 8).value = { formula: `IF(AND(E${r}<>"",F${r}<>""),"",(E${r}+F${r})*G${r})` }
    ws.getCell(r, 8).numFmt = moneyFmt
    ws.getCell(r, 9).value = { formula: `IF(C${r}="","",SUMIF($C$${N0}:C${r},C${r},$E$${N0}:E${r})-SUMIF($C$${N0}:C${r},C${r},$F$${N0}:F${r}))` }
    ws.getCell(r, 9).numFmt = '#,##0.###'
    for (const c of [1, 2, 3, 4, 5, 6, 7, 8, 9]) box(ws, r, c, r, c)
  }
  // Пример заполнения: 1–2 ноября 2026
  const sample = [
    [new Date('2026-11-01'), 'Приход (накладная 1)', 'Питание 12В', 'шт', 10, null, 249.9],
    [new Date('2026-11-02'), 'Акт выдачи №1', 'Питание 12В', 'шт', null, 4, null],
    [new Date('2026-11-02'), 'Приход (накладная 2)', 'Кабель ПВС 3x1.5', 'м', 50, null, 62.5],
  ]
  for (const [i, row] of sample.entries()) {
    const r = N0 + i
    for (const [j, v] of row.entries()) ws.getCell(r, j + 1).value = v
  }
  for (const r of [N0, N0 + 1, N0 + 2]) ws.getCell(r, 1).numFmt = 'DD.MM.YYYY'
  ws.getColumn(1).numFmt = 'DD.MM.YYYY'
  howTo(wb, 'Как пользоваться', [
    '1. Каждое движение — отдельная строка: приход или расход, и дата.',
    '2. «Сумма» и «Остаток» считаются сами. Остаток в строке — остаток этого наименования на момент строки.',
    '3. Сводка по каждому материалу — на листе «Остатки»: впишите наименования и колонки посчитаются сами.',
    '4. Если кто-то стёр формулу — скопируйте её из соседней ячейки той же колонки.',
    '5. Файл откроется в Excel, LibreOffice и Google Таблицах.',
  ])
  // Сводка «Остатки»: по каждому наименованию приход, расход и остаток
  const ws2 = wb.addWorksheet('Остатки')
  ws2.columns = [{ width: 30 }, { width: 8 }, { width: 12 }, { width: 12 }, { width: 12 }]
  const h2 = ['Наименование', 'Ед.', 'Приход всего', 'Расход всего', 'Остаток']
  for (const [i, name] of h2.entries()) {
    const cell = ws2.getCell(1, i + 1)
    cell.value = name
    headerStyle(cell)
  }
  for (let r = 2; r < 52; r++) {
    ws2.getCell(r, 3).value = { formula: `SUMIF(Учёт!$C:$C,$A${r},Учёт!$E:$E)` }
    ws2.getCell(r, 4).value = { formula: `SUMIF(Учёт!$C:$C,$A${r},Учёт!$F:$F)` }
    ws2.getCell(r, 5).value = { formula: `C${r}-D${r}` }
  }
  box(ws2, 1, 1, 51, 5)
  return wb
}

// ── 3. Журнал выдачи материалов ─────────────────────────────────────────────
function buildZhurnal() {
  const wb = new ExcelJS.Workbook()
  wb.creator = 'excel-to-app.ru'
  const ws = wb.addWorksheet('Журнал')
  const NROWS = 200
  ws.columns = [
    { width: 6 }, { width: 12 }, { width: 28 }, { width: 20 }, { width: 30 },
    { width: 8 }, { width: 10 }, { width: 14 }, { width: 14 }, { width: 22 },
  ]
  const t = ws.getCell(1, 1)
  t.value = 'Журнал выдачи материалов и спецодежды'
  t.font = { bold: true, size: 13 }
  const heads = ['№', 'Дата', 'Кому выдано', 'Подразделение / объект', 'Что выдано', 'Ед.', 'Кол-во', 'Срок возврата', 'Возвращено', 'Примечание']
  for (const [i, name] of heads.entries()) {
    const cell = ws.getCell(2, i + 1)
    cell.value = name
    headerStyle(cell)
  }
  box(ws, 2, 1, 2, 10)
  for (let r = 3; r < 3 + NROWS; r++) {
    ws.getCell(r, 1).value = { formula: `IF(B${r}="","",ROW()-2)` }
    for (const c of [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]) box(ws, r, c, r, c)
  }
  ws.getColumn(2).numFmt = 'DD.MM.YYYY'
  ws.getColumn(8).numFmt = 'DD.MM.YYYY'
  ws.getColumn(9).numFmt = 'DD.MM.YYYY'
  const sample = [
    [new Date('2026-11-02'), 'Смирнов А. В.', 'Цех №2', 'Перчатки х/б', 'пар', 5, new Date('2026-12-02')],
    [new Date('2026-11-02'), 'Кузнецова М. С.', 'Объект «Южный»', 'Каска защитная', 'шт', 1, null],
  ]
  for (const [i, row] of sample.entries()) {
    const r = 3 + i
    for (const [j, v] of row.entries()) ws.getCell(r, j + 1).value = v
  }
  howTo(wb, 'Как вести', [
    '1. Одна выдача — одна строка: дата, кому, что и сколько.',
    '2. «Срок возврата» — для инструмента и многоразового; для спецодежды впишите срок носки.',
    '3. «Возвращено» — дата возврата; пустая ячейка у спецодежды — норма.',
    '4. Колонка № появляется сама, когда заполнена дата.',
    '5. Файл откроется в Excel, LibreOffice и Google Таблицах.',
  ])
  return wb
}

// ── Запуск ──────────────────────────────────────────────────────────────────
mkdirSync(OUT_DIR, { recursive: true })
const files = [
  ['tabel-t13-2026.xlsx', buildTabel()],
  ['prihod-rashod-ostatok.xlsx', buildSklad()],
  ['zhurnal-vydachi-materialov.xlsx', buildZhurnal()],
]
for (const [name, wb] of files) {
  writeFileSync(resolve(OUT_DIR, name), Buffer.from(await wb.xlsx.writeBuffer()))
  console.log(name)
}
