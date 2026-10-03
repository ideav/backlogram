/**
 * Блок навигации для сырого HTML — то, что видит краулер без JS.
 *
 * Шапка и подвал сайта рисуются React'ом, поэтому в сырой HTML они не попадали:
 * на всех 51 странице карты сайта не было ни одной ссылки на `uslugi.html` и
 * `kvintety-ili-tablicy.html`, и для краулера без JS обе страницы оставались
 * сиротами (аудит 02.10.2026, issue #627, п. 3). Здесь тот же список ссылок, что
 * в меню (src/data/nav.mjs), превращается в статический `<nav>`; его вставляет
 * в каждую страницу `scripts/inject-static-nav.mjs` после всех пререндеров.
 *
 * Блок живёт первым ребёнком `#root`, поэтому при старте React он исчезает
 * вместе с остальным пререндером: `createRoot().render()` заменяет содержимое
 * `#root` целиком. В HTTP-ответе ссылки остаются.
 */
import { staticNavLinks } from '../../src/data/nav.mjs'

const escape = (s) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[c])

/** CSS блока: ссылки видимы и у клиента без JS, пока React не загрузился. */
const STYLE = `<style>
  #static-nav { max-width: 80rem; margin: 0 auto; padding: 1rem 1rem 0; font-size: 0.85rem;
    font-family: system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif; color: #475569; }
  #static-nav ul { display: flex; flex-wrap: wrap; gap: 0.35rem 1rem; list-style: none; margin: 0; padding: 0; }
  #static-nav a { color: #1d4ed8; text-decoration: none; }
  #static-nav a:hover { text-decoration: underline; }
  .dark #static-nav { color: #94a3b8; }
  .dark #static-nav a { color: #60a5fa; }
</style>`

/**
 * Разметка блока. `current` — путь текущей страницы: ссылку на саму себя
 * помечаем `aria-current`, но из списка не убираем (пусть у всех страниц
 * блок совпадает дословно — так проще проверять).
 */
export function renderStaticNav(current = '') {
  const items = staticNavLinks()
    .map((link) => {
      const self = link.href === current
      const attrs = self ? ' aria-current="page"' : ''
      return `    <li><a href="${escape(link.href)}"${attrs}>${escape(link.name)}</a></li>`
    })
    .join('\n')

  return `<nav id="static-nav" aria-label="Основная навигация">
  <ul>
${items}
  </ul>
</nav>${STYLE}`
}

/**
 * Вставка блока первым ребёнком `#root`. Если блок уже есть — ничего не делает,
 * чтобы повторный прогон сборки не плодил копии.
 */
export function injectStaticNav(html, current = '') {
  if (html.includes('id="static-nav"')) return html
  const anchor = '<div id="root">'
  const at = html.indexOf(anchor)
  if (at === -1) return html
  const cut = at + anchor.length
  return `${html.slice(0, cut)}\n${renderStaticNav(current)}${html.slice(cut)}`
}
