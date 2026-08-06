/**
 * issue #555 — поиск по блогу кидал на экран авторизации Интеграма.
 *
 * Форма поиска на главной блога уходила по `action="/search/"`. Блог живёт в
 * подпапке `/blog/` (issue #522), а вебрут ideav.ru общий с движком Интеграма:
 * front controller шлёт всё, что не файл и не директория, в `index.php`, а
 * движок читает первый сегмент пути как имя базы. Итог — «База «search» не
 * найдена» и форма входа вместо результатов.
 *
 * Первопричина шире одной формы: `base` Astro подставляет только в свои ассеты
 * и маршруты, рукописный путь он не трогает. В блоге для таких путей есть один
 * помощник — `withBase()`. Тест сторожит именно это: ни один рукописный адрес
 * от корня не должен обходить помощник. Проверка #522 сторожила наличие
 * конфигурации, но не её сплошное применение — в эту щель баг и прошёл.
 */
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'

const repo = new URL('..', import.meta.url).pathname
const blogSrc = join(repo, 'blog-v2/src')
const read = (path) => readFileSync(join(repo, path), 'utf8')

function sources(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name)
    if (statSync(path).isDirectory()) sources(path, out)
    else if (/\.(astro|ts)$/.test(name)) out.push(path)
  }
  return out
}

/**
 * Литеральный путь от корня в атрибуте адреса: href="/…", action="/…", src="/…".
 * Такой путь Astro отдаёт как есть — мимо базы. Написанный через помощник он
 * выглядит иначе (`href={withBase("/…")}`) и под шаблон не попадает.
 *
 * Протокольные адреса (`//cdn…`) исключены: это внешние ссылки, база им не нужна.
 */
const LITERAL_ROOT_PATH = /(?:href|src|action|srcset|data-src)\s*=\s*"(\/(?!\/)[^"]*)"/g

/**
 * Комментарии выкидываем: в них такие адреса встречаются как пример — в том
 * числе в документации самого `withBase`. Строчные `//` режем только когда
 * строка с них начинается, иначе обрезался бы хвост строки после `https://…`
 * и настоящее нарушение за внешней ссылкой осталось бы незамеченным.
 */
function stripComments(code) {
  return code
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/^\s*\/\/.*$/gm, '')
}

test('рукописные адреса блога не обходят withBase', () => {
  const escaped = []

  for (const file of sources(blogSrc)) {
    const code = stripComments(readFileSync(file, 'utf8'))
    for (const [, path] of code.matchAll(LITERAL_ROOT_PATH)) {
      escaped.push(`${relative(repo, file)}: ${path}`)
    }
  }

  assert.deepEqual(
    escaped,
    [],
    'адрес от корня мимо withBase уйдёт в вебрут ideav.ru и попадёт движку Интеграма:\n' +
      escaped.join('\n'),
  )
})

test('форма поиска на главной блога ведёт в подпапку блога', () => {
  const index = read('blog-v2/src/pages/index.astro')

  assert.match(
    index,
    /<form[^>]*class="product-blog-search"[^>]*action=\{withBase\("\/search\/"\)\}/,
    'action формы обязан приклеивать базу — иначе GET уходит на ideav.ru/search/',
  )
  assert.doesNotMatch(index, /action="\/search\/"/)
})

test('страница поиска принимает запрос из строки адреса', () => {
  // Форма отправляется методом GET и передаёт запрос через ?q=. Если страница
  // перестанет его читать, ссылка перестанет искать молча: поле будет пустым.
  const search = read('blog-v2/src/pages/search.astro')

  assert.match(read('blog-v2/src/pages/index.astro'), /method="get"/)
  assert.match(search, /new URLSearchParams\(location\.search\)/)
  assert.match(search, /params\.get\('q'\)/)
})

test('индекс поиска подгружается из подпапки блога', () => {
  // pagefind лежит в /blog/pagefind/. Импорт по корневому пути ушёл бы движку
  // ровно так же, как сама форма, — только молча, в консоли.
  const search = read('blog-v2/src/pages/search.astro')

  assert.match(search, /define:vars=\{\{ base: withBase\('\/'\) \}\}/)
  assert.match(search, /import\(`\$\{base\}pagefind\/pagefind\.js`\)/)
  assert.match(search, /baseUrl: base/)
})
