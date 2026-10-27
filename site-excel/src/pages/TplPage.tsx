import { ArrowRight, Download, ExternalLink } from 'lucide-react'
import { SiteFooter, SiteHeader } from '../Chrome'
import { PRIVACY_URL, type Landing } from '../content'
import { SITE_BASE } from '../site-base'

/**
 * Страница «нужна табличка» (issue #790, план docs/marketing/template-seekers-plan.md,
 * раздел 4): табель, приход-расход, журнал выдачи. Аудитория ищет готовую таблицу,
 * поэтому первым экраном идут файл и онлайн-версия, а не форма.
 *
 * Страница собирается пререндером, скрипта приложения на ней нет — как у
 * посадочных (LandingPage.tsx). Две вещи поэтому делает встроенный скрипт
 * пререндера `tplScript` (scripts/prerender-site-excel.mjs):
 *   • цели воронки `tpl_view`, `tpl_download`, `tpl_demo_open` и `lead` — по
 *     ним пилот из раздела 6 плана и сверяется;
 *   • отправка формы fetch'ем с показом ответа (без JS форма всё равно
 *     отправляется обычным POST на order.php, `kind=copy`).
 */

export type TplPageData = Pick<
  Landing,
  'slug' | 'title' | 'description' | 'h1' | 'lead' | 'crumb' | 'published' | 'updated' | 'faq'
> & {
  query: string
  /** Что лежит в .xlsx — колонки и листы (блок 3 раздела 4 плана). */
  inside: { what: string; note: string }[]
  /** Три строки боли из раздела 4.4 плана. */
  pains: string[]
  /** Ответ на боль: что меняет онлайн-версия. */
  onlineAnswer: string
  /** Обещание по сроку копии: «в течение часа в рабочее время» (решение 7.2 плана). */
  copyPromise: string
  /** Файл шаблона, путь от корня сайта: `/files/….xlsx`. */
  xlsx: string
  /** Онлайн-версия на ideav.ru. */
  demo: string
  /** Адреса соседних страниц: slug посадочной или путь вида `/keysy/atex/`. */
  related: string[]
}

/** Подпись соседней страницы — считает пререндер, у него есть карта всех адресов. */
export type TplPageLink = { href: string; title: string }

/** Вопрос формы «кто вы» (раздел 2 плана): квалификация без вопроса о деньгах. */
export const TPL_WHO_OPTIONS = ['Веду учёт сам', 'Руковожу отделом или бригадой', 'Владелец бизнеса']

const wrap = 'max-w-5xl mx-auto px-4 sm:px-6'
const h2 = 'text-2xl sm:text-3xl font-extrabold tracking-tight'
const tableBox = 'mt-6 overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm'
const th = 'px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 bg-slate-50 border-b border-slate-200'
const td = 'px-4 py-3 align-top leading-relaxed'

