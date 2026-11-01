// Типы для src/data/siteSections.mjs (plain-ESM данные, общие для React и пререндера).

export interface SectionLink {
  title: string
  body: string
  href: string
  external?: boolean
}

export interface SectionBlock {
  h2: string
  intro: string
  links: SectionLink[]
}

export interface SectionCta {
  text: string
  href: string
  external?: boolean
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
  /** id услуг из src/data/services.mjs для блока цен, null — без блока. */
  pricing: string[] | null
  pricingIntro: string | null
  faq: { q: string; a: string }[]
}

export const SITE: string
export const SANDBOX_URL: string
export const DOCS_URL: string
export const SITE_SECTIONS: SiteSection[]
export function siteSectionBySlug(slug: string): SiteSection | undefined
