import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react'
import {
  ArrowRight,
  BadgeCheck,
  BarChart3,
  CheckCircle2,
  ClipboardList,
  Clock3,
  FileSpreadsheet,
  Gift,
  LayoutDashboard,
  MessageSquare,
  Paperclip,
  Server,
  ShieldCheck,
  Sparkles,
  Table2,
  Users,
  X,
  ZoomIn,
} from 'lucide-react'
import { GOALS, dwellMs, looksHuman, reachExpressGoal, reachGoal, reachSignupGoal } from './conversion'
import { Cases, type Shot } from './Cases'
import { SiteFooter, SiteHeader } from './Chrome'
import {
  ANALYSIS_PRICE,
  FILE_ACCEPT,
  MAX_FILES,
  MAX_FILE_BYTES,
  PRAKTIKUM,
  PRIVACY_URL,
  TELEGRAM_BOT_URL,
} from './content'
import { Faq } from './Faq'
import { HowItWorks } from './HowItWorks'
import { Pricing } from './Pricing'
import { SITE_BASE } from './site-base'

const SUBMIT_ENDPOINT = 'order.php'

// Почему на странице ровно одна кнопка до первого клика — см. conversion.ts:
// вся воронка (форма демонстрации и запись на разбор) появляется только после
// раскрытия, и на целевую кнопку нельзя наткнуться автоматом, открывшим страницу.

const STEPS = [
  {
    icon: FileSpreadsheet,
    title: 'Присылаете Excel и пожелания',
    body: 'Таблицы как есть, без подготовки. Если есть ТЗ — приложите; нет — опишите своими словами, что должно получиться.',
  },
  {
    icon: Sparkles,
    title: 'ИИ-агент собирает приложение',
    body: 'Около 45 минут. Строит модель данных из ваших листов, поднимает формы, связи и отчёты.',
  },
  {
    icon: BarChart3,
    title: 'Смотрите живое приложение',
    body: 'Экраны, таблицы и графики — на ваших данных, по ссылке. Убедитесь, что это в принципе реально.',
  },
]

const SCREENS = [
  {
    src: 'img/uc-zayavki.png',
    alt: 'Формы и карточки заявок вместо строк в Excel',
    caption: 'Формы вместо строк: заявки, статусы, ответственные',
  },
  {
    src: 'img/uc-sklad.png',
    alt: 'Складской учёт: таблицы с фильтрами и историей изменений',
    caption: 'Таблицы с фильтрами, правами и историей правок',
  },
  {
    src: 'img/uc-otchetnost.png',
    alt: 'Отчёты и графики поверх тех же данных',
    caption: 'Отчёты и графики поверх тех же данных',
  },
]

type Screen = Shot

const PAINS = [
  {
    icon: FileSpreadsheet,
    title: 'Никто не знает, какая копия свежая',
    body: 'Файл живёт в почте, в телефоне мастера и на общей папке — и везде по-разному.',
  },
  {
    icon: Table2,
    title: 'Время пишут по памяти',
    body: 'Замеры и отметки заполняют в конце смены, потому что бумажке всё равно, когда её заполнили.',
  },
  {
    icon: Users,
    title: 'Уволился человек — уехал файл',
    body: 'Вместе с ним уезжают формулы, которые понимал только он.',
  },
]

const GAINS = [
  {
    icon: Table2,
    title: 'Одна база вместо файлов',
    body: 'Те же данные, но с формами и историей правок: видно, кто и когда менял.',
  },
  {
    icon: ShieldCheck,
    title: 'Роли и видимость',
    body: 'Оператор видит свои задания, мастер — смену, руководитель — сводку по всем.',
  },
  {
    icon: ClipboardList,
    title: 'Отчёты и выгрузка',
    body: 'В том же виде, к которому все привыкли, — строки и колонки как в вашем листе.',
  },
]

const ANALYSIS_INCLUDES = [
  'Два интервью: как работа устроена сейчас и где она ломается',
  'Полноценное ТЗ, написанное с помощью ИИ: модель данных, роли, рабочие места, приёмка',
  'Оценка стоимости разработки по этому ТЗ — обычно 50–100 тыс. ₽, включая уплаченные 20 тыс. за разбор',
  'ТЗ остаётся у вас — внедрять по нему можно с кем угодно',
]

