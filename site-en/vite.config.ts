import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// English site (ideav.pro) — a build of its own, deliberately separate from the
// Russian site in the repo root. Nothing is shared: own entry, own components,
// own output directory. The two sites are not linked and diverge over time
// (issue #524), so there is no i18n layer and no common content.
//
// The root `public/.htaccess` must never reach this build: it carries the front
// controller `RewriteRule ^ index.php` for the application engine behind the
// Russian site, and there is no engine here — it would break plain static
// serving (issue #422).
// `site-en/public/` is a separate public directory, so that cannot happen by
// accident.
export default defineConfig({
  root: __dirname,
  base: '/',

  plugins: [react(), tailwindcss()],

  build: {
    outDir: path.resolve(__dirname, '../dist-en'),
    emptyOutDir: true,
  },

  cacheDir: path.resolve(__dirname, '../.vite/en'),

  resolve: {
    alias: {
      '@en': path.resolve(__dirname, './src'),
    },
  },

  server: {
    host: '0.0.0.0',
    port: 5174,
  },
})
