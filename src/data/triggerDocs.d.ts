// Типы для src/data/triggerDocs.mjs (plain-ESM данные, общие для React и пререндера).

export interface TriggerMeta {
  /** Канонический путь страницы на ideav.ru. */
  path: string
  title: string
  h1: string
  description: string
  keywords: string
}

/**
 * Блок текста темы. В строках `text`, `items` и ячейках таблиц фрагменты в
 * обратных кавычках (`_m_action`) выводятся как код.
 */
export type TriggerBlock =
  | { t: 'p'; text: string }
  | { t: 'note'; text: string }
  | { t: 'list'; items: string[] }
  | { t: 'code'; lang: 'bash' | 'json' | 'text'; label?: string; code: string }
  | { t: 'table'; head: string[]; rows: string[][] }

export interface TriggerTopic {
  /** Якорь темы: /triggers.html#<id>. */
  id: string
  title: string
  blocks: TriggerBlock[]
}

export interface TriggerSection {
  id: string
  title: string
  topics: TriggerTopic[]
}

export const TRIGGER_META: TriggerMeta
export const TRIGGER_INTRO: string[]
export const TRIGGER_SECTIONS: TriggerSection[]
