import { LEGAL_CONFIG as C } from './config'
import type { LegalDoc } from './types'

const rows: string[][] = [
  [C.hostingProvider, 'Hosting of the website, the app, databases, uploaded files and backups', 'All workspace content, account data, logs', C.hostingLocation],
  ['Email delivery', `${C.emailDelivery}. Sends sign-up confirmations, password resets, service notices and demo-request notifications`, 'Email address, name, message content', C.hostingLocation],
  [C.paymentProcessor, 'Payment processing for paid plans', 'Billing name and address, payment details, plan', C.paymentLocation],
  ['Plausible Insights OÜ (Plausible Analytics)', 'Cookieless website analytics, only after the visitor consents. Not used inside workspaces', 'Aggregate page views, referrer, country, device type (no cookies, no stored IP addresses)', 'European Union'],
]
if (C.turnstile) {
  rows.push(['Cloudflare, Inc. (Turnstile)', 'Bot protection on the sign-up and password reset forms', 'IP address and browser signals during the check', 'Global network'])
}

export const SUBPROCESSORS: LegalDoc = {
  slug: 'subprocessors',
  title: 'Sub-processors',
  description:
    'The third parties that process personal data for Integram, what they do, what data they receive and where, and how we notify changes.',
  updated: C.updated,
  blocks: [
    {
      type: 'p',
      text: 'Integram uses the following third parties ("sub-processors") to provide the service. Each is bound by data protection terms at least as protective as our [Data Processing Addendum](/dpa).',
    },
    {
      type: 'table',
      head: ['Sub-processor', 'Purpose', 'Data', 'Location'],
      rows,
    },
    { type: 'h2', text: 'Identity providers you choose' },
    {
      type: 'p',
      text: 'If you choose to sign up or log in with **GitHub** (GitHub, Inc.) or **Google** (Google LLC), that provider confirms your identity and shares your account ID, email and name with us. They act as independent controllers under their own privacy policies, not as our sub-processors, and receive no workspace content from us.',
    },
    { type: 'h2', text: 'Services you connect yourself' },
    {
      type: 'p',
      text: 'AI model providers, MCP clients, and other tools that you or your users connect through the API, the MCP server or the in-app AI assistant receive the data you send them under your own agreement with them. They are not our sub-processors.',
    },
    { type: 'h2', text: 'Changes to this list' },
    {
      type: 'p',
      text: `We give at least 30 days’ notice before adding or replacing a sub-processor, by updating this page and emailing account owners. Customers may object as described in section 5 of the DPA. Questions: ${C.privacyEmail}.`,
    },
  ],
}
