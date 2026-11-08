/**
 * backlogram#910: гидрация терпит неразрывные пробелы.
 *
 * Страницы рендерятся на сборке (scripts/render-ssr.mjs), затем
 * scripts/apply-typography.mjs расставляет в их тексте &nbsp;. React при
 * гидрации сравнивает текст DOM со своими строками и на расхождении бросает
 * «Text content does not match server-rendered HTML» — страница
 * перерисовывается с нуля, в консоли ошибка.
 *
 * Сравнение идёт через одну функцию нормализации react-dom (в исходниках
 * normalizeMarkupForTextOrAttribute: убирает \r и \u0000). Добавляем в неё
 * замену U+00A0 на пробел — «в&nbsp;4&nbsp;раза» и «в 4 раза» равны. Узел React
 * всё равно перепишет своей строкой (сравнение без нормализации отдельное), а
 * наблюдатель src/lib/install-typography.ts склеит его обратно в микрозадаче,
 * до отрисовки кадра.
 *
 * Правка в минифицированном react-dom привязана к его версии: если шаблон не
 * найден ровно один раз, сборка падает — после обновления React шаблон надо
 * сверить заново (tests/issue-910-ssr.test.mjs проверяет установленную версию).
 */

/** Production-сборка react-dom, которую правим. */
export const REACT_DOM_PROD = /react-dom[\/]cjs[\/]react-dom\.production\.min\.js$/

// function zf(a){return("string"===typeof a?a:""+a).replace(xf,"\n").replace(yf,"")}
const NORMALIZER_RE =
  /(function \w+\(a\)\{return\("string"===typeof a\?a:""\+a\)\.replace\(\w+,"\\n"\)\.replace\(\w+,""\))\}/g

export function patchHydrationNormalizer(code) {
  const found = code.match(NORMALIZER_RE) ?? []
  if (found.length !== 1) {
    throw new Error(`hydrate-nbsp: нормализатор текста react-dom найден ${found.length} раз вместо 1`)
  }
  return code.replace(NORMALIZER_RE, '$1.replace(/\\u00a0/g," ")}')
}

/** Vite-плагин: правка только в production-сборке клиента. */
export function hydrateNbsp() {
  return {
    name: 'hydrate-nbsp',
    enforce: 'pre',
    apply: 'build',
    transform(code, id) {
      if (!REACT_DOM_PROD.test(id)) return null
      return { code: patchHydrationNormalizer(code), map: null }
    },
  }
}
