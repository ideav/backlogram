#!/usr/bin/env node
/**
 * Generate 1200×630 Open Graph variants for post covers.
 *
 * Why: BaseLayout.astro hardcodes `og:image:width=1200` / `height=630`. That
 * is only truthful when the cover really is 1200×630. Most post covers are
 * screenshots and banners of arbitrary size, so the declared dimensions lied
 * for 9 of 16 covers — превью прыгало/обрезалось, а twitter:card=
 * summary_large_image кадрировал не по центру (см. issue #487).
 *
 * What: for every `image:` referenced in post frontmatter whose source is NOT
 * already 1200×630, render a dedicated OG card at exactly 1200×630 into
 * `public/uploads/og/<name>.jpg`. The post page (posts/[...slug].astro) picks
 * the variant up when it exists, so og:image is always 1200×630 and the
 * hardcoded meta finally tells the truth. Originals stay untouched — they are
 * still shown full-size as the in-page hero, in listing cards and inline in
 * the article body.
 *
 * Layout: «blurred fill» — the source is contained (never cropped, never
 * upscaled) над затемнённой размытой копией самой обложки. Ничего не теряется,
 * нет уродливых полос, соотношение всегда ровно 1200×630.
 *
 * Idempotent: skips a variant whose source is unchanged. Run standalone
 * (`node scripts/generate-og-covers.mjs`) or as the first build step.
 */
import { mkdirSync, readdirSync, readFileSync, existsSync, statSync } from 'node:fs'
import { dirname, resolve, basename, extname } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')
const postsDir = resolve(root, 'src/content/posts')
const uploadsDir = resolve(root, 'public/uploads')
const outDir = resolve(uploadsDir, 'og')

const W = 1200
const H = 630
const BG = '#0f172a' // slate-900 — matches the site's OG default background

// ── Collect covers referenced from post frontmatter ────────────────────────
const covers = new Set()
for (const file of readdirSync(postsDir)) {
  if (!file.endsWith('.md')) continue
  const text = readFileSync(resolve(postsDir, file), 'utf8')
  const m = text.match(/^image:\s*(\S+)\s*$/m)
  if (!m) continue
  const ref = m[1].trim()
  if (ref.startsWith('/uploads/')) covers.add(ref.slice('/uploads/'.length))
}

// ── Render one 1200×630 blurred-fill card ──────────────────────────────────
async function renderCover(name) {
  const srcPath = resolve(uploadsDir, name)
  const input = readFileSync(srcPath)
  const meta = await sharp(input).metadata()

  if (meta.width === W && meta.height === H) return 'already-1200x630'

  // Blurred, darkened background: cover-crop a copy so it fills the whole card.
  const background = await sharp(input)
    .resize(W, H, { fit: 'cover', position: 'centre' })
    .blur(28)
    .modulate({ brightness: 0.5, saturation: 1.05 })
    .flatten({ background: BG })
    .toBuffer()

  // Foreground: the full image, contained (no crop) and never upscaled past
  // its natural size, so small covers stay crisp instead of turning blurry.
  const fgMax = {
    width: Math.min(meta.width, W),
    height: Math.min(meta.height, H),
  }
  const foreground = await sharp(input)
    .resize(fgMax.width, fgMax.height, { fit: 'inside', withoutEnlargement: true })
    .toBuffer()

  await sharp(background)
    .composite([{ input: foreground, gravity: 'centre' }])
    .flatten({ background: BG })
    .jpeg({ quality: 86, mozjpeg: true, chromaSubsampling: '4:4:4' })
    .toFile(resolve(outDir, ogName(name)))

  return `${meta.width}×${meta.height} → 1200×630`
}

// `/uploads/<name>.<ext>` → OG file basename `<name>.jpg`
const ogName = (name) => basename(name, extname(name)) + '.jpg'

// ── Run ────────────────────────────────────────────────────────────────────
mkdirSync(outDir, { recursive: true })

let made = 0
let skipped = 0
const missing = []
for (const name of [...covers].sort()) {
  const srcPath = resolve(uploadsDir, name)
  if (!existsSync(srcPath)) {
    missing.push(name)
    continue
  }
  const outPath = resolve(outDir, ogName(name))
  // Skip when the variant is already newer than its source.
  if (
    existsSync(outPath) &&
    statSync(outPath).mtimeMs >= statSync(srcPath).mtimeMs
  ) {
    const meta = await sharp(readFileSync(srcPath)).metadata()
    if (meta.width === W && meta.height === H) continue
    skipped++
    console.log(`  = og/${ogName(name)} (up to date)`)
    continue
  }
  const result = await renderCover(name)
  if (result === 'already-1200x630') continue
  made++
  console.log(`  + og/${ogName(name)}  ${result}`)
}

console.log(
  `OG covers: ${made} generated, ${skipped} up to date${
    missing.length ? `, ${missing.length} missing source (${missing.join(', ')})` : ''
  }`
)
if (missing.length) process.exitCode = 1
