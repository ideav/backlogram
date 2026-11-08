import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'
import { fileURLToPath } from 'url'
// backlogram#910: гидрация терпит &nbsp; типографики — см. сам модуль.
import { hydrateNbsp } from './scripts/lib/hydrate-nbsp.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// https://vite.dev/config/
export default defineConfig(({ isSsrBuild }) => ({
  base: '/',

  plugins: [
    hydrateNbsp(),
    react(),
    tailwindcss(),
  ],

  // Разбиваем сборку: тяжёлые вендоры — в отдельные кэшируемые чанки, а код
  // страниц уходит в свои чанки через lazy() в router.tsx. Так первый экран
  // не тянет весь код сайта одним ~1 МБ файлом (issue #451).
  build: isSsrBuild ? {
    // backlogram#910: серверная сборка src/entry-server.tsx для render-ssr.mjs.
    outDir: 'dist-ssr',
    copyPublicDir: false,
  } : {
    // Манифест читает scripts/preload-page-chunks.mjs (ideav/crm#5460) и удаляет.
    manifest: true,
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'motion': ['framer-motion'],
        },
      },
    },
  },

  // Кэш и временные файлы Vite хранятся в проекте, а не в node_modules
  // потому что node_modules может быть symlink на readonly папку
  cacheDir: '.vite',
  
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  
  server: {
    host: '0.0.0.0',
    port: 5173,
    hmr: {
      overlay: false,
    },
    // Временные файлы сервера в .vite вместо node_modules/.vite-temp
    fs: {
      cachedChecks: false,
    },
  },
  
  // Оптимизация зависимостей в локальную папку
  optimizeDeps: {
    // Временная папка для оптимизированных зависимостей
    cacheDir: '.vite',
  },
}))
