// Типы для src/data/siteSections.mjs (plain-ESM данные, общие для React и пререндера).

export interface SectionLink {
  title: string
  body: string
  href: string
  external?: boolean
}

export interface SectionCta {
  text: string
  href: string
  external?: boolean
}

export interface SectionItem {
  title: string
  text: string
  href?: string
  linkText?: string
}

export interface SectionCase {
  shot: 'orbita' | 'sovereignty' | 'pdn'
  title: string
  context: string
  before: string
  after: string
  task: string
  impl: string
  stats: { v: string; l: string }[]
  href: string
  linkText: string
}

interface BlockBase {
  id: string
  h2: string
  intro?: string
  more?: { text: string; href: string }
}

export type SectionBlock =
  | (BlockBase & { type: 'features'; items: SectionItem[]; note?: string })
  | (BlockBase & { type: 'steps'; steps: { title: string; text: string }[]; result?: string })
  | (BlockBase & { type: 'cases'; cases: SectionCase[] })
  | (BlockBase & { type: 'industries'; tags: string[]; items: SectionItem[] })
  | (BlockBase & { type: 'usecases' })
  | (BlockBase & { type: 'pricing'; services?: string[]; cloud?: boolean; ctaHref?: string })
  | (BlockBase & { type: 'form' })
  | (BlockBase & { type: 'links'; links: SectionLink[] })

export interface CloudPlan {
  id: string
  name: string
  note: string
  price: string
  unit: string
  featured?: boolean
  items: string[]
  cta: SectionCta
}

export interface SiteSection {
  slug: string
  route: string
  choice: string
  choiceNote: string
  icon: 'excel' | 'business' | 'developer'
  navName: string
  seoTitle: string
  metaDescription: string
  ogTitle: string
  ogDescription: string
  badge: string
  h1: string
  h1accent: string
  lead: string
  cta: SectionCta
  cta2: SectionCta
  blocks: SectionBlock[]
  faq: { q: string; a: string }[]
}

export const SITE: string
export const SANDBOX_URL: string
export const DOCS_URL: string
export const CONTACTS: { telegram: { label: string; href: string }; email: { label: string; href: string } }
export const CLOUD_PLANS: CloudPlan[]
export const CLOUD_NOTE: string
export const SITE_SECTIONS: SiteSection[]
export function siteSectionBySlug(slug: string): SiteSection | undefined
export function sectionLinks(section: SiteSection): { href: string; external?: boolean }[]
