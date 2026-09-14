// Цели Метрики для лендинга и защита целевой цели от скликивания.
//
// Кампания к этому лендингу работает на стратегии «оплата за конверсии»: Директ
// берёт деньги не за клик, а за достижение цели. Значит цена ошибки смещается —
// сливает бюджет не дорогой клик, а конверсия, которую засчитал не человек.
// Отсюда две меры:
//
//   1. Целевая кнопка не существует в разметке до тех пор, пока посетитель не
//      нажал первую (см. Landing.tsx). Скликиватель, который открывает страницу
//      и жмёт всё подряд, до неё не доходит — ему нечего жать.
//   2. Цель отправляется только если в сессии был хотя бы один настоящий
//      (`isTrusted`) жест и страница прожила дольше MIN_DWELL_MS.
//
// Вторая мера намеренно мягкая. Строгий фильтр режет конверсии, а стратегии
// нужно около десяти в неделю, иначе Директ душит показы и кампания встаёт —
// то есть перестраховка здесь стоит дороже, чем пропущенный бот.

declare const __METRIKA_ID__: string

declare global {
  interface Window {
    ym?: (id: number, action: string, ...args: unknown[]) => void
  }
}

/** Цели. `signup` — та, за которую платит Директ; остальные для учёта. */
export const GOALS = {
  /** Раскрыт блок с ценой (первый клик). Наблюдение, не оплата. */
  priceOpen: 'price_open',
  /** Клик по «Записаться на разбор». ЦЕЛЕВАЯ ЦЕЛЬ КАМПАНИИ. */
  signup: 'signup_click',
  /** Тот же клик, но не прошедший проверку на человека. */
  signupBlocked: 'signup_blocked',
  /** Форма отправлена. */
  lead: 'lead',
} as const

const MIN_DWELL_MS = 2500

const counterId = Number(__METRIKA_ID__ || 0)
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

/**
 * Похож ли посетитель на человека. Не детектор ботов, а отсечка самых дешёвых
 * автоматов: заход без единого жеста и клик в первые секунды после загрузки.
 */
export function looksHuman(): boolean {
  if (typeof navigator !== 'undefined' && navigator.webdriver) return false
  return sawTrustedGesture && Date.now() - loadedAt >= MIN_DWELL_MS
}

/** Сколько миллисекунд посетитель на странице — уходит в параметры цели. */
export function dwellMs(): number {
  return Date.now() - loadedAt
}

/**
 * Отправить цель. No-op, если счётчик не подключён или не загрузился
 * (блокировщики, боты): аналитика не должна ломать страницу.
 */
export function reachGoal(goal: string, params?: Record<string, unknown>): void {
  if (!counterId) return
  try {
    window.ym?.(counterId, 'reachGoal', goal, params)
  } catch {
    /* аналитика никогда не мешает странице */
  }
}

/**
 * Целевое действие кампании. Если проверка на человека не прошла, вместо
 * целевой цели уходит `signup_blocked` — по ней видно, сколько таких заходов,
 * и при этом Директ за них не платит.
 */
export function reachSignupGoal(source: string): void {
  const params = { source, dwell_ms: dwellMs() }
  reachGoal(looksHuman() ? GOALS.signup : GOALS.signupBlocked, params)
}
