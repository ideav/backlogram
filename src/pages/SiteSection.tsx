import { useEffect, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, CheckCircle2, ExternalLink, Mail, MessageSquare } from 'lucide-react'
import Breadcrumbs from '../components/Breadcrumbs'
import LeadForm from '../components/LeadForm'
import { SITE, SITE_SECTIONS, CLOUD_PLANS, CLOUD_NOTE, CONTACTS, siteSectionBySlug } from '../data/siteSections'
import type { SectionBlock, SectionCase, SectionCta, SectionItem, SectionLink } from '../data/siteSections'
import { SERVICES, formatPrice } from '../data/services'
import { USE_CASES } from '../data/usecases'
import { HOME_CASE_SCREENSHOTS } from '../data/home-cases'
import NotFound from './NotFound'
import { reachGoal, visitParams, rememberLeadFrom } from '../lib/metrika'

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

/**
 * Внутренняя ссылка — через роутер, внешняя (песочница, документация) — новая
 * вкладка, якорь своей страницы (#zayavka, #pricing) — обычный <a>.
 */
function SmartLink({ href, external, className, onClick, children }: { href: string; external?: boolean; className: string; onClick?: () => void; children: ReactNode }) {
  if (external) return <a href={href} target="_blank" rel="noopener noreferrer" className={className} onClick={onClick}>{children}</a>
  if (href.startsWith('#')) return <a href={href} className={className} onClick={onClick}>{children}</a>
  return <Link to={href} className={className} onClick={onClick}>{children}</Link>
}

const MORE_LINK = 'inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600 dark:text-blue-400 hover:gap-2 transition-all'
const CARD = 'p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40'

/**
 * Клик по главной кнопке раздела — цель `section_cta` (#825), по ней Директ
 * оптимизирует рекламу раздела. Если кнопка ведёт на форму главной, раздел
 * запоминается источником заявки `lead`.
 */
function trackSectionCta(slug: string, cta: SectionCta, place: 'top' | 'bottom') {
  reachGoal('section_cta', { section: slug, place })
  if (cta.href.startsWith('/#cta')) rememberLeadFrom(slug)
}

function Cta({ cta, primary, onClick }: { cta: SectionCta; primary?: boolean; onClick?: () => void }) {
  const cls = primary
    ? 'px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl inline-flex items-center gap-2'
    : 'px-6 py-3 border border-slate-300 dark:border-slate-700 font-bold rounded-xl inline-flex items-center gap-2'
  return (
    <SmartLink href={cta.href} external={cta.external} className={cls} onClick={onClick}>
      {cta.text} {cta.external ? <ExternalLink size={16} /> : <ArrowRight size={16} />}
    </SmartLink>
  )
}

function More({ more }: { more?: { text: string; href: string } }) {
  if (!more) return null
  return (
    <p className="mt-6">
      <SmartLink href={more.href} className={MORE_LINK}>{more.text} <ArrowRight size={15} /></SmartLink>
    </p>
  )
}

