import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Database,
  Zap,
  BarChart3,
  ShieldCheck,
  Server,
  Boxes,
  FileSpreadsheet,
  Clock,
  KeyRound,
  Gauge,
  TrendingUp,
  Sparkles,
  Send,
  Paperclip,
  Trash2,
} from 'lucide-react'
import Breadcrumbs from '../components/Breadcrumbs'
import { reachGoal } from '../lib/metrika'

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
// Общий обработчик приёма заявок (A2): принимает multipart-форму, коммитит
// вложения в каталог orders/ репозитория на GitHub, заводит issue и шлёт
// уведомление в Telegram. Поле source = 'excel-constructor' отличает заявку с
// этой страницы (см. public/excel-to-app.php, $SOURCE_LABELS).
const SUBMIT_ENDPOINT = '/excel-to-app.php'

const ACCEPTED_EXTENSIONS = ['.xlsx', '.xls', '.csv', '.ods']
const ACCEPT_ATTR = ACCEPTED_EXTENSIONS.join(',')
const MAX_FILE_BYTES = 25 * 1024 * 1024

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

const SITE = 'https://ideav.ru'
const PATH = '/konstruktor-prilozhenij.html'

const PAGE_TITLE =
  'Конструктор приложений вместо Excel: no-code платформа для бизнеса — Интеграм'
const PAGE_DESCRIPTION =
  'Excel тормозит и врёт на больших данных? Замените его конструктором приложений Интеграм: миллионы записей, отчёты и дашборды без кода, ролевая модель доступа — без программистов. Российская платформа, on-premise, настройка под ваш бизнес за 1 день.'

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

// ── «Боль → решение»: почему Excel перестал справляться и что даёт конструктор ──
interface PainRow {
  pain: string
  solution: string
}

const painRows: PainRow[] = [
  {
    pain: 'Тормозит, виснет и крашится уже на десятках тысяч строк',
    solution: 'Хранит до 2 000 000 записей и работает без лагов — это база данных, а не файл',
  },
  {
    pain: 'Ошибки из-за случайных правок формул и удалённых ячеек',
    solution: 'Ролевая модель доступа: кто что видит и меняет, история изменений',
  },
  {
    pain: 'Сводки и отчёты собираются руками часами',
    solution: 'Конструктор отчётов и дашбордов без кода — новый срез за пару минут',
  },
  {
    pain: 'Файл живёт на одном компьютере, версии расходятся',
    solution: 'Единая база в браузере, у каждого свой доступ — или на вашем сервере (on-premise)',
  },
]

// ── Что получаете (ключевые возможности конструктора) ──────────────────────────
const pillars = [
  {
    icon: <Database size={24} />,
    title: 'Настоящая база данных',
    body: 'Таблицы, связи, справочники и вычисляемые поля вместо разъезжающихся листов. Миллионы записей — норма, а не потолок.',
  },
  {
    icon: <BarChart3 size={24} />,
    title: 'Отчёты и дашборды без кода',
    body: 'Группировки, сводные, графики и выгрузки настраиваются запросом в конструкторе — без программистов и без ручной пересборки.',
  },
  {
    icon: <KeyRound size={24} />,
    title: 'Роли и права доступа',
    body: 'Кто может видеть, добавлять и менять данные — задаётся ролями. Случайная правка больше не ломает всю таблицу.',
  },
]

// ── Как это работает (3 шага) ─────────────────────────────────────────────────
interface Step {
  icon: React.ReactNode
  title: string
  body: string
}

const steps: Step[] = [
  {
    icon: <FileSpreadsheet size={22} />,
    title: '1. Отправляете свои Excel',
    body: 'Прайсы, склад, клиентов, заказы — как есть, без подготовки. Или просто описываете задачу словами.',
  },
  {
    icon: <Gauge size={22} />,
    title: '2. Настраиваем под вас',
    body: 'Собираем структуру данных, рабочие места и логику под вашу номенклатуру. Обычно — в течение 24 часов.',
  },
  {
    icon: <CheckCircle2 size={22} />,
    title: '3. Получаете приложение',
    body: 'Ссылка на готовую базу Интеграм с вашими данными, отчётами и ролями. Демо-доступ настраиваем за 1 день.',
  },
]

// ── Факты ─────────────────────────────────────────────────────────────────────
const facts = [
  { icon: <Database size={20} />, value: 'до 2 000 000', label: 'записей в одной базе' },
  { icon: <Zap size={20} />, value: '22 000 позиций', label: 'сопоставили за 3 часа вместо 2 недель' },
  { icon: <Clock size={20} />, value: '24 часа', label: 'настройка под вашу номенклатуру' },
  { icon: <Server size={20} />, value: 'Россия, on-premise', label: 'работает на вашем сервере' },
]

