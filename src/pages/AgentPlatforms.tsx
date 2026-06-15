import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Database,
  Users,
  ShieldCheck,
  Code2,
  Boxes,
  Repeat,
  Server,
  Layers,
  Globe,
  Settings2,
  MousePointerClick,
  Bot,
  KeyRound,
  FileCode2,
  Sparkles,
  Building2,
  Terminal,
} from 'lucide-react'

const SITE = 'https://ideav.ru'
const PATH = '/agent-platforms.html'

const PAGE_TITLE =
  'Агент создаёт приложение: Интеграм против зарубежных и российских low-code платформ'
const PAGE_DESCRIPTION =
  'Подробное сравнение Интеграма с low-code платформами и агентами-программистами по модели «ИИ-агент создаёт и администрирует сервис под ключ»: за рубежом — Retool AI, Power Platform Copilot, NocoDB, Appsmith; в России — Bpium, ELMA365, BPMSoft, AppMaster, 1С:Элемент; агенты-кодеры — Claude Code, Codex.'

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

interface CompareRow {
  criterion: string
  them: string
  us: string
}

interface Competitor {
  name: string
  icon: React.ReactNode
  what: string
  agentVerdict: string
  agentLabel: string
  limits: string[]
  rows: CompareRow[]
}

const competitors: Competitor[] = [
  {
    name: 'Retool + Retool AI',
    icon: <Boxes size={22} />,
    what: 'Самый близкий аналог по духу — low-code для внутренних инструментов.',
    agentLabel: 'Агент под ключ: частично',
    agentVerdict:
      'Retool AI по текстовому описанию генерирует приложение: создаёт таблицы в подключённой БД (Postgres, MySQL), пишет SQL-запросы и формы, собирает интерфейс из готовых компонентов.',
    limits: [
      'Агент не администрирует права доступа и пользователей — это делается в интерфейсе вручную.',
      'Работает только внутри своей песочницы: нет прямого доступа к файловой системе и системным таблицам.',
      'Высокая цена, модель только-SaaS.',
    ],
    rows: [
      { criterion: 'Доступ агента к схеме', them: 'Генерация, но без тонкого контроля', us: 'Полный контроль над таблицами, колонками и связями' },
      { criterion: 'Администрирование ролей', them: 'Нет — только интерфейс', us: 'Полное управление ролями и масками через API' },
      { criterion: 'Формат шаблонов', them: 'Компоненты Retool (JSON/YAML)', us: 'Чистый HTML / CSS / JS' },
      { criterion: 'Брендинг и кастомный CSS', them: 'Ограничен темой', us: 'Полная свобода оформления' },
    ],
  },
  {
    name: 'Microsoft Power Platform + Copilot',
    icon: <Settings2 size={22} />,
    what: 'Power Apps (Canvas / Model-driven), Power Automate, Dataverse.',
    agentLabel: 'Агент под ключ: да, с оговорками',
    agentVerdict:
      'Copilot уже умеет по тексту создавать таблицы Dataverse, связи и колонки, собирать Canvas-приложения с формами и галереями, строить потоки Power Automate для логики.',
    limits: [
      'Агент не вызывает системные API для управления ролями безопасности — это делается через сложный интерфейс Business Units.',
      'Кастомизация интерфейса слабее: Copilot собирает из готовых блоков, заменить их на чистый HTML/JS нельзя.',
      'Входной барьер: нужна лицензия Power Apps Premium (≈ $20 за пользователя в месяц).',
    ],
    rows: [
      { criterion: 'Контроль схемы', them: 'Генерация, но без API для агента', us: 'Полный API: метаданные, связи, псевдонимы' },
      { criterion: 'Ролевая модель', them: 'Сложная, без API для агента', us: 'Простая и скриптуемая' },
      { criterion: 'Программный доступ', them: 'PowerShell / CLI (неполный)', us: 'Обычный curl + токен авторизации' },
      { criterion: 'Вендор-лок', them: 'Полный (Azure AD + Dataverse)', us: 'Открытый — ideav.ru или свой сервер' },
    ],
  },
  {
    name: 'NocoDB',
    icon: <Database size={22} />,
    what: 'Open-source low-code платформа, «умная таблица» поверх SQL.',
    agentLabel: 'Агент под ключ: через REST API',
    agentVerdict:
      'Агент создаёт таблицы, колонки и связи по HTTP, управляет правами и ролями (есть API для пользователей и команд), генерирует формы и виды (Grid, Form, Gallery). Open-source — агент может читать исходный код.',
    limits: [
      'Нет песочницы поверх единой модели: изменения затрагивают реальные SQL-таблицы — рискованно для автономного агента.',
      'Агент может удалить колонку с данными при ошибке.',
      'Нет встроенного серверного рендеринга шаблонов.',
    ],
    rows: [
      { criterion: 'API для агента', them: 'Полный REST', us: 'Полный REST' },
      { criterion: 'Модель данных', them: 'Прямой SQL — риск для агента', us: 'EAV — агент не сломает структуру' },
      { criterion: 'Шаблоны и интерфейс', them: 'Готовые виды (Grid, Form)', us: 'Чистый HTML / CSS / JS' },
      { criterion: 'Российский хостинг', them: 'Зарубежный / свой VPS', us: 'ideav.ru — сервер в РФ' },
    ],
  },
  {
    name: 'Appsmith',
    icon: <Code2 size={22} />,
    what: 'Open-source low-code для внутренних инструментов, близок к Retool.',
    agentLabel: 'Агент под ключ: через Git + API',
    agentVerdict:
      'Агент редактирует JSON-представление приложения и коммитит в Git, создаёт источники данных, запросы и страницы через API. Полное GitOps-управление подходит для CI/CD-пайплайнов агента.',
    limits: [
      'Агент не управляет пользователями и ролями на уровне Интеграма — это делается через интерфейс.',
      'Нет единой модели данных: агент должен знать SQL-схему и быть осторожным.',
    ],
    rows: [
      { criterion: 'Подход агента', them: 'Git + JSON/YAML', us: 'Прямые вызовы API' },
      { criterion: 'Управление схемой', them: 'Через SQL — агент должен знать БД', us: 'EAV — всё единообразно' },
      { criterion: 'Роли и права', them: 'Только интерфейс', us: 'Полный API: роли и маски' },
      { criterion: 'Кастомизация интерфейса', them: 'Виджеты Appsmith', us: 'Чистый HTML / JS' },
    ],
  },
]