export function TplPage({ page, related }: { page: TplPageData; related: TplPageLink[] }) {
  return (
    <div className="min-h-screen bg-white text-slate-900">
      <SiteHeader homeHref={SITE_BASE} />

      <main>
        {/* 1. Первый экран: файл и онлайн-версия, никакой формы (разделы 3–4 плана). */}
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
            <div className="mt-8 flex flex-wrap gap-4">
              <a
                href={page.xlsx}
                download
                data-tpl-download=""
                className="btn-primary inline-flex items-center gap-2 px-6 py-4 text-base sm:text-lg"
              >
                <Download size={20} aria-hidden="true" />
                Скачать Excel
              </a>
              <a
                href={page.demo}
                target="_blank"
                rel="noopener noreferrer"
                data-tpl-demo=""
                className="inline-flex items-center gap-2 px-6 py-4 rounded-xl border border-slate-300 bg-white text-slate-800 font-semibold hover:border-blue-500 hover:text-blue-700 transition-colors text-base sm:text-lg"
              >
                Открыть онлайн-версию
                <ExternalLink size={20} aria-hidden="true" />
              </a>
            </div>
            <p className="mt-5 text-sm text-slate-700">
              Бесплатно и без формы · файл откроется в Excel или LibreOffice · онлайн-версия работает на ideav.ru — это
              наша платформа
            </p>
          </div>
        </section>

        {/* 2. Что внутри файла (раздел 4.3 плана): шаблон обязан быть честным. */}
        <section id="shablon" className={`${wrap} py-12`}>
          <h2 className={h2}>Что внутри шаблона</h2>
          <div className={tableBox}>
            <table className="w-full min-w-[32rem] text-left">
              <thead>
                <tr>
                  <th scope="col" className={`${th} w-1/3`}>
                    Лист или колонки
                  </th>
                  <th scope="col" className={th}>
                    Что с ними делать
                  </th>
                </tr>
              </thead>
              <tbody>
                {page.inside.map(row => (
                  <tr key={row.what} className="border-t border-slate-100 first:border-t-0">
                    <th scope="row" className={`${td} font-semibold`}>
                      {row.what}
                    </th>
                    <td className={`${td} text-slate-700`}>{row.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* 3. Боль и ответ — онлайн-версия (раздел 4.4 плана). */}
        <section id="onlayn" className="bg-slate-50 border-y border-slate-200">
          <div className={`${wrap} py-12`}>
            <h2 className={h2}>Когда Excel начинает мешать</h2>
            <ul className="mt-6 max-w-3xl space-y-3">
              {page.pains.map(pain => (
                <li key={pain} className="flex gap-3 leading-relaxed text-slate-800">
                  <span aria-hidden="true" className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-400" />
                  {pain}
                </li>
              ))}
            </ul>
            <p className="mt-6 max-w-3xl leading-relaxed text-slate-700">{page.onlineAnswer}</p>
            <div className="mt-8">
              <a
                href={page.demo}
                target="_blank"
                rel="noopener noreferrer"
                data-tpl-demo=""
                className="inline-flex items-center gap-2 px-6 py-4 rounded-xl border border-blue-500/40 bg-white text-blue-700 font-semibold hover:border-blue-600 transition-colors"
              >
                Открыть онлайн-версию
                <ExternalLink size={18} aria-hidden="true" />
              </a>
            </div>
          </div>
        </section>

        {/* 4. Своя копия: форма из двух полей и вопроса «кто вы» (раздел 4.5 плана). */}
        <section id="kopiya" className={`${wrap} py-12`}>
          <div className="rounded-3xl border border-emerald-500/30 bg-emerald-50/50 p-6 sm:p-10">
            <h2 className={h2}>Сделайте такой же для своей бригады или склада</h2>
            <p className="mt-4 max-w-2xl leading-relaxed text-slate-700">
              Скопируем демо-базу под вас: свои люди, свои материалы, доступ с телефона. {page.copyPromise}. Денег не
              просим и ничего не устанавливаем — пользуйтесь, пока удобно.
            </p>
            <form
              action={`${SITE_BASE}order.php`}
              method="post"
              data-tpl-form=""
              className="mt-8 grid max-w-2xl gap-4 sm:grid-cols-2"
            >
              {/* honeypot как у главной формы: живой человек поля не видит */}
              <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />
              <input type="hidden" name="kind" value="copy" />
              <input type="hidden" name="tpl" value={page.slug} />
              <input type="hidden" name="page" value={page.slug} />
              <input type="hidden" name="utm" value="" />
              <label className="block">
                <span className="text-sm font-semibold text-slate-700">Куда ответить</span>
                <input
                  type="text"
                  name="contact"
                  required
                  maxLength={200}
                  placeholder="телефон, телеграм или почта"
                  className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base focus:border-blue-500 focus:outline-none"
                />
              </label>
              <label className="block">
                <span className="text-sm font-semibold text-slate-700">Кто вы</span>
                <select
                  name="who"
                  className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base focus:border-blue-500 focus:outline-none"
                >
                  {TPL_WHO_OPTIONS.map(option => (
                    <option key={option}>{option}</option>
                  ))}
                </select>
              </label>
              <label className="sm:col-span-2 flex items-start gap-3 text-sm text-slate-700">
                <input type="checkbox" name="consent" required className="mt-1" />
                <span>
                  Даю согласие на обработку персональных данных на условиях{' '}
                  <a href={PRIVACY_URL} target="_blank" rel="noopener noreferrer" className="text-blue-700 hover:underline">
                    политики конфиденциальности
                  </a>
                  .
                </span>
              </label>
              <div className="sm:col-span-2 flex flex-wrap items-center gap-4">
                <button type="submit" className="btn-primary px-6 py-4 text-base">
                  Сделать копию шаблона
                  <ArrowRight size={20} aria-hidden="true" />
                </button>
                <p data-tpl-msg="" hidden className="text-sm font-medium text-emerald-800" role="status" />
              </div>
            </form>
          </div>
        </section>

        {/* 5. Вопросы и ответы: <details> работает без скрипта. */}
        <section id="faq" className="bg-slate-50 border-y border-slate-200">
          <div className={`${wrap} py-12`}>
            <h2 className={h2}>Вопросы и ответы</h2>
            <div className="mt-6 max-w-3xl divide-y divide-slate-200 rounded-2xl border border-slate-200 bg-white">
              {page.faq.map(item => (
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

        {/* 6. Мостик на главную (раздел 4.7 плана): для тех, кто ведёт в Excel ещё что-то. */}
        <section className={`${wrap} py-12`}>
          <div className="rounded-3xl border border-blue-500/30 bg-blue-50/60 p-6 sm:p-10">
            <h2 className="text-xl sm:text-2xl font-bold">Ведёте в Excel ещё что-то — заявки, смены, путевые листы?</h2>
            <p className="mt-4 max-w-2xl leading-relaxed text-slate-700">
              Соберём это в одно приложение из ваших же таблиц: формы вместо строк, права доступа и отчёты. Сначала
              покажем на ваших файлах, потом обсуждаем деньги.
            </p>
            <a
              href={`${SITE_BASE}?from=${encodeURIComponent(page.slug)}`}
              data-cta=""
              className="mt-8 inline-flex items-center gap-2 btn-primary px-6 py-4 text-base"
            >
              Прислать таблицу — получить демо бесплатно
              <ArrowRight size={20} aria-hidden="true" />
            </a>
          </div>
        </section>

        {/* 7. Соседние страницы: кольцо перелинковки, как у посадочных (issue #657). */}
        {related.length > 0 && (
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
        )}
      </main>

      <SiteFooter />
    </div>
  )
}
