import {
  ArrowRight,
  CheckCircle2,
  Cloud,
  Code2,
  FileSearch,
  Package,
  Rocket,
  Server,
  Settings,
  Star,
  type LucideIcon,
} from 'lucide-react'

// Цены — по макету владельца в issue #613 (комментарий 5890676651).
// На ideav.ru те же услуги лежат в src/data/services.mjs и на /excel-to-app.html —
// при смене цены сверять оба сайта.

/** Тарифы облака Интеграма живут на основном сайте, выбор тарифа — там. */
export const TARIFFS_URL = 'https://ideav.ru/start.html#tarif'

type Plan = {
  icon: LucideIcon
  title: string
  sub: string
  price: string
  unit?: string
  items: string[]
  cta: string
  /** Внешняя ссылка; без неё кнопка открывает форму заявки на этой странице. */
  href?: string
  accent?: boolean
  badge?: string
}

type Group = {
  icon: LucideIcon
  tag: string
  title: string
  lead: string
  body: string
  plans: Plan[]
}

const GROUPS: Group[] = [
  {
    icon: Package,
    tag: 'Фиксированная стоимость',
    title: 'С чего начать',
    lead: 'Быстрый вход с понятным результатом',
    body: 'Оптимальный способ познакомиться с возможностями платформы и получить первые результаты в короткие сроки.',
    plans: [
      {
        icon: FileSearch,
        title: 'Разбор процесса по приложению, созданному ИИ',
        sub: 'Глубокий анализ вашего Excel-файла и бизнес-задачи. Результат — техническое задание и план внедрения.',
        price: '20 000',
        items: ['Диагностика процесса и задач', 'Модель данных, ролей и прав', 'Критерии приёмки', 'Дорожная карта внедрения'],
        cta: 'Обсудить разбор',
      },
      {
        icon: Rocket,
        title: 'Пилотный проект',
        sub: 'Проверим решение на вашей реальной задаче. Полный цикл разработки и запуск в облаке за 2 недели.',
        price: 'от 93 750',
        items: ['Выбор задачи из очереди', 'Полный цикл разработки', 'Развёртывание в облаке', 'Инструкции и документация'],
        cta: 'Заказать пилот',
        accent: true,
        badge: 'Рекомендуем',
      },
    ],
  },
  {
    icon: Cloud,
    tag: 'Подписка / внедрение',
    title: 'Готовое внедрение',
    lead: 'Выберите формат эксплуатации',
    body: 'Запустите решение в подходящем формате: на вашем сервере или в облаке. Гибкие условия и масштабирование под ваши задачи.',
    plans: [
      {
        icon: Server,
        title: 'Локальная лицензия (on-premise)',
        sub: 'Полный контроль над данными. Установка на вашем сервере.',
        price: '590 000',
        unit: '/ год',
        items: ['Неограниченное количество записей', 'Полный функционал интеграции', 'Приоритетная поддержка', 'Любые коннекторы'],
        cta: 'Запросить счёт',
      },
      {
        icon: Cloud,
        title: 'Облачный хостинг Интеграм',
        sub: 'Ваши приложения в облаке. Быстрый старт, гибкие тарифы, никаких серверов и администрирования.',
        price: 'от 1 950',
        unit: '/ мес',
        items: [
          'Тариф «Знакомство» — 0 ₽ / мес',
          'Тариф «Старт» — 1 950 ₽ / мес',
          'Тариф «Масштабируемый» — от 4 900 ₽ / мес',
          'Оплата за реальные действия',
        ],
        cta: 'Выбрать тариф',
        href: TARIFFS_URL,
        accent: true,
      },
    ],
  },
  {
    icon: Code2,
    tag: 'Почасовая разработка',
    title: 'Индивидуальная разработка',
    lead: 'Когда нужно решение под ваши процессы',
    body: 'Аналитика, проектирование и разработка сложных решений с учётом ваших требований. Оплата по фактически затраченным часам.',
    plans: [
      {
        icon: Settings,
        title: 'Аналитика и разработка',
        sub: 'Команда экспертов поможет спроектировать систему, настроить интеграции и интерфейсы, обучить сотрудников.',
        price: '3 750',
        unit: '/ час',
        items: ['Проектирование системы', 'Настройка сложных интеграций', 'Настройка интерфейсов', 'Обучение сотрудников'],
        cta: 'Заказать разработку',
      },
    ],
  },
]

