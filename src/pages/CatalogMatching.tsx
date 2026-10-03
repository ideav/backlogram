import { useEffect, useRef, useState } from 'react'
import BlogLinks from '../components/BlogLinks'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Upload,
  Scissors,
  GitCompare,
  Gauge,
  Sparkles,
  FileSpreadsheet,
  Layers,
  Server,
  ShieldCheck,
  Boxes,
  Cpu,
  ListChecks,
  Play,
  Send,
  Paperclip,
  Trash2,
} from 'lucide-react'
import Breadcrumbs from '../components/Breadcrumbs'
import { reachGoal } from '../lib/metrika'
import {
  CM_META,
  CM_FLOW,
  CM_STEPS,
  CM_PILLARS,
  CM_COMPARE_ROWS,
  CM_AUDIENCE,
  CM_FORM,
} from '../data/catalogMatching'
import { freshnessLine } from '../lib/dates'

// Текст страницы лежит в src/data/catalogMatching.mjs — оттуда же его берёт
// статический снапшот scripts/prerender-catalog-matching.mjs. Иконки данные
// несут строковыми именами, компоненты подставляются по этой таблице (тот же
// приём, что в src/pages/UseCaseLanding.tsx).
const ICONS: Record<string, typeof Upload> = {
  Upload,
  Scissors,
  GitCompare,
  Cpu,
  ListChecks,
  FileSpreadsheet,
  Sparkles,
  Boxes,
  Gauge,
  Layers,
}

function Icon({ name, size }: { name: string; size: number }) {
  const Cmp = ICONS[name] ?? Sparkles
  return <Cmp size={size} />
}

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
// вложения в каталог orders/ репозитория на GitHub, заводит issue со ссылками
// на файлы и шлёт уведомление в Telegram. Поле source = 'catalog-matching'
// отличает заявку с этой страницы (см. public/excel-to-app.php).
const SUBMIT_ENDPOINT = CM_FORM.endpoint

// Два каталога — необязательные вложения (#389): свой каталог (SKU) и каталог
// контрагента (RFP). Те же форматы и лимиты, что и на /excel-to-app.html.
const ACCEPTED_EXTENSIONS = CM_FORM.extensions
const ACCEPT_ATTR = ACCEPTED_EXTENSIONS.join(',')
const MAX_FILE_BYTES = CM_FORM.maxFileMb * 1024 * 1024

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
const PATH = '/catalog-matching.html'
const VIDEO_URL =
  'https://ideav.ru/download/%D0%9C%D0%B0%D1%81%D1%81%D0%BE%D0%B2%D0%BE%D0%B5-%D1%81%D0%BE%D0%BF%D0%BE%D1%81%D1%82%D0%B0%D0%B2%D0%BB%D0%B5%D0%BD%D0%B8%D0%B5-%D0%BA%D0%B0%D1%82%D0%B0%D0%BB%D0%BE%D0%B3%D0%BE%D0%B2.mp4'

const PAGE_TITLE =
  'Массовое сопоставление каталогов: сотни тысяч позиций без Elasticsearch и кода — Интеграм'
const PAGE_DESCRIPTION =
  'Инструмент массового сопоставления позиций двух каталогов в конструкторе Интеграм: токенизация наименований, пересечение токенов, автоматический подбор в несколько потоков (~120 пар/мин), оценка точности, кандидаты-альтернативы, выгрузка в Excel и доуточнение шорт-листа языковой моделью — без программирования.'

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

