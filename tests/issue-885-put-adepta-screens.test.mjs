// issue #885 — ещё пара скриншотов на /put-adepta.html: дашборд директора
// ПакЛайна и план-факт HR-листа дашборда СПЗ. Проверяем, что кадры на месте,
// размеры в данных совпадают с файлом (иначе вёрстка прыгает — CLS), а подписи
// не выдают настоящее имя заказчика.
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { CASES } from '../src/data/adeptPath.mjs'

const repo = resolve(import.meta.dirname, '..')

/** Ширина и высота из заголовка WebP (VP8 / VP8L / VP8X). */
function webpSize(file) {
  const b = readFileSync(file)
  assert.equal(b.toString('ascii', 0, 4), 'RIFF')
  const kind = b.toString('ascii', 12, 16)
  if (kind === 'VP8X') return { width: 1 + b.readUIntLE(24, 3), height: 1 + b.readUIntLE(27, 3) }
  if (kind === 'VP8L') {
    const bits = b.readUInt32LE(21)
    return { width: 1 + (bits & 0x3fff), height: 1 + ((bits >> 14) & 0x3fff) }
  }
  return { width: b.readUInt16LE(26) & 0x3fff, height: b.readUInt16LE(28) & 0x3fff }
}

const images = (key) => CASES.find((c) => c.key === key).images

test('#885: у ПакЛайна есть дашборд директора, у СПЗ — HR-лист дашборда', () => {
  assert.ok(images('pakline').some((i) => i.src === '/adept/pakline-dashboard.webp'))
  assert.ok(images('spz').some((i) => i.src === '/adept/spz-hr-plan-fakt.webp'))
})

test('#885: все скриншоты проектов существуют, размеры совпадают с файлами', () => {
  for (const c of CASES) {
    for (const img of c.images) {
      const file = resolve(repo, 'public' + img.src)
      assert.ok(existsSync(file), img.src)
      assert.deepEqual(webpSize(file), { width: img.width, height: img.height }, img.src)
      assert.ok(img.alt.length > 20, `${img.src}: нужна содержательная подпись`)
    }
  }
})

test('#885: подписи не называют настоящего заказчика', () => {
  const alts = CASES.flatMap((c) => c.images.map((i) => i.alt)).join('\n')
  assert.doesNotMatch(alts, /петфуд|спортзани/i)
})
