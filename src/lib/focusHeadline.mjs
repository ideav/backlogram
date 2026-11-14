/**
 * Заголовок посадочной из объявления Директа (python2node#1233).
 *
 * Директ подставляет в `utm_term={keyword}` фразу, по которой показано объявление,
 * вместе с операторами (`!`, `+`, `"…"`, `[…]`) и минус-словами. Из неё делаем H1:
 * убираем операторы, ставим заглавную букву, аббревиатуры пишем прописными.
 * Мусор (автотаргетинг, латиница без кириллицы, слишком длинная фраза) не подставляем:
 * лучше штатный заголовок фокуса, чем странный.
 *
 * Явный `?h=Текст` (как на посадочных с калькулятором) важнее utm_term.
 */

const MAX_H = 120
const MAX_TERM = 70
const UPPER = new Set(["erp", "crm", "wms", "мис", "нси", "тоир", "кп", "ии", "ит", "сэд", "hr", "1с"])

/** Фраза Директа → заголовок или null, если подставлять нельзя. */
export function headlineFromTerm(raw) {
  if (typeof raw !== "string") return null
  if (/autotargeting/i.test(raw)) return null
  const words = raw
    .replace(/[!+"[\]()|]/g, " ")
    .split(/\s+/)
    .filter((w) => w && !w.startsWith("-"))
  const text = words.join(" ").trim()
  if (text.length < 4 || text.length > MAX_TERM) return null
  if (!/[а-яё]/i.test(text)) return null
  if (/[^0-9a-zа-яё .,\-]/i.test(text)) return null
  const fixed = text
    .toLowerCase()
    .split(" ")
    .map((w) => (UPPER.has(w) ? w.toUpperCase() : w))
    .join(" ")
  return fixed.charAt(0).toUpperCase() + fixed.slice(1)
}

/** H1 из строки запроса страницы: `h`, затем `utm_term`, затем `keyword`. */
export function headlineFromSearch(search) {
  let params
  try {
    params = new URLSearchParams(search)
  } catch {
    return null
  }
  const h = params.get("h")
  if (h && h.trim() && h.length <= MAX_H) return h.trim()
  return headlineFromTerm(params.get("utm_term")) ?? headlineFromTerm(params.get("keyword"))
}

/** id фокуса из строки запроса (`?f=sklad`), только латиница, цифры и дефис. */
export function focusIdFromSearch(search) {
  try {
    const f = new URLSearchParams(search).get("f")
    return f && /^[a-z0-9-]{1,40}$/.test(f) ? f : null
  } catch {
    return null
  }
}
