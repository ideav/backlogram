/**
 * English alt texts for every image in site-en/public/img (issue #532).
 * Keys are paths relative to /img/ without the extension, e.g. "uc-crm" or "og/home".
 * Use `getImageAlt('uc-crm')` for <img alt> and og:image:alt.
 */
export const imageAlt: Record<string, string> = {
  hero: 'Integram workspace showing an orders table linked to customers and products, with an AI assistant adding a customer tier through the Integram MCP tools.',
  'excel-to-app': 'A spreadsheet of clients on the left and the working Integram app generated from it on the right, with a clients table, relations and an edit form.',
  'ai-mcp': 'An AI assistant chat creating a Projects table in Integram through MCP tool calls, next to the JSON of the tool call and the resulting records.',

  'uc-crm': 'Integram CRM pipeline board with deal cards in Qualified, Proposal sent, Negotiation and Won stages and revenue KPIs in US dollars.',
  'uc-inventory': 'Integram inventory table with SKUs, warehouses, stock on hand and reorder levels, plus value by warehouse and reorder suggestions.',
  'uc-orders': 'Integram order management table with customers, totals and statuses, and a detail panel for one order with line items and a shipping label button.',
  'uc-project-tracking': 'Integram project timeline with tasks, owners, progress bars and a today marker for a website redesign project.',
  'uc-hr-onboarding': 'Integram HR onboarding view with progress cards for four new hires and a task checklist linked to contracts, equipment and accounts.',
  'uc-asset-management': 'Integram asset register with laptops, monitors and phones, who each is assigned to, warranty dates and a chart of assets by category.',
  'uc-ai-knowledge-base': 'Integram AI knowledge base chat answering a vacation policy question with cited source documents, next to usage and content health stats.',
  'uc-client-portal': 'Client portal built on Integram showing a balance due, invoices, documents to sign and a message from the accountant.',
  'uc-field-service': 'Integram dispatch board scheduling technicians across the day, with a job detail panel showing a checklist and an estimate.',
  'uc-budgeting': 'Integram budget versus actual dashboard with spend by department, pending approvals and a variance table.',

  'og/home': 'Integram: a no-code database for your business, with tables, relations, forms and reports built with AI.',
  'og/pricing': 'Integram pricing: simple plans that grow with you, starting free.',
  'og/excel-to-app': 'Integram Excel to app: turn your spreadsheet into a working app with forms, relations, roles and an API.',
  'og/ai': 'Integram AI and API: let your AI agents work with your data through an MCP server and REST API.',
  'og/compare-airtable': 'Integram compared with Airtable: unlimited records, built-in AI access and predictable pricing.',
  'og/compare-smartsheet': 'Integram compared with Smartsheet: relational data instead of grids, at a fraction of the cost.',
  'og/compare-notion': 'Integram compared with Notion: a real relational database when docs are not enough.',
  'og/use-cases': 'Integram use cases: business apps you can build in an afternoon, from CRM to inventory and budgeting.',
  'og/uc-crm': 'Integram use case: CRM for small teams.',
  'og/uc-inventory': 'Integram use case: inventory management.',
  'og/uc-orders': 'Integram use case: order management.',
  'og/uc-project-tracking': 'Integram use case: project tracking.',
  'og/uc-hr-onboarding': 'Integram use case: HR onboarding.',
  'og/uc-asset-management': 'Integram use case: asset management.',
  'og/uc-ai-knowledge-base': 'Integram use case: AI knowledge base.',
  'og/uc-client-portal': 'Integram use case: client portal.',
  'og/uc-field-service': 'Integram use case: field service management.',
  'og/uc-budgeting': 'Integram use case: budgeting and expense tracking.',
  'og/knowledge-base': 'Integram knowledge base: guides, tutorials and best practices.',
  'og/contact': 'Contact the Integram team: book a demo or ask a question.',
  'og/legal': 'Integram legal pages: terms, privacy and cookies.',
}

/** Alt text for `/img/<key>.png`; falls back to a generic description. */
export function getImageAlt(key: string): string {
  return imageAlt[key.replace(/^\/?img\//, '').replace(/\.png$/, '')] ?? 'Integram product screenshot'
}