// Только то, что на странице уже подтверждено: срок и цена демо — в герое и
// ценах, реестр ПО и хранение данных в России — в подвале.
const TRUST = [
  { icon: Clock3, label: '≈45 минут до демо', tone: 'bg-blue-100 text-blue-700' },
  { icon: Gift, label: 'Демонстрация бесплатно', tone: 'bg-violet-100 text-violet-700' },
  { icon: BadgeCheck, label: 'Реестр отечественного ПО', tone: 'bg-emerald-100 text-emerald-700' },
  { icon: Server, label: 'Данные хранятся в России', tone: 'bg-amber-100 text-amber-700' },
]

const STEP_TONES = [
  'from-emerald-500 to-teal-500 shadow-emerald-500/30',
  'from-blue-500 to-indigo-500 shadow-blue-500/30',
  'from-violet-500 to-fuchsia-500 shadow-violet-500/30',
]

const APP_ROWS = [
  { name: 'Заказ 1042', status: 'Новый', tone: 'bg-blue-100 text-blue-700' },
  { name: 'Заказ 1041', status: 'В работе', tone: 'bg-amber-100 text-amber-700' },
  { name: 'Заказ 1040', status: 'Готово', tone: 'bg-emerald-100 text-emerald-700' },
]

/**
 * Иллюстрация героя «таблица → приложение» (issue #643). Чистая разметка без
 * картинок: ничего не догружается, а в пререндере она такая же, как в браузере.
 * Для скринридера декорация не несёт смысла — смысл уже сказан заголовком.
 */
