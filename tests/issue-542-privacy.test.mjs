import assert from 'node:assert/strict'
import { test } from 'node:test'
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, cpSync, existsSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { resolve } from 'node:path'
import { execFileSync } from 'node:child_process'

// Issue #542: https://ideav.ru/privacy отдавал ошибку движка Интеграма —
// безрасширенного файла в вебруте нет, front controller в .htaccess уводил путь
// в index.php, а тот читал «privacy» как имя базы. При этом самой страницы с
// политикой в проекте не существовало, хотя на неё ведёт галочка согласия под
// каждой формой-заявкой.
//
// Тест держит все звенья цепочки: документ есть, ссылки ведут на канонический
// /privacy.html, безрасширенный /privacy редиректится ВЫШЕ front controller,
// а статический снапшот содержит текст политики (для краулеров и клиентов
// без JS).

const repo = new URL('..', import.meta.url).pathname
const indexHtml = readFileSync(resolve(repo, 'index.html'), 'utf8')
const htaccess = readFileSync(resolve(repo, 'public/.htaccess'), 'utf8')
const router = readFileSync(resolve(repo, 'src/router.tsx'), 'utf8')
const footer = readFileSync(resolve(repo, 'src/components/Footer.tsx'), 'utf8')
const homeTitle = indexHtml.match(/<title>([\s\S]*?)<\/title>/)[1]

/** Страницы с формой-заявкой: в каждой галочка согласия ссылается на политику. */
const PAGES_WITH_CONSENT = [
  'src/pages/Home.tsx',
  'src/pages/ExcelToApp.tsx',
  'src/pages/CatalogMatching.tsx',
  'src/pages/ExcelConstructor.tsx',
  'src/pages/UseCaseLanding.tsx',
]

function makeWorkspace(prefix) {
  const work = mkdtempSync(resolve(tmpdir(), prefix))
  mkdirSync(resolve(work, 'dist'), { recursive: true })
  mkdirSync(resolve(work, 'scripts'), { recursive: true })
  cpSync(resolve(repo, 'scripts/prerender-privacy.mjs'), resolve(work, 'scripts/prerender-privacy.mjs'))
  cpSync(resolve(repo, 'scripts/prerender-landing.mjs'), resolve(work, 'scripts/prerender-landing.mjs'))
  // Оба пререндера читают данные из src/data — без них песочница падает на
  // ERR_MODULE_NOT_FOUND.
  cpSync(resolve(repo, 'src/data'), resolve(work, 'src/data'), { recursive: true })
  writeFileSync(resolve(work, 'dist/index.html'), indexHtml)
  return work
}

test('ссылки согласия ведут на канонический /privacy.html, а не на безрасширенный /privacy', () => {
  for (const file of PAGES_WITH_CONSENT) {
    const src = readFileSync(resolve(repo, file), 'utf8')
    assert.match(src, /href="\/privacy\.html"/, `${file}: ссылка на политику должна вести на /privacy.html`)
    assert.doesNotMatch(
      src,
      /href="\/privacy"/,
      `${file}: безрасширенный /privacy уходит во front controller и читается движком как имя базы (#542)`,
    )
  }
})

test('политика доступна из подвала любой страницы (ч. 2 ст. 18.1 152-ФЗ)', () => {
  assert.match(footer, /to="\/privacy\.html"/)
})

test('SPA знает маршрут политики в обоих написаниях', () => {
  assert.match(router, /path: 'privacy\.html'/)
  assert.match(router, /path: 'privacy'/)
  assert.match(router, /import\('\.\/pages\/Privacy'\)/)
})

test('.htaccess редиректит /privacy на /privacy.html ДО front controller (#542)', () => {
  const redirect = htaccess.search(/^\s*RewriteRule\s+\^privacy\/\?\$\s+\/privacy\.html\s+\[R=301,L\]/m)
  const frontController = htaccess.search(/^\s*RewriteRule\s+\^\s+index\.php/m)

  assert.notEqual(redirect, -1, 'правило редиректа /privacy → /privacy.html отсутствует')
  assert.notEqual(frontController, -1, 'front controller обязан остаться на месте (#422/#423)')
  assert.ok(
    redirect < frontController,
    'редирект должен стоять ВЫШЕ front controller, иначе путь снова уедет в index.php',
  )
})

