/**
 * Обёртка снапшота пререндера в <main> внутри #root (backlogram#969, #973).
 *
 * inject-static-nav ставит статическое меню первым ребёнком #root. Экстракторы
 * основного текста (ИИ-поисковики, Readability) ищут <main>/<article>; без
 * <main> меню попадает в выжимку раньше H1. Поэтому тело кладём в <main>, а меню
 * остаётся вне его. SPA монтируется через createRoot без гидратации, так что
 * расхождений с React нет; в живом SPA <main> есть в src/App.tsx.
 *
 * Использование: html.replace(EMPTY_ROOT, rootWithMain(bodyHtml)).
 * Возвращает функцию-заменитель, чтобы `$&`, `$'` и т. п. в теле не
 * интерпретировались как шаблоны String.prototype.replace.
 * Если в теле уже есть <main>, второй не добавляется: на странице ровно один.
 */
export const EMPTY_ROOT = '<div id="root"></div>'

export function rootWithMain(body) {
  const inner = /<main[\s>]/.test(body) ? body : `<main>${body}</main>`
  return () => `<div id="root">${inner}</div>`
}
