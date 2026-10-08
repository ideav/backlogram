/**
 * Public price list in USD. The model and the numbers are fixed in
 * docs/en-positioning.md ("Pricing"); change both together.
 *
 * Billing unit is the "action" (one user or API operation). It is deliberately
 * not called a "token": the AI audience reads "token" as an LLM token.
 */

export interface Plan {
  id: string
  name: string
  price: string
  period: string
  tagline: string
  actions: string
  users: string
  features: string[]
  cta: { label: string; href: string }
  highlight?: boolean
}

export const PLANS: Plan[] = [
  {
    id: 'free',
    name: 'Free',
    price: '$0',
    period: 'forever',
    tagline: 'For trying ideas and personal tools.',
    actions: '3,000 actions / month',
    users: '1 user',
    features: [
      'Excel and CSV import',
      'Unlimited tables and links between them',
      'Forms, reports and dashboards',
      'REST API and MCP access for your AI agents',
      'Community support',
    ],
    cta: { label: 'Start free', href: '/start#signup' },
  },
  {
    id: 'team',
    name: 'Team',
    price: '$29',
    period: 'per month, flat',
    tagline: 'For a small team that has outgrown a shared spreadsheet.',
    actions: '15,000 actions / month',
    users: 'Up to 10 users',
    features: [
      'Everything in Free',
      'Roles with table, column and row-level access',
      'Scheduled reports and email digests',
      'Change history and audit log',
      'Going over the limit never locks you out',
      'Email support, reply within one business day',
    ],
    cta: { label: 'Start free, upgrade later', href: '/start#signup' },
    highlight: true,
  },
  {
    id: 'business',
    name: 'Business',
    price: '$99',
    period: 'per month, flat',
    tagline: 'For companies running daily operations on Integram.',
    actions: '50,000 actions / month',
    users: 'Unlimited users',
    features: [
      'Everything in Team',
      'Extra action packs, each 20% cheaper than the last',
      'SSO, LDAP / Active Directory',
      'Webhooks and scheduled imports',
      'Priority support and an onboarding call',
    ],
    cta: { label: 'Start free, upgrade later', href: '/start#signup' },
  },
  {
    id: 'self-hosted',
    name: 'Self-hosted',
    price: 'Custom',
    period: 'annual license',
    tagline: 'For teams that need the data on their own servers.',
    actions: 'No action metering',
    users: 'Unlimited users',
    features: [
      'Runs as a Docker container in your network',
      'Works without internet access',
      'Bring your own LLM through MCP or the REST API',
      'LDAP / Active Directory, SSO',
      'Support agreement',
    ],
    cta: { label: 'Talk to us', href: '/contact' },
  },
]

/** What an action is, with realistic costs for heavier operations. */
export const ACTION_EXAMPLES: [string, string][] = [
  ['Open a table, save a record, run a simple report', '1 action'],
  ['API or MCP call from your agent', '1 action per operation'],
  ['Recalculate a table with complex formulas', '5–10 actions'],
  ['Export 10,000 rows to Excel', '10–20 actions'],
  ['Import a 50,000-row price list', '30–50 actions'],
]

export const EXTRA_PACK = 'Extra 10,000 actions: $10'

export const DONE_FOR_YOU = {
  title: 'Rather have us build it?',
  text: 'Send us the spreadsheet and describe how your team works. We build the first working version on your real data in two weeks, then hand it over with the admin rights. Fixed price, agreed up front.',
  price: 'Pilot from $1,200',
}