// ── FAQ (используется и в разметке FAQPage — см. prerender-скрипт) ─────────────
const faq = [
  {
    q: 'Нужно ли нанимать программистов?',
    a: 'Нет. Настройку делают бизнес-аналитики в конструкторе, а дальше вы управляете системой сами — без кода: добавляете поля, отчёты и рабочие места.',
  },
  {
    q: 'Можно ли установить на свой сервер?',
    a: 'Да. Интеграм разворачивается on-premise — все данные хранятся у вас. По умолчанию проект работает на российском сервере ideav.ru.',
  },
  {
    q: 'Как быстро можно начать?',
    a: 'Демо-доступ с вашими данными настраиваем за 1 день. Полную настройку под номенклатуру — обычно в течение 24 часов после получения файлов.',
  },
  {
    q: 'Сколько стоит?',
    a: 'Владение базой — от 1950 ₽/мес по тарифам ideav.ru; итог зависит от объёма данных и числа пользователей. Точную оценку под ваш объём дадим по заявке.',
  },
  {
    q: 'Чем это отличается от услуги «Загрузите Excel — получите приложение»?',
    a: 'Там вы за ~45 минут получаете готовую базу из своих файлов «под ключ». Здесь — про замену Excel конструктором как платформой: вы сами развиваете систему, отчёты и роли без программистов.',
  },
]

// Один необязательный файл-вложение: пустое состояние — кликабельная зона
// «Прикрепить файл», заполненное — имя файла, размер и кнопка «убрать».
function ExcelFileInput({
  id,
  label,
  hint,
  file,
  onPick,
  onClear,
}: {
  id: string
  label: string
  hint: string
  file: File | null
  onPick: (file: File | undefined) => void
  onClear: () => void
}) {
  return (
    <div>
      <label
        htmlFor={id}
        className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 ml-1"
      >
        {label}
      </label>
      {file ? (
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
          <FileSpreadsheet size={18} className="text-green-600 dark:text-green-400 shrink-0" />
          <span className="flex-1 truncate text-sm text-slate-700 dark:text-slate-200">{file.name}</span>
          <span className="text-xs text-slate-400 dark:text-slate-500 shrink-0">{formatBytes(file.size)}</span>
          <button
            type="button"
            onClick={onClear}
            aria-label={`Убрать файл ${file.name}`}
            className="text-slate-400 hover:text-red-500 transition-colors shrink-0"
          >
            <Trash2 size={16} />
          </button>
        </div>
      ) : (
        <label
          htmlFor={id}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-600 bg-white dark:bg-slate-950 cursor-pointer transition-colors"
        >
          <Paperclip size={16} className="text-blue-500 shrink-0" />
          <span className="text-sm text-slate-600 dark:text-slate-300">Прикрепить файл</span>
          <span className="ml-auto text-xs text-slate-400 dark:text-slate-500">{hint}</span>
        </label>
      )}
      <input
        id={id}
        type="file"
        accept={ACCEPT_ATTR}
        className="sr-only"
        onChange={(e) => {
          onPick(e.target.files?.[0])
          e.target.value = ''
        }}
      />
    </div>
  )
}

