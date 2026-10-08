/**
 * Tiny SVG drawing kit for the English Integram mockups (issue #532).
 * Everything is plain strings -> one <svg> document -> @resvg/resvg-js -> PNG.
 */

export const C = {
  brand: '#307fe2',
  brandDark: '#1d5fb8',
  brandSoft: '#e8f1fc',
  ink: '#0f172a',
  text: '#1e293b',
  muted: '#64748b',
  faint: '#94a3b8',
  line: '#e2e8f0',
  bg: '#f8fafc',
  white: '#ffffff',
  green: '#059669',
  greenSoft: '#d1fae5',
  amber: '#f59e0b',
  amberSoft: '#fef3c7',
  red: '#dc2626',
  redSoft: '#fee2e2',
  violet: '#7c3aed',
  violetSoft: '#ede9fe',
  slateSoft: '#f1f5f9',
  navy: '#0f172a',
}

export const esc = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

/** Rough Inter text width, good enough for truncation and wrapping. */
export function tw(s, size, bold = false) {
  let w = 0
  for (const ch of String(s)) {
    if ('ijl.,:;\'|!'.includes(ch)) w += 0.27
    else if ('ftr I()[]/ -'.includes(ch)) w += 0.36
    else if ('mwMW@%'.includes(ch)) w += 0.88
    else if (/[A-Z]/.test(ch)) w += 0.67
    else if (/[0-9$]/.test(ch)) w += 0.58
    else w += 0.55
  }
  return w * size * (bold ? 1.05 : 1)
}

export function fit(s, size, maxW, bold = false) {
  s = String(s)
  if (tw(s, size, bold) <= maxW) return s
  while (s.length > 1 && tw(s + '…', size, bold) > maxW) s = s.slice(0, -1)
  return s.trimEnd() + '…'
}

export function wrap(s, size, maxW, bold = false) {
  const words = String(s).split(' ')
  const lines = []
  let cur = ''
  for (const w of words) {
    const t = cur ? cur + ' ' + w : w
    if (tw(t, size, bold) > maxW && cur) {
      lines.push(cur)
      cur = w
    } else cur = t
  }
  if (cur) lines.push(cur)
  return lines
}

export const rect = (x, y, w, h, o = {}) => {
  const { fill = C.white, stroke, r = 0, sw = 1, shadow, opacity, extra = '' } = o
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${fill}"${
    stroke ? ` stroke="${stroke}" stroke-width="${sw}"` : ''
  }${shadow ? ` filter="url(#${shadow === true ? 'sh' : shadow})"` : ''}${opacity != null ? ` opacity="${opacity}"` : ''} ${extra}/>`
}

export const text = (x, y, s, o = {}) => {
  const { size = 14, weight = 400, fill = C.text, anchor = 'start', opacity, spacing } = o
  return `<text x="${x}" y="${y}" font-family="Inter" font-size="${size}" font-weight="${weight}" fill="${fill}" text-anchor="${anchor}"${
    opacity != null ? ` opacity="${opacity}"` : ''
  }${spacing ? ` letter-spacing="${spacing}"` : ''}>${esc(s)}</text>`
}

export const line = (x1, y1, x2, y2, o = {}) =>
  `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${o.stroke || C.line}" stroke-width="${o.sw || 1}"${
    o.dash ? ` stroke-dasharray="${o.dash}"` : ''
  }/>`

export const circle = (cx, cy, r, fill, extra = '') => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}" ${extra}/>`

export const path = (d, o = {}) =>
  `<path d="${d}" fill="${o.fill || 'none'}"${o.stroke ? ` stroke="${o.stroke}" stroke-width="${o.sw || 2}" stroke-linecap="round" stroke-linejoin="round"` : ''}${o.opacity != null ? ` opacity="${o.opacity}"` : ''}/>`

