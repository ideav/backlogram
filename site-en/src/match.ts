/**
 * Tiny router: maps a site path to a page key and an optional slug. Every
 * marketing route is a prerendered file (dist-en/<route>/index.html), so
 * navigation is plain links and full page loads; the client only needs to know
 * which page to hydrate. Kept free of content imports so it costs nothing in
 * the main bundle.
 */

export type PageKey =
  | 'home'
  | 'pricing'
  | 'excel-to-app'
  | 'ai'
  | 'compare'
  | 'use-cases'
  | 'use-case'
  | 'knowledge-base'
  | 'kb-article'
  | 'contact'
  | 'legal'

export interface Match {
  page: PageKey
  slug?: string
}

const STATIC: Record<string, PageKey> = {
  '/': 'home',
  '/pricing': 'pricing',
  '/excel-to-app': 'excel-to-app',
  '/ai': 'ai',
  '/use-cases': 'use-cases',
  '/knowledge-base': 'knowledge-base',
  '/contact': 'contact',
}

/** `/en/pricing/` with base `/en/` → `/pricing`. */
export function toSitePath(pathname: string, base: string): string {
  let p = pathname
  const b = base.replace(/\/$/, '')
  if (b && (p === b || p.startsWith(b + '/'))) p = p.slice(b.length)
  p = p.replace(/\/index\.html$/, '/').replace(/\/+$/, '')
  return p === '' ? '/' : p
}

export function matchPath(path: string): Match | null {
  if (STATIC[path]) return { page: STATIC[path] }
  let m = /^\/compare\/(airtable|smartsheet|notion)$/.exec(path)
  if (m) return { page: 'compare', slug: m[1] }
  m = /^\/use-cases\/([a-z0-9-]+)$/.exec(path)
  if (m) return { page: 'use-case', slug: m[1] }
  m = /^\/knowledge-base\/([a-z0-9-]+)$/.exec(path)
  if (m) return { page: 'kb-article', slug: m[1] }
  m = /^\/(terms|privacy|cookies|dpa|subprocessors|acceptable-use|copyright|security)$/.exec(path)
  if (m) return { page: 'legal', slug: m[1] }
  return null
}