export default function ExcelConstructor() {
  useEffect(() => {
    document.title = PAGE_TITLE
    const canonical = `${SITE}${PATH}`
    const ogImage = `${SITE}/og/knowledge-base.png`

    setMetaTag('meta[name="description"]', 'name', 'description', PAGE_DESCRIPTION)
    setMetaTag('meta[name="keywords"]', 'name', 'keywords',
      'конструктор приложений,замена excel,заменить excel,no-code платформа,конструктор приложений без кода,конструктор баз данных для бизнеса,low-code платформа,российский конструктор приложений,no-code конструктор,замена excel на приложение,интеграм')
    setMetaTag('meta[property="og:type"]', 'property', 'og:type', 'website')
    setMetaTag('meta[property="og:title"]', 'property', 'og:title', PAGE_TITLE)
    setMetaTag('meta[property="og:description"]', 'property', 'og:description', PAGE_DESCRIPTION)
    setMetaTag('meta[property="og:url"]', 'property', 'og:url', canonical)
    setMetaTag('meta[property="og:image"]', 'property', 'og:image', ogImage)
    setMetaTag('meta[property="og:site_name"]', 'property', 'og:site_name', 'Интеграм')
    setMetaTag('meta[property="og:locale"]', 'property', 'og:locale', 'ru_RU')
    setMetaTag('meta[name="twitter:card"]', 'name', 'twitter:card', 'summary_large_image')
    setMetaTag('meta[name="twitter:title"]', 'name', 'twitter:title', PAGE_TITLE)
    setMetaTag('meta[name="twitter:description"]', 'name', 'twitter:description', PAGE_DESCRIPTION)
    setMetaTag('meta[name="twitter:image"]', 'name', 'twitter:image', ogImage)
    setCanonical(canonical)
  }, [])

  // ── Форма заявки «Заказать демо» → Telegram ────────────────────────────────
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

  // Проверка и приём одного прикреплённого файла (оба поля необязательные).
  function pickFile(file: File | undefined, setFile: (f: File | null) => void) {
    if (!file) return
    setIsCaptchaRequested(true)
    if (!hasAcceptedExtension(file.name)) {
      setErrorMsg(`Поддерживаются только таблицы: ${ACCEPTED_EXTENSIONS.join(', ')}.`)
      setFormState('error')
      return
    }
    if (file.size > MAX_FILE_BYTES) {
      setErrorMsg(`Файл должен быть не больше ${formatBytes(MAX_FILE_BYTES)}.`)
      setFormState('error')
      return
    }
    if (formState === 'error') {
      setFormState('idle')
      setErrorMsg('')
    }
    setFile(file)
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    const name    = (form.elements.namedItem('name')    as HTMLInputElement).value.trim()
    const company = (form.elements.namedItem('company') as HTMLInputElement).value.trim()
    const contact = (form.elements.namedItem('contact') as HTMLInputElement).value.trim()
    const task    = (form.elements.namedItem('task')    as HTMLTextAreaElement).value.trim()

    if (!contact) {
      setErrorMsg('Укажите контакт — email или Telegram, куда прислать демо-доступ.')
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
    payload.append('source', 'excel-constructor')
    payload.append('name', name)
    payload.append('company', company)
    payload.append('contact', contact)
    payload.append('task', task)
    if (captchaActive) {
      payload.append('captcha_token', captchaToken)
    }
    if (fileA) payload.append('files[]', fileA, fileA.name)
    if (fileB) payload.append('files[]', fileB, fileB.name)

    try {
      const res = await fetch(SUBMIT_ENDPOINT, {
        method: 'POST',
        body: payload,
      })
      const json = await res.json().catch(() => ({ ok: false }))
      if (res.ok && json.ok) {
        setFormState('success')
        reachGoal('lead', { source: 'excel-constructor' })
        form.reset()
        setFileA(null)
        setFileB(null)
        setConsentChecked(false)
        setCaptchaToken('')
        setIsCaptchaRequested(false)
        if (captchaWidgetIdRef.current !== null && window.smartCaptcha) {
          window.smartCaptcha.reset(captchaWidgetIdRef.current)
        }
      } else {
        setFormState('error')
        setErrorMsg(json.error ?? 'Произошла ошибка. Попробуйте позже.')
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

  return (
    <div className="overflow-hidden">
      {/* Hero */}
      <section className="pt-28 pb-12 lg:pt-36 lg:pb-16 border-b border-slate-200 dark:border-slate-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Breadcrumbs
            items={[
              { name: 'Интеграм', to: '/' },
              { name: 'Конструктор приложений', to: '/konstruktor-prilozhenij.html' },
            ]}
          />

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-blue-500/30 text-blue-600 dark:text-blue-400 text-sm font-medium mb-5">
            <Zap size={14} />
            Конструктор приложений Интеграм
          </div>

          <motion.h1
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight mb-5"
          >
            Ваш Excel тормозит{' '}
            <span className="text-blue-500">и врёт?</span>
          </motion.h1>

          <p className="text-lg text-slate-600 dark:text-slate-300 leading-relaxed mb-8">
            Замените Excel конструктором приложений Интеграм: храните миллионы записей, стройте
            отчёты и управляйте данными без программистов. Настоящая база данных вместо
            разъезжающихся таблиц — с ролями доступа, дашбордами и настройкой под ваш бизнес за
            1 день.
          </p>

          <div className="flex flex-wrap gap-3">
            <a
              href="#zayavka"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-600/20 transition-all"
            >
              Заказать демо <ArrowRight size={18} />
            </a>
            <a
              href="/excel-to-app.html"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 border border-slate-200 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-600 text-slate-700 dark:text-slate-200 font-semibold rounded-xl transition-all"
            >
              Загрузить Excel — получить приложение за ~45 мин
            </a>
          </div>

          <motion.figure
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.15 }}
            className="mt-12">
            <div className="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 ring-1 ring-slate-900/5 shadow-2xl shadow-slate-900/10">
              <img
                src="/case-sovereignty-audit.png"
                alt="Пример приложения на платформе Интеграм: аналитика, финансы и дашборды"
                width={2042}
                height={1252}
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
          <h2 className="text-2xl md:text-3xl font-bold mb-2">Excel перестал справляться — что дальше</h2>
          <p className="text-slate-500 dark:text-slate-400 mb-8 max-w-2xl">
            Когда данных становится много, а работать с ними должны несколько человек, таблица
            превращается в источник ошибок. Вот что меняется на конструкторе Интеграм.
          </p>

          <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900/50">
                  <th className="text-left py-3 px-4 font-bold text-slate-500 dark:text-slate-400">Проблема в Excel</th>
                  <th className="text-left py-3 px-4 font-bold text-blue-600 dark:text-blue-400">Решение в Интеграм</th>
                </tr>
              </thead>
              <tbody>
                {painRows.map((r, i) => (
                  <tr key={i} className="border-t border-slate-100 dark:border-slate-800/60 align-top">
                    <td className="py-3 px-4 text-slate-500 dark:text-slate-400">
                      <span className="inline-flex items-start gap-1.5">
                        <AlertTriangle size={14} className="text-amber-500 shrink-0 mt-0.5" />
                        {r.pain}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-700 dark:text-slate-200">
                      <span className="inline-flex items-start gap-1.5">
                        <CheckCircle2 size={14} className="text-blue-500 shrink-0 mt-0.5" />
                        {r.solution}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Кейс «22 000 позиций за 3 часа» */}
      <section className="py-16 border-b border-slate-200 dark:border-slate-900 bg-slate-50/60 dark:bg-slate-900/30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl border border-blue-500/30 bg-white dark:bg-slate-950 p-7 sm:p-9">
            <div className="flex items-center gap-2 mb-3 text-blue-600 dark:text-blue-400">
              <TrendingUp size={20} />
              <span className="text-xs font-bold uppercase tracking-widest">Живой кейс</span>
            </div>
            <p className="text-xl md:text-2xl font-bold leading-snug mb-4">
              22 000 позиций каталога сопоставили за 3 часа — вместо двух недель работы отдела
              закупок.
            </p>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
              У клиента был свой каталог и прайс поставщика с другими названиями и артикулами.
              На конструкторе Интеграм сопоставление собрали без Elasticsearch и без кода —
              токенизация наименований и автоподбор в несколько потоков.{' '}
              <Link
                to="/catalog-matching.html"
                className="text-blue-600 dark:text-blue-400 underline hover:no-underline"
              >
                Как устроено сопоставление каталогов →
              </Link>
            </p>
          </div>
        </div>
      </section>

      {/* Что получаете */}
      <section className="py-16 border-b border-slate-200 dark:border-slate-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl md:text-3xl font-bold mb-10">Что вы получаете вместо таблицы</h2>
          <div className="grid gap-6 md:grid-cols-3">
            {pillars.map((p, i) => (
              <div
                key={i}
                className="p-7 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-sm dark:shadow-none"
              >
                <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-4">
                  {p.icon}
                </div>
                <h3 className="text-lg font-bold mb-2">{p.title}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{p.body}</p>
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
            {steps.map((s, i) => (
              <div
                key={i}
                className="p-7 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-sm dark:shadow-none"
              >
                <div className="w-11 h-11 rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-3">
                  {s.icon}
                </div>
                <h3 className="text-lg font-bold leading-tight mb-2">{s.title}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Только факты */}
      <section className="py-16 border-b border-slate-200 dark:border-slate-900 bg-slate-50/60 dark:bg-slate-900/30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl md:text-3xl font-bold mb-8">Только факты</h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {facts.map((f, i) => (
              <div
                key={i}
                className="p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-sm dark:shadow-none"
              >
                <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-3">
                  {f.icon}
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
            {faq.map((item, i) => (
              <div key={i} className="border-b border-slate-100 dark:border-slate-800/60 pb-6 last:border-0">
                <h3 className="text-lg font-bold mb-2 text-slate-900 dark:text-white">{item.q}</h3>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed">{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA + форма */}
      <section className="py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div
            id="zayavka"
            className="scroll-mt-24 rounded-3xl border border-blue-500/30 bg-gradient-to-b from-blue-50 to-white dark:from-blue-950/40 dark:to-slate-950 p-6 sm:p-8"
          >
            <div className="flex justify-center mb-4">
              <div className="w-14 h-14 rounded-2xl bg-blue-600 text-white flex items-center justify-center">
                <Sparkles size={26} />
              </div>
            </div>
            <h2 className="text-xl md:text-2xl font-bold mb-3 text-center">Начните с демо-доступа</h2>
            <p className="text-slate-600 dark:text-slate-300 mb-6 max-w-xl mx-auto text-center">
              Расскажите про ваши таблицы — настроим демо под вашу номенклатуру и покажем, как это
              работает. Ответим в течение 24 часов.
            </p>

            <form className="max-w-xl mx-auto space-y-4 text-left" onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 ml-1">Имя</label>
                  <input
                    name="name"
                    type="text"
                    className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-slate-800 dark:text-slate-100 focus:border-blue-500 outline-none transition-all"
                    placeholder="Александр"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 ml-1">Компания</label>
                  <input
                    name="company"
                    type="text"
                    className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-slate-800 dark:text-slate-100 focus:border-blue-500 outline-none transition-all"
                    placeholder="Digital Corp"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 ml-1">Email / Telegram</label>
                {/*
                  Пустой контакт гасим НАТИВНОЙ проверкой required (issue #467): без
                  неё отправка, отменённая через preventDefault, всё равно порождает
                  submit-событие, и автоцель Метрики «Отправка формы» засчитывает его
                  как конверсию. required не даёт submit-событию возникнуть; свой текст
                  показываем вместо системного «пузыря».
                */}
                <input
                  name="contact"
                  type="text"
                  required
                  onInvalid={e => { e.preventDefault(); setFormState('error'); setErrorMsg('Укажите контакт — email или Telegram, куда прислать демо-доступ.') }}
                  onInput={() => setIsCaptchaRequested(true)}
                  className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-slate-800 dark:text-slate-100 focus:border-blue-500 outline-none transition-all"
                  placeholder="@username или you@company.ru"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 ml-1">Про ваши таблицы</label>
                <textarea
                  name="task"
                  rows={3}
                  className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-slate-800 dark:text-slate-100 focus:border-blue-500 outline-none transition-all resize-none"
                  placeholder="Что автоматизируете, сколько записей, в каком формате данные..."
                />
              </div>

              {/* Необязательные вложения */}
              <div className="space-y-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/30 p-4">
                <div className="flex items-center gap-2">
                  <Paperclip size={14} className="text-blue-600 dark:text-blue-400" />
                  <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                    Ваши таблицы{' '}
                    <span className="font-normal text-slate-400 dark:text-slate-500">— необязательно</span>
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Можно сразу приложить файлы — посмотрим объём и формат заранее.{' '}
                  {ACCEPTED_EXTENSIONS.join(', ')} · до {formatBytes(MAX_FILE_BYTES)} каждый.
                </p>
                <ExcelFileInput
                  id="ec-file-a"
                  label="Таблица Excel"
                  hint="прайс, склад, клиенты…"
                  file={fileA}
                  onPick={(f) => pickFile(f, setFileA)}
                  onClear={() => setFileA(null)}
                />
                <ExcelFileInput
                  id="ec-file-b"
                  label="Ещё файл"
                  hint="если нужно"
                  file={fileB}
                  onPick={(f) => pickFile(f, setFileB)}
                  onClear={() => setFileB(null)}
                />
              </div>

              {formState === 'success' && (
                <div className="flex items-center gap-2 text-green-500 dark:text-green-400 text-sm font-medium">
                  <CheckCircle2 size={16} />
                  Заявка отправлена! Свяжемся с вами в течение 24 часов.
                </div>
              )}
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
                  onChange={(e) => setConsentChecked(e.target.checked)}
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
                disabled={formState === 'sending' || formState === 'success' || !consentChecked}
                className="w-full py-3 sm:py-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl shadow-lg shadow-blue-600/20 transition-all flex items-center justify-center gap-2"
              >
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

          <p className="mt-10 text-center text-sm">
            <Link to="/informatsionnaya-sistema.html" className="text-slate-400 dark:text-slate-500 hover:text-blue-500 transition-colors">
              Основы: что такое информационная система и при чём тут Интеграм →
            </Link>
          </p>
        </div>
      </section>
    </div>
  )
}
