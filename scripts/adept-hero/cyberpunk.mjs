// «Киберпанк»: ночной мегаполис под дождём, неоновые вывески с иероглифом
// 道 («путь»), фигура в капюшоне с клинком на крыше.
import { H, W, blur, glow, rng, svgDoc } from './common.mjs'

const CJK = 'Yu Gothic, Meiryo, MS Gothic, Noto Sans CJK JP, sans-serif'

const towers = (seed, n, minH, maxH, fill, winColors, winOpacity) => {
  const r = rng(seed)
  let out = ''
  for (let i = 0; i < n; i++) {
    const w = 90 + r() * 170
    const x = r() * (W + 100) - 100
    const h = minH + r() * (maxH - minH)
    const y = H - h
    out += `<rect x="${x.toFixed(0)}" y="${y.toFixed(0)}" width="${w.toFixed(0)}" height="${h.toFixed(0)}" fill="${fill}"/>`
    for (let wy = y + 24; wy < H - 20; wy += 26) {
      for (let wx = x + 12; wx < x + w - 14; wx += 22) {
        if (r() < 0.22) {
          const c = winColors[Math.floor(r() * winColors.length)]
          out += `<rect x="${wx.toFixed(0)}" y="${wy.toFixed(0)}" width="10" height="12" fill="${c}" opacity="${winOpacity}"/>`
        }
      }
    }
  }
  return out
}

const sign = (x, y, color, glyphs) => `
  <g transform="translate(${x} ${y})" filter="url(#neon)">
    <rect x="-44" y="0" width="88" height="${glyphs.length * 96 + 20}" rx="10" fill="#0a0614" stroke="${color}" stroke-width="5"/>
    ${glyphs.map((g, i) => `<text x="0" y="${86 + i * 96}" font-family="${CJK}" font-size="76" font-weight="700" fill="${color}" text-anchor="middle">${g}</text>`).join('')}
  </g>`

const rain = (() => {
  const r = rng(77)
  return Array.from({ length: 260 }, () => {
    const x = r() * (W + 200)
    const y = r() * H
    const l = 30 + r() * 60
    return `<line x1="${x.toFixed(0)}" y1="${y.toFixed(0)}" x2="${(x - l * 0.25).toFixed(0)}" y2="${(y + l).toFixed(0)}"/>`
  }).join('')
})()

const ronin = `
  <g transform="translate(2140 940)" fill="#05030a">
    <path d="M-40 -330 Q0 -380 40 -330 L46 -280 L-46 -280 Z"/>
    <path d="M-58 -282 L58 -282 L84 -150 L60 0 L-60 0 L-84 -150 Z"/>
    <path d="M58 -270 L330 -420" stroke="#22d3ee" stroke-width="7" stroke-linecap="round" filter="url(#neon)"/>
    <path d="M40 -250 L72 -276" stroke="#05030a" stroke-width="16" stroke-linecap="round"/>
  </g>
  <rect x="1880" y="940" width="680" height="${H - 940}" fill="#05030a"/>`

const defs = `
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#1c1145"/>
      <stop offset="0.6" stop-color="#52207f"/>
      <stop offset="1" stop-color="#c03a86"/>
    </linearGradient>${glow('neon', 9)}${blur('haze', 40)}`

const body = `
  <rect width="${W}" height="${H}" fill="url(#sky)"/>
  <ellipse cx="1280" cy="1100" rx="1500" ry="380" fill="#ec4899" opacity="0.35" filter="url(#haze)"/>
  <g opacity="0.55">${towers(3, 26, 500, 1000, '#1a0f33', ['#a78bfa', '#f472b6'], 0.6)}</g>
  ${towers(8, 18, 300, 760, '#0c0820', ['#22d3ee', '#f472b6', '#fde047'], 0.85)}
  ${sign(260, 300, '#f472b6', ['道', '場'])}
  ${sign(1700, 360, '#22d3ee', ['未', '来'])}
  ${sign(820, 520, '#fde047', ['道'])}
  <g stroke="#a5f3fc" stroke-width="2" opacity="0.28">${rain}</g>
  ${ronin}`

export const cyberpunkSvg = svgDoc(defs, body)