// Один необязательный файл-каталог: пустое состояние — кликабельная зона
// «Прикрепить файл», заполненное — имя файла, размер и кнопка «убрать».
function CatalogFileInput({
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

export default function CatalogMatching() {
  useEffect(() => {
    document.title = PAGE_TITLE
    const canonical = `${SITE}${PATH}`
    const ogImage = `${SITE}/og/knowledge-base.png`

    setMetaTag('meta[name="description"]', 'name', 'description', PAGE_DESCRIPTION)
    setMetaTag('meta[name="keywords"]', 'name', 'keywords',
      'сопоставление каталогов,массовое сопоставление,сопоставление прайс-листов,сопоставление номенклатуры,токенизация наименований,нечёткое сопоставление,подбор аналогов,сопоставление артикулов,sku rfp,elasticsearch,интеграм,no-code,без программирования')
    setMetaTag('meta[property="og:type"]', 'property', 'og:type', 'article')
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

  // ── Форма заявки «Сопоставить ваши каталоги» → Telegram ──────────────────────
  const [formState, setFormState] = useState<FormState>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const [consentChecked, setConsentChecked] = useState(false)
  const [captchaToken, setCaptchaToken] = useState('')
  const [isCaptchaRequested, setIsCaptchaRequested] = useState(false)
  const [ourCatalog, setOurCatalog] = useState<File | null>(null)
  const [theirCatalog, setTheirCatalog] = useState<File | null>(null)
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

  // Проверка и приём одного прикреплённого каталога (оба поля необязательные).
  function pickCatalogFile(file: File | undefined, setFile: (f: File | null) => void) {
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
      setErrorMsg('Укажите контакт — email или Telegram, куда прислать результат.')
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
    payload.append('source', CM_FORM.source)
    payload.append('name', name)
    payload.append('company', company)
    payload.append('contact', contact)
    payload.append('task', task)
    if (captchaActive) {
      payload.append('captcha_token', captchaToken)
    }
    // Имя файла кодирует роль каталога, чтобы её было видно в orders/ и в issue:
    // SKU — наш каталог, RFP — каталог контрагента. Оба вложения необязательны.
    if (ourCatalog)   payload.append('files[]', ourCatalog,   `SKU-${ourCatalog.name}`)
    if (theirCatalog) payload.append('files[]', theirCatalog, `RFP-${theirCatalog.name}`)

    try {
      const res = await fetch(SUBMIT_ENDPOINT, {
        method: 'POST',
        body: payload,
      })
      const json = await res.json().catch(() => ({ ok: false }))
      if (res.ok && json.ok) {
        setFormState('success')
        reachGoal('lead', { source: CM_FORM.source })
        form.reset()
        setOurCatalog(null)
        setTheirCatalog(null)
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
              { name: 'Сопоставление каталогов', to: '/catalog-matching.html' },
            ]}
          />

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-blue-500/30 text-blue-600 dark:text-blue-400 text-sm font-medium mb-5">
            <GitCompare size={14} />
            Инструмент на конструкторе Интеграм
          </div>

          <motion.h1
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight mb-5"
          >
            {CM_META.h1.slice(0, -CM_META.h1Accent.length)}
            <span className="text-blue-500">{CM_META.h1Accent}</span>
          </motion.h1>

          <p className="text-lg text-slate-600 dark:text-slate-300 leading-relaxed">{CM_META.lead}</p>

          {/* Дата обновления видна и человеку, и в JSON-LD снапшота (аудит #627, п. 5) */}
          <p className="mt-4 text-sm text-slate-400 dark:text-slate-500">
            <time dateTime={CM_META.updatedAt}>
              {freshnessLine(CM_META.publishedAt, CM_META.updatedAt)}
            </time>
          </p>
        </div>
      </section>

      {/* Инфографика: токенизация */}
      <section className="py-12 border-b border-slate-200 dark:border-slate-900">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <figure>
            <div className="rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-none">
              <img
                src="/catalog-tokenization.jpg"
                alt="Токенизация наименований: каталоги поставщика (SKU) и контрагента (RFP) разбиваются на слова-токены и сопоставляются через общий справочник токенов"
                width={1672}
                height={941}
                loading="lazy"
                className="w-full h-auto block"
              />
            </div>
            <figcaption className="text-xs text-slate-400 dark:text-slate-500 mt-3 text-center">
              Наименования из обоих каталогов разбиваются на токены и сводятся к общему справочнику — по пересечениям токенов находятся совпадения.
            </figcaption>
          </figure>
        </div>
      </section>

      {/* Full flow */}
      <section className="py-14 border-b border-slate-200 dark:border-slate-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl md:text-3xl font-bold mb-2">Полный цикл сопоставления</h2>
          <p className="text-slate-500 dark:text-slate-400 mb-8 max-w-2xl">
            От двух сырых выгрузок до готового файла с подобранными артикулами — внутри одной базы
            Интеграма:
          </p>

          <div className="flex flex-wrap items-stretch gap-3">
            {CM_FLOW.map((step, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="flex items-center gap-2.5 px-4 py-3 rounded-2xl border border-blue-200 dark:border-blue-900/40 bg-blue-50/60 dark:bg-blue-950/30">
                  <span className="text-blue-600 dark:text-blue-400">
                    <Icon name={step.icon} size={18} />
                  </span>
                  <span className="text-sm font-semibold text-slate-800 dark:text-slate-100 whitespace-nowrap">
                    {step.label}
                  </span>
                </div>
                {i < CM_FLOW.length - 1 && (
                  <ArrowRight size={16} className="text-slate-300 dark:text-slate-600 shrink-0" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Steps in detail */}
      <section className="py-16 border-b border-slate-200 dark:border-slate-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl md:text-3xl font-bold mb-10">Что происходит на каждом шаге</h2>
          <div className="grid gap-6 md:grid-cols-2">
            {CM_STEPS.map((s, i) => (
              <div
                key={i}
                className="p-7 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-sm dark:shadow-none"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-11 h-11 rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                    <Icon name={s.icon} size={22} />
                  </div>
                  <h3 className="text-lg font-bold leading-tight">{s.title}</h3>
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Scoring */}
      <section className="py-16 border-b border-slate-200 dark:border-slate-900 bg-slate-50/60 dark:bg-slate-900/30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 mb-2">
            <Gauge size={22} className="text-blue-600 dark:text-blue-400" />
            <h2 className="text-2xl md:text-3xl font-bold">Как считается оценка совпадения</h2>
          </div>
          <p className="text-slate-500 dark:text-slate-400 mb-8 max-w-2xl">
            У каждой пары есть числовая оценка точности — по ней пары сортируются, и лучшая попадает в
            подобранный артикул.
          </p>

          <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-7">
            <p className="text-slate-700 dark:text-slate-200 leading-relaxed">
              Оценка складывается из двух величин:
            </p>
            <ul className="mt-4 space-y-3 text-sm text-slate-600 dark:text-slate-300">
              <li className="flex items-start gap-2">
                <CheckCircle2 size={16} className="text-blue-500 shrink-0 mt-0.5" />
                <span><span className="font-semibold">количества совпавших токенов</span> — сколько одинаковых слов в двух наименованиях;</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 size={16} className="text-blue-500 shrink-0 mt-0.5" />
                <span><span className="font-semibold">отношения их общей длины к длине наименования</span> — насколько совпавшие слова «закрывают» позицию, а не являются случайными короткими словами.</span>
              </li>
            </ul>
            <p className="mt-5 text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
              Формула нехитрая и полностью на виду — её можно усложнять и оттачивать под конкретную
              номенклатуру: добавлять веса частым и редким токенам, требовать обязательного совпадения
              бренда и типа товара.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3 mt-8">
            {CM_PILLARS.map((p, i) => (
              <div
                key={i}
                className="p-7 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-sm dark:shadow-none"
              >
                <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-4">
                  <Icon name={p.icon} size={24} />
                </div>
                <h3 className="text-lg font-bold mb-2">{p.title}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{p.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* LLM refinement */}
      <section className="py-16 border-b border-slate-200 dark:border-slate-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles size={22} className="text-blue-600 dark:text-blue-400" />
            <h2 className="text-2xl md:text-3xl font-bold">Доуточнение языковой моделью</h2>
          </div>
          <p className="text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl mb-4">
            Токены дают короткий список кандидатов на каждую позицию. Этот шорт-лист можно отдать
            языковой модели — и она выберет из кандидатов только то, что действительно совпадает.
          </p>
          <p className="text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl">
            Ключевая идея — не перемножать сотни тысяч позиций на сотни тысяч. Тяжёлую часть делает
            токенное сопоставление, а модель работает уже по отобранным парам: это быстро, дёшево и
            точно.
          </p>
        </div>
      </section>

      {/* Comparison vs Elasticsearch / custom dev */}
      <section className="py-16 border-b border-slate-200 dark:border-slate-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl md:text-3xl font-bold mb-2">Интеграм против Elasticsearch и заказной разработки</h2>
          <p className="text-slate-500 dark:text-slate-400 mb-8 max-w-2xl">
            Обычно сопоставление каталогов решают поисковым движком, нечётким поиском и руками
            программистов. Вот в чём разница.
          </p>

          <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900/50">
                  <th className="text-left py-3 px-4 font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest text-xs">Критерий</th>
                  <th className="text-left py-3 px-4 font-bold text-slate-500 dark:text-slate-400">Elasticsearch + код</th>
                  <th className="text-left py-3 px-4 font-bold text-blue-600 dark:text-blue-400">Интеграм</th>
                </tr>
              </thead>
              <tbody>
                {CM_COMPARE_ROWS.map((r, i) => (
                  <tr key={i} className="border-t border-slate-100 dark:border-slate-800/60 align-top">
                    <td className="py-3 px-4 font-medium text-slate-900 dark:text-white">{r.criterion}</td>
                    <td className="py-3 px-4 text-slate-500 dark:text-slate-400">{r.them}</td>
                    <td className="py-3 px-4 text-slate-700 dark:text-slate-200">
                      <span className="inline-flex items-start gap-1.5">
                        <CheckCircle2 size={14} className="text-blue-500 shrink-0 mt-0.5" />
                        {r.us}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-6 p-5 rounded-2xl border border-amber-300/50 dark:border-amber-900/40 bg-amber-50/50 dark:bg-amber-950/20">
            <div className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-300">
              <AlertTriangle size={16} className="text-amber-500 shrink-0 mt-0.5" />
              <span>
                Токенный подход — это понятное первое приближение, а не «магия 100%». Качество растёт
                через веса и обязательные совпадения, а спорные пары снимает доуточнение языковой
                моделью. Для эталонной точности на узкой номенклатуре всё равно нужна ручная проверка
                верхних кандидатов.
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Video */}
      <section className="py-12 border-b border-slate-200 dark:border-slate-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 mb-4">
            <Play size={18} className="text-blue-600 dark:text-blue-400" />
            <h2 className="text-xl md:text-2xl font-bold">Как это работает — за 5 минут</h2>
          </div>
          <div className="rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-black shadow-sm dark:shadow-none">
            <video
              controls
              preload="metadata"
              className="w-full aspect-video"
              src={VIDEO_URL}
            >
              Ваш браузер не поддерживает встроенное видео.{' '}
              <a href={VIDEO_URL}>Скачать ролик</a>.
            </video>
          </div>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-3">
            Демонстрация на реальных данных: каталог картриджей, 22 000 позиций контрагента против
            десятков тысяч наших артикулов.
          </p>
        </div>
      </section>

      {/* Conclusion + CTA */}
      <section className="py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">Кому это нужно</h2>
          {CM_AUDIENCE.map((paragraph, i) => (
            <p
              key={i}
              className={`text-lg text-slate-600 dark:text-slate-300 leading-relaxed ${
                i === CM_AUDIENCE.length - 1 ? 'mb-10' : 'mb-4'
              }`}
            >
              {paragraph}
            </p>
          ))}

          <div
            id="cta"
            className="scroll-mt-24 rounded-3xl border border-blue-500/30 bg-gradient-to-b from-blue-50 to-white dark:from-blue-950/40 dark:to-slate-950 p-6 sm:p-8"
          >
            <div className="flex justify-center mb-4">
              <div className="w-14 h-14 rounded-2xl bg-blue-600 text-white flex items-center justify-center">
                <Sparkles size={26} />
              </div>
            </div>
            <h3 className="text-xl md:text-2xl font-bold mb-3 text-center">{CM_FORM.title}</h3>
            <p className="text-slate-600 dark:text-slate-300 mb-6 max-w-xl mx-auto text-center">
              {CM_FORM.lead}
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
                {/* required гасит submit-событие для пустого контакта, чтобы автоцель
                    Метрики «Отправка формы» не засчитала пустую заявку (issue #467). */}
                <input
                  name="contact"
                  type="text"
                  required
                  onInvalid={e => { e.preventDefault(); setFormState('error'); setErrorMsg('Укажите контакт — email или Telegram, куда прислать результат.') }}
                  onInput={() => setIsCaptchaRequested(true)}
                  className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-slate-800 dark:text-slate-100 focus:border-blue-500 outline-none transition-all"
                  placeholder="@username или you@company.ru"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 ml-1">Про ваши каталоги</label>
                <textarea
                  name="task"
                  rows={3}
                  className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-slate-800 dark:text-slate-100 focus:border-blue-500 outline-none transition-all resize-none"
                  placeholder="Сколько позиций в каждом каталоге, в каком формате (Excel/CSV), какая номенклатура..."
                />
              </div>

              {/* Необязательные вложения: два каталога (#389) */}
              <div className="space-y-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/30 p-4">
                <div className="flex items-center gap-2">
                  <Paperclip size={14} className="text-blue-600 dark:text-blue-400" />
                  <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                    Каталоги{' '}
                    <span className="font-normal text-slate-400 dark:text-slate-500">— необязательно</span>
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Можно сразу приложить оба файла — посмотрим объём и формат заранее.{' '}
                  {ACCEPTED_EXTENSIONS.join(', ')} · до {formatBytes(MAX_FILE_BYTES)} каждый.
                </p>
                <CatalogFileInput
                  id="cm-our-catalog"
                  label="Ваш каталог (SKU)"
                  hint="ваши артикулы"
                  file={ourCatalog}
                  onPick={(f) => pickCatalogFile(f, setOurCatalog)}
                  onClear={() => setOurCatalog(null)}
                />
                <CatalogFileInput
                  id="cm-their-catalog"
                  label="Каталог контрагента (RFP)"
                  hint="куда ищем соответствия"
                  file={theirCatalog}
                  onPick={(f) => pickCatalogFile(f, setTheirCatalog)}
                  onClear={() => setTheirCatalog(null)}
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
                    href="/privacy.html"
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
                {formState === 'sending' ? 'Отправка...' : 'Отправить заявку'}
                {formState !== 'sending' && <Send size={18} />}
              </button>
            </form>
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-slate-400 dark:text-slate-500">
            <span className="inline-flex items-center gap-1.5"><Server size={14} /> Сервер в РФ — ideav.ru</span>
            <span className="inline-flex items-center gap-1.5"><ShieldCheck size={14} /> Ваши данные принадлежат вам</span>
            <span className="inline-flex items-center gap-1.5"><Boxes size={14} /> Без программирования</span>
          </div>

          <p className="mt-10 text-center text-sm">
            <Link to="/knowledge-base/21-catalog-matching.html" className="text-slate-400 dark:text-slate-500 hover:text-blue-500 transition-colors">
              В базе знаний: Интеграм вместо Elasticsearch →
            </Link>
          </p>
        </div>
      </section>

      <BlogLinks
        posts={[
          { title: 'Массовое сопоставление каталогов в Интеграме: автоматический подбор пар', slug: 'massovoe-sopostavlenie-katalogov' },
          { title: 'Сопоставление каталогов продукции в конструкторе Интеграм', slug: 'sopostavlenie-katalogov-produkcii-v-integram' },
        ]}
      />
    </div>
  )
}
