import { useRef, useState, type KeyboardEvent, type PointerEvent } from 'react'
import { ArrowRight, ChevronLeft, ChevronRight, FileSpreadsheet, LayoutDashboard } from 'lucide-react'

// Кейсы — настоящие приложения клиентов Интеграма, собранные в ideav/crm
// (templates/atex, db13417569248up, xcom, sportzania). Каждый факт на слайде
// взят из ТЗ, issue или документации того репозитория; цифр эффекта («сэкономили
// N часов») там нет — и здесь их нет. Скриншотов тоже нет: на снимках рабочих
// баз бывают живые данные клиентов (issue #613).

type Case = {
  client: string
  industry: string
  before: string[]
  after: string[]
  facts: string[]
}

const CASES: Case[] = [
  {
    client: 'Атекс',
    industry: 'Производство термопринтерных рулонов из джамбо-роллов',
    before: [
      'Пять Excel-файлов: план производства, расчёт резки для менеджеров, остатки сырья, задания на производство',
      'Перестановки ножей планировали по привычке — к вечеру люди устают и ошибаются',
      'Оператор получал таблицу цифр вместо понятной схемы резки',
    ],
    after: [
      '12 рабочих мест для 6 ролей — от менеджера и диспетчера до оператора и клиента',
      'Планировщик резок, карта резки и диаграмма Ганта по станкам',
      'Пульты операторов на планшетах, учёт сырья по партиям (FIFO), портал клиента',
    ],
    facts: ['41 таблица', '15 экранов', '490 типов резки из 681 строки Excel'],
  },
  {
    client: 'ПЕТФУД',
    industry: 'Производство кормов для животных',
    before: [
      'Бумажный чек-лист фасовки и Excel «Технология производства» — 13 партий на лист, дальше второй лист',
      'Время ставили по памяти в конце смены, отклонения всплывали поздно',
      'Сводок по партиям, простоям и выпуску не было — листы перебирали руками',
    ],
    after: [
      'План смены с итогами, чек-листы и задачи для мастера и оператора',
      'Время ввода ставится само, скорость помечается «низкая / норма / высокая»',
      'Отклонение план/факт в процентах и дашборд производства для руководителя',
    ],
    facts: ['~15 таблиц', '4 роли', 'в работе с сентября 2026'],
  },
  {
    client: 'XCOM',
    industry: 'Сопоставление заявок покупателей со своим каталогом',
    before: [
      'Два Excel-файла: заявка покупателя и собственный каталог',
      'ВПР ищет точное совпадение, а в заявках один и тот же товар записан по-разному',
    ],
    after: [
      'Мастер первого запуска: загрузить два Excel — и сразу сопоставлять',
      'Массовый прогон пачками по 50–100 позиций, решения по парам запоминаются',
      'Результат выгружается обратно в Excel',
    ],
    facts: ['7 таблиц', '6 отчётов', 'стал партнёрским шаблоном'],
  },
  {
    client: 'Спортзания',
    industry: 'Управление компанией: продажи, персонал, бюджет',
    before: [
      'Бюджеты и справочники — в Google-таблицах, лиды и сделки — в Битрикс24',
    ],
    after: [
      'Оргструктура, мониторинг задач, рейтинг отделов и вакансии в одной базе',
      'Дашборд из 13 листов по ролям: инвестор, коммерция, HR, качество',
      'Лиды и сделки подтягиваются из Битрикс24, Google-таблицы синхронизируются',
    ],
    facts: ['13 листов дашборда', 'интеграция с Битрикс24'],
  },
]

const SWIPE_PX = 50

function Column({ tone, title, items }: { tone: 'before' | 'after'; title: string; items: string[] }) {
  const before = tone === 'before'
  const Icon = before ? FileSpreadsheet : LayoutDashboard
  return (
    <div className={`rounded-2xl p-5 sm:p-6 ${before ? 'bg-slate-100' : 'bg-blue-50 border border-blue-500/20'}`}>
      <h4
        className={`flex items-center gap-2 text-sm font-bold uppercase tracking-wide ${
          before ? 'text-slate-500' : 'text-blue-700'
        }`}
      >
        <Icon size={18} /> {title}
      </h4>
      <ul className="mt-4 space-y-3">
        {items.map(item => (
          <li key={item} className={`text-sm leading-relaxed ${before ? 'text-slate-600' : 'text-slate-800'}`}>
            {item}
          </li>
        ))}
      </ul>
    </div>
  )
}

