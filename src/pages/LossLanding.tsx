import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, AlertTriangle } from 'lucide-react'
import Breadcrumbs from '../components/Breadcrumbs'
import LossCalculator from '../components/LossCalculator'
import { CompanyCard, InnForm } from '../components/InnLookup'
import { reachGoal } from '../lib/metrika'
import { profileToValues } from '../lib/innProfile'
import type { InnProfile } from '../lib/innProfile'
import { LOSS_CTA_URL, LOSS_DEFAULT_CTA, LOSS_EMAIL, LOSS_LANDINGS, LOSS_PHONE, LOSS_SITE } from '../data/lossLandings'

function setMeta(selector: string, attr: 'name' | 'property', key: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(selector)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, key)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}

/** Подмена H1 из объявления: `?h=Текст`. Только текст (React экранирует), до 120 символов. */
function headlineFromUrl(): string | null {
  try {
    const h = new URLSearchParams(window.location.search).get('h')
    return h && h.length <= 120 ? h : null
  } catch {
    return null
  }
}

const SECTION = 'py-14 border-b border-slate-200 dark:border-slate-900'
const WRAP = 'max-w-4xl mx-auto px-4 sm:px-6 lg:px-8'
const H2 = 'text-2xl md:text-3xl font-bold mb-8'
const CARD = 'p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-sm dark:shadow-none'
const LINK = 'inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 transition-colors'

