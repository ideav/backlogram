import { CONTACT_EMAIL } from '../../site'

/**
 * Operator details for the legal pages (Terms, Privacy, DPA ...). The operating
 * legal entity is not decided yet, so every value defaults to a clearly marked
 * placeholder in square brackets. The owner fills them ONCE at build time with
 * Vite env variables (shell, site-en/.env.local, or the deploy environment):
 *
 *   VITE_LEGAL_ENTITY_NAME       [Legal entity name]
 *   VITE_LEGAL_ADDRESS           [Registered address]
 *   VITE_LEGAL_COMPANY_NUMBER    [Company number]
 *   VITE_LEGAL_GOVERNING_LAW     [Governing law]          e.g. "the laws of <jurisdiction>"
 *   VITE_LEGAL_VENUE             [Venue]                  courts that hear disputes
 *   VITE_LEGAL_EU_REP            [EU representative]      GDPR Art. 27, if required
 *   VITE_LEGAL_UK_REP            [UK representative]      UK GDPR Art. 27, if required
 *   VITE_LEGAL_PRIVACY_EMAIL     [Contact email for privacy]
 *   VITE_LEGAL_COPYRIGHT_AGENT   [Designated copyright agent]   name + address of the DMCA agent
 *   VITE_LEGAL_HOSTING_PROVIDER  [Hosting provider]
 *   VITE_LEGAL_HOSTING_LOCATION  [Hosting location]
 *   VITE_LEGAL_PAYMENT_PROCESSOR [Payment processor]
 *   VITE_LEGAL_PAYMENT_LOCATION  [Payment processor location]
 *   VITE_LEGAL_EMAIL_DELIVERY    email delivery; default: our own mail server on the hosting above
 *   VITE_LEGAL_ARBITRATION       on | off — US consumer arbitration + class action waiver;
 *                                unset = the clause is shown as a marked placeholder choice
 *   VITE_LEGAL_ARBITRATION_PROVIDER [Arbitration provider]
 *   VITE_LEGAL_TURNSTILE         on — list Cloudflare Turnstile as a sub-processor (set it when
 *                                INTEGRAM_TURNSTILE_SITEKEY is configured on the engine)
 *   VITE_LEGAL_BACKUPS           [Backup frequency and storage location]
 *   VITE_LEGAL_LOG_RETENTION     [Log retention period]   e.g. "30 days"
 *   VITE_LEGAL_UPDATED           "Last updated" date shown on every legal page
 *
 * The page texts never spell a placeholder themselves: they read it from here,
 * so a filled value appears everywhere at once (guarded by tests/en-legal.test.mjs).
 * Never name a country of the operator in the defaults.
 */

const env = import.meta.env as Record<string, string | undefined>

function pick(value: string | undefined, placeholder: string): string {
  const v = (value ?? '').trim()
  return v === '' ? placeholder : v
}

export const LEGAL_CONFIG = {
  entity: pick(env.VITE_LEGAL_ENTITY_NAME, '[Legal entity name]'),
  address: pick(env.VITE_LEGAL_ADDRESS, '[Registered address]'),
  companyNumber: pick(env.VITE_LEGAL_COMPANY_NUMBER, '[Company number]'),
  governingLaw: pick(env.VITE_LEGAL_GOVERNING_LAW, '[Governing law]'),
  venue: pick(env.VITE_LEGAL_VENUE, '[Venue]'),
  euRep: pick(env.VITE_LEGAL_EU_REP, '[EU representative]'),
  ukRep: pick(env.VITE_LEGAL_UK_REP, '[UK representative]'),
  privacyEmail: pick(env.VITE_LEGAL_PRIVACY_EMAIL, '[Contact email for privacy]'),
  copyrightAgent: pick(env.VITE_LEGAL_COPYRIGHT_AGENT, '[Designated copyright agent]'),
  hostingProvider: pick(env.VITE_LEGAL_HOSTING_PROVIDER, '[Hosting provider]'),
  hostingLocation: pick(env.VITE_LEGAL_HOSTING_LOCATION, '[Hosting location]'),
  paymentProcessor: pick(env.VITE_LEGAL_PAYMENT_PROCESSOR, '[Payment processor]'),
  paymentLocation: pick(env.VITE_LEGAL_PAYMENT_LOCATION, '[Payment processor location]'),
  emailDelivery: pick(env.VITE_LEGAL_EMAIL_DELIVERY, 'Our own mail server, run on the hosting infrastructure above'),
  /** 'on' | 'off' | 'placeholder' */
  arbitration: (['on', 'off'].includes((env.VITE_LEGAL_ARBITRATION ?? '').trim().toLowerCase())
    ? (env.VITE_LEGAL_ARBITRATION as string).trim().toLowerCase()
    : 'placeholder') as 'on' | 'off' | 'placeholder',
  arbitrationProvider: pick(env.VITE_LEGAL_ARBITRATION_PROVIDER, '[Arbitration provider]'),
  turnstile: (env.VITE_LEGAL_TURNSTILE ?? '').trim().toLowerCase() === 'on',
  backups: pick(env.VITE_LEGAL_BACKUPS, '[Backup frequency and storage location]'),
  logRetention: pick(env.VITE_LEGAL_LOG_RETENTION, '[Log retention period]'),
  updated: pick(env.VITE_LEGAL_UPDATED, 'October 8, 2026'),
  /** General contact (support, security reports); configured in site.ts. */
  contactEmail: CONTACT_EMAIL,
}

/** "Entity, Address, company number N" — the identification line used across documents. */
export const OPERATOR = `${LEGAL_CONFIG.entity}, ${LEGAL_CONFIG.address}, company number ${LEGAL_CONFIG.companyNumber}`
