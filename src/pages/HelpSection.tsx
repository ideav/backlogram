import { useEffect, useMemo, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { LifeBuoy } from 'lucide-react'
import Breadcrumbs from '../components/Breadcrumbs'
import { Inline } from './ApiDocs'
import { HELP_META, HELP_SECTIONS, HELP_ARTICLES } from '../data/helpCenter'
import { buildIndex } from '../lib/helpSearch'
import { humanDate } from '../lib/dates'
import NotFound from './NotFound'
import { Article, Toc, applyHelpMeta } from './HelpCenter'

/**
 * Раздел помощи — /help/<id>.html (backlogram#961): все приёмы раздела по шагам.
 * Хаб с ликбезом и консультантом — /help.html. Текст — src/data/helpCenter.mjs,
 * общий с пререндером (scripts/prerender-help.mjs).
 */
export default function HelpSection() {
  const { section = '' } = useParams<{ section: string }>()
  const s = HELP_SECTIONS.find((x) => x.id === section.replace(/\.html$/i, ''))
  const mobileToc = useRef<HTMLDetailsElement>(null)
  const index = useMemo(() => buildIndex(HELP_ARTICLES), [])

  useEffect(() => {
    if (!s) return
    applyHelpMeta({ path: s.path, title: s.pageTitle, description: s.description, ogImage: `/og/help-${s.id}.png` })
    // Пререндер кладёт текст в #root, React рисует поверх — якорь теряется, прокручиваем сами.
    const hash = decodeURIComponent(window.location.hash.slice(1))
    if (hash) document.getElementById(hash)?.scrollIntoView()
  }, [s])

  if (!s) return <NotFound />
  const others = HELP_SECTIONS.filter((x) => x.id !== s.id)

  return (
    <div className="overflow-x-clip">
      <section className="pt-28 pb-10 lg:pt-36 lg:pb-12 border-b border-slate-200 dark:border-slate-900">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <Breadcrumbs items={[{ name: 'Интеграм', to: '/' }, { name: 'Помощь', to: HELP_META.path }, { name: s.title, to: s.path }]} />
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-blue-500/30 text-blue-600 dark:text-blue-400 text-sm font-medium mb-5">
            <LifeBuoy size={14} /> {s.articles.length} приёмов по шагам · обновлено <time dateTime={HELP_META.updated}>{humanDate(HELP_META.updated)}</time>
          </div>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight mb-5">{s.title}</h1>
          <p className="text-lg text-slate-600 dark:text-slate-300 leading-relaxed max-w-4xl"><Inline text={s.lead} /></p>
          <p className="mt-5 text-sm text-slate-500 dark:text-slate-400">
            Другие разделы:{' '}
            {others.map((x, i) => (
              <span key={x.id}>{i > 0 && ' · '}<a href={x.path} className="text-blue-600 dark:text-blue-400 hover:underline">{x.title}</a></span>
            ))}
            {' · '}<a href={HELP_META.path} className="text-blue-600 dark:text-blue-400 hover:underline">консультант и поиск</a>
          </p>
        </div>
      </section>

      <section className="py-10 lg:py-14">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 lg:grid lg:grid-cols-[17rem_minmax(0,1fr)] lg:gap-10">
          <details ref={mobileToc} className="lg:hidden sticky top-16 z-30 -mx-4 sm:-mx-6 mb-8 border-y border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-950/95 backdrop-blur-md">
            <summary className="px-4 sm:px-6 py-3 text-sm font-semibold text-slate-700 dark:text-slate-200 cursor-pointer select-none">
              Оглавление и поиск
            </summary>
            <nav aria-label="Оглавление" className="px-4 sm:px-6 pb-4 max-h-[calc(100vh-9rem)] overflow-y-auto text-sm">
              <Toc index={index} openId={s.id} onPick={() => mobileToc.current?.removeAttribute('open')} />
            </nav>
          </details>

          <nav aria-label="Оглавление" className="hidden lg:block">
            <div className="sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto pb-6 text-sm">
              <div className="font-semibold text-slate-700 dark:text-slate-200 mb-3">Оглавление</div>
              <Toc index={index} openId={s.id} />
            </div>
          </nav>

          <div className="space-y-6 min-w-0">
            {s.articles.map((a) => <Article key={a.id} a={a} path={s.path} />)}
          </div>
        </div>
      </section>
    </div>
  )
}
