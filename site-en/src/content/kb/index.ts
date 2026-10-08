import type { KbArticle } from '../types'

/**
 * Knowledge-base articles. This file is a placeholder with one sample entry;
 * the content stream replaces it with the full set. Every article here gets a
 * prerendered page at /knowledge-base/<slug> and a sitemap entry.
 */
export const articles: KbArticle[] = [
  {
    slug: 'spreadsheet-to-database',
    title: 'When a spreadsheet should become a database',
    description:
      'Five signs your shared spreadsheet has outgrown itself, and what moving it into a relational app actually changes for the team.',
    date: '2026-10-01',
    readingMinutes: 6,
    tags: ['spreadsheets', 'data modeling'],
    blocks: [
      {
        type: 'p',
        text: 'Spreadsheets are the best prototyping tool ever made. They become a problem when they quietly turn into the system of record for several people at once.',
      },
      { type: 'h2', text: 'Five signs it is time' },
      {
        type: 'ol',
        items: [
          'Two or more people edit the same file every day.',
          'You keep the same customer or product name in several tabs and they drift apart.',
          'Somebody has to hide columns before sharing the file.',
          'The monthly report takes a person a day to assemble.',
          'You have files named final_v3_REALLY_FINAL.xlsx.',
        ],
      },
      { type: 'h3', text: 'What changes after the move' },
      {
        type: 'ul',
        items: [
          'Each thing lives in one place and is referenced, not copied.',
          'Roles decide who sees which tables, columns and rows.',
          'Reports are queries, so they are always current.',
        ],
      },
      {
        type: 'quote',
        text: 'Keep the spreadsheet for thinking. Move the shared facts into a database.',
      },
      {
        type: 'callout',
        text: 'Integram imports your existing .xlsx file, detects the tables and the links between them, and gives you a working web app you can refine.',
      },
      { type: 'code', text: 'curl -H "Authorization: Bearer $TOKEN" https://your-workspace.example/api/...' },
    ],
  },
]
