import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ArrowLeft, ArrowRight, Boxes, Database, ListChecks, Layers, Settings2,
  GitCompare, Wallet, Users, TrendingUp, Archive, BarChart3,
} from 'lucide-react'
import { HUB, USE_CASES } from '../data/usecases'

const SITE = 'https://ideav.ru'

const ICONS: Record<string, typeof Database> = {
  ListChecks, Layers, Settings2, Boxes, GitCompare, Wallet, Users, TrendingUp, Archive, BarChart3, Database,
}
function Icon({ name, size = 22 }: { name: string; size?: number }) {
  const Cmp = ICONS[name] ?? Boxes
  return <Cmp size={size} />
}

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

export default function UseCaseHub() {
  useEffect(() => {
    document.title = HUB.ogTitle
    const canonical = `${SITE}/${HUB.slug}.html`
    const ogImage = `${SITE}/og/knowledge-base.png`
    setMetaTag('meta[name="description"]', 'name', 'description', HUB.ogDescription)
    setMetaTag('meta[name="keywords"]', 'name', 'keywords', HUB.keywords)
    setMetaTag('meta[property="og:type"]', 'property', 'og:type', 'website')
    setMetaTag('meta[property="og:title"]', 'property', 'og:title', HUB.ogTitle)
    setMetaTag('meta[property="og:description"]', 'property', 'og:description', HUB.ogDescription)
    setMetaTag('meta[property="og:url"]', 'property', 'og:url', canonical)
    setMetaTag('meta[property="og:image"]', 'property', 'og:image', ogImage)
    setMetaTag('meta[property="og:site_name"]', 'property', 'og:site_name', 'Интеграм')
    setMetaTag('meta[property="og:locale"]', 'property', 'og:locale', 'ru_RU')
    setMetaTag('meta[name="twitter:card"]', 'name', 'twitter:card', 'summary_large_image')
    setMetaTag('meta[name="twitter:title"]', 'name', 'twitter:title', HUB.ogTitle)
    setMetaTag('meta[name="twitter:description"]', 'name', 'twitter:description', HUB.ogDescription)
    setMetaTag('meta[name="twitter:image"]', 'name', 'twitter:image', ogImage)
    setCanonical(canonical)
  }, [])

  return (
    <div className="overflow-hidden">
      <section className="pt-28 pb-12 lg:pt-36 lg:pb-16 border-b border-slate-200 dark:border-slate-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link to="/" className="flex w-fit items-center gap-1.5 text-sm text-slate-400 dark:text-slate-500 hover:text-blue-500 transition-colors mb-6">
            <ArrowLeft size={16} /> На главную
          </Link>
          <motion.h1 initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
            className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight mb-5">
            {HUB.h1} <span className="text-blue-500">{HUB.h1accent}</span>
          </motion.h1>
          <p className="text-lg text-slate-600 dark:text-slate-300 leading-relaxed">{HUB.lead}</p>
        </div>
      </section>

      <section className="py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid gap-5 md:grid-cols-2">
            {USE_CASES.map((u) => (
              <Link key={u.slug} to={`/${u.slug}.html`}
                className="group flex flex-col p-6 rounded-3xl border border-slate-200 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-600 bg-white dark:bg-slate-950 shadow-sm dark:shadow-none transition-colors">
                <div className="flex items-center gap-3 mb-3">
                  <span className="w-11 h-11 rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                    <Icon name={u.badgeIcon} size={22} />
                  </span>
                  <h2 className="text-lg font-bold leading-tight">{u.badge}</h2>
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed flex-1">{u.lead}</p>
                <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600 dark:text-blue-400">
                  Подробнее <ArrowRight size={15} className="group-hover:translate-x-0.5 transition-transform" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
