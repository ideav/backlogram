import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Scale, RotateCcw, Copy, Printer, AlertTriangle } from 'lucide-react'
import Breadcrumbs from '../components/Breadcrumbs'
import {
  QUIZ_META,
  QUIZ_INTRO,
  QUIZ_SOURCES,
  QUIZ_FOOTER,
  QUESTIONS,
  VARIANTS,
  COMBO_SURCHARGE,
  SCALE_GOOD,
  SCALE_OK,
  points,
  hours,
  rescue,
  ceilings,
  worstHours,
  verdict,
  ballWord,
  hoursLabel,
  CROSS,
} from '../data/quintetsQuiz'
import type { QuizLink, QuizOption } from '../data/quintetsQuiz'

const SITE = 'https://ideav.ru'
const STORAGE_KEY = 'quintets-quiz-v5'

/** Цвета вариантов: квинтеты — зелёный, РСУБД — синий, комбинация — янтарный. */
const CHIP = [
  'bg-emerald-600 text-white',
  'bg-blue-600 text-white',
  'bg-amber-600 text-white',
]
const BAR = ['bg-emerald-600', 'bg-blue-600', 'bg-amber-600']

function setMetaTag(selector: string, attr: 'name' | 'property', key: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(selector)
  if (!el) { el = document.createElement('meta'); el.setAttribute(attr, key); document.head.appendChild(el) }
  el.setAttribute('content', content)
}
function setCanonical(href: string) {
  let el = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')
  if (!el) { el = document.createElement('link'); el.setAttribute('rel', 'canonical'); document.head.appendChild(el) }
  el.setAttribute('href', href)
}

/** Пояснение к ответу: `{link}` разворачивается в ссылку, остальное — как есть. */
function Note({ text, link }: { text: string; link?: QuizLink }) {
  if (!link) return <>{text}</>
  const [before, after = ''] = text.split('{link}')
  const cls = 'text-blue-500 underline underline-offset-2 hover:text-blue-600 transition-colors'
  return (
    <>
      {before}
      {link.href.startsWith('/') ? (
        <Link to={link.href} className={cls}>{link.text}</Link>
      ) : (
        <a href={link.href} target="_blank" rel="noopener" className={cls}>{link.text}</a>
      )}
      {after}
    </>
  )
}

/** Тройка баллов и тройка часов у одного ответа. */
function OptionScores({ option, w }: { option: QuizOption; w: number }) {
  const p = points(option, w)
  const h = hours(option)
  const noPenalty = rescue(option[1][0], option[1][1], w)
  return (
    <div className="shrink-0 text-right">
      <div className="flex justify-end gap-1">
        {p.map((v, i) => (
          <span
            key={i}
            title={`${VARIANTS[i]}${i === 2 && noPenalty ? ' — без штрафа: один из чистых вариантов вопрос не тянет' : ''}`}
            className={`inline-flex min-w-[2.25rem] justify-center rounded px-1.5 py-0.5 text-xs font-semibold tabular-nums ${
              v === 0 ? 'bg-rose-600 text-white' : CHIP[i]
            } ${i === 2 && noPenalty ? 'ring-2 ring-amber-300 dark:ring-amber-500/60' : ''}`}
          >
            {v}
          </span>
        ))}
      </div>
      <div className="mt-1 flex justify-end gap-1 text-[11px] tabular-nums text-slate-400 dark:text-slate-500">
        {h.map((v, i) => (
          <span key={i} title={`${VARIANTS[i]}: человеко-часы за 3 года`} className="min-w-[2.25rem]">
            {hoursLabel(v)}
          </span>
        ))}
      </div>
    </div>
  )
}

