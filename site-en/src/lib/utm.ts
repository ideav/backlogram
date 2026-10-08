/**
 * Campaign attribution. UTM parameters from the landing URL are kept in
 * sessionStorage (first touch within the session wins) so a visitor who lands
 * on /excel-to-app?utm_source=... and submits the form from /contact still
 * carries the campaign into the lead payload. No cookies are set.
 */

const KEY = 'integram-utm'
const PARAMS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'gclid', 'fbclid', 'msclkid']

export type Attribution = Record<string, string>

export function captureUtm(): void {
  try {
    const q = new URLSearchParams(window.location.search)
    const found: Attribution = {}
    for (const p of PARAMS) {
      const v = q.get(p)
      if (v) found[p] = v.slice(0, 200)
    }
    if (Object.keys(found).length === 0) return
    if (window.sessionStorage.getItem(KEY)) return
    found.landing_page = window.location.pathname
    if (document.referrer) found.referrer = document.referrer.slice(0, 300)
    window.sessionStorage.setItem(KEY, JSON.stringify(found))
  } catch {
    /* storage unavailable: attribution is simply not recorded */
  }
}

export function readUtm(): Attribution {
  try {
    const raw = window.sessionStorage.getItem(KEY)
    const parsed = raw ? JSON.parse(raw) : {}
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}
