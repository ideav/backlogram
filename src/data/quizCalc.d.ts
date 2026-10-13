// Типы для src/data/quizCalc.mjs (plain-ESM данные, общие для React и пререндера).

export interface QuizMeta {
  /** Канонический путь страницы на ideav.ru. */
  path: string
  /** Призыв hero из задачи #745 — дословно. */
  h1: string
  title: string
  description: string
  keywords: string
  /** Дата последней правки содержимого, YYYY-MM-DD — для JSON-LD dateModified. */
  updatedAt: string
}

export interface QuizOption {
  /** Значение с ключевым словом — по нему считает analyzeEstimate. */
  value: string
  label: string
}

/** Оценка проекта: категория, вилка бюджета, сроки и список функций. */
export interface ProjectEstimate {
  category: string
  cost: string
  timeline: string
  features: string[]
}

export declare const QUIZ_META: QuizMeta
export declare const HERO_LEAD: string
export declare const HERO_CHIPS: string[]
export declare const PROBLEMS: { h: string; p: string }[]
export declare const STEPS: { h: string; duration: string; p: string }[]
export declare const AUDIENCE: string[]
export declare const SYSTEM_TYPES: QuizOption[]
export declare const USER_COUNTS: QuizOption[]
export declare const FEATURES: QuizOption[]
export declare const CALL_SLOTS: string[]
export declare const ANALYSIS_MESSAGES: string[]

export declare function analyzeEstimate(answers: {
  systemType?: string
  userCount?: string
  features?: string[]
}): ProjectEstimate
