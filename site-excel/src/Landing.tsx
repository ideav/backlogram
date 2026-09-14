import { useState, type FormEvent } from 'react'
import {
  ArrowRight,
  CheckCircle2,
  ClipboardList,
  FileSpreadsheet,
  MessageSquare,
  ShieldCheck,
  Table2,
  Users,
} from 'lucide-react'
import { GOALS, reachGoal, reachSignupGoal } from './conversion'

const TELEGRAM_BOT_URL = 'https://t.me/Integrammbot'
const CONTACT_EMAIL = 'abc@integram.io'
const ANALYSIS_PRICE = '20 000 ₽'
const SUBMIT_ENDPOINT = 'order.php'

// Почему на странице ровно одна кнопка до первого клика — см. conversion.ts:
// целевая кнопка появляется только после раскрытия блока с ценой, и на неё
// нельзя наткнуться автоматом, открывшим страницу.

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
  'Техническое задание: модель данных, роли, рабочие места, приёмка',
  'Список открытых вопросов, на которые внутри компании ещё нет ответа',
  'ТЗ остаётся у вас — внедрять по нему можно с кем угодно',
]

export default function Landing() {
  const [priceOpen, setPriceOpen] = useState(false)
  const [formOpen, setFormOpen] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  function openPrice(): void {
    setPriceOpen(true)
    reachGoal(GOALS.priceOpen, { dwell: 'first_click' })
    requestAnimationFrame(() => {
      document.getElementById('price')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
  }

  function openForm(): void {
    // Целевое действие кампании: Директ платит за него, поэтому цель уходит
    // через проверку на человека (conversion.ts), а не напрямую.
    reachSignupGoal('price_block')
    setFormOpen(true)
    requestAnimationFrame(() => {
      document.getElementById('zayavka')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
  }

  async function submit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault()
    const form = event.currentTarget
    const data = Object.fromEntries(new FormData(form).entries())
    setBusy(true)
    setError('')
    try {
      const response = await fetch(SUBMIT_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const payload = (await response.json().catch(() => ({}))) as { ok?: boolean; error?: string }
      if (!response.ok || !payload.ok) {
        setError(payload.error ?? 'Не получилось отправить. Напишите нам в телеграм — так надёжнее.')
        return
      }
      reachGoal(GOALS.lead, { source: 'excel-cpa-landing' })
      setSent(true)
    } catch {
      setError('Не получилось отправить. Напишите нам в телеграм — так надёжнее.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <header className="border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <span className="font-bold text-lg tracking-tight">Интеграм</span>
          <a href={`mailto:${CONTACT_EMAIL}`} className="text-sm text-slate-500 hover:text-blue-600">
            {CONTACT_EMAIL}
          </a>
        </div>
      </header>

      <main>
        <section className="max-w-5xl mx-auto px-4 sm:px-6 pt-14 pb-10 sm:pt-20">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight leading-tight">
            Excel остаётся Excel’ем.<br className="hidden sm:block" /> Сделаем из него приложение
          </h1>
          <p className="mt-6 text-lg text-slate-600 leading-relaxed max-w-2xl">
            Пришлите таблицу, по которой реально живёт участок, склад или объект. Через 45 минут
            вернём работающее веб-приложение с вашими данными: формы, права доступа, отчёты.
            Демонстрация — бесплатно.
          </p>

          <div className="mt-10">
            {!priceOpen ? (
              <button
                type="button"
                onClick={openPrice}
                className="inline-flex items-center gap-2 px-7 py-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-lg shadow-lg shadow-blue-600/20 transition-colors"
              >
                Сколько стоит и что на выходе
                <ArrowRight size={20} />
              </button>
            ) : (
              <p className="text-slate-500">Ниже — что входит и сколько стоит.</p>
            )}
          </div>
        </section>

        <section className="max-w-5xl mx-auto px-4 sm:px-6 py-10 border-t border-slate-200">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
            Где таблица перестаёт справляться
          </h2>
          <div className="mt-6 grid gap-8 sm:grid-cols-3">
            {PAINS.map(({ icon: Icon, title, body }) => (
              <div key={title}>
                <Icon size={22} className="text-blue-600" />
                <h3 className="mt-3 font-semibold">{title}</h3>
                <p className="mt-2 text-slate-600 leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="max-w-5xl mx-auto px-4 sm:px-6 py-10 border-t border-slate-200">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
            Что будет вместо неё
          </h2>
          <div className="mt-6 grid gap-8 sm:grid-cols-3">
            {GAINS.map(({ icon: Icon, title, body }) => (
              <div key={title}>
                <Icon size={22} className="text-blue-600" />
                <h3 className="mt-3 font-semibold">{title}</h3>
                <p className="mt-2 text-slate-600 leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </section>

        {priceOpen && (
          <section id="price" className="scroll-mt-6 max-w-5xl mx-auto px-4 sm:px-6 py-12">
            <div className="rounded-2xl border border-blue-500/30 bg-blue-50/60 p-6 sm:p-10">
              <h2 className="text-2xl sm:text-3xl font-bold">
                Демонстрация бесплатно. Разбор процесса — {ANALYSIS_PRICE}
              </h2>
              <p className="mt-4 text-slate-700 leading-relaxed max-w-2xl">
                Приложение из ваших таблиц мы соберём и покажем без денег: посмотрите на свои данные
                в работе и решайте сами. Платный шаг один и только по желанию — разбор процесса,
                после которого остаётся техническое задание.
              </p>

              <ul className="mt-6 space-y-3">
                {ANALYSIS_INCLUDES.map(item => (
                  <li key={item} className="flex items-start gap-3 text-slate-700">
                    <CheckCircle2 size={20} className="text-blue-600 shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>

              {!formOpen && (
                <button
                  type="button"
                  onClick={openForm}
                  className="mt-8 inline-flex items-center gap-2 px-7 py-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-lg shadow-lg shadow-blue-600/20 transition-colors"
                >
                  Записаться на разбор
                  <ArrowRight size={20} />
                </button>
              )}

              <p className="mt-6 text-sm text-slate-500">
                Не готовы к разбору — пришлите файл{' '}
                <a
                  href={TELEGRAM_BOT_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  в телеграм-бот
                </a>
                : демонстрацию соберём бесплатно и без обязательств.
              </p>
            </div>
          </section>
        )}

        {formOpen && (
          <section id="zayavka" className="scroll-mt-6 max-w-2xl mx-auto px-4 sm:px-6 pb-16">
            {sent ? (
              <div className="rounded-2xl border border-green-500/30 bg-green-50 p-6 sm:p-8">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <CheckCircle2 size={22} className="text-green-600" /> Записал
                </h2>
                <p className="mt-3 text-slate-700 leading-relaxed">
                  Ответим в течение рабочего дня. Быстрее всего — в{' '}
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
            ) : (
              <form onSubmit={submit} className="rounded-2xl border border-slate-200 p-6 sm:p-8">
                <h2 className="text-xl font-bold">Запись на разбор</h2>
                <p className="mt-2 text-slate-600">
                  Три поля. Предоплату не берём — сначала созвон, потом счёт.
                </p>

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
                    <span className="text-sm font-medium text-slate-700">
                      Что за процесс и в каких таблицах он живёт
                    </span>
                    <textarea
                      name="task"
                      required
                      rows={4}
                      maxLength={5000}
                      className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </label>

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
                  {busy ? 'Отправляю…' : 'Отправить'}
                </button>
              </form>
            )}
          </section>
        )}
      </main>

      <footer id="privacy" className="border-t border-slate-200 scroll-mt-6">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 text-sm text-slate-500 space-y-3">
          <p>
            Оператор персональных данных — АО «Интеграм», ИНН 9716002710, ОГРН 1247700757590.
            Через форму на этой странице мы собираем имя, контакт и описание задачи — только чтобы
            ответить на заявку. Данные не передаются третьим лицам и хранятся на сервере в России.
          </p>
          <p>
            Отозвать согласие и удалить данные можно письмом на{' '}
            <a href={`mailto:${CONTACT_EMAIL}`} className="text-blue-600 hover:underline">
              {CONTACT_EMAIL}
            </a>
            .
          </p>
          <p>© {new Date().getFullYear()} АО «Интеграм»</p>
        </div>
      </footer>
    </div>
  )
}
