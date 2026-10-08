/**
 * Deployment-wide constants for the English site. Everything that depends on
 * where the build is deployed (SITE_BASE / SITE_URL, see vite.config.ts) or on
 * build-time configuration is read here once, so pages never hard-code a host.
 */

/** Path under the host, always with leading and trailing slash: `/`, `/en/`. */
export const BASE: string = import.meta.env.BASE_URL || '/'

/** Scheme + host, no trailing slash. Injected by vite.config.ts. */
export const ORIGIN: string = (import.meta.env.VITE_SITE_ORIGIN as string) || 'https://example.com'

/** Host of ORIGIN (`example.com`), for texts that name the site. */
export const HOST: string = ORIGIN.replace(/^[a-z]+:\/\//i, '').replace(/\/.*$/, '')

/** Public contact address: VITE_CONTACT_EMAIL at build time, else hello@<host of SITE_URL>. */
export const CONTACT_EMAIL: string = (import.meta.env.VITE_CONTACT_EMAIL as string) || `hello@${HOST.replace(/:\d+$/, '')}`

export const BRAND = 'Integram'

/**
 * Turns a site path (`/pricing`, `/img/hero.png`, `/start#signup`) into a URL
 * under the deployment base. Paths are written root-relative in the source and
 * re-based here, so the same build works at `/` and under `/en/`.
 */
export function href(path: string): string {
  if (/^(https?:|mailto:|tel:|#)/.test(path)) return path
  return BASE + path.replace(/^\/+/, '')
}

/** Absolute URL for canonical links, OpenGraph and JSON-LD. */
export function absUrl(path: string): string {
  return ORIGIN + href(path)
}

/** The application engine owns these (auth stream); the marketing site only links to them. */
export const LOGIN_PATH = '/start'
export const SIGNUP_PATH = '/start#signup'
