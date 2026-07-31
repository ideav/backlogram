import { defineConfig, type Plugin } from 'vite'
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
//
// The build target is not fixed to a web root. Two environment variables decide
// where the result is meant to live, so the same source can be deployed to a
// domain root or to any language subfolder:
//
//   SITE_BASE   path under the host          default `/`
//               examples: `/en/`, `/cn/`, `/pt/`
//   SITE_URL    scheme + host, no path       default `https://ideav.pro`
//
//   npm run build:en                                    → https://ideav.pro/
//   SITE_BASE=/en/ npm run build:en                     → https://ideav.pro/en/
//   SITE_BASE=/pt/ SITE_URL=https://example.com npm run build:en
//
// Every absolute path in the output derives from these: asset URLs, the favicon,
// the canonical link, the form endpoint, robots.txt and sitemap.xml.

/** `en`, `/en`, `en/` → `/en/`; empty → `/`. */
function normalizeBase(raw: string | undefined): string {
  const trimmed = (raw ?? '').trim()
  if (trimmed === '' || trimmed === '/') return '/'
  return `/${trimmed.replace(/^\/+/, '').replace(/\/+$/, '')}/`
}

const BASE = normalizeBase(process.env.SITE_BASE)
const ORIGIN = (process.env.SITE_URL ?? 'https://ideav.pro').trim().replace(/\/+$/, '')
const CANONICAL = ORIGIN + BASE

/**
 * Fills the deployment-dependent bits that Vite does not touch: the canonical
 * and OpenGraph URLs in index.html, plus robots.txt and sitemap.xml, which have
 * to spell out absolute URLs.
 */
function deploymentMeta(): Plugin {
  return {
    name: 'en-deployment-meta',
    transformIndexHtml(html) {
      return html.replaceAll('{{CANONICAL}}', CANONICAL)
    },
    generateBundle() {
      // A crawler only reads robots.txt from the host root. When the site sits
      // in a subfolder this file is emitted anyway (harmless, and it is the
      // right file the moment the site moves to the root), but the sitemap has
      // to be announced from the host-root robots.txt — see site-en/README.md.
      this.emitFile({
        type: 'asset',
        fileName: 'robots.txt',
        source: [
          `# robots.txt for ${CANONICAL}`,
          '',
          'User-agent: *',
          'Allow: /',
          '',
          `Sitemap: ${CANONICAL}sitemap.xml`,
          '',
        ].join('\n'),
      })
      this.emitFile({
        type: 'asset',
        fileName: 'sitemap.xml',
        source: [
          '<?xml version="1.0" encoding="UTF-8"?>',
          '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
          '  <url>',
          `    <loc>${CANONICAL}</loc>`,
          '    <changefreq>monthly</changefreq>',
          '    <priority>1.0</priority>',
          '  </url>',
          '</urlset>',
          '',
        ].join('\n'),
      })
    },
  }
}

export default defineConfig({
  root: __dirname,
  base: BASE,

  plugins: [react(), tailwindcss(), deploymentMeta()],

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
