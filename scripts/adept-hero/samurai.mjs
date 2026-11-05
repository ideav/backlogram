// «Путь самурая»: алое солнце, гора со снежной шапкой, тории, самурай на утёсе
// спиной к зрителю, лепестки сакуры по ветру.
import { H, W, blur, glow, ridge, rng, svgDoc } from './common.mjs'

const petals = (() => {
  const r = rng(7)
  return Array.from({ length: 70 }, () => {
    const x = (r() * W).toFixed(0)
    const y = (r() * H).toFixed(0)
    const s = 5 + r() * 9
    const a = (r() * 180).toFixed(0)
    const o = (0.45 + r() * 0.5).toFixed(2)
    return `<ellipse cx="${x}" cy="${y}" rx="${s.toFixed(1)}" ry="${(s * 0.55).toFixed(1)}" transform="rotate(${a} ${x} ${y})" fill="#fbcfe8" opacity="${o}"/>`
  }).join('')
})()

const samurai = `
  <g transform="translate(2170 960)" fill="#0b0508">
    <ellipse cx="0" cy="-378" rx="10" ry="13"/>
    <circle cx="0" cy="-343" r="27"/>
    <path d="M-12 -352 C -80 -360, -150 -330, -230 -360 C -160 -340, -90 -345, -10 -338 Z" fill="#b91c1c"/>
    <path d="M-62 -312 Q0 -332 62 -312 L74 -200 L-74 -200 Z"/>
    <path d="M-60 -310 L-112 -212 L-74 -192 L-56 -258 Z"/>
    <path d="M60 -310 L112 -212 L74 -192 L56 -258 Z"/>
    <path d="M-64 -206 L64 -206 L116 0 L-116 0 Z"/>
    <path d="M74 -214 L250 -146" stroke="#0b0508" stroke-width="10" stroke-linecap="round"/>
    <path d="M74 -214 L24 -233" stroke="#7f1d1d" stroke-width="12" stroke-linecap="round"/>
  </g>`

const torii = `
  <g transform="translate(470 860)" fill="#2a0a0f" opacity="0.92">
    <path d="M-190 -330 Q0 -300 190 -330 L200 -300 Q0 -272 -200 -300 Z"/>
    <rect x="-160" y="-268" width="320" height="18"/>
    <rect x="-130" y="-300" width="26" height="300"/>
    <rect x="104" y="-300" width="26" height="300"/>
    <rect x="-12" y="-272" width="24" height="26"/>
  </g>`

const defs = `
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#1a0b2e"/>
      <stop offset="0.45" stop-color="#7a1530"/>
      <stop offset="0.75" stop-color="#e2553a"/>
      <stop offset="1" stop-color="#f6b26b"/>
    </linearGradient>
    <radialGradient id="sun" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0" stop-color="#ff4d3d"/>
      <stop offset="1" stop-color="#d7263d"/>
    </radialGradient>
    <clipPath id="sunClip"><circle cx="1880" cy="520" r="300"/></clipPath>${glow('g', 30)}${blur('mist', 18)}`

const body = `
  <rect width="${W}" height="${H}" fill="url(#sky)"/>
  <circle cx="1880" cy="520" r="300" fill="url(#sun)" filter="url(#g)" opacity="0.95"/>
  ${[440, 520, 600, 680].map((y, i) => `<rect x="1540" y="${y}" width="700" clip-path="url(#sunClip)" height="${10 + i * 3}" fill="#f6b26b" opacity="0.35"/>`).join('')}
  <path d="M120 900 L700 330 Q760 290 820 330 L1420 900 Z" fill="#3b1530" opacity="0.85"/>
  <path d="M700 330 Q760 290 820 330 L880 390 L830 370 L790 400 L750 365 L700 395 L650 380 Z" fill="#fde7e7" opacity="0.9"/>
  ${ridge(11, 880, 90, 80, '#2a0f22', 0.9)}
  <rect x="-200" y="820" width="${W + 400}" height="120" fill="#f9a8a8" opacity="0.18" filter="url(#mist)"/>
  ${torii}
  ${ridge(23, 1010, 60, 60, '#14070f')}
  <path d="M1860 ${H} L1900 980 L2010 955 L2380 950 L2560 990 L2560 ${H} Z" fill="#0b0508"/>
  ${samurai}
  ${petals}`

export const samuraiSvg = svgDoc(defs, body)
