#!/usr/bin/env node
/**
 * Нарезка картинок ниш под требования РСЯ Яндекс.Директа (issue #457).
 *
 * Директ принимает два НЕПЕРЕСЕКАЮЩИХСЯ бакета соотношений
 * (https://yandex.ru/support/direct/ru/efficiency/images):
 *
 *   стандартное      1:1 … 4:3   (0.75–1.333), 450–5000 px по каждой стороне
 *   широкоформатное  ровно 16:9,              1080×607 … 5000×2812 px
 *
 * Исходники (`image` из src/data/usecases.mjs) — 1536×1024, то есть 3:2 = 1.5.
 * Это ровно разрыв между бакетами: широковато для 4:3, узковато для 16:9, —
 * поэтому as-is Директ их отклоняет. Отсюда две нарезки на нишу.
 *
 * Комбинаторное объявление берёт до 5 картинок и Яндекс советует грузить
 * РАЗНЫЕ соотношения, чтобы объявление попадало и в стандартные, и в широкие
 * места показа — поэтому кладём оба варианта, а не выбираем один.
 *
 * Кроп, не ресайз: обрезаем до максимального прямоугольника точного
 * соотношения и не трогаем пиксели — картинки это скриншоты интерфейса, любое
 * пересэмплирование мылит и без того мелкий текст.
 *
 * Якорь — верхний левый угол, а не центр: у всех исходников слева сайдбар,
 * сверху логотип и заголовок раздела. Центральный кроп срезал бы шапку и
 * распилил сайдбар пополам; так остаются бренд и название раздела.
 *
 * PNG, не JPEG — на тексте интерфейса JPEG даёт ореолы.
 *
 * Выход: public/direct/<slug>-4x3.png и public/direct/<slug>-16x9.png.
 * Vite копирует public/ как есть, поэтому у каждой картинки будет публичный
 * URL — именно ссылка идёт в колонки «Изображение 1…5» XLSX Коммандера,
 * Директ забирает файл сам при импорте.
 */
import { mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'
import { USE_CASES } from '../src/data/usecases.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')
const outDir = resolve(root, 'public/direct')
mkdirSync(outDir, { recursive: true })

const BUCKETS = [
  { name: '4x3', rw: 4, rh: 3, minW: 450, minH: 450, maxW: 5000, maxH: 5000 },
  { name: '16x9', rw: 16, rh: 9, minW: 1080, minH: 607, maxW: 5000, maxH: 2812 },
]

const gcd = (a, b) => (b ? gcd(b, a % b) : a)

/**
 * Максимальный прямоугольник ТОЧНОГО соотношения rw:rh, влезающий в W×H.
 * Считаем в «юнитах» (4:3 → 4×3, 16:9 → 16×9) и берём целое число юнитов —
 * так соотношение выходит точным, без накопленной ошибки округления.
 */
function cropBox(W, H, rw, rh) {
  const g = gcd(rw, rh)
  const uw = rw / g
  const uh = rh / g
  const k = Math.min(Math.floor(W / uw), Math.floor(H / uh))
  return { width: uw * k, height: uh * k }
}

let made = 0
for (const uc of USE_CASES) {
  const src = resolve(root, 'public', uc.image.replace(/^\//, ''))
  const { width: W, height: H } = await sharp(src).metadata()

  for (const b of BUCKETS) {
    const { width, height } = cropBox(W, H, b.rw, b.rh)

    // Страховка: молча выпустить картинку, которую Директ отклонит, — худший
    // исход, ошибка при генерации дешевле отбраковки на модерации.
    const ratio = width / height
    const want = b.rw / b.rh
    if (Math.abs(ratio - want) > 1e-9) throw new Error(`${uc.slug} ${b.name}: соотношение ${ratio}, ждали ${want}`)
    if (width < b.minW || height < b.minH) throw new Error(`${uc.slug} ${b.name}: ${width}×${height} мельче минимума ${b.minW}×${b.minH}`)
    if (width > b.maxW || height > b.maxH) throw new Error(`${uc.slug} ${b.name}: ${width}×${height} больше максимума ${b.maxW}×${b.maxH}`)

    const out = resolve(outDir, `${uc.slug}-${b.name}.png`)
    await sharp(src).extract({ left: 0, top: 0, width, height }).png({ compressionLevel: 9 }).toFile(out)
    console.log(`  ${uc.slug.padEnd(26)} ${b.name.padEnd(5)} ${W}×${H} → ${width}×${height}`)
    made++
  }
}
console.log(`\nГотово: ${made} картинок в public/direct/`)