function ItemCard({ it }: { it: SectionItem }) {
  // Карточка целиком — ссылка, если у пункта нет отдельной подписи ссылки.
  if (it.href && !it.linkText) {
    return (
      <SmartLink href={it.href} className={`group block h-full ${CARD} hover:border-blue-500/40 transition-colors`}>
        <span className="flex items-center justify-between gap-3 font-bold text-slate-800 dark:text-slate-100 mb-1">
          {it.title}
          <ArrowRight size={16} className="text-slate-300 dark:text-slate-600 group-hover:text-blue-500 flex-shrink-0" />
        </span>
        <span className="block text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{it.text}</span>
      </SmartLink>
    )
  }
  return (
    <div className={`h-full ${CARD}`}>
      <p className="font-bold text-slate-800 dark:text-slate-100 mb-2">{it.title}</p>
      <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{it.text}</p>
      {it.href && it.linkText && (
        <SmartLink href={it.href} className={`mt-3 ${MORE_LINK}`}>{it.linkText} <ArrowRight size={15} /></SmartLink>
      )}
    </div>
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

function CaseCard({ c, flip }: { c: SectionCase; flip: boolean }) {
  const shot = HOME_CASE_SCREENSHOTS[c.shot]
  return (
    <article className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
      <div className={flip ? 'lg:order-last' : ''}>
        <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-3">{c.title}</h3>
        <p className="text-slate-600 dark:text-slate-300 leading-relaxed mb-4">{c.context}</p>
        <div className="grid gap-2 text-sm leading-relaxed mb-4">
          <p className="text-slate-500 dark:text-slate-400"><span className="font-semibold text-red-500/90">Было:</span> {c.before}</p>
          <p className="text-slate-600 dark:text-slate-300"><span className="font-semibold text-emerald-500">Стало:</span> {c.after}</p>
          <p className="text-slate-500 dark:text-slate-400"><span className="font-semibold text-slate-700 dark:text-slate-200">Задача:</span> {c.task}</p>
          <p className="text-slate-500 dark:text-slate-400"><span className="font-semibold text-slate-700 dark:text-slate-200">Реализация:</span> {c.impl}</p>
        </div>
        <dl className="flex flex-wrap gap-3 mb-4">
          {c.stats.map((s) => (
            <div key={s.l} className="px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 text-center">
              <dt className="sr-only">{s.l}</dt>
              <dd className="text-xl font-black text-blue-500">{s.v}</dd>
              <dd className="text-xs text-slate-400 dark:text-slate-500 uppercase font-bold tracking-widest">{s.l}</dd>
            </div>
          ))}
        </dl>
        <SmartLink href={c.href} className={MORE_LINK}>{c.linkText} <ArrowRight size={15} /></SmartLink>
      </div>
      <div className="p-2 rounded-[1.5rem] bg-gradient-to-br from-slate-200 dark:from-slate-800 to-slate-100 dark:to-slate-950 border border-slate-200 dark:border-slate-800 shadow-xl">
        <img
          src={`${import.meta.env.BASE_URL}${shot.file}`}
          alt={shot.alt}
          width={shot.width}
          height={shot.height}
          loading="lazy"
          decoding="async"
          className="w-full block rounded-[1.1rem]"
        />
      </div>
    </article>
  )
}

function Pricing({ b }: { b: Extract<SectionBlock, { type: 'pricing' }> }) {
  const services = (b.services ?? [])
    .map((id) => SERVICES.find((s) => s.id === id))
    .filter((s): s is (typeof SERVICES)[number] => Boolean(s))
  return (
    <>
      {services.length > 0 && (
        <div className={`grid gap-5 ${services.length > 1 ? 'md:grid-cols-3' : ''}`}>
          {services.map((s) => (
            <div key={s.id} className={`${CARD} flex flex-col`}>
              <h3 className="text-lg font-bold mb-1">{s.name}</h3>
              <p className="text-3xl font-black mb-3">
                {s.priceFrom ? 'от ' : ''}{formatPrice(s.price)} <span className="text-base text-slate-400">{s.unit}</span>
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed mb-4">{s.description}</p>
              <ul className="space-y-2 mb-6 flex-1">
                {s.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-300">
                    <CheckCircle2 size={14} className="text-blue-500 mt-1 shrink-0" />{f}
                  </li>
                ))}
              </ul>
              <SmartLink href={b.ctaHref ?? s.url} className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-center block">
                {s.cta}
              </SmartLink>
            </div>
          ))}
        </div>
      )}
      {b.cloud && (
        <>
          <p className={`text-slate-600 dark:text-slate-300 leading-relaxed mb-6 max-w-4xl ${services.length ? 'mt-10' : ''}`}>
            <span className="font-semibold text-slate-800 dark:text-slate-100">Облачные тарифы.</span> {CLOUD_NOTE}
          </p>
          <div className="grid md:grid-cols-3 gap-5">
            {CLOUD_PLANS.map((p) => (
              <div key={p.id} className={`${CARD} flex flex-col ${p.featured ? 'border-2 border-blue-600 dark:border-blue-600' : ''}`}>
                <h3 className="text-lg font-bold mb-1">{p.name}</h3>
                <p className="text-sm text-slate-400 dark:text-slate-500 mb-3">{p.note}</p>
                <p className="text-3xl font-black mb-4">{p.price} <span className="text-base text-slate-400">{p.unit}</span></p>
                <ul className="space-y-2 mb-6 flex-1">
                  {p.items.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-300">
                      <CheckCircle2 size={14} className="text-blue-500 mt-1 shrink-0" />{f}
                    </li>
                  ))}
                </ul>
                <SmartLink href={p.cta.href} external={p.cta.external} className={`w-full py-3 font-bold rounded-xl text-center block ${p.featured ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'border border-slate-300 dark:border-slate-700'}`}>
                  {p.cta.text}
                </SmartLink>
              </div>
            ))}
          </div>
        </>
      )}
    </>
  )
}

