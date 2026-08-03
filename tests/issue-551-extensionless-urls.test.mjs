import assert from 'node:assert/strict'
import { test } from 'node:test'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { resolve } from 'node:path'

import { HUB, USE_CASES } from '../src/data/usecases.mjs'

// Issue #551: ссылка «обработку персональных данных» под формой на
// /excel-to-app.html вела на /privacy и не работала — «Починить здесь и во всех
// других местах».
//
// Причина — не в React. Вебрут ideav.ru общий с движком Интеграма: front
// controller в public/.htaccess шлёт всё, что не файл и не директория, в
// index.php, а движок читает первый сегмент пути как имя базы. Билд кладёт в
// dist/ только `<slug>.html`, поэтому ЛЮБОЙ безрасширенный адрес страницы
// (/privacy, /terms, /resheniya, /excel-to-app, лендинги) отдавался движком с
// «Invalid database». Маршруты в src/router.tsx объявлены в двух написаниях, но
// безрасширенный вариант живёт лишь при клиентской навигации внутри SPA.
//
// #542 закрыл этим приёмом одну страницу — /privacy. Тест держит инвариант для
// ВСЕХ: у каждой верхнеуровневой страницы сайта есть 301 с безрасширенного
// адреса на канонический `.html`, и стоит он ВЫШЕ front controller.

const repo = new URL('..', import.meta.url).pathname
const htaccess = readFileSync(resolve(repo, 'public/.htaccess'), 'utf8')
const router = readFileSync(resolve(repo, 'src/router.tsx'), 'utf8')

/**
 * Страницы, которые в вебруте существуют ДИРЕКТОРИЕЙ (пререндер кладёт базу
 * знаний как `knowledge-base/index.html`, `ad-images` — статическая папка из
 * public/). Безрасширенный адрес у них и так работает: Apache сам редиректит на
 * `<slug>/`. Правило для них не нужно и вредно — оно увело бы запрос с
 * работающей директории на несуществующий файл.
 */
const SERVED_AS_DIRECTORY = new Set(['knowledge-base', 'ad-images'])

/**
 * Маршруты SPA без статического снапшота: билд не кладёт в dist/ ни
 * `success.html`, ни `fail.html`, и ни одна ссылка в проекте на них не ведёт —
 * это осиротевшие маршруты. Редирект `/success → /success.html` вёл бы с одного
 * несуществующего адреса на другой, поэтому их тут нет. Появится снапшот и
 * ссылки — убрать отсюда и добавить в правило.
 */
const NO_STATIC_SNAPSHOT = new Set(['success', 'fail'])

/** Верхнеуровневые `<slug>.html` маршруты SPA — источник истины по страницам. */
function routerPageSlugs() {
  const slugs = new Set()
  for (const [, path] of router.matchAll(/path: '([^']+)'/g)) {
    if (!path.endsWith('.html')) continue
    const slug = path.slice(0, -'.html'.length)
    if (slug.includes('/') || slug.includes(':')) continue // вложенные маршруты
    slugs.add(slug)
  }
  return slugs
}

/** Полный список страниц: явные маршруты + 11 лендингов из usecases.mjs. */
function expectedSlugs() {
  const slugs = routerPageSlugs()
  for (const useCase of USE_CASES) slugs.add(useCase.slug)
  for (const slug of [...SERVED_AS_DIRECTORY, ...NO_STATIC_SNAPSHOT]) slugs.delete(slug)
  return [...slugs].sort()
}

/** Рекурсивный обход исходников — ищем ссылки во всём коде, а не в списке файлов. */
function listSourceFiles(dir) {
  const out = []
  for (const entry of readdirSync(dir)) {
    const full = resolve(dir, entry)
    if (statSync(full).isDirectory()) out.push(...listSourceFiles(full))
    else if (/\.(tsx?|mjs)$/.test(entry)) out.push(full)
  }
  return out
}

/**
 * Слаги, для которых билд реально пишет `dist/<slug>.html`. Читаем это из самих
 * пререндеров, а не из собранного dist/: каталог сборки принадлежит билду и
 * тесты его не трогают (#520).
 */
function prerenderedSlugs() {
  const slugs = new Set()
  const dir = resolve(repo, 'scripts')

  for (const file of readdirSync(dir)) {
    if (!file.startsWith('prerender-') || !file.endsWith('.mjs')) continue
    const src = readFileSync(resolve(dir, file), 'utf8')
    // `resolve(dist, 'privacy.html')` и `dist/privacy.html` в логах пререндера.
    for (const [, slug] of src.matchAll(/dist[/,]\s*'?([a-z0-9-]+)\.html/g)) slugs.add(slug)
  }

  // prerender-usecases пишет 11 лендингов и хаб по шаблону `${slug}.html` —
  // литералов в коде нет, слаги приходят из данных.
  for (const useCase of USE_CASES) slugs.add(useCase.slug)
  slugs.add(HUB.slug)

  return slugs
}

/** Позиция строки front controller — всё, что чинит роутинг, обязано быть выше. */
const frontController = htaccess.search(/^\s*RewriteRule\s+\^\s+index\.php/m)

/** Правило-альтернация: `RewriteRule ^(a|b|c)/?$ /$1.html [R=301,L]`. */
const REDIRECT_RULE = /^\s*RewriteRule\s+\^\(([^)]*)\)\/\?\$\s+\/\$1\.html\s+\[([^\]]+)\]/m

