/**
 * Страницы «нужна табличка» (issue #790, план docs/marketing/template-seekers-plan.md).
 *
 * Аудитория ищет готовую таблицу: табель, приход-расход, журнал выдачи. Ей
 * отдают файл сразу и без формы, а контакт просят за следующий шаг — свою
 * копию шаблона (клон демо-базы). Этим страницы отличаются от посадочных
 * `landings/*.json`: свой `order.php`-блочный шаблон с формой `kind=copy`,
 * кнопки «Скачать Excel» и «Открыть онлайн» с целями воронки.
 *
 * Одна страница = один JSON в `site-excel/tpl/`. Разметку рисует
 * `src/pages/TplPage.tsx`, собирает пререндер `scripts/prerender-site-excel.mjs`.
 *
 * Модуль читают трое: пререндер, `vite.config.ts` (sitemap.xml, llms.txt) и
 * тесты — поэтому только Node и данные, без React и TS.
 */
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { FORBIDDEN, LIMITS, PLACEHOLDERS, norm, strings } from './landings.mjs'

const here = dirname(fileURLToPath(import.meta.url))
export const TPL_DIR = resolve(here, 'tpl')
const PUBLIC_DIR = resolve(here, 'public')

/** Читает все страницы шаблонов. Порядок — по `order`, потом по адресу. */
export function loadTplPages(dir = TPL_DIR) {
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
 * @param pages      страницы из loadTplPages()
 * @param existing   уже существующие страницы домена: [{ path, title, description }]
 * @param extraPaths пути самих tpl-страниц: перелинковка между ними разрешена,
 *                   а уникальность title/description каждая проверяет сама на себя
 * @param publicDir  каталог статики — проверить, что .xlsx на месте
 */
export function validateTplPages(pages, existing = [], extraPaths = [], publicDir = PUBLIC_DIR) {
  const errors = []
  const fail = (page, msg) => errors.push(`${page._file ?? page.slug}: ${msg}`)

  const knownPaths = new Set([...existing.map(p => p.path), ...extraPaths])

  for (const page of pages) {
    const need = (field, ok, msg) => {
      if (!ok(page[field])) fail(page, `${field}: ${msg}`)
    }
    const str = v => typeof v === 'string' && v.trim() !== ''
    const day = v => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(v))

    need('slug', v => typeof v === 'string' && /^[a-z0-9]+(-[a-z0-9]+)*$/.test(v), 'латиница, цифры и дефисы')
    if (page._file && page.slug && page._file !== `${page.slug}.json`) {
      fail(page, `файл должен называться ${page.slug}.json`)
    }
    for (const f of ['query', 'title', 'description', 'h1', 'lead', 'crumb', 'copyPromise']) need(f, str, 'обязательное поле')
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

    // Отдать то, что ищут: файл скачивается без формы, онлайн-версия в один клик.
    need(
      'xlsx',
      v => typeof v === 'string' && v.startsWith('/') && v.endsWith('.xlsx') && existsSync(resolve(publicDir, '.' + v)),
      'путь к .xlsx в public/, начинающийся с /',
    )
    need('demo', v => typeof v === 'string' && /^https:\/\//.test(v), 'https-адрес онлайн-версии')

    // Кнопки сами по себе конверсию не дают: страница обязана объяснить, что
    // внутри файла и почему онлайн-версия не «ещё одна таблица».
    need('inside', v => Array.isArray(v) && v.length >= 3 && v.length <= 6 && v.every(r => str(r?.what) && str(r?.note)), '3–6 строк { what, note }')
    need('pains', v => Array.isArray(v) && v.length === 3 && v.every(str), 'ровно 3 строки боли')
    need('onlineAnswer', str, 'обязательное поле')
    need('faq', v => Array.isArray(v) && v.length >= 3 && v.length <= 5 && v.every(r => str(r?.q) && str(r?.a)), '3–5 вопросов { q, a }')

    // Адрес, на который человек попадёт с кнопки «Открыть онлайн», обязан быть
    // честным: план (раздел 3) требует заранее называть домен ideav.ru.
    if (str(page.demo) && !/^https:\/\/[^/]*ideav\.ru\//.test(page.demo)) {
      fail(page, `демо ведёт на ${page.demo} — онлайн-версии живут на ideav.ru (раздел 3 плана)`)
    }

    // Соседние ссылки — на существующие страницы домена (как у посадочных).
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

  // title, description и H1 не повторяют друг друга и существующие страницы.
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

  const slugs = pages.map(p => p.slug)
  for (const slug of new Set(slugs)) {
    if (slugs.filter(s => s === slug).length > 1) errors.push(`адрес /${slug}/ занят несколькими файлами`)
  }

  return errors
}

/** То же, но падает со списком ошибок — для сборки. */
export function assertTplPages(pages, existing, publicDir) {
  const errors = validateTplPages(pages, existing, publicDir)
  if (errors.length > 0) {
    throw new Error(`Страницы шаблонов не прошли проверку (${errors.length}):\n  - ${errors.join('\n  - ')}`)
  }
  return pages
}