test('build прогоняет пререндер политики после базы знаний и до пререндера главной', () => {
  const pkg = JSON.parse(readFileSync(resolve(repo, 'package.json'), 'utf8'))
  const build = pkg.scripts.build
  assert.match(build, /prerender-privacy\.mjs/)
  assert.ok(
    build.indexOf('prerender-knowledge-base.mjs') < build.indexOf('prerender-privacy.mjs'),
    'пререндер политики должен идти после пререндера базы знаний',
  )
  assert.ok(
    build.indexOf('prerender-privacy.mjs') < build.indexOf('prerender-landing.mjs'),
    'пререндер политики должен идти до пререндера главной (нужен чистый index.html)',
  )
})

test('prerender-privacy пишет crawlable dist/privacy.html с текстом политики', () => {
  const work = makeWorkspace('privacy-prerender-')

  execFileSync('node', ['scripts/prerender-privacy.mjs'], { cwd: work })

  const outPath = resolve(work, 'dist/privacy.html')
  assert.ok(existsSync(outPath), 'dist/privacy.html должен быть создан')
  const out = readFileSync(outPath, 'utf8')

  // #root несёт статический документ, а не пустую SPA-оболочку.
  assert.doesNotMatch(out, /<div id="root"><\/div>/, '#root не должен остаться пустым')
  assert.match(out, /<div id="root">\s*<article id="pv-prerender"/)
  assert.match(out, /<h1[^>]*>Политика обработки персональных данных<\/h1>/)

  // Собственный <title> и описание в лимитах выдачи.
  const title = out.match(/<title>([\s\S]*?)<\/title>/)[1]
  assert.notEqual(title, homeTitle, '/privacy.html не должен переиспользовать title главной')
  assert.ok(title.length <= 60, `title должен быть <= 60 символов, получено ${title.length}`)
  const desc = out.match(/<meta name="description" content="([\s\S]*?)"/)[1]
  assert.ok(desc.length <= 158, `description должен быть <= 158 символов, получено ${desc.length}`)

  // Self-canonical + разметка.
  assert.match(out, /<link rel="canonical" href="https:\/\/ideav\.ru\/privacy\.html" \/>/)
  assert.match(out, /<meta property="og:title"/)
  assert.match(out, /"@type":"WebPage"/)

  // Обязательные по 152-ФЗ содержательные куски: оператор, права, отзыв
  // согласия, контакт для обращений.
  assert.match(out, /АО «Интеграм»/)
  assert.match(out, /ИНН: 9716002710/)
  assert.match(out, /Отзыв согласия/)
  assert.match(out, /Права Пользователя/)
  assert.match(out, /abc@integram\.io/)
})

test('prerender-privacy не трогает dist/index.html', () => {
  const work = makeWorkspace('privacy-prerender-home-')
  const before = readFileSync(resolve(work, 'dist/index.html'), 'utf8')
  execFileSync('node', ['scripts/prerender-privacy.mjs'], { cwd: work })
  const after = readFileSync(resolve(work, 'dist/index.html'), 'utf8')
  assert.equal(before, after, 'оболочка главной должна остаться нетронутой')
})

test('prerender-privacy падает, если запущен после пререндера главной', () => {
  const work = makeWorkspace('privacy-prerender-order-')
  execFileSync('node', ['scripts/prerender-landing.mjs'], { cwd: work })
  assert.throws(
    () => execFileSync('node', ['scripts/prerender-privacy.mjs'], { cwd: work, stdio: 'pipe' }),
    /Command failed/,
    'запуск после пререндера главной должен падать громко',
  )
})

test('React-страница и снапшот берут текст из общего источника src/data/privacy.mjs', () => {
  const page = readFileSync(resolve(repo, 'src/pages/Privacy.tsx'), 'utf8')
  const script = readFileSync(resolve(repo, 'scripts/prerender-privacy.mjs'), 'utf8')
  assert.match(page, /from '\.\.\/data\/privacy'/)
  assert.match(script, /from '\.\.\/src\/data\/privacy\.mjs'/)
})
