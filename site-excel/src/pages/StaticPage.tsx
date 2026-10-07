import type { ReactNode } from 'react'
import { ArrowRight, MessageSquare } from 'lucide-react'
import { SiteFooter, SiteHeader } from '../Chrome'
import { TELEGRAM_BOT_URL } from '../content'
import { SITE_BASE } from '../site-base'

/**
 * Обвязка статических страниц домена (issue #626).
 *
 * Эти страницы собираются в HTML один раз, на этапе сборки
 * (`scripts/prerender-site-excel.mjs`), и отдаются без скрипта приложения —
 * иначе React смонтировал бы в `#root` лендинг и стёр содержимое. Значит,
 * ничего интерактивного здесь быть не может: только разметка и ссылки.
 *
 * Отсюда и форма конверсии: целевая кнопка кампании живёт на главной за
 * первым кликом (см. conversion.ts), и выносить её на страницу-спутник
 * нельзя — она обошла бы защиту от кликеров. Поэтому CTA здесь — обычная
 * ссылка на главную.
 *
 * `cta` заменяет нижний блок призыва, когда странице нужен свой: у практикума
 * (issue #659) кнопка ведёт на ту же форму, но с выбранным «практикумом».
 */
export function StaticPage({
  breadcrumb,
  h1,
  lead,
  children,
  cta,
  hero,
}: {
  breadcrumb: { href: string; title: string }[]
  h1: string
  lead: string
  children: ReactNode
  cta?: ReactNode
  /** Свой hero вместо стандартного (страницы рекрутинга, issue #671). */
  hero?: ReactNode
}) {
  return (
    <div className="min-h-screen bg-white text-slate-900">
      <SiteHeader homeHref={SITE_BASE} />

      <main>
        {hero ?? (
          <section className="bg-gradient-to-b from-blue-50 via-white to-white">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-10 pb-10">
              <nav aria-label="Хлебные крошки" className="text-sm text-slate-500">
                <ol className="flex flex-wrap items-center gap-2">
                  {breadcrumb.map((crumb, i) => (
                    <li key={crumb.href} className="flex items-center gap-2">
                      {i > 0 && <span aria-hidden="true">/</span>}
                      <a href={crumb.href} className="hover:text-blue-600 hover:underline">
                        {crumb.title}
                      </a>
                    </li>
                  ))}
                </ol>
              </nav>
              <h1 className="mt-5 text-3xl sm:text-4xl font-bold tracking-tight leading-tight">{h1}</h1>
              <p className="mt-5 text-lg text-slate-600 leading-relaxed max-w-3xl">{lead}</p>
            </div>
          </section>
        )}

        {children}

        {cta ?? (
          <section className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
            <div className="rounded-3xl border border-blue-500/30 bg-blue-50/60 p-6 sm:p-10">
              <h2 className="text-2xl sm:text-3xl font-bold">
                Пришлите свою таблицу — вернём приложение за 45 минут
              </h2>
              <p className="mt-4 text-slate-700 leading-relaxed max-w-2xl">
                Демонстрация бесплатна: приложение собирается на ваших данных, а не на демо-примере.
                Дальше можно остановиться или заказать разбор процесса с техническим заданием.
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <a
                  href={SITE_BASE}
                  className="inline-flex items-center gap-2 px-7 py-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-lg shadow-lg shadow-blue-600/20 transition-colors"
                >
                  Сделать приложение из моего Excel
                  <ArrowRight size={20} />
                </a>
                <a
                  href={TELEGRAM_BOT_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-7 py-4 rounded-xl border border-slate-300 bg-white text-slate-700 font-semibold text-lg hover:border-blue-500 hover:text-blue-600 transition-colors"
                >
                  <MessageSquare size={18} />
                  Прислать файл в телеграм
                </a>
              </div>
              <p className="mt-5 text-sm text-slate-500">
                Цены целиком —{' '}
                <a href={`${SITE_BASE}#ceny`} className="text-blue-600 hover:underline">
                  в блоке «Сколько стоит»
                </a>
                , частые вопросы —{' '}
                <a href={`${SITE_BASE}#voprosy`} className="text-blue-600 hover:underline">
                  там же на главной
                </a>
                .
              </p>
            </div>
          </section>
        )}
      </main>

      <SiteFooter />
    </div>
  )
}
