import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { FileText } from 'lucide-react'
import Breadcrumbs from '../components/Breadcrumbs'
import {
  TERMS_META,
  TERMS_INTRO,
  TERMS_CLAUSES,
  TERMS_PRIVACY_NOTE,
} from '../data/terms'
import type { TermsClause } from '../data/terms'

const SITE = 'https://ideav.ru'

function setMetaTag(selector: string, attr: 'name' | 'property', key: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(selector)
  if (!el) { el = document.createElement('meta'); el.setAttribute(attr, key); document.head.appendChild(el) }
  el.setAttribute('content', content)
}
function setCanonical(href: string) {
  let el = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')
  if (!el) { el = document.createElement('link'); el.setAttribute('rel', 'canonical'); document.head.appendChild(el) }
  el.setAttribute('href', href)
}

/** Текст пункта: `{link}` заменяется ссылкой, остальное — как есть. */
function ClauseText({ clause }: { clause: TermsClause }) {
  if (!clause.link) return <>{clause.text}</>
  const [before, after = ''] = clause.text.split('{link}')
  return (
    <>
      {before}
      <a
        href={clause.link.href}
        className="text-blue-500 underline underline-offset-2 hover:text-blue-600 transition-colors"
      >
        {clause.link.text}
      </a>
      {after}
    </>
  )
}

/**
 * Соглашение об использовании сервиса — страница /terms.html.
 *
 * Раньше подвал вёл на чужой домен (integram.io/terms.html), а в public/ лежала
 * статическая копия в вёрстке старого сайта. Теперь документ живёт на ideav.ru
 * в его же дизайне; текст — из src/data/terms.mjs, общего источника с
 * пререндером (scripts/prerender-terms.mjs).
 */
export default function Terms() {
  useEffect(() => {
    document.title = TERMS_META.title
    const canonical = `${SITE}${TERMS_META.path}`
    const ogImage = `${SITE}/og/knowledge-base.png`

    setMetaTag('meta[name="description"]', 'name', 'description', TERMS_META.description)
    setMetaTag('meta[name="keywords"]', 'name', 'keywords', TERMS_META.keywords)
    setMetaTag('meta[property="og:type"]', 'property', 'og:type', 'article')
    setMetaTag('meta[property="og:title"]', 'property', 'og:title', TERMS_META.title)
    setMetaTag('meta[property="og:description"]', 'property', 'og:description', TERMS_META.description)
    setMetaTag('meta[property="og:url"]', 'property', 'og:url', canonical)
    setMetaTag('meta[property="og:image"]', 'property', 'og:image', ogImage)
    setMetaTag('meta[property="og:site_name"]', 'property', 'og:site_name', 'Интеграм')
    setMetaTag('meta[property="og:locale"]', 'property', 'og:locale', 'ru_RU')
    setMetaTag('meta[name="twitter:card"]', 'name', 'twitter:card', 'summary_large_image')
    setMetaTag('meta[name="twitter:title"]', 'name', 'twitter:title', TERMS_META.title)
    setMetaTag('meta[name="twitter:description"]', 'name', 'twitter:description', TERMS_META.description)
    setMetaTag('meta[name="twitter:image"]', 'name', 'twitter:image', ogImage)
    setCanonical(canonical)
  }, [])

  return (
    <div className="overflow-hidden">
      {/* Hero */}
      <section className="pt-28 pb-10 lg:pt-36 lg:pb-14 border-b border-slate-200 dark:border-slate-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Breadcrumbs
            items={[
              { name: 'Интеграм', to: '/' },
              { name: 'Соглашение об использовании', to: TERMS_META.path },
            ]}
          />

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-blue-500/30 text-blue-600 dark:text-blue-400 text-sm font-medium mb-5">
            <FileText size={14} />
            Правила использования
          </div>

          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight mb-5">
            Соглашение об использовании <span className="text-blue-500">сервиса</span>
          </h1>

          <p className="text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
            {TERMS_INTRO}
          </p>
        </div>
      </section>

      {/* Пункты соглашения */}
      <section className="py-12 lg:py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <ol className="space-y-6">
            {TERMS_CLAUSES.map(clause => (
              <li key={clause.n} id={`p${clause.n}`} className="flex gap-4 scroll-mt-24">
                <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-blue-500/30 text-sm font-bold text-blue-600 dark:text-blue-400">
                  {clause.n}
                </span>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                  <ClauseText clause={clause} />
                </p>
              </li>
            ))}
          </ol>

          <div className="mt-12 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 p-6 text-sm text-slate-600 dark:text-slate-300">
            {TERMS_PRIVACY_NOTE.text}{' '}
            <Link
              to={TERMS_PRIVACY_NOTE.link.href}
              className="text-blue-500 underline underline-offset-2 hover:text-blue-600 transition-colors"
            >
              {TERMS_PRIVACY_NOTE.link.text}
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
