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
 * backlogram#910: в `#root` теперь настоящая страница, отрисованная на сборке
 * и гидрируемая в браузере, — чужой разметки там быть не должно. Блок стоит
 * прямо перед `#root` и виден только без JS: класс `js` на <html> ставит
 * inline-скрипт в index.html до первой отрисовки, так что посетитель с JS его
 * не видит ни в одном кадре (как раньше, когда React стирал блок вместе со
 * снимком). В HTTP-ответе ссылки остаются.
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
  html.js #static-nav { display: none; }
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
 * Вставка блока прямо перед `#root` (вне дерева React). Если блок уже есть —
 * ничего не делает, чтобы повторный прогон сборки не плодил копии.
 */
export function injectStaticNav(html, current = '') {
  if (html.includes('id="static-nav"')) return html
  const at = html.search(/<div id="root"[\s>]/)
  if (at === -1) return html
  return `${html.slice(0, at)}${renderStaticNav(current)}\n    ${html.slice(at)}`
}
