import { defineConfig } from 'astro/config'
import sitemap from '@astrojs/sitemap'
import tailwindcss from '@tailwindcss/vite'
import { remarkBaseUrls } from './src/lib/remark-base-urls.mjs'

// Блог переехал с поддомена в подпапку основного домена: https://ideav.ru/blog/
// (issue #522). Ссылочный вес и бренд теперь на одном домене, поддомен отдаёт
// 301 (blog-subdomain-redirect/.htaccess).
//
// `base` подставляется Astro в собственные ассеты и маршруты; пути, написанные
// руками (href="/", обложки из фронтматтера, картинки в markdown), приклеивают
// базу через src/lib/url.ts и remark-плагин ниже.
const BASE = '/blog'

export default defineConfig({
  site: 'https://ideav.ru',
  base: BASE,
  integrations: [sitemap()],
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
