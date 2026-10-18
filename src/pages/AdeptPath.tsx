import { useEffect, useRef, useState, type FormEvent } from 'react'
import { ArrowRight, Bot, Briefcase, Check, CheckCircle2, Clock, ExternalLink, Lightbulb, MessagesSquare, Send, Wallet } from 'lucide-react'
import { reachGoal } from '../lib/metrika'
import {
  ADEPT_META,
  CASES,
  COMMUNITY,
  FORM_HINTS,
  HERO_CHIPS,
  HERO_LEAD,
  HOURS_LESSON,
  LINK_TARGET,
  RATE_NOTE,
  SELF_CHECK,
  STEPS,
} from '../data/adeptPath'

const SITE = 'https://ideav.ru'

const CAPTCHA_CLIENT_KEY = (import.meta.env.VITE_SMARTCAPTCHA_CLIENT_KEY as string | undefined) ?? ''

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

const rub = (n: number) => `${n.toLocaleString('ru-RU')} ₽`

const INPUT_CLASS =
  'mt-2 w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all'

type FormStage = 'form' | 'sending' | 'done'

/** Иконки преимуществ сообщества (#769) — по ключу из COMMUNITY.perks. */
const PERK_ICONS = { consult: MessagesSquare, agents: Bot, orders: Briefcase, tips: Lightbulb } as const

/**
 * «Путь адепта Интеграм» — /put-adepta.html (issue #765). Мотивирует пройти
 * пять шагов: изучить два реальных проекта (ПакЛайн и СПЗ — имена заменены),
 * собрать своё приложение, зарегистрироваться разработчиком, найти заказчика,
 * стать партнёром (ссылка — в личном кабинете после регистрации). Заявка в
 * разработчики — тем же механизмом, что форма на главной и квиз
 * (/telegram-notify.php, капча для анонимов, согласие на ПДн).
 *
 * Тексты и цифры — общий источник src/data/adeptPath.mjs со снапшотом
 * scripts/prerender-put-adepta.mjs.
 */
