import { useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  AlertTriangle,
  Target,
  GitCompare,
  ExternalLink,
  ListChecks,
  Info,
  Library,
} from 'lucide-react'
import {
  getArticleBySlug,
  knowledgeBaseArticles,
} from '../data/knowledgeBase'
import NotFound from './NotFound'

function setMeta(selector: string, attr: 'name' | 'property', key: string, content: string) {
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

export default function KnowledgeBaseArticle() {
  const { slug = '' } = useParams<{ slug: string }>()
  const normalizedSlug = slug.replace(/\.html$/i, '')
  const article = getArticleBySlug(normalizedSlug)

  useEffect(() => {
    if (!article) return
    const pageTitle = `${article.shortTitle} — База знаний — Интеграм`
    const description = article.summary
    const canonical = `${window.location.origin}/knowledge-base/${article.slug}.html`

    document.title = pageTitle
    setMeta('meta[name="description"]', 'name', 'description', description)
    setMeta('meta[property="og:title"]', 'property', 'og:title', pageTitle)
    setMeta('meta[property="og:description"]', 'property', 'og:description', description)
    setMeta('meta[property="og:type"]', 'property', 'og:type', 'article')
    setMeta('meta[property="og:url"]', 'property', 'og:url', canonical)
    setMeta('meta[name="twitter:card"]', 'name', 'twitter:card', 'summary_large_image')
    setMeta('meta[name="twitter:title"]', 'name', 'twitter:title', pageTitle)
    setMeta('meta[name="twitter:description"]', 'name', 'twitter:description', description)
    setCanonical(canonical)
  }, [article])

  if (!article) {
    return <NotFound />
  }

  const relatedArticles =
    article.relatedSlugs
      ?.map((s) => getArticleBySlug(s))
      .filter((a): a is NonNullable<typeof a> => Boolean(a)) ?? []

  const idx = knowledgeBaseArticles.findIndex((a) => a.slug === article.slug)
  const prev = idx > 0 ? knowledgeBaseArticles[idx - 1] : null
  const next = idx < knowledgeBaseArticles.length - 1 ? knowledgeBaseArticles[idx + 1] : null

  return (
    <div className="overflow-hidden">
      <article className="pt-28 pb-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link
            to="/knowledge-base.html"
            className="inline-flex items-center gap-1 text-sm text-slate-500 dark:text-slate-400 hover:text-blue-500 dark:hover:text-blue-400 mb-8 transition-colors"
          >
            <ArrowLeft size={14} /> Все статьи базы знаний
          </Link>

          <motion.header
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-12"
          >
            <div className="flex items-center gap-3 mb-5 flex-wrap">
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-bold uppercase tracking-widest">
                <BookOpen size={14} /> Статья № {article.number}
              </span>
              <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 dark:text-slate-400">
                <GitCompare size={12} /> Сравнение: {article.compare}
              </span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold leading-tight mb-6">
              {article.title}
            </h1>
            <p className="text-lg text-slate-500 dark:text-slate-400 leading-relaxed">
              {article.summary}
            </p>
          </motion.header>

          <section className="mb-12">
            <h2 className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-4">
              <Target size={14} /> Контекст
            </h2>
            <p className="text-base text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">
              {article.context}
            </p>
          </section>

          {article.scenario && (
            <section className="mb-12">
              <h2 className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-4">
                <ListChecks size={14} /> Конкретный сценарий
              </h2>
              <p className="text-base text-slate-700 dark:text-slate-300 leading-relaxed mb-4">
                {article.scenario.intro}
              </p>
              <ul className="space-y-2 mb-4 pl-4">
                {article.scenario.symptoms.map((s, i) => (
                  <li
                    key={i}
                    className="relative pl-4 text-sm text-slate-700 dark:text-slate-300 leading-relaxed before:content-[''] before:absolute before:left-0 before:top-2.5 before:w-1.5 before:h-1.5 before:rounded-full before:bg-slate-400 dark:before:bg-slate-500"
                  >
                    {s}
                  </li>
                ))}
              </ul>
              {article.scenario.note && (
                <div className="flex gap-3 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40">
                  <span className="flex-shrink-0 mt-0.5 text-slate-500 dark:text-slate-400">
                    <Info size={16} />
                  </span>
                  <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                    {article.scenario.note}
                  </p>
                </div>
              )}
            </section>
          )}

          {article.integramScenario && (
            <section className="mb-12">
              <h2 className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-4">
                <CheckCircle2 size={14} /> Тот же сценарий в Интеграме
              </h2>
              <p className="text-base text-slate-700 dark:text-slate-300 leading-relaxed mb-4">
                {article.integramScenario.intro}
              </p>
              <ol className="space-y-3">
                {article.integramScenario.steps.map((step, i) => (
                  <li
                    key={i}
                    className="flex gap-3 text-sm text-slate-700 dark:text-slate-300 leading-relaxed"
                  >
                    <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-blue-500/10 text-xs font-bold text-blue-600 dark:text-blue-400">
                      {i + 1}
                    </span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            </section>
          )}

          <section className="mb-12">
            <h2 className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-4">
              <CheckCircle2 size={14} /> Что делает Интеграм иначе
            </h2>
            <ul className="space-y-4">
              {article.integramDifference.map((item, i) => (
                <li
                  key={i}
                  className="flex gap-3 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40"
                >
                  <span className="flex-shrink-0 mt-0.5 text-blue-500">
                    <CheckCircle2 size={18} />
                  </span>
                  <span className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                    {item}
                  </span>
                </li>
              ))}
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-4">
              <AlertTriangle size={14} /> Ограничения Интеграма в этом сценарии
            </h2>
            <div className="p-5 rounded-xl border border-amber-500/30 bg-amber-50/40 dark:bg-amber-900/10">
              <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                {article.limitations}
              </p>
              {article.limitationsList && (
                <ul className="space-y-2 mt-3">
                  {article.limitationsList.map((item, i) => (
                    <li
                      key={i}
                      className="flex gap-3 text-sm text-slate-700 dark:text-slate-300 leading-relaxed"
                    >
                      <span className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-amber-500" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              )}
              {article.limitationsNote && (
                <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed mt-4 pt-4 border-t border-amber-500/20">
                  {article.limitationsNote}
                </p>
              )}
            </div>
          </section>

          <section className="mb-12">
            <h2 className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-4">
              Вывод
            </h2>
            <div className="p-5 rounded-xl border border-blue-500/20 bg-blue-50/40 dark:bg-blue-900/10">
              <p className="text-base text-slate-700 dark:text-slate-300 leading-relaxed">
                {article.conclusion}
              </p>
            </div>
          </section>

          {relatedArticles.length > 0 && (
            <section className="mb-10">
              <h2 className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-4">
                <Library size={14} /> Смежные статьи
              </h2>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {relatedArticles.map((rel) => (
                  <li key={rel.slug}>
                    <Link
                      to={`/knowledge-base/${rel.slug}.html`}
                      className="group block h-full p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-blue-500/40 transition-all"
                    >
                      <div className="text-xs text-slate-400 dark:text-slate-500 mb-1">
                        №&nbsp;{rel.number} · {rel.compare}
                      </div>
                      <div className="text-sm font-semibold text-slate-700 dark:text-slate-300 group-hover:text-blue-500 transition-colors">
                        {rel.shortTitle}
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <div className="text-xs text-slate-400 dark:text-slate-500 italic">
            Полный исходный текст статьи с раскадровкой видео и фактчеком —{' '}
            <a
              href={article.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 underline hover:text-blue-500 dark:hover:text-blue-400 not-italic"
            >
              в репозитории ideav/crm <ExternalLink size={11} />
            </a>
            .
          </div>
        </div>
      </article>

      <nav className="border-t border-slate-200 dark:border-slate-900 py-10">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {prev ? (
            <Link
              to={`/knowledge-base/${prev.slug}.html`}
              className="group p-5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-blue-500/40 transition-all"
            >
              <div className="text-xs text-slate-400 dark:text-slate-500 mb-2 flex items-center gap-1">
                <ArrowLeft size={12} /> Предыдущая
              </div>
              <div className="text-sm font-semibold text-slate-700 dark:text-slate-300 group-hover:text-blue-500 transition-colors">
                {prev.shortTitle}
              </div>
            </Link>
          ) : (
            <div />
          )}
          {next ? (
            <Link
              to={`/knowledge-base/${next.slug}.html`}
              className="group p-5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-blue-500/40 transition-all text-right"
            >
              <div className="text-xs text-slate-400 dark:text-slate-500 mb-2 flex items-center justify-end gap-1">
                Следующая <ArrowRight size={12} />
              </div>
              <div className="text-sm font-semibold text-slate-700 dark:text-slate-300 group-hover:text-blue-500 transition-colors">
                {next.shortTitle}
              </div>
            </Link>
          ) : (
            <div />
          )}
        </div>
      </nav>
    </div>
  )
}