const pillars = [
  {
    icon: <Boxes size={24} />,
    title: 'Единая модель данных (EAV)',
    body: 'Все данные — в одной физической таблице. Ошибка агента создаст новый тип, а не разрушит структуру. В NocoDB или Appsmith неосторожный агент может удалить колонку с данными.',
  },
  {
    icon: <Layers size={24} />,
    title: 'Единый API для всего',
    body: 'Пользователи, роли, таблицы, колонки и связи — через одни и те же вызовы. Агенту не нужно переключаться между REST, SQL и проприетарными SDK.',
  },
  {
    icon: <KeyRound size={24} />,
    title: 'Сквозные права и маски через API',
    body: 'У конкурентов права настраиваются в интерфейсе. В Интеграме агент сам пишет правила доступа с уровнями и масками по пользователю. Ролевая модель полностью управляется скриптом.',
  },
  {
    icon: <FileCode2 size={24} />,
    title: 'Чистые HTML/JS-шаблоны',
    body: 'Агент генерирует интерфейс напрямую, без привязки к проприетарным виджетам. Это даёт абсолютную гибкость брендинга.',
  },
  {
    icon: <Repeat size={24} />,
    title: 'Идемпотентные вызовы',
    body: 'Повторный вызов не падает с ошибкой, а возвращает существующий идентификатор. Агент запускает скрипты повторно без сложной логики откатов.',
  },
]

