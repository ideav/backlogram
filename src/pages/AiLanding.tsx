import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, CheckCircle2, ExternalLink } from 'lucide-react'
import Breadcrumbs from '../components/Breadcrumbs'
import { AI_PAGES, AI_HUB, SITE, TRY_URL, PRICED_SERVICE_IDS, aiPageBySlug } from '../data/aiPages'
import type { AiSection } from '../data/aiPages'
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

const PRICED = PRICED_SERVICE_IDS
  .map((id) => SERVICES.find((s) => s.id === id))
  .filter((s): s is (typeof SERVICES)[number] => Boolean(s))

// #650: цвет шапки колонки по tones таблицы.
const TH_TONE: Record<string, string> = {
  bad: 'bg-red-50 text-red-700 dark:bg-red-950/50 dark:text-red-300',
  good: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300',
}

function Section({ s }: { s: AiSection }) {
  return (
    <section className="py-10">
      <h2 className="text-2xl md:text-3xl font-bold mb-4">{s.h2}</h2>
      {s.intro && <p className="text-slate-600 dark:text-slate-300 leading-relaxed mb-6 max-w-4xl">{s.intro}</p>}

      {s.table && (
        <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 mb-6">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 dark:bg-slate-900/60 text-slate-500 dark:text-slate-400 uppercase text-xs tracking-wider">
              <tr>{s.table.head.map((h, j) => <th key={h} className={`px-4 py-3 font-semibold ${TH_TONE[s.table?.tones?.[j] ?? ''] ?? ''}`}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {s.table.rows.map((row, i) => (
                <tr key={i} className="border-t border-slate-200 dark:border-slate-800 align-top">
                  {row.map((cell, j) => (
                    <td key={j} className={`px-4 py-3 leading-relaxed ${j === 0 ? 'font-semibold text-slate-800 dark:text-slate-100' : 'text-slate-600 dark:text-slate-300'}`}>
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {s.items && (s.ordered ? (
        <ol className="space-y-5 mb-6">
          {s.items.map((it, i) => (
            <li key={i} className="flex gap-4">
              <span className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center shrink-0">{i + 1}</span>
              <div>
                <h3 className="font-bold mb-1">{it.title}</h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">{it.body}</p>
              </div>
            </li>
          ))}
        </ol>
      ) : (
        <div className="grid md:grid-cols-2 gap-5 mb-6">
          {s.items.map((it, i) => (
            <div key={i} className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
              <h3 className="font-bold mb-2 flex items-center gap-2">
                <CheckCircle2 size={16} className="text-blue-500 shrink-0" /> {it.title}
              </h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">{it.body}</p>
            </div>
          ))}
        </div>
      ))}

      {s.pricing && (
        <div className="grid sm:grid-cols-2 gap-5 mb-6">
          {PRICED.map((p) => (
            <a key={p.id} href={`/uslugi.html#${p.id}`} className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-blue-400 transition-colors">
              <h3 className="font-bold mb-2">{p.name}</h3>
              <p className="text-2xl font-black">
                {p.priceFrom ? 'от ' : ''}{formatPrice(p.price)} <span className="text-base text-slate-400">{p.unit}</span>
              </p>
            </a>
          ))}
        </div>
      )}

      {s.paragraphs?.map((p, i) => (
        <p key={i} className="text-slate-600 dark:text-slate-300 leading-relaxed mb-4 max-w-4xl">{p}</p>
      ))}

      {s.link && (
        <Link to={s.link.href} className="inline-flex items-center gap-2 text-blue-600 dark:text-blue-400 font-semibold hover:underline">
          {s.link.text} <ArrowRight size={16} />
        </Link>
      )}
    </section>
  )
}

/**
 * Кластер «автоматизация бизнеса с ИИ» (issue #642) — шесть страниц из
 * src/data/aiPages.mjs. Тот же источник читает scripts/prerender-ai-pages.mjs,
 * поэтому H1, тексты и FAQ в сыром HTML совпадают с отрендеренным DOM.
 */
export default function AiLanding({ slug }: { slug: string }) {
  const page = aiPageBySlug(slug)

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

  const crumbs = [{ name: 'Интеграм', to: '/' }]
  if (page.slug !== AI_HUB.slug) crumbs.push({ name: AI_HUB.navName, to: `/${AI_HUB.slug}.html` })
  crumbs.push({ name: page.navName, to: `/${page.slug}.html` })
  // #648: хаб ведёт на все разделы карточками, раздел — на хаб ссылкой наверху,
  // а «Ещё по теме» у раздела — только соседние разделы.
  const isHub = page.slug === AI_HUB.slug
  const spokes = AI_PAGES.filter((p) => p.slug !== AI_HUB.slug)
  const related = spokes.filter((p) => p.slug !== page.slug)

  return (
    <div className="overflow-hidden">
      <section className="pt-32 pb-6 lg:pt-40">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <Breadcrumbs items={crumbs} />
          {!isHub && (
            <Link to={`/${AI_HUB.slug}.html`} className="inline-flex items-center gap-1.5 mb-4 text-sm font-semibold text-blue-600 dark:text-blue-400 hover:underline">
              ← {AI_HUB.navName}: все разделы темы
            </Link>
          )}
          <p className="uppercase tracking-widest text-xs font-bold text-blue-500 mb-3">{page.badge}</p>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight mb-6">
            {page.h1} <span className="text-blue-600 dark:text-blue-400">{page.h1accent}</span>
          </h1>
          <p className="text-lg text-slate-500 dark:text-slate-400 leading-relaxed max-w-4xl">{page.lead}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a href={TRY_URL} className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl inline-flex items-center gap-2">
              Проверить на своём Excel <ExternalLink size={16} />
            </a>
            <a href="/uslugi.html#razbor-processa" className="px-6 py-3 border border-slate-300 dark:border-slate-700 font-bold rounded-xl inline-flex items-center gap-2">
              Заказать разбор процесса <ArrowRight size={16} />
            </a>
          </div>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {isHub && (
          <nav className="py-6" aria-label="Разделы темы">
            <h2 className="text-2xl md:text-3xl font-bold mb-6">Разделы темы</h2>
            <ul className="grid md:grid-cols-2 gap-4">
              {spokes.map((p) => (
                <li key={p.slug}>
                  <Link
                    to={`/${p.slug}.html`}
                    className="group block h-full p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 hover:border-blue-500/40 transition-colors"
                  >
                    <span className="flex items-center justify-between gap-3 font-bold text-slate-800 dark:text-slate-100 mb-2">
                      {p.navName}
                      <ArrowRight size={16} className="text-slate-300 dark:text-slate-600 group-hover:text-blue-500 flex-shrink-0" />
                    </span>
                    <span className="block text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{p.ogDescription}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        )}

        {page.sections.map((s) => <Section key={s.h2} s={s} />)}

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

        {page.sources && <p className="text-sm text-slate-400 dark:text-slate-500">{page.sources}</p>}

        <section className="my-12 p-8 rounded-3xl bg-blue-600 text-white">
          <h2 className="text-2xl md:text-3xl font-bold mb-3">Проверьте на своих данных</h2>
          <p className="text-blue-100 leading-relaxed mb-6 max-w-3xl">
            Загрузите Excel или выгрузку из учётной системы — ИИ-агент соберёт рабочее приложение,
            и все утверждения этой страницы можно проверить на своих таблицах.
          </p>
          <a href={TRY_URL} className="px-6 py-3 bg-white text-blue-700 font-bold rounded-xl inline-flex items-center gap-2">
            Открыть excel-to-app.ru <ExternalLink size={16} />
          </a>
        </section>

        <nav className="pb-16" aria-label="Ещё по теме">
          <h2 className="text-xl font-bold mb-4">Ещё по теме</h2>
          <ul className="grid sm:grid-cols-2 gap-3">
            {related.map((p) => (
              <li key={p.slug}>
                <Link to={`/${p.slug}.html`} className="text-blue-600 dark:text-blue-400 hover:underline">{p.navName}</Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </div>
  )
}