function PlanCard({ plan, onOrder }: { plan: Plan; onOrder: (plan: string) => void }) {
  const { icon: Icon } = plan
  const button = `mt-6 w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-semibold transition-colors ${
    plan.accent ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-blue-50 hover:bg-blue-100 text-blue-700'
  }`
  return (
    <div
      className={`relative flex flex-col rounded-2xl bg-white p-6 ${
        plan.accent && plan.badge ? 'border-2 border-blue-600 shadow-lg shadow-blue-600/10' : 'border border-slate-200 shadow-sm'
      }`}
    >
      {plan.badge && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 inline-flex items-center gap-1 px-3 py-1 rounded-full bg-blue-600 text-white text-xs font-bold uppercase tracking-wide">
          <Star size={12} fill="currentColor" /> {plan.badge}
        </span>
      )}
      <div className="flex gap-4">
        <span className="shrink-0 w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
          <Icon size={22} />
        </span>
        <div>
          <h4 className="font-bold leading-snug">{plan.title}</h4>
          <p className="mt-1 text-sm text-slate-500 leading-relaxed">{plan.sub}</p>
        </div>
      </div>
      <p className="mt-5 text-3xl font-bold tracking-tight">
        {plan.price} <span className="text-lg font-semibold text-slate-400">₽ {plan.unit ?? ''}</span>
      </p>
      <ul className="mt-4 space-y-2 flex-1">
        {plan.items.map(item => (
          <li key={item} className="flex items-start gap-2 text-sm text-slate-700">
            <CheckCircle2 size={18} className="text-blue-500 shrink-0 mt-px" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
      {plan.href ? (
        <a href={plan.href} target="_blank" rel="noopener noreferrer" className={button}>
          {plan.cta} <ArrowRight size={18} />
        </a>
      ) : (
        <button type="button" onClick={() => onOrder(plan.title)} className={button}>
          {plan.cta} <ArrowRight size={18} />
        </button>
      )}
    </div>
  )
}

/**
 * Цены на виду, без клика (критика в issue #613: «клиент не понимает, сколько
 * это стоит»). Кнопки карточек открывают модальную заявку на экспресс-разработку
 * с названием выбранной карточки (issue #619). Сама кнопка целей не шлёт: цель
 * `express_lead` уходит только после принятой заявки, см. conversion.ts.
 */
export function Pricing({ onOrder }: { onOrder: (plan: string) => void }) {
  return (
    <section id="ceny" className="scroll-mt-16 max-w-6xl mx-auto px-4 sm:px-6 py-12 space-y-6">
      <h2 className="text-2xl sm:text-3xl font-bold">Сколько стоит</h2>
      <p className="text-slate-600 max-w-2xl">
        Демонстрация на ваших файлах — бесплатно. Дальше — по шагам: каждый заканчивается
        результатом, который остаётся у вас.
      </p>
      {GROUPS.map(({ icon: Icon, tag, title, lead, body, plans }) => (
        <div
          key={title}
          className="rounded-3xl border border-slate-200 bg-slate-50/70 p-5 sm:p-8 grid gap-6 lg:grid-cols-[1fr_2fr] lg:items-start"
        >
          <div>
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100/70 text-blue-700 text-xs font-bold uppercase tracking-wider">
              <Icon size={14} /> {tag}
            </span>
            <h3 className="mt-4 text-2xl sm:text-3xl font-bold">{title}</h3>
            <p className="mt-2 text-lg text-slate-600">{lead}</p>
            <p className="mt-3 text-sm text-slate-500 leading-relaxed">{body}</p>
          </div>
          <div className={`grid gap-6 ${plans.length > 1 ? 'sm:grid-cols-2' : ''}`}>
            {plans.map(plan => (
              <PlanCard key={plan.title} plan={plan} onOrder={onOrder} />
            ))}
          </div>
        </div>
      ))}
    </section>
  )
}
