import { useEffect, useMemo, useRef, useState } from 'react'
import { LifeBuoy, MessageCircleQuestion, Search, Sparkles } from 'lucide-react'
import Breadcrumbs from '../components/Breadcrumbs'
import DocsSeeAlso from '../components/DocsSeeAlso'
import { Block, Inline } from './ApiDocs'
import { HELP_META, HELP_INTRO, HELP_SECTIONS, HELP_ARTICLES, HELP_SAMPLE_QUESTIONS } from '../data/helpCenter'
import type { HelpArticle, HelpFlatArticle } from '../data/helpCenter'
import { buildIndex, consult, search } from '../lib/helpSearch'
import type { HelpAnswer } from '../lib/helpSearch'

const SITE = 'https://ideav.ru'
const LEVEL: Record<string, string> = { start: 'в интерфейсе', pro: 'для разработчика' }

function Steps({ steps }: { steps?: string[] }) {
  if (!steps?.length) return null
  return (
    <ol className="list-decimal pl-6 space-y-1.5 text-slate-700 dark:text-slate-200 leading-relaxed">
      {steps.map((s, i) => <li key={i}><Inline text={s} /></li>)}
    </ol>
  )
}

/** Псевдо-ИИ-консультант: вопрос своими словами → ответ по шагам из базы помощи. */
function Consultant({ index }: { index: ReturnType<typeof buildIndex> }) {
  const [q, setQ] = useState('')
  const [asked, setAsked] = useState('')
  const [answer, setAnswer] = useState<HelpAnswer | null>(null)

  const ask = (text: string) => {
    const v = text.trim()
    if (!v) return
    setQ(v)
    setAsked(v)
    setAnswer(consult(index, v))
    const url = new URL(window.location.href)
    url.searchParams.set('q', v)
    url.hash = ''
    window.history.replaceState(null, '', url)
  }

  useEffect(() => {
    const initial = new URLSearchParams(window.location.search).get('q')
    if (initial) ask(initial)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const best = answer?.best
  return (
    <div id="consultant" className="mt-8 rounded-2xl border border-blue-500/30 bg-blue-50/60 dark:bg-blue-500/5 p-5 md:p-6 max-w-4xl scroll-mt-24">
      <div className="flex items-center gap-2 font-semibold text-slate-800 dark:text-slate-100 mb-3">
        <Sparkles size={18} className="text-blue-500" /> Консультант: опишите задачу своими словами
      </div>
      <form
        onSubmit={(e) => { e.preventDefault(); ask(q) }}
        className="flex flex-col sm:flex-row gap-2"
      >
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Например: чтобы менеджер видел только свои заявки"
          aria-label="Вопрос консультанту"
          className="flex-1 min-w-0 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-3 text-base outline-none focus:border-blue-500"
        />
        <button type="submit" className="rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium px-5 py-3">
          Спросить
        </button>
      </form>
      <div className="mt-3 flex flex-wrap gap-2">
        {HELP_SAMPLE_QUESTIONS.map((s) => (
          <button key={s} type="button" onClick={() => ask(s)}
            className="text-sm rounded-full border border-slate-300 dark:border-slate-700 px-3 py-1 text-slate-600 dark:text-slate-300 hover:border-blue-500 hover:text-blue-600">
            {s}
          </button>
        ))}
      </div>

      {answer && (
        <div className="mt-6 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 space-y-4" aria-live="polite">
          <div className="text-sm text-slate-500 dark:text-slate-400">Вы спросили: «{asked}»</div>
          {!best && (
            <p className="text-slate-700 dark:text-slate-200">
              Не нашёл подходящей статьи. Попробуйте другими словами — что хотите получить в итоге
              («отчёт», «права», «кнопка», «загрузить из Excel») — или откройте раздел в оглавлении ниже.
            </p>
          )}
          {best && (
            <>
              {!answer.confident && (
                <p className="text-sm text-amber-700 dark:text-amber-300">
                  Точного совпадения нет — вот самое близкое. Если не то, уточните вопрос.
                </p>
              )}
              <div>
                <div className="text-xs uppercase tracking-wider text-blue-600 dark:text-blue-400 font-semibold">{best.sectionTitle}</div>
                <h3 className="text-xl font-semibold mt-1">{best.title}</h3>
              </div>
              <p className="text-slate-700 dark:text-slate-200 leading-relaxed"><Inline text={best.summary} /></p>
              <Steps steps={best.steps} />
              <a href={`#${best.id}`} className="inline-block font-medium text-blue-600 dark:text-blue-400 hover:underline">
                Открыть статью целиком с примерами →
              </a>
              {answer.related.length > 0 && (
                <div className="pt-3 border-t border-slate-200 dark:border-slate-800">
                  <div className="text-sm font-semibold text-slate-600 dark:text-slate-300 mb-2">Ещё по теме</div>
                  <ul className="space-y-1">
                    {answer.related.map((r) => (
                      <li key={r.id}>
                        <button type="button" onClick={() => setAnswer({ best: r, related: answer.related.filter((x) => x.id !== r.id).concat(best), confident: true })}
                          className="text-left text-blue-600 dark:text-blue-400 hover:underline">
                          {r.title}
                        </button>
                        <span className="text-slate-400 text-sm"> · {r.sectionTitle}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}

/** Оглавление с обычным поиском по всем статьям. */
function Toc({ index, onPick }: { index: ReturnType<typeof buildIndex>; onPick?: () => void }) {
  const [q, setQ] = useState('')
  const hits = useMemo(() => (q.trim() ? search(index, q, 40) : null), [index, q])
  return (
    <div>
      <label className="relative block mb-4">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Поиск по статьям"
          aria-label="Поиск по статьям помощи"
          className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 pl-9 pr-3 py-2 text-sm outline-none focus:border-blue-500"
        />
      </label>
      {hits ? (
        hits.length ? (
          <ul className="space-y-1.5">
            {hits.map(({ article }) => (
              <li key={article.id}>
                <a href={`#${article.id}`} onClick={onPick} className="text-slate-600 dark:text-slate-300 hover:text-blue-500">{article.title}</a>
                <span className="block text-xs text-slate-400">{(article as HelpFlatArticle).sectionTitle}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-slate-500">Ничего не найдено — спросите консультанта выше.</p>
        )
      ) : (
        <ol className="space-y-3">
          <li><a href="#basics" onClick={onPick} className="font-medium text-slate-700 dark:text-slate-200 hover:text-blue-500">Что такое Интеграм</a></li>
          {HELP_SECTIONS.map((s) => (
            <li key={s.id}>
              <details>
                <summary className="cursor-pointer font-medium text-slate-700 dark:text-slate-200 hover:text-blue-500">
                  {s.title} <span className="text-slate-400 font-normal">({s.articles.length})</span>
                </summary>
                <ul className="mt-1 space-y-1 pl-3 border-l border-slate-200 dark:border-slate-800">
                  <li><a href={`#${s.id}`} onClick={onPick} className="text-slate-500 dark:text-slate-400 hover:text-blue-500">— к разделу</a></li>
                  {s.articles.map((a) => (
                    <li key={a.id}>
                      <a href={`#${a.id}`} onClick={onPick} className="text-slate-500 dark:text-slate-400 hover:text-blue-500">{a.title}</a>
                    </li>
                  ))}
                </ul>
              </details>
            </li>
          ))}
        </ol>
      )}
    </div>
  )
}

function Article({ a }: { a: HelpArticle }) {
  return (
    <article id={a.id} className="scroll-mt-32 lg:scroll-mt-24 space-y-4 rounded-2xl border border-slate-200 dark:border-slate-800 p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-xl font-semibold">{a.title}</h3>
        {a.level && <span className="text-xs rounded-full bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-slate-500 dark:text-slate-400">{LEVEL[a.level] ?? a.level}</span>}
      </div>
      <p className="text-slate-700 dark:text-slate-200 leading-relaxed"><Inline text={a.summary} /></p>
      <Steps steps={a.steps} />
      {a.blocks?.map((block, i) => <Block key={i} block={block} />)}
      {a.links?.length ? (
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Подробнее: {a.links.map((l, i) => (
            <span key={l.href}>{i > 0 && ' · '}<a href={l.href} className="text-blue-600 dark:text-blue-400 hover:underline">{l.text}</a></span>
          ))}
        </p>
      ) : null}
    </article>
  )
}

/**
 * Помощь — страница /help.html (backlogram#946, эпик ideav/crm#5603): ликбез,
 * консультант по базе приёмов, оглавление с поиском и все статьи по шагам.
 * Текст — из src/data/helpCenter.mjs, общего источника с пререндером
 * (scripts/prerender-help.mjs).
 */
export default function HelpCenter() {
  const mobileToc = useRef<HTMLDetailsElement>(null)
  const index = useMemo(() => buildIndex(HELP_ARTICLES), [])

  useEffect(() => {
    document.title = HELP_META.title
    const canonical = `${SITE}${HELP_META.path}`
    const ogImage = `${SITE}/og/help.png`
    const setMetaTag = (selector: string, attr: 'name' | 'property', key: string, content: string) => {
      let el = document.head.querySelector<HTMLMetaElement>(selector)
      if (!el) { el = document.createElement('meta'); el.setAttribute(attr, key); document.head.appendChild(el) }
      el.setAttribute('content', content)
    }
    let link = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')
    if (!link) { link = document.createElement('link'); link.setAttribute('rel', 'canonical'); document.head.appendChild(link) }
    link.setAttribute('href', canonical)
    setMetaTag('meta[name="description"]', 'name', 'description', HELP_META.description)
    setMetaTag('meta[name="keywords"]', 'name', 'keywords', HELP_META.keywords)
    setMetaTag('meta[property="og:type"]', 'property', 'og:type', 'article')
    setMetaTag('meta[property="og:title"]', 'property', 'og:title', HELP_META.title)
    setMetaTag('meta[property="og:description"]', 'property', 'og:description', HELP_META.description)
    setMetaTag('meta[property="og:url"]', 'property', 'og:url', canonical)
    setMetaTag('meta[property="og:image"]', 'property', 'og:image', ogImage)
    setMetaTag('meta[property="og:site_name"]', 'property', 'og:site_name', 'Интеграм')
    setMetaTag('meta[property="og:locale"]', 'property', 'og:locale', 'ru_RU')
    setMetaTag('meta[name="twitter:card"]', 'name', 'twitter:card', 'summary_large_image')
    setMetaTag('meta[name="twitter:title"]', 'name', 'twitter:title', HELP_META.title)
    setMetaTag('meta[name="twitter:description"]', 'name', 'twitter:description', HELP_META.description)
    setMetaTag('meta[name="twitter:image"]', 'name', 'twitter:image', ogImage)
    // Пререндер кладёт текст в #root, React рисует поверх — якорь теряется, прокручиваем сами.
    const hash = decodeURIComponent(window.location.hash.slice(1))
    if (hash) document.getElementById(hash)?.scrollIntoView()
  }, [])

  const total = HELP_ARTICLES.length

  return (
    // overflow-x-clip, а не overflow-hidden: hidden на предке ломает sticky у содержания.
    <div className="overflow-x-clip">
      <section className="pt-28 pb-10 lg:pt-36 lg:pb-12 border-b border-slate-200 dark:border-slate-900">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <Breadcrumbs items={[{ name: 'Интеграм', to: '/' }, { name: 'Помощь', to: HELP_META.path }]} />
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-blue-500/30 text-blue-600 dark:text-blue-400 text-sm font-medium mb-5">
            <LifeBuoy size={14} /> {total} приёмов по шагам
          </div>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight mb-5">{HELP_META.h1}</h1>
          <div className="space-y-3 max-w-4xl">
            {HELP_INTRO.lead.map((p, i) => (
              <p key={i} className="text-lg text-slate-600 dark:text-slate-300 leading-relaxed"><Inline text={p} /></p>
            ))}
          </div>
          <Consultant index={index} />
          <DocsSeeAlso path={HELP_META.path} />
        </div>
      </section>

      <section className="py-10 lg:py-14">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 lg:grid lg:grid-cols-[17rem_minmax(0,1fr)] lg:gap-10">
          <details ref={mobileToc} className="lg:hidden sticky top-16 z-30 -mx-4 sm:-mx-6 mb-8 border-y border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-950/95 backdrop-blur-md">
            <summary className="px-4 sm:px-6 py-3 text-sm font-semibold text-slate-700 dark:text-slate-200 cursor-pointer select-none">
              Оглавление и поиск
            </summary>
            <nav aria-label="Оглавление" className="px-4 sm:px-6 pb-4 max-h-[calc(100vh-9rem)] overflow-y-auto text-sm">
              <Toc index={index} onPick={() => mobileToc.current?.removeAttribute('open')} />
            </nav>
          </details>

          <nav aria-label="Оглавление" className="hidden lg:block">
            <div className="sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto pb-6 text-sm">
              <div className="font-semibold text-slate-700 dark:text-slate-200 mb-3">Оглавление</div>
              <Toc index={index} />
            </div>
          </nav>

          <div className="space-y-16 min-w-0">
            <section id="basics" className="scroll-mt-32 lg:scroll-mt-24">
              <h2 className="text-2xl md:text-3xl font-bold tracking-tight mb-6">Что такое Интеграм</h2>
              <div className="grid gap-5 md:grid-cols-2">
                {HELP_INTRO.blocks.map((b) => (
                  <div key={b.id} id={`basics-${b.id}`} className={`rounded-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-3 ${b.layers ? 'md:col-span-2' : ''}`}>
                    <h3 className="text-lg font-semibold">{b.title}</h3>
                    {b.paras?.map((p, i) => <p key={i} className="text-slate-600 dark:text-slate-300 leading-relaxed"><Inline text={p} /></p>)}
                    {b.layers && (
                      <dl className="grid gap-3 sm:grid-cols-2">
                        {b.layers.map((l) => (
                          <div key={l.name} className="rounded-xl bg-slate-50 dark:bg-slate-900/60 p-3">
                            <dt className="font-semibold text-slate-800 dark:text-slate-100">{l.name}</dt>
                            <dd className="text-sm text-slate-600 dark:text-slate-300 mt-1"><Inline text={l.text} /></dd>
                          </div>
                        ))}
                      </dl>
                    )}
                    {b.points && (
                      <ul className="list-disc pl-6 space-y-1.5 text-slate-600 dark:text-slate-300 leading-relaxed">
                        {b.points.map((p, i) => <li key={i}><Inline text={p} /></li>)}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
              <details className="mt-6 rounded-2xl border border-slate-200 dark:border-slate-800 p-5">
                <summary className="cursor-pointer font-semibold flex items-center gap-2"><MessageCircleQuestion size={16} /> Словарик терминов</summary>
                <dl className="mt-4 grid gap-3 sm:grid-cols-2">
                  {HELP_INTRO.glossary.map((g) => (
                    <div key={g.term}>
                      <dt className="font-medium text-slate-800 dark:text-slate-100">{g.term}</dt>
                      <dd className="text-sm text-slate-600 dark:text-slate-300"><Inline text={g.text} /></dd>
                    </div>
                  ))}
                </dl>
              </details>
            </section>

            {HELP_SECTIONS.map((s) => (
              <section key={s.id} id={s.id} className="scroll-mt-32 lg:scroll-mt-24">
                <h2 className="text-2xl md:text-3xl font-bold tracking-tight mb-3">{s.title}</h2>
                <p className="text-slate-600 dark:text-slate-300 mb-6 max-w-3xl"><Inline text={s.lead} /></p>
                <div className="space-y-6">
                  {s.articles.map((a) => <Article key={a.id} a={a} />)}
                </div>
              </section>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
