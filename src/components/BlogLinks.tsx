import { BookOpen, ArrowUpRight } from 'lucide-react'

// Перелинковка продуктовых страниц ideav.ru на релевантные статьи блога
// blog.ideav.ru (issue #483) — передаёт ссылочный вес на поддомен блога.
export interface BlogPostLink {
  /** Заголовок статьи (человекочитаемый). */
  title: string
  /** Слаг поста = имя файла в blog-v2/src/content/posts без .md. */
  slug: string
}

const BLOG_BASE = 'https://blog.ideav.ru/posts/'

export default function BlogLinks({
  posts,
  title = 'Читайте в блоге',
  subtitle = 'Разборы, кейсы и практика по теме — в блоге Интеграма',
}: {
  posts: BlogPostLink[]
  title?: string
  subtitle?: string
}) {
  if (!posts.length) return null
  return (
    <section className="py-16 border-t border-slate-200 dark:border-slate-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-3 mb-8">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-blue-500/30 text-blue-600 dark:text-blue-400 text-sm font-medium mb-3">
              <BookOpen size={14} /> Блог Интеграм
            </div>
            <h2 className="text-2xl md:text-3xl font-bold">{title}</h2>
            <p className="text-slate-500 dark:text-slate-400 mt-2">{subtitle}</p>
          </div>
          <a
            href="https://blog.ideav.ru/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600 dark:text-blue-400 hover:gap-2 transition-all"
          >
            Все статьи <ArrowUpRight size={15} />
          </a>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((p) => (
            <a
              key={p.slug}
              href={`${BLOG_BASE}${p.slug}/`}
              target="_blank"
              rel="noopener noreferrer"
              className="group p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 hover:border-blue-500/40 hover:shadow-sm transition-all flex flex-col"
            >
              <BookOpen size={18} className="text-blue-500 mb-3" />
              <span className="text-slate-700 dark:text-slate-200 font-semibold leading-snug flex-1">{p.title}</span>
              <span className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-blue-600 dark:text-blue-400">
                Читать <ArrowUpRight size={14} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </span>
            </a>
          ))}
        </div>
      </div>
    </section>
  )
}
