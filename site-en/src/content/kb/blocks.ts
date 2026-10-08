import type { Block } from '../types'

export const h2 = (text: string): Block => ({ type: 'h2', text })
export const h3 = (text: string): Block => ({ type: 'h3', text })
export const p = (text: string): Block => ({ type: 'p', text })
export const ul = (...items: string[]): Block => ({ type: 'ul', items })
export const ol = (...items: string[]): Block => ({ type: 'ol', items })
export const quote = (text: string): Block => ({ type: 'quote', text })
export const code = (text: string): Block => ({ type: 'code', text })
export const callout = (text: string): Block => ({ type: 'callout', text })
