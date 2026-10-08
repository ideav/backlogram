/**
 * Issue #726: блог не показывает статьи «из будущего».
 *
 * Статья с `pubDate` позже сегодняшнего дня (по Москве) не попадает ни в одну
 * страницу блога, ни в карту сайта, ни в слайдер главной ideav.ru, а в свой
 * день появляется: в блоге — при пересборке, в слайдере — сама.
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, readdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { dayOf, isPublished, moscowDay, publishDay } from '../blog-v2/src/lib/published.mjs'
import { readBlogPosts, SLIDER_LIMIT } from '../scripts/lib/blog-posts.mjs'
import { BLOG_POSTS, visibleBlogPosts } from '../src/data/blogPosts.mjs'

const repo = fileURLToPath(new URL('..', import.meta.url))
const read = (path) => readFileSync(resolve(repo, path), 'utf8')

test('день публикации считается по Москве', () => {
  // 21:30 UTC 19.10 — в Москве уже 00:30 20.10.
  assert.equal(moscowDay(new Date('2026-10-19T21:30:00Z')), '2026-10-20')
  assert.equal(moscowDay(new Date('2026-10-19T20:59:00Z')), '2026-10-19')
})

test('isPublished: черновики и будущие даты скрыты, сегодняшняя видна', () => {
  const today = '2026-10-20'
  assert.equal(isPublished({ pubDate: '2026-10-19' }, today), true)
  assert.equal(isPublished({ pubDate: '2026-10-20' }, today), true)
  assert.equal(isPublished({ pubDate: '2026-10-21' }, today), false)
  assert.equal(isPublished({ pubDate: '2026-10-19', draft: true }, today), false)
  assert.equal(isPublished({ pubDate: '2026-10-19', draft: 'true' }, today), false)
  // Date из astro:content — полночь UTC; день не должен съезжать.
  assert.equal(dayOf(new Date('2026-10-20')), '2026-10-20')
  assert.equal(isPublished({ pubDate: new Date('2026-10-21'), draft: false }, today), false)
})

test('BLOG_TODAY переопределяет день сборки и проверяет формат', () => {
  const saved = process.env.BLOG_TODAY
  try {
    process.env.BLOG_TODAY = '2026-12-31'
    assert.equal(publishDay(), '2026-12-31')
    process.env.BLOG_TODAY = '31.12.2026'
    assert.throws(() => publishDay(), /YYYY-MM-DD/)
  } finally {
    if (saved === undefined) delete process.env.BLOG_TODAY
    else process.env.BLOG_TODAY = saved
  }
})

test('все списки блога фильтруют через isPublished, а не только по draft', () => {
  const files = [
    'blog-v2/src/lib/categories.ts',
    'blog-v2/src/lib/tags.ts',
    'blog-v2/src/pages/index.astro',
    'blog-v2/src/pages/llms.txt.ts',
    'blog-v2/src/pages/rss.xml.ts',
    'blog-v2/src/pages/category/[slug].astro',
    'blog-v2/src/pages/posts/[...slug].astro',
    'blog-v2/src/pages/tag/[slug].astro',
  ]
  for (const file of files) {
    const source = read(file)
    assert.doesNotMatch(source, /=> !data\.draft\)/, `${file}: фильтр только по draft пропустит будущие статьи`)
    assert.match(source, /getCollection\('posts', \(\{ data \}\) => isPublished\(data\)\)/, file)
  }
  // Карта сайта и счётчики тегов (astro.config.mjs) — то же правило.
  assert.match(read('blog-v2/src/lib/posts-meta.mjs'), /\.filter\(\(p\) => isPublished\(p\)\)/)
})

test('слайдер: отложенная статья появляется в свой день без пересборки', () => {
  const day = (offset) => moscowDay(new Date(Date.now() + offset * 86_400_000))
  const upcoming = BLOG_POSTS.filter((p) => p.date > moscowDay())
  for (const post of upcoming) {
    assert.ok(!visibleBlogPosts().some((p) => p.slug === post.slug), `${post.slug} виден раньше срока`)
    assert.ok(visibleBlogPosts(post.date).some((p) => p.slug === post.slug), `${post.slug} не появился в свой день`)
  }
  assert.ok(visibleBlogPosts(day(0)).length <= SLIDER_LIMIT)
  assert.ok(visibleBlogPosts(day(0)).every((p) => p.date <= day(0)))
})

test('сгенерированный слайдер считает день так же, как блог', () => {
  // В src/data/blogPosts.mjs своя копия moscowDay: модуль самодостаточен для
  // SPA и для пререндера, который копирует src/data во временную папку.
  const source = read('src/data/blogPosts.mjs')
  assert.match(source, /timeZone: 'Europe\/Moscow'/)
  assert.doesNotMatch(source, /^import /m)
  for (const iso of ['2026-10-19T20:59:00Z', '2026-10-19T21:00:00Z', '2026-12-31T21:30:00Z']) {
    const day = moscowDay(new Date(iso))
    const visible = visibleBlogPosts(day).map((p) => p.slug)
    const expected = BLOG_POSTS.filter((p) => p.date <= day).slice(0, SLIDER_LIMIT).map((p) => p.slug)
    assert.deepEqual(visible, expected, iso)
  }
})

test('readBlogPosts: limit вышедших статей плюс все отложенные', () => {
  const today = '2026-10-13'
  const posts = readBlogPosts(SLIDER_LIMIT, { today })
  const published = posts.filter((p) => p.date <= today)
  const upcoming = posts.filter((p) => p.date > today)
  assert.equal(published.length, SLIDER_LIMIT)

  const allUpcoming = readdirSync(resolve(repo, 'blog-v2/src/content/posts'))
    .filter((f) => f.endsWith('.md'))
    .map((f) => read(`blog-v2/src/content/posts/${f}`))
    .filter((src) => !/^draft:\s*true/m.test(src))
    .map((src) => src.match(/^pubDate:\s*['"]?(\d{4}-\d{2}-\d{2})/m)[1])
    .filter((date) => date > today)
  assert.equal(upcoming.length, allUpcoming.length)
})
