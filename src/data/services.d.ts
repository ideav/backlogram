// Типы для src/data/services.mjs (plain-ESM данные, общие для React и пререндера).

export interface ServicesMeta {
  /** Канонический путь страницы на ideav.ru. */
  path: string
  title: string
  description: string
  h1: string
  lead: string
}

export interface ServiceItem {
  id: string
  name: string
  description: string
  /** Цена в рублях — число для JSON-LD Offer.price. */
  price: number
  /** Цена «от» (минимальная в линейке). */
  priceFrom: boolean
  /** Единица рядом с ценой: «₽», «₽/час», «₽/мес», «₽/год». */
  unit: string
  /** Срок оказания, если фиксирован. */
  term: string | null
  /** Куда ведёт кнопка заказа. */
  url: string
  cta: string
  features: string[]
}

export interface OrderStep {
  h: string
  p: string
}

export const SERVICES_META: ServicesMeta
export const SERVICES: ServiceItem[]
export const ORDER_STEPS: OrderStep[]
export function formatPrice(price: number): string