test('front controller на месте — без него ложатся все базы (#422/#423)', () => {
  assert.notEqual(frontController, -1, 'RewriteRule ^ index.php обязан остаться в .htaccess')
})

test('у каждой страницы есть 301 с безрасширенного адреса на канонический .html (#551)', () => {
  const slugs = expectedSlugs()
  assert.ok(slugs.length >= 20, `ожидали список страниц, получили ${slugs.length}`)

  const rule = htaccess.match(REDIRECT_RULE)
  const listed = new Set(rule ? rule[1].split('|') : [])

  for (const slug of slugs) {
    // Правило может быть как одной альтернацией на все слаги, так и расписанным
    // по одному — принимаем оба написания.
    const standalone = new RegExp(`^\\s*RewriteRule\\s+\\^${slug}/\\?\\$\\s+/${slug}\\.html`, 'm')

    assert.ok(
      listed.has(slug) || standalone.test(htaccess),
      `в public/.htaccess нет редиректа /${slug} → /${slug}.html — безрасширенный адрес ` +
        `уйдёт во front controller и движок ответит «Invalid database» (#551)`,
    )
  }
})

test('редирект стоит ВЫШЕ front controller, иначе путь снова уедет в index.php', () => {
  const redirect = htaccess.search(REDIRECT_RULE)
  assert.notEqual(redirect, -1, 'правило extensionless-редиректа не найдено')
  assert.ok(redirect < frontController, 'правило обязано стоять до RewriteRule ^ index.php')
})

test('редиректы отдают 301 и обрывают цепочку правил', () => {
  const rule = htaccess.match(REDIRECT_RULE)
  assert.ok(rule, 'правило extensionless-редиректа не найдено')
  assert.match(rule[2], /R=301/, 'канонизация адреса — постоянный редирект, иначе он не склеит сигналы для поиска')
  assert.match(rule[2], /\bL\b/, 'без [L] запрос продолжит обработку и уедет во front controller')
})

test('универсального правила «нет файла → отдать <path>.html» нет — оно уронило бы базу-тёзку', () => {
  // Такое правило перехватывает URL реальной базы, если её имя совпадёт с именем
  // любого .html в вебруте. Список обязан оставаться закрытым и явным.
  const rule = htaccess.match(REDIRECT_RULE)
  assert.ok(rule, 'правило extensionless-редиректа не найдено')
  assert.doesNotMatch(
    rule[1],
    /[.*+\][]/,
    `паттерн редиректа стал обобщённым («${rule[1]}») — он перехватит URL реальной базы с совпадающим именем (#551)`,
  )
})

test('каждая цель редиректа — страница, которую билд действительно создаёт', () => {
  // Редирект на несуществующий `<slug>.html` бесполезен: файла нет → front
  // controller → тот же «Invalid database», только хопом дальше. Так в список
  // едва не уехали success/fail — маршруты SPA, для которых снапшот не пишется.
  //
  // Источник истины — сами пререндеры (dist/ репозитория тесты не трогают, #520).
  const rule = htaccess.match(REDIRECT_RULE)
  assert.ok(rule, 'правило extensionless-редиректа не найдено')

  for (const slug of rule[1].split('|')) {
    assert.ok(
      prerenderedSlugs().has(slug),
      `редирект ведёт на /${slug}.html, но ни один scripts/prerender-*.mjs такой страницы ` +
        `не пишет — запрос уйдёт во front controller и движок ответит «Invalid database» (#551)`,
    )
  }
})

test('директории из вебрута не перехвачены редиректом (/knowledge-base/, /ad-images/)', () => {
  const rule = htaccess.match(REDIRECT_RULE)
  const listed = new Set(rule ? rule[1].split('|') : [])

  for (const dir of SERVED_AS_DIRECTORY) {
    assert.ok(
      !listed.has(dir),
      `/${dir} существует директорией и работает сам — редирект на /${dir}.html увёл бы его в никуда`,
    )
  }
})

test('ссылки в коде ведут на канонический .html, а не на безрасширенный адрес', () => {
  // Первопричина #551: в коде осталась ссылка href="/privacy". Ловим весь класс,
  // а не одну страницу.
  const slugs = expectedSlugs()
  const files = ['src', 'scripts'].flatMap(dir => listSourceFiles(resolve(repo, dir)))

  for (const file of files) {
    const src = readFileSync(file, 'utf8')
    for (const slug of slugs) {
      assert.doesNotMatch(
        src,
        new RegExp(`(href|to)="/${slug}"`),
        `${file.slice(repo.length)}: ссылка на /${slug} без .html — канонический адрес /${slug}.html (#551)`,
      )
    }
  }
})
