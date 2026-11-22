// Схемы интерфейса для статей /help (ideav/crm#5626): node scripts/generate-help-schemes.mjs
// Пишет SVG в public/help-img/. Рисунки — схемы НОВОГО интерфейса таблицы
// (js/integram-table и страница «Таблицы» templates/tables.html в ideav/crm); подписи
// кнопок и окон взяты из кода. Номера в оранжевых кружках = номера шагов статьи.
// Править схему — в scripts/help-schemes/*.mjs, затем перезапустить скрипт и закоммитить SVG.

import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { SCHEMES } from './help-schemes/index.mjs'

const out = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'help-img')
mkdirSync(out, { recursive: true })
for (const [name, draw] of Object.entries(SCHEMES)) writeFileSync(resolve(out, `${name}.svg`), draw())
console.log(`help-schemes: ${Object.keys(SCHEMES).length} SVG → public/help-img/`)
