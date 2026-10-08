import { defineConfig, build as viteBuild, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import fs from 'fs'
import path from 'path'
import { fileURLToPath, pathToFileURL } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// English site — a build of its own, deliberately separate from the
// Russian site in the repo root. Nothing is shared: own entry, own components,
// own output directory. The two sites are not linked and diverge over time
// (issue #524), so there is no i18n layer and no common content.
//
// The build target is not fixed to a web root. Two environment variables decide
// where the result is meant to live, so the same source can be deployed to a
// domain root or to any language subfolder:
//
//   SITE_BASE   path under the host          default `/`
//               examples: `/en/`, `/cn/`, `/pt/`
//   SITE_URL    scheme + host, no path       default `https://example.com` (set it for a real deploy;
//               scripts/en-deploy.sh takes it from EN_SITE_URL)
//
//   SITE_URL=https://example.com npm run build:en       → https://example.com/
//   SITE_BASE=/en/ SITE_URL=https://example.com npm run build:en → https://example.com/en/
//   SITE_BASE=/pt/ SITE_URL=https://example.com npm run build:en
//
// Every absolute path in the output derives from these: asset URLs, the favicon,
// canonical links, og:url / og:image, JSON-LD, the form endpoint, robots.txt,
// sitemap.xml and llms.txt.
//
// Other build-time settings (Vite env, see src/lib/analytics.ts, src/site.ts):
//   VITE_PLAUSIBLE_DOMAIN  analytics site id (default: host of SITE_URL; `off` disables)
//   VITE_PLAUSIBLE_SRC     analytics script URL
//   VITE_CONTACT_EMAIL     public contact address (default hello@<host of SITE_URL>)
//   VITE_LEGAL_*           operator details of the legal pages, see src/data/legal/config.ts
//
// SEO decision, keep it: no hreflang and no cross-domain sitemap index. The
// English site is not a translation of any other site and must not declare
// itself an alternate of one (issues #524, #533).

/** `en`, `/en`, `en/` → `/en/`; empty → `/`. */
function normalizeBase(raw: string | undefined): string {
  const trimmed = (raw ?? '').trim()
  if (trimmed === '' || trimmed === '/') return '/'
  return `/${trimmed.replace(/^\/+/, '').replace(/\/+$/, '')}/`
}

const BASE = normalizeBase(process.env.SITE_BASE)
const ORIGIN = (process.env.SITE_URL || 'https://example.com').trim().replace(/\/+$/, '')
const CANONICAL = ORIGIN + BASE
const OUT_DIR = path.resolve(__dirname, '../dist-en')
const SSR_DIR = path.resolve(__dirname, '../.vite/en-ssr')

const alias = { '@en': path.resolve(__dirname, './src') }
const define = { 'import.meta.env.VITE_SITE_ORIGIN': JSON.stringify(ORIGIN) }

interface RouteDef {
  path: string
  priority: number
  changefreq: string
  lastmod?: string
  title: string
  description: string
}

interface ServerEntry {
  routes: RouteDef[]
  head(r: RouteDef): string
  render(r: RouteDef): string
  content: {
    articles: { slug: string; title: string; description: string }[]
    useCases: { slug: string; title: string; description: string }[]
  }
}

/** Site path → absolute URL. `/` → CANONICAL, `/pricing` → CANONICAL + `pricing`. */
const urlOf = (p: string) => CANONICAL + p.replace(/^\/+/, '')

const xmlEsc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

function writeOut(rel: string, text: string) {
  const file = path.join(OUT_DIR, rel)
  fs.mkdirSync(path.dirname(file), { recursive: true })
  fs.writeFileSync(file, text)
}

function robotsTxt(): string {
  // A crawler only reads robots.txt from the host root. When the site sits in
  // a subfolder this file is emitted anyway (harmless, and right the moment the
  // site moves to the root); announce the sitemap from the host-root file then.
  const aiBots = [
    'GPTBot', 'ChatGPT-User', 'OAI-SearchBot', 'ClaudeBot', 'Claude-User', 'Claude-SearchBot', 'anthropic-ai',
    'PerplexityBot', 'Perplexity-User', 'Google-Extended', 'Applebot-Extended', 'CCBot', 'cohere-ai',
    'MistralAI-User', 'DuckAssistBot', 'meta-externalagent',
  ]
  const privatePaths = [`${BASE}my`, `${BASE}order.php`]
  return [
    `# robots.txt for ${CANONICAL}`,
    '',
    'User-agent: *',
    'Allow: /',
    ...privatePaths.map((p) => `Disallow: ${p}`),
    '',
    '# AI assistants and answer engines are welcome to read the marketing site.',
    ...aiBots.map((b) => `User-agent: ${b}`),
    'Allow: /',
    ...privatePaths.map((p) => `Disallow: ${p}`),
    '',
    `Sitemap: ${CANONICAL}sitemap.xml`,
    '',
  ].join('\n')
}

function sitemapXml(routes: RouteDef[]): string {
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...routes.map((r) =>
      [
        '  <url>',
        `    <loc>${xmlEsc(urlOf(r.path))}</loc>`,
        ...(r.lastmod ? [`    <lastmod>${r.lastmod}</lastmod>`] : []),
        `    <changefreq>${r.changefreq}</changefreq>`,
        `    <priority>${r.priority.toFixed(1)}</priority>`,
        '  </url>',
      ].join('\n'),
    ),
    '</urlset>',
    '',
  ].join('\n')
}

