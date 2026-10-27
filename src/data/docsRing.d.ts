// Типы для src/data/docsRing.mjs (plain-ESM данные, общие для React и пререндеров).

export interface DocsRingItem {
  href: string
  name: string
  hint: string
}

export const DOCS_RING: DocsRingItem[]
export function docsRingFor(path: string): DocsRingItem[]
export function docsRingHtml(path: string): string
