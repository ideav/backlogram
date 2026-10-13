#!/usr/bin/env node
/**
 * Фон hero для квиза /quiz.html (issue #749): тематическая иллюстрация про
 * оценку разработки — смета с итоговой суммой слева, диаграмма сроков
 * справа, калькулятор и секундомер «2:00», между ними световые потоки.
 * Палитра и пропорции — как у фона главной (public/hero-ai-background.webp,
 * 2560×1087), чтобы страницы выглядели одной семьёй. Середина кадра
 * оставлена спокойной: поверх неё идут заголовок и кнопка.
 *
 *   node scripts/generate-quiz-hero.mjs
 *
 * Пишет public/quiz-hero.webp. Растеризация — sharp из blog-v2/node_modules
 * (в корне его нет).
 */
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const outFile = join(root, 'public/quiz-hero.webp')

const W = 2560
const H = 1087
const FONT = 'Inter, Segoe UI, Arial, sans-serif'

const CYAN = '#5eead4'
const SKY = '#38bdf8'
const VIOLET = '#a78bfa'
const INK = '#eef4ff'
const INK_2 = '#b9c8ea'
const GLASS = 'rgba(30, 58, 138, 0.55)'
const GLASS_EDGE = 'rgba(147, 197, 253, 0.55)'

const text = (x, y, s, size, { fill = INK, weight = 400, anchor = 'start', opacity = 1 } = {}) =>
  `<text x="${x}" y="${y}" font-family="${FONT}" font-size="${size}" font-weight="${weight}" ` +
  `fill="${fill}" text-anchor="${anchor}" opacity="${opacity}">${s}</text>`

// ── Смета: строки работ и итог ─────────────────────────────────────────────
const estimateRows = [
  ['Разбор задачи', '1 нед'],
  ['Модель данных', '2 нед'],
  ['Формы и роли', '3 нед'],
  ['Отчёты', '2 нед'],
  ['Интеграции', '4 нед'],
  ['Запуск и обучение', '2 нед'],
]
const estimateCard = `
  <g transform="translate(150 190) rotate(-6)">
    <rect width="620" height="700" rx="28" fill="${GLASS}" stroke="${GLASS_EDGE}" stroke-width="2" filter="url(#soft)"/>
    <rect width="620" height="92" rx="28" fill="rgba(56, 189, 248, 0.18)"/>
    ${text(44, 60, 'Оценка проекта', 34, { weight: 700 })}
    <circle cx="560" cy="46" r="14" fill="${CYAN}" opacity="0.85"/>
    ${estimateRows
      .map(
        ([label, dur], i) => `
    <g transform="translate(44 ${150 + i * 70})">
      <rect x="0" y="-22" width="26" height="26" rx="7" fill="none" stroke="${CYAN}" stroke-width="3"/>
      <path d="M6 -9 l6 6 l10 -12" fill="none" stroke="${CYAN}" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>
      ${text(46, 0, label, 27, { fill: INK_2 })}
      ${text(532, 0, dur, 27, { fill: INK, weight: 600, anchor: 'end' })}
      <line x1="0" y1="24" x2="532" y2="24" stroke="rgba(147,197,253,0.18)" stroke-width="2"/>
    </g>`,
      )
      .join('')}
    <line x1="44" y1="575" x2="576" y2="575" stroke="${GLASS_EDGE}" stroke-width="3" stroke-dasharray="10 8"/>
    ${text(44, 640, 'Итого', 30, { fill: INK_2 })}
    ${text(576, 648, '450 000 ₽', 58, { fill: CYAN, weight: 800, anchor: 'end' })}
  </g>`

// ── Калькулятор позади сметы ──────────────────────────────────────────────
const keys = []
for (let r = 0; r < 4; r++) {
  for (let c = 0; c < 4; c++) {
    const accent = c === 3
    keys.push(
      `<rect x="${24 + c * 66}" y="${150 + r * 62}" width="54" height="48" rx="10" ` +
        `fill="${accent ? 'rgba(167,139,250,0.7)' : 'rgba(191,219,254,0.22)'}"/>`,
    )
  }
}
const calculator = `
  <g transform="translate(830 610) rotate(9)" filter="url(#soft)">
    <rect width="312" height="420" rx="30" fill="rgba(49, 46, 129, 0.8)" stroke="${GLASS_EDGE}" stroke-width="2"/>
    <rect x="24" y="28" width="264" height="96" rx="14" fill="rgba(15, 23, 42, 0.65)"/>
    ${text(270, 96, '= 450 000', 34, { fill: CYAN, weight: 700, anchor: 'end' })}
    ${keys.join('')}
  </g>`

