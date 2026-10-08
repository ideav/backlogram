import { LEGAL_CONFIG as C } from './config'
import type { LegalDoc } from './types'

export const ACCEPTABLE_USE: LegalDoc = {
  slug: 'acceptable-use',
  title: 'Acceptable Use Policy',
  short: 'Acceptable Use',
  description:
    'What you may not do with Integram: illegal content, abuse, security attacks, spam, misuse of AI agents and the API, and how we enforce the policy.',
  updated: C.updated,
  blocks: [
    {
      type: 'p',
      text: 'This policy is part of our [Terms of Service](/terms). It applies to everyone who uses Integram, including users invited to a workspace and AI agents or scripts connected to it. The account owner is responsible for making sure their users and agents follow it.',
    },
    { type: 'h2', text: '1. Illegal and harmful content' },
    { type: 'p', text: 'Do not use Integram to store, publish or distribute content that:' },
    {
      type: 'ul',
      items: [
        'is illegal, or promotes or facilitates illegal activity;',
        'sexually exploits or endangers children, in any form;',
        'infringes intellectual property, privacy or other rights of others;',
        'harasses, threatens, defames or incites violence or hatred against people;',
        'is fraudulent or deceptive, including phishing pages, fake shops and scams;',
        'contains malware, or is used to command or control malicious software.',
      ],
    },
    { type: 'h2', text: '2. Personal data' },
    {
      type: 'ul',
      items: [
        'Process personal data in workspaces only with a lawful basis and in line with applicable data protection laws.',
        'Do not collect personal data by scraping or other means that break a website’s terms or the law.',
        'Do not use Integram to stalk or covertly monitor people, or to build profiles for unlawful discrimination.',
        'Do not upload special categories of data (such as health data), payment card numbers, or government ID numbers unless you have assessed that this is lawful and the safeguards are appropriate.',
      ],
    },
    { type: 'h2', text: '3. Security and integrity of the service' },
    {
      type: 'ul',
      items: [
        'Do not probe, scan or test the vulnerability of the service, except under our responsible disclosure process on the [Security](/security) page.',
        'Do not access or try to access other customers’ workspaces or data, or bypass authentication, roles, rate limits or plan limits.',
        'Do not overload the service, for example with denial-of-service traffic or automated requests far beyond normal use.',
        'Do not reverse engineer the service except where the law expressly allows it.',
      ],
    },
    { type: 'h2', text: '4. Messaging and spam' },
    {
      type: 'p',
      text: 'Do not use forms, notifications or integrations to send unsolicited bulk messages, or messages that break anti-spam laws (such as the CAN-SPAM Act or EU and UK e-privacy rules).',
    },
    { type: 'h2', text: '5. AI agents, the API and automation' },
    {
      type: 'ul',
      items: [
        'AI agents and scripts you connect must follow this policy just as people do. You are responsible for their actions.',
        'Give agents only the permissions they need, keep tokens secret, and revoke tokens you no longer use.',
        'Do not use Integram with AI systems to make decisions with legal or similarly significant effects on people without human review where the law requires it.',
        'Do not use the API to resell or white-label the service without our written agreement, or to build a directly competing product from our software.',
      ],
    },
    { type: 'h2', text: '6. Sanctions and export controls' },
    { type: 'p', text: 'Do not use the service in violation of applicable sanctions or export control laws.' },
    { type: 'h2', text: '7. Enforcement' },
    {
      type: 'p',
      text: 'If we become aware of a violation, we may remove or disable the content concerned, limit features, or suspend or terminate the account, depending on severity. Where reasonable we will warn you first, tell you the reason and how to appeal, and give you a chance to fix the problem. We may report illegal activity to the authorities.',
    },
    { type: 'h2', text: '8. Reporting' },
    {
      type: 'p',
      text: `Report suspected violations to ${C.contactEmail}. Copyright and other illegal content notices follow our [Copyright and Notice-and-Takedown Policy](/copyright).`,
    },
  ],
}

