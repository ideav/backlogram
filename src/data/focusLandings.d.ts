export const FOCUS_PATH: string
export const FOCUS_SITE: string
export const FOCUS_CTA_URL: string

export interface FocusHub {
  seoTitle: string
  metaDescription: string
  kicker: string
  h1: string
  lead: string
}
export interface FocusStep {
  title: string
  text: string
}
export interface FocusLanding {
  id: string
  navTitle: string
  kicker: string
  h1: string
  lead: string
  /** Фразы Директа из замера Вордстата (python2node#1194). */
  phrases: string[]
  pains: { title: string; text: string }[]
  we: string[]
  /** Обезличенный кейс: клиентов на лендингах не называем. */
  case: { segment: string; text: string }
  /** Что меряем на пилоте (не обещанный эффект). */
  metrics: string[]
  check: string
}

export const FOCUS_HUB: FocusHub
export const FOCUS_STEPS: FocusStep[]
export const FOCUS_LANDINGS: FocusLanding[]
export function focusById(id: string | null): FocusLanding | null
