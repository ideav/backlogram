// Типы для src/data/catalogMatching.mjs (plain ESM, чтобы его мог импортировать
// и Vite, и Node-скрипт пререндера). См. комментарий в самом .mjs.

export interface CmMeta {
  path: string
  title: string
  description: string
  h1: string
  /** Хвост h1, подсвечиваемый в React-версии; окончание `h1`. */
  h1Accent: string
  lead: string
  publishedAt: string
  updatedAt: string
}

/** Шаг ленты «полный цикл»: icon — имя компонента lucide-react. */
export interface CmFlowStep {
  icon: string
  label: string
}

/** Карточка с текстом: icon — имя компонента lucide-react. */
export interface CmCard {
  icon: string
  title: string
  body: string
}

export interface CmCompareRow {
  criterion: string
  them: string
  us: string
}

export interface CmForm {
  source: string
  endpoint: string
  title: string
  lead: string
  extensions: string[]
  maxFileMb: number
}

export const CM_META: CmMeta
export const CM_FLOW: CmFlowStep[]
export const CM_STEPS: CmCard[]
export const CM_PILLARS: CmCard[]
export const CM_COMPARE_ROWS: CmCompareRow[]
export const CM_AUDIENCE: string[]
export const CM_FORM: CmForm
