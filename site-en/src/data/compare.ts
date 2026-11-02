/**
 * Comparison pages: Integram vs Airtable / Smartsheet / Notion / Supabase.
 *
 * Rule for this file: competitor cells describe what the vendor publicly
 * offers, in qualitative terms, and each page links to the vendor's own
 * pricing page instead of quoting numbers that change every quarter. Where the
 * competitor is the better choice, the page says so.
 */

export interface CompareRow {
  label: string
  us: string
  them: string
}

export interface Competitor {
  slug: 'airtable' | 'smartsheet' | 'notion' | 'supabase'
  name: string
  pricingUrl: string
  title: string
  description: string
  headline: string
  intro: string
  rows: CompareRow[]
  chooseThem: string[]
  chooseUs: string[]
  migration: string
  faq: { q: string; a: string }[]
}

const COMMON_US = {
  pricing: 'Flat monthly price per workspace, metered by actions. Free tier, Team $29/mo for up to 10 users, Business $99/mo for unlimited users.',
  selfHost: 'Yes. Docker container on your own servers, works offline.',
  agents: 'MCP server for Claude and other MCP clients, plus a REST API that covers schema, roles and data. Agents act with the same permissions as a user.',
  rights: 'Roles control access to tables, columns and individual rows.',
  excel: 'Upload .xlsx; tables, data types and links between sheets are detected for you.',
}

