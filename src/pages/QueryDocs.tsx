import { useEffect, useRef } from 'react'
import { BarChart3 } from 'lucide-react'
import Breadcrumbs from '../components/Breadcrumbs'
import DocsSeeAlso from '../components/DocsSeeAlso'
import { Block, Inline } from './ApiDocs'
import { QUERY_META, QUERY_INTRO, QUERY_SECTIONS } from '../data/queryDocs'
import type { QuerySection } from '../data/queryDocs'

const SITE = 'https://ideav.ru'

/** Список разделов и тем со ссылками на якоря. */
function Toc({ onPick }: { onPick?: () => void }) {
  return (
    <ol className="space-y-3">
      {QUERY_SECTIONS.map((section: QuerySection) => (
        <li key={section.id}>
          <a href={`#${section.id}`} onClick={onPick} className="font-medium text-slate-700 dark:text-slate-200 hover:text-blue-500">{section.title}</a>
          <ul className="mt-1 space-y-1 pl-3 border-l border-slate-200 dark:border-slate-800">
            {section.topics.map((topic) => (
              <li key={topic.id}>
                <a href={`#${topic.id}`} onClick={onPick} className="text-slate-500 dark:text-slate-400 hover:text-blue-500">{topic.title}</a>
              </li>
            ))}
          </ul>
        </li>
      ))}
    </ol>
  )
}

/**
 * Запросы — страница /queries.html (backlogram#802): движок отчётов как
 * справочник разработчика — адрес, форматы, параметры, соединения, рекурсия.
 * Текст — из src/data/queryDocs.mjs, общего источника с пререндером
 * (scripts/prerender-queries.mjs).
 */
export default function QueryDocs() {
  const mobileToc = useRef<HTMLDetailsElement>(null)

  useEffect(() => {
    document.title = QUERY_META.title
    const canonical = `${SITE}${QUERY_META.path}`
    const ogImage = `${SITE}/og/queries.png`

    const setMetaTag = (selector: string, attr: 'name' | 'property', key: string, content: string) => {
      let el = document.head.querySelector<HTMLMetaElement>(selector)
      if (!el) { el = document.createElement('meta'); el.setAttribute(attr, key); document.head.appendChild(el) }
      el.setAttribute('content', content)
    }
    let link = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')
    if (!link) { link = document.createElement('link'); link.setAttribute('rel', 'canonical'); document.head.appendChild(link) }
    link.setAttribute('href', canonical)

    setMetaTag('meta[name="description"]', 'name', 'description', QUERY_META.description)
    setMetaTag('meta[name="keywords"]', 'name', 'keywords', QUERY_META.keywords)
    setMetaTag('meta[property="og:type"]', 'property', 'og:type', 'article')
    setMetaTag('meta[property="og:title"]', 'property', 'og:title', QUERY_META.title)
    setMetaTag('meta[property="og:description"]', 'property', 'og:description', QUERY_META.description)
    setMetaTag('meta[property="og:url"]', 'property', 'og:url', canonical)
    setMetaTag('meta[property="og:image"]', 'property', 'og:image', ogImage)
    setMetaTag('meta[property="og:site_name"]', 'property', 'og:site_name', 'Интеграм')
    setMetaTag('meta[property="og:locale"]', 'property', 'og:locale', 'ru_RU')
    setMetaTag('meta[name="twitter:card"]', 'name', 'twitter:card', 'summary_large_image')
    setMetaTag('meta[name="twitter:title"]', 'name', 'twitter:title', QUERY_META.title)
    setMetaTag('meta[name="twitter:description"]', 'name', 'twitter:description', QUERY_META.description)
    setMetaTag('meta[name="twitter:image"]', 'name', 'twitter:image', ogImage)

    // Пререндер кладёт текст в #root, React рисует поверх — якорь из адреса
    // теряется, прокручиваем к нему сами.
    const hash = decodeURIComponent(window.location.hash.slice(1))
    if (hash) document.getElementById(hash)?.scrollIntoView()
  }, [])

  return (
    // overflow-x-clip, а не overflow-hidden: hidden на предке ломает sticky у содержания.
    <div className="overflow-x-clip">
      <section className="pt-28 pb-10 lg:pt-36 lg:pb-12 border-b border-slate-200 dark:border-slate-900">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <Breadcrumbs
            items={[
              { name: 'Интеграм', to: '/' },
              { name: 'Запросы', to: QUERY_META.path },
            ]}
          />
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-blue-500/30 text-blue-600 dark:text-blue-400 text-sm font-medium mb-5">
            <BarChart3 size={14} />
            Для разработчиков
          </div>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight mb-5">{QUERY_META.h1}</h1>
          <div className="space-y-3 max-w-4xl">
            {QUERY_INTRO.map((p, i) => (
              <p key={i} className="text-lg text-slate-600 dark:text-slate-300 leading-relaxed"><Inline text={p} /></p>
            ))}
          </div>
          <DocsSeeAlso path={QUERY_META.path} />
        </div>
      </section>

      <section className="py-10 lg:py-14">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 lg:grid lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-10">
          {/* Телефон: свёрнутая полоса «Содержание» под шапкой (h-16), раскрывается списком. */}
          <details
            ref={mobileToc}
            className="lg:hidden sticky top-16 z-30 -mx-4 sm:-mx-6 mb-8 border-y border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-950/95 backdrop-blur-md"
          >
            <summary className="px-4 sm:px-6 py-3 text-sm font-semibold text-slate-700 dark:text-slate-200 cursor-pointer select-none">
              Содержание
            </summary>
            <nav aria-label="Содержание" className="px-4 sm:px-6 pb-4 max-h-[calc(100vh-9rem)] overflow-y-auto text-sm">
              <Toc onPick={() => mobileToc.current?.removeAttribute('open')} />
            </nav>
          </details>

          {/* Десктоп: колонка слева прилипает под шапкой и прокручивается сама. */}
          <nav aria-label="Содержание" className="hidden lg:block">
            <div className="sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto pb-6 text-sm">
              <div className="font-semibold text-slate-700 dark:text-slate-200 mb-3">Содержание</div>
              <Toc />
            </div>
          </nav>

          <div className="space-y-14 min-w-0">
            {QUERY_SECTIONS.map((section) => (
              <section key={section.id} id={section.id} className="scroll-mt-32 lg:scroll-mt-24">
                <h2 className="text-2xl md:text-3xl font-bold tracking-tight mb-6">{section.title}</h2>
                <div className="space-y-10">
                  {section.topics.map((topic) => (
                    <article key={topic.id} id={topic.id} className="scroll-mt-32 lg:scroll-mt-24 space-y-4">
                      <h3 className="text-xl font-semibold">{topic.title}</h3>
                      {topic.blocks.map((block, i) => <Block key={i} block={block} />)}
                    </article>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
