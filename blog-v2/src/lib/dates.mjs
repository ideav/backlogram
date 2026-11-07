/**
 * Машинная дата статьи для <time datetime>, article:*_time и JSON-LD (#898).
 *
 * pubDate во фронтматтере — дата без времени, YAML превращает её в полночь UTC.
 * `toISOString()` отдавал `2026-11-07T00:00:00.000Z` — время, которого никто
 * не ставил; аудит SEO/GEO принял его за шаблонную заглушку. Schema.org и
 * Open Graph принимают чистую дату ISO 8601, поэтому без явного времени
 * отдаём `YYYY-MM-DD`, а если время задано — полный ISO.
 *
 * @param {Date} date
 * @returns {string}
 */
export function machineDate(date) {
  const iso = date.toISOString()
  return iso.endsWith('T00:00:00.000Z') ? iso.slice(0, 10) : iso
}
