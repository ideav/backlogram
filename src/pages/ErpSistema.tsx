import { useEffect, useRef, useState, type FormEvent } from 'react'
import { ArrowRight, BookOpen, Check, CheckCircle2, Send } from 'lucide-react'
import { reachGoal } from '../lib/metrika'
import {
  COMPARE,
  ERP_META,
  FAQ,
  FORM_HINTS,
  FORMULA,
  HERO_CHIPS,
  HERO_LEAD,
  MODULES,
  PROCESS,
  READ_MORE,
  RELATED,
} from '../data/erpSistema'

const SITE = 'https://ideav.ru'
const OG_IMAGE = `${SITE}/og/erp-sistema.png`

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

const INPUT_CLASS =
  'mt-2 w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors'

type FormStage = 'form' | 'sending' | 'done'

/**
 * «ERP-система со 100% кастомизацией» — /erp-sistema.html (issue #817).
 * Рекламный раздел: берём лучшие практики известных систем, повторяем нужные
 * функции, подстраиваем под клиента и добавляем своё. Заявка — тем же
 * механизмом, что на «Пути адепта» и в квизе (/telegram-notify.php, капча
 * для анонимов, согласие на ПДн), source=erp.
 *
 * Тексты — общий источник src/data/erpSistema.mjs со снапшотом
 * scripts/prerender-erp-sistema.mjs.
 */
