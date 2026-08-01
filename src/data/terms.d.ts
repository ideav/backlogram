// Типы для src/data/terms.mjs (plain-ESM данные, общие для React и пререндера).

export interface TermsMeta {
  /** Канонический путь страницы на ideav.ru. */
  path: string
  title: string
  description: string
  keywords: string
}

export interface TermsLink {
  href: string
  text: string
}

export interface TermsClause {
  /** Номер пункта соглашения — как в исходном документе. */
  n: number
  /** Текст пункта; `{link}` — место подстановки ссылки из `link`. */
  text: string
  link?: TermsLink
}

export interface TermsPrivacyNote {
  text: string
  link: TermsLink
}

export const TERMS_META: TermsMeta
export const TERMS_INTRO: string
export const TERMS_CLAUSES: TermsClause[]
export const TERMS_PRIVACY_NOTE: TermsPrivacyNote
