#!/usr/bin/env node
/**
 * Post-build typography pass over every page in dist/.
 *
 * SEO-аудит 02.10.2026 (issue #627, п. 13) посчитал в сыром HTML сотни мест,
 * где однобуквенный предлог висит в конце строки, а тире переносится на новую.
 * Правила склейки лежат в src/lib/typography.mjs — одним модулем на все
 * страницы, вместо правки пятнадцати скриптов пререндера по отдельности.
 *
 * Шаг идёт ПОСЛЕ inject-static-nav.mjs, то есть последним среди тех, кто
 * переписывает HTML: так под правило попадает и статическая навигация.
 *
 * Трогаются только текстовые узлы: теги, атрибуты, комментарии, <script>,
 * <style> и <pre>/<code> остаются байт-в-байт (см. nbspHtml).
 */
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { nbspHtml } from '../src/lib/typography.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')
const dist = resolve(root, 'dist')

function htmlFiles(dir) {
  const out = []
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) out.push(...htmlFiles(full))
    else if (entry.endsWith('.html')) out.push(full)
  }
  return out
}

let changed = 0
let touched = 0
for (const file of htmlFiles(dist)) {
  const before = readFileSync(file, 'utf8')
  const after = nbspHtml(before)
  touched += 1
  if (after !== before) {
    writeFileSync(file, after)
    changed += 1
  }
}

console.log(`✓ apply-typography: неразрывные пробелы расставлены в ${changed} из ${touched} страниц dist`)
