import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Send,
  Paperclip,
  Trash2,
  Sparkles,
  ShieldCheck,
  Server,
  Boxes,
  FileSpreadsheet,
  Database,
  ListChecks,
  MessageSquare,
  KeyRound,
  Layers,
  Users,
  Gauge,
  Settings2,
  BarChart3,
  GitCompare,
  Wallet,
  TrendingUp,
  Clock,
  Archive,
} from 'lucide-react'
import { reachGoal } from '../lib/metrika'
import { USE_CASES } from '../data/usecases'
import type { UseCase } from '../data/usecases'

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

// Строковые имена иконок из data → компоненты lucide.
const ICONS: Record<string, typeof Database> = {
  ListChecks, MessageSquare, KeyRound, Layers, Users, Gauge, Settings2,
  BarChart3, Database, GitCompare, Wallet, ShieldCheck, TrendingUp, Clock,
  Archive, Boxes, FileSpreadsheet, Server,
}

// Натуральные размеры скриншотов — чтобы браузер зарезервировал место (без CLS).
const IMG_SIZE: Record<string, { w: number; h: number }> = {
  '/uc-zayavki.jpg': { w: 1600, h: 900 },
  '/uc-proekty.jpg': { w: 1536, h: 1024 },
  '/case-pdn.png': { w: 1126, h: 752 },
  '/case-orbita-planner.png': { w: 2006, h: 1077 },
  '/case-sovereignty-audit.png': { w: 2042, h: 1252 },
}
function Icon({ name, size = 24 }: { name: string; size?: number }) {
  const Cmp = ICONS[name] ?? Boxes
  return <Cmp size={size} />
}

type FormState = 'idle' | 'sending' | 'success' | 'error'

const CAPTCHA_CLIENT_KEY = (import.meta.env.VITE_SMARTCAPTCHA_CLIENT_KEY as string | undefined) ?? ''
// Общий обработчик приёма заявок (A2). Поле source различает страницу-нишу
// (см. public/excel-to-app.php, $SOURCE_LABELS).
const SUBMIT_ENDPOINT = '/excel-to-app.php'

const ACCEPTED_EXTENSIONS = ['.xlsx', '.xls', '.csv', '.ods']
const ACCEPT_ATTR = ACCEPTED_EXTENSIONS.join(',')
const MAX_FILE_BYTES = 25 * 1024 * 1024

const SITE = 'https://ideav.ru'

// Общие для всех ниш блоки — намеренно вынесены из data, но уникальный контент
// (h1, боли, возможности, FAQ, title/description) у каждой страницы свой.
const STEPS = [
  { icon: 'FileSpreadsheet', title: '1. Отправляете свои Excel', body: 'Свои таблицы как есть или просто описываете задачу словами.' },
  { icon: 'Gauge', title: '2. Настраиваем под вас', body: 'Собираем структуру данных, рабочие места и отчёты под вашу задачу — обычно за 24 часа.' },
  { icon: 'CheckCircle2', title: '3. Получаете решение', body: 'Ссылка на готовую базу Интеграм с данными, отчётами и ролями. Демо за 1 день.' },
]
const FACTS = [
  { icon: 'Database', value: 'до 2 000 000', label: 'записей в одной базе' },
  { icon: 'Clock', value: '24 часа', label: 'настройка под задачу' },
  { icon: 'KeyRound', value: 'Роли доступа', label: 'кто что видит и меняет' },
  { icon: 'Server', value: 'Россия, on-premise', label: 'данные на вашем сервере' },
]

function hasIdbCookie(): boolean {
  return document.cookie.split(';').some((c) => c.trimStart().startsWith('idb_'))
}
function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} Б`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} КБ`
  return `${(bytes / (1024 * 1024)).toFixed(1)} МБ`
}
function hasAcceptedExtension(name: string): boolean {
  const lower = name.toLowerCase()
  return ACCEPTED_EXTENSIONS.some((ext) => lower.endsWith(ext))
}
function setMetaTag(selector: string, attr: 'name' | 'property', key: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(selector)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, key)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}
function setCanonical(href: string) {
  let el = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')
  if (!el) {
    el = document.createElement('link')
    el.setAttribute('rel', 'canonical')
    document.head.appendChild(el)
  }
  el.setAttribute('href', href)
}

