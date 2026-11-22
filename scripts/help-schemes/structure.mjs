// Схемы раздела «Структура данных» (crm#5626). Подписи: окно «колонки» —
// js/integram-table/11-column-settings.js, страница «Таблицы» — templates/tables.html.
import { C, W, X, badge, badgeAt, button, checkbox, dialog, field, hint, page, rect, ring, shade, svg, text } from './lib.mjs'
import { pencil } from './parts.mjs'

const COLUMNS = ['Заказ', 'Клиент', 'Дата', 'Сумма', 'Статус']

/** Окно «Настройки колонок таблицы». drag — индекс перетаскиваемой строки. */
function columnSettings(dx, dy, { drag, editRing, addRing } = {}) {
  const dw = 420
  let s = dialog(dx, dy, dw, 290, 'Настройки колонок таблицы')
  COLUMNS.forEach((n, i) => {
    const y = dy + 62 + i * 34
    const off = i === drag ? 26 : 0
    if (i === drag) s += rect(dx + 14 + off, y - 2, dw - 28, 32, { r: 6, fill: C.blueSoft, stroke: C.blue })
    s += text(dx + 24 + off, y + 18, i === 0 ? '🔒' : '☰', { size: 13, fill: C.muted })
    s += text(dx + 44 + off, y + 18, i === 0 ? '' : String(i + 1), { size: 11, fill: C.faint })
    s += checkbox(dx + 62 + off, y + 6, true) + text(dx + 86 + off, y + 18, n, { size: 13 })
    s += pencil(dx + dw - 40 + off, y + 6, C.muted)
    if (i === editRing) s += ring(dx + dw - 44, y + 2, 20, 22, 5)
  })
  const add = button(dx + 20, dy + 244, 'Добавить колонку', { kind: 'primary' })
  s += add.svg + button(dx + dw - 96, dy + 244, 'Закрыть').svg
  if (addRing) s += ring(dx + 20, dy + 244, add.w, 30)
  return { svg: s, add: { x: dx + 20, y: dy + 244, w: add.w, h: 30 }, dw }
}

/** Окно «Редактирование колонки» для колонки-ссылки «Статус». hl — подсвеченная строка. */
function columnEdit(hl) {
  const dx = 120, dy = 52, dw = 500
  let s = dialog(dx, dy, dw, 340, 'Редактирование колонки: Статус')
  s += field(dx + 20, dy + 74, 220, 'Название:', 'Статус') + field(dx + 260, dy + 74, 220, 'Базовый тип:', 'Ссылочный тип (справочник)')
  const rows = [
    ['unique', 'Входит в проверку уникальности', false],
    ['required', 'Обязательно к заполнению', true],
    ['multi', 'Выбор нескольких значений', false],
  ]
  rows.forEach(([id, label, on], i) => {
    const y = dy + 128 + i * 26
    s += checkbox(dx + 20, y, on) + text(dx + 44, y + 12, label, { size: 13 })
    if (id === hl) s += ring(dx + 16, y - 4, label.length * 7.4 + 34, 22, 5) + badge(dx + label.length * 7.4 + 66, y + 7, 3)
  })
  s += field(dx + 20, dy + 216, 300, 'Псевдоним:', 'Статус заказа')
  if (hl === 'alias') s += ring(dx + 20, dy + 222, 300, 30, 6) + badge(dx + 336, dy + 236, 3)
  s += text(dx + 344, dy + 242, 'Перейти в справочник', { size: 13, fill: C.link })
  const del = button(dx + 20, dy + 290, 'Удалить колонку', { kind: 'danger' })
  const sx = dx + dw - 210
  const save = button(sx, dy + 290, 'Сохранить', { kind: 'primary' })
  s += del.svg + save.svg + button(sx + save.w + 8, dy + 290, 'Отменить').svg + badge(sx + save.w, dy + 288, 4)
  return s
}

const editTitle = (what) => `Окно «Редактирование колонки: Статус»: ${what}, кнопки «Удалить колонку», «Сохранить», «Отменить»`

