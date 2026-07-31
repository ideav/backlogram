import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readdirSync, readFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const POSTS_DIR = join(__dirname, '..', 'blog-v2', 'src', 'content', 'posts')
const HTACCESS = join(__dirname, '..', 'old-blog-redirect', '.htaccess')

/**
 * Regression coverage for https://github.com/ideav/backlogram/issues/373
 *
 * The old blog (blog.ideav.online, HTMLy) is decommissioned in favour of
 * ideav.ru/blog (Astro). `old-blog-redirect/.htaccess` 301s every old URL to
 * the new domain to transfer SEO weight. This test guards the invariants that
 * keep the map correct as content changes:
 *
 *  - every migrated post's old /YYYY/MM/<slug> resolves to an existing
 *    /posts/<slug>/ on the new blog (no 301 -> 404);
 *  - every category/tag the new blog actually serves is covered by the rules,
 *    so taxonomy links keep their weight instead of falling through to home.
 *
 * The redirect simulator mirrors the rule order in the .htaccess. The "serve
 * real file" rule (RewriteCond %{REQUEST_FILENAME} -f) is approximated by an
 * asset-path/extension heuristic — Apache decides it for real, we only assert
 * that asset-looking requests are never turned into redirects.
 */

// Cyrillic -> Latin slug, identical to blog-v2/src/lib/tags.ts (tagSlug).
const CYR_MAP = {
  а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'e',
  ж: 'zh', з: 'z', и: 'i', й: 'i', к: 'k', л: 'l', м: 'm',
  н: 'n', о: 'o', п: 'p', р: 'r', с: 's', т: 't', у: 'u',
  ф: 'f', х: 'h', ц: 'c', ч: 'ch', ш: 'sh', щ: 'sh',
  ъ: '', ы: 'y', ь: '', э: 'e', ю: 'yu', я: 'ya',
}
function tagSlug(tag) {
  let out = ''
  for (const ch of tag.toLowerCase()) {
    if (CYR_MAP[ch] !== undefined) out += CYR_MAP[ch]
    else if (/[a-z0-9-]/.test(ch)) out += ch
    else out += '-'
  }
  return out.replace(/-+/g, '-').replace(/^-|-$/g, '')
}