function Block({ b, slug }: { b: SectionBlock; slug: string }) {
  const intro = b.intro && <p className="text-slate-600 dark:text-slate-300 leading-relaxed mb-8 max-w-4xl">{b.intro}</p>
  let body: ReactNode = null
  switch (b.type) {
    case 'features':
      body = (
        <>
          <ul className={`grid gap-4 ${b.items.length === 2 ? 'md:grid-cols-2' : b.items.length === 4 ? 'md:grid-cols-2 lg:grid-cols-4' : 'md:grid-cols-2 lg:grid-cols-3'}`}>
            {b.items.map((it) => <li key={it.title}><ItemCard it={it} /></li>)}
          </ul>
          {b.note && <p className="mt-6 p-5 rounded-2xl bg-blue-600/5 border border-blue-500/10 text-slate-700 dark:text-slate-200 leading-relaxed">{b.note}</p>}
        </>
      )
      break
    case 'steps':
      body = (
        <>
          <ol className={`grid gap-4 ${b.steps.length === 4 ? 'md:grid-cols-2 lg:grid-cols-4' : 'md:grid-cols-3'}`}>
            {b.steps.map((s, i) => (
              <li key={s.title} className={CARD}>
                <span className="block text-3xl font-black text-blue-500/30 mb-2">{String(i + 1).padStart(2, '0')}</span>
                <p className="font-bold text-slate-800 dark:text-slate-100 mb-2">{s.title}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{s.text}</p>
              </li>
            ))}
          </ol>
          {b.result && <p className="mt-6 p-5 rounded-2xl bg-blue-600/5 border border-blue-500/10 text-slate-700 dark:text-slate-200 leading-relaxed">{b.result}</p>}
        </>
      )
      break
    case 'cases':
      body = <div className="space-y-16">{b.cases.map((c, i) => <CaseCard key={c.title} c={c} flip={i % 2 === 1} />)}</div>
      break
    case 'industries':
      body = (
        <>
          <ul className="flex flex-wrap gap-2 mb-8">
            {b.tags.map((t) => <li key={t} className="px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-800 text-sm text-slate-600 dark:text-slate-300">{t}</li>)}
          </ul>
          <ul className="grid md:grid-cols-2 gap-4">
            {b.items.map((it) => <li key={it.title}><ItemCard it={it} /></li>)}
          </ul>
        </>
      )
      break
    case 'usecases':
      body = (
        <ul className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {USE_CASES.map((u) => (
            <li key={u.slug}>
              <ItemCard it={{ title: u.badge.replace(/ на Интеграме$/, ''), text: u.example, href: `/${u.slug}.html` }} />
            </li>
          ))}
        </ul>
      )
      break
    case 'pricing':
      body = <Pricing b={b} />
      break
    case 'form':
      body = (
        <div className="grid lg:grid-cols-[1fr_1.4fr] gap-8 items-start">
          <div className="space-y-4">
            <a href={CONTACTS.telegram.href} className="flex items-center gap-3 font-bold text-slate-700 dark:text-slate-200 hover:text-blue-500">
              <MessageSquare size={20} className="text-blue-500" /> Telegram {CONTACTS.telegram.label}
            </a>
            <a href={CONTACTS.email.href} className="flex items-center gap-3 font-bold text-slate-700 dark:text-slate-200 hover:text-blue-500">
              <Mail size={20} className="text-blue-500" /> {CONTACTS.email.label}
            </a>
          </div>
          <LeadForm source={slug} />
        </div>
      )
      break
    case 'links':
      body = (
        <ul className="grid md:grid-cols-2 gap-4">
          {b.links.map((l) => <li key={l.href}><LinkCard l={l} /></li>)}
        </ul>
      )
      break
  }
  return (
    <section id={b.id} className="scroll-mt-24 py-10">
      <h2 className="text-2xl md:text-3xl font-bold mb-4">{b.h2}</h2>
      {intro}
      {body}
      <More more={b.more} />
    </section>
  )
}

