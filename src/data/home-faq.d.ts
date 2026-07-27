// Типы для src/data/home-faq.mjs (plain-ESM data, общий для React и пререндера).

export interface HomeFaqLink {
  /** Внутренний путь на релевантную посадочную (перелинковка, issue #495). */
  href: string
  text: string
}

export interface HomeFaqItem {
  q: string
  /** Текст ответа — он же уходит в Schema.org FAQPage, без разметки. */
  a: string
  link?: HomeFaqLink
}

export const HOME_FAQ: HomeFaqItem[]
