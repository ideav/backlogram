import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { test } from 'node:test'

/**
 * КДПВ хабровского черновика об оценке трудоёмкости: картинка, черновик и
 * манифест должны сходиться. Размер обложки проверяется по самому файлу —
 * ужать/перерисовать её мимо нужного формата тогда не получится молча.
 */

const repoRoot = new URL('../', import.meta.url)
const dir = new URL('content/habr-effort-estimate/', repoRoot)
const manifest = JSON.parse(readFileSync(new URL('manifest.json', dir), 'utf8'))
const article = readFileSync(new URL(manifest.articlePath, dir), 'utf8')

/** Ширина и высота PNG лежат в IHDR — первом чанке после подписи. */
function pngSize(url) {
  const buf = readFileSync(url)
  assert.equal(buf.toString('ascii', 1, 4), 'PNG', 'ожидаем PNG')
  return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) }
}

test('манифест описывает КДПВ, файлы на месте', () => {
  const lead = manifest.leadImage
  assert.ok(lead, 'ожидаем manifest.leadImage')

  for (const key of ['path', 'retinaPath', 'sourcePath', 'generator']) {
    assert.ok(lead[key], `ожидаем leadImage.${key}`)
  }
  for (const key of ['path', 'retinaPath', 'sourcePath']) {
    assert.ok(existsSync(new URL(lead[key], dir)), `нет файла ${lead[key]}`)
  }
  assert.ok(
    existsSync(new URL(lead.generator, repoRoot)),
    `нет генератора ${lead.generator} — картинку нельзя пересобрать`,
  )
})

test('обложка ровно хабровского размера, ретина — вдвое', () => {
  const cover = pngSize(new URL(manifest.leadImage.path, dir))
  const retina = pngSize(new URL(manifest.leadImage.retinaPath, dir))

  assert.deepEqual(cover, { width: 780, height: 440 }, 'обложка Хабра — 780×440')
  assert.deepEqual(retina, { width: cover.width * 2, height: cover.height * 2 })
  assert.equal(manifest.leadImage.size, `${cover.width}x${cover.height}`)
  assert.equal(manifest.leadImage.retinaSize, `${retina.width}x${retina.height}`)
})

test('КДПВ стоит первой картинкой черновика и имеет alt', () => {
  const body = article.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n/, '')
  const first = body.match(/!\[([^\]]*)\]\(([^)]+)\)/)
  assert.ok(first, 'в черновике нет ни одной картинки')

  const [, alt, src] = first
  assert.ok(src.endsWith(manifest.leadImage.path), `первая картинка должна быть КДПВ, а не ${src}`)
  assert.ok(alt.length > 30, 'alt должен описывать картинку, а не быть заглушкой')

  // Картинка идёт до текста — иначе это уже не КДПВ.
  assert.ok(body.indexOf(first[0]) < body.indexOf('## TL;DR'), 'КДПВ должна стоять до TL;DR')
})

test('цифры на картинке те же, что в тексте статьи', () => {
  const svg = readFileSync(new URL(manifest.leadImage.sourcePath, dir), 'utf8')

  // Значения подписей на шкале — из сводной таблицы статьи.
  for (const label of ['306', '370', '410', '990', '800', '3', '600', '12', '400']) {
    assert.ok(svg.includes(label), `на картинке нет значения ${label}`)
  }
  assert.match(svg, /412 ФУНКЦИОНАЛЬНЫХ ТОЧЕК/)
  assert.match(svg, /шкала логарифмическая/, 'лог-шкалу обязательно оговариваем на самой картинке')

  // Те же числа в тексте — картинка не должна разъезжаться со статьёй.
  assert.match(article, /412 функциональных точек/)
  assert.match(article, /12 400 часов/)
})
