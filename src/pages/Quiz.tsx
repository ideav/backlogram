import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  Check,
  CheckCircle2,
  FileSpreadsheet,
  MonitorX,
  Package,
  Send,
} from 'lucide-react'
import { reachGoal } from '../lib/metrika'
import {
  ANALYSIS_MESSAGES,
  AUDIENCE,
  CALL_SLOTS,
  FEATURES,
  HERO_CHIPS,
  HERO_LEAD,
  PROBLEMS,
  QUIZ_META,
  STEPS,
  SYSTEM_TYPES,
  USER_COUNTS,
  analyzeEstimate,
} from '../data/quizCalc'

const SITE = 'https://ideav.ru'

const CAPTCHA_CLIENT_KEY = (import.meta.env.VITE_SMARTCAPTCHA_CLIENT_KEY as string | undefined) ?? ''

declare global {
  interface Window {
    smartCaptcha?: {
      getResponse: (widgetId: number) => string
      reset: (widgetId: number) => void
      render: (
        container: HTMLElement | string,
        params: {
          sitekey: string
          callback?: (token: string) => void
          'error-callback'?: () => void
          'expired-callback'?: () => void
        },
      ) => number
      destroy: (widgetId: number) => void
    }
  }
}

function hasIdbCookie(): boolean {
  return document.cookie.split(';').some(c => c.trimStart().startsWith('idb_'))
}

function setMetaTag(selector: string, attr: 'name' | 'property', key: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(selector)
  if (!el) { el = document.createElement('meta'); el.setAttribute(attr, key); document.head.appendChild(el) }
  el.setAttribute('content', content)
}
function setCanonical(href: string) {
  let el = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')
  if (!el) { el = document.createElement('link'); el.setAttribute('rel', 'canonical'); el.setAttribute('href', href); document.head.appendChild(el) }
  el.setAttribute('href', href)
}

type Stage = 'q1' | 'q2' | 'analysis' | 'result' | 'contact' | 'sending' | 'done'

const STEP_INDEX: Record<Exclude<Stage, 'done'>, number> = {
  q1: 1,
  q2: 2,
  analysis: 3,
  result: 3,
  contact: 4,
  sending: 4,
}
const TOTAL_STEPS = 4

const PROBLEM_ICONS = [FileSpreadsheet, MonitorX, Package]

const CONTACT_LABELS: Record<string, string> = {
  telegram: 'Telegram',
  email: 'Email',
  phone: 'телефон',
}

/**
 * Квиз «оценка проекта за 2 минуты» — /quiz.html (issue #745). Перенесён с
 * заготовки ideav.ru/victor/: призыв hero — по задаче, тексты легче и без
 * пафоса, вместо модалки — квиз прямо на странице, а финал ведёт к живому
 * разговору: заявка уходит тем же механизмом, что и форма на главной
 * (/telegram-notify.php, с капчей и согласием).
 *
 * Вопросы, логика оценки и тексты — общий источник src/data/quizCalc.mjs со
 * снапшотом scripts/prerender-quiz.mjs, поэтому разойтись они не могут.
 */
