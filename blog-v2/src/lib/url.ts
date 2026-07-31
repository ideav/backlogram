/**
 * Блог живёт в подпапке основного домена: https://ideav.ru/blog/ (issue #522).
 *
 * Astro сам приклеивает `base` к своим ассетам и к маршрутам, которые строит
 * из файловой структуры. Но пути, написанные руками, он не трогает: `href="/"`,
 * `/posts/<slug>/`, обложка из фронтматтера, favicon, импорт pagefind. Такой
 * путь на подпапке уходит в корень основного домена — ровно это и сломалось,
 * когда сборку под корень поддомена скопировали в `/blog/`.
 *
 * Здесь единственное место, где base приклеивается к таким путям.
 */

/** База без хвостового слэша: '/blog'. В dev и в проде значение одно. */
const BASE = import.meta.env.BASE_URL.replace(/\/+$/, '')

/**
 * Путь от корня блога → путь от корня сайта.
 * Внешние ссылки, якоря, mailto и уже приклеенный base возвращаются как есть,
 * поэтому помощник безопасно применять повторно.
 */
export function withBase(path: string): string {
  if (!path.startsWith('/') || path.startsWith('//')) return path
  if (!BASE) return path
  if (path === BASE || path.startsWith(`${BASE}/`)) return path
  return `${BASE}${path}`
}

/** Абсолютный URL страницы блога — для canonical, og:image, RSS и llms.txt. */
export function absoluteWithBase(path: string, site: URL | string): string {
  return new URL(withBase(path), site).toString()
}

/**
 * Обратная операция: путь запроса без базы — чтобы сравнивать текущий адрес
 * с ссылками меню («/», «/category/…/») и подсвечивать активный пункт.
 */
export function stripBase(pathname: string): string {
  if (!BASE || !pathname.startsWith(BASE)) return pathname
  const rest = pathname.slice(BASE.length)
  return rest.startsWith('/') ? rest : `/${rest}`
}
