// backlogram#910: в #root собранных страниц — настоящая React-страница,
// отрисованная на сборке, а в браузере она гидрируется. Первый кадр — итоговая
// страница: ни пререндер-снимка, ни белого экрана (класс boot из #908 убран).
import assert from 'node:assert/strict'
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { createRequire } from 'node:module'
import { join } from 'node:path'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'
import { patchHydrationNormalizer } from '../scripts/lib/hydrate-nbsp.mjs'
import { injectStaticNav } from '../scripts/lib/static-nav.mjs'
import {
  compareWithSnapshot,
  pathnameFor,
  replaceRoot,
  rootContentRange,
} from '../scripts/render-ssr.mjs'

const repo = fileURLToPath(new URL('..', import.meta.url))
const read = (p) => readFileSync(join(repo, p), 'utf8')

test('index.html больше не прячет #root, а помечает страницу классом js', () => {
  const html = read('index.html')
  assert.doesNotMatch(html, /classList\.add\('boot'\)/)
  assert.doesNotMatch(html, /html\.boot #root/)
  assert.match(html, /classList\.add\(cls, 'js'\)/)
})

test('App не ждёт монтирования, чтобы показать страницу', () => {
  const app = read('src/App.tsx')
  assert.doesNotMatch(app, /RevealWhenReady/)
  assert.doesNotMatch(app, /classList\.remove\('boot'\)/)
  // motion-элементы, которые есть на странице при гидрации, рисуются сразу
  // в итоговом состоянии: в HTML со сборки нет невидимых opacity: 0.
  assert.match(app, /initial: false as const/)
})

test('main.tsx гидрирует страницу со сборки, дождавшись её ленивого чанка', () => {
  const main = read('src/main.tsx')
  assert.match(main, /container\.hasAttribute\('data-ssr'\)/)
  assert.match(main, /preloadRoute\(routes, window\.location\.pathname\)\.then\(\(\) => hydrateRoot\(container, app\)\)/)
  assert.match(main, /createRoot\(container\)\.render\(app\)/)
})

test('серверный рендер: маршруты общие, браузерный роутер создаётся только в браузере', () => {
  const router = read('src/router.tsx')
  assert.match(router, /export const routes: RouteObject\[\] = \[/)
  assert.match(router, /export function createRouter\(\) \{\s*return createBrowserRouter\(routes\)/)
  const server = read('src/entry-server.tsx')
  assert.match(server, /createStaticHandler\(routes\)/)
  assert.match(server, /StaticRouterProvider/)
  assert.match(server, /await stream\.allReady/)
})

test('сборка: SSR-бандл до пререндеров, render-ssr — после них и до статической навигации', () => {
  const build = JSON.parse(read('package.json')).scripts.build
  const at = (s) => {
    const i = build.indexOf(s)
    assert.ok(i >= 0, `${s} нет в build`)
    return i
  }
  assert.ok(at('vite build --ssr src/entry-server.tsx') < at('prerender-knowledge-base.mjs'))
  assert.ok(at('prerender-landing.mjs') < at('render-ssr.mjs'))
  assert.ok(at('render-ssr.mjs') < at('inject-static-nav.mjs'))
  assert.ok(at('inject-static-nav.mjs') < at('apply-typography.mjs'))
  assert.ok(at('apply-typography.mjs') < at('preload-page-chunks.mjs'))
})

test('гидрация считает U+00A0 и пробел равными: правка установленного react-dom', () => {
  const require = createRequire(import.meta.url)
  const file = join(require.resolve('react-dom/package.json'), '..', 'cjs', 'react-dom.production.min.js')
  const patched = patchHydrationNormalizer(readFileSync(file, 'utf8'))
  assert.match(patched, /\.replace\(\/\\u00a0\/g," "\)\}function \w+\(a,b,c\)\{b=\w+\(b\);if\(\w+\(a\)!==b&&c\)throw Error/)
  assert.throws(() => patchHydrationNormalizer('function zf(a){return a}'), /найден 0 раз/)
})

test('содержимое #root подменяется целиком, вложенные div и скрипты не сбивают счёт', () => {
  const html = '<body><div id="root"><div>a<div>b</div></div><script>"</div>"</script></div>\n<p>после</p></body>'
  const [start, end] = rootContentRange(html)
  assert.equal(html.slice(start, end), '<div>a<div>b</div></div><script>"</div>"</script>')
  assert.equal(
    replaceRoot(html, '<main>новое</main>'),
    '<body><div id="root" data-ssr=""><main>новое</main></div>\n<p>после</p></body>',
  )
  assert.equal(pathnameFor('index.html'), '/')
  assert.equal(pathnameFor('api.html'), '/api.html')
  assert.equal(pathnameFor('knowledge-base/04-related-tables/index.html'), '/knowledge-base/04-related-tables/')
})

test('сверка со снимком ловит пропавший текст и H1', () => {
  const snapshot = '<h1>Учёт заявок</h1><p>Статусы, приоритеты, канбан и сроки обработки</p>'
  assert.deepEqual(compareWithSnapshot(snapshot, '<h1>Учёт&nbsp;заявок</h1><p>Сроки обработки, статусы, приоритеты, канбан</p>').missingHeadings, [])
  const poor = compareWithSnapshot(snapshot, '<h1>Другое</h1>')
  assert.ok(poor.coverage < 0.5)
  assert.deepEqual(poor.missingHeadings, ['h1: Учёт заявок'])
})

test('статическая навигация стоит перед #root и скрыта при JS', () => {
  const html = injectStaticNav('<body>\n    <div id="root" data-ssr=""><main></main></div></body>', '/api.html')
  assert.ok(html.indexOf('id="static-nav"') < html.indexOf('<div id="root"'))
  assert.match(html, /html\.js #static-nav \{ display: none; \}/)
  assert.match(html, /<div id="root" data-ssr=""><main><\/main><\/div>/)
})

test('собранные страницы: настоящая страница в #root, навигация и микроразметка (если dist собран)', (t) => {
  const dist = join(repo, 'dist')
  if (!existsSync(join(dist, 'index.html'))) return t.skip('dist не собран')
  const walk = (d) =>
    readdirSync(d).flatMap((n) => {
      const f = join(d, n)
      if (n === 'assets') return []
      return statSync(f).isDirectory() ? walk(f) : n.endsWith('.html') ? [f] : []
    })
  let ssr = 0
  for (const file of walk(dist)) {
    const html = readFileSync(file, 'utf8')
    if (!html.includes('<div id="root" data-ssr="">')) continue
    ssr += 1
    assert.doesNotMatch(html, /classList\.add\('boot'\)/, `${file}: boot-скрипт`)
    const [start, end] = rootContentRange(html)
    const body = html.slice(start, end)
    assert.match(body, /<header/, `${file}: нет шапки`)
    assert.match(body, /<h1[\s>]/, `${file}: нет H1`)
    assert.doesNotMatch(body, /id="static-nav"/, `${file}: навигация внутри #root`)
    assert.doesNotMatch(body, /style="opacity:0/, `${file}: невидимый элемент в первом кадре`)
  }
  assert.ok(ssr >= 120, `страниц с SSR: ${ssr}`)
  const article = read('dist/knowledge-base/04-related-tables.html')
  assert.match(article, /itemType="https:\/\/schema\.org\/TechArticle"/)
  assert.match(article, /<h1 itemProp="headline"/)
  assert.match(read('dist/baza-zayavok.html'), /itemProp="image"/)
  assert.match(read('dist/index.html'), /itemType="https:\/\/schema\.org\/SoftwareApplication"/)
  assert.match(read('dist/api.html'), /id="static-nav"/)
})
