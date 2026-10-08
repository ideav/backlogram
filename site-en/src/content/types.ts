export type Block = {
  type: 'h2' | 'h3' | 'p' | 'ul' | 'ol' | 'quote' | 'code' | 'callout'
  text?: string
  items?: string[]
}

export type KbArticle = {
  slug: string
  title: string
  description: string
  date: string // YYYY-MM-DD
  readingMinutes: number
  tags: string[]
  blocks: Block[]
}

export type UseCase = {
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
  image: string // /img/uc-<slug>.png
}
