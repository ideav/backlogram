// «Ретровейв»: полосатое закатное солнце, неоновая сетка до горизонта,
// каркасные горы и пальмы по краям.
import { H, W, glow, stars, svgDoc } from './common.mjs'

const HZ = 720 // линия горизонта

const grid = (() => {
  let out = ''
  for (let i = -24; i <= 24; i++) {
    out += `<line x1="${W / 2 + i * 40}" y1="${HZ}" x2="${W / 2 + i * 260}" y2="${H}"/>`
  }
  for (let k = 1; k <= 12; k++) {
    const y = HZ + (H - HZ) * Math.pow(k / 12, 2.2)
    out += `<line x1="0" y1="${y.toFixed(0)}" x2="${W}" y2="${y.toFixed(0)}"/>`
  }
  return `<g stroke="#f0abfc" stroke-width="3" opacity="0.8" filter="url(#g)">${out}</g>`
})()

const mountains = (pts, x0) => {
  const d = pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x0 + x} ${HZ - y}`).join(' ')
  const lines = pts.slice(1, -1).map(([x, y]) => `M${x0 + x} ${HZ - y} L${x0 + x * 0.5 + 200} ${HZ}`).join(' ')
  return `<path d="${d} Z" fill="#1e0b3a" stroke="#22d3ee" stroke-width="4" filter="url(#g)"/>
  <path d="${lines}" stroke="#22d3ee" stroke-width="2" opacity="0.6" fill="none"/>`
}

const palm = (x, s, flip) => `
  <g transform="translate(${x} ${H}) scale(${flip ? -s : s} ${s})" fill="#0b0418">
    <path d="M-14 0 C -10 -200, 20 -380, 60 -520 L74 -516 C 40 -380, 14 -200, 14 0 Z"/>
    ${[[-160, 40], [-120, -10], [-40, -60], [60, -50], [150, 0], [180, 60]].map(([dx, dy]) =>
      `<path d="M66 -520 Q ${66 + dx * 0.55} ${-600 + dy * 0.4}, ${66 + dx} ${-500 + dy} Q ${66 + dx * 0.45} ${-560 + dy * 0.4}, 66 -510 Z"/>`).join('')}
  </g>`

const defs = `
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#1c0b45"/>
      <stop offset="0.6" stop-color="#5e1a85"/>
      <stop offset="1" stop-color="#9d174d"/>
    </linearGradient>
    <linearGradient id="sun" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#fde047"/>
      <stop offset="0.55" stop-color="#fb7185"/>
      <stop offset="1" stop-color="#c026d3"/>
    </linearGradient>
    <linearGradient id="floor" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#2a0845"/>
      <stop offset="1" stop-color="#05010d"/>
    </linearGradient>
    <clipPath id="sunCut">
      <rect x="0" y="0" width="${W}" height="470"/>
      ${[0, 1, 2, 3, 4, 5].map(i => `<rect x="0" y="${480 + i * 42}" width="${W}" height="${30 - i * 4}"/>`).join('')}
    </clipPath>${glow('g', 6)}${glow('sunGlow', 40)}`

const body = `
  <rect width="${W}" height="${H}" fill="url(#sky)"/>
  ${stars(19, 160, 520)}
  <circle cx="${W / 2}" cy="${HZ - 40}" r="360" fill="url(#sun)" clip-path="url(#sunCut)" filter="url(#sunGlow)"/>
  ${mountains([[0, 0], [160, 260], [300, 150], [470, 330], [640, 120], [820, 210], [980, 0]], 0)}
  ${mountains([[0, 0], [180, 240], [340, 120], [520, 300], [700, 170], [860, 280], [1000, 0]], 1560)}
  <rect y="${HZ}" width="${W}" height="${H - HZ}" fill="url(#floor)"/>
  ${grid}
  <line x1="0" y1="${HZ}" x2="${W}" y2="${HZ}" stroke="#f0abfc" stroke-width="5" filter="url(#g)"/>
  ${palm(170, 1.25, false)}${palm(380, 0.85, true)}${palm(2380, 1.3, true)}${palm(2190, 0.8, false)}`

export const synthwaveSvg = svgDoc(defs, body)
