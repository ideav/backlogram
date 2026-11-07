/**
 * Отложенная публикация статей блога (issue #726).
 *
 * Статья с `pubDate` в будущем не попадает никуда: ни страницы статьи, ни
 * ленты, категорий, тегов, RSS, llms.txt, карты сайта, поиска pagefind, ни
 * слайдера на главной ideav.ru. Так статьи можно писать и выкладывать по
 * готовности, а читатель и поисковик увидят их в день публикации. Блог
 * статический, поэтому в этот день его нужно пересобрать — см. README блога,
 * раздел «Отложенная публикация».
 *
 * День считается по Москве: `pubDate: 2026-10-20` открывается в 00:00 МСК
 * 20 октября, а не в 03:00, как было бы по полуночи UTC.
 *
 * Модуль — обычный JS без astro:content: его берут и Astro-страницы, и
 * astro.config.mjs (через posts-meta.mjs), и Node-скрипт слайдера главной
 * (scripts/lib/blog-posts.mjs). Правило одно на всех, иначе главная начнёт
 * ссылаться на статью, которой в блоге ещё нет.
 */

const TIME_ZONE = 'Europe/Moscow'
const DAY = /^\d{4}-\d{2}-\d{2}$/

/** Календарный день `YYYY-MM-DD` по Москве. */
export function moscowDay(now = new Date()) {
  // en-CA форматирует дату как YYYY-MM-DD.
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now)
}

/**
 * День, на который собирается блог. По умолчанию — сегодня по Москве.
 * `BLOG_TODAY=2026-12-31 npm run dev` — посмотреть, как блог будет выглядеть в
 * этот день, со всеми статьями, опубликованными к нему.
 */
export function publishDay() {
  const forced = process.env.BLOG_TODAY
  if (!forced) return moscowDay()
  if (!DAY.test(forced)) throw new Error(`BLOG_TODAY: нужна дата YYYY-MM-DD, а не «${forced}»`)
  return forced
}

/** `pubDate` → `YYYY-MM-DD`: строка из фронтматтера или Date из astro:content. */
export function dayOf(pubDate) {
  // Только день ('2026-10-20', в Date — полночь UTC) — берём его как есть.
  // Момент со временем и поясом ('2026-11-07T01:30:00+03:00', #905) — день по
  // Москве, иначе ночная выкладка уехала бы на вчера по UTC.
  const s = pubDate instanceof Date ? pubDate.toISOString() : String(pubDate)
  if (DAY.test(s) || s.endsWith('T00:00:00.000Z')) return s.slice(0, 10)
  return moscowDay(new Date(s))
}

/** Статья видна: не черновик и день публикации уже наступил. */
export function isPublished({ draft, pubDate }, today = publishDay()) {
  return draft !== true && draft !== 'true' && dayOf(pubDate) <= today
}
