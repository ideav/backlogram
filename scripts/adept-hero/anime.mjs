// «Аниме-закат»: огромные кучевые облака в розовом свете, комета через всё
// небо, город и провода, на крыше — фигура с развевающимися волосами.
import { H, W, blur, glow, ridge, rng, stars, svgDoc } from './common.mjs'

const cloud = (cx, cy, s, seed) => {
  const r = rng(seed)
  const puffs = Array.from({ length: 11 }, (_, i) => {
    const x = cx + (i - 5) * 70 * s + (r() - 0.5) * 40 * s
    const y = cy - Math.sin((i / 10) * Math.PI) * 140 * s + r() * 30 * s
    const rad = (90 + r() * 80) * s * (0.6 + Math.sin((i / 10) * Math.PI) * 0.6)
    return `<circle cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" r="${rad.toFixed(0)}"/>`
  }).join('')
  return `<g fill="url(#cloud)">${puffs}<rect x="${cx - 400 * s}" y="${cy - 20 * s}" width="${800 * s}" height="${90 * s}" rx="${45 * s}"/></g>`
}

const city = (() => {
  const r = rng(31)
  let out = ''
  for (let x = -20; x < W; x += 60 + r() * 90) {
    const w = 50 + r() * 110
    const h = 60 + r() * 210
    out += `<rect x="${x.toFixed(0)}" y="${(H - 180 - h).toFixed(0)}" width="${w.toFixed(0)}" height="${(h + 200).toFixed(0)}"/>`
    for (let k = 0; k < 4; k++) {
      if (r() < 0.55) out += `<rect x="${(x + 10 + r() * (w - 24)).toFixed(0)}" y="${(H - 160 - r() * h).toFixed(0)}" width="8" height="10" fill="#fde68a" opacity="0.8"/>`
    }
  }
  return `<g fill="#2b1846">${out}</g>`
})()

const girl = `
  <g transform="translate(2080 900)" fill="#140a22">
    <circle cx="0" cy="-292" r="30"/>
    <path d="M-26 -310 C -90 -300, -170 -250, -250 -270 C -180 -240, -110 -250, -40 -262 C -110 -230, -170 -200, -230 -205 C -150 -190, -80 -215, -20 -250 Z"/>
    <path d="M-34 -258 L34 -258 L44 -150 L-44 -150 Z"/>
    <path d="M-48 -150 L48 -150 L74 -78 L-74 -78 Z"/>
    <path d="M-30 -80 L-22 0 L-8 0 L-6 -80 Z M6 -80 L8 0 L22 0 L30 -80 Z"/>
    <path d="M-34 -250 L-62 -160 L-50 -156 L-24 -232 Z M34 -250 L62 -160 L50 -156 L24 -232 Z"/>
  </g>
  <rect x="1700" y="900" width="860" height="${H - 900}" fill="#140a22"/>
  <rect x="1700" y="860" width="860" height="10" fill="#140a22"/>
  ${Array.from({ length: 15 }, (_, i) => `<rect x="${1710 + i * 60}" y="860" width="8" height="40" fill="#140a22"/>`).join('')}`

const wires = `
  <g stroke="#140a22" fill="none">
    <rect x="300" y="250" width="22" height="${H - 250}" fill="#140a22" stroke="none"/>
    <rect x="230" y="300" width="160" height="12" fill="#140a22" stroke="none"/>
    <rect x="250" y="360" width="120" height="10" fill="#140a22" stroke="none"/>
    <path d="M-20 360 Q 120 420 240 306" stroke-width="4"/>
    <path d="M380 306 Q 1100 520 1760 380" stroke-width="4"/>
    <path d="M360 366 Q 1100 600 1780 470" stroke-width="3"/>
    <path d="M-20 420 Q 140 470 260 366" stroke-width="3"/>
  </g>`

const defs = `
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#0f1e5a"/>
      <stop offset="0.35" stop-color="#5b3aa8"/>
      <stop offset="0.65" stop-color="#f472b6"/>
      <stop offset="0.9" stop-color="#fdba74"/>
    </linearGradient>
    <linearGradient id="cloud" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#fff1f7"/>
      <stop offset="0.55" stop-color="#f9a8d4"/>
      <stop offset="1" stop-color="#9d5fc9"/>
    </linearGradient>
    <linearGradient id="tail" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#ffffff" stop-opacity="0"/>
      <stop offset="1" stop-color="#ffffff" stop-opacity="0.95"/>
    </linearGradient>${glow('g', 10)}${blur('soft', 6)}`

const body = `
  <rect width="${W}" height="${H}" fill="url(#sky)"/>
  ${stars(5, 120, 380)}
  <path d="M260 120 L1560 330" stroke="url(#tail)" stroke-width="10" stroke-linecap="round" filter="url(#g)"/>
  <circle cx="1560" cy="330" r="12" fill="#ffffff" filter="url(#g)"/>
  <g opacity="0.95" filter="url(#soft)">${cloud(560, 780, 1.5, 3)}${cloud(2150, 640, 1.2, 9)}</g>
  <g opacity="0.7" filter="url(#soft)">${cloud(1350, 900, 0.9, 17)}</g>
  ${ridge(41, 1010, 40, 120, '#3b2160', 0.9)}
  ${city}
  ${wires}
  ${girl}`

export const animeSvg = svgDoc(defs, body)
