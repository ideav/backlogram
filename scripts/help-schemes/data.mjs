// Схемы раздела «Работа с данными» (crm#5626). Подписи — js/integram-table в ideav/crm.
import {
  C, TW, W, X, ROWS5, badge, badgeAt, button, checkbox, dialog, field, hint, menu, page, rect, ring, ringAt, shade, svg, table, tableHeader, text, toast,
} from './lib.mjs'
import { footer, pencil } from './parts.mjs'

const WITH_CLEAR = ['группы', 'очистить', 'фильтры', 'экспорт', 'ссылка', 'вид', 'колонки']

export const DATA = {
  'data-filter-basic-1': () => {
    const h = tableHeader(X, 56, TW, { labels: WITH_CLEAR, active: ['фильтры'], hl: ['фильтры', 'очистить'] })
    const g = table(104, {
      rows: [ROWS5[0]],
      filters: [['^', null, 'Фильтр...'], ['~', 'Ромашка'], ['=', null, 'дд.мм.гггг'], ['=', null, ''], ['=', null, 'Выбрать... ▼']],
    })
    const sym = { x: g.at(-2, 1).x + 3, y: g.at(-2, 1).y + 7, w: 14, h: 20 }
    const val = { x: g.at(-2, 1).x + 20, y: g.at(-2, 1).y + 6, w: 70, h: 22 }
    return svg(W, 250, h.svg + g.svg +
      badgeAt(h.pos['фильтры'], 1) + badgeAt(h.pos['очистить'], 5) +
      ring(val.x, val.y, val.w, val.h, 5) + badge(val.x + val.w + 16, val.y + 11, 2) +
      ring(sym.x, sym.y, sym.w, sym.h, 4) + badge(sym.x - 14, sym.y + 10, 3) +
      hint(X, 232, 'Фильтр «содержит Ромашка» в колонке «Клиент» оставил одну строку'),
    { title: 'Фильтры таблицы: кнопка «фильтры», строка полей под шапкой, символ способа сравнения, кнопка «очистить»' })
  },
  'data-export-excel-1': () => {
    const p = page({ active: ['экспорт'], hl: ['экспорт'] })
    const b = p.pos['экспорт']
    return svg(W, 300, p.svg + badgeAt(b, 3) +
      menu(b.x - 40, b.y + 42, 200, ['XLSX (Excel)', 'XLS (Excel 97-2003)', 'CSV', 'В буфер'], { hi: 0 }) +
      badge(b.x - 52, b.y + 66, 4),
    { title: 'Кнопка «экспорт» открывает меню форматов: XLSX (Excel), XLS (Excel 97-2003), CSV, В буфер' })
  },
  'data-share-view-1': () => {
    const p = page({ labels: ['группы', 'очистить', 'фильтры', 'экспорт', 'ссылка', 'вид', 'колонки'], active: ['фильтры'], hl: ['ссылка'] }, { rows: ROWS5.slice(0, 3) })
    const b = p.pos['ссылка']
    return svg(W, 300, p.svg + badgeAt(b, 2) + toast(X + 190, 240, 'Ссылка скопирована в буфер обмена'),
    { title: 'Кнопка «ссылка» копирует адрес таблицы с текущими фильтрами и группировкой' })
  },
  'data-group-1': () => {
    const p = page({ active: ['группы'], hl: ['группы'] })
    const dx = 170, dy = 78, dw = 400
    let s = p.svg + shade(W, 300) + dialog(dx, dy, dw, 200, 'Настройка группировки') + badgeAt(p.pos['группы'], 1)
    s += hint(dx + 20, dy + 74, 'Порядок выбора определяет вложенность групп.')
    ;[['Статус', 1], ['Клиент', 2], ['Дата', 0]].forEach(([n, o], i) => {
      const y = dy + 90 + i * 26
      s += checkbox(dx + 20, y, !!o) + text(dx + 44, y + 12, n)
      if (o) s += rect(dx + 110, y, 18, 16, { r: 8, fill: C.blueSoft, stroke: C.blueSoft }) + text(dx + 119, y + 12, String(o), { size: 11, anchor: 'middle', fill: C.blue, weight: 700 })
    })
    s += badge(dx + 150, dy + 110, 2)
    const a = button(dx + dw - 200, dy + 158, 'Применить', { kind: 'primary' })
    s += a.svg + button(dx + dw - 200 + a.w + 8, dy + 158, 'Закрыть').svg + badge(dx + dw - 200 + a.w + 4, dy + 156, 3)
    return svg(W, 300, s, { title: 'Окно «Настройка группировки»: галки полей, номера порядка, кнопка «Применить»' })
  },
  'data-table-settings-1': () => {
    const p = page({ active: ['вид'], hl: ['вид'] })
    const dx = 160, dy = 104, dw = 440
    let s = p.svg + shade(W, 410) + dialog(dx, dy, dw, 286, 'Настройка представления') + badgeAt(p.pos['вид'], 1)
    s += text(dx + 20, dy + 80, 'Отступы:', { size: 13 })
    s += rect(dx + 96, dy + 64, 92, 26, { r: 6, fill: C.blueSoft, stroke: C.blue }) + text(dx + 142, dy + 81, 'Просторно', { size: 12, anchor: 'middle', fill: C.blue })
    s += rect(dx + 192, dy + 64, 92, 26, { r: 6, stroke: C.line2 }) + text(dx + 238, dy + 81, 'Компактно', { size: 12, anchor: 'middle' }) + badge(dx + 296, dy + 77, 2)
    s += text(dx + 20, dy + 118, 'Размер страницы:', { size: 13 }) + rect(dx + 140, dy + 102, 80, 26, { r: 6, stroke: C.line2 }) + text(dx + 152, dy + 120, '20', { size: 12 }) + badge(dx + 234, dy + 115, 3)
    ;[['Сокращать длинные значения', true, 4], ['Переносить заголовки', false], ['Скрыть подписи к кнопкам меню', false], ['Показывать связи', false]].forEach(([n, on, b], i) => {
      const y = dy + 142 + i * 24
      s += checkbox(dx + 20, y, on) + text(dx + 44, y + 12, n, { size: 13 })
      if (b) s += badge(dx + 270, y + 7, b)
    })
    const r = button(dx + 20, dy + 244, 'Сбросить настройки')
    s += r.svg + badge(dx + 20 + r.w + 6, dy + 244, 5) + button(dx + dw - 96, dy + 244, 'Закрыть').svg
    return svg(W, 410, s, { title: 'Окно «Настройка представления»: отступы, размер страницы, сокращение длинных значений, сброс' })
  },
  'data-record-edit-1': () => {
    const p = page({ plusRing: true }, { cell: (ri, ci, r) => (ci === 0 && ri === 1 ? pencil(r.x + 50, r.y + 10) + ring(r.x + 46, r.y + 6, 20, 20, 5) : '') })
    const c = p.g.at(1, 0)
    return svg(W, 300, p.svg + badge(c.x + 82, c.y + 16, 2) + badgeAt(p.pos.plus, 5) +
      hint(X, 286, 'Карандаш в первой ячейке строки открывает форму записи; «+» у названия — форму новой записи'),
    { title: 'Таблица «Заказ»: карандаш в первой ячейке строки открывает форму, кнопка «+» у названия создаёт запись' })
  },
  'data-record-edit-2': () => {
    const dx = 60, dy = 52, dw = 620
    let s = dialog(dx, dy, dw, 300, 'Редактирование: 3')
    s += rect(dx + 172, dy + 18, 46, 20, { r: 10, fill: '#f1f5f9', stroke: C.line }) + text(dx + 195, dy + 32, '#1077', { size: 11, anchor: 'middle', fill: C.muted })
    s += field(dx + 20, dy + 78, 280, 'Заказ *', '3') + field(dx + 320, dy + 78, 280, 'Клиент', 'АО «Стройторг»', { select: true })
    s += field(dx + 20, dy + 138, 180, 'Дата', '18.11.2026') + field(dx + 220, dy + 138, 180, 'Сумма', '203 400') + field(dx + 420, dy + 138, 180, 'Статус', 'Новый', { select: true })
    s += field(dx + 20, dy + 198, 580, 'Комментарий', 'Нужен счёт') + badge(dx + 600, dy + 210, 3)
    const del = button(dx + 20, dy + 254, 'Удалить', { kind: 'danger' })
    const dup = button(dx + dw - 340, dy + 254, 'Дублировать')
    const sx = dx + dw - 340 + dup.w + 8
    const save = button(sx, dy + 254, 'Сохранить', { kind: 'primary' })
    const cancel = button(sx + save.w + 8, dy + 254, 'Отменить')
    s += del.svg + dup.svg + save.svg + cancel.svg
    s += ring(sx, dy + 254, save.w, 30) + badge(sx + save.w + 2, dy + 252, 4)
    return svg(W, 380, s, { title: 'Форма «Редактирование: 3»: поля записи с подписями и кнопки «Удалить», «Дублировать», «Сохранить», «Отменить»' })
  },
  'data-inline-edit-1': () => {
    const edit = (r) => rect(r.x + 2, r.y + 2, r.w - 4, r.h - 4, { r: 3, fill: C.card, stroke: C.blue, sw: 2 }) +
      text(r.x + r.w - 14, r.y + 22, '198 000', { size: 12.5, anchor: 'end' }) +
      `<path d="M${r.x + r.w - 10} ${r.y + 9} V${r.y + 26}" stroke="${C.text}"/>`
    const p = page({}, { cell: (ri, ci, r) => (ri === 2 && ci === 3 ? edit(r) : '') })
    const c = p.g.at(2, 3)
    return svg(W, 310, p.svg + badge(c.x + c.w + 10, c.y + 4, 2) +
      hint(X, 288, 'Щелчок по ячейке — поле ввода прямо в таблице. Enter — сохранить, Esc — отменить, Tab — к соседней ячейке.'),
    { title: 'Правка в ячейке: ячейка «Сумма» стала полем ввода' })
  },
  'data-delete-many-1': () => {
    const labels = ['группы', 'фильтры', 'экспорт', 'Удалить (2)', 'ссылка', 'вид', 'колонки']
    const h = tableHeader(X, 56, TW, { labels, checkRing: true })
    const cols = [{ name: 'Заказ', w: 70 }, { name: 'Клиент', w: 160, ref: true }, { name: 'Дата', w: 116 }, { name: 'Сумма', w: 110, num: true }, { name: 'Статус', w: 178, ref: true }]
    const g = table(104, { checks: [0, 2], cols })
    const d = h.pos['Удалить (2)']
    let s = h.svg + rect(d.x, d.y, d.w, d.h, { r: 7, fill: C.red, stroke: C.red }) +
      text(d.x + d.w / 2, d.y + 22, 'Удалить (2)', { size: 12, anchor: 'middle', fill: '#fff', weight: 600 }) + ring(d.x, d.y, d.w, d.h)
    s += g.svg + badgeAt(h.pos.check, 1) + badge(X - 10, 104 + 34 + 17, 2) + badgeAt(d, 3)
    return svg(W, 316, s + hint(X, 296, 'Галка у названия включает колонку выбора; галка в шапке выбирает все строки'),
    { title: 'Массовое удаление: колонка галок, отмечены две строки, красная кнопка «Удалить (2)»' })
  },
  'data-filter-symbols-1': () => {
    const filters = [['^', null, 'Фильтр...'], ['~', null, ''], ['=', null, 'дд.мм.гггг'], ['=', null, ''], ['=', null, 'Выбрать... ▼']]
    const p = page({ active: ['фильтры'] }, { filters, rows: ROWS5.slice(0, 2) })
    const f = p.g.at(-2, 1)
    const items = [['^', 'начинается с...'], ['=', 'равно'], ['≠', 'не равно'], ['~', 'содержит'], ['!', 'не содержит'], ['%', 'не пустое'], ['!%', 'пустое'], ['(,)', 'в списке']]
    return svg(W, 400, p.svg + ring(f.x + 4, f.y + 8, 14, 18, 4) + badge(f.x - 10, f.y + 17, 3) + menu(f.x + 4, f.y + 32, 220, items, { hi: 3 }),
    { title: 'Меню способа сравнения в поле фильтра: начинается с, равно, не равно, содержит, не содержит, не пустое, пустое, в списке' })
  },
  'data-import-paste-1': () => {
    const p = page({}, { rows: ROWS5.slice(0, 3) })
    const f = footer(X, 104 + 4 * 34 + 12, 3, 3)
    return svg(W, 300, p.svg + f.svg + ringAt(f.clip, 6) + badgeAt(f.clip, 2) +
      hint(X, 286, 'Иконка буфера — в подвале таблицы, рядом с «+» и счётчиком строк'),
    { title: 'Подвал таблицы: кнопка «+», иконка «Вставить данные из буфера» и счётчик «Показано 3 из 3»' })
  },
  'data-import-paste-2': () => {
    const dx = 70, dy = 52, dw = 600
    let s = dialog(dx, dy, dw, 316, 'Вставить данные из буфера')
    s += rect(dx + 20, dy + 66, dw - 40, 130, { r: 6, stroke: C.line2 })
    const lines = [
      ['5', 'ООО «Вектор»', '24.11.2026', '73000', 'Новый'],
      ['6', 'ИП Смирнова', '24.11.2026', '15600', 'Оплачен'],
      ['7', 'АО «Стройторг»', '25.11.2026', '98200', 'В работе'],
    ]
    lines.forEach((l, i) => l.forEach((v, j) => { s += text(dx + 32 + [0, 30, 170, 280, 360][j], dy + 90 + i * 22, v, { size: 12.5 }) }))
    s += badge(dx + dw - 30, dy + 80, 3) + hint(dx + 20, dy + 216, 'Текст, разделённый символами табуляции, «;» или «,»')
    s += checkbox(dx + 20, dy + 262, true) + text(dx + 42, dy + 274, 'Создавать справочные значения', { size: 13 }) + badge(dx + 270, dy + 269, 4)
    const bx = dx + dw - 300
    const pv = button(bx, dy + 254, 'Просмотр')
    const ins = button(bx + pv.w + 8, dy + 254, 'Вставить', { kind: 'primary' })
    s += pv.svg + ins.svg + button(bx + pv.w + ins.w + 16, dy + 254, 'Отменить').svg
    s += ring(bx + pv.w + 8, dy + 254, ins.w, 30) + badge(bx + pv.w + 8 + ins.w, dy + 250, 5)
    return svg(W, 400, s, { title: 'Окно «Вставить данные из буфера»: вставленные строки, галка «Создавать справочные значения», кнопки «Просмотр», «Вставить», «Отменить»' })
  },
  'data-import-csv-1': () => {
    const p = page({ active: ['вид'], hl: ['вид'] }, { rows: ROWS5.slice(0, 2) })
    const v = p.pos['вид']
    const mx = v.x - 200, my = v.y + 42
    let s = p.svg + rect(mx, my + 3, 260, 96, { r: 10, fill: 'rgba(15,23,42,0.10)', stroke: 'none' }) + rect(mx, my, 260, 96, { r: 10, stroke: C.line })
    s += text(mx + 16, my + 26, 'Настройка представления', { size: 13, weight: 600 }) + text(mx + 16, my + 52, '…', { fill: C.faint })
    s += text(mx + 16, my + 78, 'Перейти в старый интерфейс', { size: 13, fill: C.link }) + ring(mx + 12, my + 62, 196, 22, 5) + badge(mx + 222, my + 73, 4)
    const oy = 250
    s += rect(X, oy, TW, 90, { r: 10, fill: '#f8fafc', stroke: C.line2, dash: '5 4' }) + hint(X + 14, oy + 22, 'Старый интерфейс таблицы', { weight: 600 })
    const ch = button(X + 14, oy + 40, 'Выберите файл')
    s += ch.svg + text(X + 24 + ch.w, oy + 60, 'clients.bki', { size: 13 })
    const ix = X + 130 + ch.w
    const im = button(ix, oy + 40, 'Импорт архива', { kind: 'primary' })
    s += im.svg + ring(ix, oy + 40, im.w, 30) + badgeAt({ x: ix, y: oy + 40, w: im.w, h: 30 }, 5) + button(ix + im.w + 10, oy + 40, 'Отменить').svg
    return svg(W, 360, s, { title: 'Загрузка файла: «вид» → «Перейти в старый интерфейс», там «Выберите файл» и «Импорт архива»' })
  },
}