export default function ErpSistema() {
  const [name, setName] = useState('')
  const [contact, setContact] = useState('')
  const [company, setCompany] = useState('')
  const [task, setTask] = useState('')
  const [consentChecked, setConsentChecked] = useState(false)
  const [captchaToken, setCaptchaToken] = useState('')
  const [idbCookieFound] = useState(() => hasIdbCookie())
  const [stage, setStage] = useState<FormStage>('form')
  const [errorMsg, setErrorMsg] = useState('')
  const captchaContainerRef = useRef<HTMLDivElement>(null)
  const captchaWidgetIdRef = useRef<number | null>(null)

  useEffect(() => {
    document.title = ERP_META.title
    const canonical = `${SITE}${ERP_META.path}`

    setMetaTag('meta[name="description"]', 'name', 'description', ERP_META.description)
    setMetaTag('meta[name="keywords"]', 'name', 'keywords', ERP_META.keywords)
    setMetaTag('meta[property="og:type"]', 'property', 'og:type', 'website')
    setMetaTag('meta[property="og:title"]', 'property', 'og:title', ERP_META.title)
    setMetaTag('meta[property="og:description"]', 'property', 'og:description', ERP_META.description)
    setMetaTag('meta[property="og:url"]', 'property', 'og:url', canonical)
    setMetaTag('meta[property="og:site_name"]', 'property', 'og:site_name', 'Интеграм')
    setMetaTag('meta[property="og:locale"]', 'property', 'og:locale', 'ru_RU')
    setMetaTag('meta[property="og:image"]', 'property', 'og:image', OG_IMAGE)
    setMetaTag('meta[name="twitter:card"]', 'name', 'twitter:card', 'summary_large_image')
    setMetaTag('meta[name="twitter:image"]', 'name', 'twitter:image', OG_IMAGE)
    setMetaTag('meta[name="twitter:title"]', 'name', 'twitter:title', ERP_META.title)
    setMetaTag('meta[name="twitter:description"]', 'name', 'twitter:description', ERP_META.description)
    setCanonical(canonical)
  }, [])

  // Капча — как у квиза, вошедшим в Интеграм (cookie idb_*) проверка не нужна.
  // Скрипт грузится, только когда форма близко: он тянет свою копию React,
  // которая сыпала в консоль ошибки #418/#423 на каждом заходе (#778).
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

  function goTo(href: string) {
    document.getElementById(href.slice(1))?.scrollIntoView({ behavior: 'smooth' })
  }

  function submitLead(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!name.trim()) {
      setErrorMsg('Как к вам обращаться?')
      return
    }
    if (!contact.trim()) {
      setErrorMsg('Оставьте телефон или Telegram — так договоримся о разборе.')
      return
    }
    if (CAPTCHA_CLIENT_KEY && !idbCookieFound && !captchaToken) {
      setErrorMsg('Пожалуйста, пройдите проверку капчи.')
      return
    }

    const summary = [
      'ERP со 100% кастомизацией /erp-sistema.html — заявка на разбор',
      task.trim() ? `Задача: ${task.trim()}` : 'Задача: не указана',
    ].join('\n')

    const data = new FormData()
    data.set('name', name.trim())
    data.set('company', company.trim())
    data.set('contact', contact.trim())
    data.set('task', summary)
    data.set('source', 'erp')
    if (CAPTCHA_CLIENT_KEY && !idbCookieFound) data.set('captcha_token', captchaToken)

    setStage('sending')
    setErrorMsg('')

    fetch('/telegram-notify.php', { method: 'POST', body: data })
      .then(res => res.json())
      .then(json => {
        if (json.ok) {
          // Общая цель lead (+ параметр источника) и своя цель раздела для Директа.
          reachGoal('lead', { source: 'erp' })
          reachGoal('erp_lead')
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
            {ERP_META.h1}
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
              onClick={() => goTo('#zayavka')}
              className="inline-flex items-center gap-2 px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-600/20 transition-colors"
            >
              Обсудить вашу ERP
              <ArrowRight size={18} aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => goTo('#formula')}
              className="inline-flex items-center gap-2 px-8 py-4 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 font-bold rounded-xl transition-colors"
            >
              Как это работает
            </button>
          </div>
        </div>
      </section>

      {/* Формула УТП */}
      <section id="formula" className="mt-12 px-4 sm:px-6 lg:px-8 scroll-mt-24">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-center text-slate-900 dark:text-white">
            Лучшие практики + ваши процессы + своё сверху
          </h2>
          <ol className="mt-10 grid gap-6 md:grid-cols-3">
            {FORMULA.map((s, i) => (
              <li
                key={s.h}
                className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white font-bold">
                  {i + 1}
                </span>
                <h3 className="mt-4 text-lg font-semibold text-slate-900 dark:text-white">{s.h}</h3>
                <p className="mt-2 text-slate-600 dark:text-slate-300 leading-relaxed">{s.p}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Контуры ERP */}
      <section id="kontury" className="mt-24 px-4 sm:px-6 lg:px-8 scroll-mt-24">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-center text-slate-900 dark:text-white">
            Контуры ERP: что берём из практики и как подстраиваем
          </h2>
          <ul className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {MODULES.map(m => (
              <li
                key={m.key}
                className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6"
              >
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{m.h}</h3>
                <p className="mt-3 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  <span className="font-semibold text-slate-800 dark:text-slate-100">Из практики: </span>
                  {m.best}
                </p>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  <span className="font-semibold text-blue-600 dark:text-blue-400">Под вас: </span>
                  {m.custom}
                </p>
                {m.href && (
                  <a href={m.href} className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline">
                    Подробнее о контуре
                    <ArrowRight size={14} aria-hidden="true" />
                  </a>
                )}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Три пути к ERP */}
      <section id="sravnenie" className="mt-24 px-4 sm:px-6 lg:px-8 scroll-mt-24">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-center text-slate-900 dark:text-white">
            Коробка, заказная разработка или сборка под процесс
          </h2>
          <div className="mt-10 overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
            <table className="w-full min-w-[640px] text-sm text-left">
              <thead className="bg-slate-50 dark:bg-slate-900/60">
                <tr>
                  {COMPARE.columns.map((c, i) => (
                    <th
                      key={i}
                      scope="col"
                      className={`px-4 py-3 font-semibold ${i === 3 ? 'text-blue-600 dark:text-blue-400' : 'text-slate-900 dark:text-white'}`}
                    >
                      {c}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800 bg-white dark:bg-slate-900">
                {COMPARE.rows.map(row => (
                  <tr key={row[0]}>
                    {row.map((cell, i) =>
                      i === 0 ? (
                        <th key={i} scope="row" className="px-4 py-3 font-medium text-slate-900 dark:text-white">
                          {cell}
                        </th>
                      ) : (
                        <td
                          key={i}
                          className={`px-4 py-3 ${i === 3 ? 'font-medium text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-300'}`}
                        >
                          {cell}
                        </td>
                      ),
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Как идёт проект */}
      <section id="etapy" className="mt-24 px-4 sm:px-6 lg:px-8 scroll-mt-24">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-center text-slate-900 dark:text-white">
            Как идёт проект и сколько стоит
          </h2>
          <ol className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {PROCESS.map((s, i) => (
              <li
                key={s.h}
                className="flex flex-col rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6"
              >
                <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">Шаг {i + 1}</span>
                <h3 className="mt-2 text-lg font-semibold text-slate-900 dark:text-white">{s.h}</h3>
                <p className="mt-2 text-xl font-bold text-slate-900 dark:text-white">{s.price}</p>
                <p className="mt-3 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{s.p}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Та же мысль под другим углом (#817): база знаний и блог */}
      <section id="pochitat" className="mt-24 px-4 sm:px-6 lg:px-8 scroll-mt-24">
        <div className="max-w-4xl mx-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 p-6 sm:p-8">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">Почитать подробнее</h2>
          <p className="mt-2 text-slate-600 dark:text-slate-300">
            Если формулировки выше показались слишком рекламными — тот же подход разобран спокойно и с ограничениями:
          </p>
          <ul className="mt-4 space-y-2">
            {READ_MORE.map(l => (
              <li key={l.href}>
                <a href={l.href} className="inline-flex items-start gap-2 font-medium text-blue-600 dark:text-blue-400 hover:underline">
                  <BookOpen size={18} className="mt-0.5 shrink-0" aria-hidden="true" />
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
          <p className="mt-6 text-sm text-slate-500 dark:text-slate-400">
            Смежное:{' '}
            {RELATED.map((l, i) => (
              <span key={l.href}>
                {i > 0 && ' · '}
                <a href={l.href} className="underline hover:text-blue-500 transition-colors">{l.label}</a>
              </span>
            ))}
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="mt-24 px-4 sm:px-6 lg:px-8 scroll-mt-24">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-center text-slate-900 dark:text-white">Частые вопросы</h2>
          <div className="mt-10 space-y-3">
            {FAQ.map(item => (
              <details
                key={item.q}
                className="group rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5"
              >
                <summary className="cursor-pointer list-none font-semibold text-slate-900 dark:text-white">{item.q}</summary>
                <p className="mt-3 text-slate-600 dark:text-slate-300 leading-relaxed">{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Заявка. На телефоне карточка во всю ширину: iframe капчи ровно 300 px (#778) */}
      <section id="zayavka" className="mt-24 sm:px-6 lg:px-8 scroll-mt-24">
        <div className="max-w-2xl mx-auto sm:rounded-3xl border-y sm:border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl shadow-slate-900/5 px-4 py-6 sm:p-10">
          {stage === 'done' ? (
            <div className="py-8 text-center">
              <CheckCircle2 size={48} className="mx-auto text-green-500" aria-hidden="true" />
              <h2 className="mt-4 text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">Заявка у нас</h2>
              <p className="mt-3 text-slate-600 dark:text-slate-300 leading-relaxed">
                Свяжемся в тот же рабочий день и договоримся о первом разговоре про ваши процессы.
              </p>
            </div>
          ) : (
            <form onSubmit={submitLead} noValidate>
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">Обсудить вашу ERP</h2>
              <p className="mt-2 text-slate-600 dark:text-slate-300">
                Расскажите, что хотите автоматизировать, — предложим, с какого контура начать и во что обойдётся пилот.
              </p>

              <div className="mt-6 space-y-5">
                <div>
                  <label htmlFor="erp-name" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Имя</label>
                  <input id="erp-name" type="text" value={name} onChange={e => setName(e.target.value)}
                    placeholder="Имя" autoComplete="name" className={INPUT_CLASS} />
                </div>
                <div>
                  <label htmlFor="erp-contact" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Телефон или Telegram</label>
                  <input id="erp-contact" type="text" value={contact} onChange={e => setContact(e.target.value)}
                    placeholder="+7 … или @username" autoComplete="tel" className={INPUT_CLASS} />
                </div>
                <div>
                  <label htmlFor="erp-company" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Компания</label>
                  <input id="erp-company" type="text" value={company} onChange={e => setCompany(e.target.value)}
                    placeholder="Необязательно" autoComplete="organization" className={INPUT_CLASS} />
                </div>
                <div>
                  <label htmlFor="erp-task" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Что хотите автоматизировать</label>
                  <textarea id="erp-task" rows={4} value={task} onChange={e => setTask(e.target.value)}
                    placeholder={FORM_HINTS.task} className={INPUT_CLASS} />
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
                    target="_blank"
                    className="underline hover:text-blue-500 transition-colors"
                  >
                    обработку персональных данных
                  </a>
                </span>
              </label>

              <button
                type="submit"
                disabled={stage === 'sending' || !consentChecked}
                className="mt-6 inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl shadow-lg shadow-blue-600/20 transition-colors"
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
