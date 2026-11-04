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
  /** Скриншот приложения на Интеграме для героя и og:image (путь от корня). */
  image: string
  /** alt/подпись к скриншоту. */
  imageAlt: string
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
  // Необязательные блоки расширенного лендинга (issue #867): шаблон показывает их, только если заданы.
  ogImage?: string
  figureCaption?: string
  painsTitle?: string
  painsHead?: [string, string]
  featuresTitle?: string
  gallery?: { src: string; w: number; h: number; alt: string; caption: string }[]
  stepsTitle?: string
  steps?: Feature[]
  factsTitle?: string
  facts?: { icon: string; value: string; label: string }[]
  pricingTitle?: string
  pricingLead?: string
  pricing?: { name: string; price: string; note: string; items: string[] }[]
  demoTitle?: string
  demoText?: string
  demoLabel?: string
  demoUrl?: string
  related?: { href: string; label: string }[]
  ctaTitle?: string
  ctaText?: string
  ctaLabel?: string
  ctaPlaceholder?: string
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