function extractFrontmatter(source) {
  const m = source.match(/^---\r?\n([\s\S]*?)\r?\n---/)
  return m ? m[1] : ''
}
function readScalar(fm, key) {
  for (const line of fm.split(/\r?\n/)) {
    const m = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/)
    if (m && m[1] === key) return m[2].replace(/^['"]|['"]$/g, '').trim()
  }
  return null
}
function readList(fm, key) {
  const lines = fm.split(/\r?\n/)
  const i = lines.findIndex((l) => l.match(new RegExp(`^${key}:\\s*$`)))
  if (i === -1) return []
  const out = []
  for (let j = i + 1; j < lines.length; j++) {
    const m = lines[j].match(/^\s*-\s*(.*)$/)
    if (!m) break
    out.push(m[1].replace(/^['"]|['"]$/g, '').trim())
  }
  return out
}

const postFiles = readdirSync(POSTS_DIR).filter((f) => f.endsWith('.md'))
const postSlugs = new Set(postFiles.map((f) => f.replace(/\.md$/, '')))
const posts = postFiles.map((f) => ({
  slug: f.replace(/\.md$/, ''),
  fm: extractFrontmatter(readFileSync(join(POSTS_DIR, f), 'utf8')),
}))

const htaccess = readFileSync(HTACCESS, 'utf8')
const catRule = htaccess.match(/\^category\/\(([^)]+)\)/)
const tagRule = htaccess.match(/\^tag\/\(([^)]+)\)/)
const htCats = new Set(catRule ? catRule[1].split('|') : [])
const htTags = new Set(tagRule ? tagRule[1].split('|') : [])

// Minimal, order-faithful simulator of the .htaccess.
function isAsset(path) {
  return (
    /^\/(wp-content|themes|content|system|assets|cache)\//.test(path) ||
    /\.(jpe?g|png|gif|webp|svg|ico|css|js|woff2?|ttf|pdf|map)$/.test(path)
  )
}
function redirect(path) {
  const p = path.replace(/^\/+/, '').split('?')[0]
  if (isAsset('/' + p)) return null // served as-is
  if (/^(robots\.txt|sitemap\.xml)$/.test(p)) return null
  if (/^(admin|login|logout|add|edit|api)(\/|$)/.test(p)) return null
  let m
  if ((m = p.match(/^[0-9]{4}\/[0-9]{2}\/([^/]+)\/?$/)))
    return `https://ideav.ru/blog/posts/${m[1]}/`
  if ((m = p.match(/^post\/([^/]+)\/?$/)))
    return `https://ideav.ru/blog/posts/${m[1]}/`
  if (/^tag\/yandeks\.direkt\/?$/.test(p))
    return 'https://ideav.ru/blog/tag/yandeks-direkt/'
  if ((m = p.match(/^category\/([^/]+)\/?$/)) && htCats.has(m[1]))
    return `https://ideav.ru/blog/category/${m[1]}/`
  if ((m = p.match(/^tag\/([^/]+)\/?$/)) && htTags.has(m[1]))
    return `https://ideav.ru/blog/tag/${m[1]}/`
  if (/^feed(\/(rss|opml))?\/?$/.test(p)) return 'https://ideav.ru/blog/rss.xml'
  return 'https://ideav.ru/blog/' // catch-all
}

test('.htaccess exists with the core post + catch-all rules', () => {
  assert.ok(existsSync(HTACCESS), 'old-blog-redirect/.htaccess must exist')
  assert.match(htaccess, /\^\[0-9\]\{4\}\/\[0-9\]\{2\}\/\(\[\^\/\]\+\)\/\?\$ https:\/\/ideav\.ru\/blog\/posts\/\$1\//)
  assert.match(htaccess, /RewriteRule \^ https:\/\/ideav\.ru\/blog\/ \[R=301/)
})

test('every migrated post old URL 301s to an existing /posts/<slug>/ (no 301 -> 404)', () => {
  const offenders = []
  let migrated = 0
  for (const { slug, fm } of posts) {
    const orig = readScalar(fm, 'originalUrl')
    if (!orig || !/blog\.ideav\.online/i.test(orig)) continue
    migrated++
    const path = orig.replace(/^https?:\/\/[^/]+/, '')
    // slug must be preserved 1:1 (this is what makes the generic rule safe)
    if (!new RegExp(`^/\\d{4}/\\d{2}/${slug}/?$`).test(path)) {
      offenders.push(`${slug}: originalUrl path ${path} != /YYYY/MM/${slug}`)
      continue
    }
    const target = redirect(path)
    const targetSlug = target?.replace('https://ideav.ru/blog/posts/', '').replace(/\/$/, '')
    if (!target || !postSlugs.has(targetSlug)) {
      offenders.push(`${slug}: ${path} -> ${target} (target post missing)`)
    }
  }
  assert.ok(migrated >= 40, `expected the migrated post set, saw ${migrated}`)
  assert.equal(offenders.length, 0, offenders.join('\n'))
})

test('every category the new blog serves is covered by a redirect rule', () => {
  const blogCats = new Set(
    posts.map((p) => readScalar(p.fm, 'category')).filter(Boolean).map(tagSlug),
  )
  const missing = [...blogCats].filter((c) => !htCats.has(c))
  assert.equal(missing.length, 0, `categories not in .htaccess: ${missing.join(', ')}`)
})

test('every tag the new blog serves is covered by a redirect rule', () => {
  const blogTags = new Set()
  for (const p of posts) for (const t of readList(p.fm, 'tags')) blogTags.add(tagSlug(t))
  const missing = [...blogTags].filter((t) => !htTags.has(t))
  assert.equal(missing.length, 0, `tags not in .htaccess: ${missing.join(', ')}`)
})

test('the renamed-slug tag points at a tag the new blog actually serves', () => {
  assert.match(htaccess, /\^tag\/yandeks\\\.direkt\/\?\$ https:\/\/ideav\.ru\/blog\/tag\/yandeks-direkt\//)
  assert.ok(htTags.has('yandeks-direkt'), 'yandeks-direkt must be a real new-blog tag')
})

test('representative URLs route as intended', () => {
  const cases = [
    ['/2025/09/predposylki-no-code-konstruktora-integram', 'https://ideav.ru/blog/posts/predposylki-no-code-konstruktora-integram/'],
    ['/post/predposylki-no-code-konstruktora-integram', 'https://ideav.ru/blog/posts/predposylki-no-code-konstruktora-integram/'],
    ['/category/o-platforme', 'https://ideav.ru/blog/category/o-platforme/'],
    ['/tag/yandeks.direkt', 'https://ideav.ru/blog/tag/yandeks-direkt/'],
    ['/tag/integram', 'https://ideav.ru/blog/tag/integram/'],
    ['/feed/rss', 'https://ideav.ru/blog/rss.xml'],
    ['/', 'https://ideav.ru/blog/'],
    ['/category/uncategorized', 'https://ideav.ru/blog/'],
    ['/archive/2024', 'https://ideav.ru/blog/'],
    ['/category/proekty?page=2', 'https://ideav.ru/blog/category/proekty/'],
  ]
  for (const [url, expected] of cases) {
    assert.equal(redirect(url), expected, `${url} should -> ${expected}`)
  }
})

test('hotlinked assets and admin are never redirected', () => {
  for (const url of [
    '/wp-content/uploads/2024/03/pic.jpg',
    '/themes/quintet/css/style.css',
    '/admin',
    '/login',
    '/robots.txt',
  ]) {
    assert.equal(redirect(url), null, `${url} must be served, not redirected`)
  }
})
