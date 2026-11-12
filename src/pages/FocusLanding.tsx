import { useEffect, useMemo } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { AlertTriangle, ArrowRight, CheckCircle2, Gauge } from 'lucide-react'
import LeadForm from '../components/LeadForm'
import { reachGoal, visitParams } from '../lib/metrika'
import { focusIdFromSearch, headlineFromSearch } from '../lib/focusHeadline'
import {
  FOCUS_CTA_URL, FOCUS_HUB, FOCUS_LANDINGS, FOCUS_PATH, FOCUS_SITE, FOCUS_STEPS, focusById,
} from '../data/focusLandings'
import { LOSS_EMAIL, LOSS_PHONE } from '../data/lossLandings'

/**
 * Один шаблон посадочной для Директа (python2node#1233): /reshenie.html?f=<фокус>&utm_term={keyword}.
 * Фокус выбирает блоки, H1 подменяется ключевой фразой объявления. Страница закрыта noindex.
 */

const SECTION = 'py-14 border-b border-slate-200 dark:border-slate-900'
const WRAP = 'max-w-4xl mx-auto px-4 sm:px-6 lg:px-8'
const H2 = 'text-2xl md:text-3xl font-bold mb-8'
const CARD = 'p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-sm dark:shadow-none'
const BTN = 'inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-600/20 transition-all'
const BTN2 = 'inline-flex items-center justify-center gap-2 px-6 py-3 border border-blue-500/40 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/30 font-bold rounded-xl transition-all'

function setMeta(selector: string, attr: 'name' | 'property', key: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(selector)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, key)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}

