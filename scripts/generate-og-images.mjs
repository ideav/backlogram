#!/usr/bin/env node
/**
 * Generate per-article Open Graph cards for the Knowledge Base.
 *
 * 1200×630 PNGs, dark background, vermilion accent bar, the article's
 * full title in Inter Bold, brand strip at the bottom. Plus one card
 * for the collection page itself.
 *
 * Render path: Satori (React-like JSX → SVG with proper text layout
 * and Cyrillic kerning) → @resvg/resvg-js (SVG → PNG). No browser,
 * no Puppeteer.
 *
 * Output goes to public/og/<slug>.png, which Vite copies as-is into
 * dist/og/<slug>.png. The prerender script reads filenames from there
 * and inserts them as og:image / twitter:image per page.
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { Resvg } from '@resvg/resvg-js'
import satori from 'satori'
import { build } from 'esbuild'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')
const outDir = resolve(root, 'public/og')
mkdirSync(outDir, { recursive: true })

// Inter v4.0 full TTF — single file covers Latin + Cyrillic + symbols.
// Source: https://github.com/rsms/inter/releases (extras/ttf).
const fontRegular = readFileSync(resolve(__dirname, 'fonts/Inter-Regular.ttf'))
const fontBold = readFileSync(resolve(__dirname, 'fonts/Inter-Bold.ttf'))

// ── Load article data ─────────────────────────────────────────────────────
const bundle = await build({
  entryPoints: [resolve(root, 'src/data/knowledgeBase.ts')],
  bundle: true,
  format: 'esm',
  platform: 'neutral',
  target: 'es2020',
  write: false,
  logLevel: 'error',
})
const dataUrl =
  'data:text/javascript;base64,' +
  Buffer.from(bundle.outputFiles[0].text).toString('base64')
const { knowledgeBaseArticles } = await import(dataUrl)

// ── Card template ─────────────────────────────────────────────────────────
function cardJSX({ eyebrow, title, subtitle }) {
  return {
    type: 'div',
    props: {
      style: {
        width: 1200,
        height: 630,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        backgroundColor: '#0F172A',
        backgroundImage:
          'radial-gradient(circle at 92% 8%, rgba(59,130,246,0.18) 0%, transparent 45%), radial-gradient(circle at 5% 95%, rgba(200,57,43,0.18) 0%, transparent 50%)',
        padding: 64,
        fontFamily: 'Inter',
        color: '#F1F5F9',
        position: 'relative',
      },
      children: [
        // Top: brand row + accent bar
        {
          type: 'div',
          props: {
            style: { display: 'flex', flexDirection: 'column', gap: 24 },
            children: [
              {
                type: 'div',
                props: {
                  style: {
                    display: 'flex',
                    alignItems: 'center',
                    gap: 16,
                  },
                  children: [
                    {
                      type: 'div',
                      props: {
                        style: {
                          width: 56,
                          height: 56,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          backgroundColor: '#C8392B',
                          borderRadius: 10,
                          color: '#F8FAFC',
                          fontSize: 32,
                          fontWeight: 700,
                          letterSpacing: -1,
                        },
                        children: 'И',
                      },
                    },
                    {
                      type: 'div',
                      props: {
                        style: {
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 2,
                        },
                        children: [
                          {
                            type: 'div',
                            props: {
                              style: { fontSize: 24, fontWeight: 700, color: '#F1F5F9' },
                              children: 'Интеграм',
                            },
                          },
                          {
                            type: 'div',
                            props: {
                              style: {
                                fontSize: 14,
                                color: '#94A3B8',
                                letterSpacing: 2,
                                textTransform: 'uppercase',
                              },
                              children: eyebrow,
                            },
                          },
                        ],
                      },
                    },
                  ],
                },
              },
              {
                type: 'div',
                props: {
                  style: {
                    height: 4,
                    width: 80,
                    backgroundColor: '#C8392B',
                    borderRadius: 2,
                    marginTop: 8,
                  },
                  children: '',
                },
              },
            ],
          },
        },
        // Middle: the title
        {
          type: 'div',
          props: {
            style: {
              fontSize: title.length > 80 ? 42 : title.length > 50 ? 52 : 64,
              fontWeight: 700,
              lineHeight: 1.12,
              letterSpacing: -1,
              color: '#F8FAFC',
              maxWidth: 1072,
              display: 'flex',
            },
            children: title,
          },
        },
        // Bottom: subtitle + URL
        {
          type: 'div',
          props: {
            style: {
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-end',
              gap: 32,
            },
            children: [
              subtitle
                ? {
                    type: 'div',
                    props: {
                      style: {
                        fontSize: 22,
                        lineHeight: 1.35,
                        color: '#94A3B8',
                        maxWidth: 720,
                        display: 'flex',
                      },
                      children: subtitle,
                    },
                  }
                : { type: 'div', props: { children: '' } },
              {
                type: 'div',
                props: {
                  style: {
                    fontSize: 18,
                    color: '#64748B',
                    letterSpacing: 1,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                  },
                  children: 'ideav.ru',
                },
              },
            ],
          },
        },
      ],
    },
  }
}

async function render(card, outPath) {
  const svg = await satori(card, {
    width: 1200,
    height: 630,
    fonts: [
      { name: 'Inter', data: fontRegular, weight: 400, style: 'normal' },
      { name: 'Inter', data: fontBold, weight: 700, style: 'normal' },
    ],
  })
  const png = new Resvg(svg, { fitTo: { mode: 'width', value: 1200 } }).render().asPng()
  writeFileSync(outPath, png)
}

// ── Generate ──────────────────────────────────────────────────────────────
// 1. Collection cover
await render(
  cardJSX({
    eyebrow: 'База знаний',
    title: `Интеграм против Excel, Airtable, Notion и заказной разработки`,
    subtitle: `${knowledgeBaseArticles.length} разборов сценариев, в которых Интеграм заменяет привычные инструменты учёта.`,
  }),
  resolve(outDir, 'knowledge-base.png')
)
console.log(`✓ public/og/knowledge-base.png`)

// 2. Per-article cards — sequentially, to keep memory predictable
for (const article of knowledgeBaseArticles) {
  const eyebrow = article.compare
    ? `Сравнение с ${article.compare}`
    : 'База знаний'
  const raw = (article.metaDescription || article.summary || '').replace(/\s+/g, ' ').trim()
  const subtitle = raw.length > 170 ? raw.slice(0, 167).replace(/\s+\S*$/, '') + '…' : raw
  await render(
    cardJSX({
      eyebrow,
      title: article.shortTitle || article.title,
      subtitle: subtitle.length > 0 ? subtitle : undefined,
    }),
    resolve(outDir, `${article.slug}.png`)
  )
  console.log(`✓ public/og/${article.slug}.png`)
}

// 3. Homepage social banner — distinct from the knowledge-base cover so the
//    landing page no longer borrows the KB image as its og:image.
await render(
  cardJSX({
    eyebrow: 'Интеграм · no-code конструктор',
    title: 'Из Excel — рабочее приложение за час',
    subtitle:
      'Пришлите таблицу — получите веб-приложение с формами, правами доступа и отчётами. Без программистов, 1С и долгого внедрения.',
  }),
  resolve(outDir, 'home.png')
)
console.log(`✓ public/og/home.png`)

// 4. Organization logo referenced from JSON-LD (Organization.logo). The file
//    was missing, so structured data pointed at a 404; generate it here.
const logosDir = resolve(root, 'public/logos')
mkdirSync(logosDir, { recursive: true })
await render(
  cardJSX({
    eyebrow: 'reestr.digital.gov.ru',
    title: 'Интеграм',
    subtitle: 'Российский no-code конструктор приложений и баз данных.',
  }),
  resolve(logosDir, 'integram-og.png')
)
console.log(`✓ public/logos/integram-og.png`)

console.log(`\nDone: ${knowledgeBaseArticles.length + 3} OG cards generated`)