function llmsTxt(entry: ServerEntry): string {
  const byPath = new Map(entry.routes.map((r) => [r.path, r]))
  const line = (p: string) => {
    const r = byPath.get(p)
    return r ? `- [${r.title}](${urlOf(p)}): ${r.description}` : ''
  }
  return [
    '# Integram',
    '',
    '> Integram turns spreadsheets into multi-user web apps with linked tables, forms, roles with row-level access, reports, a REST API and an MCP server, so AI agents such as Claude can build and run business apps. Cloud (free plan, flat monthly pricing in USD) or self-hosted via Docker.',
    '',
    'Key facts:',
    '- Upload .xlsx or CSV; tables, data types and links between sheets are detected.',
    '- Access control per table, column and row; audit log of changes.',
    '- REST API and MCP server (npm package `integram-mcp`) included in every plan.',
    '- Pricing: Free $0 (1 user, 3,000 actions/month), Team $29/month (up to 10 users), Business $99/month (unlimited users), Self-hosted on request. An action is one user or API operation.',
    '- Sign up with email, Google or GitHub.',
    '',
    '## Product',
    line('/'),
    line('/excel-to-app'),
    line('/ai'),
    line('/pricing'),
    '',
    '## Comparisons',
    line('/compare/airtable'),
    line('/compare/smartsheet'),
    line('/compare/notion'),
    '',
    '## Use cases',
    ...entry.content.useCases.map((u) => `- [${u.title}](${urlOf(`/use-cases/${u.slug}`)}): ${u.description}`),
    '',
    '## Knowledge base',
    ...entry.content.articles.map((a) => `- [${a.title}](${urlOf(`/knowledge-base/${a.slug}`)}): ${a.description}`),
    '',
    '## Company',
    line('/contact'),
    line('/terms'),
    line('/privacy'),
    line('/cookies'),
    line('/dpa'),
    line('/subprocessors'),
    line('/acceptable-use'),
    line('/copyright'),
    line('/security'),
    '',
  ]
    .filter((l, i, arr) => !(l === '' && arr[i - 1] === ''))
    .join('\n')
}

/** Static fallbacks for URLs of the previous English site. Apache should 301 them (engine stream). */
function legacyRedirect(target: string): string {
  const url = urlOf(target)
  return [
    '<!doctype html>',
    '<html lang="en">',
    '<head>',
    '<meta charset="UTF-8" />',
    '<meta name="robots" content="noindex, follow" />',
    `<link rel="canonical" href="${url}" />`,
    `<meta http-equiv="refresh" content="0; url=${url}" />`,
    '<title>Moved</title>',
    '</head>',
    `<body><p>This page has moved to <a href="${url}">${url}</a>.</p></body>`,
    '</html>',
    '',
  ].join('\n')
}

/**
 * Prerender step (issues #528, #533): after the client build, build
 * src/entry-server.tsx for Node, render every route into
 * dist-en/<route>/index.html with its own head, then generate robots.txt,
 * sitemap.xml and llms.txt from the same route list. The route list includes
 * every knowledge-base article and use case from the content modules.
 */
function prerender(): Plugin {
  let isBuild = false
  return {
    name: 'en-prerender',
    apply: 'build',
    configResolved(config) {
      isBuild = config.command === 'build' && !config.build.ssr
    },
    async closeBundle() {
      if (!isBuild) return
      await viteBuild({
        configFile: false,
        root: __dirname,
        base: BASE,
        logLevel: 'warn',
        publicDir: false,
        plugins: [react()],
        resolve: { alias },
        define,
        build: {
          ssr: path.resolve(__dirname, 'src/entry-server.tsx'),
          outDir: SSR_DIR,
          emptyOutDir: true,
          rollupOptions: { output: { format: 'esm', entryFileNames: 'entry-server.mjs' } },
        },
      })
      const entry: ServerEntry = await import(
        pathToFileURL(path.join(SSR_DIR, 'entry-server.mjs')).href + `?t=${Date.now()}`
      )
      const template = fs.readFileSync(path.join(OUT_DIR, 'index.html'), 'utf8')
      if (!template.includes('<!--app-head-->') || !template.includes('<!--app-html-->')) {
        throw new Error('site-en/index.html must contain <!--app-head--> and <!--app-html--> placeholders')
      }
      for (const r of entry.routes) {
        const html = template
          .replace('<!--app-head-->', () => entry.head(r))
          .replace('<!--app-html-->', () => entry.render(r))
        const rel = r.path === '/' ? 'index.html' : path.join(r.path.replace(/^\//, ''), 'index.html')
        writeOut(rel, html)
      }
      writeOut('robots.txt', robotsTxt())
      writeOut('sitemap.xml', sitemapXml(entry.routes))
      writeOut('llms.txt', llmsTxt(entry))
      writeOut('offer_en.html', legacyRedirect('/terms'))
      writeOut('pp_en.html', legacyRedirect('/privacy'))
      console.log(`en-prerender: ${entry.routes.length} pages, sitemap, robots.txt, llms.txt → ${OUT_DIR}`)
    },
  }
}

/** Dev server: no prerender, so give the shell a plain title. */
function devHead(): Plugin {
  return {
    name: 'en-dev-head',
    apply: 'serve',
    transformIndexHtml(html) {
      return html.replace('<!--app-head-->', '<title>Integram (dev)</title>')
    },
  }
}

export default defineConfig({
  root: __dirname,
  base: BASE,

  plugins: [react(), tailwindcss(), devHead(), prerender()],

  define,

  build: {
    outDir: OUT_DIR,
    emptyOutDir: true,
  },

  cacheDir: path.resolve(__dirname, '../.vite/en'),

  resolve: { alias },

  server: {
    host: '0.0.0.0',
    port: 5174,
  },
})
