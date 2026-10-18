/**
 * Разметка текста сообщения Telegram для показа на сайте (#769: отчёт бота
 * сборки в модальном окне на /put-adepta.html).
 *
 * Исходник — плоский текст, каким бот его отправил. Форматирование
 * восстанавливается по тем же признакам, что видит глаз в Telegram:
 *  - первая строка и короткие строки-заголовки с эмодзи («📋 Бизнес-процесс:») — жирные;
 *  - у пунктов «• Роль — описание» и «🔐 Супер-пользователь … — …» жирное имя до тире;
 *  - заголовки капсом внутри абзаца («ОГРАНИЧЕНИЯ И СЛЕДУЮЩИЕ ШАГИ:») — жирные;
 *  - ссылки кликабельны, строка «-----» — разделитель.
 *
 * Возвращает массив строк: { hr: true } или { segs: [{ t, b?, href? }] }.
 */

const HEADING_MAX = 40
const INLINE = /(https?:\/\/[^\s]+|[А-ЯЁ][А-ЯЁ -]{5,}[А-ЯЁ]:)/g

function inline(text, bold) {
  if (bold) return text ? [{ t: text, b: true }] : []
  const segs = []
  let last = 0
  for (const m of text.matchAll(INLINE)) {
    if (m.index > last) segs.push({ t: text.slice(last, m.index) })
    segs.push(m[0].startsWith('http') ? { t: m[0], href: m[0] } : { t: m[0], b: true })
    last = m.index + m[0].length
  }
  if (last < text.length) segs.push({ t: text.slice(last) })
  return segs
}

export function parseTelegramMessage(text) {
  return String(text ?? '')
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map((line, i) => {
      if (/^-{3,}$/.test(line.trim())) return { hr: true }
      const dash = line.indexOf(' — ')
      if (i > 0 && /^(•|🔐)/u.test(line) && dash > 0) {
        return { segs: [...inline(line.slice(0, dash), true), ...inline(line.slice(dash), false)] }
      }
      // строка со ссылкой («🔗 Приложение: https://…») не заголовок — ссылка должна остаться ссылкой
      const isHeading =
        i === 0 || (line.length > 0 && line.length <= HEADING_MAX && !/^[\p{L}\d\s]/u.test(line) && !line.includes('http'))
      if (isHeading) return { segs: inline(line, true) }
      return { segs: inline(line, false) }
    })
}