function HeroVisual() {
  return (
    <div aria-hidden="true" className="relative hidden sm:block h-[22rem] lg:h-[26rem] select-none">
      {/* Excel — сзади, чуть повёрнут */}
      <div className="absolute left-0 top-2 w-[62%] -rotate-3 rounded-2xl bg-white shadow-xl shadow-slate-900/10 ring-1 ring-slate-200 overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white text-xs font-semibold">
          <FileSpreadsheet size={14} /> заказы_итог_v7_ФИНАЛ.xlsx
        </div>
        <div className="grid grid-cols-4 text-[10px] text-slate-400">
          {Array.from({ length: 28 }, (_, i) => (
            <div key={i} className={`h-6 border-r border-b border-slate-100 px-1.5 flex items-center ${i < 4 ? 'bg-emerald-50 font-semibold text-emerald-800' : ''}`}>
              {i < 4 ? ['Дата', 'Клиент', 'Сумма', 'Статус'][i] : <span className="h-1.5 rounded bg-slate-200" style={{ width: `${40 + ((i * 37) % 50)}%` }} />}
            </div>
          ))}
        </div>
      </div>

      {/* Переход */}
      <div className="absolute left-[44%] top-[30%] z-20 -translate-x-1/2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-brand text-white text-xs font-semibold shadow-lg shadow-violet-600/30">
        <Sparkles size={13} /> ИИ-агент · 45 мин
      </div>

      {/* Приложение — спереди */}
      <div className="absolute right-0 bottom-0 z-10 w-[70%] rounded-2xl bg-white shadow-2xl shadow-indigo-900/20 ring-1 ring-slate-200 overflow-hidden">
        <div className="flex items-center gap-1.5 px-4 py-2.5 border-b border-slate-100">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-400" />
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
          <span className="ml-3 text-xs font-semibold text-slate-700">Заказы</span>
        </div>
        <div className="flex">
          <div className="w-10 shrink-0 bg-brand flex flex-col items-center gap-3 py-3 text-white/90">
            <LayoutDashboard size={15} />
            <Table2 size={15} />
            <Users size={15} />
          </div>
          <div className="flex-1 p-4 space-y-3">
            <div className="flex items-end gap-1.5 h-16">
              {[45, 70, 55, 85, 62, 95, 78].map((h, i) => (
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
    </div>
  )
}

/**
 * Откуда пришёл человек (issue #657): кнопки посадочных ведут сюда с
 * `?from=<slug>` и дописывают UTM-метки рекламы. Обе вещи уходят в заявку,
 * чтобы было видно, какая страница её принесла.
 */
function landingSource(): { page: string; utm: string } {
  if (typeof window === 'undefined') return { page: '', utm: '' }
  const query = new URLSearchParams(window.location.search)
  const from = query.get('from') ?? ''
  const utm = [...query.entries()]
    .filter(([name]) => name.startsWith('utm_'))
    .map(([name, value]) => `${name}=${value}`)
    .join('&')
  return { page: /^[a-z0-9-]{1,80}$/.test(from) ? from : '', utm: utm.slice(0, 500) }
}

/**
 * Формат заявки на демонстрацию (issue #659): просто ссылка на приложение или
 * практикум — тот же собранный агентом проект плюс час разбора с ведущим.
 * Для сборки это одна и та же заявка `demo`, отличается только отметка.
 */
type DemoFormat = 'demo' | 'praktikum'

const DEMO_FORMATS: { value: DemoFormat; title: string; body: string }[] = [
  {
    value: 'demo',
    title: 'Только приложение',
    body: 'Соберём и пришлём ссылку — разберётесь сами.',
  },
  {
    value: 'praktikum',
    title: 'Практикум: час с ведущим',
    body: `Соберём заранее, потом за час онлайн разберём его вместе на ваших данных. ${PRAKTIKUM.price}, ссылку на оплату пришлём после подтверждения.`,
  },
]

/** Адрес, по которому форма на главной открывается с выбранным практикумом. */
const PRAKTIKUM_HASH = '#praktikum'

function formatBytes(n: number): string {
  if (n >= 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(1)} МБ`
  if (n >= 1024) return `${Math.round(n / 1024)} КБ`
  return `${n} Б`
}

/**
 * Форма заявки: демонстрация (с файлами), запись на разбор и экспресс-разработка
 * из карточек цен (issue #619) — одна разметка.
 */
function OrderForm({
  kind,
  title,
  sub,
  submitLabel,
  withFiles,
  taskLabel,
  plan,
  format,
  onFormat,
  onSent,
}: {
  kind: 'demo' | 'razbor' | 'express'
  title: string
  sub: string
  submitLabel: string
  withFiles: boolean
  taskLabel: string
  /** Карточка цен, с которой открыта форма, — уходит в заявку. */
  plan?: string
  /** Выбор «демонстрация / практикум» — только у формы демонстрации. */
  format?: DemoFormat
  onFormat?: (format: DemoFormat) => void
  onSent?: () => void
}) {
  const [sent, setSent] = useState(false)
  // Адрес ждёт подтверждения по ссылке из письма (issue #624): заявка принята,
  // но сборка не начнётся, пока человек не перейдёт по ссылке, — и обещать ему
  // «вернёмся со ссылкой на приложение» в этом случае нельзя.
  const [pending, setPending] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [files, setFiles] = useState<File[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  function addFiles(list: FileList | null): void {
    if (!list) return
    const next = [...files]
    for (const f of Array.from(list)) {
      if (next.length >= MAX_FILES) {
        setError(`Не больше ${MAX_FILES} файлов — остальное дошлёте в телеграм.`)
        break
      }
      if (f.size > MAX_FILE_BYTES) {
        setError(`«${f.name}» больше 10 МБ — пришлите его в телеграм-бот.`)
        continue
      }
      if (!next.some(x => x.name === f.name && x.size === f.size)) next.push(f)
    }
    setFiles(next)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  async function submit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault()
    const form = event.currentTarget
    const data = new FormData(form)
    data.set('kind', kind)
    if (plan) data.set('plan', plan)
    const source = landingSource()
    if (source.page) data.set('page', source.page)
    if (source.utm) data.set('utm', source.utm)
    if (format) data.set('format', format)
    for (const f of files) data.append('files[]', f, f.name)
    setBusy(true)
    setError('')
    try {
      const response = await fetch(SUBMIT_ENDPOINT, { method: 'POST', body: data })
      const payload = (await response.json().catch(() => ({}))) as {
        ok?: boolean
        error?: string
        status?: string
        message?: string
      }
      if (!response.ok || !payload.ok) {
        setError(payload.error ?? 'Не получилось отправить. Напишите нам в телеграм — так надёжнее.')
        return
      }
      const praktikum = format === 'praktikum'
      reachGoal(GOALS.lead, {
        source: `excel-cpa-landing-${praktikum ? 'praktikum' : kind}`,
        page: source.page || 'main',
      })
      if (praktikum) reachGoal(GOALS.praktikum, { dwell_ms: dwellMs() })
      if (kind === 'express') reachExpressGoal(plan ?? '')
      if (payload.status === 'pending_confirmation') {
        setPending(payload.message ?? 'Мы отправили письмо со ссылкой — перейдите по ней, и мы начнём сборку.')
      }
      setSent(true)
      onSent?.()
    } catch {
      setError('Не получилось отправить. Напишите нам в телеграм — так надёжнее.')
    } finally {
      setBusy(false)
    }
  }

  if (sent) {
    return (
      <div className="rounded-2xl border border-green-500/30 bg-green-50 p-6 sm:p-8">
        <h3 className="text-xl font-bold flex items-center gap-2">
          <CheckCircle2 size={22} className="text-green-600" />
          {pending ? 'Подтвердите адрес' : 'Принято'}
        </h3>
        {pending && <p className="mt-3 text-slate-800 font-medium leading-relaxed">{pending}</p>}
        <p className="mt-3 text-slate-700 leading-relaxed">
          {pending
            ? 'Письма нет через пару минут — посмотрите в «Спам». Или напишите нам в '
            : format === 'praktikum'
              ? 'Соберём приложение и напишем, чтобы согласовать время практикума. Быстрее всего — в '
              : kind === 'demo'
              ? 'Вернёмся со ссылкой на готовое приложение. Быстрее всего — в '
              : 'Ответим в течение рабочего дня. Быстрее всего — в '}
          <a
            href={TELEGRAM_BOT_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline"
          >
            @Integrammbot
          </a>
          : там ответ приходит в чат и не теряется в спаме.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={submit} className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xl shadow-indigo-500/10">
      <h3 className="text-xl font-bold">{title}</h3>
      <p className="mt-2 text-slate-600">{sub}</p>

      <div className="mt-6 space-y-4">
        {format && onFormat && (
          <fieldset>
            <legend className="text-sm font-medium text-slate-700">Что вам удобнее</legend>
            <div className="mt-2 grid gap-3 sm:grid-cols-2">
              {DEMO_FORMATS.map(option => (
                <label
                  key={option.value}
                  className={`flex items-start gap-3 rounded-xl border p-3 cursor-pointer transition-colors ${
                    format === option.value ? 'border-blue-500 bg-blue-50/60' : 'border-slate-300 hover:border-blue-400'
                  }`}
                >
                  <input
                    type="radio"
                    name="format-choice"
                    value={option.value}
                    checked={format === option.value}
                    onChange={() => onFormat(option.value)}
                    className="mt-1"
                  />
                  <span>
                    <span className="block font-semibold text-sm">{option.title}</span>
                    <span className="block text-xs text-slate-500 mt-0.5">{option.body}</span>
                  </span>
                </label>
              ))}
            </div>
            <p className="mt-2 text-xs text-slate-500">
              Что нужно уметь для практикума и как проходит час —{' '}
              <a href={`${SITE_BASE}${PRAKTIKUM.slug}/`} className="text-blue-600 hover:underline">
                на странице практикума
              </a>
              .
            </p>
          </fieldset>
        )}

        <label className="block">
          <span className="text-sm font-medium text-slate-700">Как вас зовут</span>
          <input
            name="name"
            required
            maxLength={200}
            className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium text-slate-700">
            Куда ответить — почта, телефон или телеграм
          </span>
          <input
            name="contact"
            required
            maxLength={200}
            className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium text-slate-700">{taskLabel}</span>
          <textarea
            name="task"
            required
            rows={4}
            maxLength={5000}
            className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </label>

        {withFiles && (
          <div>
            {files.length > 0 && (
              <ul className="mb-2 flex flex-wrap gap-2">
                {files.map((f, i) => (
                  <li
                    key={`${f.name}-${f.size}`}
                    className="flex items-center gap-2 max-w-full pl-3 pr-1.5 py-1 rounded-full bg-slate-100 text-xs text-slate-600"
                  >
                    <Paperclip size={12} className="shrink-0 text-blue-600" />
                    <span className="truncate max-w-[11rem]" title={f.name}>{f.name}</span>
                    <span className="text-slate-400 shrink-0">{formatBytes(f.size)}</span>
                    <button
                      type="button"
                      aria-label={`Убрать файл ${f.name}`}
                      onClick={() => setFiles(files.filter((_, j) => j !== i))}
                      className="shrink-0 rounded-full p-0.5 hover:bg-slate-200 transition-colors"
                    >
                      <X size={12} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept={FILE_ACCEPT}
              className="hidden"
              onChange={e => addFiles(e.target.files)}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-600 hover:border-blue-500 hover:text-blue-600 transition-colors"
            >
              <Paperclip size={16} />
              Приложить Excel и ТЗ
            </button>
            <span className="ml-3 text-xs text-slate-400">до {MAX_FILES} файлов, 10 МБ каждый</span>
          </div>
        )}

        {/* Honeypot: живой посетитель этого поля не видит. */}
        <input
          type="text"
          name="website"
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
          className="hidden"
        />

        <label className="flex items-start gap-3 text-sm text-slate-600">
          <input type="checkbox" name="consent" required className="mt-1" />
          <span>
            Даю согласие на обработку персональных данных на условиях{' '}
            <a
              href={PRIVACY_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              политики
            </a>
            .
          </span>
        </label>
      </div>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={busy}
        className="btn-primary mt-6 w-full sm:w-auto px-7 py-4"
      >
        <MessageSquare size={18} />
        {busy ? 'Отправляю…' : submitLabel}
      </button>
    </form>
  )
}

/**
 * Скриншот в полный размер поверх страницы. В плитке картинки обрезаны до
 * полоски 160 px (`object-cover`), и по ним не видно, что там на самом деле, —
 * поэтому они кликабельны (issue #603).
 *
 * Никаких целей отсюда не уходит: просмотр картинки — не конверсия, и клик по
 * ней не должен попадать в статистику, на которой учится стратегия Директа.
 */
function Lightbox({ screen, onClose }: { screen: Screen; onClose: () => void }) {
  const closeRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null
    closeRef.current?.focus()

    function onKeyDown(event: KeyboardEvent): void {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)

    // Фон под слоем не должен уезжать от колеса мыши.
    const scrollLocked = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = scrollLocked
      opener?.focus?.()
    }
  }, [onClose])

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={screen.caption}
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/85 backdrop-blur-sm p-4 sm:p-8 cursor-zoom-out"
    >
      <button
        ref={closeRef}
        type="button"
        onClick={onClose}
        aria-label="Закрыть"
        className="absolute top-3 right-3 sm:top-5 sm:right-5 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
      >
        <X size={24} />
      </button>

      {/* Клик по самой картинке не закрывает: её хотят рассматривать. */}
      <figure className="max-w-5xl cursor-default" onClick={event => event.stopPropagation()}>
        <img
          src={screen.src}
          alt={screen.alt}
          className="max-h-[80vh] w-auto mx-auto rounded-xl bg-white shadow-2xl object-contain"
        />
        <figcaption className="mt-4 text-center text-sm text-slate-200">{screen.caption}</figcaption>
      </figure>
    </div>
  )
}

/**
 * Модальная заявка на экспресс-разработку — её открывают кнопки карточек цен
 * (issue #619), по образцу формы ideav.ru/#cta.
 *
 * Открытие окна целей не шлёт: кликер, который жмёт всё подряд, дальше пустой
 * формы не продвинется. Цель `express_lead` уходит только из OrderForm после
 * ответа order.php «принято». По фону окно не закрывается — случайный клик
 * мимо не должен стирать набранный текст; только крестик и Escape.
 */
function ExpressModal({ plan, onClose }: { plan: string; onClose: () => void }) {
  const closeRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null
    closeRef.current?.focus()

    function onKeyDown(event: KeyboardEvent): void {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)

    const scrollLocked = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = scrollLocked
      opener?.focus?.()
    }
  }, [onClose])

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Заявка на экспресс-разработку приложений"
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-sm"
    >
      <div className="relative max-w-2xl mx-auto px-4 pt-16 pb-10">
        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          aria-label="Закрыть"
          className="absolute top-3 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
        >
          <X size={22} />
        </button>
        <OrderForm
          kind="express"
          plan={plan}
          title="Заявка на экспресс-разработку приложений"
          sub={`Вы выбрали: «${plan}». Опишите задачу и приложите Excel или ТЗ — оценим архитектуру и сроки за 24 часа.`}
          submitLabel="Отправить заявку"
          withFiles
          taskLabel="Что за процесс и что должно получиться"
        />
      </div>
    </div>
  )
}

export default function Landing() {
  const [funnelOpen, setFunnelOpen] = useState(false)
  const [signupOpen, setSignupOpen] = useState(false)
  const [zoomed, setZoomed] = useState<Screen | null>(null)
  const [expressPlan, setExpressPlan] = useState<string | null>(null)
  const closeExpress = useCallback(() => setExpressPlan(null), [])
  // Форма демонстрации без раскрытия воронки — только по ссылке со страницы
  // практикума (/#praktikum, issue #659). Блок разбора с целевой кнопкой при
  // этом остаётся за первым кликом: защита от кликеров не ослабевает.
  const [demoOpen, setDemoOpen] = useState(false)
  const [format, setFormat] = useState<DemoFormat>('demo')

  useEffect(() => {
    function fromHash(): void {
      if (window.location.hash !== PRAKTIKUM_HASH) return
      setFormat('praktikum')
      setDemoOpen(true)
      requestAnimationFrame(() => {
        document.getElementById('demo')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      })
    }
    fromHash()
    window.addEventListener('hashchange', fromHash)
    return () => window.removeEventListener('hashchange', fromHash)
  }, [])

  function openFunnel(): void {
    // price_open — цель одного клика, поэтому только через проверку на
    // человека (issue #619): кликер не должен набивать и наблюдательные цели.
    if (!funnelOpen && looksHuman()) reachGoal(GOALS.priceOpen, { dwell: 'first_click' })
    setFunnelOpen(true)
    requestAnimationFrame(() => {
      document.getElementById('demo')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
  }

  function openSignup(): void {
    // Целевое действие кампании: Директ платит за него, поэтому цель уходит
    // через проверку на человека (conversion.ts), а не напрямую.
    reachSignupGoal('price_block')
    setSignupOpen(true)
    requestAnimationFrame(() => {
      document.getElementById('zayavka')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
  }

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <SiteHeader />

      <main>
        {/* Hero */}
        <section className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-violet-50/60 to-emerald-50/50">
          {/* Цветные пятна фона; при «уменьшить движение» замирают (index.css). */}
          <div className="absolute -top-32 -right-24 w-[28rem] h-[28rem] bg-violet-400/25 blur-[110px] rounded-full pointer-events-none animate-float" />
          <div className="absolute top-40 -left-32 w-[24rem] h-[24rem] bg-blue-400/25 blur-[110px] rounded-full pointer-events-none animate-float-slow" />
          <div className="absolute -bottom-24 right-1/3 w-80 h-80 bg-emerald-300/25 blur-[100px] rounded-full pointer-events-none animate-float" />
          <div className="relative max-w-6xl mx-auto px-4 sm:px-6 pt-14 pb-16 sm:pt-20 sm:pb-20 grid gap-12 lg:grid-cols-[1.15fr_1fr] lg:items-center">
            <div>
              <p className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-violet-500/20 bg-white/80 backdrop-blur text-violet-700 text-sm font-medium shadow-sm">
                <Sparkles size={14} />
                Бесплатная демонстрация за ~45 минут
              </p>
              <h1 className="mt-6 text-4xl sm:text-5xl lg:text-[3.4rem] font-extrabold tracking-tight leading-[1.08]">
                Сделайте себе <span className="text-gradient">полноценное приложение</span>
                <br className="hidden sm:block" /> из вашего Excel
              </h1>
              <p className="mt-6 text-lg text-slate-600 leading-relaxed max-w-2xl">
                Пришлите ваши таблицы, по которым живёт участок, склад или объект. Если есть, приложите
                ТЗ в свободной форме. Примерно через 45 минут ИИ-агент Интеграма вернёт работающее
                веб-приложение с вашими данными: формы, права доступа, отчёты и графики.
              </p>

              <div className="mt-10">
                {!funnelOpen ? (
                  <button
                    type="button"
                    onClick={openFunnel}
                    className="btn-primary px-7 py-4 text-lg"
                  >
                    Сделать приложение из моего Excel
                    <ArrowRight size={20} />
                  </button>
                ) : (
                  <p className="text-slate-500">Ниже — форма: пришлите файлы и опишите задачу.</p>
                )}
              </div>
              <p className="mt-5 text-sm text-slate-500">
                Демонстрация — бесплатно · разбор процесса — {ANALYSIS_PRICE} · облако — от 1 950 ₽/мес.{' '}
                <a href="#ceny" className="text-blue-600 font-medium hover:underline">
                  Все цены
                </a>
              </p>
              <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-sm text-slate-700">
                {TRUST.map(({ icon: Icon, label, tone }) => (
                  <li key={label} className="inline-flex items-center gap-2">
                    <span className={`w-7 h-7 rounded-lg flex items-center justify-center ${tone}`}>
                      <Icon size={15} />
                    </span>
                    {label}
                  </li>
                ))}
              </ul>
            </div>

            <HeroVisual />
          </div>
        </section>

        {/* Как это происходит */}
        <section id="kak-proishodit" className="scroll-mt-16 max-w-5xl mx-auto px-4 sm:px-6 py-12">
          <h2 className="text-sm font-bold uppercase tracking-widest text-gradient">
            Как это происходит
          </h2>
          <div className="mt-6 grid gap-6 sm:grid-cols-3">
            {STEPS.map(({ icon: Icon, title, body }, i) => (
              <div
                key={title}
                className="relative rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-indigo-500/10"
              >
                <span className="absolute top-5 right-5 text-4xl font-extrabold text-slate-100">
                  {i + 1}
                </span>
                <span
                  className={`relative w-11 h-11 rounded-xl bg-gradient-to-br text-white flex items-center justify-center shadow-lg ${STEP_TONES[i]}`}
                >
                  <Icon size={22} />
                </span>
                <h3 className="relative mt-4 font-semibold">{title}</h3>
                <p className="mt-2 text-slate-600 leading-relaxed text-sm">{body}</p>
              </div>
            ))}
          </div>
          {/* Новичкам — практикум (issue #659): обычная ссылка, не кнопка воронки. */}
          <p className="mt-6 text-sm text-slate-600">
            Ни разу не делали проект с ИИ?{' '}
            <a href={`${SITE_BASE}${PRAKTIKUM.slug}/`} className="text-blue-600 font-medium hover:underline">
              Практикум «{PRAKTIKUM.title}»
            </a>{' '}
            за {PRAKTIKUM.price} — что нужно уметь и как проходит час.
          </p>
        </section>

        {/* Скрины результата */}
        <section className="bg-gradient-to-b from-slate-50 to-indigo-50/60 border-y border-slate-200">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-14">
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Что вы увидите через 45 минут</h2>
            <p className="mt-3 text-slate-600 max-w-2xl">
              Не макет и не презентация — работающее приложение на ваших данных. Экраны, таблицы
              и графики, в которые уже можно вносить записи.
            </p>
            <div className="mt-8 grid gap-6 sm:grid-cols-3">
              {SCREENS.map(screen => (
                <figure
                  key={screen.src}
                  className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-indigo-500/10"
                >
                  <button
                    type="button"
                    onClick={() => setZoomed(screen)}
                    aria-label={`Открыть в полный размер: ${screen.caption}`}
                    className="group relative block w-full cursor-zoom-in focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-inset"
                  >
                    <img
                      src={screen.src}
                      alt={screen.alt}
                      loading="lazy"
                      className="w-full h-40 object-cover object-top transition-transform duration-300 group-hover:scale-105"
                    />
                    {/* Значок виден всегда: на телефоне навести курсор некуда,
                        а по обрезанной полоске не догадаться, что она кликабельна. */}
                    <span className="absolute top-2 right-2 p-1.5 rounded-lg bg-slate-900/55 text-white group-hover:bg-slate-900/75 transition-colors">
                      <ZoomIn size={16} />
                    </span>
                  </button>
                  <figcaption className="px-4 py-3 text-sm text-slate-600">{screen.caption}</figcaption>
                </figure>
              ))}
            </div>
          </div>
        </section>

        <Cases onZoom={setZoomed} />

        {/* Боли и что вместо них */}
        <section className="max-w-5xl mx-auto px-4 sm:px-6 py-12 grid gap-6 lg:grid-cols-2">
          <div className="rounded-3xl bg-rose-50/70 border border-rose-100 p-6 sm:p-8">
            <h2 className="text-sm font-bold uppercase tracking-widest text-rose-600">
              Где таблица перестаёт справляться
            </h2>
            <div className="mt-6 space-y-6">
              {PAINS.map(({ icon: Icon, title, body }) => (
                <div key={title} className="flex gap-4">
                  <span className="shrink-0 w-10 h-10 rounded-xl bg-white text-rose-500 shadow-sm flex items-center justify-center">
                    <Icon size={20} />
                  </span>
                  <div>
                    <h3 className="font-semibold">{title}</h3>
                    <p className="mt-1 text-slate-600 leading-relaxed text-sm">{body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-3xl bg-emerald-50/80 border border-emerald-100 p-6 sm:p-8">
            <h2 className="text-sm font-bold uppercase tracking-widest text-emerald-700">
              Что будет вместо неё
            </h2>
            <div className="mt-6 space-y-6">
              {GAINS.map(({ icon: Icon, title, body }) => (
                <div key={title} className="flex gap-4">
                  <span className="shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-md shadow-emerald-500/30 flex items-center justify-center">
                    <Icon size={20} />
                  </span>
                  <div>
                    <h3 className="font-semibold">{title}</h3>
                    <p className="mt-1 text-slate-600 leading-relaxed text-sm">{body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <HowItWorks />

        <Pricing onOrder={setExpressPlan} />

        <Faq />

        {(funnelOpen || demoOpen) && (
          <>
            {/* Заявка на демонстрацию */}
            <section id="demo" className="scroll-mt-16 max-w-2xl mx-auto px-4 sm:px-6 py-8">
              <OrderForm
                kind="demo"
                title="Пришлите Excel — получите приложение"
                sub="Демонстрация бесплатна. Приложите файлы и опишите задачу своими словами — как надиктовали бы коллеге."
                submitLabel="Отправить на демонстрацию"
                withFiles
                taskLabel="Что за процесс и что должно получиться"
                format={format}
                onFormat={setFormat}
              />
              <p className="mt-4 text-sm text-slate-500 text-center">
                Удобнее в мессенджере? Пришлите файл{' '}
                <a
                  href={TELEGRAM_BOT_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  в телеграм-бот
                </a>{' '}
                — соберём так же бесплатно.
              </p>
            </section>
          </>
        )}

        {funnelOpen && (
          <>
            {/* Следующий шаг: разбор */}
            <section id="price" className="scroll-mt-16 max-w-5xl mx-auto px-4 sm:px-6 py-8">
              <div className="relative overflow-hidden rounded-3xl bg-brand p-6 sm:p-10 text-white shadow-2xl shadow-indigo-600/25">
                <div className="absolute -top-20 -right-16 w-72 h-72 bg-fuchsia-400/30 blur-[90px] rounded-full pointer-events-none" />
                <h2 className="relative text-2xl sm:text-3xl font-extrabold tracking-tight">
                  Понравилась заготовка? Разберём её и посчитаем разработку — {ANALYSIS_PRICE}
                </h2>
                <p className="relative mt-4 text-blue-50 leading-relaxed max-w-2xl">
                  Демонстрация показывает, что это в принципе реально. Дальше — разбор вашей
                  заготовки: два интервью, полноценное ТЗ с помощью ИИ и понятная цена
                  доведения до рабочей системы.
                </p>

                <ul className="relative mt-6 space-y-3">
                  {ANALYSIS_INCLUDES.map(item => (
                    <li key={item} className="flex items-start gap-3 text-white">
                      <CheckCircle2 size={20} className="text-emerald-300 shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>

                {!signupOpen && (
                  <button
                    type="button"
                    onClick={openSignup}
                    className="relative mt-8 inline-flex items-center gap-2 px-7 py-4 rounded-xl bg-white text-indigo-700 font-semibold text-lg shadow-lg shadow-indigo-900/30 transition hover:-translate-y-0.5 hover:bg-indigo-50"
                  >
                    Записаться на разбор
                    <ArrowRight size={20} />
                  </button>
                )}
              </div>
            </section>
          </>
        )}

        {signupOpen && (
          <section id="zayavka" className="scroll-mt-16 max-w-2xl mx-auto px-4 sm:px-6 pb-16">
            <OrderForm
              kind="razbor"
              title="Запись на разбор"
              sub="Предоплату не берём — сначала созвон, потом счёт."
              submitLabel="Отправить"
              withFiles={false}
              taskLabel="Что за процесс и в каких таблицах он живёт"
            />
          </section>
        )}
      </main>

      <SiteFooter />

      {zoomed && <Lightbox screen={zoomed} onClose={() => setZoomed(null)} />}
      {expressPlan && <ExpressModal plan={expressPlan} onClose={closeExpress} />}
    </div>
  )
}