/**
 * Страница одного из трёх основных разделов сайта (issues #823, #827) — из
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
    // Параметр визита: визиты и лиды режутся по разделам без отдельных целей (#825).
    visitParams({ section: page.slug })
  }, [page])

  if (!page) return <NotFound />

  const others = SITE_SECTIONS.filter((s) => s.slug !== page.slug)
  const hasForm = page.blocks.some((b) => b.type === 'form')

  return (
    <div className="overflow-hidden">
      <section className="pt-32 pb-6 lg:pt-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <Breadcrumbs items={[{ name: 'Интеграм', to: '/' }, { name: page.navName, to: `/${page.slug}.html` }]} />
          <p className="uppercase tracking-widest text-xs font-bold text-blue-500 mb-3">{page.badge}</p>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight mb-6">
            {page.h1} <span className="text-blue-600 dark:text-blue-400">{page.h1accent}</span>
          </h1>
          <p className="text-lg text-slate-500 dark:text-slate-400 leading-relaxed max-w-4xl">{page.lead}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Cta cta={page.cta} primary onClick={() => trackSectionCta(page.slug, page.cta, 'top')} />
            <Cta cta={page.cta2} />
          </div>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {page.blocks.map((b) => <Block key={b.id} b={b} slug={page.slug} />)}

        <section id="faq" className="scroll-mt-24 py-10">
          <h2 className="text-2xl md:text-3xl font-bold mb-6">Частые вопросы</h2>
          <dl className="space-y-5">
            {page.faq.map((f) => (
              <div key={f.q}>
                <dt className="font-bold mb-1">{f.q}</dt>
                <dd className="text-slate-600 dark:text-slate-300 leading-relaxed">{f.a}</dd>
              </div>
            ))}
          </dl>
        </section>

        {/* Форма уже стоит на странице — нижний призыв не дублирует её. */}
        {!hasForm && (
          <section className="my-12 p-8 rounded-3xl bg-blue-600 text-white">
            <h2 className="text-2xl md:text-3xl font-bold mb-3">{page.cta.text}</h2>
            <p className="text-blue-100 leading-relaxed mb-6 max-w-3xl">{page.ogDescription}</p>
            <SmartLink href={page.cta.href} external={page.cta.external} onClick={() => trackSectionCta(page.slug, page.cta, 'bottom')} className="px-6 py-3 bg-white text-blue-700 font-bold rounded-xl inline-flex items-center gap-2">
              {page.cta.text} {page.cta.external ? <ExternalLink size={16} /> : <ArrowRight size={16} />}
            </SmartLink>
          </section>
        )}

        <nav className="py-12" aria-label="Другие разделы">
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
