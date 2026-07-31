/**
 * remark-плагин: приклеивает базовый путь блога к ссылкам и картинкам внутри
 * статей (issue #522).
 *
 * В markdown статей 122 картинки вида `![](/uploads/…)` и 29 перекрёстных
 * ссылок `[текст](/posts/<slug>/)`. Astro такие пути не трогает — он подставляет
 * `base` только в свои ассеты и маршруты. На подпапке `/blog/` они уходили в
 * корень основного домена: картинки 404, перелинковка вела на SPA.
 *
 * Плагин переписывает ТОЛЬКО пути от корня (`/…`). Внешние ссылки, протокольные
 * (`//…`), якоря и mailto остаются как есть; уже приклеенный base не дублируется —
 * поэтому повторный проход безопасен.
 *
 * Зависимостей нет намеренно: дерево обходится вручную, чтобы не тянуть
 * `unist-util-visit` в блог, который собирается на голом Astro.
 */

/** Узлы, у которых адрес лежит в `url`. */
const URL_NODES = new Set(['link', 'image', 'definition'])

function joinBase(base, url) {
  if (typeof url !== 'string') return url
  if (!url.startsWith('/') || url.startsWith('//')) return url
  if (url === base || url.startsWith(`${base}/`)) return url
  return `${base}${url}`
}

function walk(node, visit) {
  visit(node)
  const children = node.children
  if (!Array.isArray(children)) return
  for (const child of children) walk(child, visit)
}

export function remarkBaseUrls(options = {}) {
  const base = String(options.base ?? '').replace(/\/+$/, '')

  return function transform(tree) {
    if (!base) return

    walk(tree, (node) => {
      if (URL_NODES.has(node.type)) {
        node.url = joinBase(base, node.url)
        return
      }
      // Встроенный HTML (например <img src="/uploads/…">) — переписываем
      // атрибуты src/href текстом: узлы html в mdast не разбираются.
      if ((node.type === 'html' || node.type === 'raw') && typeof node.value === 'string') {
        node.value = node.value.replace(
          /\b(src|href)=("|')(\/[^"']*)\2/g,
          (match, attr, quote, url) => `${attr}=${quote}${joinBase(base, url)}${quote}`,
        )
      }
    })
  }
}

export default remarkBaseUrls
