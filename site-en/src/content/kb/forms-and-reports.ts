import type { KbArticle } from '../types'
import { h2, h3, p, ul, ol, callout } from './blocks'

export const article: KbArticle = {
  slug: 'forms-reports-and-dashboards-for-small-teams',
  title: 'Forms, reports and dashboards: the three screens every small team needs',
  description:
    'How to design data-entry forms, operational reports and management dashboards on top of a business database, with practical rules for each and the mistakes that make them unused.',
  date: '2026-10-03',
  readingMinutes: 7,
  tags: ['forms', 'reports', 'dashboards', 'ux', 'internal tools'],
  blocks: [
    p(
      'A database is only as useful as the screens in front of it. Teams that move from spreadsheets to a proper app often start by staring at a table view that looks suspiciously like the old sheet, and wonder why nothing improved. The improvement comes from three kinds of screens, each with a different audience and a different job: forms to put data in, reports to work through it, and dashboards to see where you stand. Get these three right and you have an application; get them wrong and you have a nicer spreadsheet.',
    ),
    h2('Forms: make correct entry the easy path'),
    p(
      'The purpose of a form is to capture accurate data with minimal effort. The person using it is busy, often on a phone, and does not care about your data model. Design for them.',
    ),
    h3('Rules for good forms'),
    ul(
      'Ask only what you need now. Every extra field lowers completion rates and raises the chance of junk entries. A lead form with six fields almost always outperforms one with fifteen.',
      'Use typed controls. Dates should use a date picker, statuses a dropdown, customers a lookup from the customers table. Free text should be the exception.',
      'Validate at entry. Required fields, allowed ranges and formats catch problems when they are cheapest to fix.',
      'Prefill what you know. If the user is logged in, fill their name and team. If they came from a customer record, prefill the customer.',
      'Group and order fields in the sequence of the real-world task, not in the order of the table columns.',
      'Make mobile the baseline. Field staff, drivers and inspectors enter data on phones.',
      'Confirm clearly. Show what happened and what comes next ("Request #1042 created, the warehouse will confirm within a day").',
    ),
    h3('Internal and public forms'),
    p(
      'Internal forms are used by logged-in staff and can be rich: they can show related records and respect role permissions. Public forms, such as a website enquiry, a booking request or a support ticket, create records in a single table and nothing else. They must never expose existing data, and they should have basic spam protection such as a honeypot field or rate limiting.',
    ),
    h2('Reports: answer the question people ask every week'),
    p(
      'A report is a saved question about your data. The best reports are boring: "orders awaiting shipment", "invoices overdue by more than 14 days", "tasks assigned to me and due this week". They tell people what to do next, and they are the screens that get opened daily.',
    ),
    h3('What makes a report useful'),
    ul(
      'It has an obvious purpose in one sentence, and the title says it.',
      'It is filtered to the viewer. A salesperson opens "my open deals" and does not scroll through the company\'s.',
      'It shows the few columns needed to decide, with a link to the full record.',
      'It is sorted by urgency, not by creation date.',
      'It supports the action. If the next step is "call the customer", the phone number is on screen. If it is "approve", the approve button is there.',
      'It reads live data, so no one asks "is this up to date?".',
    ),
    h3('Types worth building first'),
    ol(
      'Work queues: items that need action now, by role.',
      'Exception lists: things that are wrong or late, such as missing data, overdue items and duplicates.',
      'Periodic summaries: totals by month, customer, product or owner, used in meetings.',
      'Exports: a clean table for accountants, auditors or partners who live in spreadsheets.',
    ),
    callout(
      'A good test: if a report cannot lead to a decision or an action within one minute, it is probably decoration. Archive it.',
    ),
    h2('Dashboards: the view from above'),
    p(
      'Dashboards compress many facts into a glance for managers and owners. They are the most overbuilt and least used of the three screens, because they are fun to design. Keep them disciplined.',
    ),
    h3('Principles'),
    ul(
      'Five to nine numbers, not forty. Each one should answer a question the owner asks regularly: revenue this month versus last, pipeline value, orders late, stock below minimum, open support requests.',
      'Show comparison and direction. A number without a comparison is trivia. Add the previous period, a target, or a trend line.',
      'Let numbers lead to detail. Clicking "Orders late: 7" should open the list of those seven orders.',
      'Prefer simple chart types: bars for comparison, lines for trend, a table for precision. Avoid decoration.',
      'Define every metric once. "Active customer" should mean the same thing on every screen.',
      'Respect permissions. A dashboard that shows totals can leak what a table hides, so check it per role.',
    ),
    h2('How the three fit together'),
    p(
      'Think of a loop. A form creates a record. A report surfaces records that need attention. A person acts on one, usually by editing it through another form. The dashboard counts what is happening and tells you which report to open. If any link in the loop is missing, work leaks out into email and chat. For example, an order enters through a form, appears in the "to be packed" report for the warehouse, moves to "shipped", and the dashboard shows daily shipments and late orders.',
    ),
    h2('A worked example: service requests'),
    ul(
      'Form: a public "Request service" form with name, contact, address, issue category and a photo upload. It creates a record with status "New".',
      'Work queue: dispatchers open "New requests, oldest first" and assign a technician from a lookup. Status becomes "Assigned".',
      'Technician view: "My jobs today", with a mobile form to add notes, photos and mark the job done.',
      'Exception report: "Requests open for more than 3 days without an assignee".',
      'Dashboard: requests per week, average time to close, late jobs, and workload by technician.',
    ),
    p(
      'Five small screens, one table, and a process that used to live in an inbox now has clear ownership.',
    ),
    h2('Common mistakes'),
    ul(
      'Building the dashboard first. Without clean data entry and working queues, the numbers are wrong and nobody trusts them.',
      'One mega-form for everyone. Different roles need different forms over the same table.',
      'Reports without owners. Someone should be responsible for each report and for retiring it when it stops being useful.',
      'Over-formatting. Time spent on colors is time not spent on clarity.',
      'Ignoring performance. A report that takes 30 seconds to load will not be used. Filter by default, paginate and avoid recomputing everything.',
    ),
    h2('Where AI can help'),
    p(
      'Language models are well suited to the scaffolding. Given the tables, an agent connected through an API or MCP server can propose the first set of forms and reports for each role, name them sensibly and set default filters. It can also write plain-language summaries on top of a report, for example a Monday digest of what changed and which exceptions need attention. As ever, keep a human in the loop for anything customer-facing, and check the output as each role would see it.',
    ),
    p(
      'Start with one form, one work queue and one number on a dashboard. Use them for a week, then add the next. Software that is used beats software that is comprehensive.',
    ),
  ],
}
