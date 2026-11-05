/**
 * Фоны hero «Пути адепта» — A/B по темам. Страница при каждом заходе берёт
 * следующую тему по кругу (последняя показанная — в куке ideav_adept_hero),
 * отмечает показ параметром визита Метрики `adept_hero` и передаёт id темы в заявке: строкой в тексте
 * для Telegram и параметром цели `lead`. Картинки рисует
 * scripts/generate-adept-heroes.mjs.
 *
 * id — стабильная метка для аналитики: не переименовывать, новую тему
 * добавлять новым id.
 */
export const ADEPT_HEROES = [
  { id: 'samurai', label: 'Путь самурая', src: '/adept/hero-samurai.webp' },
  { id: 'anime', label: 'Аниме-закат', src: '/adept/hero-anime.webp' },
  { id: 'cyberpunk', label: 'Киберпанк', src: '/adept/hero-cyberpunk.webp' },
  { id: 'synthwave', label: 'Ретровейв', src: '/adept/hero-synthwave.webp' },
  { id: 'cosmos', label: 'Космос', src: '/adept/hero-cosmos.webp' },
]

/** Кука с id последней показанной темы — по ней следующая. */
export const ADEPT_HERO_COOKIE = 'ideav_adept_hero'

/**
 * Тема на этот заход — ротация: следующая по кругу после прошлой (`lastId`
 * из куки), так что каждый заход новая картинка и показы делятся поровну.
 * Без куки (первый заход) или с неизвестным id — случайная. `random` — для тестов.
 */
export function nextAdeptHero(lastId, random = Math.random) {
  const i = ADEPT_HEROES.findIndex(h => h.id === lastId)
  if (i >= 0) return ADEPT_HEROES[(i + 1) % ADEPT_HEROES.length]
  return ADEPT_HEROES[Math.min(ADEPT_HEROES.length - 1, Math.floor(random() * ADEPT_HEROES.length))]
}

/** Прочитать id из строки document.cookie. */
export function readAdeptHeroCookie(cookie) {
  const m = String(cookie || '').match(/(?:^|;\s*)ideav_adept_hero=([^;]*)/)
  return m ? decodeURIComponent(m[1]) : null
}

/** Строка для document.cookie: год, весь сайт. */
export function adeptHeroCookie(id) {
  return `${ADEPT_HERO_COOKIE}=${encodeURIComponent(id)}; path=/; max-age=31536000; SameSite=Lax`
}
