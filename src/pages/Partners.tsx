import { useEffect, useRef, useState, type FormEvent } from 'react'
import { CheckCircle2, Presentation, Send } from 'lucide-react'
import { reachGoal } from '../lib/metrika'
import {
  AUDIENCE,
  BOUNDARY,
  DECKS,
  DIRECT,
  FIRST_TEMPLATE,
  HERO_LEAD,
  JOIN,
  LEAD_SOURCE,
  LEVELS,
  MONEY,
  NO_PROMISES,
  OWN_TEMPLATE,
  PARTNERS_META,
  STEPS,
  leadSummary,
  type PartnerCard,
} from '../data/partners'

const SITE = 'https://ideav.ru'
const OG_IMAGE = `${SITE}/og/partners.png`

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
  if (!el) { el = document.createElement('link'); el.setAttribute('rel', 'canonical'); document.head.appendChild(el) }
  el.setAttribute('href', href)
}

const INPUT_CLASS =
  'mt-2 w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors'

const H2_CLASS = 'text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white'
const LEAD_CLASS = 'mt-4 text-lg text-slate-600 dark:text-slate-300 leading-relaxed'
const NOTE_CLASS = 'mt-6 text-slate-500 dark:text-slate-400 leading-relaxed'
const CARD_CLASS = 'rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6'

type FormStage = 'form' | 'sending' | 'done'

function Cards({ cards }: { cards: PartnerCard[] }) {
  return (
    <ul className="mt-8 grid gap-6 md:grid-cols-3">
      {cards.map(c => (
        <li key={c.h} className={CARD_CLASS}>
          {c.n && <span className="block text-sm font-semibold text-blue-600 dark:text-blue-400">{c.n}</span>}
          <h3 className={`${c.n ? 'mt-2 ' : ''}text-lg font-semibold text-slate-900 dark:text-white`}>{c.h}</h3>
          {c.big && <p className="mt-2 text-4xl font-extrabold text-blue-600 dark:text-blue-400">{c.big}</p>}
          <p className="mt-2 text-slate-600 dark:text-slate-300 leading-relaxed">{c.p}</p>
        </li>
      ))}
    </ul>
  )
}

/**
 * «Партнёрам» — /partners.html (issue #843), переехала с integram.io.
 * Заявка — как на остальных страницах: /telegram-notify.php, капча для
 * анонимов, согласие на ПДн, source=partners.
 */
