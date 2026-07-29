/**
 * Разбор `public/sitemap.xml` на блоки `<url>` — общий код для
 * `scripts/sync-kb-sitemap.mjs` и теста `tests/issue-508-sitemap-crlf.test.mjs`.
 *
 * Почему отдельным модулем: сборка падала на Windows (issue #508). Регулярка
 * искала `</url>\n`, а Git с `core.autocrlf=true` кладёт в рабочую копию
 * `</url>\r\n` — совпадений ноль, скрипт выходил с кодом 1 ещё до `vite build`.
 * Разбор вынесен сюда, чтобы его можно было проверить на CRLF-тексте, не
 * запуская сам скрипт (тот при импорте сразу читает и переписывает файлы).
 */

/** Перевод строки, которым набран файл: рабочая копия Windows — CRLF. */
export function detectEol(source) {
  return source.includes('\r\n') ? '\r\n' : '\n'
}

/**
 * Все блоки `<url>…</url>` вместе с отступом и переводом строки.
 * Возвращает `{ text, start, end, loc }`; `text` — дословный кусок исходника,
 * чтобы руками выставленные `lastmod`/`priority` пережили перезапись.
 */
export function splitUrlBlocks(source) {
  return [...source.matchAll(/[ \t]*<url>[\s\S]*?<\/url>[ \t]*\r?\n?/g)].map((m) => ({
    text: m[0],
    start: m.index,
    end: m.index + m[0].length,
    loc: (m[0].match(/<loc>([^<]+)<\/loc>/) ?? [])[1] ?? '',
  }))
}