export default function FocusLanding() {
  const { search } = useLocation()
  const focus = useMemo(() => focusById(focusIdFromSearch(search)), [search])
  const override = useMemo(() => headlineFromSearch(search), [search])
  const source = focus ? `focus-${focus.id}` : 'focus-hub'

  useEffect(() => {
    const title = focus ? `${focus.navTitle} — Интеграм` : FOCUS_HUB.seoTitle
    document.title = title
    setMeta('meta[name="description"]', 'name', 'description', focus?.lead ?? FOCUS_HUB.metaDescription)
    setMeta('meta[property="og:title"]', 'property', 'og:title', title)
    let link = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')
    if (!link) {
      link = document.createElement('link')
      link.setAttribute('rel', 'canonical')
      document.head.appendChild(link)
    }
    link.setAttribute('href', `${FOCUS_SITE}/${FOCUS_PATH}.html`)
    if (focus) visitParams({ focus: focus.id })
  }, [focus])

  // Рекламная страница не индексируется (пререндер тоже несёт noindex); при уходе в SPA — значение из index.html.
  useEffect(() => {
    let robots = document.querySelector<HTMLMetaElement>('meta[name="robots"]')
    const created = !robots
    if (!robots) {
      robots = document.createElement('meta')
      robots.setAttribute('name', 'robots')
      document.head.appendChild(robots)
    }
    robots.setAttribute('content', 'noindex, nofollow')
    return () => {
      if (created) robots?.remove()
      else robots?.setAttribute('content', 'index, follow, max-image-preview:large, max-snippet:-1')
    }
  }, [])

  const onCalc = () => reachGoal('focus_calc', { focus: focus?.id ?? 'hub' })
  const contacts = (
    <p className="text-sm text-slate-500 dark:text-slate-400 mt-4 text-center">
      <a href={LOSS_PHONE.href} className="hover:underline">{LOSS_PHONE.text}</a> · <a href={`mailto:${LOSS_EMAIL}`} className="hover:underline">{LOSS_EMAIL}</a>
    </p>
  )

  if (!focus) {
    return (
      <div className="overflow-hidden">
        <section className="pt-28 pb-12 lg:pt-36 border-b border-slate-200 dark:border-slate-900">
          <div className={WRAP}>
            <p className="text-sm font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 mb-3">{FOCUS_HUB.kicker}</p>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight mb-5">{override ?? FOCUS_HUB.h1}</h1>
            <p className="text-lg text-slate-600 dark:text-slate-300 leading-relaxed mb-8">{FOCUS_HUB.lead}</p>
            <ul className="grid gap-3 sm:grid-cols-2">
              {FOCUS_LANDINGS.map((f) => (
                <li key={f.id}>
                  <Link to={`/${FOCUS_PATH}.html?f=${f.id}`} className={`${CARD} flex items-center justify-between gap-3 font-semibold hover:border-blue-400`}>
                    {f.navTitle} <ArrowRight size={16} className="shrink-0 text-blue-600" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
        <section id="lead" className={`${SECTION} scroll-mt-24`}>
          <div className={WRAP}>
            <h2 className={`${H2} text-center`}>Расскажите о задаче</h2>
            <LeadForm source={source} />
            {contacts}
          </div>
        </section>
      </div>
    )
  }

  return (
    <div className="overflow-hidden">
      <section className="pt-28 pb-12 lg:pt-36 lg:pb-14 border-b border-slate-200 dark:border-slate-900">
        <div className={WRAP}>
          <p className="text-sm font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 mb-3">{focus.kicker}</p>
          <motion.h1 initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
            className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight mb-5">
            {override ?? focus.h1}
          </motion.h1>
          {override && <p className="text-xl font-semibold text-slate-700 dark:text-slate-200 mb-3">{focus.h1}</p>}
          <p className="text-lg text-slate-600 dark:text-slate-300 leading-relaxed mb-8">{focus.lead}</p>
          <div className="flex flex-wrap gap-3">
            <a href="#lead" className={BTN}>Обсудить пилот <ArrowRight size={18} /></a>
            <a href="#case" className={BTN2}>Пример внедрения</a>
          </div>
        </div>
      </section>

      <section className={SECTION}>
        <div className={WRAP}>
          <h2 className={H2}>Знакомо?</h2>
          <div className="grid gap-6 md:grid-cols-3">
            {focus.pains.map((p) => (
              <div key={p.title} className={CARD}>
                <AlertTriangle size={18} className="text-amber-500 mb-3" />
                <h3 className="text-lg font-bold mb-2">{p.title}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{p.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className={SECTION}>
        <div className={WRAP}>
          <h2 className={H2}>Что собираем</h2>
          <ul className="grid gap-3 md:grid-cols-2">
            {focus.we.map((w) => (
              <li key={w} className="flex gap-3 items-start">
                <CheckCircle2 size={20} className="text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <span className="text-slate-700 dark:text-slate-300">{w}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section id="case" className={`${SECTION} scroll-mt-24 bg-slate-50/60 dark:bg-slate-900/30`}>
        <div className={WRAP}>
          <h2 className={H2}>Пример внедрения</h2>
          <div className={CARD}>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">{focus.case.segment}</p>
            <p className="text-lg text-slate-700 dark:text-slate-200 leading-relaxed">{focus.case.text}</p>
          </div>
        </div>
      </section>

      <section className={SECTION}>
        <div className={WRAP}>
          <h2 className={H2}>Что меряем на пилоте</h2>
          <div className="grid gap-6 md:grid-cols-3 mb-6">
            {focus.metrics.map((m) => (
              <div key={m} className={CARD}>
                <Gauge size={18} className="text-blue-600 dark:text-blue-400 mb-3" />
                <p className="font-semibold">{m}</p>
              </div>
            ))}
          </div>
          <p className="text-slate-600 dark:text-slate-300"><strong>Пилот принят, когда:</strong> {focus.check}</p>
        </div>
      </section>

      <section className={SECTION}>
        <div className={WRAP}>
          <h2 className={H2}>Как идёт работа</h2>
          <ol className="grid gap-4 md:grid-cols-2">
            {FOCUS_STEPS.map((s, i) => (
              <li key={s.title} className={`${CARD} flex gap-4`}>
                <span className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-bold flex items-center justify-center shrink-0">{i + 1}</span>
                <div>
                  <h3 className="font-bold mb-1">{s.title}</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{s.text}</p>
                </div>
              </li>
            ))}
          </ol>
          <p className="mt-6">
            <a href={FOCUS_CTA_URL} onClick={onCalc} className="inline-flex items-center gap-1.5 font-semibold text-blue-600 dark:text-blue-400 hover:underline">
              Посчитать, что заберёт автоматизация в вашей отрасли <ArrowRight size={16} />
            </a>
          </p>
        </div>
      </section>

      <section id="lead" className={`${SECTION} scroll-mt-24`}>
        <div className={WRAP}>
          <h2 className={`${H2} text-center`}>Обсудим пилот на ваших данных</h2>
          <LeadForm source={source} />
          {contacts}
        </div>
      </section>
    </div>
  )
}