export default function AdeptPath() {
  const [activeCase, setActiveCase] = useState(CASES[0].key)
  const [name, setName] = useState('')
  const [telegram, setTelegram] = useState('')
  const [experience, setExperience] = useState('')
  const [consentChecked, setConsentChecked] = useState(false)
  const [captchaToken, setCaptchaToken] = useState('')
  const [idbCookieFound] = useState(() => hasIdbCookie())
  const [stage, setStage] = useState<FormStage>('form')
  const [errorMsg, setErrorMsg] = useState('')
  const captchaContainerRef = useRef<HTMLDivElement>(null)
  const captchaWidgetIdRef = useRef<number | null>(null)

  useEffect(() => {
    document.title = ADEPT_META.title
    const canonical = `${SITE}${ADEPT_META.path}`

    setMetaTag('meta[name="description"]', 'name', 'description', ADEPT_META.description)
    setMetaTag('meta[name="keywords"]', 'name', 'keywords', ADEPT_META.keywords)
    setMetaTag('meta[property="og:type"]', 'property', 'og:type', 'website')
    setMetaTag('meta[property="og:title"]', 'property', 'og:title', ADEPT_META.title)
    setMetaTag('meta[property="og:description"]', 'property', 'og:description', ADEPT_META.description)
    setMetaTag('meta[property="og:url"]', 'property', 'og:url', canonical)
    setMetaTag('meta[property="og:site_name"]', 'property', 'og:site_name', 'Интеграм')
    setMetaTag('meta[property="og:locale"]', 'property', 'og:locale', 'ru_RU')
    setMetaTag('meta[name="twitter:card"]', 'name', 'twitter:card', 'summary')
    setMetaTag('meta[name="twitter:title"]', 'name', 'twitter:title', ADEPT_META.title)
    setMetaTag('meta[name="twitter:description"]', 'name', 'twitter:description', ADEPT_META.description)
    setCanonical(canonical)
  }, [])

  // Капча — как у квиза: виджет рисуется сразу (форма на странице всегда),
  // вошедшим в Интеграм (cookie idb_*) проверка не нужна.
  useEffect(() => {
    if (!CAPTCHA_CLIENT_KEY || idbCookieFound) return

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
  }, [idbCookieFound])

  function goTo(href: string) {
    document.getElementById(href.slice(1))?.scrollIntoView({ behavior: 'smooth' })
  }

  function submitLead(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!name.trim()) {
      setErrorMsg('Как к вам обращаться?')
      return
    }
    if (!telegram.trim()) {
      setErrorMsg('Оставьте Telegram — туда напишем, чтобы договориться о собеседовании.')
      return
    }
    if (CAPTCHA_CLIENT_KEY && !idbCookieFound && !captchaToken) {
      setErrorMsg('Пожалуйста, пройдите проверку капчи.')
      return
    }

    const summary = [
      'Путь адепта /put-adepta.html — заявка в разработчики',
      experience.trim() ? `Опыт: ${experience.trim()}` : 'Опыт: не указан',
    ].join('\n')

    const data = new FormData()
    data.set('name', name.trim())
    data.set('contact', `Telegram: ${telegram.trim()}`)
    data.set('task', summary)
    data.set('source', 'adept')
    if (CAPTCHA_CLIENT_KEY && !idbCookieFound) data.set('captcha_token', captchaToken)

    setStage('sending')
    setErrorMsg('')

    fetch('/telegram-notify.php', { method: 'POST', body: data })
      .then(res => res.json())
      .then(json => {
        if (json.ok) {
          reachGoal('lead', { source: 'adept' })
          setStage('done')
        } else {
          setStage('form')
          setErrorMsg(json.error ?? 'Не получилось отправить. Напишите нам в Telegram @qdmadept.')
        }
      })
      .catch(() => {
        setStage('form')
        setErrorMsg('Не удалось отправить заявку. Проверьте соединение и попробуйте ещё раз.')
      })
  }

  return (
    <div className="pb-20">
      {/* Hero */}
      <section className="relative isolate overflow-hidden px-4 sm:px-6 lg:px-8 pt-32 lg:pt-44 pb-12">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,rgba(37,99,235,0.10)_0%,transparent_60%)]" />
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            {ADEPT_META.h1}
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-slate-600 dark:text-slate-300 leading-relaxed">{HERO_LEAD}</p>
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
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <button
              type="button"
              onClick={() => goTo('#cases')}
              className="inline-flex items-center gap-2 px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-600/20 transition-all"
            >
              Посмотреть два проекта
              <ArrowRight size={18} aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => goTo('#zayavka')}
              className="inline-flex items-center gap-2 px-8 py-4 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 font-bold rounded-xl transition-all"
            >
              Присоединиться
            </button>
          </div>
        </div>
      </section>

      {/* Пять шагов */}
      <section id="steps" className="mt-12 px-4 sm:px-6 lg:px-8 scroll-mt-24">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-center text-slate-900 dark:text-white">
            Пять шагов пути адепта
          </h2>
          <ol className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
            {STEPS.map((s, i) => (
              <li
                key={s.h}
                className="flex flex-col rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-600/10 font-bold text-blue-600 dark:text-blue-400">
                  {i + 1}
                </span>
                <h3 className="mt-4 font-semibold text-slate-900 dark:text-white">{s.h}</h3>
                <p className="mt-2 flex-1 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{s.p}</p>
                {s.cta && (s.cta.href.startsWith('#') ? (
                  <button
                    type="button"
                    onClick={() => goTo(s.cta!.href)}
                    className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600 dark:text-blue-400 hover:underline text-left"
                  >
                    {s.cta.label}
                    <ArrowRight size={14} aria-hidden="true" />
                  </button>
                ) : (
                  <a
                    href={s.cta.href}
                    target={LINK_TARGET}
                    className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    {s.cta.label}
                    <ArrowRight size={14} aria-hidden="true" />
                  </a>
                ))}
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Два проекта — две вкладки (просьба владельца в #765: не одной простынёй) */}
      <section id="cases" className="mt-24 px-4 sm:px-6 lg:px-8 scroll-mt-24">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-center text-slate-900 dark:text-white">
            Два проекта: путь от первого письма до работающей системы
          </h2>
          <p className="mt-4 text-center text-slate-600 dark:text-slate-300">
            {RATE_NOTE}
          </p>

          <div role="tablist" aria-label="Проекты" className="mt-10 flex justify-center gap-2 flex-wrap">
            {CASES.map(c => (
              <button
                key={c.key}
                id={`case-tab-${c.key}`}
                type="button"
                role="tab"
                aria-selected={activeCase === c.key}
                aria-controls={`case-${c.key}`}
                onClick={() => setActiveCase(c.key)}
                className={`px-5 py-3 rounded-xl border text-left transition-all ${
                  activeCase === c.key
                    ? 'border-blue-600 bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                    : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-blue-500 dark:hover:border-blue-400'
                }`}
              >
                <span className="block font-bold">{c.name}</span>
                <span className={`block text-sm ${activeCase === c.key ? 'text-blue-100' : 'text-slate-500 dark:text-slate-400'}`}>
                  {rub(c.budget)} · около {c.hoursSpent} ч
                </span>
              </button>
            ))}
          </div>

          {CASES.map(c => (
            <article
              key={c.key}
              id={`case-${c.key}`}
              role="tabpanel"
              aria-labelledby={`case-tab-${c.key}`}
              hidden={activeCase !== c.key}
              className="mt-8 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl shadow-slate-900/5 p-6 sm:p-10"
            >
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white">История {c.name}</h3>
              <p className="mt-2 text-slate-600 dark:text-slate-300">{c.tagline}</p>

              <div className="mt-6 grid gap-4 sm:grid-cols-3">
                <div className="rounded-2xl bg-blue-500/5 border border-blue-500/20 p-4">
                  <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                    <Wallet size={16} aria-hidden="true" /> Бюджет
                  </div>
                  <div className="mt-1 text-2xl font-extrabold text-slate-900 dark:text-white">{rub(c.budget)}</div>
                </div>
                <div className="rounded-2xl bg-blue-500/5 border border-blue-500/20 p-4">
                  <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                    <Clock size={16} aria-hidden="true" /> Работы
                  </div>
                  <div className="mt-1 text-2xl font-extrabold text-slate-900 dark:text-white">около {c.hoursSpent} ч</div>
                </div>
                <div className="rounded-2xl bg-blue-500/5 border border-blue-500/20 p-4">
                  <div className="text-sm text-slate-500 dark:text-slate-400">Откуда пришёл</div>
                  <div className="mt-1 text-sm font-medium text-slate-800 dark:text-slate-100 leading-snug">{c.origin}</div>
                </div>
              </div>

              <ul className="mt-6 flex flex-wrap gap-2">
                {c.phases.map((ph, i) => (
                  <li
                    key={ph.name}
                    className="rounded-full bg-slate-100 dark:bg-slate-800 px-3 py-1 text-sm text-slate-600 dark:text-slate-300"
                  >
                    Фаза {i + 1}: {ph.name}
                    {ph.budget ? ` — ${rub(ph.budget)}` : ''}, {ph.note}
                  </li>
                ))}
              </ul>

              <h4 className="mt-8 font-semibold text-slate-900 dark:text-white">Как шёл проект</h4>
              <ol className="mt-4 space-y-6">
                {c.timeline.map((step, i) => (
                  <li key={step.t} className="flex gap-4">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-blue-500/40 text-sm font-semibold text-blue-600 dark:text-blue-400">
                      {i + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-slate-700 dark:text-slate-200 leading-relaxed">{step.t}</p>
                      {step.links && (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {step.links.map(l => (
                            <a
                              key={l.href}
                              href={l.href}
                              target={LINK_TARGET}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-blue-500/30 bg-blue-500/5 px-3 py-1.5 text-sm font-medium text-blue-600 dark:text-blue-400 hover:border-blue-500 transition-colors"
                            >
                              {l.label}
                              <ExternalLink size={13} aria-hidden="true" />
                            </a>
                          ))}
                        </div>
                      )}
                      {step.shot && (
                        <figure className="mt-4 max-w-sm">
                          <img
                            src={step.shot.src}
                            width={step.shot.width}
                            height={step.shot.height}
                            alt={step.shot.alt}
                            loading="lazy"
                            className="w-full h-auto rounded-2xl border border-slate-200 dark:border-slate-800 shadow-md"
                          />
                          <figcaption className="mt-2 text-xs text-slate-500 dark:text-slate-400">{step.shot.alt}</figcaption>
                        </figure>
                      )}
                    </div>
                  </li>
                ))}
              </ol>

              {c.key === 'pakline' && (
                <aside className="mt-8 rounded-2xl border-l-4 border-amber-500 bg-amber-500/5 p-6">
                  <h4 className="font-semibold text-slate-900 dark:text-white">Почему мы не торгуемся за часы</h4>
                  <p className="mt-2 text-slate-700 dark:text-slate-200 leading-relaxed">{HOURS_LESSON}</p>
                </aside>
              )}

              <h4 className="mt-8 font-semibold text-slate-900 dark:text-white">Что получил заказчик</h4>
              <p className="mt-2 text-slate-700 dark:text-slate-200 leading-relaxed">{c.result}</p>

              {c.images.map(img => (
                <figure key={img.src} className="mt-6">
                  <img
                    src={img.src}
                    width={img.width}
                    height={img.height}
                    alt={img.alt}
                    loading="lazy"
                    className="w-full h-auto rounded-2xl border border-slate-200 dark:border-slate-800"
                  />
                  <figcaption className="mt-2 text-xs text-slate-500 dark:text-slate-400">{img.alt}</figcaption>
                </figure>
              ))}

              <a
                href={c.app.href}
                target={LINK_TARGET}
                className="mt-8 inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-lg shadow-blue-600/20 transition-all"
              >
                {c.app.label}
                <ExternalLink size={16} aria-hidden="true" />
              </a>
            </article>
          ))}
        </div>
      </section>

      {/* Самопроверка */}
      <section className="mt-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-center text-slate-900 dark:text-white">
            Справитесь ли вы с подобным
          </h2>
          <ul className="mt-10 grid gap-3 sm:grid-cols-2">
            {SELF_CHECK.map(item => (
              <li
                key={item}
                className="flex items-start gap-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 text-slate-700 dark:text-slate-200"
              >
                <Check size={20} className="mt-0.5 shrink-0 text-green-500" aria-hidden="true" />
                {item}
              </li>
            ))}
          </ul>
          <p className="mt-6 text-center text-slate-600 dark:text-slate-300">
            Узнали себя хотя бы в трёх пунктах — переходите ко второму шагу и соберите первое приложение.
          </p>
        </div>
      </section>

      {/* Сообщество (#769): что даёт вступление после собеседования */}
      <section id="soobshchestvo" className="mt-24 px-4 sm:px-6 lg:px-8 scroll-mt-24">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-center text-slate-900 dark:text-white">{COMMUNITY.h}</h2>
          <p className="mt-4 text-center text-slate-600 dark:text-slate-300">{COMMUNITY.lead}</p>
          <ul className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {COMMUNITY.perks.map(perk => {
              const Icon = PERK_ICONS[perk.key as keyof typeof PERK_ICONS] ?? Check
              return (
                <li
                  key={perk.key}
                  className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6"
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600/10 text-blue-600 dark:text-blue-400">
                    <Icon size={20} aria-hidden="true" />
                  </span>
                  <h3 className="mt-4 font-semibold text-slate-900 dark:text-white">{perk.h}</h3>
                  <p className="mt-2 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{perk.p}</p>
                </li>
              )
            })}
          </ul>
          <div className="mt-8 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 p-6 text-center">
            <p className="text-slate-700 dark:text-slate-200 leading-relaxed">{COMMUNITY.solo}</p>
            <a
              href={COMMUNITY.soloCta.href}
              target={LINK_TARGET}
              className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600 dark:text-blue-400 hover:underline"
            >
              {COMMUNITY.soloCta.label}
              <ArrowRight size={14} aria-hidden="true" />
            </a>
          </div>
        </div>
      </section>

      {/* Заявка */}
      <section id="zayavka" className="mt-24 px-4 sm:px-6 lg:px-8 scroll-mt-24">
        <div className="max-w-2xl mx-auto rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl shadow-slate-900/5 p-6 sm:p-10">
          {stage === 'done' ? (
            <div className="py-8 text-center">
              <CheckCircle2 size={48} className="mx-auto text-green-500" aria-hidden="true" />
              <h2 className="mt-4 text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">Заявка у нас</h2>
              <p className="mt-3 text-slate-600 dark:text-slate-300 leading-relaxed">
                Напишем в Telegram — обычно в тот же рабочий день — и договоримся о коротком собеседовании.
              </p>
            </div>
          ) : (
            <form onSubmit={submitLead} noValidate>
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">Заявка в команду адептов</h2>
              <p className="mt-2 text-slate-600 dark:text-slate-300">
                После заявки — короткое собеседование в Telegram: расскажете о себе, мы покажем проекты изнутри.
              </p>


              <div className="mt-6 space-y-5">
                <div>
                  <label htmlFor="adept-name" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                    Имя
                  </label>
                  <input
                    id="adept-name"
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Имя"
                    autoComplete="name"
                    className={INPUT_CLASS}
                  />
                </div>
                <div>
                  <label htmlFor="adept-telegram" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                    Telegram
                  </label>
                  <input
                    id="adept-telegram"
                    type="text"
                    value={telegram}
                    onChange={e => setTelegram(e.target.value)}
                    placeholder="@username"
                    autoComplete="off"
                    className={INPUT_CLASS}
                  />
                </div>
                <div>
                  <label htmlFor="adept-experience" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                    Опыт работы
                  </label>
                  <textarea
                    id="adept-experience"
                    rows={4}
                    value={experience}
                    onChange={e => setExperience(e.target.value)}
                    placeholder={FORM_HINTS.experience}
                    className={INPUT_CLASS}
                  />
                </div>
              </div>

              {errorMsg && <p className="mt-4 text-red-500 dark:text-red-400 text-sm font-medium">{errorMsg}</p>}

              {CAPTCHA_CLIENT_KEY && !idbCookieFound && <div ref={captchaContainerRef} className="mt-4" />}

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
                    target={LINK_TARGET}
                    className="underline hover:text-blue-500 transition-colors"
                  >
                    обработку персональных данных
                  </a>
                </span>
              </label>

              <button
                type="submit"
                disabled={stage === 'sending' || !consentChecked}
                className="mt-6 inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl shadow-lg shadow-blue-600/20 transition-all"
              >
                {stage === 'sending' ? 'Отправляем…' : 'Отправить заявку'}
                {stage !== 'sending' && <Send size={16} aria-hidden="true" />}
              </button>
            </form>
          )}
        </div>
      </section>
    </div>
  )
}
