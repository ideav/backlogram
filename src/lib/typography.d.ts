// Типы для src/lib/typography.mjs — см. комментарий в самом модуле.

/** Склеивает неразрывными пробелами фрагмент текста (без тегов). */
export function nbsp(text: string): string

/** То же, но по текстовым узлам HTML: теги и атрибуты не меняются. */
export function nbspHtml(html: string): string