// Российские low-code/no-code платформы — что умеет ИИ сегодня и где упирается
// сценарий «агент собирает сервис целиком». Факты по открытым источникам (2025–2026).
const ruPlatforms = [
  {
    name: 'Bpium',
    what: 'No-code конструктор: таблицы, формы, API, права до уровня поля',
    ai: 'Приложение собирает человек — ИИ-генерации нет',
    gap: 'Права настраиваются в интерфейсе',
  },
  {
    name: 'ELMA365',
    what: 'Low-code экосистема BPM / CRM / КЭДО',
    ai: 'ИИ-ассистент помогает в визуальном конструкторе',
    gap: 'Human-in-the-loop',
  },
  {
    name: 'BPMSoft',
    what: 'Low-code BPM / CRM (замена Creatio), реестр РФ, ФСТЭК',
    ai: 'LLM-агенты автоматизируют бизнес-процессы',
    gap: 'Агент — это шаги процесса, не схема и права',
  },
  {
    name: 'AppMaster',
    what: 'No-code: генерирует исходный код (бэкенд, веб, мобайл)',
    ai: 'ИИ собирает приложение и API по описанию',
    gap: 'Реальный код — риск; нет единого админ-API',
  },
  {
    name: '1С:Элемент',
    what: 'Облачная low-code среда 1С: веб-кабинеты, порталы, мобайл',
    ai: 'ИИ-сборки приложения нет — пишет разработчик',
    gap: 'Среда для разработчика, не для не-кодера',
  },
]

// Полный цикл, который агент проходит без захода в интерфейс.
const fullCycle = [
  { icon: <Database size={18} />, label: 'Структура базы' },
  { icon: <Boxes size={18} />, label: 'Наполнение данными' },
  { icon: <KeyRound size={18} />, label: 'Роли и права' },
  { icon: <Layers size={18} />, label: 'Меню и навигация' },
  { icon: <FileCode2 size={18} />, label: 'Шаблоны интерфейса' },
  { icon: <Sparkles size={18} />, label: 'Тестовые данные' },
]

