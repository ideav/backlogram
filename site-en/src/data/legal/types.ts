/**
 * Blocks of the legal pages. A superset of the content-module Block: adds
 * tables and "caps" (conspicuous) paragraphs. Text may carry two inline marks,
 * rendered by pages/Legal.tsx: [label](/path-or-url) for links and **bold**.
 */
export type LegalBlock =
  | { type: 'h2' | 'h3' | 'p' | 'callout' | 'caps'; text: string }
  | { type: 'ul' | 'ol'; items: string[] }
  | { type: 'table'; head: string[]; rows: string[][] }

export type LegalSlug =
  | 'terms'
  | 'privacy'
  | 'cookies'
  | 'dpa'
  | 'subprocessors'
  | 'acceptable-use'
  | 'copyright'
  | 'security'

export interface LegalDoc {
  slug: LegalSlug
  title: string
  /** Footer label, if shorter than the title. */
  short?: string
  description: string
  updated: string
  blocks: LegalBlock[]
}
