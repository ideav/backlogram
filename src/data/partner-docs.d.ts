export interface PartnerDocLink {
  href: string
  text: string
}

export type PartnerDocBlock =
  | { p: string; link?: PartnerDocLink; list?: undefined }
  | { list: string[]; p?: undefined; link?: undefined }

export interface PartnerDocSection {
  id: string
  h: string
  blocks: PartnerDocBlock[]
}

export interface PartnerDoc {
  key: string
  meta: {
    path: string
    title: string
    description: string
    keywords: string
    updated: string
    updatedISO: string
    eyebrow: string
    h1: string
    crumb: string
  }
  intro: string
  sections: PartnerDocSection[]
}

export type PartnerDocKey = 'partner-offer' | 'adept-offer' | 'partner-adept'

export const PARTNER_DOCS: Record<PartnerDocKey, PartnerDoc>

export const PARTNER_DOCS_OPERATOR: {
  name: string
  inn: string
  ogrn: string
  email: string
  phone: string
  phoneHref: string
  site: string
}
