import type { HelpFlatArticle } from '../data/helpCenter'

export interface HelpIndex { N: number }
export interface HelpHit { article: HelpFlatArticle; score: number }
export interface HelpAnswer { best: HelpFlatArticle | null; related: HelpFlatArticle[]; confident: boolean; score?: number }

export function normalize(s: string): string
export function stem(word: string): string
export function tokens(text: string): string[]
export function buildIndex(articles: HelpFlatArticle[]): HelpIndex
export function search(index: HelpIndex, q: string, limit?: number): HelpHit[]
export function consult(index: HelpIndex, q: string): HelpAnswer
