// Мелкие элементы схем /help (crm#5626): карандаш, подвал таблицы.
import { C, rect, text } from './lib.mjs'

/** Карандаш «Редактировать» (в первой ячейке строки). */
export const pencil = (x, y, color = C.blue) =>
  `<path d="M${x} ${y + 12} l2 -5 l8 -8 l3 3 l-8 8 z" fill="none" stroke="${color}" stroke-width="1.5" stroke-linejoin="round"/>`

/** Подвал таблицы: «+» добавить строку, иконка буфера, счётчик. */
export function footer(x, y, shown = 4, total = 4) {
  const plus = { x, y, w: 24, h: 24 }
  const clip = { x: x + 32, y, w: 24, h: 24 }
  const s =
    rect(plus.x, plus.y, 24, 24, { r: 6, stroke: C.line2 }) +
    `<path d="M${x + 12} ${y + 6} v12 M${x + 6} ${y + 12} h12" stroke="${C.muted}" stroke-width="1.6"/>` +
    rect(clip.x, clip.y, 24, 24, { r: 6, stroke: C.line2 }) +
    `<rect x="${clip.x + 7}" y="${y + 6}" width="10" height="13" rx="2" fill="none" stroke="${C.muted}" stroke-width="1.4"/>` +
    `<rect x="${clip.x + 9}" y="${y + 4}" width="6" height="4" rx="1" fill="${C.card}" stroke="${C.muted}" stroke-width="1.2"/>` +
    text(x + 68, y + 17, `Показано ${shown} из ${total}`, { size: 12.5, fill: C.muted })
  return { svg: s, plus, clip }
}
