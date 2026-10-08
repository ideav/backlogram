import type { KbArticle } from '../types'
import { h2, h3, p, ul, ol, callout, code } from './blocks'

export const article: KbArticle = {
  slug: 'relational-data-vs-spreadsheets',
  title: 'Relational data vs spreadsheets: why linked tables beat one big sheet',
  description:
    'What a relational model is, why copy-pasted customer names and lookup formulas break at scale, and how to restructure a flat spreadsheet into linked tables without a computer science degree.',
  date: '2026-09-17',
  readingMinutes: 7,
  tags: ['relational data', 'spreadsheets', 'database design', 'airtable', 'notion'],
  blocks: [
    p(
      'Ask ten people who run a small business how they track their work and eight will say "a spreadsheet". Ask the same people what goes wrong and you hear the same stories: duplicated names, formulas that point at the wrong row, a lookup tab that nobody dares to touch. These are not user errors. They are what happens when relational information is forced into a flat grid.',
    ),
    h2('What "relational" means in plain words'),
    p(
      'Data is relational when the things you track are connected to each other. A customer places many orders. An order contains many products. A project has many tasks, and each task belongs to one person. Your business is full of these one-to-many and many-to-many connections, and the questions you ask of your data are almost always about them: "which customers ordered product X last quarter?", "how many open tasks does each person have?".',
    ),
    p(
      'A relational database models each kind of thing as its own table and expresses connections as links between rows. Instead of writing the customer\'s name, phone and address on every order, you create one customer record and let each order point to it. The point is simple: store every fact exactly once and refer to it everywhere else.',
    ),
    h2('How a flat sheet fails'),
    h3('Repeated data drifts apart'),
    p(
      'In a flat orders sheet, "Acme Ltd", "ACME Limited" and "Acme" are three customers as far as a pivot table is concerned. When Acme changes its address, you must update every row, and you will miss some. The data is not wrong because someone was careless; it is wrong because the structure invites inconsistency.',
    ),
    h3('Lookups become fragile'),
    p(
      'To avoid repetition, spreadsheet users add a second tab and use VLOOKUP, INDEX/MATCH or XLOOKUP to pull in details. It works until someone inserts a column, sorts one range but not the other, or renames a key. Lookups also match on text, so a trailing space silently breaks them. The workbook now contains a hidden dependency graph that only its author understands.',
    ),
    h3('Many-to-many relationships have no good home'),
    p(
      'A project with several team members, where each member works on several projects, is a many-to-many relationship. In a sheet people store it as a comma-separated list in one cell ("Alice, Bob, Carol"). You can no longer filter by person, count tasks per person or give each person a view of only their work, because the information is trapped inside a text string.',
    ),
    h3('Aggregates are manual'),
    p(
      'Totals per customer, per month or per product are computed by SUMIF formulas or pivot tables that must be refreshed or re-pointed whenever the data grows. In a relational system, a roll-up field on the customer record simply sums the linked orders and is always current.',
    ),
    h2('The same data, modeled properly'),
    p('Take a service business that tracks jobs. Flat version, one row per job:'),
    code(
      'Job | Customer | Phone | Address | Technician | Tech phone | Service | Price | Status\n101 | Acme Ltd | 555-0101 | 12 High St | Maria | 555-0188 | Install | 480 | Done\n102 | ACME Limited | 555-0101 | 12 High St | Maria | 555-0188 | Repair | 120 | Open',
    ),
    p('Relational version, three small tables:'),
    ul(
      'Customers: name, phone, address.',
      'Technicians: name, phone, skills.',
      'Jobs: service, price, status, plus a link to one customer and a link to one technician.',
    ),
    p(
      'Now a customer\'s address lives in one place. A technician\'s phone number is edited once. The customer record can show a live list of its jobs and a roll-up of total billed. A technician\'s workspace can show only the jobs linked to them. You did not add any formulas to get these behaviors; they fall out of the structure.',
    ),
    h2('How the popular tools handle relations'),
    p(
      'Spreadsheets and databases are not opposites; there is a spectrum, and modern tools sit in the middle.',
    ),
    ul(
      'Excel and Google Sheets: flat grids with lookup formulas. Excel\'s Data Model and Power Query add real relationships, but they are specialist features that sit beside the sheet rather than in it, and Google Sheets has no equivalent.',
      'Airtable: a spreadsheet-like interface on top of linked records, lookups and rollups. Excellent for small relational problems; its limits show up around record counts per base, permissions granularity and per-seat pricing as teams grow.',
      'Notion: databases with relation and rollup properties. Great for documents and light structured data, less comfortable once you need many thousands of rows, strict validation or fine-grained access rules.',
      'Smartsheet: sheet-centric with cross-sheet references, strongest for project plans and schedules.',
      'Application platforms such as Integram or Retool-style tools backed by a real database: tables with typed columns and links as a first-class concept, with forms, roles and APIs built around them.',
    ),
    h2('A practical method for restructuring a flat sheet'),
    ol(
      'List the nouns. Read through your columns and write down every distinct thing they describe: customer, product, technician, job, invoice.',
      'Pick a unique identifier for each noun. It can be an ID you generate, an email, a SKU or an order number. Names are rarely unique enough.',
      'Move descriptive columns to the noun they describe. "Customer phone" belongs to Customer, not to Job.',
      'Replace the repeated text with a link. The Jobs table gets a "Customer" column that points at a record rather than holding a typed name.',
      'Turn comma-separated cells into links to several records, or into a join table when the relationship itself has attributes (for example a team member\'s hours on a project).',
      'Add roll-ups where you used to have SUMIF: total billed per customer, open tasks per person.',
    ),
    callout(
      'Test your design with three real questions you ask every month. If answering each one needs a fresh pivot table or a manual copy-paste, the model is not finished yet.',
    ),
    h2('Common mistakes'),
    ul(
      'Over-normalizing. You do not need a separate table for every attribute. A "status" with five values is a choice list, not a table.',
      'Using names as keys. People rename companies and get married. Keep a stable identifier and treat the name as editable data.',
      'Storing calculated values by hand. If a number can be derived from other records (order total, days overdue), derive it.',
      'Skipping the history. When rows are linked, deleting a customer can orphan their orders. Prefer archiving over deleting, and use a platform that warns you about dependent records.',
    ),
    h2('Where AI fits in'),
    p(
      'Restructuring is exactly the kind of task where a language model is useful. Given a sample of your flat sheet, an AI assistant can propose the tables, name the links and flag likely duplicates ("Acme Ltd" and "ACME Limited"), and an agent connected to the platform through an API or MCP can then create the tables and migrate the rows. Treat the output as a draft to review: models are good at the common patterns (customers, orders, tasks) and less reliable on the quirks of your particular business, which only you know.',
    ),
    p(
      'The reverse also matters. Language models answer questions about structured, linked data far more reliably than about a sprawling workbook. "Which customers have more than two open jobs assigned to Maria?" is a trivial query against linked tables and a fragile guess against a flat sheet. Good structure is the best prompt you can give an AI.',
    ),
    h2('When a spreadsheet is still the right tool'),
    p(
      'None of this means spreadsheets are bad. For one-off analysis, quick models, budgets with heavy formulas and anything a single person owns, they are hard to beat. The moment to move is when several people depend on the same data, when the same fact is typed in more than one place, or when you start building workarounds to keep two tabs in sync. At that point, linked tables are not an upgrade for its own sake. They remove an entire category of errors that no amount of care can prevent in a flat sheet.',
    ),
  ],
}
