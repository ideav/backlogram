/**
 * Посадочные страницы excel-to-app.ru (issue #657, ТЗ «массовый запуск»).
 *
 * Одна страница = один JSON-файл в `site-excel/landings/`. Разметку рисует
 * общий шаблон `src/pages/LandingPage.tsx`, собирает пререндер
 * `scripts/prerender-site-excel.mjs`. Добавить страницу — положить файл и
 * запустить `npm run build:excel`.
 *
 * Модуль читают трое: пререндер (страницы), `vite.config.ts` (sitemap.xml,
 * llms.txt) и тесты. Поэтому здесь только Node и данные — без React и без TS.
 *
 * Проверки ТЗ (раздел 11.2) живут здесь же: сборка падает, если у страницы
 * длинный или повторяющийся title, description, H1, меньше трёх строк в блоке
 * формул, заглушка, запрещённая формулировка, совпадающий с другой страницей
 * уникальный блок или ссылка в никуда. CTA и битые ссылки в готовом HTML
 * проверяет пререндер — их видно только после отрисовки.
 */
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
export const LANDINGS_DIR = resolve(here, 'landings')
const PUBLIC_DIR = resolve(here, 'public')

/** Группы карты страниц — раздел 5.1 ТЗ. */
export const GROUPS = {
  main: 'Основная',
  industry: 'Отрасли',
  task: 'Задачи',
  compare: 'Сравнения',
  trust: 'Доверие',
}

export const LIMITS = { title: 65, description: 160, h1: 70 }

/** Текст главной кнопки — раздел 3.3 ТЗ. По нему пререндер ищет CTA в HTML. */
export const CTA_LABEL = 'Прислать таблицу — получить демо бесплатно'

// Заглушки (раздел 11.2) и формулировки, запрещённые разделами 3.1, 3.2, 3.3
// и 9.1 ТЗ. Сравнение — без учёта регистра, по нормализованному тексту.
const PLACEHOLDERS = [/lorem/i, /\bTODO\b/, /\bXXX\b/, /\bTBD\b/, /\?\?\?/]
const FORBIDDEN = [
  'не переносятся',
  'не переносится',
  'ограничени',
  'к сожалению',
  'вместо программиста',
  'революционн',
  'уникальн',
  'лучший на рынке',
  'лучше power apps',
  'безопаснее, чем',
  'бесшовн',
  'инновационн',
  'обучим ии за час',
  'овладеете ии',
]

const norm = s => String(s).toLowerCase().replace(/ё/g, 'е').replace(/\s+/g, ' ').trim()

/** Все строки страницы — для поиска заглушек и запрещённых слов. */
function strings(value, out = []) {
  if (typeof value === 'string') out.push(value)
  else if (Array.isArray(value)) value.forEach(v => strings(v, out))
  else if (value && typeof value === 'object') Object.values(value).forEach(v => strings(v, out))
  return out
}

/**
 * Блоки, которые обязаны быть своими у каждой страницы (раздел 6 ТЗ: 3–6
 * и 9). Возвращает пары «блок → нормализованный текст строки».
 */
function uniqueRows(page) {
  return [
    ...page.was.map(s => ['Было', s]),
    ...page.now.map(s => ['Стало', s]),
    ...page.build.map(r => ['Что агент соберёт', `${r.what} | ${r.from}`]),
    ...page.formulas.map(r => ['Формулы', `${r.excel} | ${r.app}`]),
    ...page.roles.map(r => ['Кто что видит', `${r.role} | ${r.access}`]),
    ...page.faq.map(r => ['Вопросы', r.q]),
  ].map(([block, text]) => [block, norm(text)])
}

/** Читает все страницы из каталога. Порядок — по `order`, потом по адресу. */
export function loadLandings(dir = LANDINGS_DIR) {
  if (!existsSync(dir)) return []
  return readdirSync(dir)
    .filter(name => name.endsWith('.json'))
    .map(name => {
      const file = resolve(dir, name)
      let data
      try {
        data = JSON.parse(readFileSync(file, 'utf8'))
      } catch (err) {
        throw new Error(`${name}: не JSON — ${err.message}`)
      }
      return { ...data, _file: name }
    })
    .sort((a, b) => (a.order ?? 999) - (b.order ?? 999) || String(a.slug).localeCompare(String(b.slug)))
}

/**
 * Проверка данных до отрисовки. Возвращает список ошибок; пустой — всё в порядке.
 *
 * @param pages      страницы из loadLandings()
 * @param existing   уже существующие страницы домена: [{ path, title, description }]
 * @param publicDir  каталог статики — проверить, что скриншоты на месте
 */
