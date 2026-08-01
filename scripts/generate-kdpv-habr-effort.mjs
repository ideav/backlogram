#!/usr/bin/env node
/**
 * КДПВ для хабровской статьи «Оценил проект в 300 часов…»
 * (content/habr-effort-estimate/articles/skolko-chasov-stoit-promyshlennoe-prilozhenie.md).
 *
 * Иллюстрация из чек-листа статьи: один и тот же объём (412 функциональных
 * точек) на одной логарифмической шкале часов, посчитанный тремя методами.
 *
 * Размер под Хабр: обложка 780×440, файл рисуется в 2× (1560×880) и
 * дополнительно кладётся ужатая копия 780×440 — обе идут в
 * content/habr-effort-estimate/assets/.
 *
 *   node scripts/generate-kdpv-habr-effort.mjs
 *
 * Растеризация — sharp из blog-v2/node_modules (в корне его нет).
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const outDir = join(root, 'content/habr-effort-estimate/assets')

const W = 1560
const H = 880

// Палитра: тёмные шаги референсной палитры на фоне-полуночи. Проверено
// scripts/validate_palette.js: lightness band, chroma, CVD-разделение,
// normal-vision floor и контраст к поверхности #0a1630 — все PASS.
const SURFACE = '#0a1630'
const SERIES = '#3987e5' // отраслевые данные и модели
const ACCENT = '#c98500' // моя собственная оценка
const INK = '#f2f6ff'
const INK_2 = '#b7c6e0'
const MUTED = '#8fa2c0'
const GRID = '#1d2f52'

// Геометрия
const PLOT_X0 = 700
const PLOT_X1 = 1476
const LABEL_X = 660
const ROW_TOP = 270
const ROW_H = 70
const AXIS_Y = 706
const BAR = 20 // толщина марки, ≤ 24 по спеке

// Логарифмическая шкала: домен подобран так, чтобы ни одна марка не
// упиралась в край области.
const DOMAIN = [250, 15000]
const lg = (v) => Math.log10(v)
const x = (v) =>
  PLOT_X0 + ((lg(v) - lg(DOMAIN[0])) / (lg(DOMAIN[1]) - lg(DOMAIN[0]))) * (PLOT_X1 - PLOT_X0)

const NBSP = ' '
const TICKS = [300, 1000, 3000, 10000]

/** Ряды отсортированы по нижней границе — читается как лестница. */
const ROWS = [
  {
    name: 'Снизу вверх: 90 действий на готовой платформе',
    value: `306–370${NBSP}ч`,
    from: 306,
    to: 370,
    accent: true,
  },
  {
    name: 'Функциональные точки × PDR ISBSG, low-code',
    value: `410–990${NBSP}ч`,
    from: 410,
    to: 990,
  },
  {
    name: 'Снизу вверх + свой бэкенд и инфраструктура',
    value: `800–1${NBSP}150${NBSP}ч`,
    from: 800,
    to: 1150,
  },
  {
    name: 'Функциональные точки × PDR ISBSG, Java',
    value: `3${NBSP}600–10${NBSP}000${NBSP}ч`,
    from: 3600,
    to: 10000,
  },
  {
    name: 'COCOMO II, оптимистичные множители',
    value: `5${NBSP}000–7${NBSP}500${NBSP}ч`,
    from: 5000,
    to: 7500,
  },
  {
    name: 'COCOMO II, номинальные множители',
    value: `12${NBSP}400${NBSP}ч`,
    from: 12400,
    to: 12400,
  },
]

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

const text = (s, { x: tx, y: ty, size, fill, weight = 400, anchor = 'start', spacing }) =>
  `<text x="${tx}" y="${ty}" font-family="DejaVu Sans, sans-serif" font-size="${size}" ` +
  `font-weight="${weight}" fill="${fill}" text-anchor="${anchor}"` +
  `${spacing ? ` letter-spacing="${spacing}"` : ''}>${esc(s)}</text>`

const parts = []

// Фон: полночная заливка + едва различимая точечная сетка (как на обложке
// блогового оригинала, но без её сюжета).
parts.push(`<defs>
  <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="#081226"/>
    <stop offset="0.55" stop-color="${SURFACE}"/>
    <stop offset="1" stop-color="#0c1c3c"/>
  </linearGradient>
  <radialGradient id="glow" cx="0.22" cy="0.18" r="0.6">
    <stop offset="0" stop-color="#1b3a72" stop-opacity="0.55"/>
    <stop offset="1" stop-color="#1b3a72" stop-opacity="0"/>
  </radialGradient>
  <pattern id="dots" width="26" height="26" patternUnits="userSpaceOnUse">
    <circle cx="1.5" cy="1.5" r="1.5" fill="#ffffff" fill-opacity="0.035"/>
  </pattern>
</defs>`)
parts.push(`<rect width="${W}" height="${H}" fill="url(#bg)"/>`)
parts.push(`<rect width="${W}" height="${H}" fill="url(#dots)"/>`)
parts.push(`<rect width="${W}" height="${H}" fill="url(#glow)"/>`)

