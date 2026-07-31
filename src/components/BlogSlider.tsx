import React, { useCallback, useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react'
import { BLOG_URL, BLOG_POSTS } from '../data/blogPosts'

/**
 * Слайдер свежих статей блога на главной (issue #512).
 *
 * Данные — из src/data/blogPosts.mjs: блог живёт отдельной Astro-сборкой на
 * blog.ideav.ru, поэтому список статей запекается на этапе сборки скриптом
 * scripts/generate-blog-posts.mjs. Тот же модуль читает пререндер главной
 * (scripts/prerender-landing.mjs) — иначе краулеры карточек не увидят.
 *
 * Прокрутка — нативная (scroll-snap + свайп на тач-устройствах), стрелки лишь
 * сдвигают её на карточку и гаснут на краях: своей анимации нет, значит нечему
 * рассинхронизироваться с реальным положением ленты.
 */
export default function BlogSlider() {
  const trackRef = useRef<HTMLDivElement>(null)
  const [atStart, setAtStart] = useState(true)
  const [atEnd, setAtEnd] = useState(false)

  const syncEdges = useCallback(() => {
    const el = trackRef.current
    if (!el) return
    // 4px — запас на дробные значения scrollLeft при масштабировании страницы.
    setAtStart(el.scrollLeft <= 4)
    setAtEnd(el.scrollLeft + el.clientWidth >= el.scrollWidth - 4)
  }, [])

  useEffect(() => {
    syncEdges()
    window.addEventListener('resize', syncEdges)
    return () => window.removeEventListener('resize', syncEdges)
  }, [syncEdges])

  function scroll(dir: 'left' | 'right') {
    const el = trackRef.current
    if (!el) return
    const card = el.firstElementChild as HTMLElement | null
    // Шаг — ширина карточки с отступом (gap-6 = 24px), запасной вариант —
    // видимая ширина ленты, если карточек почему-то нет.
    const step = card ? card.offsetWidth + 24 : el.clientWidth
    el.scrollBy({ left: dir === 'left' ? -step : step, behavior: 'smooth' })
  }

  if (BLOG_POSTS.length === 0) return null

  return (
    <section id="blog" className="py-24 border-t border-slate-200 dark:border-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-6 mb-10">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold mb-3">Свежее в блоге</h2>
            <p className="text-slate-500 dark:text-slate-400 max-w-2xl">
              Разборы проектов, кейсы заказчиков и то, как устроена платформа изнутри
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Стрелки — только там, где нет свайпа: на тач-экранах лента листается пальцем. */}
            <div className="hidden md:flex items-center gap-2">
              <button
                type="button"
                onClick={() => scroll('left')}
                disabled={atStart}
                className="w-10 h-10 flex items-center justify-center rounded-full border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:border-blue-500/40 disabled:opacity-30 disabled:hover:text-slate-500 disabled:hover:border-slate-200 dark:disabled:hover:border-slate-800 disabled:cursor-default transition-all"
                aria-label="Предыдущие статьи"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                type="button"
                onClick={() => scroll('right')}
                disabled={atEnd}
                className="w-10 h-10 flex items-center justify-center rounded-full border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:border-blue-500/40 disabled:opacity-30 disabled:hover:text-slate-500 disabled:hover:border-slate-200 dark:disabled:hover:border-slate-800 disabled:cursor-default transition-all"
                aria-label="Следующие статьи"
              >
                <ChevronRight size={18} />
              </button>
            </div>

            <a
              href={`${BLOG_URL}/`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition-colors shadow-sm"
            >
              Перейти в блог <ArrowRight size={16} />
            </a>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <div
            ref={trackRef}
            onScroll={syncEdges}
            className="flex gap-6 overflow-x-auto scrollbar-none snap-x snap-mandatory pb-2 -mx-4 px-4 sm:mx-0 sm:px-0"
          >
            {BLOG_POSTS.map((post) => (
              <a
                key={post.slug}
                href={post.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group snap-start flex-shrink-0 w-[82%] sm:w-[48%] lg:w-[32%] flex flex-col bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden hover:border-blue-500/40 hover:shadow-md transition-all"
              >
                <div className="aspect-[16/9] overflow-hidden bg-slate-100 dark:bg-slate-900">
                  <img
                    src={post.image}
                    alt=""
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500"
                  />
                </div>
                <div className="flex flex-col flex-1 gap-3 p-5">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="px-2 py-0.5 rounded-full bg-blue-600/10 text-blue-600 dark:text-blue-400 font-semibold">
                      {post.category}
                    </span>
                    <time dateTime={post.date} className="text-slate-400 dark:text-slate-500">
                      {post.dateLabel}
                    </time>
                  </div>
                  <h3 className="text-lg font-bold leading-snug line-clamp-2 text-slate-800 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {post.title}
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-3 flex-1">
                    {post.description}
                  </p>
                  <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600 dark:text-blue-400">
                    Читать <ArrowRight size={15} className="group-hover:translate-x-0.5 transition-transform" />
                  </span>
                </div>
              </a>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  )
}
