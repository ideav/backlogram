/**
 * Общие детали фонов hero «Пути адепта» (scripts/generate-adept-heroes.mjs).
 * Кадр 2560×1200: по центру идут заголовок и кнопки, поэтому главные фигуры
 * сцены стоят по краям, а середину страница ещё и притемняет своим градиентом.
 */
export const W = 2560
export const H = 1200

/** Детерминированный ГПСЧ (mulberry32): картинка пересобирается байт-в-байт. */
export function rng(seed) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export const glow = (id, sd) => `
    <filter id="${id}" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="${sd}" result="b"/>
      <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>`

export const blur = (id, sd) => `
    <filter id="${id}" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="${sd}"/>
    </filter>`

/** Звёзды: n точек в полосе [0, maxY], детерминированно. */
export function stars(seed, n, maxY, fill = '#ffffff') {
  const r = rng(seed)
  return Array.from({ length: n }, () => {
    const x = (r() * W).toFixed(0)
    const y = (r() * maxY).toFixed(0)
    const rad = (0.8 + r() * 2.2).toFixed(1)
    const o = (0.3 + r() * 0.7).toFixed(2)
    return `<circle cx="${x}" cy="${y}" r="${rad}" fill="${fill}" opacity="${o}"/>`
  }).join('')
}

/** Ломаная линия хребта: точки от левого края к правому, замкнутая вниз. */
export function ridge(seed, baseY, amp, step, fill, opacity = 1) {
  const r = rng(seed)
  let d = `M0 ${H} L0 ${baseY}`
  for (let x = 0; x <= W + step; x += step) {
    d += ` L${x} ${(baseY - r() * amp).toFixed(0)}`
  }
  return `<path d="${d} L${W} ${H} Z" fill="${fill}" opacity="${opacity}"/>`
}

export const svgDoc = (defs, body) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>${defs}
  </defs>
  ${body}
</svg>`
