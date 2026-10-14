// Типы для src/lib/typography.mjs — см. комментарий в самом модуле.

/** Склеивает неразрывными пробелами фрагмент текста (без тегов). */
export function nbsp(text: string): string

/** То же, но склейка символом U+00A0 — для текстовых узлов DOM. */
export function nbspText(text: string): string

/** То же, но по текстовым узлам HTML: теги и атрибуты не меняются. */
export function nbspHtml(html: string): string
