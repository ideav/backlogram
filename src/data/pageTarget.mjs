/**
 * Именованная вкладка для ссылки на другую страницу (ideav/crm#5609).
 *
 * Ссылка из справочника на другую страницу открывается не поверх текущей
 * (основная вкладка не теряется) и не в `_blank` (вкладки не плодятся), а в
 * вкладке с именем целевой страницы: `/api.html#schema-json` → `target="api"`.
 * Повторный клик по любой ссылке на /api.html попадает в ту же вкладку.
 *
 * Без target остаются якоря своей страницы, mailto:/tel:/javascript: и
 * переходы внутри сайта помощи (/help.html ↔ /help/<раздел>.html).
 * Общий для React (src/pages/*) и пререндера (scripts/prerender-*.mjs).
 */

const SITE_HOSTS = new Set(['ideav.ru', 'www.ideav.ru'])

/** Имя вкладки для href или null, если ссылка ведёт на ту же страницу. */
export function pageTarget(href, currentPath) {
  const raw = String(href ?? '').trim()
  if (!raw || raw.startsWith('#')) return null
  if (/^(mailto|tel|javascript|sms):/i.test(raw)) return null
  let url
  try {
    url = new URL(raw, 'https://ideav.ru/')
  } catch {
    return null
  }
  if (!/^https?:$/.test(url.protocol)) return null
  const own = SITE_HOSTS.has(url.hostname)
  const path = url.pathname.replace(/\/index\.html$/, '/')
  if (own && currentPath != null && samePath(path, currentPath)) return null
  // Хаб /help.html и страницы разделов /help/<id>.html — один сайт помощи
  // (backlogram#961): по нему ходят в той же вкладке.
  if (own && currentPath != null && isHelp(path) && isHelp(currentPath)) return null
  const slug = path.replace(/^\/+|\/+$/g, '').replace(/\.html$/, '') || 'index'
  return own ? slug : `${url.hostname}/${slug}`
}

const isHelp = (p) => /^\/help(\.html$|\/)/.test(String(p))

function samePath(a, b) {
  const norm = (p) => String(p).replace(/\/index\.html$/, '/').replace(/\/+$/, '') || '/'
  return norm(a) === norm(b)
}

function isExternal(href) {
  try {
    return !SITE_HOSTS.has(new URL(String(href), 'https://ideav.ru/').hostname)
  } catch {
    return false
  }
}

/** Атрибуты для JSX: `<a href={h} {...pageLinkProps(h, path)}>`. */
export function pageLinkProps(href, currentPath) {
  const target = pageTarget(href, currentPath)
  if (!target) return {}
  return isExternal(href) ? { target, rel: 'noopener' } : { target }
}

/** Те же атрибуты строкой для статического HTML: ` target="api"` или ''. */
export function pageLinkAttrs(href, currentPath) {
  const p = pageLinkProps(href, currentPath)
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]))
  return Object.entries(p).map(([k, v]) => ` ${k}="${esc(v)}"`).join('')
}
