// Даты для читателя и для разметки — один формат на оба представления сайта.
//
// Файл — plain ESM (.mjs), как src/data/*.mjs: его импортируют и React (через
// Vite), и Node-скрипты пререндера. Иначе у страницы и у её статического
// снапшота получаются разные подписи под одной и той же датой, а пара
// «сырой HTML против отрендеренного» — ровно то, что мерил SEO-аудит
// (issue #627). Типы — в src/lib/dates.d.ts.

/**
 * «2026-10-03» → «3 октября 2026».
 *
 * Полдень UTC и timeZone: 'UTC' — чтобы дата не уезжала на сутки назад в
 * часовых поясах западнее Гринвича: сборка идёт и на машинах разработчиков.
 * Хвост « г.», который добавляет русская локаль, убираем — в подписях сайта
 * его нет.
 */
export function humanDate(iso) {
  return new Date(`${iso}T12:00:00Z`)
    .toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      timeZone: 'UTC',
    })
    .replace(' г.', '')
}

/**
 * Строка свежести под заголовком: «Опубликовано 17 сентября 2026 · обновлено
 * 3 октября 2026». Если правок не было (updatedAt пуст или равен publishedAt),
 * остаётся только дата публикации — выдумывать обновление не нужно.
 */
export function freshnessLine(publishedAt, updatedAt) {
  const published = `Опубликовано ${humanDate(publishedAt)}`
  if (!updatedAt || updatedAt === publishedAt) return published
  return `${published} · обновлено ${humanDate(updatedAt)}`
}
