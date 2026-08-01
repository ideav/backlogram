// Типы для src/data/privacy.mjs (plain-ESM данные, общие для React и пререндера).

export interface PrivacyMeta {
  /** Канонический путь страницы на ideav.ru. */
  path: string
  title: string
  description: string
  keywords: string
  /** Дата редакции для человека («1 августа 2026 г.»). */
  updated: string
  /** Та же дата в ISO — для <time datetime> и Schema.org. */
  updatedISO: string
}

export interface PrivacyOperator {
  name: string
  inn: string
  ogrn: string
  email: string
  phone: string
  /** Телефон в формате для href="tel:". */
  phoneHref: string
  site: string
}

/** Блок раздела: либо абзац, либо маркированный список. */
export type PrivacyBlock = { p: string; list?: never } | { list: string[]; p?: never }

export interface PrivacySection {
  /** id заголовка — якорь для ссылок на конкретный пункт. */
  id: string
  h: string
  blocks: PrivacyBlock[]
}

export const PRIVACY_META: PrivacyMeta
export const PRIVACY_OPERATOR: PrivacyOperator
export const PRIVACY_INTRO: string
export const PRIVACY_SECTIONS: PrivacySection[]
