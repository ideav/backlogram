import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'

export interface Crumb {
  /** Отображаемое имя звена. */
  name: string
  /** Абсолютный путь маршрута, напр. "/" или "/excel-to-app.html". */
  to: string
}

/**
 * Хлебные крошки для продуктовых лендингов (issue #477).
 *
 * Рендерит доступную навигационную цепочку «Интеграм / … / текущая страница».
 * Последнее звено — текущая страница (не ссылка, aria-current="page"); все
 * предыдущие — ссылки на родительские разделы.
 *
 * Структурированные данные (BreadcrumbList JSON-LD) для поисковиков живут в
 * пререндер-снапшоте страницы (scripts/prerender-*.mjs) — там же, где остальной
 * JSON-LD, — чтобы их видели и краулеры без JS (Яндекс). Здесь только видимая
 * навигация для пользователей и JS-краулеров, поэтому дублей разметки нет.
 */
export default function Breadcrumbs({
  items,
  className = '',
}: {
  items: Crumb[]
  className?: string
}) {
  return (
    <nav aria-label="Хлебные крошки" className={`mb-6 ${className}`}>
      <ol className="flex w-fit flex-wrap items-center gap-1.5 text-sm text-slate-400 dark:text-slate-500">
        {items.map((item, i) => {
          const isLast = i === items.length - 1
          return (
            <li key={item.to} className="flex items-center gap-1.5">
              {isLast ? (
                <span
                  aria-current="page"
                  className="font-medium text-slate-600 dark:text-slate-300"
                >
                  {item.name}
                </span>
              ) : (
                <>
                  <Link to={item.to} className="transition-colors hover:text-blue-500">
                    {item.name}
                  </Link>
                  <ChevronRight
                    size={14}
                    className="shrink-0 text-slate-300 dark:text-slate-600"
                    aria-hidden="true"
                  />
                </>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
