/**
 * Analytics for the English site: Plausible, loaded only after the visitor
 * opts in through the cookie banner (issues #531, #534). Nothing is requested
 * from any analytics host before consent, and nothing at all when the visitor
 * declines.
 *
 * Build-time configuration (Vite env, e.g. in site-en/.env.local or the shell):
 *   VITE_PLAUSIBLE_DOMAIN  site id in Plausible       default `ideav.pro`; set to `off` to disable
 *   VITE_PLAUSIBLE_SRC     script URL                 default Plausible cloud, tagged-events build
 *
 * Goal: `lead` — fired on a successful contact-form submit and on clicks that
 * lead to sign-up (`/start#signup`). Create a custom-event goal named `lead`
 * in the Plausible dashboard.
 */

const DOMAIN = ((import.meta.env.VITE_PLAUSIBLE_DOMAIN as string) || 'ideav.pro').trim()
const SRC = ((import.meta.env.VITE_PLAUSIBLE_SRC as string) || 'https://plausible.io/js/script.tagged-events.js').trim()

export const ANALYTICS_ENABLED = DOMAIN !== '' && DOMAIN !== 'off'

const CONSENT_KEY = 'integram-consent'
export type Consent = 'granted' | 'denied'

type PlausibleFn = ((event: string, options?: { props?: Record<string, string> }) => void) & { q?: unknown[] }

declare global {
  interface Window {
    plausible?: PlausibleFn
  }
}

export function readConsent(): Consent | null {
  try {
    const v = window.localStorage.getItem(CONSENT_KEY)
    return v === 'granted' || v === 'denied' ? v : null
  } catch {
    return null
  }
}

export function writeConsent(value: Consent): void {
  try {
    window.localStorage.setItem(CONSENT_KEY, value)
  } catch {
    /* storage blocked: the choice holds for this page view only */
  }
  if (value === 'granted') loadAnalytics()
  window.dispatchEvent(new CustomEvent('integram-consent', { detail: value }))
}

let loaded = false

/** Injects the Plausible script. Called only after consent has been granted. */
export function loadAnalytics(): void {
  if (loaded || !ANALYTICS_ENABLED || typeof document === 'undefined') return
  if (readConsent() !== 'granted') return
  loaded = true
  // Standard Plausible queue stub, so events fired before the script arrives are kept.
  window.plausible =
    window.plausible ||
    (function (...args: unknown[]) {
      ;(window.plausible!.q = window.plausible!.q || []).push(args)
    } as PlausibleFn)
  const s = document.createElement('script')
  s.defer = true
  s.src = SRC
  s.setAttribute('data-domain', DOMAIN)
  document.head.appendChild(s)
}

/** Sends a custom event if (and only if) analytics is loaded with consent. */
export function track(event: string, props?: Record<string, string>): void {
  if (!loaded || readConsent() !== 'granted' || typeof window.plausible !== 'function') return
  window.plausible(event, props ? { props } : undefined)
}

export function trackLead(source: string): void {
  track('lead', { source })
}

/**
 * One delegated listener for the whole page: any click on a link to the
 * sign-up screen counts as a lead. Keeps the goal working for links added by
 * content modules without touching each component.
 */
export function installLeadClickTracking(): void {
  document.addEventListener('click', (e) => {
    const a = (e.target as HTMLElement | null)?.closest?.('a')
    if (!a) return
    const h = a.getAttribute('href') || ''
    if (/\/start#signup$/.test(h)) trackLead('signup-click')
  })
}
