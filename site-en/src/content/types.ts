/**
 * Content contract between the marketing site and the content streams
 * (see the EN brief). The KB and use-case modules export arrays of these
 * shapes; the renderers in src/pages handle every Block type below.
 */

export type BlockType = 'h2' | 'h3' | 'p' | 'ul' | 'ol' | 'quote' | 'code' | 'callout'

export interface Block {
  type: BlockType
  /** Used by h2, h3, p, quote, code, callout. */
  text?: string
  /** Used by ul and ol. */
  items?: string[]
}

export interface KbArticle {
  slug: string
  title: string
  description: string
  /** YYYY-MM-DD */
  date: string
  readingMinutes: number
  tags: string[]
  blocks: Block[]
}

export interface UseCase {
  slug: string
  title: string
  metaDescription: string
  headline: string
  subheadline: string
  audience: string
  pains: string[]
  solution: { title: string; text: string }[]
  steps: string[]
  aiAngle: string
  faq: { q: string; a: string }[]
  /** /img/uc-<slug>.png */
  image: string
}
