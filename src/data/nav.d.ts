// Типы для src/data/nav.mjs (plain-ESM данные, общие для React и пререндера).

export interface NavLink {
  name: string
  href: string
  /** Внешний адрес: открывается в новой вкладке, в статический блок не идёт. */
  external?: boolean
  /** Пометка рядом с пунктом меню («New»). */
  badge?: string
  /** Иконка у пункта подвала: 'external' — стрелка «ссылка наружу». */
  icon?: 'external'
}

export interface NavGroup {
  title: string
  links: NavLink[]
}

export const headerNavLinks: NavLink[]
export const headerMoreLinks: NavLink[]
export const footerNavGroups: NavGroup[]
export const staticExtraLinks: NavLink[]
export function staticNavLinks(): { name: string; href: string }[]
