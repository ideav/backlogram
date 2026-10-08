import type { KbArticle } from '../types'
import { h2, h3, p, ul, ol, callout } from './blocks'

export const article: KbArticle = {
  slug: 'notion-databases-and-their-limits',
  title: 'Notion as a database: what it does well and where it stops',
  description:
    'Notion databases, relations and rollups cover a lot of small-team needs. This guide explains where they shine, the limits you meet at scale, and when to pair Notion with a real application database.',
  date: '2026-10-06',
  readingMinutes: 7,
  tags: ['notion', 'databases', 'relations', 'knowledge management', 'comparison'],
  blocks: [
    p(
      'Notion began as a flexible notes-and-wiki tool and grew a very capable database feature. Many small teams now run projects, content calendars, CRMs and even light inventory out of Notion. That works remarkably well, up to a point. This article describes what Notion databases do, where people start to feel friction, and how to decide whether to stretch Notion or complement it with a purpose-built data platform.',
    ),
    h2('What Notion databases do well'),
    ul(
      'Documents and data together. Each row is a page, so a project record can hold meeting notes, specs, checklists and embedded files next to its structured properties. Few tools match this.',
      'Multiple views of one data set. Table, board, calendar, timeline and gallery views can be filtered and grouped differently for different people.',
      'Relations and rollups. You can link a database to another and aggregate across the link, for instance showing the total value of deals linked to a company.',
      'Templates. Recurring structures, such as a new-client page or a sprint plan, are quick to stamp out.',
      'A gentle learning curve. Non-technical team members can build what they need without waiting for IT.',
      'Collaboration features such as comments, mentions and page history, which are strong.',
    ),
    h2('Where friction appears'),
    h3('Scale and speed'),
    p(
      'Notion databases are comfortable with hundreds or low thousands of rows. As a database grows into tens of thousands of rows, with many relations and rollups, pages load more slowly and views become sluggish. Notion is optimized for documents, so it is natural that it is not a high-volume transactional store.',
    ),
    h3('Strictness of data'),
    p(
      'Property types exist (select, date, number, relation), but there is little enforcement beyond the type. Notion does not offer the validation rules, unique constraints or required-field logic that a form-driven application would. Data quality depends on discipline.',
    ),
    h3('Permissions'),
    p(
      'Access is granted at the workspace, page and database level. That is well suited to sharing documents. It is less suited to row-level rules like "each account manager sees only their accounts" or hiding specific columns from specific roles. Teams commonly build several filtered views and hope viewers do not open the underlying database; filtered views are a convenience, not a security boundary.',
    ),
    h3('Relations are lighter than in a database'),
    p(
      'Relations and rollups cover simple cases, but complex multi-step calculations, many-to-many with attributes on the join, and cross-table constraints are awkward. Rollup formulas are limited compared to a query language.',
    ),
    h3('Automation and forms'),
    p(
      'Notion has database automations, buttons, and form-like entry, and it connects to third-party tools. They are evolving but remain lighter than the workflow engines in dedicated platforms, and external-facing forms and portals with real access control usually require extra tools.',
    ),
    h3('API and agents'),
    p(
      'Notion exposes an API, and there are MCP integrations that let AI assistants read and write pages. That is useful, especially for knowledge retrieval. For large structured data sets, though, API rate limits and the document-oriented data model are constraints for heavy agent workloads.',
    ),
    h3('Cost per seat'),
    p(
      'Notion bills per member. Guests can be added in limited numbers on some plans, but a team that wants many occasional collaborators or external users sees cost rise with headcount. See our guide on per-seat versus usage-based pricing.',
    ),
    h2('A rule of thumb for what belongs where'),
    ul(
      'Notion is a good home for: documentation, wikis, meeting notes, OKRs, content calendars, lightweight project boards, small CRMs for a handful of people.',
      'A database platform is a better home for: operational records that many people create or edit all day (orders, tickets, inventory, time entries), data needing validation, external users with limited access, and anything feeding reports or other systems.',
    ),
    callout(
      'Many mature teams end up with both: Notion for knowledge and thinking, a relational application for transactions. The key is to avoid duplicating the same facts in both places.',
    ),
    h2('Signs it is time to add a real database'),
    ol(
      'A single database passes about ten thousand rows or needs more than a couple of rollups per row.',
      'You need external parties (clients, suppliers) to enter or view only their own records.',
      'Mistakes in data are costing money: wrong prices, wrong dates, duplicated customers.',
      'You need reports that join several tables and always show live numbers.',
      'You are building elaborate workarounds with filtered views to hide data.',
      'You want AI agents to work with the data at volume, with strict roles.',
    ),
    h2('How to combine them sensibly'),
    h3('Keep a clear system of record'),
    p(
      'Decide which tool owns each kind of fact. Customers, orders and invoices live in the application database. Notion holds the notes, the playbooks and the planning. Where Notion needs to show an order or a customer, link to the record in the application rather than copying the data.',
    ),
    h3('Move the table, keep the document'),
    p(
      'If a Notion database has grown into an operational system, export it to CSV and import it into the platform of your choice. Keep a Notion page per project or client for narrative content and put the link to the database record at the top. Relations will need to be re-created on a unique key, so make sure you export a column that can serve as one.',
    ),
    h3('Give AI one place to look'),
    p(
      'If an AI assistant is going to answer questions about your business, make sure the structured facts it needs are in one place with clear fields and permissions. Documents in Notion are good retrieval material; numbers and statuses are better served by tables with types and relations.',
    ),
    h2('Practical tips if you stay in Notion'),
    ul(
      'Use select properties for any value that repeats, never free text.',
      'Archive old rows to a separate database to keep active views fast.',
      'Keep rollup chains short. Replace a deep chain with an intermediate property.',
      'Limit the number of views per database and filter by default.',
      'Document your data model on a single page: what each database is for and how they connect.',
      'Assign an owner for each database who reviews it quarterly.',
    ),
    h2('Conclusion'),
    p(
      'Notion is an excellent canvas for thinking and documenting, and a reasonable database for small, document-centric data. Its limits are not defects but consequences of its design: flexibility over strictness. When your data becomes operational, with many writers, rules, external users and numbers that must be right, move that part to a platform built around typed tables, relations, roles and an API, and keep Notion for what it does best.',
    ),
  ],
}
