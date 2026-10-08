import { LEGAL_CONFIG as C, OPERATOR } from './config'
import type { LegalBlock, LegalDoc } from './types'

function arbitration(): LegalBlock[] {
  if (C.arbitration === 'off') return []
  const blocks: LegalBlock[] = [
    { type: 'h2', text: '21. Arbitration and class action waiver (US customers)' },
  ]
  if (C.arbitration === 'placeholder') {
    blocks.push({
      type: 'callout',
      text: '[Arbitration clause: owner to choose whether this section applies. Until decided, it is shown for review only and does not apply.]',
    })
  }
  blocks.push(
    {
      type: 'caps',
      text: 'PLEASE READ THIS SECTION CAREFULLY. IF YOU LIVE IN THE UNITED STATES, IT AFFECTS HOW DISPUTES BETWEEN YOU AND US ARE RESOLVED.',
    },
    {
      type: 'ul',
      items: [
        '**Informal resolution first.** Before starting a claim, the party with the dispute sends a written notice describing it to the other party (to us at ' + C.contactEmail + '). Both parties try in good faith to resolve it for 60 days.',
        '**Binding individual arbitration.** If the dispute is not resolved, it will be decided by binding individual arbitration administered by ' + C.arbitrationProvider + ' under its rules for consumer or commercial disputes, as applicable, rather than in court. Either party may instead bring an individual claim in small claims court if it qualifies.',
        '**Class action waiver.** Claims may be brought only on an individual basis, not as a plaintiff or class member in any class, collective or representative proceeding. The arbitrator may not consolidate claims of different people.',
        '**Opt-out.** You may opt out of this section by emailing ' + C.contactEmail + ' within 30 days of first accepting these Terms, stating your name, account email and that you opt out of arbitration.',
        '**Exceptions.** Either party may seek injunctive relief in court for infringement or misuse of intellectual property. If the class action waiver is found unenforceable for a claim, that claim proceeds in court under section 20 and the rest of this section still applies.',
      ],
    },
  )
  return blocks
}

