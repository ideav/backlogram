// Примитивы схем интерфейса для /help (ideav/crm#5626).
// Схема — упрощённый рисунок НОВОГО интерфейса таблицы (js/integram-table в ideav/crm):
// те же подписи кнопок и окон, без пиксельной точности. Один стиль на все картинки.

export const C = {
  bg: '#f8fafc', card: '#ffffff', line: '#e2e8f0', line2: '#cbd5e1',
  text: '#0f172a', muted: '#64748b', faint: '#94a3b8',
  blue: '#2563eb', blueSoft: '#dbeafe', link: '#2563eb',
  red: '#dc2626', green: '#16a34a', amber: '#f59e0b',
  mark: '#f97316', shade: 'rgba(15,23,42,0.28)',
}
const FONT = "Inter, 'Segoe UI', Roboto, Arial, sans-serif"

export const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c])

export const rect = (x, y, w, h, { r = 6, fill = C.card, stroke = C.line, sw = 1, dash } = {}) =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"${dash ? ` stroke-dasharray="${dash}"` : ''}/>`

export const text = (x, y, s, { size = 13, fill = C.text, weight = 400, anchor = 'start' } = {}) =>
  `<text x="${x}" y="${y}" font-size="${size}" font-weight="${weight}" fill="${fill}" text-anchor="${anchor}">${esc(s)}</text>`

/** Номер шага: оранжевый кружок, совпадает с номером шага в статье. */
export const badge = (x, y, n) =>
  `<g><circle cx="${x}" cy="${y}" r="11" fill="${C.mark}"/>${text(x, y + 4.5, String(n), { size: 12, fill: '#fff', weight: 700, anchor: 'middle' })}</g>`

/** Подсветка элемента, на который нажимают. */
export const ring = (x, y, w, h, r = 8) =>
  `<rect x="${x - 3}" y="${y - 3}" width="${w + 6}" height="${h + 6}" rx="${r}" fill="none" stroke="${C.mark}" stroke-width="2.5"/>`

export const checkbox = (x, y, on = false) =>
  rect(x, y, 14, 14, { r: 3, fill: on ? C.blue : C.card, stroke: on ? C.blue : C.line2 }) +
  (on ? `<path d="M${x + 3} ${y + 7.5} l3 3 l5 -6" fill="none" stroke="#fff" stroke-width="2"/>` : '')

export const button = (x, y, label, { kind = 'default', w, h = 30 } = {}) => {
  const width = w ?? Math.round(label.length * 7.4 + 26)
  const st = {
    primary: { fill: C.blue, stroke: C.blue, color: '#fff' },
    danger: { fill: C.red, stroke: C.red, color: '#fff' },
    default: { fill: C.card, stroke: C.line2, color: C.text },
  }[kind]
  return { w: width, svg: rect(x, y, width, h, { fill: st.fill, stroke: st.stroke }) + text(x + width / 2, y + h / 2 + 4.5, label, { anchor: 'middle', fill: st.color, size: 13, weight: kind === 'default' ? 400 : 600 }) }
}

/** Поле ввода с подписью сверху. */
export const field = (x, y, w, label, value, { placeholder = false, select = false } = {}) =>
  (label ? text(x, y, label, { size: 12, fill: C.muted }) : '') +
  rect(x, y + 6, w, 30, { stroke: C.line2 }) +
  text(x + 10, y + 26, value, { fill: placeholder ? C.faint : C.text }) +
  (select ? `<path d="M${x + w - 18} ${y + 19} l5 5 l5 -5" fill="none" stroke="${C.muted}" stroke-width="1.6"/>` : '')

