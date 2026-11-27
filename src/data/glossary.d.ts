// Типы для src/data/glossary.mjs (plain-ESM данные, общие для React и пререндера).

export interface GlossaryMeta {
  /** Канонический путь страницы на ideav.ru. */
  path: string
  title: string
  description: string
  keywords: string
  /** ISO-даты для datePublished / dateModified. */
  published: string
  updated: string
}

export interface GlossaryGroup {
  id: string
  title: string
}

export interface GlossarySource {
  /** Название страницы, где встречается термин. */
  title: string
  /** Путь на ideav.ru (`/help/structure.html`) или полный адрес. */
  url: string
}

export interface GlossaryTerm {
  /** Якорь на странице словаря: `/slovar-terminov.html#<id>`. */
  id: string
  term: string
  /** Синонимы и другие написания — тоже находятся поиском. */
  aka?: string[]
  /** Определение; `код` в обратных кавычках. */
  text: string
  /** id группы из GLOSSARY_GROUPS. */
  group: string
  /** Где термин встречается на сайте. */
  sources?: GlossarySource[]
}

export interface GlossaryLetter {
  letter: string
  terms: GlossaryTerm[]
}

export const GLOSSARY_META: GlossaryMeta
export const GLOSSARY_INTRO: string
export const GLOSSARY_GROUPS: GlossaryGroup[]
export const GLOSSARY_TERMS: GlossaryTerm[]
/** Термины по первой букве: сначала кириллица, потом латиница и цифры. */
export function glossaryByLetter(terms?: GlossaryTerm[]): GlossaryLetter[]
/** Совпадает ли термин с поисковой строкой (по имени, синонимам и тексту). */
export function glossaryMatches(term: GlossaryTerm, query: string): boolean
