import {
  ArrowRight,
  Calculator,
  Check,
  Clock3,
  FileSpreadsheet,
  Globe,
  GraduationCap,
  Handshake,
  Laptop,
  LayoutDashboard,
  MessageSquare,
  MessagesSquare,
  Mic,
  Sparkles,
  Table2,
  Target,
  Users,
  Wallet,
  X,
} from 'lucide-react'
import { renderToStaticMarkup } from 'react-dom/server'
import { ADEPT, ANALYSIS_PRICE, CONTACT_TELEGRAM_URL, PARTNER, PRAKTIKUM, TARIFFS_URL } from '../content'
import { SITE_BASE } from '../site-base'
import { StaticPage } from './StaticPage'

const SKILL_ICONS = [FileSpreadsheet, MessagesSquare, Laptop]
const EQUIPMENT_ICONS = [Laptop, Globe, Mic]
const PREPARE_ICONS = [FileSpreadsheet, Target, Calculator]
const FACT_ICONS = [Clock3, FileSpreadsheet, Wallet]

// Палитра главной (Landing.tsx, issue #643): синий → фиолетовый, зелёный — за Excel.
const TONES = [
  'from-emerald-500 to-teal-500 shadow-emerald-500/30',
  'from-blue-500 to-indigo-500 shadow-blue-500/30',
  'from-violet-500 to-fuchsia-500 shadow-violet-500/30',
]
const FACT_TONES = ['bg-blue-100 text-blue-700', 'bg-emerald-100 text-emerald-700', 'bg-violet-100 text-violet-700']
/** Цвета отрезков часа — по одному на блок программы. */
const SEGMENT_TONES = [
  'bg-emerald-500',
  'bg-teal-500',
  'bg-blue-500',
  'bg-indigo-500',
  'bg-violet-500',
  'bg-fuchsia-500',
  'bg-pink-500',
]

/**
 * Адрес формы на главной с уже выбранным практикумом (см. Landing.tsx).
 * `from` уходит в заявку строкой «Страница» — так видно, что человек пришёл
 * со страницы практикума.
 */
export const PRAKTIKUM_FORM_HREF = `${SITE_BASE}?from=praktikum#praktikum`

/**
 * Страница практикума для новичков (issue #659).
 *
 * Главное, о чём просит задача, — порог вхождения: что человек должен уметь,
 * чтобы прийти. Он стоит первым блоком после первого экрана: новичок
 * закрывает страницу именно на вопросе «а я справлюсь?».
 *
 * Оформление — в языке главной (issue #679): цветной первый экран с
 * иллюстрацией, градиентные иконки, программа часа шкалой и таймлайном.
 * Иллюстрации — чистая разметка, без картинок: пререндер их не теряет.
 *
 * Как и остальные спутники, страница статическая: формы здесь нет, кнопка
 * ведёт на главную, где форма демонстрации открывается с выбранным
 * практикумом.
 *
 * Кампания на эту страницу платит за конверсию (issue #668), поэтому переход
 * к заявке — в два шага, как на главной: кнопки «Записаться на практикум»
 * только раскрывают блок, а целевая ссылка лежит в `<template>` и в разметке
 * не существует до первого клика. Цель `praktikum_click` шлёт встроенный
 * скрипт пререндера (scripts/prerender-site-excel.mjs) через ту же проверку
 * на человека, что и `signup_click`. Без JS кнопок нет — вместо них
 * `<noscript>` со ссылкой.
 *
 * Якоря `porog`, `programma`, `podgotovka`, `zapis` — адреса быстрых ссылок
 * Директа (scripts/direct-create-cpa-campaign.mjs), их не переименовывать.
 */