export default function Quiz() {
  const [stage, setStage] = useState<Stage>('q1')
  const [systemType, setSystemType] = useState('')
  const [userCount, setUserCount] = useState('')
  const [features, setFeatures] = useState<string[]>([])
  const [name, setName] = useState('')
  const [contactMethod, setContactMethod] = useState<'email' | 'telegram' | 'phone'>('telegram')
  const [contact, setContact] = useState('')
  const [callSlot, setCallSlot] = useState('')
  const [consentChecked, setConsentChecked] = useState(false)
  const [captchaToken, setCaptchaToken] = useState('')
  const [idbCookieFound] = useState(() => hasIdbCookie())
  const [errorMsg, setErrorMsg] = useState('')
  const captchaContainerRef = useRef<HTMLDivElement>(null)
  const captchaWidgetIdRef = useRef<number | null>(null)

  useEffect(() => {
    document.title = QUIZ_META.title
    const canonical = `${SITE}${QUIZ_META.path}`

    setMetaTag('meta[name="description"]', 'name', 'description', QUIZ_META.description)
    setMetaTag('meta[name="keywords"]', 'name', 'keywords', QUIZ_META.keywords)
    setMetaTag('meta[property="og:type"]', 'property', 'og:type', 'website')
    setMetaTag('meta[property="og:title"]', 'property', 'og:title', QUIZ_META.title)
    setMetaTag('meta[property="og:description"]', 'property', 'og:description', QUIZ_META.description)
    setMetaTag('meta[property="og:url"]', 'property', 'og:url', canonical)
    setMetaTag('meta[property="og:site_name"]', 'property', 'og:site_name', 'Интеграм')
    setMetaTag('meta[property="og:locale"]', 'property', 'og:locale', 'ru_RU')
    setMetaTag('meta[name="twitter:card"]', 'name', 'twitter:card', 'summary')
    setMetaTag('meta[name="twitter:title"]', 'name', 'twitter:title', QUIZ_META.title)
    setMetaTag('meta[name="twitter:description"]', 'name', 'twitter:description', QUIZ_META.description)
    setCanonical(canonical)
  }, [])

  // Экран «анализа»: перебираем реплики, затем показываем оценку. Локальная
  // логика без запросов — вилки честно считает analyzeEstimate() из общих
  // данных, никакого «ИИ-закулисья» тут нет.
  useEffect(() => {
    if (stage !== 'analysis') return
    let idx = 0
    let hideTimer: ReturnType<typeof setTimeout> | undefined
    const interval = setInterval(() => {
      idx += 1
      if (idx < ANALYSIS_MESSAGES.length) {
        // Мгновенная смена реплик дёргает глаза: гасим, меняем, возвращаем.
        const el = document.getElementById('quiz-analysis-text')
        if (el) {
          el.style.opacity = '0'
          hideTimer = setTimeout(() => {
            el.textContent = ANALYSIS_MESSAGES[idx]
            el.style.opacity = '1'
          }, 200)
        }
      } else {
        clearInterval(interval)
        setStage('result')
      }
    }, 1200)
    return () => {
      clearInterval(interval)
      if (hideTimer) clearTimeout(hideTimer)
    }
  }, [stage])

  // Капча — тот же механизм, что под формой на главной: сервер
  // telegram-notify.php принимает заявку анонима только с captcha_token,
  // а у вошедших в Интеграм (cookie idb_*) проверки нет.
  useEffect(() => {
    if (!CAPTCHA_CLIENT_KEY || stage !== 'contact' || idbCookieFound) return

    function initCaptcha() {
      if (!captchaContainerRef.current || !window.smartCaptcha) return
      if (captchaWidgetIdRef.current !== null) return
      captchaWidgetIdRef.current = window.smartCaptcha.render(captchaContainerRef.current, {
        sitekey: CAPTCHA_CLIENT_KEY,
        callback: (token: string) => setCaptchaToken(token),
        'expired-callback': () => setCaptchaToken(''),
        'error-callback': () => setCaptchaToken(''),
      })
    }

    if (window.smartCaptcha) {
      initCaptcha()
      return
    }

    const script = document.createElement('script')
    script.src = 'https://smartcaptcha.yandexcloud.net/captcha.js'
    script.defer = true
    script.onload = initCaptcha
    document.head.appendChild(script)

    return () => {
      if (captchaWidgetIdRef.current !== null && window.smartCaptcha && captchaContainerRef.current) {
        window.smartCaptcha.destroy(captchaWidgetIdRef.current)
        captchaWidgetIdRef.current = null
      }
    }
  }, [stage, idbCookieFound])

  const estimate = analyzeEstimate({ systemType, userCount, features })
  const userCountLabel = USER_COUNTS.find(u => u.value === userCount)?.label ?? userCount

  function scrollToQuiz() {
    document.getElementById('quiz')?.scrollIntoView({ behavior: 'smooth' })
  }

  function toggleFeature(value: string) {
    setFeatures(prev => (prev.includes(value) ? prev.filter(f => f !== value) : [...prev, value]))
  }

  function restart() {
    setSystemType('')
    setUserCount('')
    setFeatures([])
    setStage('q1')
  }

  function submitLead(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!name.trim()) {
      setErrorMsg('Как к вам обращаться? Без имени неловко начинать разговор.')
      return
    }
    if (!contact.trim()) {
      setErrorMsg('Оставьте контакт — иначе оценке будет некуда прийти.')
      return
    }
    if (CAPTCHA_CLIENT_KEY && !idbCookieFound && !captchaToken) {
      setErrorMsg('Пожалуйста, пройдите проверку капчи.')
      return
    }

    // Резюме квиза уезжает одним полем task — бэкенд читает из $_POST,
    // человек в чате заявок видит ответы и вилку целиком.
    const summary = [
      'Квиз /quiz.html — оценка проекта',
      `Задача: ${systemType}`,
      `Пользователей: ${userCountLabel}`,
      features.length ? `Функции: ${features.join('; ')}` : '',
      `Оценка квиза: ${estimate.category}, ${estimate.cost}, ${estimate.timeline}`,
      callSlot ? `Созвон: ${callSlot}` : '',
    ].filter(Boolean).join('\n')

    const data = new FormData()
    data.set('name', name.trim())
    data.set('contact', contact.trim())
    data.set('task', summary)
    data.set('source', 'quiz')
    if (CAPTCHA_CLIENT_KEY && !idbCookieFound) data.set('captcha_token', captchaToken)

    setStage('sending')
    setErrorMsg('')

    fetch('/telegram-notify.php', { method: 'POST', body: data })
      .then(res => res.json())
      .then(json => {
        if (json.ok) {
          reachGoal('lead', { source: 'quiz' })
          setStage('done')
        } else {
          setStage('contact')
          setErrorMsg(json.error ?? 'Не получилось отправить. Напишите нам в Telegram @qdmadept.')
        }
      })
      .catch(() => {
        setStage('contact')
        setErrorMsg('Не удалось отправить запрос. Проверьте соединение и попробуйте ещё раз.')
      })
  }

  const contactPlaceholder =
    contactMethod === 'telegram' ? '@username в Telegram' : contactMethod === 'email' ? 'you@company.ru' : '+7 900 000-00-00'

  const progressPct = (STEP_INDEX[stage as Exclude<Stage, 'done'>] / TOTAL_STEPS) * 100

  return (
    <div className="pt-28 lg:pt-36 pb-20">
      {/* Hero */}
      <section className="relative isolate overflow-hidden px-4 sm:px-6 lg:px-8">
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-[radial-gradient(circle_at_center,rgba(37,99,235,0.08)_0%,transparent_70%)]" />
        </div>
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            {QUIZ_META.h1}
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-slate-600 dark:text-slate-300 leading-relaxed">
            {HERO_LEAD}
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            {HERO_CHIPS.map(chip => (
              <span
                key={chip}
                className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/10 px-3 py-1 text-sm font-medium text-blue-600 dark:text-blue-400"
              >
                <Check size={14} aria-hidden="true" />
                {chip}
              </span>
            ))}
          </div>
          <button
            type="button"
            onClick={scrollToQuiz}
            className="mt-8 inline-flex items-center gap-2 px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-600/20 transition-all"
          >
            Рассчитать за 2 минуты
            <ArrowRight size={18} aria-hidden="true" />
          </button>
        </div>
      </section>

      {/* Квиз */}
      <section id="quiz" className="mt-14 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl shadow-slate-900/5 p-6 sm:p-10">
          {stage !== 'done' && (
            <div className="mb-8">
              <div className="h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div
                  className="h-full rounded-full bg-blue-600 transition-all duration-500"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
              <p className="mt-2 text-xs font-medium text-slate-400 dark:text-slate-500">
                Шаг {STEP_INDEX[stage as Exclude<Stage, 'done'>]} из {TOTAL_STEPS}
              </p>
            </div>
          )}

          {stage === 'q1' && (
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
                Что за система нужна?
              </h2>
              <p className="mt-2 text-slate-500 dark:text-slate-400">Выберите ближайший вариант — уточним при созвоне.</p>
              <div className="mt-6 grid gap-3">
                {SYSTEM_TYPES.map(t => (
                  <button
                    key={t.value}
                    type="button"
                    aria-pressed={systemType === t.value}
                    onClick={() => { setSystemType(t.value); setStage('q2') }}
                    className={`text-left px-5 py-4 rounded-xl border transition-all font-medium ${
                      systemType === t.value
                        ? 'border-blue-600 bg-blue-600/5 text-blue-600 dark:text-blue-400'
                        : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-blue-500 dark:hover:border-blue-400'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {stage === 'q2' && (
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
                Кто будет пользоваться и что точно нужно?
              </h2>
              <fieldset className="mt-6">
                <legend className="text-sm font-semibold text-slate-700 dark:text-slate-300">Пользователей системы</legend>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  {USER_COUNTS.map(u => (
                    <button
                      key={u.value}
                      type="button"
                      aria-pressed={userCount === u.value}
                      onClick={() => setUserCount(u.value)}
                      className={`px-4 py-3 rounded-xl border transition-all text-sm font-medium ${
                        userCount === u.value
                          ? 'border-blue-600 bg-blue-600/5 text-blue-600 dark:text-blue-400'
                          : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-blue-500 dark:hover:border-blue-400'
                      }`}
                    >
                      {u.label}
                    </button>
                  ))}
                </div>
              </fieldset>
              <fieldset className="mt-6">
                <legend className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Какие возможности нужны? <span className="font-normal text-slate-400">(необязательно)</span>
                </legend>
                <div className="mt-3 grid gap-2">
                  {FEATURES.map(f => (
                    <label
                      key={f.value}
                      className="flex items-center gap-3 px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 cursor-pointer hover:border-blue-500 dark:hover:border-blue-400 transition-all"
                    >
                      <input
                        type="checkbox"
                        checked={features.includes(f.value)}
                        onChange={() => toggleFeature(f.value)}
                        className="h-4 w-4 shrink-0 rounded border-slate-300 dark:border-slate-600 accent-blue-600 cursor-pointer"
                      />
                      <span className="text-sm text-slate-700 dark:text-slate-200">{f.label}</span>
                    </label>
                  ))}
                </div>
              </fieldset>
              <div className="mt-8 flex items-center justify-between gap-4">
                <button
                  type="button"
                  onClick={() => setStage('q1')}
                  className="text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-blue-500 dark:hover:text-blue-400 transition-colors"
                >
                  &larr; Назад
                </button>
                <button
                  type="button"
                  disabled={!userCount}
                  onClick={() => setStage('analysis')}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl shadow-lg shadow-blue-600/20 transition-all"
                >
                  Показать оценку
                  <ArrowRight size={16} aria-hidden="true" />
                </button>
              </div>
            </div>
          )}

          {stage === 'analysis' && (
            <div className="py-12 text-center" aria-live="polite">
              <div
                className="mx-auto h-10 w-10 rounded-full border-2 border-slate-200 dark:border-slate-700 border-t-blue-600 animate-spin"
                role="status"
                aria-label="Считаем оценку"
              />
              <p
                id="quiz-analysis-text"
                className="mt-6 text-slate-600 dark:text-slate-300 transition-opacity duration-200"
              >
                {ANALYSIS_MESSAGES[0]}
              </p>
            </div>
          )}

          {stage === 'result' && (
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
                Предварительная оценка
              </h2>
              <div className="mt-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 p-5 sm:p-6">
                <div className="flex justify-between gap-4 py-1.5">
                  <span className="text-slate-500 dark:text-slate-400">Сложность проекта</span>
                  <span className="font-semibold text-slate-900 dark:text-white text-right">{estimate.category}</span>
                </div>
                <div className="flex justify-between gap-4 py-1.5">
                  <span className="text-slate-500 dark:text-slate-400">Предварительный бюджет</span>
                  <span className="font-semibold text-blue-600 dark:text-blue-400 text-right">{estimate.cost}</span>
                </div>
                <div className="flex justify-between gap-4 py-1.5">
                  <span className="text-slate-500 dark:text-slate-400">Ориентировочные сроки</span>
                  <span className="font-semibold text-slate-900 dark:text-white text-right">{estimate.timeline}</span>
                </div>
                {estimate.features.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800">
                    <span className="text-slate-500 dark:text-slate-400">Скорее всего, войдёт:</span>
                    <ul className="mt-2 space-y-1.5">
                      {estimate.features.map(f => (
                        <li key={f} className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-200">
                          <Check size={16} className="mt-0.5 shrink-0 text-green-500" aria-hidden="true" />
                          {f}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
              <p className="mt-4 text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                Это прикидка по двум ответам, а не смета. Точную цифру назовём на коротком живом разговоре —
                обычно хватает 15 минут, и это бесплатно.
              </p>
              <div className="mt-6 flex items-center justify-between gap-4 flex-wrap">
                <button
                  type="button"
                  onClick={restart}
                  className="text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-blue-500 dark:hover:text-blue-400 transition-colors"
                >
                  &larr; Пройти заново
                </button>
                <button
                  type="button"
                  onClick={() => setStage('contact')}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-lg shadow-blue-600/20 transition-all"
                >
                  Позвать на 15-минутный разговор
                  <ArrowRight size={16} aria-hidden="true" />
                </button>
              </div>
            </div>
          )}

          {(stage === 'contact' || stage === 'sending') && (
            <form onSubmit={submitLead} noValidate>
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
                Куда прислать оценку и когда поговорить?
              </h2>
              <div className="mt-6 space-y-4">
                <div>
                  <label htmlFor="quiz-name" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                    Как вас зовут
                  </label>
                  <input
                    id="quiz-name"
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Имя"
                    autoComplete="name"
                    className="mt-2 w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>
                <fieldset>
                  <legend className="text-sm font-medium text-slate-700 dark:text-slate-300">Куда написать</legend>
                  <div className="mt-2 flex gap-2 flex-wrap">
                    {(['telegram', 'email', 'phone'] as const).map(m => (
                      <button
                        key={m}
                        type="button"
                        aria-pressed={contactMethod === m}
                        onClick={() => setContactMethod(m)}
                        className={`px-4 py-2 rounded-lg border text-sm font-medium transition-all ${
                          contactMethod === m
                            ? 'border-blue-600 bg-blue-600/5 text-blue-600 dark:text-blue-400'
                            : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-blue-500 dark:hover:border-blue-400'
                        }`}
                      >
                        {CONTACT_LABELS[m]}
                      </button>
                    ))}
                  </div>
                </fieldset>
                <div>
                  <label htmlFor="quiz-contact" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                    Контакт
                  </label>
                  <input
                    id="quiz-contact"
                    type="text"
                    value={contact}
                    onChange={e => setContact(e.target.value)}
                    placeholder={contactPlaceholder}
                    autoComplete={contactMethod === 'email' ? 'email' : contactMethod === 'phone' ? 'tel' : 'off'}
                    className="mt-2 w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>
                <fieldset>
                  <legend className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Когда удобно созвониться?
                  </legend>
                  <div className="mt-2 flex gap-2 flex-wrap">
                    {CALL_SLOTS.map(slot => (
                      <button
                        key={slot}
                        type="button"
                        aria-pressed={callSlot === slot}
                        onClick={() => setCallSlot(callSlot === slot ? '' : slot)}
                        className={`px-4 py-2 rounded-lg border text-sm font-medium transition-all ${
                          callSlot === slot
                            ? 'border-blue-600 bg-blue-600/5 text-blue-600 dark:text-blue-400'
                            : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-blue-500 dark:hover:border-blue-400'
                        }`}
                      >
                        {slot}
                      </button>
                    ))}
                  </div>
                </fieldset>
              </div>

              {errorMsg && (
                <p className="mt-4 text-red-500 dark:text-red-400 text-sm font-medium">{errorMsg}</p>
              )}

              {CAPTCHA_CLIENT_KEY && !idbCookieFound && (
                <div ref={captchaContainerRef} className="mt-4" />
              )}

              <label className="mt-5 flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={consentChecked}
                  onChange={e => setConsentChecked(e.target.checked)}
                  className="mt-0.5 h-4 w-4 shrink-0 rounded border-slate-300 dark:border-slate-600 accent-blue-600 cursor-pointer"
                />
                <span className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Я даю согласие на{' '}
                  <a
                    href="/privacy.html"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline hover:text-blue-500 transition-colors"
                  >
                    обработку персональных данных
                  </a>
                </span>
              </label>

              <div className="mt-6 flex items-center justify-between gap-4 flex-wrap">
                <button
                  type="button"
                  onClick={() => setStage('result')}
                  className="text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-blue-500 dark:hover:text-blue-400 transition-colors"
                >
                  &larr; К оценке
                </button>
                <button
                  type="submit"
                  disabled={stage === 'sending' || !consentChecked}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl shadow-lg shadow-blue-600/20 transition-all"
                >
                  {stage === 'sending' ? 'Отправляем…' : 'Отправить'}
                  {stage !== 'sending' && <Send size={16} aria-hidden="true" />}
                </button>
              </div>
            </form>
          )}

          {stage === 'done' && (
            <div className="py-8 text-center">
              <CheckCircle2 size={48} className="mx-auto text-green-500" aria-hidden="true" />
              <h2 className="mt-4 text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">Готово!</h2>
              <p className="mt-3 text-slate-600 dark:text-slate-300 leading-relaxed">
                Заявка уже у нас. Ответим в выбранный способ связи — обычно в тот же рабочий день —
                и договоримся о времени разговора.
              </p>
              <Link
                to="/#cases"
                className="mt-6 inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-lg shadow-blue-600/20 transition-all"
              >
                Посмотреть примеры работ
                <ArrowRight size={16} aria-hidden="true" />
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Знакомо? */}
      <section className="mt-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-center text-slate-900 dark:text-white">
            Знакомо?
          </h2>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {PROBLEMS.map((p, i) => {
              const Icon = PROBLEM_ICONS[i % PROBLEM_ICONS.length]
              return (
                <div
                  key={p.h}
                  className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6"
                >
                  <Icon size={28} className="text-blue-600 dark:text-blue-400" aria-hidden="true" />
                  <h3 className="mt-4 font-semibold text-slate-900 dark:text-white">{p.h}</h3>
                  <p className="mt-2 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{p.p}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Как идёт работа */}
      <section className="mt-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-center text-slate-900 dark:text-white">
            От идеи до работающей системы — четыре шага
          </h2>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((s, i) => (
              <div
                key={s.h}
                className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-600/10 font-bold text-blue-600 dark:text-blue-400">
                    {i + 1}
                  </span>
                  <span className="rounded-full bg-slate-100 dark:bg-slate-800 px-2.5 py-1 text-xs font-medium text-slate-500 dark:text-slate-400">
                    {s.duration}
                  </span>
                </div>
                <h3 className="mt-4 font-semibold text-slate-900 dark:text-white">{s.h}</h3>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{s.p}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Кому подходит */}
      <section className="mt-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-center text-slate-900 dark:text-white">
            Кому это подходит
          </h2>
          <ul className="mt-10 grid gap-3 sm:grid-cols-2">
            {AUDIENCE.map(item => (
              <li
                key={item}
                className="flex items-start gap-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 text-slate-700 dark:text-slate-200"
              >
                <Check size={20} className="mt-0.5 shrink-0 text-green-500" aria-hidden="true" />
                {item}
              </li>
            ))}
          </ul>
          <div className="mt-12 text-center">
            <button
              type="button"
              onClick={scrollToQuiz}
              className="inline-flex items-center gap-2 px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-600/20 transition-all"
            >
              Начать расчёт
              <ArrowRight size={18} aria-hidden="true" />
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}
