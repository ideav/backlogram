import type { KbArticle } from '../types'
import { h2, h3, p, ul, ol, callout } from './blocks'

export const article: KbArticle = {
  slug: 'data-ownership-and-self-hosting',
  title: 'Data ownership and self-hosting: when it matters and how to decide',
  description:
    'Cloud or your own server? A plain-language guide to data ownership, portability, backups and self-hosting for small and medium businesses, with a decision framework and a realistic look at the costs.',
  date: '2026-09-26',
  readingMinutes: 7,
  tags: ['self-hosting', 'data ownership', 'security', 'backups', 'privacy'],
  blocks: [
    p(
      'When you put your business data into a SaaS product you gain convenience and give up some control. For most teams most of the time that is a good trade. But it is a trade, and it helps to make it deliberately rather than by default. This article explains what data ownership actually involves, when self-hosting is worth the effort, and how to keep your options open either way.',
    ),
    h2('Four things "ownership" really means'),
    ol(
      'Access. Can you get all of your data out, in a usable format, whenever you want, without asking permission or paying a fee?',
      'Location. Do you know where the data physically lives, and can you choose that place if a customer, regulator or contract requires it?',
      'Continuity. If the vendor changes pricing, is acquired, changes its terms or shuts the product down, can you keep operating?',
      'Control of use. Who else, including the vendor and its sub-processors, can read the data, and is it used to train AI models?',
    ),
    p(
      'Notice that none of these is about who has the login. A product can be extremely secure and still fail on portability or continuity. Ownership is about your freedom to move, not only about protection.',
    ),
    h2('What the cloud does well'),
    p(
      'Let us be fair to SaaS. A good provider runs better infrastructure than most small businesses ever will: redundant hardware, automated backups, patching within hours, monitoring around the clock and a security team. You do not maintain servers, and you start in minutes. If your data is not especially sensitive and your needs are standard, the cloud is the sensible default.',
    ),
    h2('When self-hosting starts to make sense'),
    ul(
      'Contractual or regulatory constraints. Customers in healthcare, finance, defense or the public sector often require data to stay in a specified region or on infrastructure you control. Regimes such as GDPR do not forbid cloud use, but they raise questions about data transfers, processors and the right to deletion that are simpler to answer when you run the system.',
      'Sensitive intellectual property. Product designs, unreleased financials, legal files, source code, customer lists. Some owners prefer that these never leave their own perimeter.',
      'Cost at scale. Per-seat SaaS pricing grows with every person you add. At a certain size, hosting an open or licensable platform on a modest server costs less than the subscription. Do the math honestly, including staff time.',
      'Integration with internal systems. When the app must talk to databases or machines that are not on the public internet, running it inside your network removes awkward tunnels.',
      'Avoiding lock-in. If the data model and the application logic live on your servers, a vendor change becomes a project, not an emergency.',
      'AI privacy. If you use language models on business data, you may want the model, the database and the agent all inside the same boundary, using a locally run model or a provider contract you trust.',
    ),
    h2('The honest costs of self-hosting'),
    p('Self-hosting transfers responsibility to you. Budget for these:'),
    ul(
      'Setup and upgrades. Someone must install the software, apply security patches and test updates.',
      'Backups that are actually tested. A backup you have never restored is a hope, not a backup. Keep at least one copy off the server and rehearse the restore.',
      'Monitoring and availability. If the server goes down at 3 a.m., you or your provider handles it.',
      'Security. Firewalls, TLS certificates, strong authentication, least-privilege accounts and log review are now yours.',
      'Skills. You need someone comfortable with Linux, a database and basic networking, in-house or on retainer.',
    ),
    callout(
      'A useful middle path: a managed instance of the platform in a region you choose, with a documented export. You get most of the control without running the hardware. Ask any vendor whether it offers this.',
    ),
    h2('A decision framework'),
    p('Score each question from 0 (no) to 2 (strongly yes). A total of 6 or more suggests that self-hosting or a dedicated instance deserves a serious look.'),
    ol(
      'Do contracts or regulations restrict where our data can live?',
      'Would a leak of this data materially hurt the business or its customers?',
      'Would a sudden vendor price rise or shutdown threaten operations?',
      'Is our SaaS bill growing mainly because we add users rather than because we use more?',
      'Do we want AI features to run on data that never leaves our network?',
      'Do we have, or can we afford, the skills to operate a server reliably?',
    ),
    p(
      'Note that the last question cuts the other way: a low score there should temper everything else. A neglected self-hosted server is a bigger risk than a well-run cloud service.',
    ),
    h2('Portability: the part everyone can do'),
    p(
      'Even if you never self-host, you can protect yourself with a few habits that cost almost nothing.',
    ),
    ul(
      'Schedule exports. Run a full export of your tables to CSV or a database dump weekly or monthly and store it somewhere independent.',
      'Check the format. Open an export and confirm that relationships, IDs and attachments are included. An export that drops links is only half an export.',
      'Prefer platforms with an API. A documented REST API means your data can be pulled by any script at any time.',
      'Keep your own copy of file attachments. Contracts, scans and photos are often the hardest part to move.',
      'Document the logic. Write down the business rules, automations and formulas that your system applies, so they can be rebuilt elsewhere.',
    ),
    h2('Self-hosting an application platform in practice'),
    p(
      'A platform you can run on your own server typically ships as a web application plus a relational database such as MySQL or PostgreSQL, served by a standard web server. That is deliberately conventional technology: your IT person already knows how to back it up, secure it and monitor it. Integram can be run this way, and on the same instance you get the usual features: tables and relations, roles and access rights, forms, reports, file storage, a REST API and an MCP server for AI agents. The advantage of the conventional stack is that nothing about your data is exotic. If you ever need to leave, the tables are in a normal database.',
    ),
    h3('A minimal checklist for a small self-hosted setup'),
    ol(
      'Use a dedicated virtual server or container host from a provider in the region you need.',
      'Put everything behind HTTPS with automatically renewed certificates.',
      'Create separate database credentials for the application with only the permissions it needs.',
      'Back up the database and the file storage every night, copy backups off the server and test a restore every quarter.',
      'Enable automatic security updates for the operating system and subscribe to the vendor\'s release notes for the application.',
      'Restrict administration to a few accounts with strong authentication, and keep an access log.',
      'Write a one-page runbook: where things live, how to restart them, who to call.',
    ),
    h2('Data ownership and AI agents'),
    p(
      'AI makes ownership questions sharper. When an agent reads your records it sends fragments of them to a model, which may be run by a third party. Decide deliberately: which tables may an agent see at all, which model provider processes the content, and whether that provider retains or trains on it. Platforms that let you scope an agent to specific tables, and that allow a locally hosted model, give you the most control. The simplest defense is also the oldest: do not give any system, human or machine, access to data it does not need.',
    ),
    h2('The bottom line'),
    p(
      'You do not have to choose between "everything in the cloud" and "everything on a server in the closet". Start where you can move fastest, keep your data exportable from day one, and revisit the decision when your size, your customers\' requirements or your costs change. Ownership is a property you maintain through habits, not a one-time purchase.',
    ),
  ],
}