export function PraktikumPage() {
  return (
    <StaticPage
      breadcrumb={[{ href: SITE_BASE, title: 'Excel → приложение' }]}
      h1={PRAKTIKUM.title}
      lead={PRAKTIKUM.lead}
      hero={<PraktikumHero />}
      cta={<PraktikumCta />}
    >
      {/* Порог вхождения */}
      <section id="porog" className="scroll-mt-16 max-w-5xl mx-auto px-4 sm:px-6 py-14">
        <p className="text-sm font-bold uppercase tracking-widest text-gradient">Порог вхождения</p>
        <h2 className="mt-2 text-2xl sm:text-3xl font-extrabold tracking-tight">Что нужно уметь, чтобы прийти</h2>
        <p className="mt-3 text-slate-600 max-w-3xl leading-relaxed">
          Практикум рассчитан на тех, кто ведёт учёт в таблицах и ни разу не делал проект с ИИ.
          Хватит трёх вещей:
        </p>
        <div className="mt-8 grid gap-6 sm:grid-cols-3">
          {PRAKTIKUM.skills.map(({ title, body }, i) => {
            const Icon = SKILL_ICONS[i]
            return (
              <div
                key={title}
                className="relative rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-indigo-500/10"
              >
                <span className="absolute top-5 right-5 text-4xl font-extrabold text-slate-100">{i + 1}</span>
                <span
                  className={`relative w-11 h-11 rounded-xl bg-gradient-to-br text-white flex items-center justify-center shadow-lg ${TONES[i]}`}
                >
                  <Icon size={22} />
                </span>
                <h3 className="relative mt-4 font-semibold">{title}</h3>
                <p className="mt-2 text-slate-600 leading-relaxed text-sm">{body}</p>
              </div>
            )
          })}
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-50 to-teal-50/60 ring-1 ring-emerald-100 p-6 sm:p-8">
            <div className="absolute -top-16 -right-16 w-48 h-48 bg-emerald-300/30 blur-3xl rounded-full pointer-events-none" />
            <h3 className="relative text-sm font-bold uppercase tracking-widest text-emerald-700">Уметь не нужно</h3>
            <ul className="relative mt-5 space-y-3">
              {PRAKTIKUM.notNeeded.map(item => (
                <li key={item} className="flex items-start gap-3 text-slate-700">
                  <span className="shrink-0 mt-0.5 w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-sm shadow-emerald-500/40">
                    <Check size={14} strokeWidth={3} />
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-50 to-violet-50/70 ring-1 ring-blue-100 p-6 sm:p-8">
            <div className="absolute -bottom-16 -right-16 w-48 h-48 bg-violet-300/30 blur-3xl rounded-full pointer-events-none" />
            <h3 className="relative text-sm font-bold uppercase tracking-widest text-blue-700">Что должно быть под рукой</h3>
            <ul className="relative mt-5 space-y-3">
              {PRAKTIKUM.equipment.map((item, i) => {
                const Icon = EQUIPMENT_ICONS[i] ?? Laptop
                return (
                  <li key={item} className="flex items-start gap-3 text-slate-700">
                    <span className="shrink-0 w-8 h-8 rounded-lg bg-white text-blue-600 ring-1 ring-blue-100 flex items-center justify-center shadow-sm">
                      <Icon size={16} />
                    </span>
                    <span className="pt-1">{item}</span>
                  </li>
                )
              })}
            </ul>
          </div>
        </div>
      </section>

      {/* Программа */}
      <section id="programma" className="scroll-mt-16 bg-gradient-to-b from-slate-50 to-indigo-50/60 border-y border-slate-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-14">
          <p className="text-sm font-bold uppercase tracking-widest text-gradient">60 минут по шагам</p>
          <h2 className="mt-2 text-2xl sm:text-3xl font-extrabold tracking-tight">Программа часа</h2>
          <p className="mt-3 text-slate-600 max-w-3xl leading-relaxed">
            Приложение из вашей таблицы ИИ-агент собирает заранее — это та же демонстрация за ~45
            минут, она бесплатна. Сам час целиком уходит на разбор и работу в нём.
          </p>

          <HourBar className="mt-8" />

          <ol className="relative mt-10 space-y-4 before:absolute before:left-[1.4rem] before:top-3 before:bottom-3 before:w-0.5 before:bg-gradient-to-b before:from-emerald-400 before:via-blue-500 before:to-fuchsia-500 sm:before:left-[1.65rem]">
            {PRAKTIKUM.program.map((row, i) => (
              <li key={row.minutes} className="relative flex gap-4 sm:gap-6">
                <span
                  className={`relative z-10 shrink-0 w-12 h-12 sm:w-14 sm:h-14 rounded-2xl text-white flex flex-col items-center justify-center shadow-lg ring-4 ring-white ${SEGMENT_TONES[i % SEGMENT_TONES.length]}`}
                >
                  <span className="text-[11px] sm:text-xs font-bold leading-none tabular-nums">{row.minutes}</span>
                  <span className="mt-0.5 text-[9px] sm:text-[10px] opacity-80 leading-none">мин</span>
                </span>
                <div className="flex-1 grid gap-3 sm:grid-cols-[1fr_15rem] sm:gap-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition duration-300 hover:shadow-lg hover:shadow-indigo-500/10">
                  <div>
                    <h3 className="font-semibold text-slate-900">{row.title}</h3>
                    <p className="mt-1 text-slate-600 leading-relaxed text-sm">{row.body}</p>
                  </div>
                  <p className="self-start rounded-xl bg-violet-50 ring-1 ring-violet-100 px-3.5 py-2.5 text-sm text-violet-900">
                    <span className="block text-[11px] font-semibold uppercase tracking-wider text-violet-500">
                      У вас останется
                    </span>
                    {row.result}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Подготовка и шаги */}
      <section id="podgotovka" className="scroll-mt-16 max-w-5xl mx-auto px-4 sm:px-6 py-14 grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
          <h2 className="text-2xl font-extrabold tracking-tight">Как подготовиться</h2>
          <ul className="mt-6 space-y-4">
            {PRAKTIKUM.prepare.map((item, i) => {
              const Icon = PREPARE_ICONS[i] ?? Check
              return (
                <li key={item} className="flex items-start gap-4 text-slate-700">
                  <span
                    className={`shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br text-white flex items-center justify-center shadow-lg ${TONES[i % TONES.length]}`}
                  >
                    <Icon size={18} />
                  </span>
                  <span className="pt-2">{item}</span>
                </li>
              )
            })}
          </ul>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
          <h2 className="text-2xl font-extrabold tracking-tight">Как всё устроено</h2>
          <ol className="relative mt-6 space-y-4 before:absolute before:left-4 before:top-2 before:bottom-2 before:w-px before:bg-slate-200">
            {PRAKTIKUM.steps.map((step, i) => (
              <li key={step} className="relative flex items-start gap-4 text-slate-700">
                <span className="relative shrink-0 w-8 h-8 rounded-full bg-brand text-white text-sm font-bold flex items-center justify-center shadow-md shadow-indigo-500/30 ring-4 ring-white">
                  {i + 1}
                </span>
                <span className="pt-1">{step}</span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Что получите и чего не обещаем */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 pb-4 grid gap-6 lg:grid-cols-[1.15fr_1fr]">
        <div className="relative overflow-hidden rounded-3xl bg-brand text-white p-6 sm:p-8 shadow-xl shadow-indigo-600/20">
          <div className="absolute -top-20 -right-16 w-56 h-56 bg-fuchsia-400/40 blur-3xl rounded-full pointer-events-none" />
          <h2 className="relative text-xl font-extrabold">Что вы получите</h2>
          <ol className="relative mt-5 space-y-3">
            {PRAKTIKUM.gets.map((item, i) => (
              <li key={item} className="flex items-start gap-3">
                <span className="shrink-0 w-7 h-7 rounded-lg bg-white/15 ring-1 ring-white/25 text-sm font-bold flex items-center justify-center">
                  {i + 1}
                </span>
                <span className="pt-0.5 text-white/95">{item}</span>
              </li>
            ))}
          </ol>
        </div>
        <div className="rounded-3xl bg-slate-50 ring-1 ring-slate-200 p-6 sm:p-8">
          <h2 className="text-xl font-extrabold">Чего практикум не обещает</h2>
          <ul className="mt-5 space-y-3">
            {PRAKTIKUM.notPromised.map(item => (
              <li key={item} className="flex items-start gap-3 text-slate-700">
                <span className="shrink-0 mt-0.5 w-6 h-6 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center">
                  <X size={14} strokeWidth={3} />
                </span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Рекрутинг (issue #671): кто хочет сам вести такие часы или приводить заказчиков. */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 pt-8 grid gap-4 sm:grid-cols-2">
        <a
          href={`${SITE_BASE}${ADEPT.slug}/`}
          className="group flex items-start gap-4 rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-violet-300 hover:shadow-lg hover:shadow-violet-500/10"
        >
          <span className="shrink-0 w-10 h-10 rounded-xl bg-violet-100 text-violet-700 flex items-center justify-center">
            <GraduationCap size={20} />
          </span>
          <span className="text-slate-700 leading-relaxed">
            Хотите сами вести такие практикумы и учить других применять ИИ?{' '}
            <span className="text-blue-600 font-medium group-hover:underline">Станьте адептом</span> — обучение
            бесплатное.
          </span>
        </a>
        <a
          href={`${SITE_BASE}${PARTNER.slug}/`}
          className="group flex items-start gap-4 rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-emerald-300 hover:shadow-lg hover:shadow-emerald-500/10"
        >
          <span className="shrink-0 w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
            <Handshake size={20} />
          </span>
          <span className="text-slate-700 leading-relaxed">
            Знаете компании, которым это нужно?{' '}
            <span className="text-blue-600 font-medium group-hover:underline">Партнёрская программа</span> — 15–40% с
            выручки.
          </span>
        </a>
      </section>
    </StaticPage>
  )
}

/** Минуты блока программы: «15–30» → [15, 30]. */
function span(minutes: string): [number, number] {
  const [from, to] = minutes.split('–').map(Number)
  return [from, to]
}

/** Шкала часа: отрезок на каждый блок программы, ширина — его длительность. */
function HourBar({ className = '' }: { className?: string }) {
  return (
    <div aria-hidden="true" className={className}>
      <div className="flex h-3 rounded-full overflow-hidden ring-1 ring-white shadow-inner">
        {PRAKTIKUM.program.map((row, i) => {
          const [from, to] = span(row.minutes)
          return <span key={row.minutes} className={SEGMENT_TONES[i % SEGMENT_TONES.length]} style={{ width: `${((to - from) / 60) * 100}%` }} />
        })}
      </div>
      <div className="mt-2 hidden sm:flex text-[11px] text-slate-500">
        {PRAKTIKUM.program.map(row => {
          const [from, to] = span(row.minutes)
          return (
            <span key={row.minutes} className="truncate pr-1" style={{ width: `${((to - from) / 60) * 100}%` }}>
              {row.title}
            </span>
          )
        })}
      </div>
    </div>
  )
}

/**
 * Первый экран: бейдж, градиентный акцент в заголовке, кнопка и иллюстрация
 * справа — как на главной. Фон свой, по смыслу заголовка (issue #684,
 * вариант D): слева лист Excel — «на ваших данных», справа кольцо часа —
 * «за час». Текст заголовка — ровно `PRAKTIKUM.title`, акцент — его часть
 * после двоеточия.
 */
function PraktikumHero() {
  // «ИИ-проект» не рвём по дефису: U+2011 — неразрывный дефис
  const [head, accent] = PRAKTIKUM.title.replace(/ИИ-/g, 'ИИ\u2011').split(': ')
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-slate-50 to-white">
      <SheetBackdrop />
      <HourDial />
      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 pt-10 pb-16 sm:pb-20">
        <nav aria-label="Хлебные крошки" className="text-sm text-slate-500">
          <ol className="flex flex-wrap items-center gap-2">
            <li>
              <a href={SITE_BASE} className="hover:text-blue-600 hover:underline">
                Excel → приложение
              </a>
            </li>
          </ol>
        </nav>
        <div className="mt-8 grid gap-12 lg:grid-cols-[1.15fr_1fr] lg:items-center">
          <div>
            <p className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-violet-500/20 bg-white/80 backdrop-blur text-violet-700 text-sm font-medium shadow-sm">
              <Sparkles size={14} />
              Практикум для новичков · онлайн
            </p>
            <h1 className="mt-6 text-4xl sm:text-5xl font-extrabold tracking-tight leading-[1.1] text-balance">
              {accent ? (
                <>
                  {head}: <span className="text-gradient">{accent}</span>
                </>
              ) : (
                PRAKTIKUM.title
              )}
            </h1>
            <p className="mt-6 text-lg text-slate-600 leading-relaxed max-w-2xl">{PRAKTIKUM.lead}</p>
            <div className="mt-10 flex flex-wrap gap-4">
              <OpenButton />
              <a
                href="#programma"
                className="inline-flex items-center gap-2 px-7 py-4 rounded-xl border border-slate-300 bg-white/80 backdrop-blur text-slate-700 font-semibold text-lg hover:border-blue-500 hover:text-blue-600 transition-colors"
              >
                Программа часа
              </a>
            </div>
            <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-sm text-slate-700">
              {PRAKTIKUM.facts.map((fact, i) => {
                const Icon = FACT_ICONS[i] ?? Check
                return (
                  <li key={fact} className="inline-flex items-center gap-2">
                    <span className={`w-7 h-7 rounded-lg flex items-center justify-center ${FACT_TONES[i % FACT_TONES.length]}`}>
                      <Icon size={15} />
                    </span>
                    {fact}
                  </li>
                )
              })}
            </ul>
          </div>
          <PraktikumVisual />
        </div>
      </div>
    </section>
  )
}

const SHEET_COLUMNS = 'ABCDEFGHIJKLMN'.split('')
const SHEET_ROWS = 22
const CELL_W = 112
const CELL_H = 36
/** Отступы сетки под строку букв и колонку номеров, как у листа Excel. */
const SHEET_LEFT = 40
const SHEET_TOP = 28
/** Заполненные ячейки листа: [колонка, строка]. */
const SHEET_FILLED = [[1, 3], [2, 3], [3, 3], [1, 4], [3, 5], [2, 6], [1, 14], [2, 14], [3, 15], [1, 16], [2, 17]]
/** Выделенная ячейка с маркером заполнения. */
const SHEET_SELECTED = [4, 15]
const sheetFade = 'linear-gradient(100deg, #000 0%, rgba(0,0,0,.9) 40%, transparent 78%)'

/**
 * Фон «лист Excel»: буквы колонок, номера строк, несколько заполненных
 * ячеек и рамка выделения. К иллюстрации справа лист растворяется —
 * слева таблица, справа приложение. Сетка видна на всех ширинах, колонка
 * номеров строк — только от xl: уже она уходит под текст (поле там 16–24px).
 */
function SheetBackdrop() {
  const line = 'rgb(148 163 184 / .22)'
  const edge = 'rgb(148 163 184 / .35)'
  return (
    <div
      aria-hidden="true"
      className="absolute inset-0 pointer-events-none select-none"
      style={{ WebkitMaskImage: sheetFade, maskImage: sheetFade }}
    >
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `linear-gradient(to right, ${line} 1px, transparent 1px), linear-gradient(to bottom, ${line} 1px, transparent 1px)`,
          backgroundSize: `${CELL_W}px ${CELL_H}px`,
          backgroundPosition: `${SHEET_LEFT}px ${SHEET_TOP}px`,
        }}
      />
      <div
        className="absolute right-0 top-0 flex bg-slate-100/90 text-[11px] font-semibold text-slate-400"
        style={{ left: SHEET_LEFT, height: SHEET_TOP, borderBottom: `1px solid ${edge}` }}
      >
        {SHEET_COLUMNS.map(c => (
          <span key={c} className="shrink-0 flex items-center justify-center" style={{ width: CELL_W, borderRight: `1px solid ${line}` }}>
            {c}
          </span>
        ))}
      </div>
      <div
        className="hidden xl:block absolute left-0 bottom-0 bg-slate-100/90 text-[11px] font-semibold text-slate-400"
        style={{ top: SHEET_TOP, width: SHEET_LEFT, borderRight: `1px solid ${edge}` }}
      >
        {Array.from({ length: SHEET_ROWS }, (_, i) => (
          <div key={i} className="flex items-center justify-center" style={{ height: CELL_H, borderBottom: `1px solid ${line}` }}>
            {i + 1}
          </div>
        ))}
      </div>
      {SHEET_FILLED.map(([c, r]) => (
        <span
          key={`${c}-${r}`}
          className="absolute h-[7px] rounded bg-emerald-500/20"
          style={{ left: SHEET_LEFT + c * CELL_W + 10, top: SHEET_TOP + r * CELL_H + 14, width: 40 + ((c * 37 + r * 11) % 50) }}
        />
      ))}
      <span
        className="absolute border-2 border-emerald-500 bg-emerald-500/5"
        style={{ left: SHEET_LEFT + SHEET_SELECTED[0] * CELL_W, top: SHEET_TOP + SHEET_SELECTED[1] * CELL_H, width: CELL_W, height: CELL_H }}
      >
        <span className="absolute -right-1 -bottom-1 w-[7px] h-[7px] bg-emerald-500 border border-white" />
      </span>
    </div>
  )
}

/** Кольцо отрезком на блок программы, цвета — как у шкалы часа (SEGMENT_TONES). */
const DIAL_COLORS = ['#10b981', '#14b8a6', '#3b82f6', '#6366f1', '#8b5cf6', '#d946ef', '#ec4899']
const ring = (from: number, to: number) =>
  `radial-gradient(circle, transparent ${from}%, #000 ${from + 0.4}%, #000 ${to}%, transparent ${to + 0.4}%)`

/**
 * Фон «циферблат часа»: кольцо на 60 минут за окном встречи, отрезки — блоки
 * программы. Только на широком экране: уже иллюстрации рядом нет, и кольцо
 * легло бы под текст.
 */
function HourDial() {
  const conic = PRAKTIKUM.program
    .map((row, i) => {
      const [from, to] = span(row.minutes)
      const color = DIAL_COLORS[i % DIAL_COLORS.length]
      return `${color} ${from * 6}deg ${to * 6 - 1.2}deg, transparent ${to * 6 - 1.2}deg ${to * 6}deg`
    })
    .join(', ')
  return (
    <div
      aria-hidden="true"
      className="hidden lg:block absolute top-1/2 -right-[190px] w-[820px] h-[820px] -translate-y-[46%] pointer-events-none select-none"
    >
      <div
        className="absolute inset-0 rounded-full opacity-55"
        style={{ background: `conic-gradient(${conic})`, WebkitMask: ring(61, 66), mask: ring(61, 66) }}
      />
      {/* Деления: минутные и каждые пять минут */}
      <div
        className="absolute inset-0 rounded-full"
        style={{ background: 'repeating-conic-gradient(rgb(100 116 139 / .45) 0deg .4deg, transparent .4deg 6deg)', WebkitMask: ring(68.5, 71), mask: ring(68.5, 71) }}
      />
      <div
        className="absolute inset-0 rounded-full"
        style={{ background: 'repeating-conic-gradient(rgb(71 85 105 / .7) 0deg 1deg, transparent 1deg 30deg)', WebkitMask: ring(68.5, 73), mask: ring(68.5, 73) }}
      />
      <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle,rgb(139_92_246/.16),transparent_60%)]" />
    </div>
  )
}

const APP_ROWS = [
  { name: 'Партия 214', status: 'Новая', tone: 'bg-blue-100 text-blue-700' },
  { name: 'Партия 213', status: 'В работе', tone: 'bg-amber-100 text-amber-700' },
  { name: 'Партия 212', status: 'Готово', tone: 'bg-emerald-100 text-emerald-700' },
]

/**
 * Иллюстрация первого экрана: окно видеовстречи, в нём — приложение на
 * данных участника, внизу шкала часа. Чистая разметка, для скринридера
 * скрыта — смысл уже сказан заголовком.
 */
function PraktikumVisual() {
  return (
    <div aria-hidden="true" className="relative hidden sm:block select-none">
      <div className="rounded-3xl bg-slate-900 p-3 shadow-2xl shadow-indigo-900/30 ring-1 ring-slate-800">
        {/* Строка встречи */}
        <div className="flex items-center gap-2 px-2 pb-3 text-xs text-slate-300">
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400" /> идёт
          </span>
          <span className="font-semibold text-white">Практикум</span>
          <span className="ml-auto tabular-nums text-slate-400">00:34 / 60:00</span>
        </div>

        {/* Общий экран: приложение участника */}
        <div className="rounded-2xl bg-white overflow-hidden">
          <div className="flex items-center gap-1.5 px-4 py-2.5 border-b border-slate-100">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-400" />
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
            <span className="ml-3 text-xs font-semibold text-slate-700">Ваше приложение · Партии</span>
          </div>
          <div className="flex">
            <div className="w-10 shrink-0 bg-brand flex flex-col items-center gap-3 py-3 text-white/90">
              <LayoutDashboard size={15} />
              <Table2 size={15} />
              <Users size={15} />
            </div>
            <div className="flex-1 p-4 space-y-3">
              <div className="flex items-end gap-1.5 h-14">
                {[40, 62, 50, 78, 58, 90, 72].map((h, i) => (
                  <span key={i} className="flex-1 rounded-t-md bg-gradient-to-t from-blue-500 to-violet-400" style={{ height: `${h}%` }} />
                ))}
              </div>
              <ul className="space-y-1.5">
                {APP_ROWS.map(row => (
                  <li key={row.name} className="flex items-center justify-between rounded-lg bg-slate-50 px-2.5 py-1.5 text-[11px]">
                    <span className="font-medium text-slate-700">{row.name}</span>
                    <span className={`px-2 py-0.5 rounded-full font-semibold ${row.tone}`}>{row.status}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Участники */}
        <div className="mt-3 grid grid-cols-2 gap-3">
          <div className="flex items-center gap-2.5 rounded-xl bg-slate-800 px-3 py-2.5">
            <span className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-violet-500 text-white flex items-center justify-center">
              <GraduationCap size={16} />
            </span>
            <span className="text-xs">
              <span className="block font-semibold text-white">Ведущий</span>
              <span className="block text-slate-400">показывает модель</span>
            </span>
          </div>
          <div className="flex items-center gap-2.5 rounded-xl bg-slate-800 px-3 py-2.5 ring-2 ring-emerald-400/70">
            <span className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 text-white flex items-center justify-center">
              <Users size={16} />
            </span>
            <span className="text-xs">
              <span className="block font-semibold text-white">Вы</span>
              <span className="block text-slate-400">вносите запись</span>
            </span>
          </div>
        </div>
      </div>

      {/* Ваш файл — откуда всё взялось */}
      <div className="absolute -top-5 -left-4 lg:-left-8 rotate-[-4deg] inline-flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-white text-emerald-700 text-xs font-semibold shadow-xl shadow-emerald-900/10 ring-1 ring-emerald-100">
        <FileSpreadsheet size={15} /> ваш_учёт.xlsx
      </div>
      <div className="absolute -bottom-5 -right-3 rotate-[3deg] inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-brand text-white text-sm font-semibold shadow-xl shadow-violet-600/30">
        <Clock3 size={16} /> 1 час · {PRAKTIKUM.price}
      </div>
    </div>
  )
}

/** Первый шаг: раскрывает блок с целевой ссылкой. Без JS скрыта (`hidden`). */
function OpenButton({ className = '' }: { className?: string }) {
  return (
    <button type="button" data-pk-open="" hidden className={`btn-primary px-7 py-4 text-lg ${className}`}>
      Записаться на практикум
      <ArrowRight size={20} />
    </button>
  )
}

function PraktikumCta() {
  return (
    <section id="zapis" className="scroll-mt-16 max-w-5xl mx-auto px-4 sm:px-6 py-14">
      <div className="relative overflow-hidden rounded-3xl bg-slate-900 text-white p-6 sm:p-10 shadow-2xl shadow-indigo-900/30">
        <div className="absolute -top-24 -right-20 w-80 h-80 bg-violet-500/40 blur-[100px] rounded-full pointer-events-none" />
        <div className="absolute -bottom-28 -left-16 w-72 h-72 bg-blue-500/30 blur-[100px] rounded-full pointer-events-none" />
        <div className="relative">
          <p className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 ring-1 ring-white/15 text-violet-200 text-sm font-medium">
            <Sparkles size={14} />
            Час онлайн на вашем файле
          </p>
          <h2 className="mt-5 text-2xl sm:text-4xl font-extrabold tracking-tight">Записаться на практикум</h2>
          <p className="mt-5 flex flex-wrap items-baseline gap-x-3">
            <span className="text-5xl sm:text-6xl font-extrabold tracking-tight bg-gradient-to-r from-sky-300 via-violet-300 to-fuchsia-300 bg-clip-text text-transparent">
              {PRAKTIKUM.price}
            </span>
            <span className="text-base font-medium text-slate-400">за час на вашем файле</span>
          </p>
          <p className="mt-5 text-slate-300 leading-relaxed max-w-2xl">
            Заявка — та же форма, что и для демонстрации: приложите файл и отметьте «практикум».
            Сейчас ничего платить не нужно. {PRAKTIKUM.payment}
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <OpenButton />
            <div id="pk-step2" className="w-full empty:hidden" />
            <template
              id="pk-step2-tpl"
              dangerouslySetInnerHTML={{
                __html: renderToStaticMarkup(
                  <div className="rounded-2xl bg-white text-slate-900 p-6 shadow-xl">
                    <p className="text-slate-700 leading-relaxed">
                      Дальше — форма на главной: практикум в ней уже отмечен, остаётся приложить файл и
                      оставить контакт. Платить сейчас не нужно.
                    </p>
                    <a href={PRAKTIKUM_FORM_HREF} data-pk-go="" className="mt-5 btn-primary px-7 py-4 text-lg">
                      Перейти к заявке
                      <ArrowRight size={20} />
                    </a>
                  </div>,
                ),
              }}
            />
            <noscript>
              <a href={PRAKTIKUM_FORM_HREF} className="btn-primary px-7 py-4 text-lg">
                Оставить заявку
              </a>
            </noscript>
            <a
              href={CONTACT_TELEGRAM_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-7 py-4 rounded-xl border border-white/20 bg-white/5 text-white font-semibold text-lg hover:border-white/40 hover:bg-white/10 transition-colors"
            >
              <MessageSquare size={18} />
              Спросить в телеграме
            </a>
          </div>
          <p className="mt-8 pt-6 border-t border-white/10 text-sm text-slate-400 leading-relaxed max-w-2xl">
            После часа решаете сами, идти ли дальше. Варианты продолжения: разбор процесса с техническим
            заданием — {ANALYSIS_PRICE}, пилот за две недели — от 93 750 ₽,{' '}
            <a href={TARIFFS_URL} className="text-sky-300 hover:underline">
              облако
            </a>{' '}
            — от 1 950 ₽/мес. Все цены —{' '}
            <a href={`${SITE_BASE}#ceny`} className="text-sky-300 hover:underline">
              на главной
            </a>
            .
          </p>
        </div>
      </div>
    </section>
  )
}
