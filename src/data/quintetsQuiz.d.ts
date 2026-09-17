// Типы для src/data/quintetsQuiz.mjs (plain-ESM данные, общие для React и пререндера).

export interface QuizMeta {
  /** Канонический путь страницы на ideav.ru. */
  path: string
  title: string
  description: string
  keywords: string
  h1: string
  /** Хвост заголовка, подсвеченный цветом; часть h1 дословно. */
  h1Accent: string
  lead: string
}

export interface QuizLink {
  href: string
  text: string
}

/**
 * Ответ: текст, баллы [Квинтеты, РСУБД], человеко-часы на разработку
 * [Квинтеты, РСУБД], пояснение для бизнес-читателя (`{link}` — место
 * подстановки ссылки), техническая расшифровка (уходит в title) и сама ссылка.
 * null в часах = «так не делается».
 */
export type QuizOption = [
  string,
  [number, number],
  [number | null, number | null],
  string,
  string,
  QuizLink?,
]

export interface QuizQuestion {
  /** Короткое имя вопроса — им описаны правила перекоса. */
  id: string
  /** Вес вопроса в шкале; веса всех вопросов в сумме дают 100. */
  w: number
  t: string
  /** Уточнение под заголовком; пустая строка — уточнения нет. */
  h: string
  o: QuizOption[]
}

export interface QuizCross {
  /** Условие: id вопроса → номер выбранного ответа. */
  when: Record<string, number>
  /** Надбавка в часах каждому из трёх вариантов. */
  add: [number, number, number]
  title: string
  why: string
}

export interface QuizLostPoint {
  q: number
  d: number
  note: string
}

export interface QuizSpendItem {
  q: number
  v: number
  note: string
}

export interface QuizScore {
  sum: number[]
  hours: number[]
  blocked: number[][]
  lost: QuizLostPoint[][]
  spend: QuizSpendItem[][]
  answered: number
  complete: boolean
  cross: QuizCross[]
}

export interface QuizVerdict extends QuizScore {
  /** Индекс победившего варианта либо null, если вердикта ещё нет. */
  best: number | null
  /** Индексы вариантов с тем же счётом, что у победителя. */
  tie: number[]
  /** Индекс варианта с наименьшими трудозатратами. */
  cheapest: number | null
}

export const QUIZ_META: QuizMeta
export const VARIANTS: string[]
export const VARIANT_KEYS: string[]
export const COMBO_SURCHARGE: number
export const SCALE_GOOD: number
export const SCALE_OK: number
export const QUESTIONS: QuizQuestion[]
export const CROSS: QuizCross[]
export const QUIZ_INTRO: [string, string][]
export const QUIZ_SOURCES: string[]
export const QUIZ_FOOTER: { text: string; links: QuizLink[] }

export function questionIndex(id: string): number
export function crossHits(answers: (number | null)[]): QuizCross[]
export function rescue(k: number, r: number, w: number): boolean
export function combo(k: number, r: number, w: number): number
export function points(option: QuizOption, w: number): number[]
export function hoursCombo(pair: (number | null)[]): number | null
export function hours(option: QuizOption): (number | null)[]
export function ceilings(): number[]
export function worstHours(): number[]
export function score(answers: (number | null)[]): QuizScore
export function verdict(answers: (number | null)[]): QuizVerdict
export function ballWord(n: number): string
export function hoursLabel(v: number | null): string
