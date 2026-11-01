// Типы для src/lib/movedAnchor.mjs — см. комментарий в самом модуле.

/** Адрес переадресации со старого якоря главной с сохранённой строкой запроса (#830). */
export function movedAnchorTarget(
  target: string,
  search: string,
): { pathname: string; search: string; hash: string }
