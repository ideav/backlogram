import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readdirSync, readFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const POSTS_DIR = join(__dirname, '..', 'blog-v2', 'src', 'content', 'posts')
const HTACCESS = join(__dirname, '..', 'blog-v2', 'public', '.htaccess')

/**
 * Regression coverage for https://github.com/ideav/backlogram/issues/502
 *
 * Яндекс.Вебмастер держит в «Исключённых» страницы ideav.ru/blog, и часть из
 * них — легаси-адреса старого HTMLy-блога (/YYYY/MM/<slug>, /archive/<...>),
 * попавшие в обход уже на новом домене и отдающие 404. `old-blog-redirect/`
 * закрывает эту карту на стороне blog.ideav.online, а `blog-v2/public/.htaccess`
 * — её зеркало на самом ideav.ru/blog.
 *
 * Инварианты, которые сторожит тест:
 *  - легаси-URL поста ведёт на существующий /posts/<slug>/ (никаких 301 -> 404);
 *  - легаси-URL без поста и архивы уходят на главную, а не в 404;
 *  - живые маршруты нового блога (/posts/, /tag/, /category/, /search,
 *    /rss.xml, статика) правилами не задеты;
 *  - правило /sitemap.xml -> /sitemap-index.xml из #480 никуда не делось.
 */

const htaccess = readFileSync(HTACCESS, 'utf8')
const postSlugs = new Set(
  readdirSync(POSTS_DIR)
    .filter((f) => f.endsWith('.md'))
    .map((f) => f.replace(/\.md$/, '')),
)

/**
 * Order-faithful simulator of blog-v2/public/.htaccess.
 * `RewriteCond %{DOCUMENT_ROOT}/posts/$1/index.html -f` моделируется набором
 * слагов из контент-коллекции: Astro собран с build.format 'directory', так что
 * каждый пост на диске — это /posts/<slug>/index.html.
 * Возвращает целевой путь или null, если запрос отдаётся как есть.
 */
function redirect(url) {
  // Блог переехал в подпапку основного домена (issue #522): запрос приходит как
  // /blog/…, а mod_rewrite внутри .htaccess каталога видит путь ОТНОСИТЕЛЬНО
  // него (RewriteBase /blog/). Симулятор повторяет ровно это.
  const withoutBase = url.replace(/^\/blog\/?/, '/')
  const p = withoutBase.replace(/^\/+/, '').split('?')[0]

  if (/^sitemap\.xml$/.test(p)) return '/blog/sitemap-index.xml'

  let m
  if ((m = p.match(/^[0-9]{4}\/[0-9]{2}\/([^/]+)\/?$/)) && postSlugs.has(m[1]))
    return `/blog/posts/${m[1]}/`
  if ((m = p.match(/^post\/([^/]+)\/?$/)) && postSlugs.has(m[1]))
    return `/blog/posts/${m[1]}/`
  if (/^feed(\/(rss|opml))?\/?$/.test(p)) return '/blog/rss.xml'
  if (/^[0-9]{4}\/[0-9]{2}(\/|$)/.test(p)) return '/blog/'
  if (/^(archive|author|type|post)(\/|$)/.test(p)) return '/blog/'

  return null // ничего не совпало — отдаём файл с диска (или 404 блога)
}

