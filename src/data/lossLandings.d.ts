export const LOSS_SITE: string
export const LOSS_CTA_URL: string
export const LOSS_BA_URL: string
export const LOSS_PHONE: { text: string; href: string }
export const LOSS_EMAIL: string
export const LOSS_CALC_NOTE: string
export const LOSS_DEFAULT_CTA: string
export const LOSS_DEFAULT_RESULT_LABEL: string

export interface LossField {
  id: string
  label: string
  unit?: string
  value: number
  step?: number
  hint?: string
}
export interface LossPart {
  label: string
  /** Формула текстом — показывается в «Допущениях расчёта». */
  text: string
  /** Формула как функция: v('id') — число из поля. */
  fn: (v: (id: string) => number) => number
}
export interface LossCalc {
  title: string
  goal: string
  base?: string
  baseMul?: number
  baseLabel?: string
  resultLabel?: string
  ctaText?: string
  fields: LossField[]
  assumptions: LossField[]
  parts: LossPart[]
}
export interface LossCase {
  title: string
  segment: string
  headline: string
  story: { h: string; p: string }[]
  headers: string[]
  table: { metric: string; before: string; after: string }[]
  note?: string
}
export interface LossLanding {
  slug: string
  indexable: boolean
  /** Сначала спросить ИНН и подставить данные ФНС (backlogram#913). */
  inn?: boolean
  /** Куда ведёт «Как это остановить…»; по умолчанию LOSS_CTA_URL (backlogram#919). */
  ctaUrl?: string
  navTitle: string
  seoTitle: string
  metaDescription: string
  kicker: string
  h1: string
  lead: string
  heroCta?: string
  heroCta2?: string
  pains?: { title: string; items: { title: string; text: string }[] }
  calc: LossCalc
  case?: LossCase
  steps?: { title: string; items: { title: string; text: string }[] }
  /** Как в решении используется ИИ (backlogram#921): от основного к редкому. */
  ai?: { badge: string; title: string; lead: string; items: { freq: string; title: string; text: string }[] }
  faq?: { q: string; a: string }[]
  final: { title: string; text: string }
  related: { href: string; label: string }[]
}

export const LOSS_LANDINGS: LossLanding[]
export const LOSS_INDEXABLE: LossLanding[]
