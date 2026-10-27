// Типы для src/data/templaterDocs.mjs (plain-ESM данные, общие для React и пререндера).

export interface TemplaterMeta {
  /** Канонический путь страницы на ideav.ru. */
  path: string
  title: string
  h1: string
  description: string
  keywords: string
}

/**
 * Блок текста темы. В строках `text`, `items` и ячейках таблиц фрагменты в
 * обратных кавычках (`{_global_.user}`) выводятся как код.
 */
export type TemplaterBlock =
  | { t: 'p'; text: string }
  | { t: 'note'; text: string }
  | { t: 'list'; items: string[] }
  | { t: 'code'; lang: 'bash' | 'json' | 'text'; label?: string; code: string }
  | { t: 'table'; head: string[]; rows: string[][] }

export interface TemplaterTopic {
  /** Якорь темы: /templater.html#<id>. */
  id: string
  title: string
  blocks: TemplaterBlock[]
}

export interface TemplaterSection {
  id: string
  title: string
  topics: TemplaterTopic[]
}

export const TEMPLATER_META: TemplaterMeta
export const TEMPLATER_INTRO: string[]
export const TEMPLATER_SECTIONS: TemplaterSection[]
