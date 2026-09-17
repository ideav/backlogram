import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'

const read = (p) => readFileSync(new URL(p, import.meta.url), 'utf8')

const landingSource = read('../site-excel/src/Landing.tsx')
const indexHtml = read('../site-excel/index.html')

/** Тело компонента Lightbox — от его объявления до следующего верхнеуровневого. */
const lightboxSource = landingSource
  .split('function Lightbox(')[1]
  ?.split('\nexport default function Landing')[0]

// ── Скриншоты раскрываются в полный размер ───────────────────────────────────

test('каждая плитка «Что вы увидите через 45 минут» — кнопка, открывающая скрин', () => {
  assert.match(landingSource, /onClick=\{\(\) => setZoomed\(screen\)\}/)
  assert.match(landingSource, /aria-label=\{`Открыть в полный размер: \$\{screen\.caption\}`\}/)
  assert.match(landingSource, /\{zoomed && <Lightbox screen=\{zoomed\} onClose=\{\(\) => setZoomed\(null\)\} \/>\}/)
})

test('в слое картинка показана целиком, а не обрезанной полоской', () => {
  // В плитке скрин обрезан до 160 px (h-40 object-cover object-top) — ради этого
  // всё и затевалось. Если object-cover заедет в слой, раскрытие потеряет смысл.
  assert.ok(lightboxSource, 'компонент Lightbox должен существовать')
  assert.match(lightboxSource, /object-contain/)
  assert.ok(!lightboxSource.includes('object-cover'), 'в слое картинку нельзя обрезать')
  assert.ok(!lightboxSource.includes('loading="lazy"'), 'скрин открывают, чтобы увидеть сразу')
})

test('слой закрывается по Escape, фону и крестику', () => {
  assert.match(lightboxSource, /event\.key === 'Escape'/)
  assert.match(lightboxSource, /aria-label="Закрыть"/)
  // Клик по подложке закрывает, клик по самой картинке — нет.
  assert.match(lightboxSource, /onClick=\{onClose\}/)
  assert.match(lightboxSource, /onClick=\{event => event\.stopPropagation\(\)\}/)
  assert.match(lightboxSource, /aria-modal="true"/)
})

test('просмотр картинки не отправляет целей Метрики', () => {
  // Стратегия «оплата за конверсии» учится на статистике цели. Клик по
  // картинке — не заявка, и в этой статистике ему делать нечего.
  assert.ok(
    !/reachGoal|reachSignupGoal/.test(lightboxSource),
    'из слоя с картинкой цели уходить не должны',
  )
})

// ── Favicon ──────────────────────────────────────────────────────────────────

test('favicon лежит в public/ лендинга и размечен в index.html', () => {
  // index.html ссылался на /favicon.ico с самого начала, но файла в сборке не
  // было — домен отдавал 404 и вкладка оставалась с пустым листом.
  const favicon = readFileSync(new URL('../site-excel/public/favicon.ico', import.meta.url))
  assert.ok(favicon.length > 0, 'favicon.ico пуст')
  // Сигнатура ICO: reserved=0, type=1 (иконка), дальше число картинок.
  assert.deepEqual([...favicon.subarray(0, 4)], [0, 0, 1, 0])
  assert.ok(favicon.readUInt16LE(4) > 0, 'в ICO нет ни одного изображения')
  assert.match(indexHtml, /<link rel="icon" href="\/favicon\.ico" \/>/)
})
