import { defineConfig } from 'vite'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Сайт finmo.integram.io (конструктор финансовых моделей), перенесён с Тильды
// (issue #873). Своя сборка, свой вход и свой dist-finmo/; с основным сайтом
// кода не делит — по образцу site-finmo/. Все адреса абсолютные от корня,
// сайт живёт на корне домена. Пререндер страниц — scripts/prerender-site-finmo.mjs.
export default defineConfig({
  root: __dirname,
  base: '/',
  build: {
    outDir: path.resolve(__dirname, '../dist-finmo'),
    emptyOutDir: true,
  },
  cacheDir: path.resolve(__dirname, '../.vite/finmo'),
  server: {
    host: '0.0.0.0',
    port: 5177,
  },
})
