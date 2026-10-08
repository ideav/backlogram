import type { KbArticle } from '../types'
import { h2, h3, p, ul, ol, callout } from './blocks'

export const article: KbArticle = {
  slug: 'turn-excel-or-google-sheets-into-a-web-app',
  title: 'How to turn an Excel or Google Sheets file into a web app',
  description:
    'A practical guide to moving a business spreadsheet into a real web app with forms, roles and reports: what to clean up, how to model the data, and what to expect from the first version.',
  date: '2026-09-15',
  readingMinutes: 7,
  tags: ['excel', 'google sheets', 'web app', 'no-code', 'getting started'],
  blocks: [
    p(
      'Almost every company runs something important out of a spreadsheet: orders, leads, stock, onboarding checklists, a project plan. It starts as a quick fix and grows for years. At some point the file becomes the system, and the person who built it becomes a single point of failure. This guide walks through what it actually takes to turn that file into a web app that several people can use at once, safely, from any device.',
    ),
    h2('Why a spreadsheet stops being enough'),
    p(
      'Spreadsheets are brilliant for analysis and for thinking out loud. They are much weaker as operational systems. The warning signs are remarkably consistent across teams:',
    ),
    ul(
      'Two people edit at the same time and one of them overwrites the other, or a "final_v7_REAL.xlsx" circulates by email.',
      'Everyone sees everything. You cannot let a contractor see only their own rows without sending them a separate copy.',
      'Formulas break quietly. One sorted column or one pasted range and totals are wrong without any visible error.',
      'The same customer is typed three different ways, so filters and pivot tables miss rows.',
      'Nothing records who changed what, so disputes are settled by memory.',
      'Phone use is painful, and nobody can fill in a sheet properly from a warehouse floor or a client site.',
    ),
    p(
      'If three or more of these sound familiar, the issue is not that you chose the wrong spreadsheet. The issue is that the job has changed from "calculate" to "run a process", and a process needs structure, permissions and a history.',
    ),
    h2('What a web app gives you that a file does not'),
    p(
      'A web app built on a database replaces a grid of cells with typed tables. Each column has a type (text, number, date, choice, link to another record), each row is a record, and the screen people use is separate from the data underneath. That separation is what unlocks everything else:',
    ),
    ul(
      'Forms for entering data, with validation, so a date field only accepts dates.',
      'Roles and access rights, so a salesperson sees their accounts and a manager sees the team.',
      'Reports and dashboards that always read live data instead of a pasted snapshot.',
      'A change history per record.',
      'An API, so other tools and AI agents can read and write the same data.',
    ),
    h2('Step 1: Clean the file before you import it'),
    p(
      'The quality of the app is capped by the quality of the data you start with. Spend an hour on the file before touching any tool.',
    ),
    ol(
      'Make sure there is one header row, and that every column has a clear, unique name.',
      'Remove merged cells, blank spacer rows, and totals rows in the middle of the data. Totals belong in reports, not in the table.',
      'Make each column hold one kind of thing. If a "Status" column contains "done", "Done ", "DONE" and "finished", normalize it now.',
      'Split cells that contain lists ("Alice, Bob") into a separate sheet or note them for later: those are relationships, not text.',
      'Delete obvious duplicates and decide what uniquely identifies a row (an order number, an email, a SKU).',
    ),
    callout(
      'Rule of thumb: if you can describe each sheet as "one row per [thing]", it is ready to become a table. If you cannot, split it first.',
    ),
    h2('Step 2: Decide what the tables really are'),
    p(
      'Most business spreadsheets are secretly several tables squeezed into one. An "Orders" sheet often has the customer name, phone and address repeated on every order row, plus product names, plus a delivery status. In a database you would separate these:',
    ),
    ul(
      'Customers: one row per customer, with contact details stored once.',
      'Products: one row per product, with price and unit.',
      'Orders: one row per order, linked to a customer.',
      'Order lines: one row per product in an order, linked to both the order and the product.',
    ),
    p(
      'This is the same idea behind relational databases and, in simplified form, behind linked records in Airtable or relations in Notion. If you want the longer argument, read our article on relational data versus spreadsheets. For a first version it is fine to start with the two or three tables that matter most and add the rest later.',
    ),
    h2('Step 3: Import and set column types'),
    p(
      'Modern platforms, including Integram, can import an Excel or CSV file and create a table with columns inferred from the data. Treat the inference as a first draft. Walk through each column and confirm its type: dates as dates, money as numbers with a fixed number of decimals, statuses as a fixed list of choices rather than free text. Fixed lists are the single most effective data-quality feature you can switch on, because they stop the "Done / done / DONE" problem at the source.',
    ),
    p(
      'Where a column holds a reference to another entity (a customer, a project, an employee), convert it into a link to a record in the other table. This replaces typed names with picked values, and renaming a customer later changes it everywhere.',
    ),
    h2('Step 4: Build the screens people actually use'),
    p(
      'A raw table view is not an app. Think about who uses the data and what they do all day:',
    ),
    ul(
      'The person entering data needs a short form with only the fields they must fill in, not a 40-column grid.',
      'The person running the process needs a filtered list of "what needs my attention today", for example orders awaiting shipment.',
      'The manager needs a report or dashboard: totals by status, by month, by owner.',
      'An external party, such as a customer or supplier, may need a public form or a limited view of their own records.',
    ),
    p(
      'Build the first two screens, put real people in front of them for a day, and only then polish. Teams that try to design every screen up front tend to build the wrong ones.',
    ),
    h2('Step 5: Set up roles before you invite anyone'),
    p(
      'It is tempting to give everyone full access to get started and tighten later. In practice later never comes. Decide on three or four roles on day one, such as Administrator, Manager, Staff and Read-only, and assign what each can see, create, edit and delete per table. Our article on access control for teams goes deeper on how to do this without creating an administrative burden.',
    ),
    h2('Step 6: Run both systems in parallel for a short time'),
    p(
      'Do not switch off the spreadsheet on the same day you launch the app. Run both for one or two weeks, entering data into the app and comparing totals against the old file at the end of each day. Differences are almost always one of three things: a rule that lived only in someone\'s head, a formula the old file applied silently, or a data-entry shortcut that the form does not allow. Each difference is a requirement you have just discovered, and it is far cheaper to find it now than after the file is archived.',
    ),
    h2('Using an AI agent to speed this up'),
    p(
      'The slowest part of this process is usually not the import. It is the modeling: deciding which tables exist, how they link, what the forms look like. This is where an AI agent helps most. Given your file and a two-sentence description of the business ("we sell and install windows; each job has a quote, a survey and an installation"), an agent can propose the table structure, create the tables, configure the roles and generate the first forms through the platform\'s API or MCP server. You review the result the way you would review a proposal from a consultant, and ask for changes in plain language.',
    ),
    p(
      'The important caveat is control. Make sure the agent works with the same permissions a human user would have, that structural changes (dropping a table, deleting data) require confirmation, and that its actions show up in a history you can read. Those are properties of the platform, not of the AI model, so check them before you grant access to real data.',
    ),
    h2('What to expect from the first version'),
    p(
      'A realistic first version covers the core process end to end for one team: data entry through forms, a working list view per role, one or two reports, and basic access rules. It will not replicate every cell of the old workbook, and that is fine. Resist the urge to carry over every legacy column; the ones nobody has looked at in a year can stay in an archived copy of the original file.',
    ),
    p(
      'After the first month you will know which parts of the process are really painful and which were just historical habit. That is the right moment to add automations, notifications and integrations, rather than at the start.',
    ),
    h2('A short checklist'),
    ol(
      'Clean headers, remove merged cells and in-table totals.',
      'Identify the real entities and split the file into tables.',
      'Import, then fix column types, choices and links.',
      'Build one form and one working list per role.',
      'Define roles before inviting people.',
      'Run in parallel with the old file for one to two weeks.',
      'Archive the spreadsheet as read-only once totals match.',
    ),
    p(
      'Done well, the move from spreadsheet to web app is not a big-bang IT project. It is a series of small, reversible steps, and the first useful version can be live within days rather than quarters.',
    ),
  ],
}
