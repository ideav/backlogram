// Типы для src/data/pageTarget.mjs (ideav/crm#5609).

/** Имя вкладки целевой страницы или null для ссылки на свою страницу. */
export function pageTarget(href: string, currentPath?: string | null): string | null

/** `{ target, rel? }` для JSX или `{}`. */
export function pageLinkProps(href: string, currentPath?: string | null): { target?: string; rel?: string }

/** ` target="…"` для статического HTML или ''. */
export function pageLinkAttrs(href: string, currentPath?: string | null): string
