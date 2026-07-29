// issue #510 — инфографика в статью «Оценка в 300 часов».
//
// Схемы повторяют цифры из текста (63%, −17%, 10,3%, 8,3 → 12,3%…). Опасность
// у такой картинки одна: текст поправили, картинку забыли — и статья начинает
// спорить сама с собой. Поэтому тест сверяет каждое число со схемы с текстом
// статьи, а не просто проверяет, что файл лежит на месте.
import assert from 'node:assert/strict'
import { existsSync, readFileSync, statSync } from 'node:fs'
import { test } from 'node:test'

const repo = new URL('../', import.meta.url)
const uploads = new URL('blog-v2/public/uploads/', repo)
const postPath = new URL(
  'blog-v2/src/content/posts/promyshlennoe-prilozhenie-shansy-riski-trudoemkost.md',
  repo,
)

const post = readFileSync(postPath, 'utf8')
/** «8,3 %» и «8,3%» — одно и то же число; сравниваем без пробелов. */
const squeeze = (s) => s.replace(/[\s  ]/g, '')
const postSqueezed = squeeze(post)

const figures = [
  { name: 'shansy-kto-sobiraet', width: 1200, height: 1006 },
  { name: 'shansy-kodovaya-baza', width: 1200, height: 728 },
]
const SCALE = 2

test('обе схемы лежат в uploads: вектор + PNG в 2× ширины', () => {
  for (const figure of figures) {
    const svgPath = new URL(`${figure.name}.svg`, uploads)
    const pngPath = new URL(`${figure.name}.png`, uploads)
    assert.ok(existsSync(svgPath), `нет исходника ${figure.name}.svg`)
    assert.ok(existsSync(pngPath), `нет картинки ${figure.name}.png`)

    // Заголовок PNG: ширина/высота в байтах 16..24.
    const header = readFileSync(pngPath).subarray(16, 24)
    assert.equal(header.readUInt32BE(0), figure.width * SCALE, `${figure.name}: ширина PNG`)
    assert.equal(header.readUInt32BE(4), figure.height * SCALE, `${figure.name}: высота PNG`)
    assert.ok(statSync(pngPath).size > 20_000, `${figure.name}: PNG подозрительно пуст`)

    const svg = readFileSync(svgPath, 'utf8')
    assert.match(svg, /<title id="t">.{20,}<\/title>/, `${figure.name}: нет заголовка в SVG`)
    assert.match(svg, /<desc id="d">.{200,}<\/desc>/, `${figure.name}: нет описания в SVG`)
  }
})

test('статья показывает обе схемы с осмысленным alt', () => {
  for (const figure of figures) {
    const embed = new RegExp(`!\\[([^\\]]{40,})\\]\\(/uploads/${figure.name}\\.png\\)`)
    assert.match(post, embed, `в статье нет картинки ${figure.name}.png с описанием`)
  }
})

test('обе схемы стоят в разделе про самостоятельную сборку', () => {
  const heading = '## Что происходит, когда систему собирают самостоятельно'
  const start = post.indexOf(heading)
  assert.ok(start > 0, 'раздел про самостоятельную сборку исчез из статьи')
  const end = post.indexOf('\n## ', start + heading.length)
  const section = post.slice(start, end === -1 ? undefined : end)

  for (const figure of figures) {
    assert.ok(
      section.includes(`/uploads/${figure.name}.png`),
      `${figure.name} уехала из раздела, для которого рисовалась`,
    )
  }
})

test('каждое число со схем есть в тексте статьи', () => {
  for (const figure of figures) {
    const svg = squeeze(readFileSync(new URL(`${figure.name}.svg`, uploads), 'utf8'))
    const percents = [...svg.matchAll(/(\d+(?:,\d+)?)%/g)].map((m) => m[1])
    assert.ok(percents.length >= 4, `${figure.name}: со схемы пропали проценты`)

    for (const value of new Set(percents)) {
      assert.ok(
        postSqueezed.includes(`${value}%`),
        `${figure.name}: ${value}% нарисовано, но такого числа нет в тексте статьи`,
      )
    }
  }
})

test('атрибуция на схемах совпадает с источниками в тексте', () => {
  const attributions = ['r/vibecoding', 'Vercel/Solveo', 'Anthropic', 'Lovable', 'GitClear']
  const svgs = figures
    .map((f) => readFileSync(new URL(`${f.name}.svg`, uploads), 'utf8'))
    .join('\n')

  for (const source of attributions) {
    assert.ok(svgs.includes(source), `на схемах нет ссылки на источник ${source}`)
    assert.ok(post.includes(source), `в статье нет источника ${source}`)
  }

  // Размеры выборок: на схеме и в тексте должны быть одни и те же.
  for (const sample of ['n = 52', '1 645', '170', '211 млн']) {
    assert.ok(squeeze(svgs).includes(squeeze(sample)), `на схемах нет выборки ${sample}`)
    assert.ok(postSqueezed.includes(squeeze(sample)), `в статье нет выборки ${sample}`)
  }
})

test('схемы пересобираются одной командой', () => {
  const pkg = JSON.parse(readFileSync(new URL('package.json', repo), 'utf8'))
  assert.equal(pkg.scripts['blog-figures'], 'node scripts/render-blog-figures.mjs')
  assert.ok(
    existsSync(new URL('scripts/render-blog-figures.mjs', repo)),
    'генератор схем пропал — картинки станет нечем перерисовать',
  )
  // В сборку шаг не входит: блог собирается своим билдом, а resvg живёт
  // в зависимостях корневого проекта.
  assert.ok(
    !pkg.scripts.build.includes('render-blog-figures'),
    'генератор схем не должен висеть в цепочке npm run build',
  )
})
