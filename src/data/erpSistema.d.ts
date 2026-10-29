export interface ErpLink {
  label: string
  href: string
}

export interface ErpStep {
  h: string
  p: string
}

export interface ErpModule {
  key: string
  href?: string
  h: string
  best: string
  custom: string
}

export interface ErpProcessStep extends ErpStep {
  price: string
}

export const ERP_META: {
  path: string
  title: string
  h1: string
  description: string
  keywords: string
  publishedAt: string
  updatedAt: string
}
export const HERO_LEAD: string
export const HERO_CHIPS: string[]
export const READ_MORE: ErpLink[]
export const FORMULA: ErpStep[]
export const MODULES: ErpModule[]
export const COMPARE: { columns: string[]; rows: string[][] }
export const PROCESS: ErpProcessStep[]
export const FAQ: { q: string; a: string }[]
export const RELATED: ErpLink[]
export const FORM_HINTS: { task: string }
