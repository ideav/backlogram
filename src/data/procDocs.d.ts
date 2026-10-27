// Типы для src/data/procDocs.mjs (plain-ESM данные, общие для React и пререндера).

export interface ProcMeta {
  /** Канонический путь страницы на ideav.ru. */
  path: string
  title: string
  h1: string
  description: string
  keywords: string
}

/**
 * Блок текста темы. В строках `text`, `items` и ячейках таблиц фрагменты в
 * обратных кавычках (`confirmed=1`) выводятся как код.
 */
export type ProcBlock =
  | { t: 'p'; text: string }
  | { t: 'note'; text: string }
  | { t: 'list'; items: string[] }
  | { t: 'code'; lang: 'bash' | 'json' | 'text'; label?: string; code: string }
  | { t: 'table'; head: string[]; rows: string[][] }

export interface ProcTopic {
  /** Якорь темы: /stored-procedures.html#<id>. */
  id: string
  title: string
  blocks: ProcBlock[]
}

export interface ProcSection {
  id: string
  title: string
  topics: ProcTopic[]
}

export const PROC_META: ProcMeta
export const PROC_INTRO: string[]
export const PROC_SECTIONS: ProcSection[]