export default function AgentPlatforms() {
  useEffect(() => {
    document.title = PAGE_TITLE
    const canonical = `${SITE}${PATH}`
    const ogImage = `${SITE}/og/knowledge-base.png`

    setMetaTag('meta[name="description"]', 'name', 'description', PAGE_DESCRIPTION)
    setMetaTag('meta[name="keywords"]', 'name', 'keywords',
      'ии-агент создаёт приложение,low-code,no-code,retool ai,power platform copilot,nocodb,appsmith,bpium,elma365,bpmsoft,appmaster,1с:элемент,claude code,codex,агент-программист,российские low-code платформы,интеграм,автоматизация без программиста,замена разработчика')
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

  return (
    <div className="overflow-hidden">
      {/* Hero */}
      <section className="pt-28 pb-12 lg:pt-36 lg:pb-16 border-b border-slate-200 dark:border-slate-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link
            to="/excel-to-app.html"
            className="inline-flex items-center gap-1.5 text-sm text-slate-400 dark:text-slate-500 hover:text-blue-500 transition-colors mb-6"
          >
            <ArrowLeft size={16} /> Назад к «Excel → приложение»
          </Link>

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-blue-500/30 text-blue-600 dark:text-blue-400 text-sm font-medium mb-5">
            <Bot size={14} />
            Агент как полноценный разработчик
          </div>

          <motion.h1
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight mb-5"
          >
            Сервис целиком создаёт и администрирует агент —{' '}
            <span className="text-blue-500">кто это уже умеет</span>
          </motion.h1>

          <p className="text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
            Подход «приложение полностью собирается ИИ-агентом» — горячий фронт, и сильные игроки есть
            и за рубежом, и в России. Ниже — честное сравнение Интеграма с лучшими решениями обоих
            рынков, где агент может выступать разработчиком и администратором.
          </p>
        </div>
      </section>

      {/* Illustration 1 — full cycle */}
      <section className="py-14 border-b border-slate-200 dark:border-slate-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl md:text-3xl font-bold mb-2">Полный цикл — без единого клика в интерфейсе</h2>
          <p className="text-slate-500 dark:text-slate-400 mb-8 max-w-2xl">
            В Интеграме агент проходит весь путь от пустой базы до рабочего приложения одними и теми же
            API-вызовами:
          </p>

          <div className="flex flex-wrap items-stretch gap-3">
            {fullCycle.map((step, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="flex items-center gap-2.5 px-4 py-3 rounded-2xl border border-blue-200 dark:border-blue-900/40 bg-blue-50/60 dark:bg-blue-950/30">
                  <span className="text-blue-600 dark:text-blue-400">{step.icon}</span>
                  <span className="text-sm font-semibold text-slate-800 dark:text-slate-100 whitespace-nowrap">
                    {step.label}
                  </span>
                </div>
                {i < fullCycle.length - 1 && (
                  <ArrowRight size={16} className="text-slate-300 dark:text-slate-600 shrink-0" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Illustration 2 — two approaches */}
      <section className="py-14 border-b border-slate-200 dark:border-slate-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl md:text-3xl font-bold mb-8">Два подхода к роли агента</h2>
          <div className="grid gap-6 md:grid-cols-2">
            {/* Human-in-the-loop */}
            <div className="p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
              <div className="flex items-center gap-2 mb-4">
                <MousePointerClick size={20} className="text-amber-500" />
                <h3 className="text-lg font-bold">Human-in-the-loop</h3>
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                Retool, Power Apps, Appsmith: человек кликает в интерфейсе, агент помогает.
              </p>
              <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
                <li className="flex items-start gap-2"><AlertTriangle size={16} className="text-amber-500 shrink-0 mt-0.5" /> Права и роли — вручную в интерфейсе</li>
                <li className="flex items-start gap-2"><AlertTriangle size={16} className="text-amber-500 shrink-0 mt-0.5" /> Интерфейс — из готовых виджетов</li>
                <li className="flex items-start gap-2"><AlertTriangle size={16} className="text-amber-500 shrink-0 mt-0.5" /> Часть шагов остаётся на человеке</li>
              </ul>
            </div>

            {/* Agent full cycle */}
            <div className="p-6 rounded-3xl border border-blue-300 dark:border-blue-900/50 bg-gradient-to-b from-blue-50 to-white dark:from-blue-950/40 dark:to-slate-950">
              <div className="flex items-center gap-2 mb-4">
                <Bot size={20} className="text-blue-500" />
                <h3 className="text-lg font-bold">Агент полного цикла</h3>
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                Интеграм: агент выполняет весь цикл сам, без захода в интерфейс.
              </p>
              <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
                <li className="flex items-start gap-2"><CheckCircle2 size={16} className="text-blue-500 shrink-0 mt-0.5" /> Роли и маски — скриптом через API</li>
                <li className="flex items-start gap-2"><CheckCircle2 size={16} className="text-blue-500 shrink-0 mt-0.5" /> Интерфейс — чистый HTML/JS</li>
                <li className="flex items-start gap-2"><CheckCircle2 size={16} className="text-blue-500 shrink-0 mt-0.5" /> Структура → данные → права → шаблоны</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Competitors */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl md:text-3xl font-bold mb-2">Главные зарубежные конкуренты</h2>
          <p className="text-slate-500 dark:text-slate-400 mb-10 max-w-2xl">
            По модели «агент создаёт приложение» — что они умеют, где упираются и чем отличается Интеграм.
          </p>

          <div className="space-y-12">
            {competitors.map((c, idx) => (
              <article key={idx} className="scroll-mt-24">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-11 h-11 rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                    {c.icon}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold leading-tight">{c.name}</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{c.what}</p>
                  </div>
                </div>

                <div className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 px-2.5 py-1 rounded-lg mb-3">
                  <CheckCircle2 size={14} />
                  {c.agentLabel}
                </div>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed mb-4">{c.agentVerdict}</p>

                <div className="mb-5">
                  <div className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">
                    Ограничения
                  </div>
                  <ul className="space-y-1.5">
                    {c.limits.map((l, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-300">
                        <AlertTriangle size={15} className="text-amber-500 shrink-0 mt-0.5" />
                        {l}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Comparison table vs Integram */}
                <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
                  <table className="w-full border-collapse text-sm">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-900/50">
                        <th className="text-left py-3 px-4 font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest text-xs">Критерий</th>
                        <th className="text-left py-3 px-4 font-bold text-slate-500 dark:text-slate-400">{c.name.split(' ')[0]}</th>
                        <th className="text-left py-3 px-4 font-bold text-blue-600 dark:text-blue-400">Интеграм</th>
                      </tr>
                    </thead>
                    <tbody>
                      {c.rows.map((r, i) => (
                        <tr key={i} className="border-t border-slate-100 dark:border-slate-800/60">
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
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Russian analogs */}
      <section className="py-16 border-t border-slate-200 dark:border-slate-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 mb-2">
            <Building2 size={22} className="text-blue-600 dark:text-blue-400" />
            <h2 className="text-2xl md:text-3xl font-bold">Российские аналоги</h2>
          </div>
          <p className="text-slate-500 dark:text-slate-400 mb-8 max-w-2xl">
            В России low-code-рынок тоже идёт в ИИ — но по той же модели: ассистент помогает человеку
            в конструкторе либо агент автоматизирует бизнес-процессы. Полную сборку сервиса агентом не
            закрывает никто.
          </p>

          <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900/50">
                  <th className="text-left py-3 px-4 font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest text-xs">Платформа</th>
                  <th className="text-left py-3 px-4 font-bold text-slate-500 dark:text-slate-400">Роль ИИ сегодня</th>
                  <th className="text-left py-3 px-4 font-bold text-amber-600 dark:text-amber-400">Чего нет для «агент делает всё»</th>
                </tr>
              </thead>
              <tbody>
                {ruPlatforms.map((p, i) => (
                  <tr key={i} className="border-t border-slate-100 dark:border-slate-800/60 align-top">
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900 dark:text-white">{p.name}</div>
                      <div className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{p.what}</div>
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-300">{p.ai}</td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-start gap-1.5 text-slate-500 dark:text-slate-400">
                        <AlertTriangle size={14} className="text-amber-500 shrink-0 mt-0.5" />
                        {p.gap}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="text-xs text-slate-400 dark:text-slate-500 mt-3">
            Visary, SimpleOne, Triafly и другие российские low-code-платформы тоже добавляют ИИ — как
            ассистентов, а не как самостоятельных сборщиков сервиса.
          </p>

          <p className="text-slate-600 dark:text-slate-300 leading-relaxed mt-6 max-w-2xl">
            Полный цикл «структура базы → данные → роли и права → меню → шаблоны» одним идемпотентным
            API на безопасной EAV-модели — отличие <span className="font-semibold text-blue-600 dark:text-blue-400">Интеграма</span>,
            к тому же с хостингом в России.
          </p>
        </div>
      </section>

      {/* AI coding agents */}
      <section className="py-16 border-t border-slate-200 dark:border-slate-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 mb-2">
            <Terminal size={22} className="text-blue-600 dark:text-blue-400" />
            <h2 className="text-2xl md:text-3xl font-bold">А ИИ-агенты-программисты?</h2>
          </div>
          <p className="text-slate-500 dark:text-slate-400 mb-8 max-w-2xl">
            Claude Code (Anthropic) и Codex (OpenAI) — автономные агенты, которые сами пишут реальный
            код: читают репозиторий, правят файлы, гоняют тесты, делают коммиты и PR. Мощно и гибко —
            но это другой класс инструмента.
          </p>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Coding agents */}
            <div className="p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
              <div className="flex items-center gap-2 mb-4">
                <Code2 size={20} className="text-amber-500" />
                <h3 className="text-lg font-bold">Агент-программист — Claude Code, Codex</h3>
              </div>
              <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
                <li className="flex items-start gap-2"><CheckCircle2 size={16} className="text-slate-400 shrink-0 mt-0.5" /> Пишет настоящий код в настоящем репозитории</li>
                <li className="flex items-start gap-2"><AlertTriangle size={16} className="text-amber-500 shrink-0 mt-0.5" /> БД, миграции, права, деплой, хостинг и безопасность — на вас</li>
                <li className="flex items-start gap-2"><AlertTriangle size={16} className="text-amber-500 shrink-0 mt-0.5" /> Нет встроенной безопасной модели данных и единого админ-API</li>
                <li className="flex items-start gap-2"><AlertTriangle size={16} className="text-amber-500 shrink-0 mt-0.5" /> Не-разработчик получает код, а не готовый сервис</li>
              </ul>
            </div>

            {/* Integram */}
            <div className="p-6 rounded-3xl border border-blue-300 dark:border-blue-900/50 bg-gradient-to-b from-blue-50 to-white dark:from-blue-950/40 dark:to-slate-950">
              <div className="flex items-center gap-2 mb-4">
                <Bot size={20} className="text-blue-500" />
                <h3 className="text-lg font-bold">Интеграм</h3>
              </div>
              <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
                <li className="flex items-start gap-2"><CheckCircle2 size={16} className="text-blue-500 shrink-0 mt-0.5" /> Агент собирает на управляемой платформе, а не в сыром коде</li>
                <li className="flex items-start gap-2"><CheckCircle2 size={16} className="text-blue-500 shrink-0 mt-0.5" /> Единый безопасный API: схема, данные, роли, шаблоны</li>
                <li className="flex items-start gap-2"><CheckCircle2 size={16} className="text-blue-500 shrink-0 mt-0.5" /> Роли, права и хостинг в РФ — из коробки</li>
                <li className="flex items-start gap-2"><CheckCircle2 size={16} className="text-blue-500 shrink-0 mt-0.5" /> Не-разработчик получает работающий сервис, который агент админит</li>
              </ul>
            </div>
          </div>

          <p className="text-xs text-slate-400 dark:text-slate-500 mt-3">
            То же касается Cursor, GitHub Copilot и других агентов-кодеров: это инструменты разработчика,
            а не платформа, отдающая бизнесу готовый самоадминистрируемый сервис.
          </p>
        </div>
      </section>

      {/* Three pillars */}
      <section className="py-16 border-t border-slate-200 dark:border-slate-900 bg-slate-50/60 dark:bg-slate-900/30">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold mb-3">Чем Интеграм уникален для полной автоматизации</h2>
            <p className="text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
              Пять опор, которые позволяют агенту собрать сервис целиком — без участия человека в интерфейсе.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
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

      {/* Conclusion + CTA */}
      <section className="py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">Вывод</h2>
          <p className="text-lg text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
            Ни за рубежом, ни в России нет точного аналога Интеграма по уровню контроля агента над
            платформой. Зарубежные (Retool, Power Platform, NocoDB, Appsmith) и российские (Bpium,
            ELMA365, BPMSoft, AppMaster, 1С:Элемент) решения заточены на human-in-the-loop: человек
            кликает в интерфейсе, агент помогает.
          </p>
          <p className="text-lg text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
            Универсальные агенты-программисты (Claude Code, Codex) умеют больше — но отдают исходный
            код, который вам нужно хостить, администрировать и защищать; готового самоадминистрируемого
            сервиса не-разработчик не получает.
          </p>
          <p className="text-lg text-slate-600 dark:text-slate-300 leading-relaxed mb-10">
            Интеграм — платформа, где агент проходит полный цикл: структура базы → наполнение → роли и
            права → меню → шаблоны → тестовые данные, и всё это единообразными API-вызовами без захода
            в интерфейс.
          </p>

          <div className="rounded-3xl border border-blue-500/30 bg-gradient-to-b from-blue-50 to-white dark:from-blue-950/40 dark:to-slate-950 p-8 text-center">
            <div className="flex justify-center mb-4">
              <div className="w-14 h-14 rounded-2xl bg-blue-600 text-white flex items-center justify-center">
                <Sparkles size={26} />
              </div>
            </div>
            <h3 className="text-xl md:text-2xl font-bold mb-3">Проверьте на своих данных</h3>
            <p className="text-slate-600 dark:text-slate-300 mb-6 max-w-xl mx-auto">
              Загрузите свои Excel-таблицы — агент соберёт работающее приложение примерно за 45 минут.
            </p>
            <Link
              to="/excel-to-app.html#excel-form"
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-lg shadow-blue-600/20 transition-colors"
            >
              Загрузить Excel и получить приложение
              <ArrowRight size={18} />
            </Link>
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-slate-400 dark:text-slate-500">
            <span className="inline-flex items-center gap-1.5"><Server size={14} /> Сервер в РФ — ideav.ru</span>
            <span className="inline-flex items-center gap-1.5"><ShieldCheck size={14} /> Ваши данные принадлежат вам</span>
            <span className="inline-flex items-center gap-1.5"><Users size={14} /> Роли и права из коробки</span>
            <span className="inline-flex items-center gap-1.5"><Globe size={14} /> Без вендор-лока</span>
          </div>

          <p className="mt-10 text-center text-sm">
            <Link to="/knowledge-base.html" className="text-slate-400 dark:text-slate-500 hover:text-blue-500 transition-colors">
              Ещё сравнения — в базе знаний →
            </Link>
          </p>
        </div>
      </section>
    </div>
  )
}
