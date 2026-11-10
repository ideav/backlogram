// Обложка статьи «Книги и авторы: замеры восемь лет спустя» (backlogram#918, PR #926).
// Цифры — медианы из results-v1b-fairidx.json / results-v2-core.json (см. README).
// Нужен sharp из blog-v2: cd blog-v2 && npm install
// node experiments/books-authors-918/cover.mjs [out-dir]
//   → knigi-i-avtory-cover.svg + .png (1200×630), по умолчанию в blog-v2/public/uploads
import { writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createRequire } from 'node:module'
const here = dirname(fileURLToPath(import.meta.url))
const blog = resolve(here, '../../blog-v2')
const sharp = createRequire(resolve(blog, 'package.json'))('sharp')

const out = process.argv[2] || resolve(blog, 'public/uploads')
const C_PLAIN = '#d97706' // обычная схема
const C_CORE = '#0284c7'  // ядро
const FONT = 'Segoe UI, Arial, sans-serif'

// Медианы SQL, мс; обычная схема — индексы как в 2018 году (name, author).
const rows = [
  { label: 'Автор по началу имени', sub: "LIKE 'Le%', 1000 строк", plain: [17, '17 мс'], core: [83, '83 мс'] },
  { label: 'Страниц = 150 и год = 1972', sub: 'точное совпадение, 11 строк', plain: [597, '597 мс'], core: [32, '32 мс'] },
  { label: 'Подстрока в названии', sub: "LIKE '%лые пар%', полный просмотр", plain: [50, '50 мс'], core: [941, '941 мс'] },
  { label: 'Число книг по годам', sub: 'агрегат по миллиону книг', plain: [800, '0,8 с'], core: [33000, '33 с'] },
]

const X0 = 470, DEC = 128 // 1 мс → X0, одна декада = DEC px
const x = (ms) => X0 + Math.log10(ms) * DEC
const ROW_Y = 236, ROW_H = 84, BAR_H = 20, GAP = 2

const bar = (y, ms, color) => {
  const w = x(ms) - X0, r = 4
  // прямой край у базовой линии, скруглённый — на конце значения
  return `<path d="M${X0},${y} h${w - r} a${r},${r} 0 0 1 ${r},${r} v${BAR_H - 2 * r} a${r},${r} 0 0 1 ${-r},${r} h${-(w - r)} Z" fill="${color}"/>`
}
const val = (y, ms, text) =>
  `<text x="${x(ms) + 10}" y="${y + BAR_H / 2 + 6}" font-size="17" fill="#e2e8f0" font-family="${FONT}">${text}</text>`

let body = ''
// сетка и подписи шкалы
const ticks = [[1, '1 мс'], [10, '10 мс'], [100, '100 мс'], [1000, '1 с'], [10000, '10 с'], [100000, '100 с']]
const gridTop = ROW_Y - 16, gridBot = ROW_Y + rows.length * ROW_H - 10
for (const [ms, t] of ticks) {
  body += `<line x1="${x(ms)}" y1="${gridTop}" x2="${x(ms)}" y2="${gridBot}" stroke="#93c5fd" stroke-opacity="${ms === 1 ? 0.45 : 0.13}" stroke-width="1"/>`
  body += `<text x="${x(ms)}" y="${gridBot + 26}" text-anchor="middle" font-size="16" fill="#94a3b8" font-family="${FONT}">${t}</text>`
}
rows.forEach((r, i) => {
  const y = ROW_Y + i * ROW_H
  body += `<text x="60" y="${y + 19}" font-size="22" font-weight="600" fill="#f1f5f9" font-family="${FONT}">${r.label}</text>`
  body += `<text x="60" y="${y + 44}" font-size="16" fill="#94a3b8" font-family="${FONT}">${r.sub}</text>`
  body += bar(y, r.plain[0], C_PLAIN) + val(y, r.plain[0], r.plain[1])
  body += bar(y + BAR_H + GAP, r.core[0], C_CORE) + val(y + BAR_H + GAP, r.core[0], r.core[1])
})

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
<defs>
 <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
  <stop offset="0" stop-color="#060d20"/><stop offset="0.55" stop-color="#0a1c47"/><stop offset="1" stop-color="#123a8f"/>
 </linearGradient>
 <radialGradient id="glow" cx="0.5" cy="0.5" r="0.5">
  <stop offset="0" stop-color="#60a5fa" stop-opacity="0.30"/><stop offset="1" stop-color="#60a5fa" stop-opacity="0"/>
 </radialGradient>
</defs>
<rect width="1200" height="630" fill="url(#bg)"/>
<circle cx="980" cy="110" r="340" fill="url(#glow)"/>
<text x="60" y="66" font-size="18" font-weight="600" letter-spacing="2" fill="#7dd3fc" font-family="${FONT}">ЗАМЕР 2018 → 2026 · 1 МЛН КНИГ · 143 ТЫС. АВТОРОВ</text>
<text x="60" y="122" font-size="48" font-weight="700" fill="#ffffff" font-family="${FONT}">Книги и авторы: восемь лет спустя</text>
<rect x="60" y="160" width="18" height="18" rx="3" fill="${C_PLAIN}"/>
<text x="88" y="176" font-size="19" fill="#e2e8f0" font-family="${FONT}">обычная схема MySQL</text>
<rect x="320" y="160" width="18" height="18" rx="3" fill="${C_CORE}"/>
<text x="348" y="176" font-size="19" fill="#e2e8f0" font-family="${FONT}">ядро Интеграм</text>
<text x="1140" y="176" text-anchor="end" font-size="16" fill="#94a3b8" font-family="${FONT}">время SQL, медиана 7 прогонов, лог. шкала</text>
${body}
</svg>
`
writeFileSync(resolve(out, 'knigi-i-avtory-cover.svg'), svg)
await sharp(Buffer.from(svg)).png().toFile(resolve(out, 'knigi-i-avtory-cover.png'))
console.log('ok')
