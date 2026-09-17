import { useEffect, useRef, useState, type FormEvent } from 'react'
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  ClipboardList,
  FileSpreadsheet,
  MessageSquare,
  Paperclip,
  ShieldCheck,
  Sparkles,
  Table2,
  Users,
  X,
  ZoomIn,
} from 'lucide-react'
import { GOALS, reachGoal, reachSignupGoal } from './conversion'
import { Logo } from './Logo'

const TELEGRAM_BOT_URL = 'https://t.me/Integrammbot'
const CONTACT_EMAIL = 'abc@integram.io'
const ANALYSIS_PRICE = '20 000 ₽'
const SUBMIT_ENDPOINT = 'order.php'

// Лимиты вложений — зеркалят серверные в order.php.
const MAX_FILES = 5
const MAX_FILE_BYTES = 10 * 1024 * 1024
const FILE_ACCEPT = '.xlsx,.xls,.csv,.ods,.doc,.docx,.pdf,.txt'

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

type Screen = (typeof SCREENS)[number]

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

function formatBytes(n: number): string {
  if (n >= 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(1)} МБ`
  if (n >= 1024) return `${Math.round(n / 1024)} КБ`
  return `${n} Б`
}

/** Форма заявки: демонстрация (с файлами) и запись на разбор — одна разметка. */
function OrderForm({
  kind,
  title,
  sub,
  submitLabel,
  withFiles,
  taskLabel,
  onSent,
}: {
  kind: 'demo' | 'razbor'
  title: string
  sub: string
  submitLabel: string
  withFiles: boolean
  taskLabel: string
  onSent?: () => void
}) {
  const [sent, setSent] = useState(false)
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
    for (const f of files) data.append('files[]', f, f.name)
    setBusy(true)
    setError('')
    try {
      const response = await fetch(SUBMIT_ENDPOINT, { method: 'POST', body: data })
      const payload = (await response.json().catch(() => ({}))) as { ok?: boolean; error?: string }
      if (!response.ok || !payload.ok) {
        setError(payload.error ?? 'Не получилось отправить. Напишите нам в телеграм — так надёжнее.')
        return
      }
      reachGoal(GOALS.lead, { source: `excel-cpa-landing-${kind}` })
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
          <CheckCircle2 size={22} className="text-green-600" /> Принято
        </h3>
        <p className="mt-3 text-slate-700 leading-relaxed">
          {kind === 'demo'
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
    <form onSubmit={submit} className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
      <h3 className="text-xl font-bold">{title}</h3>
      <p className="mt-2 text-slate-600">{sub}</p>

      <div className="mt-6 space-y-4">
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
            <a href="#privacy" className="text-blue-600 hover:underline">
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
        className="mt-6 w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-4 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold transition-colors"
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

export default function Landing() {
  const [funnelOpen, setFunnelOpen] = useState(false)
  const [signupOpen, setSignupOpen] = useState(false)
  const [zoomed, setZoomed] = useState<Screen | null>(null)

  function openFunnel(): void {
    setFunnelOpen(true)
    reachGoal(GOALS.priceOpen, { dwell: 'first_click' })
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
      <header className="border-b border-slate-200 bg-white/90 backdrop-blur sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <Logo className="h-7 w-auto text-slate-900" />
          <a href={`mailto:${CONTACT_EMAIL}`} className="text-sm text-slate-500 hover:text-blue-600">
            {CONTACT_EMAIL}
          </a>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="relative overflow-hidden bg-gradient-to-b from-blue-50 via-white to-white">
          <div className="absolute -top-24 right-0 w-96 h-96 bg-blue-500/10 blur-[120px] rounded-full pointer-events-none" />
          <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-16 pb-12 sm:pt-24">
            <p className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-blue-500/30 bg-white text-blue-600 text-sm font-medium">
              <Sparkles size={14} />
              Бесплатная демонстрация за 45 минут
            </p>
            <h1 className="mt-6 text-4xl sm:text-5xl font-bold tracking-tight leading-tight">
              Сделайте себе <span className="text-blue-600">полноценное приложение</span>
              <br className="hidden sm:block" /> из вашего Excel
            </h1>
            <p className="mt-6 text-lg text-slate-600 leading-relaxed max-w-2xl">
              Пришлите таблицы, по которым живёт участок, склад или объект, — и, если есть,
              ТЗ в свободной форме. Через 45 минут ИИ-агент Интеграма вернёт работающее
              веб-приложение с вашими данными: формы, права доступа, отчёты и графики.
            </p>

            <div className="mt-10">
              {!funnelOpen ? (
                <button
                  type="button"
                  onClick={openFunnel}
                  className="inline-flex items-center gap-2 px-7 py-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-lg shadow-lg shadow-blue-600/20 transition-colors"
                >
                  Сделать приложение из моего Excel
                  <ArrowRight size={20} />
                </button>
              ) : (
                <p className="text-slate-500">Ниже — форма: пришлите файлы и опишите задачу.</p>
              )}
            </div>
          </div>
        </section>

        {/* Как это происходит */}
        <section className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
            Как это происходит
          </h2>
          <div className="mt-6 grid gap-8 sm:grid-cols-3">
            {STEPS.map(({ icon: Icon, title, body }, i) => (
              <div key={title} className="relative rounded-2xl border border-slate-200 p-5">
                <span className="absolute -top-3 left-5 px-2 py-0.5 rounded-full bg-blue-600 text-white text-xs font-bold">
                  {i + 1}
                </span>
                <Icon size={22} className="text-blue-600" />
                <h3 className="mt-3 font-semibold">{title}</h3>
                <p className="mt-2 text-slate-600 leading-relaxed text-sm">{body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Скрины результата */}
        <section className="bg-slate-50 border-y border-slate-200">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
            <h2 className="text-2xl sm:text-3xl font-bold">Что вы увидите через 45 минут</h2>
            <p className="mt-3 text-slate-600 max-w-2xl">
              Не макет и не презентация — работающее приложение на ваших данных. Экраны, таблицы
              и графики, в которые уже можно вносить записи.
            </p>
            <div className="mt-8 grid gap-6 sm:grid-cols-3">
              {SCREENS.map(screen => (
                <figure
                  key={screen.src}
                  className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm"
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

        {/* Боли и что вместо них */}
        <section className="max-w-5xl mx-auto px-4 sm:px-6 py-12 grid gap-12 lg:grid-cols-2">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
              Где таблица перестаёт справляться
            </h2>
            <div className="mt-6 space-y-6">
              {PAINS.map(({ icon: Icon, title, body }) => (
                <div key={title} className="flex gap-4">
                  <Icon size={22} className="text-slate-400 shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold">{title}</h3>
                    <p className="mt-1 text-slate-600 leading-relaxed text-sm">{body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
              Что будет вместо неё
            </h2>
            <div className="mt-6 space-y-6">
              {GAINS.map(({ icon: Icon, title, body }) => (
                <div key={title} className="flex gap-4">
                  <Icon size={22} className="text-blue-600 shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold">{title}</h3>
                    <p className="mt-1 text-slate-600 leading-relaxed text-sm">{body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {funnelOpen && (
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

            {/* Следующий шаг: разбор */}
            <section id="price" className="scroll-mt-16 max-w-5xl mx-auto px-4 sm:px-6 py-8">
              <div className="rounded-2xl border border-blue-500/30 bg-blue-50/60 p-6 sm:p-10">
                <h2 className="text-2xl sm:text-3xl font-bold">
                  Понравилась заготовка? Разберём её и посчитаем разработку — {ANALYSIS_PRICE}
                </h2>
                <p className="mt-4 text-slate-700 leading-relaxed max-w-2xl">
                  Демонстрация показывает, что это в принципе реально. Дальше — разбор вашей
                  заготовки: два интервью, полноценное ТЗ с помощью ИИ и понятная цена
                  доведения до рабочей системы.
                </p>

                <ul className="mt-6 space-y-3">
                  {ANALYSIS_INCLUDES.map(item => (
                    <li key={item} className="flex items-start gap-3 text-slate-700">
                      <CheckCircle2 size={20} className="text-blue-600 shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>

                {!signupOpen && (
                  <button
                    type="button"
                    onClick={openSignup}
                    className="mt-8 inline-flex items-center gap-2 px-7 py-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-lg shadow-lg shadow-blue-600/20 transition-colors"
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

      <footer id="privacy" className="border-t border-slate-200 scroll-mt-6">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 text-sm text-slate-500 space-y-3">
          <p>
            Оператор персональных данных — АО «Интеграм», ИНН 9716002710, ОГРН 1247700757590.
            Через форму на этой странице мы собираем имя, контакт, описание задачи и приложенные
            файлы — только чтобы собрать демонстрацию и ответить на заявку. Данные не передаются
            третьим лицам и хранятся на сервере в России.
          </p>
          <p>
            Отозвать согласие и удалить данные можно письмом на{' '}
            <a href={`mailto:${CONTACT_EMAIL}`} className="text-blue-600 hover:underline">
              {CONTACT_EMAIL}
            </a>
            .
          </p>
          <p>
            Сервис работает на платформе Интеграм (реестр отечественного ПО, запись №30872).
            Регистрация и биллинг — на{' '}
            <a href="https://ideav.ru/" className="text-blue-600 hover:underline">
              ideav.ru
            </a>
            .
          </p>
          <p>© {new Date().getFullYear()} АО «Интеграм»</p>
        </div>
      </footer>

      {zoomed && <Lightbox screen={zoomed} onClose={() => setZoomed(null)} />}
    </div>
  )
}
