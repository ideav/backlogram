/**
 * issue #522 — блог переехал с поддомена в подпапку основного домена.
 *
 * Сборку блога, сделанную под корень blog.ideav.ru, скопировали в /blog/ —
 * и все пути (`/posts/…`, `/_astro/…`, `/uploads/…`) стали указывать в корень
 * ideav.ru. Теперь блог собирается с `base: '/blog'`, а поддомен отдаёт 301.
 *
 * Тест сторожит две вещи, которые ломаются молча:
 *  1) в исходниках не осталось адресов на поддомен — иначе ссылки сайта идут
 *     через редирект и вес течёт по дороге;
 *  2) карта переезда 1:1 сохраняет путь: старый адрес ведёт на СВОЙ новый, а
 *     не на главную блога. Массовый редирект «всё на главную» — типовой способ
 *     потерять накопленный вес.
 */
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const repo = new URL('..', import.meta.url).pathname
const read = (path) => readFileSync(resolve(repo, path), 'utf8')

const BLOG_URL = 'https://ideav.ru/blog'

test('в коде и контенте не осталось ссылок на поддомен блога', () => {
  // Исключение — сами файлы переезда: там поддомен упоминается по делу.
  const allowed = new Set([
    'blog-subdomain-redirect/.htaccess',
    'blog-v2/public/.htaccess',
    'blog-v2/README.md',
    'blog-subdomain-redirect/README.md',
    'public/robots.txt',
    'tests/issue-522-blog-subpath.test.mjs',
    'tests/site-blog-link.test.mjs',
    'docs/verify-blog-move.md',
  ])

  const hits = execFileSync(
    'git',
    ['grep', '-l', 'blog\\.ideav\\.ru', '--', '.', ':!blog-v2/dist', ':!dist'],
    { cwd: repo, encoding: 'utf8' },
  )
    .split('\n')
    .filter(Boolean)
    .filter((file) => !allowed.has(file))

  assert.deepEqual(hits, [], `ссылки на поддомен остались в: ${hits.join(', ')}`)
})

test('данные блога на главной ведут в подпапку', () => {
  assert.match(read('scripts/lib/blog-posts.mjs'), new RegExp(`BLOG_URL = '${BLOG_URL}'`))
  const data = read('src/data/blogPosts.mjs')
  assert.match(data, new RegExp(`export const BLOG_URL = '${BLOG_URL}'`))
  for (const url of data.match(/url: '([^']+)'/g) ?? []) {
    assert.ok(url.includes(`${BLOG_URL}/posts/`), `ссылка мимо подпапки: ${url}`)
  }
  for (const image of data.match(/image: '([^']+)'/g) ?? []) {
    assert.ok(image.includes(`${BLOG_URL}/`), `обложка мимо подпапки: ${image}`)
  }
})

test('поддомен отдаёт 301 на тот же путь, а не на главную', () => {
  const htaccess = read('blog-subdomain-redirect/.htaccess')
  // $1 в цели — это и есть сохранение пути 1:1: /posts/x/ → /blog/posts/x/.
  assert.match(
    htaccess,
    /RewriteRule \^\(\.\*\)\$ https:\/\/ideav\.ru\/blog\/\$1 \[R=301,L\]/,
    'редирект обязан переносить путь целиком, иначе вес осядет на главной',
  )
  assert.doesNotMatch(htaccess, /R=302/, 'только 301: 302 вес не передаёт')
})

test('карта со старого блога ведёт сразу в подпапку, без лишнего хопа', () => {
  const htaccess = read('old-blog-redirect/.htaccess')
  assert.doesNotMatch(
    htaccess,
    /https:\/\/blog\.ideav\.ru/,
    'иначе blog.ideav.online → blog.ideav.ru → ideav.ru/blog: лишний хоп',
  )
  assert.match(htaccess, /https:\/\/ideav\.ru\/blog\/posts\/\$1\//)
})

test('карты сайта и robots указывают на блог в подпапке', () => {
  assert.match(read('public/sitemap-index.xml'), /https:\/\/ideav\.ru\/blog\/sitemap-0\.xml/)
  const robots = read('public/robots.txt')
  assert.match(robots, /Sitemap: https:\/\/ideav\.ru\/blog\/sitemap-index\.xml/)
  assert.doesNotMatch(robots, /Sitemap: https:\/\/blog\.ideav\.ru/)
})

test('Astro собирает блог под подпапку', () => {
  const config = read('blog-v2/astro.config.mjs')
  assert.match(config, /site: 'https:\/\/ideav\.ru'/)
  assert.match(config, /base: BASE/)
  assert.match(config, /const BASE = '\/blog'/)
  // Рукописные пути приклеивают базу через помощник и remark-плагин.
  assert.match(config, /remarkBaseUrls/)
  assert.match(read('blog-v2/src/layouts/BaseLayout.astro'), /withBase/)
})
