import { defineConfig } from 'astro/config'
import sitemap from '@astrojs/sitemap'
import tailwindcss from '@tailwindcss/vite'
import { remarkBaseUrls } from './src/lib/remark-base-urls.mjs'
import { isThinTag } from './src/lib/tag-slug.mjs'
import { readPosts, tagCounts } from './src/lib/posts-meta.mjs'

// Блог переехал с поддомена в подпапку основного домена: https://ideav.ru/blog/
// (issue #522). Ссылочный вес и бренд теперь на одном домене, поддомен отдаёт
// 301 (blog-subdomain-redirect/.htaccess).
//
// `base` подставляется Astro в собственные ассеты и маршруты; пути, написанные
// руками (href="/", обложки из фронтматтера, картинки в markdown), приклеивают
// базу через src/lib/url.ts и remark-плагин ниже.
const BASE = '/blog'

// Гигиена карты сайта (SEO-аудит 02.10.2026, issue #627, п. 6). До правки карта
// отдавала все страницы без разбора и без <lastmod>: вместе со статьями в неё
// попадали служебная страница поиска и страницы тегов с одной статьёй, то есть
// почти дубли. Даты правок берутся из фронтматтера напрямую — коллекции
// astro:content в конфиге ещё нет (см. src/lib/posts-meta.mjs).
const POSTS = readPosts()
const TAG_COUNTS = tagCounts(POSTS)
const LASTMOD = new Map(POSTS.map((p) => [`${BASE}/posts/${p.slug}/`, p.lastmod]))

/** Самая свежая дата по блогу — lastmod для списков и главной. */
const NEWEST = POSTS.map((p) => p.lastmod).filter(Boolean).sort().at(-1) ?? null

function pathOf(url) {
  return new URL(url).pathname
}

export default defineConfig({
  site: 'https://ideav.ru',
  base: BASE,
  integrations: [
    sitemap({
      filter: (url) => {
        const path = pathOf(url)
        // Служебный поиск: содержимого нет, результаты рисует pagefind.
        if (path.startsWith(`${BASE}/search`)) return false
        // Тонкие теги: страница тега с одной-двумя статьями — дубль статьи,
        // и она же отдаёт noindex (src/pages/tag/[slug].astro).
        const tag = /^\/blog\/tag\/([^/]+)\/?$/.exec(path)
        if (tag) return !isThinTag(TAG_COUNTS.get(tag[1]) ?? 0)
        return true
      },
      serialize: (item) => {
        const path = pathOf(item.url)
        const lastmod = LASTMOD.get(path) ?? LASTMOD.get(`${path}/`) ?? NEWEST
        return lastmod ? { ...item, lastmod } : item
      },
    }),
  ],
  markdown: {
    remarkPlugins: [[remarkBaseUrls, { base: BASE }]],
  },
  vite: {
    plugins: [tailwindcss()],
  },
  build: {
    format: 'directory',
  },
})
