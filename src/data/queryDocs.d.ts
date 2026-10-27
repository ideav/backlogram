// Типы для src/data/queryDocs.mjs (plain-ESM данные, общие для React и пререндера).

export interface QueryMeta {
  /** Канонический путь страницы на ideav.ru. */
  path: string
  title: string
  h1: string
  description: string
  keywords: string
}

/**
 * Блок текста темы. В строках `text`, `items` и ячейках таблиц фрагменты в
 * обратных кавычках (`[USER_ID]`) выводятся как код.
 */
export type QueryBlock =
  | { t: 'p'; text: string }
  | { t: 'note'; text: string; link?: { href: string; text: string } }
  | { t: 'list'; items: string[] }
  | { t: 'code'; lang: 'bash' | 'json' | 'text'; label?: string; code: string }
  | { t: 'table'; head: string[]; rows: string[][] }

export interface QueryTopic {
  /** Якорь темы: /queries.html#<id>. */
  id: string
  title: string
  blocks: QueryBlock[]
}

export interface QuerySection {
  id: string
  title: string
  topics: QueryTopic[]
}

export const QUERY_META: QueryMeta
export const QUERY_INTRO: string[]
export const QUERY_SECTIONS: QuerySection[]
