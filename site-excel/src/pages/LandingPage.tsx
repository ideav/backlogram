import { ArrowRight, FileSpreadsheet, LayoutDashboard, MessageSquare } from 'lucide-react'
import { SiteFooter, SiteHeader } from '../Chrome'
import { LANDING_FAQ_COMMON, PRICING_GROUPS, TELEGRAM_BOT_URL, type Landing } from '../content'
import { SITE_BASE } from '../site-base'

/**
 * Шаблон посадочной страницы под рекламу и поиск (issue #657).
 *
 * Блоки и их порядок — раздел 6 ТЗ: первый экран, было → стало, что соберёт
 * агент, формулы, роли, экраны, цены, вопросы, повторный CTA, соседние
 * страницы. Данные — `site-excel/landings/<slug>.json`.
 *
 * Как и остальные спутники, страница собирается пререндером без скрипта
 * приложения (см. StaticPage.tsx), поэтому формы здесь нет: кнопка ведёт на
 * форму главной и несёт `?from=<slug>` — так заявка помнит, с какой страницы
 * пришёл человек. UTM-метки к ссылке дописывает маленький встроенный скрипт
 * пререндера.
 */

/** Текст главной кнопки (раздел 3.3 ТЗ). Совпадает с CTA_LABEL в landings.mjs. */
export const LANDING_CTA = 'Прислать таблицу — получить демо бесплатно'

export type LandingLink = { href: string; title: string }

const wrap = 'max-w-5xl mx-auto px-4 sm:px-6'
const h2 = 'text-2xl sm:text-3xl font-extrabold tracking-tight'
const tableBox = 'mt-6 overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm'
const th = 'px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 bg-slate-50 border-b border-slate-200'
const td = 'px-4 py-3 align-top leading-relaxed'

function ctaHref(slug: string): string {
  return `${SITE_BASE}?from=${encodeURIComponent(slug)}`
}

function Cta({ slug }: { slug: string }) {
  return (
    <a href={ctaHref(slug)} data-cta="" className="btn-primary px-6 py-4 text-base sm:text-lg">
      {LANDING_CTA}
      <ArrowRight size={20} aria-hidden="true" />
    </a>
  )
}

function BeforeAfter({ tone, items }: { tone: 'before' | 'after'; items: string[] }) {
  const before = tone === 'before'
  const Icon = before ? FileSpreadsheet : LayoutDashboard
  return (
    <div
      className={`rounded-2xl p-5 sm:p-6 ${
        before ? 'bg-slate-100' : 'bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-500/20'
      }`}
    >
      <h3 className={`flex items-center gap-2 font-bold ${before ? 'text-slate-600' : 'text-emerald-800'}`}>
        <Icon size={18} aria-hidden="true" /> {before ? 'Было в Excel' : 'Стало в приложении'}
      </h3>
      <ul className="mt-4 space-y-3">
        {items.map(item => (
          <li key={item} className={`leading-relaxed ${before ? 'text-slate-700' : 'text-slate-800'}`}>
            {item}
          </li>
        ))}
      </ul>
    </div>
  )
}

/** Лестница цен (блок 8) — из тех же карточек, что «Сколько стоит» на главной. */
function priceLadder(): { label: string; price: string }[] {
  const rows = [{ label: 'Демонстрация на ваших файлах', price: 'бесплатно' }]
  for (const group of PRICING_GROUPS) {
    for (const plan of group.plans) {
      rows.push({ label: plan.title, price: `${plan.price} ₽${plan.unit ? ` ${plan.unit}` : ''}` })
    }
  }
  return rows
}