export default function Partners() {
  const [name, setName] = useState('')
  const [company, setCompany] = useState('')
  const [contact, setContact] = useState('')
  const [email, setEmail] = useState('')
  const [comment, setComment] = useState('')
  const [consentChecked, setConsentChecked] = useState(false)
  const [captchaToken, setCaptchaToken] = useState('')
  // backlogram#910: куку читаем после гидрации — первый рендер обязан
  // совпасть с разметкой, отрисованной на сборке (без куки).
  const [idbCookieFound, setIdbCookieFound] = useState(false)
  useEffect(() => {
    if (hasIdbCookie()) setIdbCookieFound(true)
  }, [])
  const [stage, setStage] = useState<FormStage>('form')
  const [errorMsg, setErrorMsg] = useState('')
  const captchaContainerRef = useRef<HTMLDivElement>(null)
  const captchaWidgetIdRef = useRef<number | null>(null)

  useEffect(() => {
    document.title = PARTNERS_META.title
    const canonical = `${SITE}${PARTNERS_META.path}`
    setMetaTag('meta[name="description"]', 'name', 'description', PARTNERS_META.description)
    setMetaTag('meta[name="keywords"]', 'name', 'keywords', PARTNERS_META.keywords)
    setMetaTag('meta[property="og:type"]', 'property', 'og:type', 'website')
    setMetaTag('meta[property="og:title"]', 'property', 'og:title', PARTNERS_META.title)
    setMetaTag('meta[property="og:description"]', 'property', 'og:description', PARTNERS_META.description)
    setMetaTag('meta[property="og:url"]', 'property', 'og:url', canonical)
    setMetaTag('meta[property="og:site_name"]', 'property', 'og:site_name', 'Интеграм')
    setMetaTag('meta[property="og:locale"]', 'property', 'og:locale', 'ru_RU')
    setMetaTag('meta[property="og:image"]', 'property', 'og:image', OG_IMAGE)
    setMetaTag('meta[name="twitter:card"]', 'name', 'twitter:card', 'summary_large_image')
    setMetaTag('meta[name="twitter:image"]', 'name', 'twitter:image', OG_IMAGE)
    setMetaTag('meta[name="twitter:title"]', 'name', 'twitter:title', PARTNERS_META.title)
    setMetaTag('meta[name="twitter:description"]', 'name', 'twitter:description', PARTNERS_META.description)
    setCanonical(canonical)
  }, [])

  // Капча — как у ERP и квиза: вошедшим в Интеграм (cookie idb_*) не нужна,
  // скрипт грузится, только когда форма близко (#778).
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

    function loadCaptcha() {
      if (window.smartCaptcha) {
        initCaptcha()
        return
      }
      const script = document.createElement('script')
      script.src = 'https://smartcaptcha.yandexcloud.net/captcha.js'
      script.defer = true
      script.onload = initCaptcha
      document.head.appendChild(script)
    }

    let observer: IntersectionObserver | null = null
    if (captchaContainerRef.current && 'IntersectionObserver' in window) {
      observer = new IntersectionObserver(entries => {
        if (!entries.some(e => e.isIntersecting)) return
        observer?.disconnect()
        loadCaptcha()
      }, { rootMargin: '600px 0px' })
      observer.observe(captchaContainerRef.current)
    } else {
      loadCaptcha()
    }

    return () => {
      observer?.disconnect()
      if (captchaWidgetIdRef.current !== null && window.smartCaptcha && captchaContainerRef.current) {
        window.smartCaptcha.destroy(captchaWidgetIdRef.current)
        captchaWidgetIdRef.current = null
      }
    }
  }, [idbCookieFound])

  function submitLead(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!name.trim()) {
      setErrorMsg('Как к вам обращаться?')
      return
    }
    if (!contact.trim()) {
      setErrorMsg('Оставьте телефон или Telegram — так договоримся о показе.')
      return
    }
    if (CAPTCHA_CLIENT_KEY && !idbCookieFound && !captchaToken) {
      setErrorMsg('Пожалуйста, пройдите проверку капчи.')
      return
    }

    const data = new FormData()
    data.set('name', name.trim())
    data.set('company', company.trim())
    data.set('contact', contact.trim())
    data.set('task', leadSummary({ email, comment }))
    data.set('source', LEAD_SOURCE)
    if (CAPTCHA_CLIENT_KEY && !idbCookieFound) data.set('captcha_token', captchaToken)

    setStage('sending')
    setErrorMsg('')

    fetch('/telegram-notify.php', { method: 'POST', body: data })
      .then(res => res.json())
      .then(json => {
        if (json.ok) {
          reachGoal('lead', { source: LEAD_SOURCE })
          reachGoal('partners_lead')
          setStage('done')
        } else {
          setStage('form')
          setErrorMsg(json.error ?? `Не получилось отправить. Напишите нам в Telegram @${DIRECT.telegram}.`)
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
      <section className="relative isolate overflow-hidden px-4 sm:px-6 lg:px-8 pt-24 sm:pt-32 lg:pt-44 pb-12">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,rgba(37,99,235,0.10)_0%,transparent_60%)]" />
        <div className="max-w-4xl mx-auto">
          <p className="text-sm font-bold uppercase tracking-widest text-blue-600 dark:text-blue-400">Партнёрская программа</p>
          <h1 className="mt-3 text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            {PARTNERS_META.h1}
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-slate-600 dark:text-slate-300 leading-relaxed">{HERO_LEAD}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            {DECKS.map(d => (
              <a
                key={d.href}
                href={d.href}
                onClick={() => reachGoal('partners_deck', { deck: d.href })}
                className={
                  d.primary
                    ? 'inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-lg shadow-blue-600/20 transition-colors'
                    : 'inline-flex items-center gap-2 px-6 py-3 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 font-semibold rounded-xl transition-colors'
                }
              >
                <Presentation size={18} aria-hidden="true" />
                {d.label}
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Первый шаблон */}
      <section id="shablon" className="mt-12 px-4 sm:px-6 lg:px-8 scroll-mt-24">
        <div className="max-w-6xl mx-auto">
          <h2 className={H2_CLASS}>{FIRST_TEMPLATE.h}</h2>
          <p className={LEAD_CLASS}>{FIRST_TEMPLATE.p}</p>
          <div className="mt-8 rounded-2xl bg-slate-100 dark:bg-slate-900/60 p-6 font-mono text-sm sm:text-base overflow-x-auto">
            {FIRST_TEMPLATE.example.map(r => (
              <div key={r.label} className={`my-1 whitespace-pre ${r.mark ? 'text-blue-600 dark:text-blue-400' : 'text-slate-700 dark:text-slate-200'}`}>
                {r.label.padEnd(8, ' ')} → {r.text}
              </div>
            ))}
          </div>
          <Cards cards={FIRST_TEMPLATE.cards} />
        </div>
      </section>

      {/* Кому продавать */}
      <section id="komu" className="mt-24 px-4 sm:px-6 lg:px-8 scroll-mt-24">
        <div className="max-w-6xl mx-auto">
          <h2 className={H2_CLASS}>{AUDIENCE.h}</h2>
          <p className={LEAD_CLASS}>{AUDIENCE.p}</p>
          <Cards cards={AUDIENCE.cards} />
          <p className={NOTE_CLASS}>{AUDIENCE.note}</p>
        </div>
      </section>

      {/* Как проходит внедрение */}
      <section id="vnedrenie" className="mt-24 px-4 sm:px-6 lg:px-8 scroll-mt-24">
        <div className="max-w-6xl mx-auto">
          <h2 className={H2_CLASS}>{STEPS.h}</h2>
          <ol className="mt-8 divide-y divide-slate-200 dark:divide-slate-800 border-y border-slate-200 dark:border-slate-800">
            {STEPS.items.map((s, i) => (
              <li key={s.p} className="grid grid-cols-[3rem_1fr] sm:grid-cols-[3.5rem_1fr_10rem] gap-x-4 gap-y-1 py-4">
                <span className="font-semibold text-blue-600 dark:text-blue-400">{String(i + 1).padStart(2, '0')}</span>
                <span className="text-slate-800 dark:text-slate-100 leading-relaxed">{s.p}</span>
                <span className="col-start-2 sm:col-start-3 text-slate-500 dark:text-slate-400">{s.who}</span>
              </li>
            ))}
          </ol>
          <p className={NOTE_CLASS}>{STEPS.note}</p>
        </div>
      </section>

      {/* Уровни настройки */}
      <section id="urovni" className="mt-24 px-4 sm:px-6 lg:px-8 scroll-mt-24">
        <div className="max-w-6xl mx-auto">
          <h2 className={H2_CLASS}>{LEVELS.h}</h2>
          <Cards cards={LEVELS.cards} />
        </div>
      </section>

      {/* Заработок */}
      <section id="zarabotok" className="mt-24 px-4 sm:px-6 lg:px-8 scroll-mt-24">
        <div className="max-w-6xl mx-auto">
          <h2 className={H2_CLASS}>{MONEY.h}</h2>
          <Cards cards={MONEY.cards} />
          <p className={NOTE_CLASS}>{MONEY.note}</p>
        </div>
      </section>

      {/* Граница */}
      <section id="granica" className="mt-24 px-4 sm:px-6 lg:px-8 scroll-mt-24">
        <div className="max-w-6xl mx-auto">
          <h2 className={H2_CLASS}>{BOUNDARY.h}</h2>
          <p className={LEAD_CLASS}>{BOUNDARY.p}</p>
          <div className="mt-8 grid md:grid-cols-2 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden divide-y md:divide-y-0 md:divide-x divide-slate-200 dark:divide-slate-800">
            {[BOUNDARY.self, BOUNDARY.us].map(col => (
              <div key={col.h} className="p-6">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{col.h}</h3>
                <ul className="mt-3 list-disc pl-5 space-y-2 text-slate-600 dark:text-slate-300">
                  {col.items.map(it => <li key={it}>{it}</li>)}
                </ul>
              </div>
            ))}
          </div>
          <p className={NOTE_CLASS}>{BOUNDARY.note}</p>
        </div>
      </section>

      {/* Что не обещаем */}
      <section id="ne-obeshchaem" className="mt-24 px-4 sm:px-6 lg:px-8 scroll-mt-24">
        <div className="max-w-6xl mx-auto">
          <h2 className={H2_CLASS}>{NO_PROMISES.h}</h2>
          <Cards cards={NO_PROMISES.cards} />
        </div>
      </section>

      {/* Свой шаблон */}
      <section id="svoj-shablon" className="mt-24 px-4 sm:px-6 lg:px-8 scroll-mt-24">
        <div className="max-w-6xl mx-auto">
          <h2 className={H2_CLASS}>{OWN_TEMPLATE.h}</h2>
          <p className={LEAD_CLASS}>
            {OWN_TEMPLATE.before}
            <a href={OWN_TEMPLATE.link.href} className="text-blue-600 dark:text-blue-400 underline hover:no-underline">
              {OWN_TEMPLATE.link.label}
            </a>
            {OWN_TEMPLATE.after}
          </p>
          <p className={NOTE_CLASS}>{OWN_TEMPLATE.note}</p>
        </div>
      </section>

      {/* Заявка. На телефоне карточка во всю ширину: iframe капчи ровно 300 px (#778) */}
      <section id="zayavka" className="mt-24 sm:px-6 lg:px-8 scroll-mt-24">
        <div className="max-w-2xl mx-auto sm:rounded-3xl border-y sm:border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl shadow-slate-900/5 px-4 py-6 sm:p-10">
          {stage === 'done' ? (
            <div className="py-8 text-center">
              <CheckCircle2 size={48} className="mx-auto text-green-500" aria-hidden="true" />
              <h2 className="mt-4 text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">Спасибо!</h2>
              <p className="mt-3 text-slate-600 dark:text-slate-300 leading-relaxed">{JOIN.done}</p>
            </div>
          ) : (
            <form onSubmit={submitLead} noValidate>
              <h2 className={H2_CLASS}>{JOIN.h}</h2>
              <p className="mt-2 text-slate-600 dark:text-slate-300">{JOIN.p}</p>

              <div className="mt-6 space-y-5">
                <div>
                  <label htmlFor="pt-name" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Имя</label>
                  <input id="pt-name" type="text" value={name} onChange={e => setName(e.target.value)}
                    placeholder="Имя" autoComplete="name" className={INPUT_CLASS} />
                </div>
                <div>
                  <label htmlFor="pt-company" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Компания</label>
                  <input id="pt-company" type="text" value={company} onChange={e => setCompany(e.target.value)}
                    placeholder="Необязательно" autoComplete="organization" className={INPUT_CLASS} />
                </div>
                <div>
                  <label htmlFor="pt-contact" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Телефон или Telegram</label>
                  <input id="pt-contact" type="text" value={contact} onChange={e => setContact(e.target.value)}
                    placeholder="+7 … или @username" autoComplete="tel" className={INPUT_CLASS} />
                </div>
                <div>
                  <label htmlFor="pt-email" className="block text-sm font-medium text-slate-700 dark:text-slate-300">E-mail</label>
                  <input id="pt-email" type="email" value={email} onChange={e => setEmail(e.target.value)}
                    placeholder="Необязательно" autoComplete="email" className={INPUT_CLASS} />
                </div>
                <div>
                  <label htmlFor="pt-comment" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Есть клиент с такой задачей?</label>
                  <textarea id="pt-comment" rows={3} value={comment} onChange={e => setComment(e.target.value)}
                    placeholder="Необязательно: отрасль, объём каталога, сроки" className={INPUT_CLASS} />
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
                  <a href="/privacy.html" target="_blank" className="underline hover:text-blue-500 transition-colors">
                    обработку персональных данных
                  </a>
                </span>
              </label>
              {/* ideav/courses#3: условия партнёрской программы — публичная оферта. */}
              <p className="mt-3 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Условия программы —{' '}
                <a href="/partner-offer.html" target="_blank" className="underline hover:text-blue-500 transition-colors">оферта партнёрской программы</a>
                {' '}и{' '}
                <a href="/partner-adept.html" target="_blank" className="underline hover:text-blue-500 transition-colors">как работают партнёры и адепты</a>.
              </p>

              <button
                type="submit"
                disabled={stage === 'sending' || !consentChecked}
                className="mt-6 inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl shadow-lg shadow-blue-600/20 transition-colors"
              >
                {stage === 'sending' ? 'Отправляем…' : JOIN.cta}
                {stage !== 'sending' && <Send size={16} aria-hidden="true" />}
              </button>
            </form>
          )}
        </div>
        <p className="mt-6 max-w-2xl mx-auto px-4 sm:px-0 text-slate-500 dark:text-slate-400 leading-relaxed">
          Или напишите напрямую: телеграм{' '}
          <a href={`https://t.me/${DIRECT.telegram}`} className="text-blue-600 dark:text-blue-400 underline hover:no-underline">@{DIRECT.telegram}</a>,
          телефон{' '}
          <a href={`tel:${DIRECT.phoneHref}`} className="text-blue-600 dark:text-blue-400 underline hover:no-underline">{DIRECT.phone}</a>{' '}
          {DIRECT.hours}.
        </p>
      </section>
    </div>
  )
}