export const STRUCTURE = {
  'structure-create-table-1': () => {
    let s = text(X, 80, 'Таблицы', { size: 22, weight: 700 })
    s += rect(X + 330, 58, 190, 32, { r: 8, stroke: C.line2 }) + text(X + 344, 79, 'Поиск таблиц...', { fill: C.faint })
    const nb = button(X + 530, 58, '+ Новая таблица', { kind: 'primary', h: 32 })
    s += nb.svg + ring(X + 530, 58, nb.w, 32) + badgeAt({ x: X + 530, y: 58, w: nb.w, h: 32 }, 1)
    ;['Клиент', 'Заказ', 'Статус', 'Задача'].forEach((n, i) => { s += rect(X + i * 166, 110, 154, 54, { r: 10, stroke: C.line }) + text(X + 16 + i * 166, 142, n, { size: 14 }) })
    const dx = 170, dy = 118, dw = 400
    s += shade(W, 430) + dialog(dx, dy, dw, 280, 'Новая таблица')
    s += field(dx + 20, dy + 74, dw - 40, 'Название таблицы', 'Проект') + badge(dx + dw - 16, dy + 94, 2)
    s += field(dx + 20, dy + 134, dw - 40, 'Тип', 'Короткая строка (до 127 символов)', { select: true }) + badge(dx + dw - 16, dy + 154, 3)
    s += checkbox(dx + 20, dy + 190, true) + text(dx + 44, dy + 202, 'Уникальные значения', { size: 13 }) + badge(dx + 210, dy + 197, 4)
    const cr = button(dx + 20, dy + 230, 'Создать', { kind: 'primary' })
    s += cr.svg + button(dx + 28 + cr.w, dy + 230, 'Отменить').svg + badge(dx + 20 + cr.w, dy + 228, 5)
    return svg(W, 430, s, { title: 'Страница «Таблицы»: кнопка «+ Новая таблица» и окно «Новая таблица» — название, тип, «Уникальные значения», «Создать»' })
  },
  'structure-add-column-1': () => {
    const p = page({ active: ['колонки'], hl: ['колонки'] })
    const c = columnSettings(160, 66, { addRing: true })
    return svg(W, 380, p.svg + shade(W, 380) + c.svg + badgeAt(p.pos['колонки'], 1) + badgeAt(c.add, 2),
    { title: 'Кнопка «колонки» открывает окно «Настройки колонок таблицы» с кнопкой «Добавить колонку»' })
  },
  'structure-add-column-2': () => {
    const dx = 150, dy = 52, dw = 440
    let s = dialog(dx, dy, dw, 290, 'Добавить новую колонку')
    s += field(dx + 20, dy + 74, dw - 40, 'Имя колонки:', 'Адрес') + badge(dx + dw - 16, dy + 94, 3)
    s += field(dx + 20, dy + 134, dw - 40, 'Базовый тип:', 'Короткая строка (до 127 символов)', { select: true })
    s += checkbox(dx + 20, dy + 192, false) + text(dx + 44, dy + 204, 'Списочное значение (справочник)', { size: 13 }) + badge(dx + 290, dy + 199, 4)
    const cr = button(dx + dw - 190, dy + 236, 'Создать', { kind: 'primary' })
    s += cr.svg + button(dx + dw - 190 + cr.w + 8, dy + 236, 'Отменить').svg + badge(dx + dw - 190 + cr.w, dy + 234, 5)
    return svg(W, 370, s, { title: 'Окно «Добавить новую колонку»: имя, базовый тип, галка «Списочное значение (справочник)», «Создать»' })
  },
  'structure-column-order-1': () => {
    const p = page({ active: ['колонки'], hl: ['колонки'] })
    const c = columnSettings(160, 66, { drag: 3 })
    const y = 66 + 62 + 3 * 34
    return svg(W, 404, p.svg + shade(W, 404) + c.svg + badgeAt(p.pos['колонки'], 1) + badge(160 + 30, y + 14, 2) +
      `<path d="M${160 + c.dw + 20} ${y + 14} v-60" stroke="${C.mark}" stroke-width="2.5" marker-end="url(#a)"/>` +
      `<defs><marker id="a" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto"><path d="M0 0 L8 4 L0 8 z" fill="${C.mark}"/></marker></defs>` +
      hint(160, 380, 'Колонку тянут за ☰; первая колонка зафиксирована 🔒'),
    { title: 'Окно «Настройки колонок таблицы»: колонку «Сумма» перетаскивают за ☰ на новое место' })
  },
  'structure-required-1': () => svg(W, 420, columnEdit('required'), { title: editTitle('отмечена галка «Обязательно к заполнению»') }),
  'structure-alias-1': () => svg(W, 420, columnEdit('alias'), { title: editTitle('поле «Псевдоним:» со значением «Статус заказа»') }),
  'structure-multiref-1': () => svg(W, 420, columnEdit('multi'), { title: editTitle('галка «Выбор нескольких значений»') }),
}
