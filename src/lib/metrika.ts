// Яндекс.Метрика: счётчик встроен в index.html (id 108758829) и выставляет
// глобальную функцию `ym` на window. Этот хелпер шлёт цель-конверсию при
// успешной отправке формы-заявки — по ней перформанс-кампании Директа
// оптимизируются на «Максимум конверсий».
//
// No-op, если счётчик не загрузился (блокировщики, боты, пререндер): аналитика
// не должна ронять отправку формы.
const METRIKA_ID = 108758829

declare global {
  interface Window {
    ym?: (id: number, action: string, ...args: unknown[]) => void
  }
}

/**
 * Отправить цель в Метрику. `source` попадает в параметры визита, чтобы в
 * отчётах различать, с какой формы пришла заявка (единая цель `lead`).
 */
export function reachGoal(goal: string, params?: Record<string, unknown>): void {
  try {
    window.ym?.(METRIKA_ID, 'reachGoal', goal, params)
  } catch {
    /* аналитика никогда не мешает форме */
  }
}

/**
 * Записать параметры визита. В отличие от цели не требует заводить ничего в
 * настройках счётчика: дерево параметров сразу видно в отчёте «Параметры
 * визитов». Подвал шлёт сюда клики (#820), чтобы в следующий раз сокращать
 * его по данным, а не по релевантности.
 */
export function visitParams(params: Record<string, unknown>): void {
  try {
    window.ym?.(METRIKA_ID, 'params', params)
  } catch {
    /* аналитика никогда не мешает переходу */
  }
}

// Раздел сайта, из которого посетитель ушёл на форму заявки главной (`/#cta`),
// — issue #825. Хэш `#cta?from=…` не годится: App.tsx скроллит к элементу с
// id = hash, поэтому источник живёт в sessionStorage до отправки формы.
const LEAD_FROM_KEY = 'ideav_lead_from'

/** Запомнить раздел, откуда ведёт кнопка на форму `/#cta`. */
export function rememberLeadFrom(section: string): void {
  try {
    sessionStorage.setItem(LEAD_FROM_KEY, section)
  } catch {
    /* приватный режим / запрет storage — заявка уйдёт с source: 'home' */
  }
}

/** Источник заявки формы главной: раздел, если пришли из него, иначе `fallback`. */
export function leadSource(fallback: string): string {
  try {
    return sessionStorage.getItem(LEAD_FROM_KEY) || fallback
  } catch {
    return fallback
  }
}

/** Сбросить источник после успешной заявки — следующая уже не из раздела. */
export function forgetLeadFrom(): void {
  try {
    sessionStorage.removeItem(LEAD_FROM_KEY)
  } catch {
    /* нечего сбрасывать */
  }
}
