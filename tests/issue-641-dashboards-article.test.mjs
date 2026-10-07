import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, existsSync } from 'node:fs'

// Issue #641: статья про дашборды переписана по черновику, скриншоты сняты
// с демо-базы /spz/, CTA статьи тематический, даты блога не съезжают на день.
const ROOT = new URL('../blog-v2/', import.meta.url)
const read = (p) => readFileSync(new URL(p, ROOT), 'utf8')
const post = read('src/content/posts/dashbordy-integram-prodazhi-personal-byudzhet.md')

test('статья не называет клиента', () => {
  assert.doesNotMatch(post, /спортзан|sportzan|\/spz\//i)
})

test('все картинки статьи лежат в public/uploads, включая обложку и OG', () => {
  const images = [...post.matchAll(/\]\((\/uploads\/[^)]+)\)/g)].map((m) => m[1])
  images.push(post.match(/^image: (\S+)$/m)[1])
  assert.ok(images.length >= 5)
  for (const img of images) assert.ok(existsSync(new URL(`public${img}`, ROOT)), img)
  assert.ok(existsSync(new URL('public/uploads/og/dashboard-finance.jpg', ROOT)))
})

test('в тексте не осталось заметок черновика и заглушек', () => {
  assert.doesNotMatch(post, /Заметки по правке|\[Скриншот:|\[Нужен ваш ответ|\[Вставьте/)
  assert.doesNotMatch(post, /дэшборд/i)
})

test('CTA статьи ведёт на разбор данных, а не на «Excel → приложение»', () => {
  assert.match(post, /^cta:\n {2}eyebrow: /m)
  assert.match(post, /href: "https:\/\/t\.me\/Integrammbot"/)
  const tpl = read('src/pages/posts/[...slug].astro')
  assert.match(tpl, /post\.data\.cta \?\?/)
  assert.match(read('src/content.config.ts'), /cta: z\s*\.object/)
})

test('даты блога форматируются в UTC', () => {
  for (const p of ['src/pages/posts/[...slug].astro', 'src/pages/index.astro', 'src/pages/category/[slug].astro', 'src/pages/tag/[slug].astro']) {
    assert.match(read(p), /toLocaleDateString\('ru-RU', \{[^}]*timeZone: 'UTC' \}\)/, p)
  }
})
