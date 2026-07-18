import assert from 'node:assert/strict'
import { test } from 'node:test'
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, cpSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { resolve } from 'node:path'
import { execFileSync } from 'node:child_process'

// #477 (SEO-структура): у продуктовых и use-case лендингов появились хлебные
// крошки. Видимая цепочка — общий React-компонент Breadcrumbs; структурированные
// данные (BreadcrumbList JSON-LD) живут в пререндер-снапшотах, чтобы их видели и
// краулеры без JS (Яндекс).
const repo = new URL('..', import.meta.url).pathname
const read = (p) => readFileSync(resolve(repo, p), 'utf8')

test('Breadcrumbs component renders an accessible nav with a current page', () => {
  const src = read('src/components/Breadcrumbs.tsx')
  assert.match(src, /aria-label="Хлебные крошки"/)
  assert.match(src, /aria-current="page"/)
  assert.match(src, /from 'react-router-dom'/)
})

// Каждый продуктовый / use-case лендинг использует общий компонент крошек,
// а первое звено ведёт на главную (Интеграм → /).
const LANDINGS = [
  'src/pages/ExcelToApp.tsx',
  'src/pages/AgentPlatforms.tsx',
  'src/pages/CatalogMatching.tsx',
  'src/pages/ExcelConstructor.tsx',
  'src/pages/InformationSystem.tsx',
  'src/pages/BitrixAmoComparison.tsx',
  'src/pages/Tokens.tsx',
  'src/pages/UseCaseHub.tsx',
  'src/pages/UseCaseLanding.tsx',
]
for (const page of LANDINGS) {
  test(`${page} renders visible breadcrumbs`, () => {
    const src = read(page)
    assert.match(src, /import Breadcrumbs from '\.\.\/components\/Breadcrumbs'/)
    assert.match(src, /<Breadcrumbs\b/)
    assert.match(src, /name: 'Интеграм', to: '\/'/)
  })
}

// Пререндер-скрипты продуктовых страниц несут BreadcrumbList в статическом JSON-LD.
const PRERENDERS = [
  'scripts/prerender-excel-to-app.mjs',
  'scripts/prerender-agent-platforms.mjs',
  'scripts/prerender-catalog-matching.mjs',
  'scripts/prerender-information-system.mjs',
  'scripts/prerender-sravnenie.mjs',
  'scripts/prerender-konstruktor-prilozhenij.mjs',
  'scripts/prerender-usecases.mjs',
  'scripts/prerender-tokens.mjs',
]
for (const script of PRERENDERS) {
  test(`${script} injects BreadcrumbList structured data`, () => {
    assert.match(read(script), /'@type': 'BreadcrumbList'/)
  })
}

// Интеграционная проверка: BreadcrumbList реально попадает в готовый HTML.
test('prerender emits BreadcrumbList JSON-LD into dist/excel-to-app.html', () => {
  const indexHtml = read('index.html')
  const work = mkdtempSync(resolve(tmpdir(), 'bc-prerender-'))
  mkdirSync(resolve(work, 'dist'), { recursive: true })
  mkdirSync(resolve(work, 'scripts'), { recursive: true })
  cpSync(
    resolve(repo, 'scripts/prerender-excel-to-app.mjs'),
    resolve(work, 'scripts/prerender-excel-to-app.mjs'),
  )
  cpSync(
    resolve(repo, 'scripts/prerender-landing.mjs'),
    resolve(work, 'scripts/prerender-landing.mjs'),
  )
  writeFileSync(resolve(work, 'dist/index.html'), indexHtml)

  execFileSync('node', ['scripts/prerender-excel-to-app.mjs'], { cwd: work })

  const out = readFileSync(resolve(work, 'dist/excel-to-app.html'), 'utf8')
  assert.match(out, /"@type":"BreadcrumbList"/)
  assert.match(out, /"name":"Из Excel — приложение"/)
})