export function LandingPage({ page, related }: { page: Landing; related: LandingLink[] }) {
  const faq = [...page.faq, ...LANDING_FAQ_COMMON]
  return (
    <div className="min-h-screen bg-white text-slate-900">
      <SiteHeader homeHref={SITE_BASE} />

      <main>
        {/* 2. Первый экран: фон — сетка листа, а не декоративный градиент (раздел 10.2 ТЗ). */}
        <section className="bg-sheet border-b border-slate-200">
          <div className={`${wrap} pt-8 pb-12 sm:pt-10 sm:pb-16`}>
            <nav aria-label="Хлебные крошки" className="text-sm text-slate-600">
              <ol className="flex flex-wrap items-center gap-2">
                <li>
                  <a href={SITE_BASE} className="hover:text-blue-700 hover:underline">
                    Excel → приложение
                  </a>
                </li>
                <li aria-hidden="true">/</li>
                <li aria-current="page" className="text-slate-800">
                  {page.crumb}
                </li>
              </ol>
            </nav>
            <h1 className="mt-6 text-3xl sm:text-5xl font-extrabold tracking-tight leading-[1.1] max-w-4xl">
              {page.h1}
            </h1>
            <p className="mt-6 text-lg text-slate-700 leading-relaxed max-w-3xl">{page.lead}</p>
            <div className="mt-8">
              <Cta slug={page.slug} />
            </div>
            <p className="mt-5 text-sm text-slate-700">
              ~45 минут до демонстрации · данные хранятся в России · демонстрация бесплатна
            </p>
          </div>
        </section>

        {/* 3. Было → Стало */}
        <section className={`${wrap} py-12`}>
          <h2 className={h2}>Что изменится в работе</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-[1fr_auto_1fr] md:items-stretch">
            <BeforeAfter tone="before" items={page.was} />
            <div className="flex items-center justify-center text-blue-600" aria-hidden="true">
              <ArrowRight size={28} className="rotate-90 md:rotate-0" />
            </div>
            <BeforeAfter tone="after" items={page.now} />
          </div>
        </section>

        {/* 4. Что агент соберёт */}
        <section className={`${wrap} py-12`}>
          <h2 className={h2}>Что агент соберёт из вашей таблицы</h2>
          <p className="mt-3 text-slate-700 max-w-3xl">
            {page.buildNote ?? 'Типичная структура для такой задачи. Точный состав агент строит по вашим листам и колонкам.'}
          </p>
          <div className={tableBox}>
            <table className="w-full min-w-[36rem] text-left">
              <thead>
                <tr>
                  <th scope="col" className={`${th} w-1/3`}>
                    Что получится
                  </th>
                  <th scope="col" className={th}>
                    Из чего в вашем файле
                  </th>
                </tr>
              </thead>
              <tbody>
                {page.build.map(row => (
                  <tr key={row.what} className="border-t border-slate-100 first:border-t-0">
                    <th scope="row" className={`${td} font-semibold`}>
                      {row.what}
                    </th>
                    <td className={`${td} text-slate-700`}>{row.from}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* 5. Формулы и макросы — как преимущество (раздел 3.1 ТЗ). */}
        <section className="bg-slate-50 border-y border-slate-200">
          <div className={`${wrap} py-12`}>
            <h2 className={h2}>Формулы и макросы: логика остаётся, хаос уходит</h2>
            <p className="mt-3 text-slate-700 max-w-3xl leading-relaxed">
              {page.formulasLead ??
                'Мы не копируем хаос, а наводим порядок. Расчёт тот же, но хранится в одном месте, виден всем, не ломается от случайной правки и не уезжает вместе с уволившимся сотрудником. Результат проверяете на демонстрации, на своих цифрах.'}
            </p>
            <div className={tableBox}>
              <table className="w-full min-w-[36rem] text-left">
                <thead>
                  <tr>
                    <th scope="col" className={`${th} w-2/5`}>
                      В Excel (пример)
                    </th>
                    <th scope="col" className={th}>
                      В приложении
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {page.formulas.map(row => (
                    <tr key={row.excel} className="border-t border-slate-100 first:border-t-0">
                      <th scope="row" className={`${td} font-mono text-sm font-medium text-emerald-900 bg-emerald-50/60`}>
                        {row.excel}
                      </th>
                      <td className={`${td} text-slate-800`}>{row.app}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* 6. Кто что видит */}
        <section className={`${wrap} py-12`}>
          <h2 className={h2}>Кто что видит</h2>
          <p className="mt-3 text-slate-700 max-w-3xl">
            {page.rolesNote ?? 'Пример ролей. В вашем приложении они собираются под ваш процесс, доступ задаётся до уровня записей.'}
          </p>
          <div className={tableBox}>
            <table className="w-full min-w-[32rem] text-left">
              <thead>
                <tr>
                  <th scope="col" className={`${th} w-1/3`}>
                    Роль
                  </th>
                  <th scope="col" className={th}>
                    Что видит и что может
                  </th>
                </tr>
              </thead>
              <tbody>
                {page.roles.map(row => (
                  <tr key={row.role} className="border-t border-slate-100 first:border-t-0">
                    <th scope="row" className={`${td} font-semibold`}>
                      {row.role}
                    </th>
                    <td className={`${td} text-slate-700`}>{row.access}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {page.steps && (
          <section className="bg-slate-50 border-y border-slate-200">
            <div className={`${wrap} py-12`}>
              <h2 className={h2}>{page.stepsTitle ?? 'Как проходят 45 минут'}</h2>
              <ol className="mt-6 divide-y divide-slate-200 rounded-2xl border border-slate-200 bg-white">
                {page.steps.map((step, i) => (
                  <li key={step.title} className="grid grid-cols-[2.5rem_1fr] gap-3 p-5 sm:p-6">
                    <span className="text-2xl font-extrabold text-blue-700 leading-none" aria-hidden="true">
                      {i + 1}
                    </span>
                    <div>
                      <h3 className="font-semibold">{step.title}</h3>
                      <p className="mt-1 text-slate-700 leading-relaxed">{step.body}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </section>
        )}

        {/* 7. Экраны: только настоящие снимки с демо-данных, без заглушек. */}
        {page.screens && page.screens.length > 0 && (
          <section className={`${wrap} py-12`}>
            <h2 className={h2}>Что вы увидите на экране</h2>
            <div className="mt-6 grid gap-5 sm:grid-cols-3">
              {page.screens.map(shot => (
                <figure key={shot.src} className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
                  <img
                    src={SITE_BASE + shot.src}
                    alt={shot.alt}
                    width={1200}
                    height={750}
                    loading="lazy"
                    decoding="async"
                    className="w-full aspect-[8/5] object-cover object-left-top"
                  />
                  <figcaption className="px-4 py-3 text-sm text-slate-700">{shot.caption}</figcaption>
                </figure>
              ))}
            </div>
            <p className="mt-3 text-sm text-slate-600">Экраны сняты на демо-данных.</p>
          </section>
        )}

        {/* 8. Цены */}
        <section className={`${wrap} py-12`}>
          <h2 className={h2}>Сколько это стоит</h2>
          <ol className="mt-6 max-w-3xl divide-y divide-slate-200 rounded-2xl border border-slate-200">
            {priceLadder().map(row => (
              <li key={row.label} className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 px-5 py-3">
                <span className="text-slate-800">{row.label}</span>
                <span className="font-semibold whitespace-nowrap">{row.price}</span>
              </li>
            ))}
          </ol>
          <p className="mt-4 text-sm text-slate-700">
            Что входит в каждый шаг —{' '}
            <a href={`${SITE_BASE}#ceny`} className="text-blue-700 font-medium hover:underline">
              в блоке «Сколько стоит» на главной
            </a>
            .
          </p>
        </section>

        {/* 9. Вопросы и ответы: <details> работает без скрипта. */}
        <section className="bg-slate-50 border-y border-slate-200">
          <div className={`${wrap} py-12`}>
            <h2 className={h2}>Вопросы и ответы</h2>
            <div className="mt-6 max-w-3xl divide-y divide-slate-200 rounded-2xl border border-slate-200 bg-white">
              {faq.map(item => (
                <details key={item.q} className="group px-5 py-4">
                  <summary className="cursor-pointer font-semibold list-none flex items-start justify-between gap-4 focus-visible:outline-2 focus-visible:outline-blue-600 rounded">
                    {item.q}
                    <span aria-hidden="true" className="text-blue-700 transition-transform group-open:rotate-45">
                      +
                    </span>
                  </summary>
                  <p className="mt-3 text-slate-700 leading-relaxed">{item.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* 10. Повторный CTA */}
        <section className={`${wrap} py-12`}>
          <div className="rounded-3xl border border-blue-500/30 bg-blue-50/60 p-6 sm:p-10">
            <h2 className={h2}>Пришлите таблицу, по которой работаете сейчас</h2>
            <p className="mt-4 text-slate-700 leading-relaxed max-w-2xl">
              Форма на главной: прикрепите до 5 файлов по 10 МБ и опишите задачу своими словами. Файлы
              используются только для сборки демонстрации и ответа на заявку.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Cta slug={page.slug} />
              <a
                href={TELEGRAM_BOT_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-4 rounded-xl border border-slate-300 bg-white text-slate-800 font-semibold hover:border-blue-500 hover:text-blue-700 transition-colors"
              >
                <MessageSquare size={18} aria-hidden="true" />
                Большие файлы — в телеграм-бот
              </a>
            </div>
          </div>
        </section>

        {/* 11. Соседние страницы */}
        <section className={`${wrap} pb-14`}>
          <h2 className="text-xl sm:text-2xl font-bold">Что ещё посмотреть</h2>
          <ul className="mt-5 grid gap-3 sm:grid-cols-2">
            {related.map(link => (
              <li key={link.href}>
                <a
                  href={link.href}
                  className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 px-4 py-3 font-medium hover:border-blue-500 hover:text-blue-700 transition-colors"
                >
                  {link.title}
                  <ArrowRight size={16} aria-hidden="true" className="shrink-0" />
                </a>
              </li>
            ))}
          </ul>
        </section>
      </main>

      <SiteFooter />
    </div>
  )
}