// ── Диаграмма сроков (Ганта) ───────────────────────────────────────────────
const bars = [
  [0, 2, SKY],
  [1, 3, SKY],
  [3, 7, VIOLET],
  [6, 9, VIOLET],
  [8, 12, CYAN],
  [11, 14, CYAN],
]
const GX = 170
const WEEK = 32
const gantt = `
  <g transform="translate(1690 170) rotate(5)">
    <rect width="720" height="560" rx="28" fill="${GLASS}" stroke="${GLASS_EDGE}" stroke-width="2" filter="url(#soft)"/>
    <rect width="720" height="92" rx="28" fill="rgba(167, 139, 250, 0.2)"/>
    ${text(44, 60, 'Сроки', 34, { weight: 700 })}
    ${text(676, 60, '10–16 нед', 30, { fill: CYAN, weight: 700, anchor: 'end' })}
    ${Array.from({ length: 16 }, (_, i) =>
      `<line x1="${GX + i * WEEK}" y1="120" x2="${GX + i * WEEK}" y2="510" stroke="rgba(147,197,253,${i % 4 === 0 ? 0.3 : 0.1})" stroke-width="2"/>`,
    ).join('')}
    ${[1, 5, 9, 13].map((w) => text(GX + (w - 1) * WEEK + 4, 140, `${w}`, 20, { fill: INK_2 })).join('')}
    ${bars
      .map(
        ([from, to, color], i) => `
    <rect x="44" y="${178 + i * 56}" width="96" height="16" rx="8" fill="rgba(191,219,254,0.3)"/>
    <rect x="${GX + from * WEEK}" y="${168 + i * 56}" width="${(to - from) * WEEK}" height="34" rx="17" fill="${color}" opacity="0.88"/>`,
      )
      .join('')}
    <path d="M${GX + 14 * WEEK} 485 l18 18 l-18 18 l-18 -18 z" fill="${CYAN}" filter="url(#glow)"/>
  </g>`

// ── Секундомер «2:00» ──────────────────────────────────────────────────────
const stopwatch = `
  <g transform="translate(1610 800)" filter="url(#soft)">
    <rect x="-22" y="-148" width="44" height="34" rx="8" fill="${INK_2}"/>
    <circle r="120" fill="rgba(30, 27, 94, 0.85)" stroke="${SKY}" stroke-width="10"/>
    <path d="M0 -96 A96 96 0 0 1 83 48" fill="none" stroke="${CYAN}" stroke-width="16" stroke-linecap="round" filter="url(#glow)"/>
    ${text(0, 18, '2:00', 56, { weight: 800, anchor: 'middle' })}
  </g>`

// ── Монеты с рублём и мелкие детали ─────────────────────────────────────────
const coin = (x, y, r, o = 1) => `
  <g transform="translate(${x} ${y})" opacity="${o}">
    <circle r="${r}" fill="rgba(94, 234, 212, 0.18)" stroke="${CYAN}" stroke-width="${Math.max(3, r / 12)}"/>
    ${text(0, r * 0.36, '₽', r, { fill: CYAN, weight: 800, anchor: 'middle' })}
  </g>`

const sparkles = [
  [980, 140, 6], [1080, 930, 5], [1500, 120, 7], [2470, 860, 6], [90, 960, 5],
  [1240, 70, 4], [1360, 1010, 5], [2300, 90, 5], [60, 120, 4],
]
  .map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${CYAN}" filter="url(#glow)"/>`)
  .join('')

// Световые потоки от сметы к срокам — через центр, но тонкие и прозрачные.
const flows = [
  ['M760 360 C 1100 300, 1400 420, 1700 330', SKY, 0.55],
  ['M780 520 C 1100 560, 1420 470, 1720 520', CYAN, 0.6],
  ['M800 680 C 1120 760, 1400 640, 1700 700', VIOLET, 0.5],
]
  .map(([d, c, o]) => `<path d="${d}" fill="none" stroke="${c}" stroke-width="5" opacity="${o}" filter="url(#glow)"/>`)
  .join('')

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="0.35">
      <stop offset="0" stop-color="#1e1b5e"/>
      <stop offset="0.5" stop-color="#1e3a8a"/>
      <stop offset="1" stop-color="#0369a1"/>
    </linearGradient>
    <radialGradient id="blobL" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0" stop-color="#7c3aed" stop-opacity="0.45"/>
      <stop offset="1" stop-color="#7c3aed" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="blobR" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0" stop-color="#22d3ee" stop-opacity="0.35"/>
      <stop offset="1" stop-color="#22d3ee" stop-opacity="0"/>
    </radialGradient>
    <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="6" result="b"/>
      <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <filter id="soft" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="18" stdDeviation="22" flood-color="#020617" flood-opacity="0.45"/>
    </filter>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  <ellipse cx="420" cy="560" rx="620" ry="460" fill="url(#blobL)"/>
  <ellipse cx="2120" cy="460" rx="640" ry="460" fill="url(#blobR)"/>
  ${flows}
  ${calculator}
  ${estimateCard}
  ${gantt}
  ${stopwatch}
  ${coin(1010, 250, 54, 0.9)}
  ${coin(1400, 960, 40, 0.7)}
  ${coin(1520, 560, 30, 0.6)}
  ${coin(2420, 900, 62, 0.85)}
  ${sparkles}
</svg>`

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
await sharp(Buffer.from(svg)).webp({ quality: 82 }).toFile(outFile)
console.log(`→ ${outFile}`)
