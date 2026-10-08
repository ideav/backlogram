import type { KbArticle } from '../types'
import { h2, h3, p, ul, ol, callout } from './blocks'

export const article: KbArticle = {
  slug: 'excel-and-google-sheets-limits',
  title: 'Excel and Google Sheets limits: the hard caps and the soft ones that hurt first',
  description:
    'Row, cell and file limits in Excel and Google Sheets, plus the practical limits (collaboration, versions, permissions, performance) that force teams to look for something else.',
  date: '2026-10-01',
  readingMinutes: 7,
  tags: ['excel', 'google sheets', 'limits', 'performance', 'spreadsheets'],
  blocks: [
    p(
      'Every few weeks someone asks the internet how many rows Excel can handle, or why Google Sheets became so slow. The documented numbers matter, but they are rarely what ends a spreadsheet\'s useful life. Teams usually hit softer limits long before the hard ones. This article lists both and shows how to tell when you have reached the point of diminishing returns.',
    ),
    h2('The hard limits'),
    h3('Microsoft Excel'),
    ul(
      'A worksheet holds up to 1,048,576 rows and 16,384 columns (columns A to XFD).',
      'A cell can contain up to 32,767 characters, although only a fraction of that is displayed.',
      'File size is bounded mainly by available memory and by the 32-bit or 64-bit build of Excel; very large workbooks become slow and fragile long before an absolute limit.',
      'The Data Model used by Power Pivot can hold much more than a sheet, but it is a separate analytical layer, not an ordinary grid.',
    ),
    h3('Google Sheets'),
    ul(
      'A spreadsheet can contain up to 10 million cells across all its sheets. The limit counts cells in the grid, including empty ones, which is why trimming unused rows and columns helps.',
      'A sheet can have up to 18,278 columns.',
      'Imports and certain functions, such as IMPORTRANGE, have their own quotas and can fail with "result too large" or "loading" errors.',
      'Apps Script automations are subject to daily execution time and trigger quotas.',
    ),
    callout(
      'Limits change between product versions, so check the vendor\'s current documentation before you plan around a number. The point here is orders of magnitude, not decimals.',
    ),
    h2('The soft limits that arrive first'),
    h3('Performance'),
    p(
      'A sheet with tens of thousands of rows and a few hundred volatile or lookup formulas is already sluggish. Whole-column references, array formulas and cross-file links multiply the work every time any cell changes. Excel starts to lag when opening, saving or recalculating; Sheets starts to stall in the browser. Typical rescue attempts, such as switching to manual calculation or splitting the file, trade speed for new risks.',
    ),
    h3('Collaboration'),
    p(
      'Google Sheets supports simultaneous editing well. Excel files on a share drive do not: the second person gets a read-only copy, saves under a new name, and the files diverge. Even in Sheets, simultaneous editing means simultaneous mistakes: one person sorts a range, another has formulas pointing at the old positions.',
    ),
    h3('Version control'),
    p(
      'Version history exists, but it records snapshots of a file rather than meaningful business events. It tells you the sheet looked different on Tuesday; it does not tell you which customer\'s status was changed to "paid", by whom and why. File names like "Orders_final_v3_Anna_edit.xlsx" are the visible symptom.',
    ),
    h3('Data quality'),
    p(
      'Spreadsheets accept anything in any cell. You can add data validation, dropdowns and conditional formatting, but they are easy to bypass with a paste. Over time, dates become text, phone numbers lose leading zeros, and the same customer exists in four spellings.',
    ),
    h3('Permissions'),
    p(
      'Access is per file, and at best per sheet or range. You cannot say "this user sees only the rows where Region equals North" without keeping separate copies. The more sensitive the content, the more uncomfortable this becomes.',
    ),
    h3('Process logic'),
    p(
      'As soon as a spreadsheet is used to run a process (approve, assign, notify, escalate), people attach scripts, macros and email add-ons. These are written by whoever had time, rarely documented, and break when the author leaves or Google changes a quota.',
    ),
    h3('Relationships between entities'),
    p(
      'The more your information is about connected things (customers, orders, products, people), the more you pay for forcing it into one grid. See our article on relational data versus spreadsheets for the details.',
    ),
    h2('A self-diagnosis'),
    p('Give one point for each statement that is true for your main spreadsheet.'),
    ol(
      'It takes more than a few seconds to open or recalculate.',
      'More than three people edit it in an ordinary week.',
      'You have copies of it with different names.',
      'There are columns that only one person knows how to fill in.',
      'Some people must not see some rows or columns, and you handle that manually.',
      'You use macros or scripts to keep it working.',
      'The same value is typed in more than one place.',
      'You have been bitten at least once by a formula that silently pointed at the wrong range.',
    ),
    p(
      'Zero to two points: carry on, perhaps with a cleanup. Three to five: plan a move, starting with the most painful tab. Six or more: the file is already a system, and it deserves a proper home.',
    ),
    h2('What to do before leaving the spreadsheet'),
    ul(
      'Delete unused rows, columns and hidden sheets. Convert formulas that no longer need to be live into values.',
      'Replace whole-column references with exact ranges.',
      'Split archives from live data: move closed records to another file.',
      'Use data validation for statuses, categories and dates.',
      'Name the owner of the file and document what each tab is for.',
    ),
    p(
      'These steps often buy months. They do not change the underlying nature of the tool.',
    ),
    h2('What you gain by moving'),
    p(
      'A database-backed application removes the row ceiling in practice, because tables are stored as records in a real database rather than as cells in a grid. More importantly, it addresses the soft limits: typed columns and validation prevent bad data; forms make entry simple; roles control who sees what; a change history records business events; reports are always live; and an API lets other tools and AI agents work with the same data safely.',
    ),
    p(
      'You do not need to abandon the spreadsheet entirely. Keep it for analysis, scenario modeling and ad hoc exploration, and let it read from the application through an export or an API. The pattern that works best is a single system of record with spreadsheets as lenses on it, rather than spreadsheets that are the system of record.',
    ),
    h2('How to move gradually'),
    ol(
      'Pick the single most painful sheet, the one with the most editors or the most errors.',
      'Import it into a platform that supports Excel and CSV imports, then adjust the column types.',
      'Add a form for data entry and a list view for daily work.',
      'Let the team use both for a short while and compare totals.',
      'Retire the old sheet and repeat with the next one.',
    ),
    p(
      'Hard limits make good headlines, but the real signal is friction. If your team spends more time maintaining the spreadsheet than using what is in it, the limit has already been reached.',
    ),
  ],
}
