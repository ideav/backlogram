// Типы для src/data/usecases.mjs (plain-ESM data, общий для React и пререндера).

export interface Pain {
  pain: string
  solution: string
}

export interface Feature {
  /** Имя иконки lucide (маппится в компоненте UseCaseLanding). */
  icon: string
  title: string
  body: string
}

export interface FaqItem {
  q: string
  a: string
}

export interface UseCase {
  /** Латинский слаг → маршрут /<slug>.html */
  slug: string
  /** Значение поля source формы (см. public/excel-to-app.php $SOURCE_LABELS). */
  source: string
  badge: string
  badgeIcon: string
  h1: string
  h1accent: string
  lead: string
  example: string
  seoTitle: string
  metaDescription: string
  ogTitle: string
  ogDescription: string
  keywords: string
  pains: Pain[]
  features: Feature[]
  faq: FaqItem[]
}

export interface Hub {
  slug: string
  seoTitle: string
  metaDescription: string
  ogTitle: string
  ogDescription: string
  keywords: string
  h1: string
  h1accent: string
  lead: string
}

export const SITE: string
export const HUB: Hub
export const USE_CASES: UseCase[]
