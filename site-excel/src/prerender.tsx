import { renderToStaticMarkup } from 'react-dom/server'
import { ADEPT, CASES, COMPARE_PAGE, LANDING_FAQ_COMMON, PARTNER, PRAKTIKUM, type Landing as LandingData } from './content'
import Landing from './Landing'
import { CasePage } from './pages/CasePage'
import { ComparePage } from './pages/ComparePage'
import { LandingPage, type LandingLink } from './pages/LandingPage'
import { PraktikumPage } from './pages/PraktikumPage'
import { AdeptPage, PartnerPage } from './pages/ProgramPage'
import { caseJsonLd, compareJsonLd, jsonLdScript, landingPageJsonLd, praktikumJsonLd, programJsonLd } from './seo'
import { SITE_BASE } from './site-base'

// Существующие страницы домена — пререндер сверяет с ними уникальность посадочных.
export { PAGES } from './content'

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
  /** Посадочная (issue #657): пререндер добавит скрипт UTM и цели CTA. */
  landing?: string
  /** Практикум (issue #668): пререндер добавит двухэтапную целевую кнопку. */
  praktikum?: boolean
}

/** Статический снимок лендинга для `#root`. */
export function renderLanding(): string {
  return renderToStaticMarkup(<Landing />)
}

/** Страницы-спутники: четыре кейса, сравнение платформ и практикум. */
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

  // Практикум для новичков (issue #659).
  pages.push({
    dir: PRAKTIKUM.slug,
    path: `${SITE_BASE}${PRAKTIKUM.slug}/`,
    title: PRAKTIKUM.pageTitle,
    description: PRAKTIKUM.pageDescription,
    ogImage: `${canonical}og/praktikum.png`,
    jsonLd: jsonLdScript(praktikumJsonLd(canonical)),
    body: renderToStaticMarkup(<PraktikumPage />),
    praktikum: true,
  })

  // Рекрутинг адептов и партнёров (issue #671).
  for (const [program, Page] of [
    [ADEPT, AdeptPage],
    [PARTNER, PartnerPage],
  ] as const) {
    pages.push({
      dir: program.slug,
      path: `${SITE_BASE}${program.slug}/`,
      title: program.pageTitle,
      description: program.pageDescription,
      ogImage: `${canonical}og/excel-to-app.png`,
      jsonLd: jsonLdScript(programJsonLd(canonical, program)),
      body: renderToStaticMarkup(<Page />),
    })
  }

  return pages
}

/**
 * Подписи соседних страниц (блок 11 посадочных, issue #657): посадочные —
 * по своему `crumb`, кейсы и сравнение — по клиенту и предмету.
 */
function linkTitles(landings: LandingData[]): Map<string, string> {
  const titles = new Map<string, string>([
    ['/', 'Главная: приложение из вашего Excel за 45 минут'],
    [`/${COMPARE_PAGE.slug}/`, 'Чем это отличается от других платформ'],
  ])
  for (const c of CASES) titles.set(`/keysy/${c.slug}/`, `Кейс ${c.client}: ${c.industry.toLowerCase()}`)
  for (const l of landings) titles.set(`/${l.slug}/`, l.crumb)
  return titles
}

/** Посадочные страницы под рекламу и поиск (issue #657), данные — `landings/*.json`. */
export function renderLandingPages(canonical: string, landings: LandingData[]): StaticPage[] {
  const titles = linkTitles(landings)
  return landings.map(page => {
    const related: LandingLink[] = page.related.map(target => {
      const path = target.startsWith('/') ? target : `/${target}/`
      return { href: SITE_BASE + path.replace(/^\/+/, ''), title: titles.get(path) ?? path }
    })
    return {
      dir: page.slug,
      path: `${SITE_BASE}${page.slug}/`,
      title: page.title,
      description: page.description,
      ogImage: `${canonical}og/excel-to-app.png`,
      jsonLd: jsonLdScript(landingPageJsonLd(canonical, page, [...page.faq, ...LANDING_FAQ_COMMON])),
      body: renderToStaticMarkup(<LandingPage page={page} related={related} />),
      landing: page.slug,
    }
  })
}
