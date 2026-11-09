/** Ответ /inn-lookup.php (backlogram#913). */
export interface InnProfile {
  ok: boolean
  error?: 'invalid_inn' | 'rate_limited' | 'source_unavailable' | 'method'
  found?: boolean
  inn?: string
  kind?: 'ul' | 'ip'
  name?: string
  regDate?: string | null
  okved?: string
  okvedName?: string
  region?: string
  active?: boolean
  revenue?: { year: number; rub: number } | null
  expense?: { year: number; rub: number } | null
  employees?: { year: number; n: number } | null
  contributions?: { year: number; rub: number } | null
  msp?: number | null
  source?: string
  boUrl?: string | null
}

export interface InnFact {
  id: string
  label: string
  value: number
  unit: string
  source: string
}

export const TABLES_PER_EMPLOYEE: number
export const CONTRIB_RATE: number
export const HOURS_PER_WEEK: number
export function innValid(raw: unknown): boolean
export function companyAge(regDate: string | null | undefined, now?: Date): number | null
export function profileToValues(
  profile: InnProfile | null | undefined,
  weeks?: number,
): { values: Record<string, number>; facts: InnFact[] }
export function okvedToIndustry(okved: string | null | undefined): string | null
export function aiTransformUrl(profile: InnProfile | null | undefined): string
