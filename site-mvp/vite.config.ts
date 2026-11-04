import { defineConfig } from 'vite'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Сайт mvp.care (студия «Интеграм»), перенесён с Тильды (issue #872).
// Своя сборка, свой вход и свой dist-mvp/; с основным сайтом и site-excel
// кода не делит — по образцу site-excel/. Все адреса абсолютные от корня,
// сайт живёт на корне домена. Пререндер страниц — scripts/prerender-site-mvp.mjs.
export default defineConfig({
  root: __dirname,
  base: '/',
  build: {
    outDir: path.resolve(__dirname, '../dist-mvp'),
    emptyOutDir: true,
  },
  cacheDir: path.resolve(__dirname, '../.vite/mvp'),
  server: {
    host: '0.0.0.0',
    port: 5176,
  },
})