export const TERMS: LegalDoc = {
  slug: 'terms',
  title: 'Terms of Service',
  short: 'Terms of Service',
  description:
    'The contract for using Integram: accounts, your data, acceptable use, plans, auto-renewal and cancellation, AI integrations, warranties, liability and disputes.',
  updated: C.updated,
  blocks: [
    {
      type: 'callout',
      text: `These Terms of Service ("Terms") are a contract between you and ${OPERATOR} ("Integram", "we", "us"). They apply when you visit the Integram website or create an account and use the Integram service. If you use Integram for an organization, "you" means that organization and you confirm you are authorized to accept these Terms for it. If you do not agree, do not use the service.`,
    },
    { type: 'h2', text: '1. The service' },
    {
      type: 'p',
      text: 'Integram is an online platform for building business applications from spreadsheets and other data: tables with links between them, forms, reports, user roles, a REST API and an MCP server for AI agents ("the Service"). It is offered as a hosted cloud service and, under a separate license, as self-hosted software. Features available to you depend on your plan, described on the [Pricing](/pricing) page.',
    },
    { type: 'h2', text: '2. Accounts' },
    {
      type: 'ul',
      items: [
        'You can sign up with a confirmed email address, or with a GitHub or Google account where offered. Give accurate information and keep it up to date.',
        'You must be at least 16 years old, or older if the age of digital consent where you live is higher. The Service is intended for business and professional use.',
        'Keep your password and API tokens secret. You are responsible for all activity under your account and in your workspaces, including activity by users you invite and by software or AI agents you connect.',
        `Tell us promptly at ${C.contactEmail} if you suspect unauthorized access to your account.`,
      ],
    },
    { type: 'h2', text: '3. Your data' },
    {
      type: 'ul',
      items: [
        '**You own your data.** Everything you or your users put into your workspaces ("Customer Data") remains yours. We claim no ownership of it.',
        'You give us a limited permission to host, copy, transmit and display Customer Data only as needed to provide, secure and support the Service, to comply with law, and as you instruct (for example, when you connect an integration).',
        'Where Customer Data contains personal data, we process it as your processor (service provider) under our [Data Processing Addendum](/dpa), which forms part of these Terms for business customers.',
        'You are responsible for the lawfulness of Customer Data and for having the rights and notices needed to upload it. Do not store data in the Service that you are not permitted to process.',
        'We do not use Customer Data to train AI models, and we do not sell it.',
      ],
    },
    { type: 'h2', text: '4. Acceptable use' },
    {
      type: 'p',
      text: 'You must follow our [Acceptable Use Policy](/acceptable-use). In short: no illegal content or activity, no malware, spam, abuse of other people’s rights, attacks on the Service, or attempts to bypass its limits or security.',
    },
    { type: 'h2', text: '5. Free plan' },
    {
      type: 'p',
      text: 'The free plan is provided free of charge, with the limits shown on the Pricing page, and without any service commitment. We may change free-plan limits, and may suspend free workspaces that remain inactive for more than 12 months, after giving at least 30 days’ notice by email so you can export your data.',
    },
    { type: 'h2', text: '6. Paid plans, billing and automatic renewal' },
    {
      type: 'caps',
      text: 'PAID SUBSCRIPTIONS RENEW AUTOMATICALLY. UNLESS YOU CANCEL BEFORE THE END OF THE CURRENT BILLING PERIOD, YOUR SUBSCRIPTION RENEWS FOR THE SAME PERIOD (MONTHLY OR YEARLY, AS YOU CHOSE) AND WE CHARGE YOUR PAYMENT METHOD THE THEN-CURRENT PRICE OF YOUR PLAN, PLUS APPLICABLE TAXES, AT THE START OF EACH NEW PERIOD.',
    },
    {
      type: 'ul',
      items: [
        '**Price and taxes.** Prices are shown in US dollars on the Pricing page and at checkout. Taxes such as VAT or sales tax are added where the law requires and are shown before you pay.',
        `**Payment.** Payments are processed by ${C.paymentProcessor}. By subscribing you authorize recurring charges to your payment method until you cancel. We do not store full card numbers.`,
        '**Usage.** Plans include a monthly allowance of actions (operations performed by users or API clients in a workspace). Going over the allowance does not stop your workspace; if usage stays above it, we may ask you to buy an extra pack or move to a higher plan. We never charge for extra usage without your consent.',
        '**How to cancel.** You can cancel at any time in your account settings, or by emailing ' + C.contactEmail + ' from your account email. Cancellation takes effect at the end of the current billing period; you keep paid features until then, and your workspace then moves to the free plan. We confirm cancellation by email.',
        '**Price changes.** We will tell you about any price change by email at least 30 days before it applies to you. It applies from your next renewal, and you may cancel before then.',
        '**Late payment.** If a payment fails, we will notify you and retry. If it is still unpaid 14 days after notice, we may move the workspace to the free plan or suspend paid features.',
      ],
    },
    { type: 'h2', text: '7. Refunds' },
    {
      type: 'p',
      text: 'Fees are charged in advance and, except where this section or the law says otherwise, are not refundable for partial periods. If you are a consumer in the EU or UK, you have a 14-day right to withdraw from a new paid subscription; by asking us to start the Service immediately you agree that, if you withdraw, we may keep a proportionate amount for the days already provided. If we terminate your subscription without cause, or the Service is materially unavailable for reasons within our control, we refund the unused prepaid portion.',
    },
    { type: 'h2', text: '8. Third-party services, AI agents and integrations' },
    {
      type: 'ul',
      items: [
        'You may connect AI agents (for example via the MCP server), scripts and other software to your workspaces through the REST API or MCP, and you may configure the in-app AI assistant with an AI provider and API key of your choice.',
        '**You are responsible for the AI agents and integrations you connect.** They act with the permissions of the account or token they use. Review what you allow them to do, keep tokens secret and revoke them when no longer needed.',
        'AI output can be wrong. Check results before relying on them, especially for decisions with legal, financial or similar significant effects.',
        'When you connect a third-party service (an AI model provider, GitHub, Google or others), data you choose to send goes to that service under its own terms and privacy policy. That service is not our sub-processor, and we are not responsible for it.',
        'Integram does not send Customer Data to any AI model unless you or your users connect or invoke one.',
      ],
    },
    { type: 'h2', text: '9. Our intellectual property' },
    {
      type: 'p',
      text: 'The Service, its software, documentation and the Integram name and logo belong to us or our licensors and are protected by intellectual property laws. Subject to these Terms, we grant you a non-exclusive, non-transferable, revocable right to use the Service during your subscription. You may not copy, resell or reverse engineer the Service except where the law expressly allows it. Self-hosted software is licensed under its own license terms.',
    },
    { type: 'h2', text: '10. Feedback' },
    {
      type: 'p',
      text: 'If you send us ideas or suggestions, we may use them without restriction or payment to you. This does not give us any right to your Customer Data.',
    },
    { type: 'h2', text: '11. Availability and support' },
    {
      type: 'p',
      text: 'We work to keep the Service available and secure and to fix problems quickly, but we do not guarantee uninterrupted availability unless a separate written agreement (for example an SLA) says so. We may perform maintenance and will try to schedule it at quiet hours. Support channels and response times depend on your plan.',
    },
    { type: 'h2', text: '12. Disclaimer of warranties' },
    {
      type: 'caps',
      text: 'TO THE MAXIMUM EXTENT PERMITTED BY LAW, THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE". WE DISCLAIM ALL WARRANTIES, EXPRESS OR IMPLIED, INCLUDING IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, TITLE AND NON-INFRINGEMENT, AND ANY WARRANTY THAT THE SERVICE WILL BE UNINTERRUPTED, ERROR-FREE OR THAT AI OUTPUT WILL BE ACCURATE. YOU ARE RESPONSIBLE FOR KEEPING YOUR OWN EXPORTS OR BACKUPS OF IMPORTANT DATA.',
    },
    { type: 'h2', text: '13. Limitation of liability' },
    {
      type: 'caps',
      text: 'TO THE MAXIMUM EXTENT PERMITTED BY LAW: (A) NEITHER PARTY IS LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL OR PUNITIVE DAMAGES, OR FOR LOST PROFITS, REVENUE, GOODWILL OR DATA, EVEN IF ADVISED OF THEIR POSSIBILITY; AND (B) EACH PARTY’S TOTAL LIABILITY ARISING OUT OF OR RELATING TO THESE TERMS IS LIMITED TO THE FEES YOU PAID US FOR THE SERVICE IN THE 12 MONTHS BEFORE THE EVENT GIVING RISE TO THE CLAIM (OR USD 100 IF YOU PAID NOTHING).',
    },
    {
      type: 'p',
      text: 'These limits do not apply to your payment obligations, to a party’s indemnification obligations, or to liability that cannot be limited by law, such as liability for death or personal injury caused by negligence, for fraud, or for gross negligence or willful misconduct.',
    },
    { type: 'h2', text: '14. Indemnification' },
    {
      type: 'p',
      text: 'If you use the Service for business purposes, you will defend and indemnify us against third-party claims, and related losses and reasonable costs, arising from your Customer Data, your breach of these Terms or the Acceptable Use Policy, or AI agents and integrations you connect. We will tell you promptly about the claim, let you control its defense, and cooperate reasonably. You may not settle a claim in a way that imposes obligations on us without our consent.',
    },
    { type: 'h2', text: '15. Suspension and termination' },
    {
      type: 'ul',
      items: [
        'You may stop using the Service and close your account at any time.',
        'We may suspend access, in whole or in part, if needed to prevent harm to the Service, other users or third parties, if you seriously breach these Terms or the Acceptable Use Policy, or if the law requires it. We will tell you the reason and give you a chance to fix the problem first where reasonable.',
        'Either party may terminate for a material breach not cured within 30 days of written notice. We may also end the Service as a whole with at least 90 days’ notice and a refund of unused prepaid fees.',
        'Sections 3, 9, 10 and 12 to 22 survive termination.',
      ],
    },
    { type: 'h2', text: '16. Data export on termination' },
    {
      type: 'p',
      text: 'You can export your Customer Data (for example to Excel) at any time while your account is active. After your account is closed or terminated, you can still request an export for 30 days. After that we delete Customer Data from the live systems, and from backups as they rotate, unless the law requires us to keep it. Termination for unlawful content may limit export of that content.',
    },
    { type: 'h2', text: '17. Export controls and sanctions' },
    {
      type: 'p',
      text: 'You may not use the Service in violation of applicable export control or sanctions laws, including by allowing access from embargoed regions or by persons on applicable sanctions lists, and you confirm that you are not such a person. We may suspend accounts where needed to comply with these laws.',
    },
    { type: 'h2', text: '18. Copyright complaints' },
    {
      type: 'p',
      text: 'We respond to notices of alleged copyright infringement and other illegal content under our [Copyright and Notice-and-Takedown Policy](/copyright), including the procedure of the US Digital Millennium Copyright Act (DMCA). We may terminate the accounts of repeat infringers.',
    },
    { type: 'h2', text: '19. Changes to these Terms' },
    {
      type: 'p',
      text: 'We may update these Terms to reflect changes to the Service or the law. We will post the new version on this page with a new "Last updated" date and, for material changes, notify account holders by email at least 30 days before they take effect. If you do not agree, you may cancel before the change takes effect; continued use afterwards means you accept the updated Terms. Changes do not apply retroactively to disputes already notified.',
    },
    { type: 'h2', text: '20. Governing law and venue' },
    {
      type: 'p',
      text: `These Terms are governed by ${C.governingLaw}, excluding its conflict-of-laws rules and the UN Convention on Contracts for the International Sale of Goods. Subject to section 21 where it applies, disputes are subject to the exclusive jurisdiction of ${C.venue}.`,
    },
    ...arbitration(),
    { type: 'h2', text: `${C.arbitration === 'off' ? '21' : '22'}. Consumers in the EU, the UK and elsewhere` },
    {
      type: 'p',
      text: 'If you are a consumer, nothing in these Terms limits the rights you have under the mandatory consumer protection laws of the country where you live, including statutory warranty rights, and you may also bring proceedings in the courts of that country. Where any part of these Terms (including sections 12 to 14) is not permitted by those laws, it applies only to the extent permitted. EU consumers may also use the online dispute resolution options available in their country.',
    },
    { type: 'h2', text: 'General' },
    {
      type: 'ul',
      items: [
        'These Terms, together with the policies they link to and any order form, are the entire agreement between you and us about the Service. An order form signed by both parties prevails if it conflicts with these Terms.',
        'If a provision is found unenforceable, the rest remains in effect. Failure to enforce a provision is not a waiver.',
        'You may not assign these Terms without our consent; we may assign them to an affiliate or in a merger or sale of the business, with notice to you.',
        'Neither party is liable for delays caused by events beyond its reasonable control.',
        `Notices to us: ${C.contactEmail}. Notices to you: the email address of your account.`,
      ],
    },
  ],
}
