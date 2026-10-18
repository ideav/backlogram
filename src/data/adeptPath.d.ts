export interface AdeptImage {
  src: string
  width: number
  height: number
  alt: string
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
  timeline: string[]
  result: string
  image: AdeptImage
  extraImage?: AdeptImage
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
export const CASES: AdeptCase[]
export const HOURS_LESSON: string
export const SELF_CHECK: string[]
export const STEPS: AdeptStep[]
export const ROLES: { value: 'developer' | 'partner'; label: string; source: string }[]
export const FORM_HINTS: { experience: string }
