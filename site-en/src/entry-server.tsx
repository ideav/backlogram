/**
 * Build-time prerender entry. vite.config.ts builds this module for Node
 * (SSR build), then calls render() for every route and writes
 * dist-en/<route>/index.html. Crawlers get full HTML with route-specific
 * meta; the browser hydrates the same tree (main.tsx).
 */
import { renderToString } from 'react-dom/server'
import { App, type PageComponent } from './App'
import type { PageKey } from './match'
import { getRoutes, type RouteDef } from './routes'
import { absUrl, BRAND } from './site'
import { articles } from './content/kb'
import { useCases } from './content/usecases'
import Home from './pages/Home'
import Pricing from './pages/Pricing'
import ExcelToApp from './pages/ExcelToApp'
import Ai from './pages/Ai'
import Compare from './pages/Compare'
import UseCases from './pages/UseCases'
import UseCase from './pages/UseCase'
import KnowledgeBase from './pages/KnowledgeBase'
import KbArticle from './pages/KbArticle'
import Contact from './pages/Contact'
import Legal from './pages/Legal'

const PAGES: Record<PageKey, PageComponent> = {
  home: Home,
  pricing: Pricing,
  'excel-to-app': ExcelToApp,
  ai: Ai,
  compare: Compare,
  'use-cases': UseCases,
  'use-case': UseCase,
  'knowledge-base': KnowledgeBase,
  'kb-article': KbArticle,
  contact: Contact,
  legal: Legal,
}

export const routes: RouteDef[] = getRoutes()

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

/** JSON inside <script> must not be able to close the tag. */
const jsonForScript = (v: unknown) => JSON.stringify(v).replace(/</g, '\\u003c')

export function head(r: RouteDef): string {
  const url = absUrl(r.path)
  const image = absUrl(`/img/og/${r.og}.png`)
  const graph = { '@context': 'https://schema.org', '@graph': r.jsonLd }
  return [
    `<title>${esc(r.title)}</title>`,
    `<meta name="description" content="${esc(r.description)}" />`,
    `<link rel="canonical" href="${esc(url)}" />`,
    `<meta property="og:type" content="${r.ogType}" />`,
    `<meta property="og:site_name" content="${BRAND}" />`,
    `<meta property="og:locale" content="en_US" />`,
    `<meta property="og:url" content="${esc(url)}" />`,
    `<meta property="og:title" content="${esc(r.title)}" />`,
    `<meta property="og:description" content="${esc(r.description)}" />`,
    `<meta property="og:image" content="${esc(image)}" />`,
    `<meta property="og:image:width" content="1200" />`,
    `<meta property="og:image:height" content="630" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${esc(r.title)}" />`,
    `<meta name="twitter:description" content="${esc(r.description)}" />`,
    `<meta name="twitter:image" content="${esc(image)}" />`,
    `<script type="application/ld+json">${jsonForScript(graph)}</script>`,
  ].join('\n    ')
}

export function render(r: RouteDef): string {
  return renderToString(<App path={r.path} Page={PAGES[r.page]} slug={r.slug} />)
}

/** Content summary for llms.txt. */
export const content = {
  articles: articles.map((a) => ({ slug: a.slug, title: a.title, description: a.description })),
  useCases: useCases.map((u) => ({ slug: u.slug, title: u.title, description: u.metaDescription })),
}
