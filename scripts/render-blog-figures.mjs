#!/usr/bin/env node
/**
 * Инфографика к статье «Оценка в 300 часов» (issue #510).
 *
 * Почему скриптом, а не «нарисовали и положили картинку»: цифры на схемах —
 * те же, что в тексте статьи (63%, −17%, 10,3%, 8,3 → 12,3%…). Когда цифра
 * в тексте меняется, картинку надо перерисовать, а не переоткрывать в
 * редакторе — поэтому данные лежат рядом с разметкой, а результат (SVG + PNG)
 * генерируется. Совпадение цифр с текстом сторожит
 * `tests/issue-510-infographics.test.mjs`.
 *
 * Что делает: пишет в `blog-v2/public/uploads/` пары `<name>.svg` (вектор, как
 * у обложек статей) и `<name>.png` (2× — то, на что ссылается статья; в блоге
 * тело статьи показывает PNG, а лайтбокс открывает их в полный размер).
 *
 * Размеры кегля: в макете статьи картинка шириной 1200 показывается примерно
 * в 810 px, то есть уменьшается до ~0,68. Поэтому самая мелкая подпись здесь
 * 17 px — на экране это ~11,5 px, ещё читаемо; всё, что меньше, при вёрстке
 * превращается в кашу.
 *
 * Шрифт — тот же Inter, что и в OG-карточках (`scripts/fonts/`), он же стоит
 * первым в `--font-sans` блога, так что подписи выглядят как текст страницы.
 *
 * Запуск (вручную, в сборку не входит — блог собирается отдельным билдом):
 *   npm run blog-figures
 */
import { writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { Resvg } from '@resvg/resvg-js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')
const outDir = resolve(root, 'blog-v2/public/uploads')
const fonts = [
  resolve(__dirname, 'fonts/Inter-Regular.ttf'),
  resolve(__dirname, 'fonts/Inter-Bold.ttf'),
]

// ── Палитра блога (blog-v2/src/styles/global.css) ──────────────────────────
const INK = '#172033'
const INK_SOFT = '#4b5a6c'
const INK_FAINT = '#66758a'
const BLUE = '#1447e6' // --color-product-blue
const BLUE_LIGHT = '#8fb0fa' // «было» в парных отметках
const REST = '#cdd8e8' // приглушённый остаток (не серия, а фон доли)
const RISK = '#b42318' // статусный цвет: только там, где цифра — про риск
const RISK_SOFT = '#fdeceb'
const LINE = '#d9e1ec' // --color-hairline-strong
const PANEL = '#f2f6ff'
const WHITE = '#ffffff'

const FONT = 'Inter'
const esc = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

/** Подпись. weight 400/700 — ровно те начертания, что лежат в scripts/fonts. */
const text = (x, y, value, { size = 20, weight = 400, fill = INK, anchor = 'start', spacing } = {}) =>
  `<text x="${x}" y="${y}" font-family="${FONT}" font-size="${size}" font-weight="${weight}"` +
  `${spacing ? ` letter-spacing="${spacing}"` : ''}` +
  ` fill="${fill}"${anchor === 'start' ? '' : ` text-anchor="${anchor}"`}>${esc(value)}</text>`

const eyebrow = (x, y, value) =>
  text(x, y, value.toUpperCase(), { size: 17, weight: 700, fill: BLUE, spacing: 1.6 })

const hairline = (x1, y1, x2, y2, stroke = LINE) =>
  `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${stroke}" stroke-width="1"/>`

/** Полоса вывода внизу схемы: акцентная планка слева + одна-две строки. */
const conclusion = (y, lines, height = 90) =>
  `<rect x="56" y="${y}" width="1088" height="${height}" rx="12" fill="${PANEL}"/>` +
  `<rect x="56" y="${y}" width="6" height="${height}" rx="3" fill="${BLUE}"/>` +
  lines
    .map((line, i) =>
      text(88, y + (lines.length === 1 ? height / 2 + 8 : 40 + i * 32), line, {
        size: 22,
        weight: i === 0 ? 700 : 400,
        fill: i === 0 ? INK : INK_SOFT,
      }),
    )
    .join('')

const svgDoc = (w, h, title, desc, body) =>
  `<?xml version="1.0" encoding="UTF-8"?>\n` +
  `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"` +
  ` role="img" aria-labelledby="t d">\n<title id="t">${esc(title)}</title>\n` +
  `<desc id="d">${esc(desc)}</desc>\n` +
  `<rect width="${w}" height="${h}" fill="${WHITE}"/>\n` +
  `<rect x="0.5" y="0.5" width="${w - 1}" height="${h - 1}" fill="none" stroke="${LINE}"/>\n` +
  body +
  `\n</svg>\n`

