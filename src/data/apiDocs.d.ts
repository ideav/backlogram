// Типы для src/data/apiDocs.mjs (plain-ESM данные, общие для React и пререндера).

export interface ApiMeta {
  /** Канонический путь страницы на ideav.ru. */
  path: string
  title: string
  h1: string
  description: string
  keywords: string
}

/**
 * Блок текста темы. В строках `text`, `items` и ячейках таблиц фрагменты в
 * обратных кавычках (`_m_new`) выводятся как код.
 */
export type ApiBlock =
  | { t: 'p'; text: string }
  | { t: 'note'; text: string; link?: { href: string; text: string } }
  | { t: 'list'; items: string[] }
  | { t: 'code'; lang: 'bash' | 'json' | 'text'; label?: string; code: string }
  | { t: 'table'; head: string[]; rows: string[][] }

export interface ApiTopic {
  /** Якорь темы: /api.html#<id>. */
  id: string
  title: string
  blocks: ApiBlock[]
}

export interface ApiSection {
  id: string
  title: string
  topics: ApiTopic[]
}

export const API_META: ApiMeta
export const API_INTRO: string[]
export const API_SECTIONS: ApiSection[]
