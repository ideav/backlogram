/**
 * Авторы-люди блога (issue #905, п. 1).
 *
 * Пост подписан строкой `author` во фронтматтере. Если строка совпадает с
 * именем отсюда, у поста появляется живой автор: `Person` в разметке, ссылка
 * на профиль `/authors/<slug>/` и `article:author` с адресом профиля. Прочие
 * подписи («Команда Интеграм») остаются коллективным автором — Organization.
 *
 * Данные — только то, что владелец разрешил публиковать. Биографию, фото и
 * sameAs не дописывать без его согласия: выдуманный автор хуже коллективного.
 */

/** @typedef {{ slug: string, name: string, jobTitle: string }} Author */

/** @type {Author[]} */
export const AUTHORS = [
  {
    slug: 'kim-artamonov',
    name: 'Ким Артамонов',
    jobTitle: 'Предприниматель и инженер',
  },
]

/** @param {string} name @returns {Author | undefined} */
export function authorByName(name) {
  const n = String(name ?? '').trim()
  return AUTHORS.find((a) => a.name === n)
}

/** @param {string} slug @returns {Author | undefined} */
export function authorBySlug(slug) {
  return AUTHORS.find((a) => a.slug === slug)
}

/** Путь профиля внутри блога (без base): `/authors/<slug>/`. */
export function authorPath(author) {
  return `/authors/${author.slug}/`
}
