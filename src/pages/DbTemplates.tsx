import { useEffect } from 'react'
import { LayoutTemplate } from 'lucide-react'
import Breadcrumbs from '../components/Breadcrumbs'
import {
  DBT_META,
  DBT_INTRO,
  DBT_CATALOG,
  DBT_CREATE,
  DBT_OWN,
  DBT_LIMITS,
  DBT_CTA,
  DBT_RELATED,
} from '../data/dbTemplates'
import type { DbtLink } from '../data/dbTemplates'

const SITE = 'https://ideav.ru'

function A({ link, className }: { link: DbtLink; className?: string }) {
  return (
    <a
      href={link.href}
      className={className ?? 'text-blue-600 dark:text-blue-400 hover:underline'}
      {...(link.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
    >
      {link.text}
    </a>
  )
}

function Steps({ items }: { items: { text: string; link?: DbtLink }[] }) {
  return (
    <ol className="space-y-3 list-decimal pl-6 marker:font-semibold marker:text-blue-500">
      {items.map((s, i) => (
        <li key={i} className="text-slate-600 dark:text-slate-300 leading-relaxed pl-1">
          {s.text}{s.link && <> <A link={s.link} /></>}
        </li>
      ))}
    </ol>
  )
}

/**
 * Шаблоны решений — страница /shablony-reshenij.html (ideav/crm#5364).
 * Текст — из src/data/dbTemplates.mjs, общего источника с пререндером
 * (scripts/prerender-db-templates.mjs).
 */
export default function DbTemplates() {
  useEffect(() => {
    document.title = DBT_META.title
    const canonical = `${SITE}${DBT_META.path}`
    const ogImage = `${SITE}/og/shablony-reshenij.png`

    const setMetaTag = (selector: string, attr: 'name' | 'property', key: string, content: string) => {
      let el = document.head.querySelector<HTMLMetaElement>(selector)
      if (!el) { el = document.createElement('meta'); el.setAttribute(attr, key); document.head.appendChild(el) }
      el.setAttribute('content', content)
    }
    let link = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')
    if (!link) { link = document.createElement('link'); link.setAttribute('rel', 'canonical'); document.head.appendChild(link) }
    link.setAttribute('href', canonical)

    setMetaTag('meta[name="description"]', 'name', 'description', DBT_META.description)
    setMetaTag('meta[name="keywords"]', 'name', 'keywords', DBT_META.keywords)
    setMetaTag('meta[property="og:type"]', 'property', 'og:type', 'article')
    setMetaTag('meta[property="og:title"]', 'property', 'og:title', DBT_META.title)
    setMetaTag('meta[property="og:description"]', 'property', 'og:description', DBT_META.description)
    setMetaTag('meta[property="og:url"]', 'property', 'og:url', canonical)
    setMetaTag('meta[property="og:image"]', 'property', 'og:image', ogImage)
    setMetaTag('meta[property="og:site_name"]', 'property', 'og:site_name', 'Интеграм')
    setMetaTag('meta[property="og:locale"]', 'property', 'og:locale', 'ru_RU')
    setMetaTag('meta[name="twitter:card"]', 'name', 'twitter:card', 'summary_large_image')
    setMetaTag('meta[name="twitter:title"]', 'name', 'twitter:title', DBT_META.title)
    setMetaTag('meta[name="twitter:description"]', 'name', 'twitter:description', DBT_META.description)
    setMetaTag('meta[name="twitter:image"]', 'name', 'twitter:image', ogImage)

    const hash = decodeURIComponent(window.location.hash.slice(1))
    if (hash) document.getElementById(hash)?.scrollIntoView()
  }, [])

  const h2 = 'text-2xl md:text-3xl font-bold tracking-tight mb-6'

  return (
    <div className="overflow-x-clip">
      <section className="pt-28 pb-10 lg:pt-36 lg:pb-12 border-b border-slate-200 dark:border-slate-900">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <Breadcrumbs
            items={[
              { name: 'Интеграм', to: '/' },
              { name: 'Шаблоны решений', to: DBT_META.path },
            ]}
          />
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-blue-500/30 text-blue-600 dark:text-blue-400 text-sm font-medium mb-5">
            <LayoutTemplate size={14} />
            Готовые базы
          </div>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight mb-5">{DBT_META.h1}</h1>
          <p className="max-w-4xl text-lg text-slate-600 dark:text-slate-300 leading-relaxed">{DBT_INTRO}</p>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-14 space-y-14">
        <section id="katalog" className="scroll-mt-24">
          <h2 className={h2}>Каталог шаблонов</h2>
          <div className="grid gap-6 md:grid-cols-2">
            {DBT_CATALOG.map((t) => (
              <article key={t.id} id={t.id} className="scroll-mt-24 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-3">
                <h3 className="text-xl font-semibold">{t.name}</h3>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed"><strong>Для кого:</strong> {t.audience}</p>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed"><strong>Задача:</strong> {t.task}</p>
                <div>
                  <p className="font-semibold mb-1">Внутри</p>
                  <ul className="list-disc pl-6 space-y-1 text-slate-600 dark:text-slate-300">
                    {t.inside.map((i) => <li key={i}>{i}</li>)}
                  </ul>
                </div>
                <p className="flex flex-wrap gap-x-5 gap-y-2 pt-2">
                  {t.links.map((l) => <A key={l.href} link={l} />)}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section id={DBT_CREATE.id} className="scroll-mt-24">
          <h2 className={h2}>{DBT_CREATE.title}</h2>
          <Steps items={DBT_CREATE.steps} />
        </section>

        <section id={DBT_OWN.id} className="scroll-mt-24">
          <h2 className={h2}>{DBT_OWN.title}</h2>
          <p className="text-sm uppercase tracking-wider text-blue-500 font-bold mb-2">{DBT_OWN.audience}</p>
          <p className="text-slate-600 dark:text-slate-300 mb-4">{DBT_OWN.intro}</p>
          <Steps items={DBT_OWN.steps.map((text) => ({ text }))} />
          <ul className="mt-6 space-y-2 border-l-4 border-amber-400 pl-4 text-slate-600 dark:text-slate-300">
            {DBT_OWN.notes.map((n) => <li key={n}>{n}</li>)}
          </ul>
        </section>

        <section id={DBT_LIMITS.id} className="scroll-mt-24">
          <h2 className={h2}>{DBT_LIMITS.title}</h2>
          <ul className="list-disc pl-6 space-y-2 text-slate-600 dark:text-slate-300">
            {DBT_LIMITS.items.map((n) => <li key={n}>{n}</li>)}
          </ul>
        </section>

        <section className="flex flex-wrap gap-4">
          {DBT_CTA.map((c) => (
            <A
              key={c.href}
              link={c}
              className={
                c.primary
                  ? 'px-6 py-3 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-500 transition-colors'
                  : 'px-6 py-3 rounded-xl border border-slate-300 dark:border-slate-700 font-semibold hover:border-blue-400 transition-colors'
              }
            />
          ))}
        </section>

        <section id={DBT_RELATED.id} className="scroll-mt-24">
          <h2 className={h2}>{DBT_RELATED.title}</h2>
          <ul className="space-y-2">
            {DBT_RELATED.links.map((l) => <li key={l.href}><A link={l} /></li>)}
          </ul>
        </section>
      </div>
    </div>
  )
}
