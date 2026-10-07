// Типы для src/data/aiPages.mjs (plain-ESM данные, общие для React и пререндера).

export interface AiItem {
  title: string
  body: string
}

export interface AiTable {
  head: string[]
  rows: string[][]
  /** Окраска шапки по колонкам: 'bad' — красная, 'good' — зелёная (#650). */
  tones?: ('bad' | 'good' | null)[]
}

export interface AiSection {
  h2: string
  /** Абзац сразу под заголовком. */
  intro?: string
  /** Карточки (или шаги, если ordered). */
  items?: AiItem[]
  ordered?: boolean
  table?: AiTable
  /** Абзацы после таблицы/карточек. */
  paragraphs?: string[]
  /** Блок цен из src/data/services.mjs (PRICED_SERVICE_IDS). */
  pricing?: boolean
  /** Контекстная ссылка на соседнюю страницу. */
  link?: { href: string; text: string }
}

export interface AiFaqItem {
  q: string
  a: string
}

export interface AiPage {
  slug: string
  /** Имя в меню и в блоке «Ещё по теме». */
  navName: string
  badge: string
  seoTitle: string
  metaDescription: string
  ogTitle: string
  ogDescription: string
  h1: string
  /** Окончание заголовка, красится акцентом; полный H1 = `${h1} ${h1accent}`. */
  h1accent: string
  lead: string
  sections: AiSection[]
  faq: AiFaqItem[]
  sources?: string
}

export interface SevenQuestion {
  q: string
  typical: string
  integram: string
}

export declare const SITE: string
export declare const TRY_URL: string
export declare const PRICED_SERVICE_IDS: string[]
export declare const SEVEN_QUESTIONS: SevenQuestion[]
export declare const AI_PAGES: AiPage[]
export declare const AI_HUB: AiPage
export declare function aiPageBySlug(slug: string): AiPage | undefined
