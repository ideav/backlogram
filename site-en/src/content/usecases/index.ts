import type { UseCase } from '../types'

/**
 * Use cases. This file is a placeholder with one sample entry; the content
 * stream replaces it with the full set of ten (slugs fixed by the contract:
 * crm, inventory, orders, project-tracking, hr-onboarding, asset-management,
 * ai-knowledge-base, client-portal, field-service, budgeting).
 */
export const useCases: UseCase[] = [
  {
    slug: 'inventory',
    title: 'Inventory tracking app',
    metaDescription:
      'Replace the shared stock spreadsheet with an inventory app: items, locations, receipts and write-offs, with roles and live stock levels.',
    headline: 'Inventory that is right the first time you look',
    subheadline:
      'Turn the stock spreadsheet everyone is afraid to touch into a shared app with receipts, write-offs and live stock levels per location.',
    audience: 'Warehouse leads, operations managers and small e-commerce teams.',
    pains: [
      'Several copies of the stock file, none of them current.',
      'Stock levels recalculated by hand at the end of every week.',
      'Anyone with the file can see purchase prices and margins.',
    ],
    solution: [
      { title: 'One list of items', text: 'Every SKU exists once and is referenced from receipts, orders and write-offs.' },
      { title: 'Movements, not overwrites', text: 'Stock is the sum of recorded movements, so history is never lost.' },
      { title: 'Roles', text: 'Warehouse staff record movements; only managers see costs.' },
    ],
    steps: [
      'Upload your current stock spreadsheet.',
      'Confirm the detected tables: items, locations, movements.',
      'Invite the team and assign roles.',
    ],
    aiAngle:
      'Connect an AI agent through MCP and ask it which items will run out next week, or have it draft purchase orders from low-stock items.',
    faq: [
      {
        q: 'Can I keep using barcodes?',
        a: 'Yes. A barcode is just a field on the item; scanners that type into a text field work out of the box.',
      },
    ],
    image: '/img/uc-inventory.png',
  },
]
