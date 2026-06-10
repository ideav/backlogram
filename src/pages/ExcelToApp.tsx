import React from 'react'
import { motion } from 'framer-motion'
import {
  FileSpreadsheet,
  UploadCloud,
  ArrowRight,
  CheckCircle2,
  Clock,
  Sparkles,
  ShieldCheck,
  Send,
  Trash2,
  Mail,
  MessageSquare,
  Archive,
  Wallet,
} from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'

declare global {
  interface Window {
    smartCaptcha?: {
      getResponse: (widgetId: number) => string
      reset: (widgetId: number) => void
      render: (container: HTMLElement | string, params: {
        sitekey: string
        callback?: (token: string) => void
        'error-callback'?: () => void
        'expired-callback'?: () => void
      }) => number
      destroy: (widgetId: number) => void
    }
  }
}

type FormState = 'idle' | 'sending' | 'success' | 'error'

const CAPTCHA_CLIENT_KEY = (import.meta.env.VITE_SMARTCAPTCHA_CLIENT_KEY as string | undefined) ?? ''

// Endpoint that accepts the form with attachments. Built in activity A2 (#304)
// as an extension of public/telegram-notify.php; the landing only needs to POST here.
const SUBMIT_ENDPOINT = '/excel-to-app.php'

// Accepted spreadsheet types. Matches the formats people export from Excel,
// Google Sheets and 1С.
const ACCEPTED_EXTENSIONS = ['.xls', '.xlsx', '.xlsm', '.csv', '.ods']
const ACCEPT_ATTR = ACCEPTED_EXTENSIONS.join(',')
const MAX_FILE_BYTES = 25 * 1024 * 1024 // 25 MB per file
const MAX_FILES = 10

// Visitors who received the "заберите свою базу" email arrive at
// /excel-to-app.html#12500. That hash reveals — and focuses — the payment
// offer below; without it the block stays hidden. Same hash-reveal pattern as
// start.html#reg (#promoForm), kept here so the email's payment link works.
const PAYMENT_HASH = '#12500'
// Tochka checkout link for the 12 500 ₽ offer. Same two-step pattern as
// start.html #promoButton/#promoPayButton: the CTA reveals an email field,
// validates it, then redirects to the payment page.
const PAYMENT_CHECKOUT_URL = 'https://checkout.tochka.com/cc7f594c-58a5-4ada-8c13-91b678ac2868'

// Payment email is only validated client-side before redirect (mirrors
// start.html's #promoPayButton); it is not sent anywhere.
function isPaymentEmailValid(email: string): boolean {
  return /^[^\s@]+@([^\s@]+\.)+[^\s@]+$/.test(email)
}

function hasIdbCookie(): boolean {
  return document.cookie.split(';').some(c => c.trimStart().startsWith('idb_'))
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} Б`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} КБ`
  return `${(bytes / (1024 * 1024)).toFixed(1)} МБ`
}

function hasAcceptedExtension(name: string): boolean {
  const lower = name.toLowerCase()
  return ACCEPTED_EXTENSIONS.some(ext => lower.endsWith(ext))
}

