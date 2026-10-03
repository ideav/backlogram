/**
 * Слаг тега — отдельным plain-ESM модулем, потому что его нужны два места,
 * которые нельзя свести к одному:
 *
 *   • src/lib/tags.ts — страницы тегов (импортирует astro:content);
 *   • astro.config.mjs — фильтр карты сайта (astro:content там недоступен).
 *
 * Карта кириллицы повторяет схему слагов WordPress, с которого переехал блог:
 * «Лайфхаки» → laifhaki, «Яндекс.Директ» → yandeks-direkt. Переписывать её
 * нельзя — сломаются живые адреса /blog/tag/<slug>/.
 */
const CYR_MAP = {
  а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'e',
  ж: 'zh', з: 'z', и: 'i', й: 'i', к: 'k', л: 'l', м: 'm',
  н: 'n', о: 'o', п: 'p', р: 'r', с: 's', т: 't', у: 'u',
  ф: 'f', х: 'h', ц: 'c', ч: 'ch', ш: 'sh', щ: 'sh',
  ъ: '', ы: 'y', ь: '', э: 'e', ю: 'yu', я: 'ya',
}

/** @param {string} tag @returns {string} */
export function tagSlug(tag) {
  const lower = tag.toLowerCase()
  let out = ''
  for (const ch of lower) {
    if (CYR_MAP[ch] !== undefined) out += CYR_MAP[ch]
    else if (/[a-z0-9-]/.test(ch)) out += ch
    else out += '-'
  }
  return out.replace(/-+/g, '-').replace(/^-|-$/g, '')
}

/**
 * Сколько статей должно быть у тега, чтобы страница тега шла в индекс.
 *
 * Аудит 02.10.2026 (issue #627, п. 6) оставил определение «тонкого тега» на
 * решение владельца. Выбран счётчик статей, а не объём текста: страница тега с
 * одной-двумя статьями — это почти дубль самой статьи, и ничего, кроме
 * перечисления тех же заголовков, на ней нет. Порог один на два места:
 * <meta name="robots"> страницы тега и фильтр карты сайта в astro.config.mjs.
 */
export const THIN_TAG_MIN_POSTS = 3

/** @param {number} count @returns {boolean} */
export function isThinTag(count) {
  return count < THIN_TAG_MIN_POSTS
}
