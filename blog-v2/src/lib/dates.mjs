/**
 * Даты статей блога: машинная (для <time datetime>, article:*_time, JSON-LD)
 * и человеческая (на странице). Время редакции — московское (#898, #905).
 *
 * pubDate/updatedDate во фронтматтере бывают двух видов:
 *
 * - день: `'2026-10-20'` — z.coerce.date() делает из него полночь UTC.
 *   Это время никто не ставил, поэтому наружу уходит чистая дата `2026-10-20`
 *   (Schema.org и Open Graph её принимают). Раньше отдавался
 *   `2026-10-20T00:00:00.000Z`, и аудит принял его за заглушку;
 * - момент: `'2026-11-07T21:37:11+03:00'` — реальное время выкладки. Наружу
 *   уходит то же время с поясом Москвы: `2026-11-07T21:37:11+03:00`, а не
 *   пересчитанное в `…T18:37:11.000Z`.
 *
 * Ограничение: момент ровно в 03:00:00 МСК неотличим от «просто дня» —
 * ставьте секунды из реального времени, а не круглое 03:00.
 *
 * dateModified задаётся только при содержательной правке (updatedDate) —
 * опечатки и правки шаблона дату изменения не трогают.
 */

/** Москва без перехода на летнее время с 2014 года. */
const MSK_OFFSET_MS = 3 * 60 * 60 * 1000

/** Полночь UTC = во фронтматтере был только день. */
export function isDayOnly(date) {
  return date.toISOString().endsWith('T00:00:00.000Z')
}

/**
 * @param {Date} date
 * @returns {string} `YYYY-MM-DD` или `YYYY-MM-DDTHH:MM:SS+03:00`
 */
export function machineDate(date) {
  if (isDayOnly(date)) return date.toISOString().slice(0, 10)
  const msk = new Date(date.getTime() + MSK_OFFSET_MS).toISOString().slice(0, 19)
  return `${msk}+03:00`
}

/**
 * Дата для читателя: «07 ноября 2026». День считается по Москве — так момент
 * 01:30 МСК не уезжает на вчера, а полночь UTC (только день) остаётся тем же днём.
 *
 * @param {Date} date
 */
export function humanDate(date) {
  return date
    .toLocaleDateString('ru-RU', { day: '2-digit', month: 'long', year: 'numeric', timeZone: 'Europe/Moscow' })
    .replace(' г.', '')
}
