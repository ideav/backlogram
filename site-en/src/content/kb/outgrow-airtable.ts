import type { KbArticle } from '../types'
import { h2, h3, p, ul, ol, callout } from './blocks'

export const article: KbArticle = {
  slug: 'when-you-outgrow-airtable',
  title: 'When you outgrow Airtable: signs, options and how to migrate',
  description:
    'Airtable is an excellent starting point. Here are the concrete signs that a team has outgrown it, the alternatives worth considering, and a step-by-step plan for moving without losing data or momentum.',
  date: '2026-09-24',
  readingMinutes: 7,
  tags: ['airtable', 'migration', 'alternatives', 'no-code', 'databases'],
  blocks: [
    p(
      'Airtable earned its popularity honestly. It gave non-programmers the power of linked records, views and forms in an interface that feels like a spreadsheet. For many teams it is the right tool for years. But a recognizable pattern appears as usage grows: the bills climb, the workarounds multiply, and someone asks whether there is a better home for this data. This article is for that moment.',
    ),
    h2('Signs you may be outgrowing it'),
    h3('1. Record limits start to shape your design'),
    p(
      'Airtable plans cap the number of records per base, and the cap is enforced per base rather than per account. Once a table nears the limit, teams split data across several bases, archive old records into other bases or delete history. Each of these tricks breaks relationships, because links cannot span bases. If you find yourself designing around the limit instead of around the business, that is a signal.',
    ),
    h3('2. Cost scales with headcount, not value'),
    p(
      'Airtable bills per seat. That is perfectly reasonable when every user is a daily editor. It becomes painful when most users are occasional: managers who look at a dashboard monthly, contractors who update a status twice a week, or approvers who click one button. Teams then ration seats, share logins or copy data into other tools to avoid paying for viewers, all of which reduce the value of having one system.',
    ),
    h3('3. Permissions are coarser than your needs'),
    p(
      'Access is mainly controlled at the base, table and view level. If you need "each client sees only their own records" or "sales reps see only their accounts and not the cost column", you end up building one interface or view per audience and hoping nobody finds the underlying base. For client-facing portals and strict separation, you want real row-level rules.',
    ),
    h3('4. Automation and API limits become a daily irritant'),
    p(
      'Automations have monthly run limits and the public API has request-rate limits. Once an app is wired into other systems, or an AI agent starts reading and writing, you can hit those ceilings and see throttling errors at the worst moments.',
    ),
    h3('5. You need to own or host the data'),
    p(
      'Some organizations must keep data in a particular region, on their own servers, or under their own backup regime. A multi-tenant SaaS cannot satisfy that, no matter how good it is. See our article on data ownership and self-hosting for more.',
    ),
    h3('6. The "app" has become a product'),
    p(
      'When an Airtable base starts to behave like an application, with custom dashboards, external users, strict workflows and integrations, you start feeling that its interface layer is a thin skin over a spreadsheet model. You may want real screens, roles and logic.',
    ),
    callout(
      'Not every sign requires leaving. Two or three of these may be solved by restructuring a base or upgrading a plan. Four or more usually indicate a structural mismatch.',
    ),
    h2('The options'),
    h3('Stay and tune'),
    p(
      'Consolidate fields, archive intelligently, replace formulas with rollups, remove unused automations and downgrade viewers to interface-only access where your plan allows it. Cheap and sensible if the pain is mild.',
    ),
    h3('Move to another no-code database'),
    p(
      'Alternatives with a similar model include NocoDB, Baserow, SeaTable and Notion databases for lighter use. Open-source options let you self-host. The trade-off is that the interface layer, permissions and automation depth vary a lot between them, so list your must-haves first.',
    ),
    h3('Move to an application platform'),
    p(
      'Platforms such as Integram, and low-code builders in the Retool or Budibase family, treat the database and the application as separate layers: typed tables with relations underneath, and forms, role-based screens, reports and an API on top. This is the right direction when you want internal tools or client portals with real access rules, and when you want usage-based rather than seat-based costs.',
    ),
    h3('Build custom'),
    p(
      'A bespoke web app on Postgres or MySQL gives you total control and total responsibility. Worth it when the process is your competitive advantage and you have developers to maintain it. Overkill for most teams, though AI-assisted development has lowered the bar.',
    ),
    h2('A migration plan that avoids drama'),
    ol(
      'Inventory. List every base, table, view, automation, interface, form, integration and who uses each. Teams are usually surprised by how much has accumulated.',
      'Decide what to leave behind. Dead views, abandoned automations and fields nobody fills in do not need to move.',
      'Export. Use CSV export per table, keeping the primary field and the record IDs. Attachments need separate handling: download them and plan where they will live.',
      'Rebuild the model first, not the screens. Create tables, column types and relationships in the target system. Linked records usually need to be re-created by matching on a unique key, such as an email or an order number, so export those keys.',
      'Import in dependency order: independent tables first (customers, products), then the tables that link to them (orders), then the join tables.',
      'Rebuild the views, forms and automations that people actually use. Prioritize by daily usage.',
      'Parallel run for one to two weeks. New data goes into the new system, and you compare reports with the old base.',
      'Cut over, set the old base to read-only, and keep it for a defined period. Do not delete it on day one.',
    ),
    h2('Common migration pitfalls'),
    ul(
      'Formulas do not transfer. Airtable formulas, rollups and lookups must be re-implemented. Document the logic before you start.',
      'Multi-select and linked-record fields export as comma-separated text. Plan the re-linking step explicitly.',
      'Automations and integrations are the long tail. Ask the people who use the base what silently happens when a record changes: emails, Slack messages, invoice generation.',
      'Forgetting the people. Even a better tool fails if users are not trained. Migrate one team first and let it advocate.',
      'Underestimating attachments. Large files can dominate the time of a migration.',
    ),
    h2('How AI changes the migration'),
    p(
      'Much of a migration is mechanical, which is where AI agents are useful. An agent connected to the destination via MCP or a REST API can read your exported CSVs, propose the target schema, create tables and columns, load the data in the right order, and rebuild links by matching keys. It can also generate a checklist of discrepancies between source and destination counts. You still own the decisions, particularly what to leave behind and how roles should work, but the repetitive hours shrink to minutes.',
    ),
    h2('Is it worth it?'),
    p(
      'Ask three questions. How much do you pay today, and how much of it is for users who barely use the system? How often do limits or permissions force a workaround? And how much would it cost you if the data were unavailable, or if you had to prove where it lives? If the answers are "a lot", "weekly" and "a lot", the migration pays for itself. If they are "little", "rarely" and "we could live with it", stay where you are. Airtable is a very good tool; the goal is not to leave it, but to use the tool that fits the stage you are at.',
    ),
  ],
}
