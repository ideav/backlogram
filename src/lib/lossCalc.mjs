// Расчёт калькулятора потерь (python2node#1203). Общий для React-компонента,
// пререндера и теста: одна арифметика на всех, без eval.

/** Значения полей и допущений по умолчанию: { id: число }. */
export function defaultValues(calc) {
  const out = {}
  for (const f of [...calc.fields, ...calc.assumptions]) out[f.id] = f.value
  return out
}

/** Строка из поля ввода → неотрицательное число (запятая как точка; мусор → 0). */
export function toNumber(raw) {
  const x = Number(String(raw ?? '').replace(',', '.'))
  return Number.isFinite(x) && x > 0 ? x : 0
}

/**
 * Итог по значениям полей `values` ({ id: число }).
 * Возвращает { parts: число[], total, base, share (доля от базы, % или null), perMonth }.
 */
export function computeLoss(calc, values) {
  const v = (id) => toNumber(values[id])
  const parts = calc.parts.map((p) => {
    const r = p.fn(v)
    return Number.isFinite(r) && r > 0 ? r : 0
  })
  const total = parts.reduce((a, b) => a + b, 0)
  const base = calc.base ? v(calc.base) * (calc.baseMul || 1) : 0
  return { parts, total, base, share: base > 0 ? (total / base) * 100 : null, perMonth: total / 12 }
}

/** «4 020 000 ₽» — разряды неразрывным пробелом, как на остальном сайте. */
export function formatRub(x) {
  return Math.round(x).toLocaleString('ru-RU').replace(/[\s\u00a0\u202f]/g, '\u00a0') + '\u00a0₽'
}

/** «1,3 %» */
export function formatPct(x) {
  return x.toLocaleString('ru-RU', { maximumFractionDigits: 1 }) + '\u00a0%'
}
