#!/usr/bin/env node
/**
 * Генерация `src/data/blogPosts.mjs` — свежих статей блога для слайдера на
 * главной (issue #512).
 *
 * Блог (blog.ideav.ru) собирается Astro отдельно от сайта (ideav.ru, React+Vite)
 * и живёт на другом домене, поэтому список статей нужно «запечь» в данные до
 * сборки SPA. Скрипт запускается первым шагом `npm run build` и вручную —
 * `npm run blog-posts` — когда в блог добавили статью.
 *
 * Результат коммитится: он нужен и `vite dev`, и пререндеру главной
 * (`scripts/prerender-landing.mjs`), который читает тот же модуль.
 */
import { writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { BLOG_URL, SLIDER_LIMIT, readBlogPosts } from './lib/blog-posts.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const outPath = resolve(__dirname, '..', 'src/data/blogPosts.mjs')

const posts = readBlogPosts(SLIDER_LIMIT)
if (posts.length === 0) {
  console.error('✗ generate-blog-posts: в blog-v2/src/content/posts не найдено ни одной статьи')
  process.exit(1)
}

/** Значение в одинарных кавычках — как в остальных data-модулях. */
function quote(value) {
  return `'${String(value).replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`
}

const entries = posts
  .map(
    (p) => `  {
    slug: ${quote(p.slug)},
    url: ${quote(p.url)},
    title: ${quote(p.title)},
    description: ${quote(p.description)},
    date: ${quote(p.date)},
    dateLabel: ${quote(p.dateLabel)},
    category: ${quote(p.category)},
    image: ${quote(p.image)},
  },`
  )
  .join('\n')

const file = `// Сгенерировано скриптом scripts/generate-blog-posts.mjs — руками не править.
// Источник: blog-v2/src/content/posts/*.md. Обновить: npm run blog-posts.
//
// Свежие статьи блога для слайдера на главной (issue #512). Блог — отдельная
// Astro-сборка на blog.ideav.ru, поэтому список «запекается» в данные на этапе
// сборки: файл импортируют и React (src/components/BlogSlider.tsx), и Node-скрипт
// пререндера главной (scripts/prerender-landing.mjs). Типы — src/data/blogPosts.d.ts.

export const BLOG_URL = ${quote(BLOG_URL)}

export const BLOG_POSTS = [
${entries}
]
`

writeFileSync(outPath, file)
console.log(`✓ blog posts → src/data/blogPosts.mjs (${posts.length} шт., свежая: ${posts[0].date})`)
