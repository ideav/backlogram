import type { ApiBlock } from './apiDocs'

export interface HelpLink { href: string; text: string }
export interface HelpArticle {
  id: string
  title: string
  ask?: string[]
  tags?: string[]
  level?: 'start' | 'pro'
  summary: string
  steps?: string[]
  blocks?: ApiBlock[]
  links?: HelpLink[]
}
export interface HelpFlatArticle extends HelpArticle { sectionId: string; sectionTitle: string }
export interface HelpSection {
  id: string
  title: string
  lead: string
  articles: HelpArticle[]
  /** Страница раздела /help/<id>.html и её мета (#961). */
  path: string
  pageTitle: string
  description: string
}
export interface HelpIntroBlock {
  id: string
  title: string
  paras?: string[]
  points?: string[]
  layers?: { name: string; text: string }[]
}
export interface HelpIntro {
  lead: string[]
  blocks: HelpIntroBlock[]
  glossary: { term: string; text: string }[]
}

export const HELP_META: { path: string; title: string; h1: string; published: string; updated: string; description: string; keywords: string }
export const HELP_INTRO: HelpIntro
export const HELP_SECTIONS: HelpSection[]
export const HELP_ARTICLES: HelpFlatArticle[]
export const HELP_SAMPLE_QUESTIONS: string[]
export function helpSectionPath(id: string): string
export function helpSectionOf(anchor: string): string | null
export function helpHref(href: string): string