export const COPYRIGHT: LegalDoc = {
  slug: 'copyright',
  title: 'Copyright and Notice-and-Takedown Policy',
  short: 'Copyright / DMCA',
  description:
    'How to report content on Integram that infringes copyright (DMCA) or is otherwise illegal (EU Digital Services Act), how counter-notices work, and our repeat infringer policy.',
  updated: C.updated,
  blocks: [
    {
      type: 'p',
      text: 'We respect intellectual property rights and expect our users to do the same. Most content in Integram is private to the workspaces that hold it; this policy applies when content hosted on our service, such as a public form or shared file, is reported as infringing or illegal.',
    },
    { type: 'h2', text: '1. Copyright notices (DMCA)' },
    {
      type: 'p',
      text: `If you believe content on Integram infringes your copyright, send a notice to our designated copyright agent: ${C.copyrightAgent}, email ${C.contactEmail} (subject: "Copyright notice"). Under the US Digital Millennium Copyright Act (17 U.S.C. 512(c)(3)), the notice must include:`,
    },
    {
      type: 'ol',
      items: [
        'your physical or electronic signature;',
        'identification of the copyrighted work you claim is infringed;',
        'identification of the infringing material and information reasonably sufficient to locate it, such as its URL;',
        'your contact details: name, address, telephone number and email;',
        'a statement that you have a good faith belief that the use is not authorized by the copyright owner, its agent or the law;',
        'a statement that the information in the notice is accurate and, under penalty of perjury, that you are the owner or authorized to act on the owner’s behalf.',
      ],
    },
    {
      type: 'p',
      text: 'Knowingly misrepresenting that material is infringing may make you liable for damages under 17 U.S.C. 512(f).',
    },
    { type: 'h2', text: '2. Counter-notices' },
    {
      type: 'p',
      text: 'If your content was removed and you believe this was a mistake or misidentification, you may send a counter-notice to the same agent with: your signature; identification of the removed material and its former location; a statement under penalty of perjury that you have a good faith belief the material was removed by mistake or misidentification; your name, address and telephone number; and your consent to the jurisdiction of the competent court for your address (or, if outside the United States, any judicial district in which we may be found) and to accept service of process from the person who sent the original notice. We forward the counter-notice to the complainant and may restore the material in 10 to 14 business days unless the complainant tells us it has filed a court action.',
    },
    { type: 'h2', text: '3. Repeat infringers' },
    {
      type: 'p',
      text: 'We terminate, in appropriate circumstances, the accounts of users who are repeat infringers.',
    },
    { type: 'h2', text: '4. Other illegal content (EU Digital Services Act)' },
    {
      type: 'p',
      text: `Anyone may notify us of content they consider illegal under EU or national law by emailing ${C.contactEmail} (subject: "Illegal content notice"). This is also our single point of contact for users and for authorities of EU member states and the European Commission; we can communicate in English. Please include:`,
    },
    {
      type: 'ul',
      items: [
        'a sufficiently substantiated explanation of why you consider the content illegal;',
        'the exact location of the content, such as its URL;',
        'your name and email address (not required for reports of child sexual abuse material);',
        'a statement that you believe in good faith that the information in the notice is accurate and complete.',
      ],
    },
    {
      type: 'p',
      text: 'We confirm receipt, review notices in a timely, diligent and objective manner, and inform you of our decision. If we remove or restrict content, we tell the affected user the reasons and how to contest the decision, including through out-of-court dispute settlement where available. We do not use automated means to decide on notices.',
    },
    { type: 'h2', text: '5. Contact' },
    { type: 'p', text: `Designated agent: ${C.copyrightAgent}. Email: ${C.contactEmail}.` },
  ],
}

export const SECURITY: LegalDoc = {
  slug: 'security',
  title: 'Security',
  description:
    'How Integram protects your data today: HTTPS and HSTS, hashed passwords, a separate database per workspace, role-based access, backups, and how to report a vulnerability.',
  updated: C.updated,
  blocks: [
    {
      type: 'p',
      text: 'This is a plain description of how we protect the service and your data today. We do not hold security certifications such as ISO 27001 or SOC 2 at this time. For the contractual version, see Annex II of our [Data Processing Addendum](/dpa).',
    },
    { type: 'h2', text: 'Data in transit' },
    {
      type: 'p',
      text: 'The website, the app, the REST API and the MCP server are served only over HTTPS. Plain HTTP requests are redirected, and HTTP Strict Transport Security (HSTS) tells browsers to use HTTPS every time.',
    },
    { type: 'h2', text: 'Accounts and passwords' },
    {
      type: 'ul',
      items: [
        'Passwords are stored only as salted one-way hashes, never in plain text.',
        'Email sign-ups are confirmed by a link sent to the address. You can also sign in with GitHub or Google where enabled.',
        'Sign-up, login and password reset are protected by rate limits and anti-bot checks.',
        'Logging out ends your session on that device.',
      ],
    },
    { type: 'h2', text: 'Isolation and access control' },
    {
      type: 'ul',
      items: [
        'Every workspace has its own database.',
        'Inside a workspace, the owner decides with roles who can see and change which tables, records and functions. API and MCP access, including by AI agents, has exactly the permissions of the token used.',
        'Access to production servers is limited to a few authorized people, using SSH keys. Configuration secrets live in server-only files, outside the code repository and releases.',
      ],
    },
    { type: 'h2', text: 'Backups and availability' },
    { type: 'p', text: `Backups of databases and uploaded files: ${C.backups}. You can also export your data to Excel at any time.` },
    { type: 'h2', text: 'Development and releases' },
    {
      type: 'p',
      text: 'Changes are reviewed and must pass automated tests before release. Releases are deployed by script; secrets are never part of a release.',
    },
    { type: 'h2', text: 'Privacy by default' },
    {
      type: 'p',
      text: 'The marketing site has no advertising trackers and loads cookieless analytics only with consent. We do not use customer data to train AI models. AI providers are only involved when you connect one.',
    },
    { type: 'h2', text: 'Reporting a vulnerability' },
    {
      type: 'p',
      text: `If you find a security problem, email ${C.contactEmail} with the subject "Security" and enough detail to reproduce it. Please give us reasonable time to fix it before disclosing it, do not access or change other people’s data, and do not run tests that degrade the service. We will acknowledge your report, keep you updated and will not take legal action against good-faith research that follows these rules.`,
    },
  ],
}
