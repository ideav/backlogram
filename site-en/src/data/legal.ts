import type { Block } from '../content/types'
import { CONTACT_EMAIL } from '../site'

/**
 * Legal texts for the English site (issue #531): Terms of Service, Privacy
 * Policy (GDPR, with a CCPA note) and Cookie Policy.
 *
 * Placeholders in square brackets MUST be filled in by the owner before launch:
 *   [Legal entity name], [Registered address], [Company registration number],
 *   [Governing law], [Courts of jurisdiction], [EU representative, if required]
 * They are intentionally not guessed. Search for "[" to find them all.
 */

export interface LegalDoc {
  slug: 'terms' | 'privacy' | 'cookies'
  title: string
  description: string
  updated: string
  blocks: Block[]
}

const UPDATED = 'October 8, 2026'
const ENTITY = '[Legal entity name]'

export const LEGAL: LegalDoc[] = [
  {
    slug: 'terms',
    title: 'Terms of Service',
    description: 'The terms that apply when you use the Integram website and the Integram service, including plans, billing, your data and acceptable use.',
    updated: UPDATED,
    blocks: [
      {
        type: 'callout',
        text: `These Terms are a contract between you and ${ENTITY}, [Registered address], registration number [Company registration number] ("Integram", "we", "us"). By creating an account or using the service you agree to them. If you use Integram on behalf of an organization, you confirm that you may bind that organization.`,
      },
      { type: 'h2', text: '1. The service' },
      {
        type: 'p',
        text: 'Integram is an online platform for building business applications from spreadsheets and other data: tables, links between them, forms, reports, user roles, a REST API and an MCP server for AI agents. It is offered in the cloud and, under a separate license, as self-hosted software.',
      },
      { type: 'h2', text: '2. Accounts' },
      {
        type: 'ul',
        items: [
          'You can sign up with a confirmed email address, a GitHub account or a Google account.',
          'Keep your credentials and API tokens secret. You are responsible for activity under your account, including actions taken by AI agents or scripts you connect to it.',
          'You must be at least 16 years old, or the age of digital consent where you live if higher.',
          'Tell us promptly at ' + CONTACT_EMAIL + ' if you believe your account has been compromised.',
        ],
      },
      { type: 'h2', text: '3. Plans, actions and billing' },
      {
        type: 'ul',
        items: [
          'Plans and prices are listed on the Pricing page. Prices are in US dollars and exclude taxes, which are added where required.',
          'Usage is measured in actions: operations performed by users or API clients in your workspace. Each plan includes a monthly allowance.',
          'Paid plans are billed monthly in advance and renew automatically until cancelled. You can cancel at any time; the cancellation takes effect at the end of the current billing period and your workspace moves to the free plan.',
          'Exceeding your allowance does not stop your workspace. We may ask you to buy an extra pack or move to a higher plan if usage stays above the allowance.',
          'We may change prices with at least 30 days’ notice by email. Changes apply from your next billing period.',
          'Except where the law requires otherwise, payments are non-refundable.',
        ],
      },
      { type: 'h2', text: '4. Free plan' },
      {
        type: 'p',
        text: 'The free plan is provided as is, with the limits shown on the Pricing page. We may suspend free workspaces that stay inactive for more than 12 months after giving 30 days’ notice by email, so you can export your data.',
      },
      { type: 'h2', text: '5. Your data' },
      {
        type: 'ul',
        items: [
          'You keep all rights to the data you put into Integram ("Customer Data").',
          'We process Customer Data only to provide, secure and support the service, and as described in our Privacy Policy. For Customer Data that contains personal data, we act as your processor; a Data Processing Agreement is available on request.',
          'You can export your data to Excel at any time while your account is active, and for 30 days after it is closed. After that we delete it, except where the law requires us to keep it.',
          'You are responsible for having the right to upload Customer Data and for its lawfulness.',
        ],
      },
      { type: 'h2', text: '6. AI agents and the API' },
      {
        type: 'p',
        text: 'You may connect AI agents and other software to your workspace through the REST API or the MCP server. Agents act with the permissions of the account they use. You are responsible for what connected agents do and for the terms of any third-party AI provider you use. Integram does not send Customer Data to any AI model unless you connect one.',
      },
      { type: 'h2', text: '7. Acceptable use' },
      {
        type: 'p',
        text: 'Do not use Integram to break the law or to infringe other people’s rights; to store or distribute malware; to send spam; to probe, overload or attack the service or other users; to resell the service without our written agreement; or to process special categories of personal data without appropriate safeguards. We may suspend accounts that put the service or other users at risk, and will tell you why unless the law prevents it.',
      },
      { type: 'h2', text: '8. Availability and support' },
      {
        type: 'p',
        text: 'We work to keep the service available and to fix problems quickly, but the cloud service is provided without a guaranteed uptime unless a separate written agreement says otherwise. Support channels and response times depend on your plan.',
      },
      { type: 'h2', text: '9. Intellectual property' },
      {
        type: 'p',
        text: 'The service, the software and the Integram brand belong to us or our licensors. We grant you a non-exclusive, non-transferable right to use the service during your subscription. If you send us feedback, we may use it without obligation to you.',
      },
      { type: 'h2', text: '10. Disclaimers and liability' },
      {
        type: 'p',
        text: 'To the extent permitted by law, the service is provided "as is" without warranties of any kind. Neither party is liable for indirect or consequential losses, lost profits or lost data that could have been avoided by reasonable backups. Our total liability under these Terms is limited to the amounts you paid us in the 12 months before the claim. Nothing in these Terms limits liability that cannot be limited by law.',
      },
      { type: 'h2', text: '11. Termination' },
      {
        type: 'p',
        text: 'You can close your account at any time. We may terminate these Terms for material breach that is not cured within 14 days of notice, or immediately where required by law. Sections 5, 9, 10 and 12 survive termination.',
      },
      { type: 'h2', text: '12. Governing law' },
      {
        type: 'p',
        text: 'These Terms are governed by [Governing law]. Disputes are subject to the courts of [Courts of jurisdiction], without prejudice to any mandatory consumer protection rights you have where you live.',
      },
      { type: 'h2', text: '13. Changes' },
      {
        type: 'p',
        text: `We may update these Terms. For material changes we will notify account holders by email at least 30 days in advance. Questions: ${CONTACT_EMAIL}.`,
      },
    ],
  },
  {
    slug: 'privacy',
    title: 'Privacy Policy',
    description: 'What personal data Integram collects through its website, lead form, accounts and analytics, why, for how long, and how to exercise your GDPR rights.',
    updated: UPDATED,
    blocks: [
      {
        type: 'p',
        text: `This policy explains how ${ENTITY}, [Registered address] ("Integram", "we") handles personal data when you visit integram-ai.online, contact us, or use the Integram service. We are the controller for the data described here. For data that our customers store in their own workspaces, we act as a processor on their behalf; their privacy notices apply to it.`,
      },
      { type: 'h2', text: 'What we collect and why' },
      { type: 'h3', text: 'Contact and demo requests' },
      {
        type: 'p',
        text: 'When you use the "Book a demo" form we receive your name, email, optional company name, your message, the page you sent it from and, if you arrived from a campaign link, the campaign parameters (such as utm_source). We use this to reply and to understand which channels bring requests. Legal basis: your request and our legitimate interest in answering it (GDPR Art. 6(1)(b) and (f)). Retention: 24 months after our last exchange, unless you become a customer.',
      },
      { type: 'h3', text: 'Accounts' },
      {
        type: 'p',
        text: 'When you sign up we store your email address and name, and, if you sign in with GitHub or Google, the account identifier and profile details those services share with us. We use this to run your account, to secure it and to send service messages. Legal basis: performance of our contract with you (Art. 6(1)(b)). Retention: while the account exists, then up to 30 days to allow export, plus any period required by tax or accounting law for billing records.',
      },
      { type: 'h3', text: 'Analytics, only with your consent' },
      {
        type: 'p',
        text: 'If you click "Accept analytics" in the cookie banner, we load Plausible Analytics. Plausible does not use cookies and does not build cross-site profiles; it gives us aggregate statistics such as page views, referrers, country-level location and device type, and records whether a visit led to a demo request or a sign-up click. Legal basis: your consent (Art. 6(1)(a)), which you can withdraw at any time through "Cookie settings" in the footer. If you decline, no analytics script is loaded.',
      },
      { type: 'h3', text: 'Server logs' },
      {
        type: 'p',
        text: 'Our servers log technical data such as IP address, browser user agent, requested URL and time, to keep the service secure and to investigate errors and abuse. Legal basis: legitimate interest (Art. 6(1)(f)). Retention: up to 30 days, longer only when needed to investigate a specific incident.',
      },
      { type: 'h2', text: 'Who receives the data' },
      {
        type: 'ul',
        items: [
          'Our hosting provider, which stores the website, the service and its databases.',
          'Our email delivery provider, for form notifications and account emails.',
          'Plausible Insights, for analytics, only if you consent. Plausible processes data in the EU.',
          'GitHub or Google, only if you choose to sign in with them.',
          'Authorities, where the law requires us to disclose data.',
        ],
      },
      {
        type: 'p',
        text: 'We do not sell personal data and do not share it for cross-context behavioral advertising. A current list of sub-processors is available on request.',
      },
      { type: 'h2', text: 'International transfers' },
      {
        type: 'p',
        text: 'Where personal data is transferred outside the European Economic Area or the United Kingdom, we rely on an adequacy decision or on the European Commission’s Standard Contractual Clauses, with additional safeguards where needed.',
      },
      { type: 'h2', text: 'Your rights' },
      {
        type: 'ul',
        items: [
          'Access the personal data we hold about you and receive a copy.',
          'Correct inaccurate data, or have data deleted.',
          'Restrict or object to processing based on legitimate interests.',
          'Receive your data in a portable format.',
          'Withdraw consent at any time, without affecting earlier processing.',
          'Complain to your local data protection supervisory authority.',
        ],
      },
      {
        type: 'p',
        text: `To exercise any of these rights, email ${CONTACT_EMAIL}. We answer within one month. If you are a California resident, you have similar rights under the CCPA/CPRA to know, delete and correct personal information, and we do not sell or share it.`,
      },
      { type: 'h2', text: 'Security' },
      {
        type: 'p',
        text: 'Data is transmitted over HTTPS. Access to production systems is limited to staff who need it. Workspaces are separated, and access inside a workspace is controlled by the roles its owner sets.',
      },
      { type: 'h2', text: 'Children' },
      { type: 'p', text: 'Integram is a business tool and is not directed at children under 16. We do not knowingly collect their data.' },
      { type: 'h2', text: 'Contact and changes' },
      {
        type: 'p',
        text: `Controller: ${ENTITY}, [Registered address]. Privacy contact: ${CONTACT_EMAIL}. EU representative: [EU representative, if required]. We will post changes to this policy on this page and, for material changes, notify account holders by email.`,
      },
    ],
  },
  {
    slug: 'cookies',
    title: 'Cookie Policy',
    description: 'Which cookies and browser storage the Integram website uses, why, and how to change your consent at any time.',
    updated: UPDATED,
    blocks: [
      {
        type: 'p',
        text: 'This page explains what the Integram website stores in your browser. Short version: nothing for advertising, analytics only if you say yes, and you can change your mind at any time with the button above or "Cookie settings" in the footer.',
      },
      { type: 'h2', text: 'Strictly necessary (no consent needed)' },
      {
        type: 'ul',
        items: [
          'integram-consent (localStorage, until you clear it): remembers whether you accepted or declined analytics, so we do not ask on every page.',
          'integram-utm (sessionStorage, deleted when you close the tab): keeps the campaign parameters of the link you arrived from, so they can be attached to a demo request you send in the same visit.',
          'Session cookie of the Integram application (set only when you log in at /start or use /my): keeps you signed in and protects forms against cross-site request forgery. Deleted when you log out or when the session expires.',
        ],
      },
      { type: 'h2', text: 'Analytics (only with your consent)' },
      {
        type: 'p',
        text: 'If you accept analytics, the site loads the Plausible Analytics script from plausible.io. Plausible does not set cookies and does not track you across sites; it counts page views and a small number of events, such as a sent demo request or a click on "Start free". We still ask first, because the script is loaded from a third-party server.',
      },
      { type: 'h2', text: 'What we do not use' },
      {
        type: 'p',
        text: 'No advertising cookies, no social media pixels, no session recording, no fingerprinting.',
      },
      { type: 'h2', text: 'Changing your choice' },
      {
        type: 'p',
        text: 'Use "Cookie settings" in the footer or the button at the top of this page. If you withdraw consent, the analytics script is not loaded again from the next page you open. You can also clear site data in your browser settings at any time.',
      },
      { type: 'h2', text: 'Contact' },
      { type: 'p', text: `Questions about this policy: ${CONTACT_EMAIL}. See also our Privacy Policy.` },
    ],
  },
]