export const defs = `<defs>
<filter id="sh" x="-10%" y="-10%" width="120%" height="130%"><feDropShadow dx="0" dy="6" stdDeviation="10" flood-color="#0f172a" flood-opacity="0.10"/></filter>
<filter id="shs" x="-10%" y="-10%" width="120%" height="130%"><feDropShadow dx="0" dy="1" stdDeviation="2" flood-color="#0f172a" flood-opacity="0.08"/></filter>
<filter id="shl" x="-20%" y="-20%" width="140%" height="150%"><feDropShadow dx="0" dy="18" stdDeviation="22" flood-color="#0f172a" flood-opacity="0.22"/></filter>
<linearGradient id="gbrand" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#4b95f0"/><stop offset="1" stop-color="#1d5fb8"/></linearGradient>
<linearGradient id="gsoft" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#eaf2fd"/><stop offset="0.55" stop-color="#f3f0ff"/><stop offset="1" stop-color="#e6f6ef"/></linearGradient>
<linearGradient id="gdark" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#0f172a"/><stop offset="1" stop-color="#16294f"/></linearGradient>
</defs>`

export const svgDoc = (w, h, body) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${defs}${body}</svg>`

/** Integram link icon (same polygons as site-en/src/components/Logo.tsx), drawn at x,y with the given height. */
export function logoIcon(x, y, h, fill = C.brand) {
  const s = h / 133.33
  return `<g transform="translate(${x} ${y}) scale(${s})"><polygon fill="${fill}" points="116.92 41.15 108.17 50.57 123.11 66.66 74.45 118.53 12.68 98.54 12.68 34.79 74.45 14.8 85.63 26.99 94.46 17.68 78.14 0 0 25.29 0 108.04 78.14 133.33 140.69 66.66 116.92 41.15"/><polygon fill="${fill}" points="85.74 92.18 94.48 82.76 79.55 66.67 128.21 14.8 189.97 34.79 189.97 98.54 128.21 118.53 117 106.31 108.17 115.63 124.51 133.33 202.65 108.05 202.65 25.29 124.51 0 61.96 66.67 85.74 92.18"/></g>`
}

export function logo(x, y, h = 28, o = {}) {
  const fill = o.icon || C.brand
  const size = Math.round(h * 0.82)
  return (
    logoIcon(x, y, h, fill) +
    text(x + h * 1.52 + 10, y + h * 0.78, 'Integram', { size, weight: 700, fill: o.fill || C.ink })
  )
}

export const initials = (n) =>
  n
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')

const AV = ['#307fe2', '#7c3aed', '#059669', '#d97706', '#db2777', '#0891b2', '#4f46e5']
export function avatar(cx, cy, r, name, i) {
  const col = AV[(i ?? name.length) % AV.length]
  return circle(cx, cy, r, col) + text(cx, cy + r * 0.36, initials(name), { size: r * 0.9, weight: 700, fill: '#fff', anchor: 'middle' })
}

const BADGE = {
  green: [C.greenSoft, '#047857'],
  amber: [C.amberSoft, '#92400e'],
  red: [C.redSoft, '#b91c1c'],
  blue: [C.brandSoft, C.brandDark],
  violet: [C.violetSoft, '#6d28d9'],
  gray: [C.slateSoft, '#475569'],
}
export function badge(x, y, label, color = 'gray', size = 12) {
  const [bg, fg] = BADGE[color]
  const w = tw(label, size, true) + 18
  return (
    rect(x, y - 11, w, 22, { fill: bg, r: 11 }) +
    text(x + 9, y + 4.5, label, { size, weight: 700, fill: fg }) +
    ''
  ) + `<!--w:${w}-->`
}
export const badgeW = (label, size = 12) => tw(label, size, true) + 18

/** Relation chip: a linked record pointing to another table. */
export function rel(x, y, label, maxW = 160) {
  const t = fit(label, 12.5, maxW - 34, true)
  const w = tw(t, 12.5, true) + 34
  return (
    rect(x, y - 12, w, 24, { fill: C.brandSoft, r: 7 }) +
    path(`M${x + 10} ${y + 2.5} l4 -4 M${x + 12} ${y - 5} l1.6 -1.6 a2.4 2.4 0 0 1 3.4 3.4 l-1.6 1.6 M${x + 12.8} ${y + 4.6} l-1.6 1.6 a2.4 2.4 0 0 1 -3.4 -3.4 l1.6 -1.6`, { stroke: C.brand, sw: 1.4 }) +
    text(x + 24, y + 4.5, t, { size: 12.5, weight: 700, fill: C.brandDark })
  )
}

export function progress(x, y, w, p, color = C.brand, h = 8) {
  return rect(x, y, w, h, { fill: C.line, r: h / 2 }) + rect(x, y, Math.max(h, w * p), h, { fill: color, r: h / 2 })
}

export function button(x, y, label, o = {}) {
  const { primary = true, h = 38, size = 14 } = o
  const w = o.w || tw(label, size, true) + 36
  return (
    rect(x, y, w, h, primary ? { fill: C.brand, r: 9 } : { fill: C.white, stroke: C.line, r: 9, extra: 'filter="url(#shs)"' }) +
    text(x + w / 2, y + h / 2 + size * 0.36, label, { size, weight: 700, fill: primary ? '#fff' : C.text, anchor: 'middle' })
  )
}

/**
 * Data table. cols: [{h, w, k, align}] where cell value can be a string or {type,...}
 * types: name (avatar+text), badge, rel, prog, num (right), text (default), bold
 */
export function table(x, y, w, cols, rows, o = {}) {
  const rowH = o.rowH || 50
  const headH = o.headH || 42
  const total = cols.reduce((a, c) => a + c.w, 0)
  const sc = w / total
  const h = headH + rows.length * rowH
  let s = rect(x, y, w, h, { fill: C.white, stroke: C.line, r: 12, extra: 'filter="url(#shs)"' })
  s += `<clipPath id="tc${x}_${y}"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="12"/></clipPath><g clip-path="url(#tc${x}_${y})">`
  s += rect(x, y, w, headH, { fill: '#f8fafc' }) + line(x, y + headH, x + w, y + headH)
  let cx = x
  const xs = []
  cols.forEach((c) => {
    xs.push(cx)
    const cw = c.w * sc
    const tx = c.align === 'right' ? cx + cw - 18 : cx + 18
    s += text(tx, y + headH / 2 + 4.5, c.h.toUpperCase(), { size: 11.5, weight: 700, fill: C.muted, anchor: c.align === 'right' ? 'end' : 'start', spacing: 0.6 })
    cx += cw
  })
  rows.forEach((r, ri) => {
    const ry = y + headH + ri * rowH
    const mid = ry + rowH / 2
    if (o.highlight === ri) s += rect(x, ry, w, rowH, { fill: '#f1f7fe' })
    if (ri > 0) s += line(x, ry, x + w, ry)
    cx = x
    cols.forEach((c, ci) => {
      const cw = c.w * sc
      const v = r[ci]
      const pad = 16
      const maxW = cw - pad * 2
      const val = typeof v === 'object' && v !== null ? v : { t: 'text', v }
      const px = cx + pad
      switch (val.t) {
        case 'name':
          s += avatar(px + 14, mid, 14, val.v, ri + ci) + text(px + 38, mid + 5, fit(val.v, 14.5, maxW - 38, true), { size: 14.5, weight: 700, fill: C.ink })
          break
        case 'badge':
          s += badge(px, mid, val.v, val.c)
          break
        case 'rel':
          s += rel(px, mid, val.v, maxW)
          break
        case 'prog':
          s += progress(px, mid - 4, maxW - 44, val.v, val.c || C.brand) + text(px + maxW - 36, mid + 4.5, Math.round(val.v * 100) + '%', { size: 12.5, weight: 700, fill: C.muted })
          break
        case 'num':
          s += text(cx + cw - 18, mid + 5, val.v, { size: 14.5, weight: val.b ? 700 : 400, fill: val.f || C.text, anchor: 'end' })
          break
        case 'bold':
          s += text(px, mid + 5, fit(val.v, 14.5, maxW, true), { size: 14.5, weight: 700, fill: C.ink })
          break
        default:
          s += text(px, mid + 5, fit(val.v, 14.5, maxW), { size: 14.5, fill: val.f || C.text })
      }
      cx += cw
    })
  })
  s += '</g>'
  return s
}

export function kpi(x, y, w, label, value, delta, up = true, h = 104) {
  return (
    rect(x, y, w, h, { fill: C.white, stroke: C.line, r: 14, extra: 'filter="url(#shs)"' }) +
    text(x + 22, y + 32, label, { size: 13.5, weight: 700, fill: C.muted }) +
    text(x + 22, y + 72, value, { size: 30, weight: 700, fill: C.ink }) +
    (delta ? text(x + w - 22, y + 72, delta, { size: 13.5, weight: 700, fill: up ? C.green : C.red, anchor: 'end' }) : '')
  )
}

const NAVICON = {
  grid: 'M4 4h6v6H4z M14 4h6v6h-6z M4 14h6v6H4z M14 14h6v6h-6z',
  table: 'M4 5h16v14H4z M4 10h16 M10 5v14',
  chart: 'M5 19V9 M12 19V5 M19 19v-7',
  users: 'M9 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6z M3 19c0-3 2.7-5 6-5s6 2 6 5 M17 8a2.5 2.5 0 1 1 0 5 M18 14c2 .3 3 2 3 4',
  box: 'M4 8l8-4 8 4v8l-8 4-8-4z M4 8l8 4 8-4 M12 12v8',
  cog: 'M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z M12 3v3 M12 18v3 M3 12h3 M18 12h3 M5.6 5.6l2.1 2.1 M16.3 16.3l2.1 2.1 M5.6 18.4l2.1-2.1 M16.3 7.7l2.1-2.1',
  spark: 'M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z M18 16l.8 2.2L21 19l-2.2.8L18 22l-.8-2.2L15 19l2.2-.8z',
  doc: 'M6 3h9l4 4v14H6z M14 3v5h5 M9 13h7 M9 17h7',
  cal: 'M4 6h16v14H4z M4 10h16 M8 3v4 M16 3v4',
  money: 'M12 3v18 M16 7.5c-1-1.2-2.4-1.8-4-1.8-2.2 0-3.8 1.1-3.8 2.8 0 4 8 2 8 6 0 1.7-1.7 2.8-4.2 2.8-1.8 0-3.3-.7-4.3-2',
  wrench: 'M14 6a4 4 0 0 0 5 5l-9 9a2.1 2.1 0 0 1-3-3l9-9a4 4 0 0 1-2-2z',
  cart: 'M3 4h3l2 11h10l2-8H7 M9 20a1 1 0 1 0 0 .1 M17 20a1 1 0 1 0 0 .1',
  search: 'M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14z M16 16l5 5',
  bell: 'M6 16V11a6 6 0 1 1 12 0v5l2 2H4z M10 21h4',
}
export const icon = (name, x, y, size = 20, stroke = C.muted, sw = 1.8) =>
  `<g transform="translate(${x} ${y}) scale(${size / 24})">${path(NAVICON[name], { stroke, sw: sw * (24 / size) })}</g>`

/**
 * App shell: left sidebar + top bar. Returns { svg, cx, cy, cw, ch } with the content box.
 */
export function appShell(W, H, o) {
  const { workspace = 'Acme Co', nav, active, title, crumbs, actions = [] } = o
  const SB = 240
  let s = rect(0, 0, W, H, { fill: C.bg })
  s += rect(0, 0, SB, H, { fill: C.white }) + line(SB, 0, SB, H)
  s += logo(26, 26, 28)
  s += rect(18, 82, SB - 36, 44, { fill: C.slateSoft, r: 10 })
  s += rect(28, 92, 24, 24, { fill: C.ink, r: 6 }) + text(40, 109, workspace[0], { size: 14, weight: 700, fill: '#fff', anchor: 'middle' })
  s += text(62, 109, fit(workspace, 14, 130, true), { size: 14, weight: 700, fill: C.ink })
  s += path('M200 107 l4 4 4 -4', { stroke: C.faint, sw: 1.6 })
  s += text(28, 164, 'WORKSPACE', { size: 11, weight: 700, fill: C.faint, spacing: 1 })
  nav.forEach((n, i) => {
    const ny = 178 + i * 46
    const act = i === active
    if (act) s += rect(14, ny, SB - 28, 40, { fill: C.brandSoft, r: 9 })
    s += icon(n.icon, 28, ny + 10, 20, act ? C.brand : C.muted)
    s += text(58, ny + 25.5, n.label, { size: 15, weight: act ? 700 : 400, fill: act ? C.brandDark : C.text })
    if (n.count) s += text(SB - 30, ny + 25, n.count, { size: 12.5, weight: 700, fill: act ? C.brand : C.faint, anchor: 'end' })
  })
  // user card at bottom
  s += line(0, H - 78, SB, H - 78) + avatar(40, H - 39, 17, o.user || 'Emma Carter', 2)
  s += text(66, H - 44, o.user || 'Emma Carter', { size: 14, weight: 700, fill: C.ink }) + text(66, H - 25, o.role || 'Admin', { size: 12.5, fill: C.muted })
  // top bar
  s += rect(SB, 0, W - SB, 76, { fill: C.white }) + line(SB, 76, W, 76)
  s += text(SB + 32, 36, title, { size: 22, weight: 700, fill: C.ink })
  s += text(SB + 32, 58, crumbs || '', { size: 13, fill: C.muted })
  let ax = W - 32
  for (const a of [...actions].reverse()) {
    const bw = tw(a.label, 14, true) + 36
    ax -= bw
    s += button(ax, 19, a.label, { primary: a.primary, w: bw })
    ax -= 12
  }
  return { svg: s, x: SB + 32, y: 100, w: W - SB - 64, h: H - 100 - 28 }
}

export const card = (x, y, w, h, o = {}) => rect(x, y, w, h, { fill: C.white, stroke: C.line, r: o.r || 14, extra: o.shadow ? 'filter="url(#sh)"' : 'filter="url(#shs)"' })

/** Chat bubble layout used by the AI scenes. Returns {svg, h}. */
export function bubble(x, y, w, who, lines, o = {}) {
  const size = o.size || 15
  const lh = size * 1.55
  const user = who === 'user'
  const pad = 16
  const wrapped = lines.flatMap((l) => wrap(l, size, w - pad * 2 - 4))
  const h = wrapped.length * lh + pad * 2 - 4
  let s = rect(x, y, w, h, user ? { fill: C.brand, r: 14 } : { fill: C.white, stroke: C.line, r: 14, extra: 'filter="url(#shs)"' })
  wrapped.forEach((l, i) => {
    s += text(x + pad, y + pad + size * 0.9 + i * lh - 2, l, { size, fill: user ? '#fff' : C.text, weight: 400 })
  })
  return { svg: s, h }
}

/** Tool-call chip for the Integram MCP: name + status. */
export function toolCall(x, y, w, name, args, ok = true) {
  const h = 54
  return {
    h,
    svg:
      rect(x, y, w, h, { fill: '#0f172a', r: 12 }) +
      circle(x + 22, y + 27, 9, ok ? '#10b981' : '#f59e0b') +
      path(`M${x + 17.5} ${y + 27} l3 3 l5 -6`, { stroke: '#fff', sw: 2 }) +
      text(x + 42, y + 24, name, { size: 14, weight: 700, fill: '#7dd3fc' }) +
      text(x + 42, y + 43, fit(args, 12.5, w - 60), { size: 12.5, fill: '#94a3b8' }),
  }
}