/**
 * Опросник «Квинтеты, обычные таблицы или комбинация» — страница
 * /kvintety-ili-tablicy.html (issue #605).
 *
 * Механическое приложение к меморандуму «Квинтеты против традиционных таблиц»:
 * тринадцать вопросов о проекте, у каждого ответа — баллы трёх вариантов и
 * человеко-часы за три года. Вопросы, баллы, часы и правила счёта берутся из
 * src/data/quintetsQuiz.mjs — общего источника со снапшотом
 * (scripts/prerender-kvintety-ili-tablicy.mjs), поэтому разойтись они не могут.
 */
export default function KvintetyIliTablicy() {
  const [answers, setAnswers] = useState<(number | null)[]>(() => QUESTIONS.map(() => null))
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    document.title = QUIZ_META.title
    const canonical = `${SITE}${QUIZ_META.path}`
    const ogImage = `${SITE}/og/kvintety-ili-tablicy.png`

    setMetaTag('meta[name="description"]', 'name', 'description', QUIZ_META.description)
    setMetaTag('meta[name="keywords"]', 'name', 'keywords', QUIZ_META.keywords)
    setMetaTag('meta[property="og:type"]', 'property', 'og:type', 'article')
    setMetaTag('meta[property="og:title"]', 'property', 'og:title', QUIZ_META.title)
    setMetaTag('meta[property="og:description"]', 'property', 'og:description', QUIZ_META.description)
    setMetaTag('meta[property="og:url"]', 'property', 'og:url', canonical)
    setMetaTag('meta[property="og:image"]', 'property', 'og:image', ogImage)
    setMetaTag('meta[property="og:site_name"]', 'property', 'og:site_name', 'Интеграм')
    setMetaTag('meta[property="og:locale"]', 'property', 'og:locale', 'ru_RU')
    setMetaTag('meta[name="twitter:card"]', 'name', 'twitter:card', 'summary_large_image')
    setMetaTag('meta[name="twitter:title"]', 'name', 'twitter:title', QUIZ_META.title)
    setMetaTag('meta[name="twitter:description"]', 'name', 'twitter:description', QUIZ_META.description)
    setMetaTag('meta[name="twitter:image"]', 'name', 'twitter:image', ogImage)
    setCanonical(canonical)
  }, [])

  // Ответы переживают перезагрузку: опросник заполняют не в один присест.
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
      if (Array.isArray(saved) && saved.length) {
        setAnswers(QUESTIONS.map((_, i) => (typeof saved[i] === 'number' ? saved[i] : null)))
      }
    } catch { /* повреждённое хранилище — начинаем с чистого опросника */ }
  }, [])

  function pick(qi: number, oi: number) {
    setAnswers(prev => {
      const next = prev.slice()
      next[qi] = oi
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)) } catch { /* приватный режим */ }
      return next
    })
    setCopied(false)
  }

  function reset() {
    const empty = QUESTIONS.map(() => null)
    setAnswers(empty)
    try { localStorage.removeItem(STORAGE_KEY) } catch { /* приватный режим */ }
    setCopied(false)
  }

  const v = useMemo(() => verdict(answers), [answers])
  const ceil = useMemo(() => ceilings(), [])
  const worst = useMemo(() => worstHours(), [])

  function copyResult() {
    const lines = QUESTIONS.map((q, qi) => {
      const oi = answers[qi]
      if (oi == null) return null
      const o = q.o[oi]
      return `${qi + 1}. ${q.t} — ${o[0]} [баллы ${points(o, q.w).join('/')}; часы ${hours(o).map(hoursLabel).join('/')}]`
    }).filter(Boolean)
    const totals = VARIANTS.map((nm, i) => `${nm}: ${v.sum[i]} ${ballWord(v.sum[i])}, ${v.hours[i]} чел.-ч`).join('\n')
    const text = `Опросник «Квинтеты, обычные таблицы или комбинация» — ${SITE}${QUIZ_META.path}\n${lines.join('\n')}\nИтог:\n${totals}`
    navigator.clipboard?.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }

  /** Подпись под шкалой: сумма часов и что именно в неё добавлено сверх строк. */
  function hoursCaption(i: number) {
    if (v.blocked[i].length) return 'вариант отпадает'
    const crossHours = v.cross.reduce((a, c) => a + c.add[i], 0)
    const parts = [
      i === 2 && v.complete ? `${COMBO_SURCHARGE} ч надбавки за стык` : '',
      crossHours ? `${crossHours} ч перекоса` : '',
    ].filter(Boolean)
    return `${v.hours[i]} чел.-ч за 3 года${parts.length ? ` (в них ${parts.join(' и ')})` : ''}`
  }

  const h1Head = QUIZ_META.h1.slice(0, QUIZ_META.h1.length - QUIZ_META.h1Accent.length)

  return (
    // overflow-x-clip, а не overflow-hidden: `overflow: hidden` на предке
    // делает его контейнером прокрутки, и липкая колонка «Итог» перестаёт
    // прилипать к верху окна — она прилипает к невидимому контейнеру и едет
    // вместе со страницей. `clip` режет так же, но контейнера не создаёт.
    <div className="overflow-x-clip">
      {/* Hero */}
      <section className="pt-28 pb-10 lg:pt-36 lg:pb-14 border-b border-slate-200 dark:border-slate-900">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <Breadcrumbs
            items={[
              { name: 'Интеграм', to: '/' },
              { name: 'Квинтеты или таблицы', to: QUIZ_META.path },
            ]}
          />

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-blue-500/30 text-blue-600 dark:text-blue-400 text-sm font-medium mb-5">
            <Scale size={14} />
            Опросник по архитектуре хранения
          </div>

          <motion.h1
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight mb-5"
          >
            {h1Head}
            <span className="text-blue-500">{QUIZ_META.h1Accent}</span>
          </motion.h1>

          <p className="text-lg text-slate-600 dark:text-slate-300 leading-relaxed max-w-3xl">
            {QUIZ_META.lead}
          </p>

          <div className="mt-6 space-y-3 max-w-3xl text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            {QUIZ_INTRO.map(([head, body]) => (
              <p key={head}>
                <b className="text-slate-900 dark:text-slate-100">{head}</b> {body}
              </p>
            ))}
          </div>

          <details className="mt-6 max-w-3xl rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 p-5 text-sm text-slate-600 dark:text-slate-300">
            <summary className="cursor-pointer font-medium text-slate-900 dark:text-slate-100">
              Откуда взяты часы
            </summary>
            <ul className="mt-3 space-y-2 list-disc pl-5 leading-relaxed">
              {QUIZ_SOURCES.map(s => <li key={s.slice(0, 40)}>{s}</li>)}
            </ul>
          </details>
        </div>
      </section>

      {/* Опросник и итог */}
      <section className="py-12 lg:py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-[minmax(0,1fr)_20rem] gap-8 items-start">
          <div className="space-y-4">
            {QUESTIONS.map((q, qi) => (
              <div
                key={q.id}
                className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 p-5"
              >
                <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                  {qi + 1}. {q.t}
                  <span className="ml-2 text-xs font-normal text-slate-400 dark:text-slate-500">вес {q.w}</span>
                </h2>
                {q.h && <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{q.h}</p>}

                <div className="mt-3 space-y-1">
                  {q.o.map((o, oi) => (
                    <label
                      key={oi}
                      className={`flex gap-3 rounded-xl p-2.5 cursor-pointer transition-colors ${
                        answers[qi] === oi
                          ? 'bg-blue-500/10 ring-1 ring-blue-500/30'
                          : 'hover:bg-slate-100 dark:hover:bg-slate-800/60'
                      }`}
                    >
                      <input
                        type="radio"
                        name={`q-${q.id}`}
                        checked={answers[qi] === oi}
                        onChange={() => pick(qi, oi)}
                        className="mt-1 shrink-0 accent-blue-600"
                      />
                      <span className="min-w-0 flex-1 text-sm text-slate-700 dark:text-slate-200">
                        {o[0]}
                        {o[3] && (
                          <span className="mt-1 block text-[13px] leading-relaxed text-slate-500 dark:text-slate-400">
                            <Note text={o[3]} link={o[4]} />
                          </span>
                        )}
                      </span>
                      <OptionScores option={o} w={q.w} />
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Итог */}
          <aside className="lg:sticky lg:top-24 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 p-5">
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
              Итог{' '}
              <span className="text-xs font-normal text-slate-400 dark:text-slate-500">
                отвечено {v.answered} из {QUESTIONS.length}
              </span>
            </h2>

            <div className="mt-4 space-y-3">
              {VARIANTS.map((nm, i) => (
                <div key={nm}>
                  <div className="flex justify-between text-sm text-slate-700 dark:text-slate-200">
                    <span>{nm}</span>
                    <b className="tabular-nums">{v.sum[i]}</b>
                  </div>
                  <div className="mt-1 h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-200 ${BAR[i]}`}
                      style={{ width: `${v.sum[i]}%` }}
                    />
                  </div>
                  <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    {hoursCaption(i)}
                  </div>
                </div>
              ))}
            </div>

            <h3 className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-800 text-sm font-semibold text-slate-900 dark:text-slate-100">
              Вердикт
            </h3>

            {v.cross.map(c => (
              <div
                key={c.title}
                className="mt-3 rounded-xl border border-amber-300 dark:border-amber-500/40 bg-amber-50 dark:bg-amber-500/10 p-3 text-[13px] leading-relaxed text-slate-700 dark:text-slate-200"
              >
                <b className="flex items-center gap-1.5 text-amber-700 dark:text-amber-400">
                  <AlertTriangle size={14} /> {c.title}.
                </b>
                <span className="mt-1 block">{c.why}</span>
              </div>
            ))}

            {!v.complete ? (
              <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
                Ответьте на все вопросы — вердикт будет по полной сумме.
              </p>
            ) : (
              <div className="mt-3 space-y-2 text-sm text-slate-700 dark:text-slate-200">
                {VARIANTS.map((nm, i) => (
                  <div key={nm}>
                    <b>{nm}:</b>{' '}
                    {v.blocked[i].length ? (
                      <span className="text-rose-600 dark:text-rose-400">
                        не подходит — блокер в вопросе {v.blocked[i].join(', ')}
                      </span>
                    ) : (
                      <>
                        {v.sum[i]} {ballWord(v.sum[i])},{' '}
                        {i === 2
                          ? 'со штрафом за две формы хранения'
                          : v.sum[i] >= SCALE_GOOD
                            ? 'подходит без оговорок'
                            : v.sum[i] >= SCALE_OK
                              ? 'подходит с оговорками'
                              : 'не подходит'}
                        ; {v.hours[i]} чел.-ч
                      </>
                    )}
                  </div>
                ))}

                {v.best == null ? (
                  <p className="pt-1">
                    <b>Ни один вариант не проходит без блокера</b> — пересмотрите объём, гео или
                    разбейте проект.
                  </p>
                ) : (
                  <>
                    <p className="pt-1">
                      <b>Рекомендация:</b> {v.tie.map(i => VARIANTS[i]).join(' или ')}
                      {v.tie.length > 1 ? ' — равный счёт' : ''}, {v.hours[v.best]} чел.-ч разницы
                      за три года.
                    </p>
                    {v.cheapest != null && v.cheapest !== v.best && (
                      <p>
                        Дешевле по труду другой вариант: {VARIANTS[v.cheapest]} —{' '}
                        {v.hours[v.cheapest]} чел.-ч против {v.hours[v.best]}, но он проигрывает{' '}
                        {v.sum[v.best] - v.sum[v.cheapest]} баллов. Разница в{' '}
                        {Math.abs(v.hours[v.best] - v.hours[v.cheapest])} чел.-ч за три года — это и
                        есть цена вопроса.
                      </p>
                    )}
                    {v.best === 2 && (
                      <p>
                        Комбинация вышла вперёд — значит, ни квинтеты, ни обычные таблицы не тянут
                        проект целиком. Закладывайте в план сопровождение двух форм хранения и явную
                        границу между ними.
                      </p>
                    )}
                  </>
                )}

                {v.best != null && v.lost[v.best].length > 0 && (
                  <div className="pt-1 text-[13px] text-slate-500 dark:text-slate-400">
                    Где {VARIANTS[v.best]} теряет баллы:
                    <ul className="mt-1 space-y-1 list-disc pl-5">
                      {v.lost[v.best].slice().sort((a, b) => b.d - a.d).slice(0, 4).map(x => (
                        <li key={x.q}>вопрос {x.q} (−{x.d}): {x.note || 'нет пояснения'}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            <div className="mt-5 flex flex-wrap gap-2 print:hidden">
              <button
                type="button"
                onClick={reset}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 dark:border-slate-700 px-3 py-1.5 text-sm hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <RotateCcw size={14} /> Сбросить
              </button>
              <button
                type="button"
                onClick={copyResult}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 dark:border-slate-700 px-3 py-1.5 text-sm hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <Copy size={14} /> {copied ? 'Скопировано' : 'Скопировать итог'}
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 dark:border-slate-700 px-3 py-1.5 text-sm hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <Printer size={14} /> Печать
              </button>
            </div>

            <p className="mt-4 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Шкала для чистых вариантов: {SCALE_GOOD}–100 — подходит без оговорок; {SCALE_OK}–
              {SCALE_GOOD - 1} — подходит с оговорками; ниже {SCALE_OK} — не подходит. Комбинацию по
              этой шкале не судят: её берут, только когда она обошла оба чистых варианта или они
              заблокированы.
            </p>
          </aside>
        </div>
      </section>

      {/* Таблица целиком */}
      <section className="pb-16 lg:pb-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Таблица баллов и часов целиком
          </h2>
          <p className="mt-2 max-w-3xl text-sm text-slate-500 dark:text-slate-400">
            Та же механика на бумаге: отметьте по одному ответу в каждом вопросе, сложите баллы и
            сложите часы. Подсвеченная клетка — комбинация без штрафа в баллах: один из чистых
            вариантов вопрос не тянет. Часы — человеко-часы за 36 месяцев, «—» значит «так не
            делается».
          </p>

          <div className="mt-5 overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
            <table className="w-full min-w-[60rem] border-collapse text-[13px]">
              <thead className="bg-slate-100 dark:bg-slate-800/70 text-slate-900 dark:text-slate-100">
                <tr>
                  <th rowSpan={2} className="border border-slate-200 dark:border-slate-800 p-2 text-left w-10">№</th>
                  <th rowSpan={2} className="border border-slate-200 dark:border-slate-800 p-2 text-left w-52">Вопрос</th>
                  <th rowSpan={2} className="border border-slate-200 dark:border-slate-800 p-2 text-left w-48">Ответ</th>
                  <th colSpan={3} className="border border-slate-200 dark:border-slate-800 p-2 text-center">Баллы</th>
                  <th colSpan={3} className="border border-slate-200 dark:border-slate-800 p-2 text-center">Человеко-часы за 3 года</th>
                  <th rowSpan={2} className="border border-slate-200 dark:border-slate-800 p-2 text-left">Почему</th>
                </tr>
                <tr>
                  {['Кв.', 'РСУБД', 'Комб.', 'Кв.', 'РСУБД', 'Комб.'].map((h, i) => (
                    <th key={i} className="border border-slate-200 dark:border-slate-800 p-2 text-right text-xs w-16">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="text-slate-600 dark:text-slate-300">
                {QUESTIONS.map((q, qi) =>
                  q.o.map((o, oi) => {
                    const p = points(o, q.w)
                    const h = hours(o)
                    const noPenalty = rescue(o[1][0], o[1][1], q.w)
                    return (
                      <tr key={`${q.id}-${oi}`} className="align-top">
                        {oi === 0 && (
                          <>
                            <td rowSpan={q.o.length} className="border border-slate-200 dark:border-slate-800 p-2 tabular-nums">{qi + 1}</td>
                            <td rowSpan={q.o.length} className="border border-slate-200 dark:border-slate-800 p-2 text-slate-900 dark:text-slate-100">
                              {q.t}
                              <span className="mt-1 block text-xs font-normal text-slate-400 dark:text-slate-500">вес {q.w}</span>
                            </td>
                          </>
                        )}
                        <td className="border border-slate-200 dark:border-slate-800 p-2">{o[0]}</td>
                        {p.map((val, i) => (
                          <td
                            key={`p${i}`}
                            className={`border border-slate-200 dark:border-slate-800 p-2 text-right tabular-nums ${
                              val === 0 ? 'font-bold text-rose-600 dark:text-rose-400' : ''
                            } ${i === 2 && noPenalty ? 'bg-amber-50 dark:bg-amber-500/10' : ''}`}
                          >
                            {val}
                          </td>
                        ))}
                        {h.map((val, i) => (
                          <td key={`h${i}`} className="border border-slate-200 dark:border-slate-800 p-2 text-right tabular-nums text-slate-500 dark:text-slate-400 whitespace-nowrap">
                            {hoursLabel(val)}
                          </td>
                        ))}
                        <td className="border border-slate-200 dark:border-slate-800 p-2">
                          <Note text={o[3]} link={o[4]} />
                        </td>
                      </tr>
                    )
                  }),
                )}
                <tr className="bg-slate-100 dark:bg-slate-800/70 font-semibold text-slate-900 dark:text-slate-100">
                  <th colSpan={3} className="border border-slate-200 dark:border-slate-800 p-2 text-left">
                    Потолок баллов и самый трудоёмкий набор ответов
                  </th>
                  {ceil.map((c, i) => (
                    <th key={`c${i}`} className="border border-slate-200 dark:border-slate-800 p-2 text-right tabular-nums">{c}</th>
                  ))}
                  {worst.map((c, i) => (
                    <th key={`w${i}`} className="border border-slate-200 dark:border-slate-800 p-2 text-right tabular-nums whitespace-nowrap">{c} ч</th>
                  ))}
                  <th className="border border-slate-200 dark:border-slate-800 p-2 text-left font-normal">
                    у комбинации потолок баллов ниже ста по устройству шкалы, а к часам добавлена
                    надбавка за стык
                  </th>
                </tr>
                {CROSS.map(c => (
                  <tr key={c.title} className="align-top bg-amber-50 dark:bg-amber-500/10">
                    <td colSpan={3} className="border border-slate-200 dark:border-slate-800 p-2 font-semibold text-slate-900 dark:text-slate-100">
                      {c.title}
                    </td>
                    <td colSpan={3} className="border border-slate-200 dark:border-slate-800 p-2 text-right">баллы не меняются</td>
                    {c.add.map((v2, i) => (
                      <td key={i} className="border border-slate-200 dark:border-slate-800 p-2 text-right tabular-nums whitespace-nowrap">
                        {v2 ? `+${v2} ч` : '—'}
                      </td>
                    ))}
                    <td className="border border-slate-200 dark:border-slate-800 p-2">{c.why}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-8 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 p-6 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            <p>{QUIZ_FOOTER.text}</p>
            <p className="mt-3 flex flex-wrap gap-x-4 gap-y-1">
              {QUIZ_FOOTER.links.map(l =>
                l.href.startsWith('/') ? (
                  <Link key={l.href} to={l.href} className="text-blue-500 underline underline-offset-2 hover:text-blue-600 transition-colors">
                    {l.text}
                  </Link>
                ) : (
                  <a key={l.href} href={l.href} target="_blank" rel="noopener" className="text-blue-500 underline underline-offset-2 hover:text-blue-600 transition-colors">
                    {l.text}
                  </a>
                ),
              )}
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
