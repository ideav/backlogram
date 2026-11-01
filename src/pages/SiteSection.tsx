import { useEffect, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, ExternalLink } from 'lucide-react'
import Breadcrumbs from '../components/Breadcrumbs'
import { SITE, SITE_SECTIONS, siteSectionBySlug } from '../data/siteSections'
import type { SectionCta, SectionLink } from '../data/siteSections'
import { SERVICES, formatPrice } from '../data/services'
import NotFound from './NotFound'

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

/** Внутренняя ссылка — через роутер, внешняя (песочница, документация) — обычная. */
function SmartLink({ href, external, className, children }: { href: string; external?: boolean; className: string; children: ReactNode }) {
  if (external) return <a href={href} target="_blank" rel="noopener noreferrer" className={className}>{children}</a>
  return <Link to={href} className={className}>{children}</Link>
}

function Cta({ cta, primary }: { cta: SectionCta; primary?: boolean }) {
  const cls = primary
    ? 'px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl inline-flex items-center gap-2'
    : 'px-6 py-3 border border-slate-300 dark:border-slate-700 font-bold rounded-xl inline-flex items-center gap-2'
  return (
    <SmartLink href={cta.href} external={cta.external} className={cls}>
      {cta.text} {cta.external ? <ExternalLink size={16} /> : <ArrowRight size={16} />}
    </SmartLink>
  )
}

function LinkCard({ l }: { l: SectionLink }) {
  return (
    <SmartLink
      href={l.href}
      external={l.external}
      className="group block h-full p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 hover:border-blue-500/40 transition-colors"
    >
      <span className="flex items-center justify-between gap-3 font-bold text-slate-800 dark:text-slate-100 mb-2">
        {l.title}
        {l.external
          ? <ExternalLink size={16} className="text-slate-300 dark:text-slate-600 group-hover:text-blue-500 flex-shrink-0" />
          : <ArrowRight size={16} className="text-slate-300 dark:text-slate-600 group-hover:text-blue-500 flex-shrink-0" />}
      </span>
      <span className="block text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{l.body}</span>
    </SmartLink>
  )
}

/**
 * Страница одного из трёх основных разделов сайта (issue #823) — из
 * src/data/siteSections.mjs. Тот же источник читает
 * scripts/prerender-site-sections.mjs, поэтому сырой HTML (его видит реклама и
 * Яндекс) совпадает с отрендеренным DOM.
 */
export default function SiteSection({ slug }: { slug: string }) {
  const page = siteSectionBySlug(slug)

  useEffect(() => {
    if (!page) return
    const canonical = `${SITE}/${page.slug}.html`
    document.title = page.seoTitle
    setMetaTag('meta[name="description"]', 'name', 'description', page.metaDescription)
    setMetaTag('meta[property="og:type"]', 'property', 'og:type', 'website')
    setMetaTag('meta[property="og:title"]', 'property', 'og:title', page.ogTitle)
    setMetaTag('meta[property="og:description"]', 'property', 'og:description', page.ogDescription)
    setMetaTag('meta[property="og:url"]', 'property', 'og:url', canonical)
    setCanonical(canonical)
  }, [page])

  if (!page) return <NotFound />

  const priced = (page.pricing ?? [])
    .map((id) => SERVICES.find((s) => s.id === id))
    .filter((s): s is (typeof SERVICES)[number] => Boolean(s))
  const others = SITE_SECTIONS.filter((s) => s.slug !== page.slug)

  return (
    <div className="overflow-hidden">
      <section className="pt-32 pb-6 lg:pt-40">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <Breadcrumbs items={[{ name: 'Интеграм', to: '/' }, { name: page.navName, to: `/${page.slug}.html` }]} />
          <p className="uppercase tracking-widest text-xs font-bold text-blue-500 mb-3">{page.badge}</p>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight mb-6">
            {page.h1} <span className="text-blue-600 dark:text-blue-400">{page.h1accent}</span>
          </h1>
          <p className="text-lg text-slate-500 dark:text-slate-400 leading-relaxed max-w-4xl">{page.lead}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Cta cta={page.cta} primary />
            <Cta cta={page.cta2} />
          </div>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {page.blocks.map((b) => (
          <section key={b.h2} className="py-10">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">{b.h2}</h2>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed mb-6 max-w-4xl">{b.intro}</p>
            <ul className="grid md:grid-cols-2 gap-4">
              {b.links.map((l) => <li key={l.href}><LinkCard l={l} /></li>)}
            </ul>
          </section>
        ))}

        {priced.length > 0 && (
          <section className="py-10">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">Стоимость</h2>
            {page.pricingIntro && <p className="text-slate-600 dark:text-slate-300 leading-relaxed mb-6 max-w-4xl">{page.pricingIntro}</p>}
            <div className="grid sm:grid-cols-3 gap-5">
              {priced.map((p) => (
                <a key={p.id} href={`/uslugi.html#${p.id}`} className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-blue-400 transition-colors">
                  <p className="font-bold mb-2">{p.name}</p>
                  <p className="text-2xl font-black">
                    {p.priceFrom ? 'от ' : ''}{formatPrice(p.price)} <span className="text-base text-slate-400">{p.unit}</span>
                  </p>
                </a>
              ))}
            </div>
          </section>
        )}

        <section className="py-10">
          <h2 className="text-2xl md:text-3xl font-bold mb-6">Частые вопросы</h2>
          <div className="space-y-5">
            {page.faq.map((f) => (
              <div key={f.q}>
                <h3 className="font-bold mb-1">{f.q}</h3>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed">{f.a}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="my-12 p-8 rounded-3xl bg-blue-600 text-white">
          <h2 className="text-2xl md:text-3xl font-bold mb-3">{page.cta.text}</h2>
          <p className="text-blue-100 leading-relaxed mb-6 max-w-3xl">{page.ogDescription}</p>
          <SmartLink href={page.cta.href} external={page.cta.external} className="px-6 py-3 bg-white text-blue-700 font-bold rounded-xl inline-flex items-center gap-2">
            {page.cta.text} {page.cta.external ? <ExternalLink size={16} /> : <ArrowRight size={16} />}
          </SmartLink>
        </section>

        <nav className="pb-16" aria-label="Другие разделы">
          <h2 className="text-xl font-bold mb-4">Другие разделы сайта</h2>
          <ul className="grid sm:grid-cols-2 gap-4">
            {others.map((s) => (
              <li key={s.slug}>
                <Link to={`/${s.slug}.html`} className="block p-5 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-blue-500/40 transition-colors">
                  <span className="block font-bold text-slate-800 dark:text-slate-100 mb-1">{s.choice}</span>
                  <span className="block text-sm text-slate-500 dark:text-slate-400">{s.choiceNote}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </div>
  )
}