// Шапка
parts.push(
  text('412 ФУНКЦИОНАЛЬНЫХ ТОЧЕК · ОДИН И ТОТ ЖЕ ОБЪЁМ', {
    x: 84,
    y: 96,
    size: 25,
    fill: MUTED,
    weight: 700,
    spacing: 3.2,
  }),
)
parts.push(text('«ЛЛМ сделает за вечер» или 12 400 часов?', { x: 84, y: 168, size: 52, fill: INK, weight: 700 }))
parts.push(
  text('Одна и та же система, три независимых метода: факт — от 990 до 12 400 ч', {
    x: 84,
    y: 214,
    size: 28,
    fill: INK_2,
  }),
)

// Сетка: сплошные хайрлайны, отступают на шаг от поверхности
for (const t of TICKS) {
  parts.push(
    `<line x1="${x(t).toFixed(1)}" y1="252" x2="${x(t).toFixed(1)}" y2="${AXIS_Y}" ` +
      `stroke="${GRID}" stroke-width="1"/>`,
  )
}
parts.push(
  `<line x1="${PLOT_X0}" y1="${AXIS_Y}" x2="${PLOT_X1}" y2="${AXIS_Y}" stroke="#2a3f68" stroke-width="1"/>`,
)

// Опорная линия «моя оценка» — тот самый спорный рубеж в 300 часов
parts.push(
  `<line x1="${x(306).toFixed(1)}" y1="252" x2="${x(306).toFixed(1)}" y2="${AXIS_Y}" ` +
    `stroke="${ACCENT}" stroke-width="2" stroke-opacity="0.45"/>`,
)

// Ряды
ROWS.forEach((row, i) => {
  const yc = ROW_TOP + i * ROW_H + ROW_H / 2
  const color = row.accent ? ACCENT : SERIES
  const barY = yc - BAR / 2 + 2

  parts.push(text(row.name, { x: LABEL_X, y: yc - 8, size: 23, fill: INK_2, anchor: 'end' }))
  parts.push(
    text(row.value, { x: LABEL_X, y: yc + 22, size: 27, fill: INK, weight: 700, anchor: 'end' }),
  )

  if (row.from === row.to) {
    // Точка означает ровно одно: единственное значение вместо диапазона
    parts.push(`<circle cx="${x(row.from).toFixed(1)}" cy="${yc + 2}" r="9" fill="${color}"/>`)
  } else {
    parts.push(
      `<rect x="${x(row.from).toFixed(1)}" y="${barY}" ` +
        `width="${(x(row.to) - x(row.from)).toFixed(1)}" height="${BAR}" rx="4" fill="${color}"/>`,
    )
  }
})

// Ось X
for (const t of TICKS) {
  parts.push(
    text(t.toLocaleString('ru-RU').replace(/\s/g, NBSP), {
      x: x(t),
      y: 748,
      size: 24,
      fill: MUTED,
      anchor: 'middle',
    }),
  )
}

// Легенда (две серии — легенда обязательна) + оговорка про шкалу
parts.push(`<circle cx="94" cy="812" r="9" fill="${ACCENT}"/>`)
parts.push(text('моя оценка', { x: 116, y: 821, size: 25, fill: INK_2 }))
parts.push(`<circle cx="330" cy="812" r="9" fill="${SERIES}"/>`)
parts.push(text('отраслевые данные и модели', { x: 352, y: 821, size: 25, fill: INK_2 }))
parts.push(
  text('часов · шкала логарифмическая · ISBSG 2021 · COCOMO II', {
    x: PLOT_X1,
    y: 821,
    size: 23,
    fill: MUTED,
    anchor: 'end',
  }),
)

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
${parts.join('\n')}
</svg>
`

mkdirSync(outDir, { recursive: true })
const svgPath = join(outDir, 'kdpv-tri-metoda.svg')
writeFileSync(svgPath, svg)

/** sharp живёт в blog-v2; SHARP_MODULE — запасной путь, если запускают из worktree. */
async function loadSharp() {
  const candidates = [
    process.env.SHARP_MODULE,
    'sharp',
    join(root, 'blog-v2/node_modules/sharp/lib/index.js'),
  ].filter(Boolean)
  for (const spec of candidates) {
    try {
      return (await import(spec)).default
    } catch {
      /* пробуем следующий */
    }
  }
  throw new Error('не найден sharp: установите зависимости blog-v2 (npm i) или задайте SHARP_MODULE')
}

const sharp = await loadSharp()
await sharp(Buffer.from(svg), { density: 144 })
  .resize(W, H)
  .png()
  .toFile(join(outDir, 'kdpv-tri-metoda@2x.png'))
await sharp(Buffer.from(svg), { density: 144 })
  .resize(780, 440)
  .png()
  .toFile(join(outDir, 'kdpv-tri-metoda.png'))

console.log(`ok: ${svgPath}`)
console.log(`ok: ${join(outDir, 'kdpv-tri-metoda@2x.png')} (1560×880)`)
console.log(`ok: ${join(outDir, 'kdpv-tri-metoda.png')} (780×440, обложка Хабра)`)
