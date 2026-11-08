// ideav/crm#5460: чанк страницы предзагружается из её HTML, JS сжимается.
import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'
import { chunkFiles, injectPreloads, manifestKey, readRoutes } from '../scripts/preload-page-chunks.mjs'

const routerSource = readFileSync(new URL('../src/router.tsx', import.meta.url), 'utf8')
const srcDir = fileURLToPath(new URL('../src/', import.meta.url))

test('маршруты router.tsx: статические и из списков данных', async () => {
  const { lazyModule, routes } = await readRoutes(routerSource, srcDir)
  assert.equal(routes.get('put-adepta.html'), 'AdeptPath')
  assert.equal(lazyModule.get('AdeptPath'), 'src/pages/AdeptPath.tsx')
  assert.equal(routes.get('zamena-excel.html'), 'SiteSection')
  assert.ok([...routes.values()].includes('UseCaseLanding'))
  assert.ok([...routes.values()].includes('AiLanding'))
})

test('ключ манифеста и цепочка импортов', () => {
  const manifest = {
    'index.html': { file: 'assets/index-a.js' },
    'src/pages/A.tsx': { file: 'assets/A-1.js', imports: ['_b.js', 'index.html'] },
    '_b.js': { file: 'assets/b-2.js', imports: ['_b.js'] },
    '_ApiDocs-x.js': { file: 'assets/ApiDocs-x.js', name: 'ApiDocs', isDynamicEntry: true },
  }
  assert.equal(manifestKey(manifest, 'src/pages/A.tsx'), 'src/pages/A.tsx')
  assert.equal(manifestKey(manifest, 'src/pages/ApiDocs.tsx'), '_ApiDocs-x.js')
  assert.deepEqual(chunkFiles(manifest, 'src/pages/A.tsx'), ['assets/A-1.js', 'assets/b-2.js', 'assets/index-a.js'])
})

test('modulepreload не дублирует то, что уже в head', () => {
  const html = '<head><script type="module" src="/assets/index-a.js"></script>\n</head><body></body>'
  const out = injectPreloads(html, ['assets/A-1.js', 'assets/index-a.js'])
  assert.match(out, /<link rel="modulepreload" crossorigin href="\/assets\/A-1\.js">/)
  assert.equal(out.match(/index-a\.js/g).length, 1)
  assert.equal(injectPreloads(out, ['assets/A-1.js']), out)
})

test('.htaccess сжимает text/javascript', () => {
  const htaccess = readFileSync(new URL('../public/.htaccess', import.meta.url), 'utf8')
  assert.match(htaccess, /DEFLATE[^<]*text\/javascript/)
})

test('собранная put-adepta.html предзагружает свой чанк (если dist собран)', (t) => {
  const page = new URL('../dist/put-adepta.html', import.meta.url)
  if (!existsSync(page)) return t.skip('dist не собран')
  assert.match(readFileSync(page, 'utf8'), /rel="modulepreload" crossorigin href="\/assets\/AdeptPath-[\w-]+\.js"/)
  assert.ok(!existsSync(new URL('../dist/.vite', import.meta.url)), 'манифест не должен ехать на сервер')
})