// ══ Схема 1. Кто берётся за самостоятельную сборку и с чем сталкивается ════
// Форма: одна доля (вафля 10×10 — «63 из 100» читается без осей) плюс три
// плитки с отдельными числами. Плитки, а не столбики: общей шкалы у чисел нет.
function figureAudience() {
  const W = 1200
  const H = 1006
  const parts = []

  parts.push(eyebrow(56, 66, 'Самостоятельная сборка с ИИ'))
  parts.push(text(56, 122, 'Кто берётся — и с чем сталкивается', { size: 40, weight: 700 }))
  parts.push(hairline(56, 156, 1144, 156))

  // ── Слева: доля не-разработчиков ────────────────────────────────────────
  parts.push(text(56, 268, '63 %', { size: 88, weight: 700, fill: BLUE }))
  parts.push(text(56, 314, 'из практикующих вайб-кодинг —', { size: 23, fill: INK_SOFT }))
  parts.push(text(56, 348, 'не разработчики', { size: 23, weight: 700, fill: INK }))

  const NON_DEV = 63
  const pitch = 30
  const cell = 21
  const gridX = 56
  const gridY = 386
  for (let i = 0; i < 100; i++) {
    const col = i % 10
    const row = Math.floor(i / 10)
    parts.push(
      `<rect x="${gridX + col * pitch}" y="${gridY + row * pitch}" width="${cell}" height="${cell}"` +
        ` rx="5" fill="${i < NON_DEV ? BLUE : REST}"/>`,
    )
  }

  const swatch = (x, y, fill, label) =>
    `<rect x="${x}" y="${y}" width="17" height="17" rx="4" fill="${fill}"/>` +
    text(x + 26, y + 15, label, { size: 18, fill: INK_SOFT })
  parts.push(swatch(56, 706, BLUE, '63 — не разработчики'))
  parts.push(swatch(330, 706, REST, '37 — разработчики'))

  const notes = [
    'Разбор 1 000 комментариев сообщества r/vibecoding',
    '(Vercel/Solveo). Это демография активного сообщества,',
    'а не выборка всех пользователей.',
  ]
  notes.forEach((line, i) =>
    parts.push(text(56, 774 + i * 26, line, { size: 17, fill: INK_FAINT })),
  )

  // ── Справа: три числа про исход ─────────────────────────────────────────
  parts.push(hairline(596, 196, 596, 830))

  const tiles = [
    {
      value: '−17 %',
      risk: true,
      lines: ['понимание собственного кода у тех,', 'кто решал задачу с ИИ'],
      source: 'Anthropic, рандомизированный эксперимент, n = 52',
    },
    {
      value: '10,3 %',
      risk: true,
      lines: ['приложений отдавали чужие данные', 'любому — 170 из 1 645'],
      source: 'Скан 1 645 приложений, собранных на Lovable',
    },
    {
      value: '3 нед. → 3+ года',
      risk: false,
      lines: ['разброс срока до первого', 'публичного запуска'],
      source: 'Самообзоры сообщества',
    },
  ]

  tiles.forEach((tile, i) => {
    const top = 196 + i * 220
    const color = tile.risk ? RISK : BLUE
    parts.push(text(640, top + 62, tile.value, { size: 52, weight: 700, fill: color }))
    if (tile.risk) {
      // Статусный цвет не работает в одиночку — рядом стоит слово.
      parts.push(`<rect x="1040" y="${top + 20}" width="104" height="34" rx="17" fill="${RISK_SOFT}"/>`)
      parts.push(
        text(1092, top + 43, 'РИСК', { size: 16, weight: 700, fill: RISK, anchor: 'middle', spacing: 1.4 }),
      )
    }
    tile.lines.forEach((line, j) =>
      parts.push(text(640, top + 108 + j * 32, line, { size: 22, fill: INK_SOFT })),
    )
    parts.push(text(640, top + 190, tile.source, { size: 17, fill: INK_FAINT }))
    if (i < tiles.length - 1) parts.push(hairline(640, top + 214, 1144, top + 214))
  })

  parts.push(
    conclusion(858, [
      'Шансы определяются не бэкграундом, а поведением —',
      'понимаете ли вы, что вам вернули, и есть ли у вас способ это проверить.',
    ]),
  )

  return {
    name: 'shansy-kto-sobiraet',
    width: W,
    height: H,
    svg: svgDoc(
      W,
      H,
      'Кто собирает приложения с ИИ самостоятельно и с чем сталкивается',
      'Слева: сетка из ста клеток, 63 закрашены — доля не-разработчиков среди практикующих вайб-кодинг ' +
        '(разбор 1 000 комментариев r/vibecoding, Vercel/Solveo). Справа три числа: понимание собственного ' +
        'кода на 17% хуже у решавших задачу с ИИ (эксперимент Anthropic, n = 52); 10,3% приложений отдавали ' +
        'чужие данные любому — 170 из 1 645 просканированных; срок до первого публичного запуска — от трёх ' +
        'недель до трёх с лишним лет. Внизу вывод: шансы определяются не бэкграундом, а поведением.',
      parts.join('\n'),
    ),
  }
}

