export interface PartnerCard {
  h: string
  p: string
  n?: string
  big?: string
}

export interface PartnerSection {
  h: string
  p?: string
  note?: string
  cards: PartnerCard[]
}

export const PARTNERS_META: {
  path: string
  title: string
  h1: string
  description: string
  keywords: string
  publishedAt: string
  updatedAt: string
}

export const HERO_LEAD: string
export const DECKS: { href: string; label: string; primary: boolean }[]

export const FIRST_TEMPLATE: PartnerSection & {
  p: string
  example: { label: string; text: string; mark?: boolean }[]
}
export const AUDIENCE: PartnerSection & { p: string; note: string }
export const STEPS: { h: string; items: { p: string; who: string }[]; note: string }
export const LEVELS: PartnerSection
export const MONEY: PartnerSection & { note: string }

export interface PartnerList {
  h: string
  items: string[]
}
export const BOUNDARY: { h: string; p: string; self: PartnerList; us: PartnerList; note: string }
export const NO_PROMISES: PartnerSection
export const OWN_TEMPLATE: {
  h: string
  before: string
  link: { href: string; label: string }
  after: string
  note: string
}
export const JOIN: { h: string; p: string; cta: string; done: string }
export const DIRECT: { telegram: string; phone: string; phoneHref: string; hours: string }
export const LEAD_SOURCE: string
export function leadSummary(input?: { email?: string; comment?: string }): string