export default function LossLanding({ slug }: { slug: string }) {
  const page = LOSS_LANDINGS.find((p) => p.slug === slug)
  const [h1Override] = useState(headlineFromUrl)
  const [profile, setProfile] = useState<InnProfile | null>(null)

  useEffect(() => {
    if (!page) return
    const canonical = `${LOSS_SITE}/${page.slug}.html`
    document.title = page.seoTitle
    setMeta('meta[name="description"]', 'name', 'description', page.metaDescription)
    setMeta('meta[property="og:type"]', 'property', 'og:type', 'website')
    setMeta('meta[property="og:title"]', 'property', 'og:title', page.seoTitle)
    setMeta('meta[property="og:description"]', 'property', 'og:description', page.metaDescription)
    setMeta('meta[property="og:url"]', 'property', 'og:url', canonical)
    let link = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')
    if (!link) {
      link = document.createElement('link')
      link.setAttribute('rel', 'canonical')
      document.head.appendChild(link)
    }
    link.setAttribute('href', canonical)
    // Служебная страница не индексируется: меняем content единственного тега robots
    // (второй тег рядом с index, follow противоречил бы ему), при уходе со страницы SPA — возвращаем.
    if (page.indexable) return
    let robots = document.querySelector<HTMLMetaElement>('meta[name="robots"]')
    const created = !robots
    if (!robots) {
      robots = document.createElement('meta')
      robots.setAttribute('name', 'robots')
      document.head.appendChild(robots)
    }
    robots.setAttribute('content', 'noindex, nofollow')
    // Пререндер служебной страницы уже несёт noindex, поэтому при уходе ставим
    // значение по умолчанию из index.html, а не «прежнее».
    return () => {
      if (created) robots?.remove()
      else robots?.setAttribute('content', 'index, follow, max-image-preview:large, max-snippet:-1')
    }
  }, [page])

  if (!page) return null
  // Данные ФНС по ИНН → поля калькулятора (backlogram#913).
  const weeks = page.calc.assumptions.find((f) => f.id === 'a_weeks')?.value
  const fromInn = profile ? profileToValues(profile, weeks) : null
  const sources = fromInn ? Object.fromEntries(fromInn.facts.map((f) => [f.id, `Подставлено: ${f.source}`])) : undefined
  const onInn = (p: InnProfile) => {
    setProfile(p)
    requestAnimationFrame(() => document.getElementById('calc')?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
  }
  const cta = page.calc.ctaText ?? LOSS_DEFAULT_CTA
  const onCta = () => reachGoal(page.calc.goal, { page: page.slug })
  const crumbs = page.indexable
    ? [
        { name: 'Интеграм', to: '/' },
        { name: 'Решения', to: '/resheniya.html' },
        { name: page.navTitle, to: `/${page.slug}.html` },
      ]
    : [
        { name: 'Интеграм', to: '/' },
        { name: page.navTitle, to: `/${page.slug}.html` },
      ]

  return (
    <div className="overflow-hidden">
      <section className="pt-28 pb-12 lg:pt-36 lg:pb-14 border-b border-slate-200 dark:border-slate-900">
        <div className={WRAP}>
          <Breadcrumbs items={crumbs} />
          <p className="text-sm font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 mb-3">{page.kicker}</p>
          <motion.h1 initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
            className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight mb-5">
            {h1Override ?? page.h1}
          </motion.h1>
          <p className="text-lg text-slate-600 dark:text-slate-300 leading-relaxed mb-8">{page.lead}</p>
          {page.inn ? <InnForm slug={page.slug} onResult={onInn} /> : (
          <div className="flex flex-wrap gap-3">
            <a href="#calc" className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-600/20 transition-all">
              {page.heroCta ?? 'Посчитать потери'} <ArrowRight size={18} />
            </a>
            {page.case && (
              <a href="#case" className="inline-flex items-center justify-center gap-2 px-6 py-3 border border-blue-500/40 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/30 font-bold rounded-xl transition-all">
                {page.heroCta2 ?? 'Пример внедрения'}
              </a>
            )}
          </div>
          )}
        </div>
      </section>

      {page.pains && (
        <section className={SECTION}>
          <div className={WRAP}>
            <h2 className={H2}>{page.pains.title}</h2>
            <div className="grid gap-6 md:grid-cols-3">
              {page.pains.items.map((p) => (
                <div key={p.title} className={CARD}>
                  <AlertTriangle size={18} className="text-amber-500 mb-3" />
                  <h3 className="text-lg font-bold mb-2">{p.title}</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{p.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <section id="calc" className={`${SECTION} scroll-mt-24`}>
        <div className={WRAP}>
          <h2 className={H2}>{page.calc.title}</h2>
          {profile && <CompanyCard p={profile} />}
          <LossCalculator key={profile?.inn ?? 'default'} calc={page.calc} slug={page.slug} preset={fromInn?.values} sources={sources} />
        </div>
      </section>

      {page.case && (
        <section id="case" className={`${SECTION} scroll-mt-24 bg-slate-50/60 dark:bg-slate-900/30`}>
          <div className={WRAP}>
            <h2 className={H2}>{page.case.title}</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">{page.case.segment}</p>
            <h3 className="text-xl font-bold mb-6">{page.case.headline}</h3>
            <div className="grid gap-6 md:grid-cols-3 mb-8">
              {page.case.story.map((s) => (
                <div key={s.h} className={CARD}>
                  <h4 className="font-bold mb-2">{s.h}</h4>
                  <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{s.p}</p>
                </div>
              ))}
            </div>
            <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-900/50">
                    {page.case.headers.map((h) => (
                      <th key={h} className="text-left py-3 px-4 font-bold text-slate-500 dark:text-slate-400">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {page.case.table.map((row) => (
                    <tr key={row.metric} className="border-t border-slate-100 dark:border-slate-800/60 align-top">
                      <td className="py-3 px-4 font-semibold">{row.metric}</td>
                      <td className="py-3 px-4 text-slate-500 dark:text-slate-400">{row.before}</td>
                      <td className="py-3 px-4 font-semibold text-emerald-700 dark:text-emerald-400">{row.after}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {page.case.note && <p className="text-xs text-slate-500 dark:text-slate-400 mt-3">{page.case.note}</p>}
          </div>
        </section>
      )}

      {page.steps && (
        <section className={SECTION}>
          <div className={WRAP}>
            <h2 className={H2}>{page.steps.title}</h2>
            <ol className="grid gap-4 md:grid-cols-2">
              {page.steps.items.map((s, i) => (
                <li key={s.title} className={`${CARD} flex gap-4`}>
                  <span className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-bold flex items-center justify-center shrink-0">{i + 1}</span>
                  <div>
                    <h3 className="font-bold mb-1">{s.title}</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{s.text}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>
      )}

      {page.faq && page.faq.length > 0 && (
        <section id="faq" className={SECTION}>
          <div className={WRAP}>
            <h2 className={H2}>Частые вопросы</h2>
            <div className="space-y-3">
              {page.faq.map((f) => (
                <details key={f.q} className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-5 py-4">
                  <summary className="cursor-pointer font-semibold">{f.q}</summary>
                  <p className="mt-3 text-slate-600 dark:text-slate-300 leading-relaxed">{f.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className={SECTION}>
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">{page.final.title}</h2>
          <p className="text-slate-600 dark:text-slate-300 leading-relaxed mb-6">{page.final.text}</p>
          <a href={LOSS_CTA_URL} onClick={onCta} className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-600/20 transition-all">
            {cta} <ArrowRight size={18} />
          </a>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-3">
            <a href={LOSS_PHONE.href} className="hover:underline">{LOSS_PHONE.text}</a> · <a href={`mailto:${LOSS_EMAIL}`} className="hover:underline">{LOSS_EMAIL}</a>
          </p>
        </div>
      </section>

      {page.related.length > 0 && (
        <section className="py-12">
          <div className={WRAP}>
            <h2 className="text-lg font-bold mb-4">Читайте также</h2>
            <ul className="space-y-2">
              {page.related.map((r) => (
                <li key={r.href}>
                  <Link to={r.href} className={LINK}>{r.label} <ArrowRight size={14} /></Link>
                </li>
              ))}
              <li>
                <Link to="/resheniya.html" className={LINK}>Все решения вместо Excel <ArrowRight size={14} /></Link>
              </li>
            </ul>
          </div>
        </section>
      )}
    </div>
  )
}
