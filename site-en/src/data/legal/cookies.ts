import { LEGAL_CONFIG as C } from './config'
import type { LegalDoc } from './types'

/*
 * The tables below list what the code actually stores. Keep them in sync with:
 *   site-en/src/lib/analytics.ts (integram-consent), site-en/src/lib/utm.ts (integram-utm),
 *   site-en/engine/index.php and include/en_auth.php (setcookie calls),
 *   site-en/engine/js/*.js and templates/*.html (document.cookie / localStorage).
 */
export const COOKIES: LegalDoc = {
  slug: 'cookies',
  title: 'Cookie Policy',
  short: 'Cookie Policy',
  description:
    'Every cookie and browser storage item the Integram website and app use, with purpose, duration and type, and how to change your consent at any time.',
  updated: C.updated,
  blocks: [
    {
      type: 'p',
      text: 'This page lists what Integram stores in your browser. Short version: no advertising or cross-site tracking, analytics only if you say yes, and you can change your mind at any time with the button above or "Cookie settings" in the footer.',
    },
    { type: 'h2', text: '1. Marketing website' },
    {
      type: 'table',
      head: ['Name', 'Kind', 'Purpose', 'Duration', 'Type'],
      rows: [
        ['integram-consent', 'localStorage, first party', 'Remembers whether you accepted or declined analytics, so we do not ask on every page', 'Until you clear site data', 'Strictly necessary'],
        ['integram-utm', 'sessionStorage, first party', 'Keeps the campaign parameters of the link you arrived from, attached to a demo request you send in the same visit', 'Until you close the tab', 'Analytics (only with consent)'],
      ],
    },
    {
      type: 'p',
      text: '**Analytics.** If you accept analytics, the site loads the Plausible Analytics script from plausible.io. Plausible does not set cookies or use browser storage and does not track you across sites; it counts page views and a few events (a sent demo request, a click on "Start free"). We still ask first, because the script is loaded from a third-party server.',
    },
    { type: 'h2', text: '2. Integram app (sign-in, cabinet, workspaces)' },
    {
      type: 'p',
      text: 'When you log in at /start or use your workspaces, the app uses the following. All are first party and needed to provide the service you asked for, so they do not require consent.',
    },
    {
      type: 'table',
      head: ['Name', 'Kind', 'Purpose', 'Duration', 'Type'],
      rows: [
        ['idb_<workspace>', 'Cookie', 'Keeps you signed in to a workspace (authentication token)', 'Until you log out; at most 12 months, or the browser session if you choose', 'Strictly necessary'],
        ['oauth_state', 'Cookie (HttpOnly)', 'Protects GitHub or Google sign-in against cross-site request forgery', '10 minutes', 'Strictly necessary'],
        ['<workspace>_locale', 'Cookie', 'Remembers the interface language', '12 months', 'Functional'],
        ['tzone', 'Cookie', 'Remembers your time zone so dates display correctly', '30 days', 'Functional'],
        ['idbname_<workspace>', 'Cookie', 'Shows the display name you gave a workspace in your cabinet', '12 months', 'Functional'],
        ['TRACE_IT', 'Cookie', 'Diagnostic trace, only if a workspace administrator switches it on', '3 hours', 'Functional'],
        ['cookie_consent', 'localStorage', 'Remembers that you dismissed the cookie notice in the app', 'Until you clear site data', 'Strictly necessary'],
        ['theme, sidebarCollapsed, dashboard view settings', 'localStorage', 'Remembers interface preferences such as dark mode and layout', 'Until you clear site data', 'Functional'],
        ['AI assistant settings', 'localStorage', 'Keeps the AI provider and API key you entered for the in-app assistant on your device only', 'Until you clear them or site data', 'Functional'],
      ],
    },
    {
      type: 'p',
      text: 'If the sign-up form uses bot protection (Cloudflare Turnstile), Cloudflare may process technical signals from your browser to tell people from bots; see our [Sub-processors](/subprocessors) page.',
    },
    { type: 'h2', text: '3. What we do not use' },
    { type: 'p', text: 'No advertising cookies, no social media pixels, no session recording, no fingerprinting, no cross-site tracking.' },
    { type: 'h2', text: '4. Changing your choice' },
    {
      type: 'ul',
      items: [
        'Use **Cookie settings** in the footer of any page, or the button at the top of this page, to accept or decline analytics. If you withdraw consent, analytics is not loaded again from the next page you open.',
        '**Global Privacy Control:** if your browser sends a GPC signal, we treat it as declining analytics. The banner is not shown and analytics never loads.',
        'You can also delete cookies and site data in your browser settings at any time. Deleting the app cookies signs you out.',
      ],
    },
    { type: 'h2', text: '5. Contact' },
    {
      type: 'p',
      text: `Questions about this policy: ${C.privacyEmail}. See also our [Privacy Policy](/privacy).`,
    },
  ],
}
