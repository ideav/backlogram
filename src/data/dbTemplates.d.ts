// Типы для src/data/dbTemplates.mjs (plain-ESM данные, общие для React и пререндера).

export interface DbtLink {
  text: string
  href: string
  external?: boolean
  primary?: boolean
}

export interface DbtTemplate {
  id: string
  name: string
  audience: string
  task: string
  inside: string[]
  links: DbtLink[]
}

export const DBT_META: { path: string; title: string; h1: string; description: string; keywords: string }
export const DBT_INTRO: string
export const DBT_CATALOG: DbtTemplate[]
export const DBT_CREATE: { id: string; title: string; steps: { text: string; link?: DbtLink }[] }
export const DBT_OWN: {
  id: string
  title: string
  audience: string
  intro: string
  steps: string[]
  notes: string[]
}
export const DBT_LIMITS: { id: string; title: string; items: string[] }
export const DBT_CTA: DbtLink[]
export const DBT_RELATED: { id: string; title: string; links: DbtLink[] }