/** Холст: светлая подложка и окно браузера с адресом базы. */
export function svg(w, h, body, { title = '', url = 'ideav.ru/mydb' } = {}) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" font-family="${FONT}" role="img" aria-label="${esc(title)}">
<title>${esc(title)}</title>
<rect width="${w}" height="${h}" rx="14" fill="${C.bg}"/>
${rect(12, 12, w - 24, h - 24, { r: 10, fill: C.card, stroke: C.line })}
<path d="M12 22 a10 10 0 0 1 10 -10 h${w - 44} a10 10 0 0 1 10 10 v18 h-${w - 24} z" fill="#f1f5f9"/>
<circle cx="30" cy="27" r="4" fill="#f87171"/><circle cx="44" cy="27" r="4" fill="#fbbf24"/><circle cx="58" cy="27" r="4" fill="#34d399"/>
${rect(78, 19, Math.min(320, w - 120), 16, { r: 8, fill: C.card, stroke: C.line })}
${text(90, 31, url, { size: 10.5, fill: C.muted })}
${body}
</svg>
`
}

/** Кнопки панели таблицы, слева направо, как в js/integram-table/04-render-table.js. */
export const TOOLBAR = ['группы', 'фильтры', 'экспорт', 'ссылка', 'вид', 'колонки']

/**
 * Шапка таблицы: галка выбора строк, название, «+», справа «обновить» и кнопки.
 * opts.hl — подписи подсвеченных кнопок, opts.active — нажатые, opts.extra — доп. кнопки
 * (например «очистить» перед «фильтры»). Возвращает svg и координаты кнопок.
 */
export function tableHeader(x, y, w, { name = 'Заказ', hl = [], active = [], labels = TOOLBAR, plusRing = false, checkRing = false } = {}) {
  const pos = {}
  let s = `<path d="M${x + 4} ${y + 10} h12 v12 h-12 z" fill="none" stroke="${checkRing ? C.blue : C.muted}" stroke-width="1.5"/><path d="M${x + 7} ${y + 16} l3 3 l5 -6" fill="none" stroke="${checkRing ? C.blue : C.muted}" stroke-width="1.5"/>`
  s += text(x + 28, y + 23, name, { size: 18, weight: 600 })
  const px = x + 30 + name.length * 10.5
  s += rect(px, y + 3, 26, 26, { r: 6, fill: C.blue, stroke: C.blue }) + `<path d="M${px + 13} ${y + 9} v14 M${px + 6} ${y + 16} h14" stroke="#fff" stroke-width="2"/>`
  pos.plus = { x: px, y: y + 3, w: 26, h: 26 }
  pos.check = { x: x + 1, y: y + 7, w: 18, h: 18 }
  let bx = x + w
  const bw = (l) => Math.max(46, l.length * 7.2 + 18)
  for (const l of [...labels].reverse()) {
    bx -= bw(l) + 6
    pos[l] = { x: bx, y, w: bw(l), h: 34 }
  }
  for (const l of labels) {
    const p = pos[l]
    const on = active.includes(l)
    s += rect(p.x, p.y, p.w, p.h, { r: 7, fill: on ? C.blueSoft : C.card, stroke: on ? C.blue : C.line2 })
    s += `<rect x="${p.x + p.w / 2 - 5}" y="${p.y + 6}" width="10" height="9" rx="2" fill="none" stroke="${on ? C.blue : C.muted}" stroke-width="1.3"/>`
    s += text(p.x + p.w / 2, p.y + 28, l, { size: 11, anchor: 'middle', fill: on ? C.blue : C.muted })
  }
  s += `<circle cx="${bx - 18}" cy="${y + 17}" r="6" fill="none" stroke="${C.muted}" stroke-width="1.5"/>`
  for (const l of hl) s += ring(pos[l].x, pos[l].y, pos[l].w, pos[l].h)
  if (plusRing) s += ring(pos.plus.x, pos.plus.y, 26, 26)
  if (checkRing) s += ring(pos.check.x, pos.check.y, 18, 18, 4)
  return { svg: s, pos }
}

/** Демо-данные таблицы «Заказ» (нейтральные). */
export const COLS = [
  { name: 'Заказ', w: 70 }, { name: 'Клиент', w: 150, ref: true }, { name: 'Дата', w: 100 },
  { name: 'Сумма', w: 90, num: true }, { name: 'Статус', w: 100, ref: true }, { name: 'Комментарий', w: 140 },
]
export const ROWS = [
  ['1', 'ООО «Ромашка»', '16.11.2026', '84 500', 'Оплачен', 'Партия 142'],
  ['2', 'ИП Иванов', '17.11.2026', '12 700', 'В работе', ''],
  ['3', 'АО «Стройторг»', '18.11.2026', '203 400', 'Новый', 'Нужен счёт'],
  ['4', 'ООО «Вектор»', '19.11.2026', '56 000', 'В работе', ''],
]

/**
 * Сетка таблицы. opts.filters — строка фильтров (массив [символ, значение|null, placeholder]),
 * opts.checks — колонка галок (массив отмеченных индексов строк), opts.cell(ri, ci) — svg поверх ячейки.
 * Возвращает svg, высоту и функцию at(ri, ci) → прямоугольник ячейки (ri = -1 — шапка, -2 — фильтр).
 */
export function grid(x, y, { cols = COLS, rows = ROWS, filters, checks, cell, rowH = 34 } = {}) {
  const cw = checks ? 34 : 0
  const xs = [x + cw]
  for (const c of cols) xs.push(xs[xs.length - 1] + c.w)
  const W = xs[xs.length - 1] - x
  let s = rect(x, y, W, rowH, { r: 0, fill: '#f1f5f9', stroke: C.line })
  cols.forEach((c, i) => { s += text(xs[i] + 10, y + 22, c.name, { size: 12, weight: 600, fill: C.muted }) })
  let yy = y + rowH
  const top = { head: y }
  if (filters) {
    top.filter = yy
    s += rect(x, yy, W, rowH, { r: 0, stroke: C.line })
    filters.forEach((f, i) => {
      if (!f) return
      const [sym, val, ph] = f
      s += text(xs[i] + 8, yy + 22, sym, { size: 12, fill: C.muted, weight: 600 })
      s += text(xs[i] + 10 + sym.length * 8, yy + 22, val ?? ph ?? '', { size: 12, fill: val ? C.text : C.faint })
    })
    yy += rowH
  }
  top.body = yy
  rows.forEach((r, ri) => {
    s += rect(x, yy, W, rowH, { r: 0, fill: checks?.includes(ri) ? '#eff6ff' : C.card, stroke: C.line })
    if (checks) s += checkbox(x + 10, yy + 10, checks.includes(ri))
    r.forEach((v, ci) => {
      const c = cols[ci]
      const tx = c.num ? xs[ci + 1] - 10 : xs[ci] + 10
      s += text(tx, yy + 22, v, { size: 12.5, anchor: c.num ? 'end' : 'start', fill: c.ref ? C.link : C.text })
    })
    yy += rowH
  })
  if (checks) {
    s += checkbox(x + 10, y + 10, checks.length === rows.length)
  }
  for (let i = 1; i < xs.length - 1; i++) s += `<path d="M${xs[i]} ${y} V${yy}" stroke="${C.line}"/>`
  if (checks) s += `<path d="M${x + cw} ${y} V${yy}" stroke="${C.line}"/>`
  const at = (ri, ci) => ({ x: xs[ci], y: ri === -1 ? top.head : ri === -2 ? top.filter : top.body + ri * rowH, w: cols[ci].w, h: rowH })
  if (cell) rows.forEach((_, ri) => cols.forEach((__, ci) => { const add = cell(ri, ci, at(ri, ci)); if (add) s += add }))
  return { svg: s, h: yy - y, w: W, at, xs }
}

/** Затемнение под модальным окном. */
export const shade = (w, h) => `<rect x="12" y="40" width="${w - 24}" height="${h - 52}" fill="${C.shade}"/>`

/** Модальное окно: заголовок, крестик, тело задаёт вызывающий. */
export function dialog(x, y, w, h, title) {
  return `<rect x="${x}" y="${y + 4}" width="${w}" height="${h}" rx="12" fill="rgba(15,23,42,0.12)"/>` +
    rect(x, y, w, h, { r: 12, stroke: C.line }) +
    text(x + 20, y + 32, title, { size: 15, weight: 600 }) +
    `<path d="M${x + w - 30} ${y + 18} l10 10 M${x + w - 20} ${y + 18} l-10 10" stroke="${C.muted}" stroke-width="1.6"/>` +
    `<path d="M${x} ${y + 50} H${x + w}" stroke="${C.line}"/>`
}

/** Выпадающее меню под кнопкой: пункты-строки, подсвеченный — hi. */
export function menu(x, y, w, items, { hi } = {}) {
  const ih = 34
  let s = `<rect x="${x}" y="${y + 3}" width="${w}" height="${items.length * ih + 12}" rx="10" fill="rgba(15,23,42,0.10)"/>` + rect(x, y, w, items.length * ih + 12, { r: 10, stroke: C.line })
  items.forEach((it, i) => {
    const yy = y + 6 + i * ih
    if (i === hi) s += rect(x + 6, yy, w - 12, ih, { r: 6, fill: C.blueSoft, stroke: C.blueSoft })
    const [a, b] = Array.isArray(it) ? it : [null, it]
    if (a) s += text(x + 18, yy + 22, a, { size: 13, weight: 700, fill: C.muted })
    s += text(x + (a ? 58 : 18), yy + 22, b, { size: 13 })
  })
  return s
}

/** Всплывающее уведомление. */
export const toast = (x, y, msg) => rect(x, y, msg.length * 7.2 + 44, 38, { r: 10, fill: '#0f172a', stroke: '#0f172a' }) +
  `<circle cx="${x + 18}" cy="${y + 19}" r="6" fill="${C.green}"/>` + text(x + 32, y + 24, msg, { size: 13, fill: '#fff' })

/** Подпись-выноска мелким текстом. */
export const hint = (x, y, s, opts = {}) => text(x, y, s, { size: 12, fill: C.muted, ...opts })

// Раскладка холста: ширина 740, таблица с x=36 шириной 668.
export const W = 740
export const X = 36
export const TW = 668
// Узкая таблица для схем с окнами поверх: 5 колонок на всю ширину.
export const COLS5 = [
  { name: 'Заказ', w: 80 }, { name: 'Клиент', w: 170, ref: true }, { name: 'Дата', w: 120 },
  { name: 'Сумма', w: 110, num: true }, { name: 'Статус', w: 188, ref: true },
]
export const ROWS5 = ROWS.map((r) => r.slice(0, 5))
export const table = (y, opts = {}) => grid(X, y, { cols: COLS5, rows: ROWS5, ...opts })

/** Таблица с шапкой — фон для окон и меню. */
export function page(headOpts = {}, gridOpts = {}) {
  const h = tableHeader(X, 56, TW, headOpts)
  const g = table(104, gridOpts)
  return { svg: h.svg + g.svg, pos: h.pos, g }
}

/** Номер шага у правого верхнего угла прямоугольника. */
export const badgeAt = (p, n, dx = 0, dy = 0) => badge(p.x + p.w + 4 + dx, p.y - 4 + dy, n)
export const ringAt = (p, r) => ring(p.x, p.y, p.w, p.h, r)
