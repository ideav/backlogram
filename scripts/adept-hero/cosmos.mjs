// «Космос»: туманность, планета с кольцами, путь из светящихся точек-станций
// к далёкой звезде, ракета со шлейфом.
import { H, W, blur, glow, rng, stars, svgDoc } from './common.mjs'

const route = [[180, 1080], [520, 900], [760, 980], [1020, 760], [1500, 820], [1820, 560], [2240, 300]]
const routePath = route.map(([x, y], i) => `${i ? 'L' : 'M'}${x} ${y}`).join(' ')

const dust = (() => {
  const r = rng(91)
  return Array.from({ length: 40 }, () => {
    const x = r() * W
    const y = r() * H
    return `<circle cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" r="${(2 + r() * 3).toFixed(1)}" fill="#a5f3fc" opacity="${(0.4 + r() * 0.5).toFixed(2)}" filter="url(#g)"/>`
  }).join('')
})()

const defs = `
    <radialGradient id="space" cx="0.5" cy="0.4" r="0.8">
      <stop offset="0" stop-color="#1b1446"/>
      <stop offset="1" stop-color="#03030c"/>
    </radialGradient>
    <radialGradient id="planet" cx="0.35" cy="0.3" r="0.8">
      <stop offset="0" stop-color="#fcd34d"/>
      <stop offset="0.45" stop-color="#f97316"/>
      <stop offset="1" stop-color="#4c0519"/>
    </radialGradient>
    <radialGradient id="star" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0" stop-color="#ffffff"/>
      <stop offset="0.2" stop-color="#a5f3fc"/>
      <stop offset="1" stop-color="#22d3ee" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="trail" x1="0" y1="1" x2="1" y2="0">
      <stop offset="0" stop-color="#f472b6" stop-opacity="0"/>
      <stop offset="1" stop-color="#fde68a" stop-opacity="0.95"/>
    </linearGradient>${glow('g', 8)}${blur('neb', 70)}`

const body = `
  <rect width="${W}" height="${H}" fill="url(#space)"/>
  <ellipse cx="700" cy="380" rx="700" ry="260" fill="#7c3aed" opacity="0.45" filter="url(#neb)"/>
  <ellipse cx="1500" cy="700" rx="800" ry="220" fill="#0ea5e9" opacity="0.3" filter="url(#neb)"/>
  <ellipse cx="2100" cy="300" rx="500" ry="300" fill="#db2777" opacity="0.35" filter="url(#neb)"/>
  ${stars(29, 420, H)}
  <circle cx="2240" cy="300" r="160" fill="url(#star)"/>
  <g transform="translate(380 330) rotate(-18)">
    <ellipse rx="380" ry="70" fill="none" stroke="#fde68a" stroke-width="14" opacity="0.55"/>
    <circle r="210" fill="url(#planet)"/>
    <path d="M-380 0 A380 70 0 0 0 380 0" fill="none" stroke="#fde68a" stroke-width="14" opacity="0.8"/>
  </g>
  <path d="${routePath}" fill="none" stroke="#67e8f9" stroke-width="4" stroke-dasharray="4 18" stroke-linecap="round" filter="url(#g)"/>
  ${route.slice(0, -1).map(([x, y]) => `<circle cx="${x}" cy="${y}" r="12" fill="#0b1026" stroke="#67e8f9" stroke-width="5" filter="url(#g)"/>`).join('')}
  <path d="M1180 1180 Q 1700 1000 2010 860" fill="none" stroke="url(#trail)" stroke-width="22" stroke-linecap="round" filter="url(#g)"/>
  <g transform="translate(2040 845) rotate(-32)">
    <path d="M0 -28 C 60 -28, 110 -12, 140 0 C 110 12, 60 28, 0 28 Z" fill="#e2e8f0"/>
    <path d="M10 -28 L-30 -60 L30 -28 Z M10 28 L-30 60 L30 28 Z" fill="#f43f5e"/>
    <circle cx="80" cy="0" r="12" fill="#22d3ee"/>
    <path d="M0 -16 L-50 0 L0 16 Z" fill="#fde68a" filter="url(#g)"/>
  </g>
  ${dust}`

export const cosmosSvg = svgDoc(defs, body)
