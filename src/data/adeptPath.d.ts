export interface AdeptImage {
  src: string
  width: number
  height: number
  alt: string
}

export interface AdeptLink {
  label: string
  href: string
  /** Открывать в модальном окне вместо перехода (#769). */
  modal?: 'botReport'
}

export interface AdeptTimelineStep {
  t: string
  links?: AdeptLink[]
  shot?: AdeptImage
}

/** Как делались доработки по пожеланиям заказчика (#771). */
export interface AdeptRework {
  intro: string
  wishes: string[]
  how: string
  note: string
  links: AdeptLink[]
}

export interface AdeptCase {
  key: string
  name: string
  tagline: string
  origin: string
  budget: number
  hoursBilled: number | null
  hoursSpent: number
  phases: { name: string; budget: number | null; note: string }[]
  app: AdeptLink
  timeline: AdeptTimelineStep[]
  rework?: AdeptRework
  result: string
  images: AdeptImage[]
}

export interface AdeptStep {
  h: string
  p: string
  cta: { label: string; href: string } | null
}

export const ADEPT_META: {
  path: string
  title: string
  h1: string
  description: string
  keywords: string
  updatedAt: string
}
export const HERO_LEAD: string
export const HERO_CHIPS: string[]
export const HOURLY_RATE: number
export const RATE_NOTE: string
export const REGISTER_URL: string
export const LINK_TARGET: string
export const LINKS: Record<string, string>
export const CASES: AdeptCase[]
export const HOURS_LESSON: string
export const SELF_CHECK: string[]
export const STEPS: AdeptStep[]
export const FORM_HINTS: { experience: string }
export const COMMUNITY: {
  h: string
  lead: string
  perks: { key: string; h: string; p: string }[]
  solo: string
  soloCta: AdeptLink
}
