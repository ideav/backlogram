#!/usr/bin/env node
/**
 * Фоны hero для «Пути адепта» /put-adepta.html: несколько тем, страница
 * показывает случайную и шлёт её id с заявкой — смотрим, какая приводит
 * больше заявок. Список тем и путей — src/data/adeptHero.mjs, сцены —
 * scripts/adept-hero/<id>.mjs (чистый SVG, без внешних картинок).
 *
 *   node scripts/generate-adept-heroes.mjs [id ...]
 *
 * Пишет public/adept/hero-<id>.webp. Растеризация — sharp из blog-v2
 * (в корне его нет), запасной путь — переменная SHARP_MODULE.
 */
import { dirname, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { ADEPT_HEROES } from '../src/data/adeptHero.mjs'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')

async function loadSharp() {
  const candidates = [
    process.env.SHARP_MODULE,
    'sharp',
    pathToFileURL(join(root, 'blog-v2/node_modules/sharp/lib/index.js')).href,
  ].filter(Boolean)
  for (const spec of candidates) {
    try {
      return (await import(spec)).default
    } catch {
      /* пробуем следующий */
    }
  }
  throw new Error('не найден sharp: установите зависимости blog-v2 (npm i) или задайте SHARP_MODULE')
}

const only = process.argv.slice(2)
const sharp = await loadSharp()
for (const hero of ADEPT_HEROES) {
  if (only.length && !only.includes(hero.id)) continue
  const mod = await import(`./adept-hero/${hero.id}.mjs`)
  const svg = mod[`${hero.id}Svg`]
  const out = join(root, 'public', hero.src)
  await sharp(Buffer.from(svg)).webp({ quality: 80 }).toFile(out)
  if (process.env.ADEPT_HERO_PNG) {
    await sharp(Buffer.from(svg)).resize(1280).png().toFile(join(process.env.ADEPT_HERO_PNG, `${hero.id}.png`))
  }
  console.log(`→ ${out}`)
}