function FileInput({ id, label, hint, file, onPick, onClear }: {
  id: string; label: string; hint: string; file: File | null
  onPick: (file: File | undefined) => void; onClear: () => void
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 ml-1">
        {label}
      </label>
      {file ? (
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
          <FileSpreadsheet size={18} className="text-green-600 dark:text-green-400 shrink-0" />
          <span className="flex-1 truncate text-sm text-slate-700 dark:text-slate-200">{file.name}</span>
          <span className="text-xs text-slate-400 dark:text-slate-500 shrink-0">{formatBytes(file.size)}</span>
          <button type="button" onClick={onClear} aria-label={`Убрать файл ${file.name}`} className="text-slate-400 hover:text-red-500 transition-colors shrink-0">
            <Trash2 size={16} />
          </button>
        </div>
      ) : (
        <label htmlFor={id} className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-600 bg-white dark:bg-slate-950 cursor-pointer transition-colors">
          <Paperclip size={16} className="text-blue-500 shrink-0" />
          <span className="text-sm text-slate-600 dark:text-slate-300">Прикрепить файл</span>
          <span className="ml-auto text-xs text-slate-400 dark:text-slate-500">{hint}</span>
        </label>
      )}
      <input id={id} type="file" accept={ACCEPT_ATTR} className="sr-only"
        onChange={(e) => { onPick(e.target.files?.[0]); e.target.value = '' }} />
    </div>
  )
}

