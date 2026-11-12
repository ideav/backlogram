// Защита целевой цели от скликивания (#933) — тот же приём, что у excel-to-app
// (site-excel/src/conversion.ts). Кампании «Фокус» платят за достижение цели,
// поэтому деньги сливает не клик, а конверсия, которую засчитал не человек:
//
//   1. Целевой кнопки нет в разметке, пока посетитель не нажал первую
//      (FocusLanding.tsx). Автомат, который жмёт всё подряд на загрузке, до неё
//      не доходит.
//   2. Цель уходит, только если в сессии был настоящий (`isTrusted`) жест и
//      страница прожила дольше MIN_DWELL_MS. Иначе — `<цель>_blocked`.
//
// Проверка намеренно мягкая: стратегии нужно около десяти конверсий в неделю,
// строгий фильтр задушит показы сильнее, чем пропущенный бот.
import { reachGoal } from './metrika'

const MIN_DWELL_MS = 2500

const loadedAt = Date.now()
let sawTrustedGesture = false

function rememberGesture(event: Event): void {
  if (event.isTrusted) sawTrustedGesture = true
}

if (typeof window !== 'undefined') {
  for (const type of ['pointerdown', 'pointermove', 'touchstart', 'keydown', 'wheel', 'scroll']) {
    window.addEventListener(type, rememberGesture, { passive: true })
  }
}

/** Отсечка дешёвых автоматов: webdriver, заход без жестов, клик в первые секунды. */
export function looksHuman(): boolean {
  if (typeof navigator !== 'undefined' && navigator.webdriver) return false
  return sawTrustedGesture && Date.now() - loadedAt >= MIN_DWELL_MS
}

/** Целевая цель кампании: человеку — `goal`, остальным — `goal_blocked`. */
export function reachHumanGoal(goal: string, params: Record<string, unknown> = {}): void {
  reachGoal(looksHuman() ? goal : `${goal}_blocked`, { ...params, dwell_ms: Date.now() - loadedAt })
}