export function validateLandings(pages, existing = [], publicDir = PUBLIC_DIR) {
  const errors = []
  const fail = (page, msg) => errors.push(`${page._file ?? page.slug}: ${msg}`)

  const knownPaths = new Set(existing.map(p => p.path))
  for (const page of pages) knownPaths.add(`/${page.slug}/`)

  for (const page of pages) {
    const need = (field, ok, msg) => {
      if (!ok(page[field])) fail(page, `${field}: ${msg}`)
    }
    const str = v => typeof v === 'string' && v.trim() !== ''
    const list = (min, max, item) => v =>
      Array.isArray(v) && v.length >= min && v.length <= max && v.every(item)

    need('slug', v => typeof v === 'string' && /^[a-z0-9]+(-[a-z0-9]+)*$/.test(v), 'латиница, цифры и дефисы')
    if (page._file && page.slug && page._file !== `${page.slug}.json`) {
      fail(page, `файл должен называться ${page.slug}.json`)
    }
    need('group', v => Object.hasOwn(GROUPS, v), `одна из групп: ${Object.keys(GROUPS).join(', ')}`)
    for (const f of ['query', 'title', 'description', 'h1', 'lead', 'crumb']) need(f, str, 'обязательное поле')
    // Даты (issue #738): lastmod в sitemap и dateModified в JSON-LD.
    const day = v => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(v))
    need('published', day, 'дата публикации YYYY-MM-DD')
    need('updated', day, 'дата обновления YYYY-MM-DD')
    if (day(page.published) && day(page.updated) && page.updated < page.published) {
      fail(page, 'updated раньше published')
    }
    for (const f of ['title', 'description', 'h1']) {
      if (str(page[f]) && page[f].length > LIMITS[f]) {
        fail(page, `${f} длиннее ${LIMITS[f]} символов (${page[f].length})`)
      }
    }
    if (str(page.h1) && str(page.query) && !norm(page.h1).includes(norm(page.query))) {
      fail(page, `H1 не содержит главный запрос «${page.query}»`)
    }

    need('was', list(3, 3, str), 'ровно 3 пункта «Было»')
    need('now', list(3, 3, str), 'ровно 3 пункта «Стало»')
    need('build', list(3, 5, r => str(r?.what) && str(r?.from)), '3–5 строк { what, from }')
    need('formulas', list(3, 8, r => str(r?.excel) && str(r?.app)), 'минимум 3 строки { excel, app }')
    need('roles', list(2, 6, r => str(r?.role) && str(r?.access)), '2–6 ролей { role, access }')
    need('faq', list(3, 5, r => str(r?.q) && str(r?.a)), '3–5 своих вопросов { q, a }')
    need('related', list(4, 6, v => typeof v === 'string'), '4–6 соседних страниц')
    if (page.steps !== undefined) need('steps', list(3, 6, r => str(r?.title) && str(r?.body)), '3–6 шагов { title, body }')
    if (page.screens !== undefined) {
      need('screens', list(2, 3, r => str(r?.src) && str(r?.alt) && str(r?.caption)), '2–3 скриншота { src, alt, caption } или ни одного')
      for (const shot of Array.isArray(page.screens) ? page.screens : []) {
        if (str(shot?.src) && !existsSync(resolve(publicDir, shot.src))) fail(page, `скриншот ${shot.src} не найден в public/`)
        if (str(shot?.src) && !/\.(webp|avif)$/.test(shot.src)) fail(page, `скриншот ${shot.src}: нужен WebP или AVIF`)
      }
    }

    for (const target of Array.isArray(page.related) ? page.related : []) {
      if (target === page.slug || target === `/${page.slug}/`) fail(page, 'ссылается сам на себя')
      const path = target.startsWith('/') ? target : `/${target}/`
      if (!knownPaths.has(path)) fail(page, `соседняя страница ${target} не существует`)
    }

    for (const s of strings(page)) {
      for (const re of PLACEHOLDERS) if (re.test(s)) fail(page, `заглушка ${re} в «${s.slice(0, 60)}»`)
      const n = norm(s)
      for (const word of FORBIDDEN) if (n.includes(word)) fail(page, `запрещённая формулировка «${word}» в «${s.slice(0, 60)}»`)
    }
  }

  // Уникальность по домену: title, description и H1 не повторяют ни друг
  // друга, ни уже существующие страницы (кейсы, сравнение, главная).
  for (const field of ['title', 'description', 'h1']) {
    const seen = new Map()
    if (field !== 'h1') for (const p of existing) seen.set(norm(p[field]), p.path)
    for (const page of pages) {
      if (typeof page[field] !== 'string') continue
      const key = norm(page[field])
      if (seen.has(key)) fail(page, `${field} совпадает со страницей ${seen.get(key)}`)
      else seen.set(key, `/${page.slug}/`)
    }
  }

  // Блоки 3–6 и 9 — свои у каждой страницы. Одинаковая строка на двух
  // страницах — это и есть «подстановка названия отрасли в тот же текст».
  const rows = new Map()
  for (const page of pages) {
    if (![page.was, page.now, page.build, page.formulas, page.roles, page.faq].every(Array.isArray)) continue
    for (const [block, text] of uniqueRows(page)) {
      const other = rows.get(text)
      if (other && other !== page.slug) fail(page, `блок «${block}» повторяет страницу ${other}: «${text.slice(0, 60)}»`)
      else rows.set(text, page.slug)
    }
  }

  const slugs = pages.map(p => p.slug)
  for (const slug of new Set(slugs)) {
    if (slugs.filter(s => s === slug).length > 1) errors.push(`адрес /${slug}/ занят несколькими файлами`)
  }

  return errors
}

/** То же, но падает со списком ошибок — для сборки. */
export function assertLandings(pages, existing, publicDir) {
  const errors = validateLandings(pages, existing, publicDir)
  if (errors.length > 0) {
    throw new Error(`Посадочные страницы не прошли проверку (${errors.length}):\n  - ${errors.join('\n  - ')}`)
  }
  return pages
}

/** Слова видимого текста страницы — для контроля объёма (раздел 7.5 ТЗ). */
export function countWords(html) {
  const text = html
    .replace(/<script[\s\S]*?<\/script>/g, ' ')
    .replace(/<header[\s\S]*?<\/header>/g, ' ')
    .replace(/<footer[\s\S]*?<\/footer>/g, ' ')
    .replace(/<nav[\s\S]*?<\/nav>/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&[a-z#0-9]+;/gi, ' ')
  return text.split(/\s+/).filter(w => /[\p{L}\d]/u.test(w)).length
}
