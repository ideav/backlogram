import { renderToStaticMarkup } from 'react-dom/server'
import { CASES, COMPARE_PAGE } from './content'
import Landing from './Landing'
import { CasePage } from './pages/CasePage'
import { ComparePage } from './pages/ComparePage'
import { caseJsonLd, compareJsonLd, jsonLdScript } from './seo'
import { SITE_BASE } from './site-base'

/**
 * Вход пререндера (issue #626). Собирается esbuild'ом под Node и вызывается
 * из `scripts/prerender-site-excel.mjs`; в браузер этот модуль не попадает.
 *
 * Здесь только разметка: обвязку HTML (head, стили, счётчик) делает скрипт —
 * имена файлов стилей известны только после сборки Vite.
 */

export type StaticPage = {
  /** Каталог внутри dist: `keysy/<slug>` → `/keysy/<slug>/`. */
  dir: string
  path: string
  title: string
  description: string
  ogImage: string
  jsonLd: string
  body: string
}

/** Статический снимок лендинга для `#root`. */
export function renderLanding(): string {
  return renderToStaticMarkup(<Landing />)
}

/** Страницы-спутники: четыре кейса и сравнение платформ. */
export function renderStaticPages(canonical: string): StaticPage[] {
  const pages: StaticPage[] = CASES.map(item => ({
    dir: `keysy/${item.slug}`,
    path: `${SITE_BASE}keysy/${item.slug}/`,
    title: item.pageTitle,
    description: item.pageDescription,
    ogImage: `${canonical}og/keysy-${item.slug}.png`,
    jsonLd: jsonLdScript(caseJsonLd(canonical, item)),
    body: renderToStaticMarkup(<CasePage item={item} />),
  }))

  pages.push({
    dir: COMPARE_PAGE.slug,
    path: `${SITE_BASE}${COMPARE_PAGE.slug}/`,
    title: COMPARE_PAGE.pageTitle,
    description: COMPARE_PAGE.pageDescription,
    ogImage: `${canonical}og/sravnenie.png`,
    jsonLd: jsonLdScript(compareJsonLd(canonical)),
    body: renderToStaticMarkup(<ComparePage />),
  })

  return pages
}
