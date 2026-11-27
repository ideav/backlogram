import { useEffect, useMemo, useState } from 'react'
import { BookA, Search } from 'lucide-react'
import Breadcrumbs from '../components/Breadcrumbs'
import {
  GLOSSARY_META,
  GLOSSARY_INTRO,
  GLOSSARY_GROUPS,
  GLOSSARY_TERMS,
  glossaryByLetter,
  glossaryMatches,
} from '../data/glossary'

const SITE = 'https://ideav.ru'

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

/** Текст определения: `код` в обратных кавычках — моноширинным. */
function Inline({ text }: { text: string }) {
  const parts = text.split(/(`[^`]+`)/g)
  return (
    <>
      {parts.map((p, i) =>
        p.startsWith('`') && p.endsWith('`') && p.length > 1
          ? <code key={i} className="px-1 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[0.9em]">{p.slice(1, -1)}</code>
          : <span key={i}>{p}</span>,
      )}
    </>
  )
}

const GROUP_TITLE = new Map(GLOSSARY_GROUPS.map((g) => [g.id, g.title]))

/**
 * Словарь терминов — страница /slovar-terminov.html (backlogram#1032).
 *
 * Собирает слова со всех страниц сайта: помощь (раньше словарик жил на
 * /help.html), справочник API, база знаний, лендинги и каталог решений
 * ideav.ru/solutions. Данные — src/data/glossary.mjs, общий источник с
 * пререндером (scripts/prerender-glossary.mjs).
 */
export default function Glossary() {
  const [query, setQuery] = useState('')
  const [group, setGroup] = useState('')

  useEffect(() => {
    document.title = GLOSSARY_META.title
    const canonical = `${SITE}${GLOSSARY_META.path}`
    const ogImage = `${SITE}/og/knowledge-base.png`
    setMetaTag('meta[name="description"]', 'name', 'description', GLOSSARY_META.description)
    setMetaTag('meta[name="keywords"]', 'name', 'keywords', GLOSSARY_META.keywords)
    setMetaTag('meta[property="og:type"]', 'property', 'og:type', 'article')
    setMetaTag('meta[property="og:title"]', 'property', 'og:title', GLOSSARY_META.title)
    setMetaTag('meta[property="og:description"]', 'property', 'og:description', GLOSSARY_META.description)
    setMetaTag('meta[property="og:url"]', 'property', 'og:url', canonical)
    setMetaTag('meta[property="og:image"]', 'property', 'og:image', ogImage)
    setMetaTag('meta[property="og:site_name"]', 'property', 'og:site_name', 'Интеграм')
    setMetaTag('meta[property="og:locale"]', 'property', 'og:locale', 'ru_RU')
    setMetaTag('meta[name="twitter:card"]', 'name', 'twitter:card', 'summary_large_image')
    setMetaTag('meta[name="twitter:title"]', 'name', 'twitter:title', GLOSSARY_META.title)
    setMetaTag('meta[name="twitter:description"]', 'name', 'twitter:description', GLOSSARY_META.description)
    setMetaTag('meta[name="twitter:image"]', 'name', 'twitter:image', ogImage)
    setCanonical(canonical)
  }, [])

  const letters = useMemo(() => {
    const picked = GLOSSARY_TERMS.filter((t) => (!group || t.group === group) && glossaryMatches(t, query))
    return glossaryByLetter(picked)
  }, [query, group])
  const found = letters.reduce((n, l) => n + l.terms.length, 0)

  return (
    <div className="overflow-hidden">
      <section className="pt-28 pb-10 lg:pt-36 lg:pb-12 border-b border-slate-200 dark:border-slate-900">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <Breadcrumbs
            items={[
              { name: 'Интеграм', to: '/' },
              { name: 'Помощь', to: '/help.html' },
              { name: 'Словарь терминов', to: GLOSSARY_META.path },
            ]}
          />
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-blue-500/30 text-blue-600 dark:text-blue-400 text-sm font-medium mb-5">
            <BookA size={14} />
            {GLOSSARY_TERMS.length} терминов
          </div>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight mb-5">
            Словарь <span className="text-blue-500">терминов</span>
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-300 leading-relaxed max-w-3xl">{GLOSSARY_INTRO}</p>
        </div>
      </section>

      <section className="py-10 lg:py-12">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <label className="relative flex-1">
              <span className="sr-only">Найти термин</span>
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Найти термин: реквизит, ERP, маска…"
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 pl-9 pr-3 py-2.5 text-base outline-none focus:border-blue-500"
              />
            </label>
            <label>
              <span className="sr-only">Тема</span>
              <select
                value={group}
                onChange={(e) => setGroup(e.target.value)}
                className="w-full sm:w-auto rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2.5 text-base"
              >
                <option value="">Все темы</option>
                {GLOSSARY_GROUPS.map((g) => <option key={g.id} value={g.id}>{g.title}</option>)}
              </select>
            </label>
          </div>

          <nav aria-label="Алфавитный указатель" className="flex flex-wrap gap-1.5 mb-8">
            {letters.map((l) => (
              <a key={l.letter} href={`#letter-${l.letter}`} className="min-w-8 text-center px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-800 text-sm font-medium hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400">
                {l.letter}
              </a>
            ))}
          </nav>

          {found === 0 && (
            <p className="text-slate-600 dark:text-slate-300">
              Такого слова в словаре нет. Спросите консультанта на <a href="/help.html" className="text-blue-500 underline underline-offset-2">странице помощи</a>.
            </p>
          )}

          <div className="space-y-10">
            {letters.map((l) => (
              <section key={l.letter} id={`letter-${l.letter}`} className="scroll-mt-28">
                <h2 className="text-2xl font-bold text-blue-500 mb-4">{l.letter}</h2>
                <dl className="grid gap-4 md:grid-cols-2">
                  {l.terms.map((t) => (
                    <div key={t.id} id={t.id} className="scroll-mt-28 rounded-2xl border border-slate-200 dark:border-slate-800 p-5">
                      <dt className="font-semibold text-slate-900 dark:text-slate-100">
                        <a href={`#${t.id}`} className="hover:text-blue-600 dark:hover:text-blue-400">{t.term}</a>
                        {t.aka && t.aka.length > 0 && (
                          <span className="font-normal text-sm text-slate-500 dark:text-slate-400"> · {t.aka.join(', ')}</span>
                        )}
                      </dt>
                      <dd className="mt-2 text-slate-600 dark:text-slate-300 leading-relaxed"><Inline text={t.text} /></dd>
                      <dd className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-sm">
                        <span className="text-slate-400">{GROUP_TITLE.get(t.group)}</span>
                        {(t.sources || []).slice(0, 3).map((s) => (
                          <a key={s.url} href={s.url} className="text-blue-500 hover:text-blue-600 underline underline-offset-2">{s.title}</a>
                        ))}
                      </dd>
                    </div>
                  ))}
                </dl>
              </section>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
