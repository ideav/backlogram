import type { HelpFlatArticle } from '../data/helpCenter'
import type { HelpAnswer, HelpHit, HelpIndex } from './helpSearch'

export interface HelpVectorsJson { model: string; dims: number; items: Record<string, [string, string]> }
export interface HelpVectors { model: string | null; vectors: Map<string, Float32Array> }
export interface HelpHybridParams { weight: number; zFloor: number; zConfident: number }

export const HELP_EMBED_ENDPOINT: string
export const HELP_VECTORS_URL: string
export const HYBRID: HelpHybridParams
export function embedText(a: Pick<HelpFlatArticle, 'title' | 'summary'> & { ask?: string[] }): string
export function textHash(s: string): string
export function packVector(vec: number[]): string
export function loadVectors(json: HelpVectorsJson | null, articles: HelpFlatArticle[]): HelpVectors
export function fetchQueryVector(q: string, opts?: { endpoint?: string; timeoutMs?: number; fetchImpl?: typeof fetch }): Promise<{ model: string; vec: number[] } | null>
export function hybridSearch(index: HelpIndex, q: string, qvec: number[] | null, vectors: Map<string, Float32Array> | null, limit?: number, p?: HelpHybridParams): (HelpHit & { z?: number })[]
export function hybridConsult(index: HelpIndex, q: string, qvec: number[] | null, vectors: Map<string, Float32Array> | null, p?: HelpHybridParams): HelpAnswer
