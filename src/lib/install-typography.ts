// Живая типографика смонтированного SPA (issue #753).
//
// Статический HTML склеивает scripts/apply-typography.mjs ещё на сборке, но
// React монтируется в #root поверх пререндер-снапшота и дальше рисует тексты
// из исходных строк, с обычными пробелами: «в 4 раза» снова начинало рваться
// уже в браузере, хотя в dist/quiz.html всё было склеено.
//
// Правила те же — src/lib/typography.mjs, только склейка идёт символом
// U+00A0: текстовому узлу нельзя присвоить «&nbsp;», он им и останется на
// экране. Проход ставится один раз в App, дальше за DOM следит
// MutationObserver: догоняет и смену маршрута, и перерисовку отдельных
// текстов. Собственные правки наблюдатель тоже видит, но правила идемпотентны
// — повторный проход ничего не меняет, и цикл останавливается.

import { nbspText } from './typography'

// Внутри этих элементов и полей ввода текст не переносится — склейка не нужна.
// Те же, что в постпроходе dist (raw text + pre/code/template/svg), плюс то,
// что бывает на живой странице и не бывает в статическом HTML.
const SKIP_TAGS = new Set([
  'PRE',
  'CODE',
  'SCRIPT',
  'STYLE',
  'TEXTAREA',
  'TEMPLATE',
  'SVG',
  'NOSCRIPT',
])

function insideSkipped(node: Text): boolean {
  for (let el = node.parentElement; el; el = el.parentElement) {
    if (SKIP_TAGS.has(el.tagName) || el.isContentEditable) return true
  }
  return false
}

/** Склеивает один текстовый узел; элемент — проходом по его поддереву. */
function glue(node: Node): void {
  if (node.nodeType === Node.TEXT_NODE) {
    const text = node as Text
    if (!text.data.includes(' ') || insideSkipped(text)) return
    const glued = nbspText(text.data)
    if (glued !== text.data) text.data = glued
    return
  }
  if (node.nodeType !== Node.ELEMENT_NODE || SKIP_TAGS.has((node as Element).tagName)) return

  const walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT)
  for (let t = walker.nextNode(); t; t = walker.nextNode()) glue(t)
}

/**
 * Применяет правила к текущему содержимому root и ставит наблюдателя за
 * дальнейшими изменениями. Возвращает функцию отключения — для React Strict
 * Mode и горячей перезагрузки.
 */
export function installTypography(root: ParentNode = document.body): () => void {
  glue(root)

  const observer = new MutationObserver(mutations => {
    for (const m of mutations) {
      if (m.type === 'characterData') {
        glue(m.target)
      } else {
        for (const added of m.addedNodes) glue(added)
      }
    }
  })
  observer.observe(root, { childList: true, subtree: true, characterData: true })

  return () => observer.disconnect()
}
