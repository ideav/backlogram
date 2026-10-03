// Русская микротипографика: неразрывные пробелы.
//
// Зачем: SEO-аудит 02.10.2026 (issue #627, п. 13) посчитал в сыром HTML сотни
// мест, где короткий предлог или союз остаётся в конце строки, а тире
// переносится на новую строку. На узких экранах это читается как рваный текст.
//
// Модуль — plain ESM с типами в typography.d.ts, чтобы его могли импортировать
// и Vite-сборка (React), и Node-скрипты сборки: применяется он в
// scripts/apply-typography.mjs ко всем страницам dist/ после пререндеров.
//
// Правила сознательно узкие: правим только то, что ломается почти всегда, и ни
// при каких условиях не трогаем содержимое тегов и атрибутов.

const NBSP = '&nbsp;'

// Односимвольные слова и двухбуквенные предлоги/частицы, которые нельзя
// оставлять в конце строки. Список закрытый: расширять его наугад опасно —
// склеенный блок «не» + длинное слово хуже, чем висящий предлог.
const SHORT_WORDS = [
  'а', 'в', 'и', 'к', 'о', 'с', 'у', 'я',
  'во', 'до', 'за', 'из', 'ко', 'на', 'не', 'об', 'от', 'по', 'со',
]

// Слева от короткого слова — начало текста, пробел, скобка, кавычка, тире или
// уже поставленный &nbsp;. Разделитель смотрим lookbehind'ом, а не группой:
// иначе в «и в базе» обработается только первое слово — его совпадение съест
// пробел, который нужен второму как разделитель.
const SHORT_WORD_RE = new RegExp(
  String.raw`(?<=^|[\s(\[«"'—–]|&nbsp;)(${SHORT_WORDS.join('|')})\s+`,
  'gi',
)

// Единицы измерения и счётные слова: «25 МБ», «120 пар/мин», «5 000 ₽».
const UNITS = [
  'МБ', 'КБ', 'ГБ', 'ТБ', '₽', 'руб', 'руб\\.', '%', 'мин', 'сек', 'ч', 'мс',
  'тыс', 'тыс\\.', 'млн', 'млрд', 'шт', 'шт\\.', 'г', 'г\\.', 'кг', 'м', 'км',
]
const NUMBER_UNIT_RE = new RegExp(String.raw`(\d)[ \t]+(${UNITS.join('|')})(?![\wА-Яа-яЁё])`, 'g')

/**
 * Склеивает неразрывными пробелами один фрагмент обычного текста.
 * На вход ждёт уже экранированный HTML-текст (без тегов).
 */
export function nbsp(text) {
  return (
    text
      .replace(SHORT_WORD_RE, (_, word) => `${word}${NBSP}`)
      .replace(NUMBER_UNIT_RE, (_, digit, unit) => `${digit}${NBSP}${unit}`)
      // тире не должно начинать строку
      .replace(/\s+([—–])/g, `${NBSP}$1`)
  )
}

// Элементы с «сырым» содержимым: внутри них разметки нет, зато есть символ «<»
// (`for (var j = 0; j < n; j++)` в счётчике Метрики). Поэтому их проходим не
// общим сканером, а прыжком до закрывающего тега — как это делает настоящий
// HTML-парсер для raw text elements.
const RAW_TEXT_TAGS = /^(script|style|textarea)$/i

// Элементы с нормальной разметкой внутри, но без текста для типографики.
const SKIP_TAGS = /^(template|pre|code|svg)$/i

/**
 * Применяет nbsp() только к текстовым узлам HTML: сами теги, атрибуты,
 * комментарии и содержимое SKIP_TAGS остаются байт-в-байт как были.
 */
export function nbspHtml(html) {
  let out = ''
  let i = 0
  let skipDepth = 0

  while (i < html.length) {
    const lt = html.indexOf('<', i)
    if (lt === -1) {
      out += skipDepth > 0 ? html.slice(i) : nbsp(html.slice(i))
      break
    }

    const text = html.slice(i, lt)
    out += skipDepth > 0 ? text : nbsp(text)

    // Комментарии и CDATA пропускаем целиком: внутри них может быть «>».
    if (html.startsWith('<!--', lt)) {
      const end = html.indexOf('-->', lt)
      if (end === -1) {
        out += html.slice(lt)
        break
      }
      out += html.slice(lt, end + 3)
      i = end + 3
      continue
    }

    const gt = html.indexOf('>', lt)
    if (gt === -1) {
      out += html.slice(lt)
      break
    }

    const tag = html.slice(lt, gt + 1)
    out += tag
    i = gt + 1

    const m = /^<(\/?)([a-zA-Z][a-zA-Z0-9-]*)/.exec(tag)
    if (!m || tag.endsWith('/>')) continue

    const [, closing, name] = m

    if (!closing && RAW_TEXT_TAGS.test(name)) {
      // всё до закрывающего тега — как есть, ничего не разбирая
      const close = html.toLowerCase().indexOf(`</${name.toLowerCase()}`, i)
      if (close === -1) {
        out += html.slice(i)
        i = html.length
      } else {
        out += html.slice(i, close)
        i = close
      }
      continue
    }

    if (SKIP_TAGS.test(name)) {
      if (closing) skipDepth = Math.max(0, skipDepth - 1)
      else skipDepth += 1
    }
  }

  return out
}