/** Слайдер «было → стало»: стрелки, точки, свайп и клавиши ←/→. */
export function Cases() {
  const [index, setIndex] = useState(0)
  const startX = useRef<number | null>(null)
  const current = CASES[index]
  const go = (next: number) => setIndex((next + CASES.length) % CASES.length)

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>): void {
    if (event.key === 'ArrowLeft') go(index - 1)
    if (event.key === 'ArrowRight') go(index + 1)
  }

  function onPointerUp(event: PointerEvent<HTMLDivElement>): void {
    if (startX.current === null) return
    const dx = event.clientX - startX.current
    startX.current = null
    if (Math.abs(dx) >= SWIPE_PX) go(dx < 0 ? index + 1 : index - 1)
  }

  const arrow =
    'p-2 rounded-full border border-slate-300 bg-white text-slate-600 hover:border-blue-500 hover:text-blue-600 transition-colors'

  return (
    <section className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold">Было в Excel → стало приложением</h2>
          <p className="mt-3 text-slate-600 max-w-2xl">
            Реальные внедрения на Интеграме. Все начинались с таблиц.
          </p>
        </div>
        <div className="hidden sm:flex gap-2 shrink-0">
          <button type="button" aria-label="Предыдущий кейс" onClick={() => go(index - 1)} className={arrow}>
            <ChevronLeft size={20} />
          </button>
          <button type="button" aria-label="Следующий кейс" onClick={() => go(index + 1)} className={arrow}>
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      <div
        role="group"
        aria-roledescription="слайдер"
        aria-label={`Кейс ${index + 1} из ${CASES.length}: ${current.client}`}
        tabIndex={0}
        onKeyDown={onKeyDown}
        onPointerDown={event => {
          startX.current = event.clientX
        }}
        onPointerUp={onPointerUp}
        onPointerCancel={() => {
          startX.current = null
        }}
        className="mt-8 rounded-3xl border border-slate-200 bg-white p-5 sm:p-8 shadow-sm select-none touch-pan-y focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
      >
        <p className="text-sm font-semibold text-blue-600">{current.client}</p>
        <h3 className="mt-1 text-xl sm:text-2xl font-bold">{current.industry}</h3>

        <div className="mt-6 grid gap-4 md:grid-cols-[1fr_auto_1fr] md:items-stretch">
          <Column tone="before" title="Было" items={current.before} />
          <div className="flex items-center justify-center text-blue-600">
            <ArrowRight size={28} className="rotate-90 md:rotate-0" />
          </div>
          <Column tone="after" title="Стало" items={current.after} />
        </div>

        <ul className="mt-6 flex flex-wrap gap-2">
          {current.facts.map(fact => (
            <li key={fact} className="px-3 py-1 rounded-full bg-slate-100 text-xs font-medium text-slate-600">
              {fact}
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-5 flex items-center justify-center gap-3">
        <button type="button" aria-label="Предыдущий кейс" onClick={() => go(index - 1)} className={`sm:hidden ${arrow}`}>
          <ChevronLeft size={18} />
        </button>
        {CASES.map((c, i) => (
          <button
            key={c.client}
            type="button"
            aria-label={`Кейс: ${c.client}`}
            aria-current={i === index}
            onClick={() => setIndex(i)}
            className={`h-2.5 rounded-full transition-all ${i === index ? 'w-8 bg-blue-600' : 'w-2.5 bg-slate-300 hover:bg-slate-400'}`}
          />
        ))}
        <button type="button" aria-label="Следующий кейс" onClick={() => go(index + 1)} className={`sm:hidden ${arrow}`}>
          <ChevronRight size={18} />
        </button>
      </div>
    </section>
  )
}
