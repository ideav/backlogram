import { useEffect, useState } from 'react'
import { Check, Code2, Copy } from 'lucide-react'
import Breadcrumbs from '../components/Breadcrumbs'
import { API_META, API_INTRO, API_SECTIONS } from '../data/apiDocs'
import type { ApiBlock } from '../data/apiDocs'

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

const INLINE_CODE = 'px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[0.9em] font-mono text-slate-800 dark:text-slate-200'

/** Строка с фрагментами в обратных кавычках: `x` — код, остальное — текст. */
function Inline({ text }: { text: string }) {
  const parts = text.split('`')
  return (
    <>
      {parts.map((part, i) =>
        i % 2 === 1 ? <code key={i} className={INLINE_CODE}>{part}</code> : <span key={i}>{part}</span>,
      )}
    </>
  )
}

function CodeBlock({ code, label }: { code: string; label?: string }) {
  const [copied, setCopied] = useState(false)
  const copy = () => {
    navigator.clipboard?.writeText(code).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    }).catch(() => {})
  }
  return (
    <div>
      {label && <div className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">{label}</div>}
      <div className="relative">
        <pre className="rounded-xl bg-slate-900 text-slate-100 text-sm leading-relaxed p-4 pr-12 overflow-x-auto"><code>{code}</code></pre>
        <button
          type="button"
          onClick={copy}
          aria-label="Скопировать"
          className="absolute right-2 top-2 p-1.5 rounded-md bg-slate-800 text-slate-300 opacity-70 hover:opacity-100 transition-opacity"
        >
          {copied ? <Check size={14} /> : <Copy size={14} />}
        </button>
      </div>
    </div>
  )
}

function Block({ block }: { block: ApiBlock }) {
  switch (block.t) {
    case 'p':
      return <p className="text-slate-600 dark:text-slate-300 leading-relaxed"><Inline text={block.text} /></p>
    case 'note':
      return (
        <p className="rounded-xl border border-amber-500/30 bg-amber-50 dark:bg-amber-500/10 px-4 py-3 text-sm text-slate-700 dark:text-slate-200 leading-relaxed">
          <Inline text={block.text} />
        </p>
      )
    case 'list':
      return (
        <ul className="list-disc pl-6 space-y-1.5 text-slate-600 dark:text-slate-300 leading-relaxed">
          {block.items.map((item, i) => <li key={i}><Inline text={item} /></li>)}
        </ul>
      )
    case 'code':
      return <CodeBlock code={block.code} label={block.label} />
    case 'table':
      return (
        <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 dark:bg-slate-900/60">
              <tr>
                {block.head.map((h, i) => (
                  <th key={i} className="text-left font-semibold px-3 py-2 text-slate-700 dark:text-slate-200">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row, i) => (
                <tr key={i} className="border-t border-slate-200 dark:border-slate-800 align-top">
                  {row.map((cell, j) => (
                    <td key={j} className="px-3 py-2 text-slate-600 dark:text-slate-300"><Inline text={cell} /></td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )
  }
}

/**
 * Описание API Интеграма — страница /api.html. Команды ядра с примерами curl:
 * авторизация, структура, записи, пользователи, роли, доступы и запросы.
 * Текст — из src/data/apiDocs.mjs, общего источника с пререндером
 * (scripts/prerender-api.mjs).
 */
export default function ApiDocs() {
  useEffect(() => {
    document.title = API_META.title
    const canonical = `${SITE}${API_META.path}`
    const ogImage = `${SITE}/og/api.png`

    setMetaTag('meta[name="description"]', 'name', 'description', API_META.description)
    setMetaTag('meta[name="keywords"]', 'name', 'keywords', API_META.keywords)
    setMetaTag('meta[property="og:type"]', 'property', 'og:type', 'article')
    setMetaTag('meta[property="og:title"]', 'property', 'og:title', API_META.title)
    setMetaTag('meta[property="og:description"]', 'property', 'og:description', API_META.description)
    setMetaTag('meta[property="og:url"]', 'property', 'og:url', canonical)
    setMetaTag('meta[property="og:image"]', 'property', 'og:image', ogImage)
    setMetaTag('meta[property="og:site_name"]', 'property', 'og:site_name', 'Интеграм')
    setMetaTag('meta[property="og:locale"]', 'property', 'og:locale', 'ru_RU')
    setMetaTag('meta[name="twitter:card"]', 'name', 'twitter:card', 'summary_large_image')
    setMetaTag('meta[name="twitter:title"]', 'name', 'twitter:title', API_META.title)
    setMetaTag('meta[name="twitter:description"]', 'name', 'twitter:description', API_META.description)
    setMetaTag('meta[name="twitter:image"]', 'name', 'twitter:image', ogImage)
    setCanonical(canonical)

    // Пререндер кладёт текст в #root, React рисует поверх — якорь из адреса
    // теряется, прокручиваем к нему сами.
    const hash = decodeURIComponent(window.location.hash.slice(1))
    if (hash) document.getElementById(hash)?.scrollIntoView()
  }, [])

  return (
    <div className="overflow-hidden">
      <section className="pt-28 pb-10 lg:pt-36 lg:pb-12 border-b border-slate-200 dark:border-slate-900">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <Breadcrumbs
            items={[
              { name: 'Интеграм', to: '/' },
              { name: 'API', to: API_META.path },
            ]}
          />
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-blue-500/30 text-blue-600 dark:text-blue-400 text-sm font-medium mb-5">
            <Code2 size={14} />
            Для разработчиков
          </div>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight mb-5">{API_META.h1}</h1>
          <div className="space-y-3 max-w-4xl">
            {API_INTRO.map((p, i) => (
              <p key={i} className="text-lg text-slate-600 dark:text-slate-300 leading-relaxed"><Inline text={p} /></p>
            ))}
          </div>
        </div>
      </section>

      <section className="py-10 lg:py-14">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 lg:grid lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-10">
          <nav aria-label="Содержание" className="mb-10 lg:mb-0">
            <div className="lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto text-sm">
              <div className="font-semibold text-slate-700 dark:text-slate-200 mb-3">Содержание</div>
              <ol className="space-y-3">
                {API_SECTIONS.map(section => (
                  <li key={section.id}>
                    <a href={`#${section.id}`} className="font-medium text-slate-700 dark:text-slate-200 hover:text-blue-500">{section.title}</a>
                    <ul className="mt-1 space-y-1 pl-3 border-l border-slate-200 dark:border-slate-800">
                      {section.topics.map(topic => (
                        <li key={topic.id}>
                          <a href={`#${topic.id}`} className="text-slate-500 dark:text-slate-400 hover:text-blue-500">{topic.title}</a>
                        </li>
                      ))}
                    </ul>
                  </li>
                ))}
              </ol>
            </div>
          </nav>

          <div className="space-y-14 min-w-0">
            {API_SECTIONS.map(section => (
              <section key={section.id} id={section.id} className="scroll-mt-24">
                <h2 className="text-2xl md:text-3xl font-bold tracking-tight mb-6">{section.title}</h2>
                <div className="space-y-10">
                  {section.topics.map(topic => (
                    <article key={topic.id} id={topic.id} className="scroll-mt-24 space-y-4">
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
