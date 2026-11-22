// Реестр схем /help: имя файла (без .svg) → функция, возвращающая SVG.
import { DATA } from './data.mjs'
import { STRUCTURE } from './structure.mjs'

export const SCHEMES = { ...STRUCTURE, ...DATA }
