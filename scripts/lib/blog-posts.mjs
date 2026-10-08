/**
 * Чтение статей блога (`blog-v2/src/content/posts/*.md`) обычным Node —
 * без Astro и без зависимостей.
 *
 * Зачем: главная (ideav.ru) и блог (ideav.ru/blog) — две независимые сборки.
 * React-приложению неоткуда взять список статей в рантайме, поэтому свежие
 * материалы «запекаются» в `src/data/blogPosts.mjs` на этапе сборки
 * (`scripts/generate-blog-posts.mjs`, issue #512). Разбор вынесен сюда, чтобы
 * тест мог сверить сгенерированный файл с исходным контентом, не запуская
 * генератор (тот сразу перезаписывает файл).
 *
 * YAML-фронтматтер разбирается мини-парсером: в постах встречаются только
 * скаляры (голые, в одинарных и двойных кавычках) и блочные списки (`tags`).
 * Свёрнутых блоков (`|`, `>`) и вложенных мэппингов в контенте нет — если
 * появятся, тест `tests/issue-512-blog-slider.test.mjs` поймает расхождение.
 */
import { readdirSync, readFileSync, existsSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { dayOf, isPublished, publishDay } from '../../blog-v2/src/lib/published.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const repoRoot = resolve(__dirname, '..', '..')

export const BLOG_URL = 'https://ideav.ru/blog'
export const POSTS_DIR = resolve(repoRoot, 'blog-v2/src/content/posts')
const BLOG_PUBLIC = resolve(repoRoot, 'blog-v2/public')

/** Сколько статей уезжает в слайдер на главной. */
export const SLIDER_LIMIT = 9

const MONTHS = [
  'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
  'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря',
]

/** Скаляр YAML: снимает кавычки и разворачивает экранирование. */
function unquote(raw) {
  const value = raw.trim()
  if (value.startsWith("'") && value.endsWith("'") && value.length > 1) {
    return value.slice(1, -1).replace(/''/g, "'")
  }
  if (value.startsWith('"') && value.endsWith('"') && value.length > 1) {
    return value.slice(1, -1).replace(/\\(["\\])/g, '$1')
  }
  return value
}

/** Фронтматтер поста → плоский объект (значения-списки собираются в массив). */
export function parseFrontmatter(source) {
  const block = source.match(/^---\r?\n([\s\S]*?)\r?\n---/)
  if (!block) return null

  const data = {}
  let listKey = null
  for (const line of block[1].split(/\r?\n/)) {
    const item = line.match(/^\s*-\s+(.*)$/)
    if (item && listKey) {
      data[listKey].push(unquote(item[1]))
      continue
    }
    const pair = line.match(/^([A-Za-z_][\w-]*):\s*(.*)$/)
    if (!pair) continue
    const [, key, rest] = pair
    if (rest.trim() === '') {
      listKey = key
      data[key] = []
    } else {
      listKey = null
      data[key] = unquote(rest)
    }
  }
  return data
}

/** «2026-07-17» → «17 июля 2026». Своя таблица месяцев — не зависим от ICU. */
export function formatDate(iso) {
  const [y, m, d] = iso.split('-').map(Number)
  return `${d} ${MONTHS[m - 1]} ${y}`
}

/**
 * Обложка карточки. Повторяет логику блога (`blog-v2/src/pages/index.astro`):
 * `image:` из фронтматтера → первая картинка из текста → абстрактная заглушка.
 * Для обложек с готовым OG-вариантом 1200×630 (`/uploads/og/<имя>.jpg`,
 * см. blog-v2/scripts/generate-og-covers.mjs) берём его: он легче исходного
 * скриншота и даёт единое соотношение сторон во всех карточках.
 */
function coverImage(data, body, index) {
  const declared = data.image || (body.match(/!\[[^\]]*\]\((\/uploads\/[^)\s]+)\)/) ?? [])[1]
  if (!declared) return `/abstract/blog-material-${(index % 6) + 1}.svg`
  if (!declared.startsWith('/uploads/')) return declared

  const stem = declared.slice(declared.lastIndexOf('/') + 1).replace(/\.[^.]+$/, '')
  const variant = `/uploads/og/${stem}.jpg`
  return existsSync(resolve(BLOG_PUBLIC, variant.slice(1))) ? variant : declared
}

/**
 * Свежие статьи блога, от новой к старой.
 *
 * Порядок и фильтр — как на самом блоге: черновики не берём, сортируем по
 * `pubDate`, а совпадающие даты оставляем в алфавитном порядке файлов —
 * сортировка стабильная, значит слайдер и главная блога идут в одном порядке.
 *
 * Отложенные статьи (issue #726): в список идут `limit` статей, уже вышедших к
 * дню `today`, и все статьи с датой позже него. Слайдер показывает только
 * наступившие (`visibleBlogPosts` в src/data/blogPosts.mjs), поэтому статья
 * появляется на главной в свой день сама, без пересборки сайта.
 */
export function readBlogPosts(limit = SLIDER_LIMIT, { today = publishDay() } = {}) {
  const files = readdirSync(POSTS_DIR)
    .filter((name) => name.endsWith('.md'))
    .sort()

  const posts = []
  for (const file of files) {
    const source = readFileSync(resolve(POSTS_DIR, file), 'utf8')
    const data = parseFrontmatter(source)
    if (!data) throw new Error(`blog-posts: нет фронтматтера в ${file}`)
    if (data.draft === 'true') continue
    if (!data.title || !data.pubDate) throw new Error(`blog-posts: нет title/pubDate в ${file}`)

    posts.push({
      slug: file.replace(/\.md$/, ''),
      title: data.title,
      description: data.description ?? '',
      date: dayOf(data.pubDate),
      category: data.category ?? 'Без категории',
      image: data.image ?? '',
      body: source.slice(source.indexOf('\n---', 3) + 4),
    })
  }

  posts.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))
  const upcoming = posts.filter((post) => !isPublished({ pubDate: post.date }, today))
  const published = posts.filter((post) => isPublished({ pubDate: post.date }, today))

  return [...upcoming, ...published.slice(0, limit)]
    .map((post, index) => ({
      slug: post.slug,
      url: `${BLOG_URL}/posts/${post.slug}/`,
      title: post.title,
      description: post.description,
      date: post.date,
      dateLabel: formatDate(post.date),
      category: post.category,
      image: BLOG_URL + coverImage(post, post.body, index),
    }))
}
