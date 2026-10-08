/**
 * Comparison pages: Integram vs Airtable / Smartsheet / Notion.
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
  slug: 'airtable' | 'smartsheet' | 'notion'
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
]