export default function ExcelToApp() {
  const { hash } = useLocation()
  const showPaymentOffer = hash === PAYMENT_HASH
  const paymentRef = React.useRef<HTMLElement>(null)

  // Bring the payment offer into focus the moment it is revealed — the email
  // promises this block, so it must lead the page (App's ScrollToRouteTarget
  // also targets id="12500", this guarantees focus even on client navigation).
  React.useEffect(() => {
    if (!showPaymentOffer) return
    const el = paymentRef.current
    if (!el) return
    el.scrollIntoView({ behavior: 'smooth' })
    el.focus({ preventScroll: true })
  }, [showPaymentOffer])

  const [formState, setFormState] = React.useState<FormState>('idle')
  const [errorMsg, setErrorMsg] = React.useState('')
  const [files, setFiles] = React.useState<File[]>([])
  const [topic, setTopic] = React.useState('')
  const [contact, setContact] = React.useState('')
  const [consentChecked, setConsentChecked] = React.useState(false)
  const [captchaToken, setCaptchaToken] = React.useState('')
  const [isCaptchaRequested, setIsCaptchaRequested] = React.useState(false)
  const [isDragging, setIsDragging] = React.useState(false)
  const [idbCookieFound] = React.useState(() => hasIdbCookie())
  const fileInputRef = React.useRef<HTMLInputElement>(null)
  const captchaContainerRef = React.useRef<HTMLDivElement>(null)
  const captchaWidgetIdRef = React.useRef<number | null>(null)

  // Two-step payment CTA (mirrors start.html #promoButton/#promoPayButton):
  // step 1 reveals the email field, step 2 validates and redirects to checkout.
  const [showPayForm, setShowPayForm] = React.useState(false)
  const [payEmail, setPayEmail] = React.useState('')
  const [payError, setPayError] = React.useState('')

  const handlePay = () => {
    const email = payEmail.trim()
    if (!email) {
      setPayError('Введите email')
      return
    }
    if (!isPaymentEmailValid(email)) {
      setPayError('Введите корректный email (например, name@example.com)')
      return
    }
    setPayError('')
    window.location.href = PAYMENT_CHECKOUT_URL
  }

  // Mirror the CTA form: SmartCaptcha is loaded lazily, only once the visitor
  // starts filling the form, and skipped entirely for known users (idb_* cookie).
  React.useEffect(() => {
    if (!CAPTCHA_CLIENT_KEY || !isCaptchaRequested || idbCookieFound) return

    function initCaptcha() {
      if (!captchaContainerRef.current || !window.smartCaptcha) return
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
      if (captchaWidgetIdRef.current !== null && window.smartCaptcha) {
        window.smartCaptcha.destroy(captchaWidgetIdRef.current)
        captchaWidgetIdRef.current = null
      }
    }
  }, [isCaptchaRequested, idbCookieFound])

  function addFiles(incoming: FileList | File[]) {
    setIsCaptchaRequested(true)
    const list = Array.from(incoming)
    const accepted: File[] = []
    let rejected = false
    let tooBig = false
    for (const file of list) {
      if (!hasAcceptedExtension(file.name)) {
        rejected = true
        continue
      }
      if (file.size > MAX_FILE_BYTES) {
        tooBig = true
        continue
      }
      accepted.push(file)
    }

    setFiles(prev => {
      // De-duplicate by name + size so re-selecting the same file is a no-op.
      const seen = new Set(prev.map(f => `${f.name}:${f.size}`))
      const merged = [...prev]
      for (const file of accepted) {
        const key = `${file.name}:${file.size}`
        if (!seen.has(key)) {
          seen.add(key)
          merged.push(file)
        }
      }
      return merged.slice(0, MAX_FILES)
    })

    if (tooBig) {
      setErrorMsg(`Каждый файл должен быть не больше ${formatBytes(MAX_FILE_BYTES)}.`)
      setFormState('error')
    } else if (rejected) {
      setErrorMsg(`Поддерживаются только таблицы: ${ACCEPTED_EXTENSIONS.join(', ')}.`)
      setFormState('error')
    } else if (formState === 'error') {
      setFormState('idle')
      setErrorMsg('')
    }
  }

  function removeFile(index: number) {
    setFiles(prev => prev.filter((_, i) => i !== index))
  }

  function handleDrop(e: React.DragEvent<HTMLLabelElement>) {
    e.preventDefault()
    setIsDragging(false)
    if (e.dataTransfer?.files?.length) {
      addFiles(e.dataTransfer.files)
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()

    if (files.length === 0) {
      setErrorMsg('Прикрепите хотя бы один Excel-файл.')
      setFormState('error')
      return
    }
    if (!topic.trim()) {
      setErrorMsg('Опишите тематику будущего приложения.')
      setFormState('error')
      return
    }
    if (!contact.trim()) {
      setErrorMsg('Укажите контакт — email или Telegram, куда прислать ссылку.')
      setFormState('error')
      return
    }

    const captchaActive = Boolean(CAPTCHA_CLIENT_KEY) && !idbCookieFound
    if (captchaActive && !captchaToken) {
      setErrorMsg('Пожалуйста, пройдите проверку капчи.')
      setFormState('error')
      return
    }

    setFormState('sending')
    setErrorMsg('')

    const payload = new FormData()
    payload.append('source', 'excel-to-app')
    payload.append('topic', topic.trim())
    payload.append('contact', contact.trim())
    // `task` mirrors the CTA form field so the shared notifier understands it.
    payload.append('task', topic.trim())
    if (captchaActive) {
      payload.append('captcha_token', captchaToken)
    }
    for (const file of files) {
      payload.append('files[]', file, file.name)
    }

    try {
      const res = await fetch(SUBMIT_ENDPOINT, {
        method: 'POST',
        body: payload,
      })
      const json = await res.json().catch(() => ({ ok: false }))
      if (res.ok && json.ok) {
        setFormState('success')
        setFiles([])
        setTopic('')
        setContact('')
        setConsentChecked(false)
        setCaptchaToken('')
        setIsCaptchaRequested(false)
        if (captchaWidgetIdRef.current !== null && window.smartCaptcha) {
          window.smartCaptcha.reset(captchaWidgetIdRef.current)
        }
      } else {
        setFormState('error')
        setErrorMsg(json.error ?? 'Не удалось отправить заявку. Попробуйте позже.')
        if (captchaWidgetIdRef.current !== null && window.smartCaptcha) {
          window.smartCaptcha.reset(captchaWidgetIdRef.current)
          setCaptchaToken('')
        }
      }
    } catch {
      setFormState('error')
      setErrorMsg('Не удалось отправить запрос. Проверьте соединение.')
    }
  }

  const steps = [
    {
      icon: <UploadCloud size={22} />,
      title: 'Загружаете Excel',
      text: 'Один или несколько файлов — прайсы, склад, клиенты, заказы. Как есть, без подготовки.',
    },
    {
      icon: <MessageSquare size={22} />,
      title: 'Описываете тематику',
      text: 'Пара слов о том, чем занимаетесь и что хотите автоматизировать. Контакт для ответа.',
    },
    {
      icon: <Sparkles size={22} />,
      title: 'Получаете приложение',
      text: 'Через ~45 минут пришлём ссылку на готовую базу Интеграм с вашими данными.',
    },
  ]

  return (
    <div className="overflow-hidden">
      {/* Payment offer — shown only for visitors arriving via the email link
          /excel-to-app.html#12500. Hidden (and absent from prerender/SEO) otherwise. */}
      {showPaymentOffer && (
        <section
          id="12500"
          ref={paymentRef}
          tabIndex={-1}
          className="scroll-mt-24 outline-none pt-32 pb-12 lg:pt-44 lg:pb-16"
        >
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="rounded-2xl sm:rounded-3xl border border-blue-500/30 bg-gradient-to-b from-blue-50 to-white dark:from-blue-950/40 dark:to-slate-950 shadow-xl dark:shadow-2xl px-4 py-8 sm:p-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-blue-500/30 text-blue-500 dark:text-blue-400 text-sm font-medium mb-6">
                <Clock size={14} />
                Демонстрация доступна 3 часа
              </div>

              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight mb-4">
                Заберите свою базу данных, <span className="text-blue-500 italic">созданную ИИ</span>
              </h2>

              <p className="text-lg text-slate-600 dark:text-slate-300 leading-relaxed mb-8">
                Это демонстрация, которую вы можете забрать себе в течение 3 часов за{' '}
                <span className="font-bold text-slate-900 dark:text-white">12 500 ₽</span>.
                Ограничение по времени связано с текущим большим наплывом пользователей.
              </p>

              <ul className="space-y-4 mb-8">
                <li className="flex items-start gap-3 text-slate-600 dark:text-slate-300">
                  <Archive size={20} className="text-blue-500 shrink-0 mt-0.5" />
                  <span>
                    Ваша база в любом случае не пропадёт: она будет заархивирована и может быть
                    восстановлена позже за{' '}
                    <span className="font-semibold text-slate-900 dark:text-white">28 500 ₽</span>.
                  </span>
                </li>
                <li className="flex items-start gap-3 text-slate-600 dark:text-slate-300">
                  <Sparkles size={20} className="text-blue-500 shrink-0 mt-0.5" />
                  <span>
                    Дальше дорабатываете самостоятельно или с нашей помощью — стоимость владения{' '}
                    <span className="font-semibold text-slate-900 dark:text-white">1 950 ₽ в месяц</span>.
                  </span>
                </li>
              </ul>

              {!showPayForm ? (
                <button
                  type="button"
                  onClick={() => setShowPayForm(true)}
                  className="w-full sm:w-auto px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-600/20 transition-all inline-flex items-center justify-center gap-2 group"
                >
                  <Wallet size={18} />
                  Оплатить 12 500 ₽ и забрать базу
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </button>
              ) : (
                <div className="max-w-sm">
                  <label htmlFor="pay-email" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Email для оплаты
                  </label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      id="pay-email"
                      type="email"
                      autoFocus
                      value={payEmail}
                      onChange={e => { setPayEmail(e.target.value); if (payError) setPayError('') }}
                      onKeyDown={e => { if (e.key === 'Enter') handlePay() }}
                      placeholder="your@email.com"
                      className={`w-full pl-9 pr-3 py-3 rounded-xl border bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${payError ? 'border-red-500' : 'border-slate-300 dark:border-slate-700'}`}
                    />
                  </div>
                  {payError && (
                    <p className="mt-2 text-sm text-red-600 dark:text-red-400">{payError}</p>
                  )}
                  <button
                    type="button"
                    onClick={handlePay}
                    className="mt-4 w-full sm:w-auto px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-600/20 transition-all inline-flex items-center justify-center gap-2 group"
                  >
                    <Wallet size={18} />
                    Оплатить 12 500 ₽
                    <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              )}

              <p className="mt-4 text-sm text-slate-400 dark:text-slate-500">
                После оплаты пришлём доступ к вашей базе Интеграм.
              </p>
            </div>
          </div>
        </section>
      )}

      {/* Hero */}
      <section className="relative isolate overflow-hidden pt-32 pb-16 lg:pt-44 lg:pb-24">
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-[radial-gradient(circle_at_center,rgba(37,99,235,0.10)_0%,transparent_70%)]" />
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/20 to-transparent" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-blue-500/30 text-blue-500 dark:text-blue-400 text-sm font-medium mb-6"
          >
            <Clock size={14} />
            Готово примерно за 45 минут
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-8"
          >
            Загрузите Excel — <span className="text-blue-500 italic">получите приложение</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="max-w-3xl mx-auto text-lg md:text-xl text-slate-600 dark:text-slate-300 leading-relaxed mb-10"
          >
            Пришлите свои таблицы и пару слов о задаче. Мы превратим их в работающее
            веб-приложение на платформе Интеграм — быстрее, чем вы найдёте фрилансера.
            Никаких формул, макросов и настройки — только готовый результат со ссылкой.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex justify-center"
          >
            <a
              href="#excel-form"
              className="w-full sm:w-auto px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-600/20 transition-all flex items-center justify-center gap-2 group"
            >
              Загрузить файлы
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </a>
          </motion.div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 border-t border-slate-200 dark:border-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid gap-6 md:grid-cols-3">
            {steps.map((step, i) => (
              <div
                key={i}
                className="relative p-8 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-sm dark:shadow-none"
              >
                <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-5">
                  {step.icon}
                </div>
                <div className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">
                  Шаг {i + 1}
                </div>
                <h3 className="text-xl font-bold mb-2">{step.title}</h3>
                <p className="text-slate-500 dark:text-slate-400 leading-relaxed">{step.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Form */}
      <section id="excel-form" className="scroll-mt-24 py-20 border-t border-slate-200 dark:border-slate-900">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-slate-50 dark:bg-slate-900/50 px-4 py-6 sm:p-10 rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl dark:shadow-2xl">
            {formState === 'success' ? (
              <div className="text-center py-8 space-y-6">
                <div className="flex justify-center">
                  <CheckCircle2 className="w-20 h-20 text-green-500" strokeWidth={1.5} />
                </div>
                <div className="space-y-3">
                  <h2 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-slate-50">
                    Заявка принята!
                  </h2>
                  <p className="text-slate-500 dark:text-slate-400 text-lg leading-relaxed">
                    Мы уже взялись за ваши файлы. Примерно через 45 минут пришлём ссылку на
                    готовую базу Интеграм на указанный контакт.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setFormState('idle')}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors"
                >
                  Отправить ещё файлы
                </button>
              </div>
            ) : (
              <form className="space-y-6" onSubmit={handleSubmit} noValidate>
                <div>
                  <h2 className="text-2xl md:text-3xl font-bold mb-2">Загрузите свои таблицы</h2>
                  <p className="text-slate-500 dark:text-slate-400">
                    Excel, CSV или Google Sheets-экспорт. Всё остальное сделаем мы.
                  </p>
                </div>

                {/* File upload / dropzone */}
                <div>
                  <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 ml-1">
                    Excel-файлы
                  </label>
                  <label
                    onDragOver={e => {
                      e.preventDefault()
                      setIsDragging(true)
                    }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={handleDrop}
                    className={`flex flex-col items-center justify-center gap-3 px-4 py-10 text-center border-2 border-dashed rounded-2xl cursor-pointer transition-colors ${
                      isDragging
                        ? 'border-blue-500 bg-blue-50/60 dark:bg-blue-950/30'
                        : 'border-slate-300 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-600 bg-white dark:bg-slate-950'
                    }`}
                  >
                    <UploadCloud size={32} className="text-blue-500" />
                    <div className="text-sm text-slate-600 dark:text-slate-300">
                      <span className="font-semibold text-blue-600 dark:text-blue-400">Выберите файлы</span>
                      {' '}или перетащите их сюда
                    </div>
                    <div className="text-xs text-slate-400 dark:text-slate-500">
                      {ACCEPTED_EXTENSIONS.join(', ')} · до {formatBytes(MAX_FILE_BYTES)} каждый · до {MAX_FILES} файлов
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      name="files"
                      multiple
                      accept={ACCEPT_ATTR}
                      className="sr-only"
                      onChange={e => {
                        if (e.target.files?.length) addFiles(e.target.files)
                        // Reset so selecting the same file again re-triggers onChange.
                        e.target.value = ''
                      }}
                    />
                  </label>

                  {files.length > 0 && (
                    <ul className="mt-3 space-y-2">
                      {files.map((file, i) => (
                        <li
                          key={`${file.name}:${file.size}:${i}`}
                          className="flex items-center gap-3 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950"
                        >
                          <FileSpreadsheet size={18} className="text-green-600 dark:text-green-400 shrink-0" />
                          <span className="flex-1 truncate text-sm text-slate-700 dark:text-slate-200">{file.name}</span>
                          <span className="text-xs text-slate-400 dark:text-slate-500 shrink-0">{formatBytes(file.size)}</span>
                          <button
                            type="button"
                            onClick={() => removeFile(i)}
                            aria-label={`Убрать файл ${file.name}`}
                            className="text-slate-400 hover:text-red-500 transition-colors shrink-0"
                          >
                            <Trash2 size={16} />
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* Topic */}
                <div>
                  <label htmlFor="excel-topic" className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 ml-1">
                    Тематика
                  </label>
                  <textarea
                    id="excel-topic"
                    name="topic"
                    rows={3}
                    value={topic}
                    onInput={() => setIsCaptchaRequested(true)}
                    onChange={e => setTopic(e.target.value)}
                    className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-slate-800 dark:text-slate-100 focus:border-blue-500 outline-none transition-all resize-none"
                    placeholder="Например: учёт заказов в пекарне — клиенты, позиции, статусы доставки."
                  />
                </div>

                {/* Contact */}
                <div>
                  <label htmlFor="excel-contact" className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 ml-1">
                    Контакт — email или Telegram
                  </label>
                  <input
                    id="excel-contact"
                    name="contact"
                    type="text"
                    value={contact}
                    onInput={() => setIsCaptchaRequested(true)}
                    onChange={e => setContact(e.target.value)}
                    className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-slate-800 dark:text-slate-100 focus:border-blue-500 outline-none transition-all"
                    placeholder="@username или mail@company.ru"
                  />
                </div>

                {formState === 'error' && (
                  <div className="text-red-500 dark:text-red-400 text-sm font-medium">{errorMsg}</div>
                )}

                {CAPTCHA_CLIENT_KEY && !idbCookieFound && isCaptchaRequested && (
                  <div ref={captchaContainerRef} />
                )}

                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={consentChecked}
                    onChange={e => setConsentChecked(e.target.checked)}
                    className="mt-0.5 h-4 w-4 shrink-0 rounded border-slate-300 dark:border-slate-600 accent-blue-600 cursor-pointer"
                  />
                  <span className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    Я даю согласие на{' '}
                    <a
                      href="/privacy"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline hover:text-blue-500 transition-colors"
                    >
                      обработку персональных данных
                    </a>
                  </span>
                </label>

                <button
                  type="submit"
                  disabled={formState === 'sending' || !consentChecked}
                  className="w-full py-3 sm:py-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl shadow-lg shadow-blue-600/20 transition-all flex items-center justify-center gap-2"
                >
                  {formState === 'sending' ? 'Отправка...' : 'Отправить и получить приложение'}
                  {formState !== 'sending' && <Send size={18} />}
                </button>

                <div className="flex items-center justify-center gap-2 text-xs text-slate-400 dark:text-slate-500">
                  <ShieldCheck size={14} />
                  Файлы используются только для сборки вашего приложения
                </div>
              </form>
            )}
          </div>

          <p className="mt-8 text-center text-sm text-slate-500 dark:text-slate-400">
            Остались вопросы? Напишите нам:{' '}
            <a href="https://t.me/qdmadept" className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline">
              <MessageSquare size={14} /> @qdmadept
            </a>
            {' '}·{' '}
            <a href="mailto:abc@integram.io" className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline">
              <Mail size={14} /> abc@integram.io
            </a>
          </p>

          <p className="mt-4 text-center text-sm">
            <Link to="/" className="text-slate-400 dark:text-slate-500 hover:text-blue-500 transition-colors">
              ← На главную
            </Link>
          </p>
        </div>
      </section>
    </div>
  )
}