// ══ Схема 2. Что происходит с кодовой базой ═══════════════════════════════
// Форма: парные отметки «было → стало» на одной шкале процентов — три метрики
// одной природы, движение важнее абсолютных значений.
function figureCodebase() {
  const W = 1200
  const H = 728
  const parts = []

  parts.push(eyebrow(56, 66, 'Что происходит с кодовой базой'))
  parts.push(text(56, 122, 'Дубли растут, переработка падает', { size: 40, weight: 700 }))
  parts.push(text(56, 158, 'GitClear, 211 млн изменённых строк кода', { size: 20, fill: INK_SOFT }))

  // Легенда: две отметки — идентичность не должна держаться на одном цвете.
  const legend = (x, fill, label) =>
    `<circle cx="${x}" cy="146" r="10" fill="${fill}" stroke="${WHITE}" stroke-width="2"/>` +
    text(x + 20, 153, label, { size: 18, fill: INK_SOFT })
  parts.push(legend(940, BLUE_LIGHT, 'было'))
  parts.push(legend(1046, BLUE, 'стало'))

  parts.push(hairline(56, 192, 1144, 192))

  const X0 = 460
  const X1 = 1144
  const MAX = 28
  const x = (v) => X0 + (v / MAX) * (X1 - X0)

  const PLOT_TOP = 232
  const PLOT_BOTTOM = 522
  for (const tick of [0, 5, 10, 15, 20, 25]) {
    parts.push(hairline(x(tick), PLOT_TOP, x(tick), PLOT_BOTTOM))
    parts.push(
      text(x(tick), PLOT_BOTTOM + 32, tick === 0 ? '0 %' : String(tick), {
        size: 17,
        fill: INK_FAINT,
        anchor: 'middle',
      }),
    )
  }

  const rows = [
    { label: 'Скопированные строки кода', from: 8.3, to: 12.3, fromLabel: '8,3 %', toLabel: '12,3 %' },
    { label: 'Изменения с рефакторингом', from: 25, to: 9.5, fromLabel: '25 %', toLabel: '< 10 %' },
    {
      label: 'Переписано в первые две недели',
      from: 3.1,
      to: 5.7,
      fromLabel: '3,1 %',
      toLabel: '5,7 %',
    },
  ]

  rows.forEach((row, i) => {
    const y = 282 + i * 96
    parts.push(text(56, y + 7, row.label, { size: 22, fill: INK }))
    parts.push(
      `<line x1="${x(row.from)}" y1="${y}" x2="${x(row.to)}" y2="${y}" stroke="${REST}"` +
        ` stroke-width="5" stroke-linecap="round"/>`,
    )
    const dot = (v, fill) =>
      `<circle cx="${x(v)}" cy="${y}" r="11" fill="${fill}" stroke="${WHITE}" stroke-width="2"/>`
    parts.push(dot(row.from, BLUE_LIGHT))
    parts.push(dot(row.to, BLUE))
    // «было» — под отметкой, «стало» — над ней: подписи не сталкиваются даже
    // там, где точки стоят в двух процентах друг от друга.
    parts.push(
      text(x(row.from), y + 38, row.fromLabel, { size: 18, fill: INK_SOFT, anchor: 'middle' }),
    )
    parts.push(
      text(x(row.to), y - 24, row.toLabel, { size: 18, weight: 700, fill: INK, anchor: 'middle' }),
    )
  })

  parts.push(
    conclusion(
      606,
      ['Дублей больше, переработки меньше — механизм «стены третьего месяца».'],
      66,
    ),
  )

  return {
    name: 'shansy-kodovaya-baza',
    width: W,
    height: H,
    svg: svgDoc(
      W,
      H,
      'Что происходит с кодовой базой: дубли растут, переработка падает',
      'Три метрики GitClear на 211 млн изменённых строк кода, парные отметки «было → стало»: доля ' +
        'скопированных строк выросла с 8,3% до 12,3%; доля изменений, связанных с рефакторингом, упала ' +
        'с 25% до менее чем 10%; доля кода, переписанного в первые две недели после коммита, выросла ' +
        'с 3,1% до 5,7%. Внизу вывод: дублей больше, переработки меньше — механизм «стены третьего месяца».',
      parts.join('\n'),
    ),
  }
}

// ── Рендер ─────────────────────────────────────────────────────────────────
const SCALE = 2 // ретина: в макете статьи картинка занимает примерно 810 px

for (const figure of [figureAudience(), figureCodebase()]) {
  const svgPath = resolve(outDir, `${figure.name}.svg`)
  const pngPath = resolve(outDir, `${figure.name}.png`)
  writeFileSync(svgPath, figure.svg)

  const png = new Resvg(figure.svg, {
    font: { fontFiles: fonts, loadSystemFonts: false, defaultFontFamily: FONT },
    fitTo: { mode: 'width', value: figure.width * SCALE },
  })
    .render()
    .asPng()
  writeFileSync(pngPath, png)

  console.log(
    `✓ ${figure.name}: ${figure.width}×${figure.height} svg + ` +
      `${figure.width * SCALE}×${figure.height * SCALE} png (${Math.round(png.length / 1024)} КБ)`,
  )
}
