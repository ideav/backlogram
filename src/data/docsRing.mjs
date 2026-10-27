// Кольцо «См. также» страниц документации (backlogram#798).
//
// Каждая страница справочника показывает в начале ссылки на остальные — по
// кругу, начиная со следующей за ней. Отсюда берут список ОБА представления:
// React-компонент src/components/DocsSeeAlso.tsx и пререндеры
// scripts/prerender-{api,triggers,templater}.mjs. Новую страницу документации
// достаточно добавить сюда — она появится во всех «См. также».

export const DOCS_RING = [
  { href: '/api.html', name: 'Справочник API', hint: 'команды ядра и curl' },
  { href: '/knowledge-base/28-query-engine-capabilities.html', name: 'Запросы', hint: 'что умеет движок отчётов' },
  { href: '/triggers.html', name: 'Триггеры кнопок', hint: 'действие по событию записи' },
  { href: '/stored-procedures.html', name: 'Хранимые процедуры', hint: 'запрос, который пишет данные' },
  { href: '/templater.html', name: 'Шаблонизатор', hint: 'HTML рабочих мест' },
]

/** Остальные страницы кольца, начиная со следующей за `path`. */
export function docsRingFor(path) {
  const i = DOCS_RING.findIndex((d) => d.href === path)
  if (i < 0) return DOCS_RING
  return [...DOCS_RING.slice(i + 1), ...DOCS_RING.slice(0, i)]
}

/** Та же полоса для статических снапшотов (без JS). */
export function docsRingHtml(path) {
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]))
  const links = docsRingFor(path).map((d) => `<a href="${esc(d.href)}">${esc(d.name)}</a>`).join(' · ')
  return `<nav class="docs-see-also" aria-label="См. также"><span>См. также:</span> ${links}</nav>`
}
