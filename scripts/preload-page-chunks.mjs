#!/usr/bin/env node
/**
 * ideav/crm#5460: предзагрузка чанка страницы в её собственном HTML.
 *
 * Код каждой страницы лежит в отдельном чанке (lazy() в src/router.tsx). Браузер
 * узнаёт о нём только после того, как скачал и выполнил основной бандл, поэтому
 * загрузки шли цепочкой: бандл → чанк страницы. Пока чанк не пришёл, #root скрыт
 * (класс boot в index.html), и посетитель видит белый экран.
 *
 * Скрипт сопоставляет каждый dist/*.html с маршрутом из router.tsx, берёт файл
 * чанка и его импорты из манифеста Vite и ставит в <head> link rel=modulepreload.
 * Так чанк качается параллельно с основным бандлом.
 *
 * Манифест (dist/.vite/manifest.json) после работы удаляется: на сервер он не едет.
 */
import { existsSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { dirname, join, relative, sep } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const dist = join(root, 'dist')
const manifestPath = join(dist, '.vite', 'manifest.json')

/** Разбор router.tsx: компонент → модуль, путь маршрута → компонент. */
export async function readRoutes(routerSource, srcDir) {
  const lazyModule = new Map()
  for (const m of routerSource.matchAll(/const (\w+) = lazy\(\(\) => import\('\.\/([^']+)'\)\)/g)) {
    lazyModule.set(m[1], `src/${m[2]}.tsx`)
  }

  const routes = new Map()
  for (const m of routerSource.matchAll(/path: '([^'*:]+)',\s*element: <(\w+)/g)) {
    if (!routes.has(m[1])) routes.set(m[1], m[2])
  }

  // Динамические маршруты из списков данных: ...LIST.flatMap((x) => [{ path: `${x.slug}.html`, element: <C …
  const imports = new Map()
  for (const m of routerSource.matchAll(/import \{ (\w+) \} from '\.\/([^']+)'/g)) imports.set(m[1], m[2])
  for (const m of routerSource.matchAll(/\.\.\.(\w+)\.flatMap\(\((\w+)\) => \[\s*\{ path: `\$\{\2\.slug\}\.html`, element: <(\w+)/g)) {
    const [, list, , component] = m
    const mod = await import(pathToFileURL(join(srcDir, `${imports.get(list)}.mjs`)).href)
    for (const item of mod[list]) {
      const path = `${item.slug}.html`
      if (!routes.has(path)) routes.set(path, component)
    }
  }

  return { lazyModule, routes }
}

/**
 * Ключ модуля в манифесте. Обычно это путь исходника, но модуль, который
 * ещё и статически импортируют другие страницы (ApiDocs), Vite заводит
 * под ключом «_Имя-хэш.js» — тогда ищем динамический вход по имени.
 */
export function manifestKey(manifest, mod) {
  if (manifest[mod]) return mod
  const name = mod.replace(/^.*\//, '').replace(/\.tsx$/, '')
  return Object.keys(manifest).find((k) => manifest[k].isDynamicEntry && manifest[k].name === name) ?? null
}

/** Чанк модуля и все его статические импорты (без повторов). */
export function chunkFiles(manifest, key) {
  const files = []
  const seen = new Set()
  const walk = (k) => {
    if (seen.has(k) || !manifest[k]) return
    seen.add(k)
    files.push(manifest[k].file)
    for (const dep of manifest[k].imports ?? []) walk(dep)
  }
  walk(key)
  return files
}

/** Вставить modulepreload для файлов, которых ещё нет в <head>. */
export function injectPreloads(html, files) {
  const headEnd = html.indexOf('</head>')
  if (headEnd < 0) return html
  const head = html.slice(0, headEnd)
  const links = files
    .filter((f) => !head.includes(`/${f}"`))
    .map((f) => `    <link rel="modulepreload" crossorigin href="/${f}">\n`)
    .join('')
  if (!links) return html
  return `${html.slice(0, headEnd)}${links}${html.slice(headEnd)}`
}

function htmlFiles(dir) {
  const out = []
  for (const name of readdirSync(dir)) {
    const full = join(dir, name)
    if (name === 'assets' || name === '.vite') continue
    if (statSync(full).isDirectory()) out.push(...htmlFiles(full))
    else if (name.endsWith('.html')) out.push(full)
  }
  return out
}

function routeFor(routes, rel) {
  if (routes.has(rel)) return routes.get(rel)
  if (/^knowledge-base\/[^/]+\.html$/.test(rel)) return 'KnowledgeBaseArticle'
  return null
}

async function main() {
  if (!existsSync(manifestPath)) {
    console.error('preload-page-chunks: нет dist/.vite/manifest.json — включите build.manifest в vite.config')
    process.exit(1)
  }
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'))
  const routerSource = readFileSync(join(root, 'src', 'router.tsx'), 'utf8')
  const { lazyModule, routes } = await readRoutes(routerSource, join(root, 'src'))

  let done = 0
  const skipped = []
  for (const file of htmlFiles(dist)) {
    const rel = relative(dist, file).split(sep).join('/')
    const component = routeFor(routes, rel)
    const mod = component && lazyModule.get(component)
    if (!mod) {
      skipped.push(rel)
      continue
    }
    const key = manifestKey(manifest, mod)
    if (!key) throw new Error(`preload-page-chunks: ${mod} нет в манифесте (${rel})`)
    const html = readFileSync(file, 'utf8')
    const next = injectPreloads(html, chunkFiles(manifest, key))
    if (next !== html) {
      writeFileSync(file, next)
      done++
    }
  }

  rmSync(join(dist, '.vite'), { recursive: true, force: true })
  console.log(`✓ preload-page-chunks: чанк страницы предзагружается в ${done} страницах; без ленивого чанка: ${skipped.length}`)
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  await main()
}