export default function UseCaseLanding({ slug }: { slug: string }) {
  const uc = USE_CASES.find((u) => u.slug === slug) as UseCase | undefined

  const [formState, setFormState] = useState<FormState>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const [consentChecked, setConsentChecked] = useState(false)
  const [captchaToken, setCaptchaToken] = useState('')
  const [isCaptchaRequested, setIsCaptchaRequested] = useState(false)
  const [fileA, setFileA] = useState<File | null>(null)
  const [fileB, setFileB] = useState<File | null>(null)
  const [idbCookieFound] = useState(() => hasIdbCookie())
  const captchaContainerRef = useRef<HTMLDivElement>(null)
  const captchaWidgetIdRef = useRef<number | null>(null)

  useEffect(() => {
    if (!uc) return
    document.title = uc.ogTitle
    const canonical = `${SITE}/${uc.slug}.html`
    const ogImage = `${SITE}/og/knowledge-base.png`
    setMetaTag('meta[name="description"]', 'name', 'description', uc.ogDescription)
    setMetaTag('meta[name="keywords"]', 'name', 'keywords', uc.keywords)
    setMetaTag('meta[property="og:type"]', 'property', 'og:type', 'website')
    setMetaTag('meta[property="og:title"]', 'property', 'og:title', uc.ogTitle)
    setMetaTag('meta[property="og:description"]', 'property', 'og:description', uc.ogDescription)
    setMetaTag('meta[property="og:url"]', 'property', 'og:url', canonical)
    setMetaTag('meta[property="og:image"]', 'property', 'og:image', ogImage)
    setMetaTag('meta[property="og:site_name"]', 'property', 'og:site_name', 'Интеграм')
    setMetaTag('meta[property="og:locale"]', 'property', 'og:locale', 'ru_RU')
    setMetaTag('meta[name="twitter:card"]', 'name', 'twitter:card', 'summary_large_image')
    setMetaTag('meta[name="twitter:title"]', 'name', 'twitter:title', uc.ogTitle)
    setMetaTag('meta[name="twitter:description"]', 'name', 'twitter:description', uc.ogDescription)
    setMetaTag('meta[name="twitter:image"]', 'name', 'twitter:image', ogImage)
    setCanonical(canonical)
  }, [uc])

  useEffect(() => {
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
    if (window.smartCaptcha) { initCaptcha(); return }
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

  if (!uc) return null

  function pickFile(file: File | undefined, setFile: (f: File | null) => void) {
    if (!file) return
    setIsCaptchaRequested(true)
    if (!hasAcceptedExtension(file.name)) {
      setErrorMsg(`Поддерживаются только таблицы: ${ACCEPTED_EXTENSIONS.join(', ')}.`)
      setFormState('error'); return
    }
    if (file.size > MAX_FILE_BYTES) {
      setErrorMsg(`Файл должен быть не больше ${formatBytes(MAX_FILE_BYTES)}.`)
      setFormState('error'); return
    }
    if (formState === 'error') { setFormState('idle'); setErrorMsg('') }
    setFile(file)
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!uc) return
    const form = e.currentTarget
    const name    = (form.elements.namedItem('name')    as HTMLInputElement).value.trim()
    const company = (form.elements.namedItem('company') as HTMLInputElement).value.trim()
    const contact = (form.elements.namedItem('contact') as HTMLInputElement).value.trim()
    const task    = (form.elements.namedItem('task')    as HTMLTextAreaElement).value.trim()

    if (!contact) {
      setErrorMsg('Укажите контакт — email или Telegram, куда прислать демо-доступ.')
      setFormState('error'); return
    }
    const captchaActive = Boolean(CAPTCHA_CLIENT_KEY) && !idbCookieFound
    if (captchaActive && !captchaToken) {
      setErrorMsg('Пожалуйста, пройдите проверку капчи.')
      setFormState('error'); return
    }

    setFormState('sending'); setErrorMsg('')
    const payload = new FormData()
    payload.append('source', uc.source)
    payload.append('name', name)
    payload.append('company', company)
    payload.append('contact', contact)
    payload.append('task', task)
    if (captchaActive) payload.append('captcha_token', captchaToken)
    if (fileA) payload.append('files[]', fileA, fileA.name)
    if (fileB) payload.append('files[]', fileB, fileB.name)

    try {
      const res = await fetch(SUBMIT_ENDPOINT, { method: 'POST', body: payload })
      const json = await res.json().catch(() => ({ ok: false }))
      if (res.ok && json.ok) {
        setFormState('success')
        reachGoal('lead', { source: uc.source })
        form.reset()
        setFileA(null); setFileB(null); setConsentChecked(false)
        setCaptchaToken(''); setIsCaptchaRequested(false)
        if (captchaWidgetIdRef.current !== null && window.smartCaptcha) {
          window.smartCaptcha.reset(captchaWidgetIdRef.current)
        }
      } else {
        setFormState('error')
        setErrorMsg(json.error ?? 'Произошла ошибка. Попробуйте позже.')
        if (captchaWidgetIdRef.current !== null && window.smartCaptcha) {
          window.smartCaptcha.reset(captchaWidgetIdRef.current); setCaptchaToken('')
        }
      }
    } catch {
      setFormState('error')
      setErrorMsg('Не удалось отправить запрос. Проверьте соединение.')
    }
  }

  const others = USE_CASES.filter((u) => u.slug !== uc.slug)

  return (
    <div className="overflow-hidden">
      {/* Hero */}
      <section className="pt-28 pb-12 lg:pt-36 lg:pb-16 border-b border-slate-200 dark:border-slate-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link to="/resheniya.html" className="flex w-fit items-center gap-1.5 text-sm text-slate-400 dark:text-slate-500 hover:text-blue-500 transition-colors mb-6">
            <ArrowLeft size={16} /> Все решения вместо Excel
          </Link>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-blue-500/30 text-blue-600 dark:text-blue-400 text-sm font-medium mb-5">
            <Icon name={uc.badgeIcon} size={14} /> {uc.badge}
          </div>
          <motion.h1 initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
            className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight mb-5">
            {uc.h1} <span className="text-blue-500">{uc.h1accent}</span>
          </motion.h1>
          <p className="text-lg text-slate-600 dark:text-slate-300 leading-relaxed mb-8">{uc.lead}</p>
          <a href="#zayavka" className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-600/20 transition-all">
            Заказать демо <ArrowRight size={18} />
          </a>
          <motion.figure
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.15 }}
            className="mt-12">
            <div className="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 ring-1 ring-slate-900/5 shadow-2xl shadow-slate-900/10">
              <img
                src={uc.image}
                alt={uc.imageAlt}
                width={IMG_SIZE[uc.image]?.w}
                height={IMG_SIZE[uc.image]?.h}
                loading="lazy"
                className="w-full h-auto block"
              />
            </div>
            <figcaption className="mt-3 text-center text-sm text-slate-400 dark:text-slate-500">
              Пример приложения на платформе Интеграм
            </figcaption>
          </motion.figure>
        </div>
      </section>

      {/* Боль → решение */}
      <section className="py-16 border-b border-slate-200 dark:border-slate-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl md:text-3xl font-bold mb-8">Excel перестал справляться — что меняется</h2>
          <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900/50">
                  <th className="text-left py-3 px-4 font-bold text-slate-500 dark:text-slate-400">Проблема в Excel</th>
                  <th className="text-left py-3 px-4 font-bold text-blue-600 dark:text-blue-400">Решение в Интеграм</th>
                </tr>
              </thead>
              <tbody>
                {uc.pains.map((r, i) => (
                  <tr key={i} className="border-t border-slate-100 dark:border-slate-800/60 align-top">
                    <td className="py-3 px-4 text-slate-500 dark:text-slate-400">
                      <span className="inline-flex items-start gap-1.5"><AlertTriangle size={14} className="text-amber-500 shrink-0 mt-0.5" />{r.pain}</span>
                    </td>
                    <td className="py-3 px-4 text-slate-700 dark:text-slate-200">
                      <span className="inline-flex items-start gap-1.5"><CheckCircle2 size={14} className="text-blue-500 shrink-0 mt-0.5" />{r.solution}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-6 p-5 rounded-2xl border border-blue-500/20 bg-blue-50/50 dark:bg-blue-950/20 text-sm text-slate-600 dark:text-slate-300">
            <span className="inline-flex items-start gap-2"><TrendingUp size={16} className="text-blue-500 shrink-0 mt-0.5" />{uc.example}</span>
          </div>
        </div>
      </section>

      {/* Возможности */}
      <section className="py-16 border-b border-slate-200 dark:border-slate-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl md:text-3xl font-bold mb-10">Что вы получаете</h2>
          <div className="grid gap-6 md:grid-cols-3">
            {uc.features.map((f, i) => (
              <div key={i} className="p-7 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-sm dark:shadow-none">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-4">
                  <Icon name={f.icon} size={24} />
                </div>
                <h3 className="text-lg font-bold mb-2">{f.title}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Как это работает */}
      <section className="py-16 border-b border-slate-200 dark:border-slate-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl md:text-3xl font-bold mb-10">Как это работает</h2>
          <div className="grid gap-6 md:grid-cols-3">
            {STEPS.map((s, i) => (
              <div key={i} className="p-7 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-sm dark:shadow-none">
                <div className="w-11 h-11 rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-3">
                  {s.icon === 'CheckCircle2' ? <CheckCircle2 size={22} /> : <Icon name={s.icon} size={22} />}
                </div>
                <h3 className="text-lg font-bold leading-tight mb-2">{s.title}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Факты */}
      <section className="py-16 border-b border-slate-200 dark:border-slate-900 bg-slate-50/60 dark:bg-slate-900/30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl md:text-3xl font-bold mb-8">Только факты</h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {FACTS.map((f, i) => (
              <div key={i} className="p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-sm dark:shadow-none">
                <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-3">
                  <Icon name={f.icon} size={20} />
                </div>
                <div className="text-lg font-bold text-slate-900 dark:text-white">{f.value}</div>
                <div className="text-sm text-slate-500 dark:text-slate-400 leading-snug mt-1">{f.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 border-b border-slate-200 dark:border-slate-900">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl md:text-3xl font-bold mb-8">Частые вопросы</h2>
          <div className="space-y-6">
            {uc.faq.map((item, i) => (
              <div key={i} className="border-b border-slate-100 dark:border-slate-800/60 pb-6 last:border-0">
                <h3 className="text-lg font-bold mb-2 text-slate-900 dark:text-white">{item.q}</h3>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed">{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA + форма */}
      <section className="py-16 border-b border-slate-200 dark:border-slate-900">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div id="zayavka" className="scroll-mt-24 rounded-3xl border border-blue-500/30 bg-gradient-to-b from-blue-50 to-white dark:from-blue-950/40 dark:to-slate-950 p-6 sm:p-8">
            <div className="flex justify-center mb-4">
              <div className="w-14 h-14 rounded-2xl bg-blue-600 text-white flex items-center justify-center"><Sparkles size={26} /></div>
            </div>
            <h2 className="text-xl md:text-2xl font-bold mb-3 text-center">Начните с демо-доступа</h2>
            <p className="text-slate-600 dark:text-slate-300 mb-6 max-w-xl mx-auto text-center">
              Расскажите про вашу задачу — настроим демо под вас и покажем, как это работает. Ответим в течение 24 часов.
            </p>
            <form className="max-w-xl mx-auto space-y-4 text-left" onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 ml-1">Имя</label>
                  <input name="name" type="text" placeholder="Александр"
                    className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-slate-800 dark:text-slate-100 focus:border-blue-500 outline-none transition-all" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 ml-1">Компания</label>
                  <input name="company" type="text" placeholder="Digital Corp"
                    className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-slate-800 dark:text-slate-100 focus:border-blue-500 outline-none transition-all" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 ml-1">Email / Telegram</label>
                <input name="contact" type="text" onInput={() => setIsCaptchaRequested(true)} placeholder="@username или you@company.ru"
                  className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-slate-800 dark:text-slate-100 focus:border-blue-500 outline-none transition-all" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 ml-1">Про вашу задачу</label>
                <textarea name="task" rows={3} placeholder="Что автоматизируете, сколько записей, в каком формате данные..."
                  className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-slate-800 dark:text-slate-100 focus:border-blue-500 outline-none transition-all resize-none" />
              </div>
              <div className="space-y-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/30 p-4">
                <div className="flex items-center gap-2">
                  <Paperclip size={14} className="text-blue-600 dark:text-blue-400" />
                  <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">Ваши таблицы <span className="font-normal text-slate-400 dark:text-slate-500">— необязательно</span></span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">{ACCEPTED_EXTENSIONS.join(', ')} · до {formatBytes(MAX_FILE_BYTES)} каждый.</p>
                <FileInput id="uc-file-a" label="Таблица Excel" hint="как есть" file={fileA} onPick={(f) => pickFile(f, setFileA)} onClear={() => setFileA(null)} />
                <FileInput id="uc-file-b" label="Ещё файл" hint="если нужно" file={fileB} onPick={(f) => pickFile(f, setFileB)} onClear={() => setFileB(null)} />
              </div>

              {formState === 'success' && (
                <div className="flex items-center gap-2 text-green-500 dark:text-green-400 text-sm font-medium">
                  <CheckCircle2 size={16} /> Заявка отправлена! Свяжемся с вами в течение 24 часов.
                </div>
              )}
              {formState === 'error' && (<div className="text-red-500 dark:text-red-400 text-sm font-medium">{errorMsg}</div>)}

              {CAPTCHA_CLIENT_KEY && !idbCookieFound && isCaptchaRequested && (<div ref={captchaContainerRef} />)}

              <label className="flex items-start gap-3 cursor-pointer">
                <input type="checkbox" checked={consentChecked} onChange={(e) => setConsentChecked(e.target.checked)}
                  className="mt-0.5 h-4 w-4 shrink-0 rounded border-slate-300 dark:border-slate-600 accent-blue-600 cursor-pointer" />
                <span className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Я даю согласие на <a href="/privacy" target="_blank" rel="noopener noreferrer" className="underline hover:text-blue-500 transition-colors">обработку персональных данных</a>
                </span>
              </label>

              <button type="submit" disabled={formState === 'sending' || formState === 'success' || !consentChecked}
                className="w-full py-3 sm:py-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl shadow-lg shadow-blue-600/20 transition-all flex items-center justify-center gap-2">
                {formState === 'sending' ? 'Отправка...' : 'Заказать демо'}
                {formState !== 'sending' && <Send size={18} />}
              </button>
            </form>
          </div>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-slate-400 dark:text-slate-500">
            <span className="inline-flex items-center gap-1.5"><Server size={14} /> Сервер в РФ — ideav.ru</span>
            <span className="inline-flex items-center gap-1.5"><ShieldCheck size={14} /> Данные принадлежат вам</span>
            <span className="inline-flex items-center gap-1.5"><Boxes size={14} /> Без программирования</span>
          </div>
        </div>
      </section>

      {/* Другие решения (перелинковка кластера) */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl md:text-3xl font-bold mb-8">Другие решения вместо Excel</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {others.map((o) => (
              <Link key={o.slug} to={`/${o.slug}.html`}
                className="group flex items-center gap-3 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-600 bg-white dark:bg-slate-950 transition-colors">
                <span className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                  <Icon name={o.badgeIcon} size={18} />
                </span>
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">{o.badge}</span>
                <ArrowRight size={16} className="ml-auto text-slate-300 dark:text-slate-600 group-hover:text-blue-500 transition-colors" />
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
