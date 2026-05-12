import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { BookOpen, ArrowRight, GitCompare } from 'lucide-react'
import { knowledgeBaseArticles } from '../data/knowledgeBase'

export default function KnowledgeBase() {
  useEffect(() => {
    document.title = 'База знаний — Интеграм'
  }, [])

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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {knowledgeBaseArticles.map((article, i) => (
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
