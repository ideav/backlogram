#!/usr/bin/env node
/**
 * English Integram site images (issue #532).
 *
 * Renders hand-drawn SVG mockups of the Integram UI to PNG with
 * @resvg/resvg-js (the same renderer scripts/generate-og-images.mjs uses),
 * then palette-quantizes them to 256 colours (pure JS, no extra deps).
 *
 * Output (separate from the Russian site assets):
 *   site-en/public/img/hero.png               1600x1000
 *   site-en/public/img/uc-<slug>.png  x10     1536x1024
 *   site-en/public/img/excel-to-app.png       1536x1024
 *   site-en/public/img/ai-mcp.png             1536x1024
 *   site-en/public/img/og/<name>.png          1200x630
 *
 * Usage:  node scripts/en-generate-images.mjs [--only=name,name] [--no-quantize] [--svg]
 *   --only=crm,hero,og-home   render a subset (uc slug, hero, excel-to-app, ai-mcp, og, og-<name>)
 *   --svg                     also keep the intermediate .svg next to the PNG (debug)
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { deflateSync, crc32 } from 'node:zlib'
import { Resvg } from '@resvg/resvg-js'
import { useCaseScenes } from './en-images/scenes.mjs'
import { hero, excelToApp, aiMcp, ogCard, OG } from './en-images/marketing.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')
const outDir = resolve(root, 'site-en/public/img')
const ogDir = resolve(outDir, 'og')
mkdirSync(ogDir, { recursive: true })

const args = process.argv.slice(2)
const quantizeOn = !args.includes('--no-quantize')
const keepSvg = args.includes('--svg')
const only = (args.find((a) => a.startsWith('--only=')) || '').slice(7).split(',').filter(Boolean)
const wanted = (name) => only.length === 0 || only.includes(name)

const fonts = [resolve(__dirname, 'fonts/Inter-Regular.ttf'), resolve(__dirname, 'fonts/Inter-Bold.ttf')]
// Inter has two weights on disk: weights 500-600 fall back to Bold, which is fine for these mockups.

// ── PNG: median-cut quantizer + indexed encoder ───────────────────────────
function quantize(rgba, w, h) {
  const hist = new Map()
  for (let i = 0; i < w * h; i++) {
    const k = (rgba[i * 4] << 16) | (rgba[i * 4 + 1] << 8) | rgba[i * 4 + 2]
    let e = hist.get(k)
    if (!e) hist.set(k, (e = { k, n: 0, r: rgba[i * 4], g: rgba[i * 4 + 1], b: rgba[i * 4 + 2], sr: 0, sg: 0, sb: 0 }))
    e.n++; e.sr += rgba[i * 4]; e.sg += rgba[i * 4 + 1]; e.sb += rgba[i * 4 + 2]
  }
  const items = [...hist.values()]
  let boxes = [items]
  const range = (box, c) => {
    let lo = 255, hi = 0
    for (const it of box) { if (it[c] < lo) lo = it[c]; if (it[c] > hi) hi = it[c] }
    return hi - lo
  }
  while (boxes.length < 256) {
    // split the box with the largest (range * population)
    let bi = -1, best = 0
    boxes.forEach((b, i) => {
      if (b.length < 2) return
      const pop = b.reduce((a, x) => a + x.n, 0)
      const sc = Math.max(range(b, 'r'), range(b, 'g'), range(b, 'b')) * Math.sqrt(pop)
      if (sc > best) { best = sc; bi = i }
    })
    if (bi < 0) break
    const b = boxes[bi]
    const rr = range(b, 'r'), gg = range(b, 'g'), bb = range(b, 'b')
    const c = rr >= gg && rr >= bb ? 'r' : gg >= bb ? 'g' : 'b'
    b.sort((p, q) => p[c] - q[c])
    const half = b.reduce((a, x) => a + x.n, 0) / 2
    let acc = 0, cut = 1
    for (let i = 0; i < b.length - 1; i++) { acc += b[i].n; cut = i + 1; if (acc >= half) break }
    boxes.splice(bi, 1, b.slice(0, cut), b.slice(cut))
  }
  const pal = boxes.map((b) => {
    let n = 0, r = 0, g = 0, bl = 0
    for (const it of b) { n += it.n; r += it.sr; g += it.sg; bl += it.sb }
    return [Math.round(r / n), Math.round(g / n), Math.round(bl / n)]
  })
  const map = new Map()
  boxes.forEach((b, i) => b.forEach((it) => map.set(it.k, i)))
  const idx = new Uint8Array(w * h)
  for (let i = 0; i < w * h; i++) {
    idx[i] = map.get((rgba[i * 4] << 16) | (rgba[i * 4 + 1] << 8) | rgba[i * 4 + 2])
  }
  return { pal, idx }
}

function chunk(type, data) {
  const t = Buffer.from(type, 'ascii')
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length)
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(Buffer.concat([t, data])) >>> 0)
  return Buffer.concat([len, t, data, crc])
}

function encodeIndexed(w, h, pal, idx) {
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 3
  const raw = Buffer.alloc((w + 1) * h)
  for (let y = 0; y < h; y++) {
    raw[y * (w + 1)] = 0
    idx.copy ? idx.copy(raw, y * (w + 1) + 1, y * w, (y + 1) * w) : raw.set(idx.subarray(y * w, (y + 1) * w), y * (w + 1) + 1)
  }
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', ihdr),
    chunk('PLTE', Buffer.from(pal.flat())),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

function render(svg, file) {
  const resvg = new Resvg(svg, {
    font: { fontFiles: fonts, loadSystemFonts: false, defaultFontFamily: 'Inter' },
    shapeRendering: 2,
    textRendering: 1,
  })
  const img = resvg.render()
  let buf = img.asPng()
  if (quantizeOn) {
    const { pal, idx } = quantize(img.pixels, img.width, img.height)
    const q = encodeIndexed(img.width, img.height, pal, idx)
    if (q.length < buf.length) buf = q
  }
  writeFileSync(file, buf)
  if (keepSvg) writeFileSync(file.replace(/\.png$/, '.svg'), svg)
  console.log(`${file.replace(root, '').replace(/\\/g, '/')}  ${img.width}x${img.height}  ${(buf.length / 1024).toFixed(0)} KB`)
}

// ── Jobs ──────────────────────────────────────────────────────────────────
for (const [slug, fn] of Object.entries(useCaseScenes)) {
  if (wanted(slug)) render(fn(), resolve(outDir, `uc-${slug}.png`))
}
if (wanted('hero')) render(hero(), resolve(outDir, 'hero.png'))
if (wanted('excel-to-app')) render(excelToApp(), resolve(outDir, 'excel-to-app.png'))
if (wanted('ai-mcp')) render(aiMcp(), resolve(outDir, 'ai-mcp.png'))
for (const name of Object.keys(OG)) {
  if (only.length === 0 || only.includes('og') || only.includes(`og-${name}`)) render(ogCard(name), resolve(ogDir, `${name}.png`))
}
