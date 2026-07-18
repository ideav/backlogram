import assert from 'node:assert/strict'
import { test } from 'node:test'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const repo = new URL('..', import.meta.url).pathname
const read = (p) => readFileSync(resolve(repo, p), 'utf8')

const pageSource = read('src/pages/InformationSystem.tsx')

// #477: у пиллар-страницы «Информационная система» ссылку «← На главную» заменили
// на общие хлебные крошки (Интеграм / Информационная система). Крошки покрывают и
// роль «наверх» (первое звено Интеграм → /), и снимают регрессию #408/#385, где
// back-link слипался с бейджем «Основы…» — теперь это отдельный блочный <nav>.
test('the page uses the shared Breadcrumbs trail instead of an ad-hoc back-link', () => {
  assert.match(pageSource, /import Breadcrumbs from '\.\.\/components\/Breadcrumbs'/)
  assert.match(
    pageSource,
    /<Breadcrumbs[\s\S]*?name: 'Информационная система', to: '\/informatsionnaya-sistema\.html'/,
    'InformationSystem must render a breadcrumb ending on the current page',
  )
  assert.doesNotMatch(
    pageSource,
    /<ArrowLeft size=\{16\} \/> На главную/,
    'the ad-hoc «На главную» back-link must be gone (replaced by the breadcrumb)',
  )
})

test('the "Основы: информационные системы" badge sits in its own element', () => {
  assert.match(
    pageSource,
    /<div className="[^"]*"[^>]*>\s*<BookOpen[^>]*\/>\s*Основы: информационные системы/,
    'the category badge must render in its own block element',
  )
})
