/**
 * Чтение фронтматтера статей БЕЗ astro:content.
 *
 * Нужно ровно одному потребителю — astro.config.mjs: карте сайта требуются даты
 * правки (lastmod) и счётчики тегов, а коллекция контента в конфиге ещё не
 * существует. Поэтому markdown читается напрямую, и разбирается только то, что
 * нужно карте: pubDate, updatedDate, draft и tags.
 *
 * Разбор узкий намеренно: это не YAML-парсер, а ровно формат фронтматтера
 * статей блога (значения в одну строку, теги — блочным списком). Если формат
 * разойдётся с content.config.ts, карта сайта просто потеряет lastmod у статьи,
 * а не сломает сборку.
 */
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { isPublished } from './published.mjs'
import { tagSlug } from './tag-slug.mjs'

// fileURLToPath, а не url.pathname: на Windows pathname даёт «/C:/…»,
// и readFileSync падает (та же грабля, что в тестах основного сайта).
const POSTS_DIR = fileURLToPath(new URL('../content/posts/', import.meta.url))

function parseFrontmatter(raw) {
  const m = /^---\r?\n([\s\S]*?)\r?\n---/.exec(raw)
  if (!m) return {}
  const out = {}
  let listKey = null
  for (const line of m[1].split(/\r?\n/)) {
    const item = /^\s*-\s+(.*)$/.exec(line)
    if (item && listKey) {
      out[listKey].push(unquote(item[1]))
      continue
    }
    const kv = /^([A-Za-z_][A-Za-z0-9_]*):\s*(.*)$/.exec(line)
    if (!kv) continue
    const [, key, value] = kv
    if (value === '') {
      listKey = key
      out[key] = []
    } else {
      listKey = null
      out[key] = unquote(value)
    }
  }
  return out
}

function unquote(value) {
  const v = value.trim()
  if ((v.startsWith("'") && v.endsWith("'")) || (v.startsWith('"') && v.endsWith('"'))) {
    return v.slice(1, -1)
  }
  return v
}

/**
 * @returns {{ slug: string, lastmod: string | null, tags: string[] }[]}
 *   Опубликованные статьи: slug совпадает с id коллекции (имя файла без .md).
 */
export function readPosts() {
  if (!existsSync(POSTS_DIR)) return []
  return readdirSync(POSTS_DIR)
    .filter((f) => f.endsWith('.md'))
    .map((file) => {
      const fm = parseFrontmatter(readFileSync(join(POSTS_DIR, file), 'utf8'))
      return {
        slug: file.replace(/\.md$/, ''),
        draft: fm.draft === 'true',
        pubDate: fm.pubDate ?? '',
        lastmod: fm.updatedDate ?? fm.pubDate ?? null,
        tags: Array.isArray(fm.tags) ? fm.tags : [],
      }
    })
    // То же правило, что у страниц: статья «из будущего» не должна ни попасть
    // в карту, ни добавить веса тегу (issue #726).
    .filter((p) => isPublished(p))
}

/** Слаги тегов, у которых статей меньше порога: {@link isThinTag}. */
export function tagCounts(posts) {
  const counts = new Map()
  for (const post of posts) {
    for (const tag of post.tags) {
      const slug = tagSlug(tag)
      counts.set(slug, (counts.get(slug) ?? 0) + 1)
    }
  }
  return counts
}
