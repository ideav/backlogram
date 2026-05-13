import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { BookOpen, ArrowRight, GitCompare, Search, X } from 'lucide-react'
import { knowledgeBaseArticles } from '../data/knowledgeBase'

const KB_SEO_TITLE = 'База знаний — Интеграм'
const KB_SEO_DESCRIPTION =
  'Серия разборов: когда Интеграм удобнее Google Sheets, Excel, Notion, Airtable и других инструментов. Сравнения сценариев, ограничений и отличий.'
const KB_SEO_KEYWORDS =
  'база знаний интеграм,сравнение инструментов,интеграм vs airtable,интеграм vs google sheets,интеграм vs excel,no-code база данных,конструктор приложений'

function setMetaTag(selector: string, attr: 'name' | 'property', key: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(selector)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, key)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}

function setCanonical(href: string) {
  let el = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')
  if (!el) {
    el = document.createElement('link')
    el.setAttribute('rel', 'canonical')
    document.head.appendChild(el)
  }
  el.setAttribute('href', href)
}

function matchesQuery(query: string, article: (typeof knowledgeBaseArticles)[number]): boolean {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean)
  const haystack = [article.title, article.shortTitle, article.compare, article.summary]
    .join(' ')
    .toLowerCase()
  return words.every((word) => haystack.includes(word))
}

export default function KnowledgeBase() {
  const [query, setQuery] = useState('')

  useEffect(() => {
    document.title = KB_SEO_TITLE

    setMetaTag('meta[name="description"]', 'name', 'description', KB_SEO_DESCRIPTION)
    setMetaTag('meta[name="keywords"]', 'name', 'keywords', KB_SEO_KEYWORDS)
    setMetaTag('meta[name="robots"]', 'name', 'robots', 'index, follow')

    setMetaTag('meta[property="og:type"]', 'property', 'og:type', 'website')
    setMetaTag('meta[property="og:title"]', 'property', 'og:title', KB_SEO_TITLE)
    setMetaTag('meta[property="og:description"]', 'property', 'og:description', KB_SEO_DESCRIPTION)
    setMetaTag('meta[property="og:site_name"]', 'property', 'og:site_name', 'Интеграм')
    setMetaTag('meta[property="og:locale"]', 'property', 'og:locale', 'ru_RU')

    setMetaTag('meta[name="twitter:card"]', 'name', 'twitter:card', 'summary')
    setMetaTag('meta[name="twitter:title"]', 'name', 'twitter:title', KB_SEO_TITLE)
    setMetaTag(
      'meta[name="twitter:description"]',
      'name',
      'twitter:description',
      KB_SEO_DESCRIPTION,
    )

    const canonicalUrl =
      typeof window !== 'undefined'
        ? `${window.location.origin}/knowledge-base.html`
        : '/knowledge-base.html'
    setCanonical(canonicalUrl)
  }, [])

  const trimmed = query.trim()
  const filtered = trimmed
    ? knowledgeBaseArticles.filter((a) => matchesQuery(trimmed, a))
    : knowledgeBaseArticles

  return (
    <div className="overflow-hidden">
      <section className="pt-32 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-bold uppercase tracking-widest mb-6">
              <BookOpen size={14} /> База знаний
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
              Интеграм в сравнении с другими инструментами
            </h1>
            <p className="text-lg text-slate-500 dark:text-slate-400 leading-relaxed">
              Серия разборов сценариев, в которых Интеграм заменяет или дополняет
              распространённые инструменты — от Google Sheets до заказной разработки.
              Каждая статья описывает контекст, что Интеграм делает иначе, и где у него
              есть ограничения. Тексты основаны на{' '}
              <a
                href="https://github.com/ideav/crm/tree/main/docs/integram-article-reviews"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-blue-500 dark:hover:text-blue-400"
              >
                открытом плане серии обзоров
              </a>
              .
            </p>
          </div>
        </div>
      </section>

      <section className="pb-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8 max-w-md">
            <div className="relative">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none"
              />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Поиск по базе знаний…"
                aria-label="Поиск по базе знаний"
                className="w-full pl-9 pr-9 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-all"
              />
              {query && (
                <button
                  onClick={() => setQuery('')}
                  aria-label="Очистить поиск"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>

          {filtered.length === 0 ? (
            <p className="text-slate-500 dark:text-slate-400 text-sm py-8">
              По запросу «{trimmed}» статей не найдено.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map((article, i) => (
                <motion.div
                  key={article.slug}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: Math.min(i * 0.03, 0.3) }}
                >
                  <Link
                    to={`/knowledge-base/${article.slug}.html`}
                    className="group block h-full p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 hover:border-blue-500/40 hover:shadow-md dark:hover:shadow-none transition-all"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-xs font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
                        №&nbsp;{article.number}
                      </span>
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 dark:text-slate-400">
                        <GitCompare size={12} /> {article.compare}
                      </span>
                    </div>
                    <h2 className="text-lg font-bold mb-3 leading-snug text-slate-800 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {article.shortTitle}
                    </h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed mb-6">
                      {article.summary}
                    </p>
                    <span className="inline-flex items-center gap-1 text-sm font-semibold text-blue-500 group-hover:gap-2 transition-all">
                      Читать <ArrowRight size={14} />
                    </span>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="py-16 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-200 dark:border-slate-900">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">Хотите попробовать Интеграм?</h2>
          <p className="text-slate-500 dark:text-slate-400 mb-8">
            Зарегистрируйте бесплатный аккаунт и соберите свой первый процесс — таблицу,
            форму и отчёт — без программирования.
          </p>
          <a
            href="https://ideav.ru/start.html"
            target="start"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-all"
          >
            Начать <ArrowRight size={16} />
          </a>
        </div>
      </section>
    </div>
  )
}
