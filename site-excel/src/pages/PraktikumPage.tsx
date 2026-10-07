import { ArrowRight, Check, FileSpreadsheet, Laptop, MessageSquare, MessagesSquare, X } from 'lucide-react'
import { ANALYSIS_PRICE, CONTACT_TELEGRAM_URL, PRAKTIKUM, TARIFFS_URL } from '../content'
import { SITE_BASE } from '../site-base'
import { StaticPage } from './StaticPage'

const SKILL_ICONS = [FileSpreadsheet, MessagesSquare, Laptop]

/** Адрес формы на главной с уже выбранным практикумом (см. Landing.tsx). */
export const PRAKTIKUM_FORM_HREF = `${SITE_BASE}#praktikum`

/**
 * Страница практикума для новичков (issue #659).
 *
 * Главное, о чём просит задача, — порог вхождения: что человек должен уметь,
 * чтобы прийти. Он стоит первым блоком, сразу под заголовком: новичок
 * закрывает страницу именно на вопросе «а я справлюсь?».
 *
 * Как и остальные спутники, страница статическая: формы здесь нет, кнопка
 * ведёт на главную, где форма демонстрации открывается с выбранным
 * практикумом.
 */
export function PraktikumPage() {
  return (
    <StaticPage
      breadcrumb={[{ href: SITE_BASE, title: 'Excel → приложение' }]}
      h1={PRAKTIKUM.title}
      lead={PRAKTIKUM.lead}
      cta={<PraktikumCta />}
    >
      <section className="max-w-5xl mx-auto px-4 sm:px-6">
        <ul className="flex flex-wrap gap-3">
          {PRAKTIKUM.facts.map(fact => (
            <li key={fact} className="px-4 py-2 rounded-full bg-blue-50 text-blue-700 text-sm font-semibold">
              {fact}
            </li>
          ))}
        </ul>
        <a
          href={PRAKTIKUM_FORM_HREF}
          className="mt-6 inline-flex items-center gap-2 px-7 py-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-lg shadow-lg shadow-blue-600/20 transition-colors"
        >
          Записаться на практикум
          <ArrowRight size={20} />
        </a>
      </section>

      {/* Порог вхождения */}
      <section id="porog" className="scroll-mt-16 max-w-5xl mx-auto px-4 sm:px-6 py-12">
        <h2 className="text-2xl sm:text-3xl font-bold">Что нужно уметь, чтобы прийти</h2>
        <p className="mt-3 text-slate-600 max-w-3xl leading-relaxed">
          Практикум рассчитан на тех, кто ведёт учёт в таблицах и ни разу не делал проект с ИИ.
          Хватит трёх вещей:
        </p>
        <div className="mt-8 grid gap-6 sm:grid-cols-3">
          {PRAKTIKUM.skills.map(({ title, body }, i) => {
            const Icon = SKILL_ICONS[i]
            return (
              <div key={title} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <span className="w-11 h-11 rounded-xl bg-blue-600 text-white flex items-center justify-center">
                  <Icon size={22} />
                </span>
                <h3 className="mt-4 font-semibold">{title}</h3>
                <p className="mt-2 text-slate-600 leading-relaxed text-sm">{body}</p>
              </div>
            )
          })}
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <div className="rounded-3xl bg-emerald-50/80 border border-emerald-100 p-6 sm:p-8">
            <h3 className="text-sm font-bold uppercase tracking-widest text-emerald-700">Уметь не нужно</h3>
            <ul className="mt-5 space-y-3">
              {PRAKTIKUM.notNeeded.map(item => (
                <li key={item} className="flex items-start gap-3 text-slate-700">
                  <Check size={20} className="text-emerald-600 shrink-0 mt-0.5" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-3xl bg-slate-50 border border-slate-200 p-6 sm:p-8">
            <h3 className="text-sm font-bold uppercase tracking-widest text-slate-500">Что должно быть под рукой</h3>
            <ul className="mt-5 space-y-3">
              {PRAKTIKUM.equipment.map(item => (
                <li key={item} className="flex items-start gap-3 text-slate-700">
                  <Laptop size={20} className="text-blue-600 shrink-0 mt-0.5" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Программа */}
      <section className="bg-gradient-to-b from-slate-50 to-blue-50/50 border-y border-slate-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
          <h2 className="text-2xl sm:text-3xl font-bold">Программа часа</h2>
          <p className="mt-3 text-slate-600 max-w-3xl leading-relaxed">
            Приложение из вашей таблицы ИИ-агент собирает заранее — это та же бесплатная демонстрация
            за ~45 минут. Сам час целиком уходит на разбор и работу в нём.
          </p>
          <ol className="mt-8 space-y-3">
            {PRAKTIKUM.program.map(row => (
              <li
                key={row.minutes}
                className="grid gap-2 sm:gap-6 sm:grid-cols-[5.5rem_1fr_16rem] rounded-2xl border border-slate-200 bg-white p-5"
              >
                <p className="font-bold text-blue-600 tabular-nums">{row.minutes} мин</p>
                <div>
                  <h3 className="font-semibold">{row.title}</h3>
                  <p className="mt-1 text-slate-600 leading-relaxed text-sm">{row.body}</p>
                </div>
                <p className="text-sm text-slate-700">
                  <span className="block text-xs uppercase tracking-wider text-slate-400">У вас останется</span>
                  {row.result}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Подготовка и шаги */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 py-12 grid gap-10 lg:grid-cols-2">
        <div>
          <h2 className="text-2xl font-bold">Как подготовиться</h2>
          <ul className="mt-6 space-y-3">
            {PRAKTIKUM.prepare.map(item => (
              <li key={item} className="flex items-start gap-3 text-slate-700">
                <Check size={20} className="text-blue-600 shrink-0 mt-0.5" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h2 className="text-2xl font-bold">Как всё устроено</h2>
          <ol className="mt-6 space-y-4">
            {PRAKTIKUM.steps.map((step, i) => (
              <li key={step} className="flex items-start gap-4 text-slate-700">
                <span className="shrink-0 w-8 h-8 rounded-full bg-blue-600 text-white text-sm font-bold flex items-center justify-center">
                  {i + 1}
                </span>
                <span className="pt-1">{step}</span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Что получите и чего не обещаем */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 pb-4 grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-slate-200 p-6 sm:p-8">
          <h2 className="text-xl font-bold">Что вы получите</h2>
          <ol className="mt-5 space-y-3 list-decimal pl-5 text-slate-700">
            {PRAKTIKUM.gets.map(item => (
              <li key={item}>{item}</li>
            ))}
          </ol>
        </div>
        <div className="rounded-3xl border border-slate-200 p-6 sm:p-8">
          <h2 className="text-xl font-bold">Чего практикум не обещает</h2>
          <ul className="mt-5 space-y-3">
            {PRAKTIKUM.notPromised.map(item => (
              <li key={item} className="flex items-start gap-3 text-slate-700">
                <X size={20} className="text-slate-400 shrink-0 mt-0.5" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </StaticPage>
  )
}

function PraktikumCta() {
  return (
    <section className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
      <div className="rounded-3xl border border-blue-500/30 bg-blue-50/60 p-6 sm:p-10">
        <h2 className="text-2xl sm:text-3xl font-bold">Записаться на практикум</h2>
        <p className="mt-4 text-slate-700 leading-relaxed max-w-2xl">
          Заявка — та же форма, что и для демонстрации: приложите файл и отметьте «практикум».
          Дату и время согласуем после заявки. Практикум бесплатный.
        </p>
        <div className="mt-8 flex flex-wrap gap-4">
          <a
            href={PRAKTIKUM_FORM_HREF}
            className="inline-flex items-center gap-2 px-7 py-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-lg shadow-lg shadow-blue-600/20 transition-colors"
          >
            Оставить заявку
            <ArrowRight size={20} />
          </a>
          <a
            href={CONTACT_TELEGRAM_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-7 py-4 rounded-xl border border-slate-300 bg-white text-slate-700 font-semibold text-lg hover:border-blue-500 hover:text-blue-600 transition-colors"
          >
            <MessageSquare size={18} />
            Спросить в телеграме
          </a>
        </div>
        <p className="mt-6 text-sm text-slate-500 leading-relaxed max-w-2xl">
          После часа решаете сами, идти ли дальше. Варианты продолжения: разбор процесса с техническим
          заданием — {ANALYSIS_PRICE}, пилот за две недели — от 93 750 ₽,{' '}
          <a href={TARIFFS_URL} className="text-blue-600 hover:underline">
            облако
          </a>{' '}
          — от 1 950 ₽/мес. Все цены —{' '}
          <a href={`${SITE_BASE}#ceny`} className="text-blue-600 hover:underline">
            на главной
          </a>
          .
        </p>
      </div>
    </section>
  )
}