test('.htaccess существует и содержит оба блока правил', () => {
  assert.ok(existsSync(HTACCESS), 'blog-v2/public/.htaccess must exist')
  // #480 — не потерять при правках.
  // Именно RewriteRule: mod_rewrite в этом файле отрабатывает раньше mod_alias,
  // и catch-all 404 съедал RedirectMatch (проверено докером, issue #522).
  assert.match(
    htaccess,
    /RewriteRule \^sitemap\\\.xml\$ \/blog\/sitemap-index\.xml \[R=301/,
  )
  // #502 — датированный пермалинк проверяется на существование поста.
  assert.match(
    htaccess,
    /RewriteCond %\{DOCUMENT_ROOT\}\/blog\/posts\/\$1\/index\.html -f/,
  )
  assert.match(
    htaccess,
    /RewriteRule \^\[0-9\]\{4\}\/\[0-9\]\{2\}\/\(\[\^\/\]\+\)\/\?\$ \/blog\/posts\/\$1\/ \[R=301/,
  )
  // Фолбэк на главную для легаси без поста.
  assert.match(
    htaccess,
    /RewriteRule \^\(archive\|author\|type\|post\)\(\/\|\$\) \/blog\/ \[R=301/,
  )
})

test('404-адреса из выгрузки Вебмастера (#502) больше не 404', () => {
  const cases = [
    ['/blog/2024/03/crm-sistema-dlya-srednego-biznesa', '/blog/posts/crm-sistema-dlya-srednego-biznesa/'],
    ['/blog/2024/04/pravilo-6-tehnicheskoe-zadanie', '/blog/posts/pravilo-6-tehnicheskoe-zadanie/'],
    [
      '/blog/2023/12/keis-sistema-dlya-obzvona-spyashih-klientov-za-1-chas',
      '/blog/posts/keis-sistema-dlya-obzvona-spyashih-klientov-za-1-chas/',
    ],
    ['/blog/archive/2024-07', '/blog/'],
  ]
  for (const [url, expected] of cases) {
    assert.equal(redirect(url), expected, `${url} should -> ${expected}`)
  }
})

test('ни один 301 не ведёт в 404: цель поста всегда существует', () => {
  const offenders = []
  for (const slug of postSlugs) {
    const target = redirect(`/blog/2024/03/${slug}`)
    if (target !== `/blog/posts/${slug}/`) offenders.push(`${slug} -> ${target}`)
  }
  assert.equal(offenders.length, 0, offenders.join('\n'))

  // Удалённый/переименованный пост не превращается в 301 -> 404.
  assert.equal(redirect('/blog/2024/03/etogo-posta-bolshe-net'), '/blog/')
  assert.equal(redirect('/blog/post/etogo-posta-bolshe-net'), '/blog/')
})

test('легаси-пермалинки HTMLy и фиды перекрыты', () => {
  const [anySlug] = postSlugs
  assert.equal(redirect(`/blog/post/${anySlug}`), `/blog/posts/${anySlug}/`)
  assert.equal(redirect(`/blog/post/${anySlug}/`), `/blog/posts/${anySlug}/`)
  assert.equal(redirect('/blog/feed'), '/blog/rss.xml')
  assert.equal(redirect('/blog/feed/rss'), '/blog/rss.xml')
  assert.equal(redirect('/blog/feed/opml'), '/blog/rss.xml')
  assert.equal(redirect('/blog/2024/07'), '/blog/')
  assert.equal(redirect('/blog/archive'), '/blog/')
})

test('живые маршруты нового блога правилами не задеты', () => {
  const [anySlug] = postSlugs
  for (const url of [
    '/blog/',
    `/blog/posts/${anySlug}/`,
    '/blog/tag/integram/',
    '/blog/category/razrabotka/',
    '/blog/search',
    '/blog/rss.xml',
    '/blog/llms.txt',
    '/blog/robots.txt',
    '/blog/sitemap-index.xml',
    '/blog/sitemap-0.xml',
    '/blog/uploads/2024/03/pic.jpg',
    '/blog/_astro/index.css',
    '/blog/pagefind/pagefind.js',
  ]) {
    assert.equal(redirect(url), null, `${url} must be served, not redirected`)
  }
})

test('query-строка не мешает совпадению правил', () => {
  assert.equal(
    redirect('/blog/2024/03/crm-sistema-dlya-srednego-biznesa?utm_source=yandex'),
    '/blog/posts/crm-sistema-dlya-srednego-biznesa/',
  )
  // QSD в правилах отбрасывает старую query — цель без хвоста.
  assert.match(htaccess, /\[R=301,L,QSD\]/)
})
