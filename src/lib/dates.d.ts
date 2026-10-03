// Типы для src/lib/dates.mjs (plain-ESM хелперы, общие для React и пререндера).

/** «2026-10-03» → «3 октября 2026». */
export function humanDate(iso: string): string

/** «Опубликовано 17 сентября 2026 · обновлено 3 октября 2026». */
export function freshnessLine(publishedAt: string, updatedAt?: string | null): string