export const COMPETITORS: Competitor[] = [
  {
    slug: 'airtable',
    name: 'Airtable',
    pricingUrl: 'https://airtable.com/pricing',
    title: 'Integram vs Airtable: an Airtable alternative with flat pricing',
    description:
      'An honest comparison of Integram and Airtable: pricing model, relational data, row-level access, self-hosting and AI agent access via MCP.',
    headline: 'Integram vs Airtable',
    intro:
      'Airtable made relational data friendly and has the largest ecosystem in the category. Integram is for teams that hit its per-seat bill, its permission model or its cloud-only hosting, and for builders who want AI agents to work on the data directly.',
    rows: [
      { label: 'Pricing model', us: COMMON_US.pricing, them: 'Per seat, per month, with record and automation limits by plan.' },
      { label: 'Links between tables', us: 'Yes, references between any tables, including recursive and nested queries.', them: 'Yes, linked records and lookups. A core strength.' },
      { label: 'Access control', us: COMMON_US.rights, them: 'Base and interface-level permissions; finer controls on higher plans.' },
      { label: 'Self-hosting', us: COMMON_US.selfHost, them: 'No. Cloud only.' },
      { label: 'AI agents', us: COMMON_US.agents, them: 'Built-in Airtable AI features and a REST API.' },
      { label: 'Spreadsheet import', us: COMMON_US.excel, them: 'CSV and Excel import into a single table at a time; links are set up by hand.' },
      { label: 'Templates and integrations', us: 'A small set of templates; integrations through REST API and webhooks.', them: 'Large template gallery and many native integrations.' },
      { label: 'Custom screens', us: 'Plain HTML/CSS/JS templates you can edit.', them: 'Interface designer with ready-made components.' },
    ],
    chooseThem: [
      'You need a polished UI and a big template gallery today.',
      'Native integrations with dozens of SaaS tools matter more than price.',
      'Everyone on the team works in the cloud and per-seat cost is fine.',
    ],
    chooseUs: [
      'Your bill grows with every new teammate who only needs to look at data.',
      'Some rows must be invisible to some people: salaries, client lists, margins.',
      'The data has to stay on your own servers.',
      'You want Claude or another agent to create tables and records through MCP.',
    ],
    migration:
      'Export each Airtable table to CSV, put them into one workbook, and upload it. Integram detects the columns that reference other tables and turns them into links. Check the detected structure, invite the team, done.',
    faq: [
      {
        q: 'Is Integram a drop-in Airtable replacement?',
        a: 'For the data and the access rules, mostly yes. For the integration ecosystem, no: Airtable has far more native connectors. Integram covers integrations through its REST API, webhooks and MCP.',
      },
      {
        q: 'Will my linked records survive the move?',
        a: 'Links are rebuilt from the exported values. Columns that contain names of records from another table are detected as references; you confirm them before import.',
      },
    ],
  },
  {
    slug: 'smartsheet',
    name: 'Smartsheet',
    pricingUrl: 'https://www.smartsheet.com/pricing',
    title: 'Integram vs Smartsheet: a relational Smartsheet alternative',
    description:
      'Integram vs Smartsheet compared honestly: sheets versus relational tables, access control, self-hosting, pricing model and AI agent access.',
    headline: 'Integram vs Smartsheet',
    intro:
      'Smartsheet is a spreadsheet-shaped work management tool with excellent Gantt charts and enterprise reach. Integram is a database-shaped app builder: when your data is really several related tables rather than one long sheet, it fits better.',
    rows: [
      { label: 'Pricing model', us: COMMON_US.pricing, them: 'Per member, per month, with a minimum number of seats on team plans.' },
      { label: 'Data model', us: 'Relational: separate tables with references between them.', them: 'Sheets with rows and columns; cross-sheet references and reports connect them.' },
      { label: 'Access control', us: COMMON_US.rights, them: 'Sharing per sheet, workspace or report; row-level visibility through reports and dynamic views.' },
      { label: 'Self-hosting', us: COMMON_US.selfHost, them: 'No. Cloud only.' },
      { label: 'AI agents', us: COMMON_US.agents, them: 'Built-in Smartsheet AI features and a REST API.' },
      { label: 'Project timelines', us: 'Possible with dates and reports, but not a Gantt-first tool.', them: 'Gantt, dependencies and resource views. A core strength.' },
      { label: 'Spreadsheet import', us: COMMON_US.excel, them: 'Excel import to a single sheet.' },
    ],
    chooseThem: [
      'Your work is mostly project schedules with dependencies and a Gantt view.',
      'Your company already standardized on it and needs enterprise governance features.',
    ],
    chooseUs: [
      'You keep copying the same customers or products between sheets.',
      'You need a real database with references, not a grid that imitates one.',
      'You want a flat bill instead of paying for every member.',
      'You want to self-host or connect AI agents to the data through MCP.',
    ],
    migration:
      'Export your sheets to Excel and upload the workbook. Columns that repeat values from another sheet become references, so customers and products exist once.',
    faq: [
      {
        q: 'Can Integram show a Gantt chart?',
        a: 'Not as a first-class view. If project scheduling is the main job, Smartsheet is the better tool; if the projects are one table among orders, clients and invoices, Integram keeps them related.',
      },
    ],
  },
  {
    slug: 'notion',
    name: 'Notion',
    pricingUrl: 'https://www.notion.com/pricing',
    title: 'Integram vs Notion databases: when Notion is not enough',
    description:
      'Notion vs Integram for business data: databases, relations, row-level permissions, self-hosting, flat pricing and AI agents through MCP and REST API.',
    headline: 'Integram vs Notion',
    intro:
      'Notion is the best place for documents, wikis and light databases. Integram is for the moment your Notion database turns into an operational system with thousands of rows, strict roles and reports people rely on.',
    rows: [
      { label: 'Pricing model', us: COMMON_US.pricing, them: 'Per member, per month; AI features on top on some plans.' },
      { label: 'Databases', us: 'Relational tables built for operational data and reporting.', them: 'Databases inside pages, with relations and rollups.' },
      { label: 'Access control', us: COMMON_US.rights, them: 'Page and database-level sharing; person-based access rules on databases in some plans.' },
      { label: 'Self-hosting', us: COMMON_US.selfHost, them: 'No. Cloud only.' },
      { label: 'AI agents', us: COMMON_US.agents, them: 'Notion AI built in, a REST API and an MCP server.' },
      { label: 'Documents and wiki', us: 'Not a document editor.', them: 'Excellent. A core strength.' },
      { label: 'Spreadsheet import', us: COMMON_US.excel, them: 'CSV import into a database.' },
    ],
    chooseThem: [
      'Most of what you store is text: docs, notes, specs, wikis.',
      'Your databases are small and everyone may see everything.',
    ],
    chooseUs: [
      'Different people must see different rows of the same table.',
      'Your reports are queries across several related tables.',
      'You want the operational data on your own server.',
      'You want an AI agent to manage the schema and access rules, not only to read pages.',
    ],
    migration:
      'Keep Notion for documents. Export the databases that run operations to CSV, upload them to Integram, and link to Integram screens from your Notion pages.',
    faq: [
      {
        q: 'Should we leave Notion entirely?',
        a: 'Usually not. Teams keep Notion for docs and move the operational databases, the ones with roles, volume and reports, into Integram.',
      },
    ],
  },
  {
    slug: 'supabase',
    name: 'Supabase',
    pricingUrl: 'https://supabase.com/pricing',
    title: 'Integram vs Supabase: a business app without a development team',
    description:
      'Integram vs Supabase compared honestly: a no-code app builder versus a Postgres backend for developers. Pricing model, row-level security, self-hosting, Excel import and AI agents.',
    headline: 'Integram vs Supabase',
    intro:
      'Supabase is an open-source Postgres backend for developers: database, auth, storage and APIs, with the screens left to you. Integram shares several of its strengths (relational data, row-level rules, self-hosting, no per-seat bill), but it is aimed at the team that needs a working business app and has no developer to build the front end.',
    rows: [
      { label: 'Who builds the app', us: 'Business users in the browser: tables, forms, reports and roles without code.', them: 'Developers. Supabase is the backend; the user interface is code you write and host.' },
      { label: 'Pricing model', us: COMMON_US.pricing, them: 'Free tier, then a monthly fee per organization plus usage-based compute, storage and traffic. Not per seat.' },
      { label: 'Data model', us: 'Relational tables with references, recursive and nested queries.', them: 'Full Postgres: SQL, extensions, functions and triggers. A core strength.' },
      { label: 'Access control', us: COMMON_US.rights + ' Set up in the interface.', them: 'Postgres row-level security policies written in SQL. Very powerful, but someone has to write them.' },
      { label: 'Self-hosting', us: COMMON_US.selfHost, them: 'Yes. Open source, self-hosted with Docker.' },
      { label: 'AI agents', us: COMMON_US.agents, them: 'An MCP server aimed at development tools, plus auto-generated APIs over the database.' },
      { label: 'Spreadsheet import', us: COMMON_US.excel, them: 'CSV import into one table at a time; relations are defined in SQL.' },
      { label: 'Screens for end users', us: 'Forms, tables, reports and dashboards out of the box; HTML/CSS/JS templates when you want your own.', them: 'None for end users; the dashboard is for developers. You build the app.' },
    ],
    chooseThem: [
      'You are a development team building your own product with its own front end.',
      'You need raw Postgres: extensions, custom SQL, realtime subscriptions, edge functions.',
      'The app serves your customers at consumer scale, not your own team.',
    ],
    chooseUs: [
      'Nobody on the team writes code, and the app is needed this week.',
      'The data lives in Excel today and the links between sheets should survive the move.',
      'Access rules should be set by an admin in the interface, not written as SQL policies.',
      'You want an AI agent to build tables, forms and roles through MCP, not only to query a database.',
    ],
    migration:
      'Export the Supabase tables to CSV, put them into one workbook and upload it; columns that reference other tables become links. Many teams use both: Supabase behind the customer-facing product, Integram for the internal operations around it.',
    faq: [
      {
        q: 'Is Integram a Supabase alternative?',
        a: 'Only for some jobs. If you are building a product with your own front end, Supabase is the better foundation. If you need an internal business app (CRM, orders, inventory) and have no developers, Integram gives you the whole app, not only the backend.',
      },
      {
        q: 'Both have row-level security. What is the difference?',
        a: 'Supabase uses Postgres policies written in SQL, which is flexible and owned by developers. In Integram an admin sets roles for tables, columns and rows in the interface, and AI agents act under the same rules as a user.',
      },
    ],
  },
]
