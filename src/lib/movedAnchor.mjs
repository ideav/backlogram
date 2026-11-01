/**
 * #830: адрес переадресации со старого якоря главной (`/#cases`, `/#pricing`…,
 * см. MOVED_ANCHORS в src/pages/Home.tsx) с сохранённой строкой запроса.
 *
 * UTM-метки и yclid живут в `search`. Если их отбросить, первый просмотр (главная)
 * Метрика запишет с метками, а второй — уже в разделе — без них. Строка запроса
 * ставится перед `#якорем` цели: `/razdel.html?utm_source=…#pricing`.
 *
 * @param {string} target путь раздела, возможно с `#якорем`
 * @param {string} search `location.search` — пусто или начинается с `?`
 * @returns {{ pathname: string, search: string, hash: string }} объект для navigate()
 */
export function movedAnchorTarget(target, search) {
  const i = target.indexOf('#')
  return {
    pathname: i < 0 ? target : target.slice(0, i),
    search: search || '',
    hash: i < 0 ? '' : target.slice(i),
  }
}
