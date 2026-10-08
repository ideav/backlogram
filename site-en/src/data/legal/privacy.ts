import { HOST } from '../../site'
import { LEGAL_CONFIG as C, OPERATOR } from './config'
import type { LegalDoc } from './types'

export const PRIVACY: LegalDoc = {
  slug: 'privacy',
  title: 'Privacy Policy',
  short: 'Privacy Policy',
  description:
    'What personal data Integram collects, why, on which legal basis, who receives it, how long we keep it, and your rights under GDPR, UK GDPR and US state privacy laws.',
  updated: C.updated,
  blocks: [
    {
      type: 'callout',
      text: `This policy explains how ${OPERATOR} ("Integram", "we", "us") handles personal data when you visit ${HOST}, contact us, create an account or use the Integram service. Privacy questions and requests: ${C.privacyEmail}.`,
    },
    { type: 'h2', text: '1. Our role: controller and processor' },
    {
      type: 'ul',
      items: [
        '**Controller.** We decide how and why we process data about website visitors, people who contact us, and account holders (account, billing, support and marketing data). This policy covers that processing.',
        '**Processor.** Data that customers put into their own workspaces ("workspace content", for example a CRM or an inventory list) is processed by us only on the customer’s instructions, under our [Data Processing Addendum](/dpa). The customer is the controller for it and its own privacy notice applies. If your data is in someone else’s workspace, please contact that organization first; we will help them answer your request.',
      ],
    },
    { type: 'h2', text: '2. What we collect, from where, and why' },
    {
      type: 'table',
      head: ['Category', 'Source', 'Purpose', 'Lawful basis (GDPR / UK GDPR)'],
      rows: [
        ['Account data: email, name, password hash, workspace names, interface language and time zone', 'You, at sign-up and in settings', 'Create and run your account, authenticate you, send service emails (confirmation, password reset, important notices)', 'Contract (Art. 6(1)(b))'],
        ['Sign-in identity: GitHub or Google account ID, email and name', 'GitHub or Google, only if you choose to sign in with them', 'Sign you in without a password', 'Contract (Art. 6(1)(b))'],
        ['Billing data: plan, invoices, billing name and address, tax ID, last digits of card', 'You and our payment processor', 'Charge subscriptions, keep accounting records, prevent fraud', 'Contract (Art. 6(1)(b)); legal obligation (Art. 6(1)(c))'],
        ['Contact and demo requests: name, email, company, message, page and campaign parameters (utm_*), if analytics consent was given', 'You, via the "Book a demo" form or email', 'Reply to you, arrange a demo, understand which channels bring requests', 'Steps at your request (Art. 6(1)(b)); legitimate interests (Art. 6(1)(f))'],
        ['Support communications', 'You', 'Answer questions and fix problems', 'Contract (Art. 6(1)(b)); legitimate interests (Art. 6(1)(f))'],
        ['Usage and security data: IP address, browser user agent, requested URLs, timestamps, sign-in events, error logs', 'Your device, automatically', 'Keep the service secure, prevent abuse, investigate errors, measure usage against plan limits', 'Legitimate interests (Art. 6(1)(f)); contract for plan limits (Art. 6(1)(b))'],
        ['Website analytics: aggregate page views, referrer, country, device type, sign-up and demo-request events', 'Plausible Analytics, only after you click "Accept analytics"', 'Understand which pages help visitors', 'Consent (Art. 6(1)(a))'],
        ['Product emails about new features or offers', 'Your account email', 'Tell customers about relevant updates; you can unsubscribe at any time', 'Legitimate interests (Art. 6(1)(f)) or consent where the law requires it'],
        ['Workspace content', 'Customers and their users', 'Provide the service to the customer', 'Processed on the customer’s instructions (we are processor)'],
      ],
    },
    {
      type: 'p',
      text: 'Where we rely on legitimate interests, our interests are running a secure, reliable service, answering enquiries and improving our website; you can object at any time (see section 8). You do not have to give us personal data, but without account data we cannot provide an account.',
    },
    { type: 'h2', text: '3. Recipients and sub-processors' },
    {
      type: 'p',
      text: 'We share personal data only with service providers that help us run Integram (hosting, email delivery, payments, analytics with consent), with the sign-in provider you choose, with professional advisers under confidentiality, and with authorities where the law requires it. A current list is on our [Sub-processors](/subprocessors) page. If Integram is involved in a merger or sale, data may transfer to the successor, which will remain bound by this policy.',
    },
    {
      type: 'p',
      text: '**We do not sell personal data, and we do not share it for cross-context behavioral advertising.** We do not use advertising cookies or pixels.',
    },
    { type: 'h2', text: '4. International transfers' },
    {
      type: 'p',
      text: `Our service is hosted by ${C.hostingProvider} in ${C.hostingLocation}. Where personal data from the European Economic Area, the United Kingdom or Switzerland is transferred to a country without an adequacy decision, we use the European Commission’s Standard Contractual Clauses, the UK International Data Transfer Agreement or Addendum, or another lawful transfer mechanism, together with additional safeguards where needed. You can ask us for a copy of the relevant safeguards.`,
    },
    { type: 'h2', text: '5. How long we keep data' },
    {
      type: 'table',
      head: ['Data', 'Retention'],
      rows: [
        ['Account data', 'While the account exists, then 30 days to allow export, then deleted'],
        ['Workspace content', 'While the workspace exists; deleted 30 days after closure; removed from backups as they rotate'],
        ['Billing and invoices', 'As long as tax and accounting laws require (typically up to 10 years)'],
        ['Contact and demo requests', '24 months after our last exchange, unless you become a customer'],
        ['Server and security logs', `${C.logRetention}, longer only while investigating a specific incident`],
        ['Analytics', 'Aggregate statistics only; Plausible does not store IP addresses or identifiers'],
        ['Consent choice (in your browser)', 'Until you clear your browser storage or change it'],
      ],
    },
    { type: 'h2', text: '6. Security' },
    {
      type: 'p',
      text: 'We protect data with HTTPS and HSTS, one-way salted password hashing, separate databases for each workspace, role-based access inside workspaces, restricted administrative access and backups. No system is perfectly secure; if a breach affects your personal data we will notify you and the authorities as the law requires. More on our [Security](/security) page.',
    },
    { type: 'h2', text: '7. Cookies and similar technologies' },
    {
      type: 'p',
      text: 'We use only the browser storage needed to run the site and the app, plus analytics if you consent. We honor the Global Privacy Control signal. Details in our [Cookie Policy](/cookies).',
    },
    { type: 'h2', text: '8. Your rights in the EU, EEA and UK' },
    {
      type: 'p',
      text: 'Under the GDPR and UK GDPR you have the right to:',
    },
    {
      type: 'ul',
      items: [
        '**access** your personal data and receive a copy;',
        '**rectification** of inaccurate or incomplete data;',
        '**erasure** of your data, where there is no reason for us to keep it;',
        '**restriction** of processing in certain cases;',
        '**portability**: receive data you gave us in a structured, machine-readable format, or have it sent to another provider;',
        '**object** to processing based on legitimate interests, and at any time to direct marketing;',
        '**withdraw consent** at any time, without affecting processing before the withdrawal;',
        '**complain** to a data protection supervisory authority, in particular in the country where you live or work or where an infringement occurred.',
      ],
    },
    {
      type: 'p',
      text: `To exercise these rights, email ${C.privacyEmail} or use the settings in your account. We may need to verify your identity. We answer within one month; if a request is complex we may extend this by up to two further months and will tell you why.`,
    },
    { type: 'h2', text: '9. Your rights in US states (including California)' },
    {
      type: 'p',
      text: 'This section applies to residents of California (CCPA as amended by the CPRA) and other US states with comprehensive privacy laws, such as Colorado, Connecticut, Virginia, Utah, Texas and Oregon, to the extent those laws apply to us.',
    },
    {
      type: 'table',
      head: ['Category of personal information (CCPA)', 'Collected in the last 12 months', 'Examples', 'Disclosed for a business purpose to'],
      rows: [
        ['Identifiers', 'Yes', 'Name, email, IP address, account ID', 'Hosting, email delivery, payment processor, sign-in provider you choose'],
        ['Customer records (Cal. Civ. Code 1798.80)', 'Yes', 'Billing name and address', 'Payment processor, hosting'],
        ['Commercial information', 'Yes', 'Plan, purchase history', 'Payment processor, hosting'],
        ['Internet or network activity', 'Yes', 'Pages visited, sign-in events, logs', 'Hosting; analytics provider (aggregate, with consent)'],
        ['Geolocation data', 'Approximate only', 'Country derived from IP address', 'Analytics provider (with consent)'],
        ['Professional information', 'Yes, if provided', 'Company name, job title in a demo request', 'Hosting, email delivery'],
        ['Sensitive personal information', 'Account password only', 'Password (stored as a hash)', 'Not disclosed; used only to authenticate you'],
        ['Biometric, health, precise geolocation, protected characteristics', 'No', '-', '-'],
      ],
    },
    {
      type: 'ul',
      items: [
        '**No sale or sharing.** We do not sell personal information and do not share it for cross-context behavioral advertising, and have not done so in the last 12 months. We have no actual knowledge of selling or sharing personal information of consumers under 16.',
        '**Sensitive personal information** is used only to provide the service and is not used to infer characteristics about you, so the right to limit its use does not need to be exercised.',
        '**Your rights:** to know what personal information we collect, use and disclose; to access a copy; to delete it; to correct inaccurate information; and to opt out of sale, sharing and targeted advertising (which we do not do).',
        '**Global Privacy Control.** If your browser sends a GPC signal, we treat it as a valid opt-out request: analytics is not loaded and no opt-out link needs to be clicked.',
        `**How to submit a request:** email ${C.privacyEmail}. We will verify your request by matching information you provide with our records, usually by confirming control of your account email, and respond within 45 days (extendable once by 45 days with notice).`,
        '**Authorized agents** may submit requests for you with your signed permission; we may still ask you to verify your identity directly.',
        '**Appeals:** if we decline a request, you can appeal by replying to our decision. If the appeal is denied, you may contact your state attorney general.',
        '**Non-discrimination:** we will not deny service, charge different prices or provide a different quality of service because you exercised your rights.',
      ],
    },
    { type: 'h2', text: '10. Children' },
    {
      type: 'p',
      text: 'Integram is a business tool and is not directed at children under 16. We do not knowingly collect personal data from children under 16, and in particular we do not knowingly collect personal information from children under 13 in the sense of the US Children’s Online Privacy Protection Act (COPPA). If you believe a child has given us personal data, contact us and we will delete it.',
    },
    { type: 'h2', text: '11. Automated decision-making' },
    {
      type: 'p',
      text: 'We do not make decisions about you based solely on automated processing, including profiling, that produce legal or similarly significant effects. Automated anti-abuse checks may block a sign-up attempt; you can contact us to have it reviewed by a person.',
    },
    { type: 'h2', text: '12. Contact and representatives' },
    {
      type: 'ul',
      items: [
        `Controller: ${OPERATOR}.`,
        `Privacy contact: ${C.privacyEmail}.`,
        `EU representative (GDPR Art. 27): ${C.euRep}.`,
        `UK representative (UK GDPR Art. 27): ${C.ukRep}.`,
      ],
    },
    { type: 'h2', text: '13. Changes to this policy' },
    {
      type: 'p',
      text: 'We will post any changes on this page with a new "Last updated" date. If changes are material, we will notify account holders by email before they take effect.',
    },
  ],
}
