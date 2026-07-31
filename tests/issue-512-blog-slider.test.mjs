/**
 * issue #512 — на главной есть слайдер статей блога с кнопкой «Перейти в блог».
 *
 * Блог собирается отдельно (Astro → ideav.ru/blog), поэтому список статей
 * запекается в src/data/blogPosts.mjs скриптом scripts/generate-blog-posts.mjs.
 * Тест сторожит три вещи: данные совпадают с исходным контентом блога, слайдер
 * действительно подключён к главной, и статичный снапшот (пререндер) показывает
 * те же статьи — иначе краулеры увидят главную без блока блога.
 */
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { execFileSync } from 'node:child_process'
import { cpSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { resolve } from 'node:path'
import { readBlogPosts, SLIDER_LIMIT } from '../scripts/lib/blog-posts.mjs'
import { BLOG_URL, BLOG_POSTS } from '../src/data/blogPosts.mjs'

const repo = new URL('..', import.meta.url).pathname
const read = (path) => readFileSync(resolve(repo, path), 'utf8')

test('src/data/blogPosts.mjs совпадает с контентом блога', () => {
  const expected = readBlogPosts(SLIDER_LIMIT)

  assert.equal(
    BLOG_POSTS.length,
    expected.length,
    'данные устарели — обновите их командой npm run blog-posts',
  )
  assert.deepEqual(
    BLOG_POSTS,
    expected,
    'src/data/blogPosts.mjs разошёлся с blog-v2/src/content/posts — npm run blog-posts',
  )
})

test('в слайдере — свежие статьи с рабочими ссылками на ideav.ru/blog', () => {
  assert.equal(BLOG_URL, 'https://ideav.ru/blog')
  assert.ok(BLOG_POSTS.length >= 3, 'слайдеру нужно хотя бы несколько статей')

  const dates = BLOG_POSTS.map((p) => p.date)
  assert.deepEqual(dates, [...dates].sort().reverse(), 'статьи идут от новой к старой')

  for (const post of BLOG_POSTS) {
    assert.equal(post.url, `${BLOG_URL}/posts/${post.slug}/`)
    assert.ok(post.title, `нет заголовка у ${post.slug}`)
    assert.ok(post.image.startsWith(`${BLOG_URL}/`), `обложка ${post.slug} не абсолютная`)
    assert.match(post.date, /^\d{4}-\d{2}-\d{2}$/)
    assert.ok(post.dateLabel.length > 0, `нет русской даты у ${post.slug}`)
  }

  // Слаги уникальны: дубль означал бы, что одна статья заняла два слота.
  assert.equal(new Set(BLOG_POSTS.map((p) => p.slug)).size, BLOG_POSTS.length)
})

test('слайдер подключён к главной и ведёт в блог по кнопке', () => {
  const home = read('src/pages/Home.tsx')
  assert.match(home, /import BlogSlider from '@\/components\/BlogSlider'/)
  assert.match(home, /<BlogSlider \/>/)

  const slider = read('src/components/BlogSlider.tsx')
  assert.match(slider, /import \{ BLOG_URL, BLOG_POSTS \} from '\.\.\/data\/blogPosts'/)
  assert.match(slider, /Перейти в блог/)
  assert.match(slider, /href=\{`\$\{BLOG_URL\}\/`\}/)
  // Карточки уходят на внешний домен — только новой вкладкой и без noopener-дыры.
  assert.match(slider, /rel="noopener noreferrer"/)
})

test('сборка обновляет данные блога до vite build', () => {
  const pkg = JSON.parse(read('package.json'))
  assert.equal(pkg.scripts['blog-posts'], 'node scripts/generate-blog-posts.mjs')

  const build = pkg.scripts.build
  assert.match(build, /generate-blog-posts\.mjs/)
  assert.ok(
    build.indexOf('generate-blog-posts.mjs') < build.indexOf('vite build'),
    'данные блога должны генерироваться до сборки SPA',
  )
})

test('пререндер главной показывает статьи блога без JS', () => {
  const work = mkdtempSync(resolve(tmpdir(), 'blog-slider-'))
  mkdirSync(resolve(work, 'dist'), { recursive: true })
  mkdirSync(resolve(work, 'scripts'), { recursive: true })
  cpSync(resolve(repo, 'scripts/prerender-landing.mjs'), resolve(work, 'scripts/prerender-landing.mjs'))
  cpSync(resolve(repo, 'src/data'), resolve(work, 'src/data'), { recursive: true })
  writeFileSync(resolve(work, 'dist/index.html'), read('index.html'))

  execFileSync('node', ['scripts/prerender-landing.mjs'], { cwd: work })
  const out = readFileSync(resolve(work, 'dist/index.html'), 'utf8')

  assert.match(out, /Свежее в блоге/)
  assert.match(out, new RegExp(`<a href="${BLOG_URL}/">Перейти в блог</a>`))
  for (const post of BLOG_POSTS) {
    assert.ok(out.includes(post.url), `в снапшоте нет ссылки на ${post.slug}`)
  }
})
