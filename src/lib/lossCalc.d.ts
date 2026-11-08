import type { LossCalc } from '../data/lossLandings'

export function defaultValues(calc: LossCalc): Record<string, number>
export function toNumber(raw: unknown): number
export function computeLoss(
  calc: LossCalc,
  values: Record<string, number | string>,
): { parts: number[]; total: number; base: number; share: number | null; perMonth: number }
export function formatRub(x: number): string
export function formatPct(x: number): string
