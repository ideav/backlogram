import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Database,
  Users,
  ShieldCheck,
  Server,
  Layers,
  Globe,
  Settings2,
  Cpu,
  FileText,
  Scale,
  Boxes,
  Network,
  Bot,
  Sparkles,
  BookOpen,
  Building2,
  Workflow,
  KeyRound,
  FileCode2,
} from 'lucide-react'
import Breadcrumbs from '../components/Breadcrumbs'

const SITE = 'https://ideav.ru'
const PATH = '/informatsionnaya-sistema.html'

const PAGE_TITLE =
  'Что такое информационная система (ИС): виды, классификация, свойства'
const PAGE_DESCRIPTION =
  'Информационная система (ИС) — это совокупность информации в базах данных и технологий её обработки. Определение по 149-ФЗ и ГОСТ, состав, классификация, виды (ERP, CRM, СЭД, АСУ ТП, ГИС) и свойства информационных систем — и как собрать ИС на low-code платформе с ИИ без программистов.'
const PAGE_KEYWORDS =
  'информационная система,что такое информационная система,ис это,информационная система это,классификация информационных систем,виды информационных систем,свойства информационных систем,состав информационной системы,структура информационной системы,виды ис,примеры информационных систем,создание информационной системы,конструктор информационных систем,информационная система определение'

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

// ── Состав ИС: виды обеспечения (ГОСТ 34.003-90 / ГОСТ Р 59853-2021) ─────────
const provisions = [
  {
    icon: <Cpu size={22} />,
    title: 'Техническое',
    body: 'Серверы, рабочие станции, сеть, устройства ввода-вывода — вся техника, на которой работает система.',
  },
  {
    icon: <FileCode2 size={22} />,
    title: 'Программное',
    body: 'Операционные системы, СУБД, прикладные программы и весь код, реализующий функции ИС.',
  },
  {
    icon: <Database size={22} />,
    title: 'Информационное',
    body: 'Классификаторы, справочники, форматы документов и сама структура хранимых данных.',
  },
  {
    icon: <Users size={22} />,
    title: 'Организационное',
    body: 'Регламенты, роли, права и обязанности пользователей и обслуживающего персонала.',
  },
  {
    icon: <Scale size={22} />,
    title: 'Правовое',
    body: 'Нормы, регламентирующие создание и эксплуатацию системы, работу с персональными данными.',
  },
  {
    icon: <Workflow size={22} />,
    title: 'Математическое',
    body: 'Методы, модели и алгоритмы, по которым система обрабатывает данные и принимает решения.',
  },
]

// ── Классификация ИС ─────────────────────────────────────────────────────────
interface ClassRow {
  basis: string
  values: string
}
const classification: ClassRow[] = [
  {
    basis: 'По масштабу',
    values: 'Одиночные (персональные) → групповые (офисные) → корпоративные (КИС).',
  },
  {
    basis: 'По сфере применения',
    values: 'ИС организационного управления, АСУ ТП, САПР, интегрированные (корпоративные) ИС.',
  },
  {
    basis: 'По уровню управления',
    values: 'Оперативные (TPS), тактические (MIS), стратегические — поддержки решений (DSS) и руководителя (EIS).',
  },
  {
    basis: 'По степени автоматизации',
    values: 'Ручные → автоматизированные (человек + машина) → автоматические (без участия человека).',
  },
  {
    basis: 'По характеру использования',
    values: 'Информационно-поисковые (ИПС) и информационно-решающие (управляющие, советующие).',
  },
  {
    basis: 'По архитектуре',
    values: 'Файл-серверные → клиент-серверные → многоуровневые (распределённые).',
  },
]

// ── Виды ИС по назначению ────────────────────────────────────────────────────
const systemTypes = [
  {
    abbr: 'ERP',
    full: 'Enterprise Resource Planning',
    ru: 'Планирование ресурсов предприятия',
    desc: 'Единый учёт финансов, закупок, производства и персонала в одной базе.',
  },
  {
    abbr: 'CRM',
    full: 'Customer Relationship Management',
    ru: 'Управление отношениями с клиентами',
    desc: 'Сделки, история контактов, воронка продаж, задачи по клиентам.',
  },
  {
    abbr: 'СЭД / ECM',
    full: 'Enterprise Content Management',
    ru: 'Электронный документооборот',
    desc: 'Согласование, хранение и маршрутизация документов внутри компании.',
  },
  {
    abbr: 'MES',
    full: 'Manufacturing Execution System',
    ru: 'Управление производством',
    desc: 'Оперативное управление цехом: задания, партии, контроль выполнения.',
  },
  {
    abbr: 'СППР / DSS',
    full: 'Decision Support System',
    ru: 'Поддержка принятия решений',
    desc: 'Аналитика и сценарии, помогающие руководителю выбрать решение.',
  },
  {
    abbr: 'АСУ ТП / SCADA',
    full: 'Supervisory Control And Data Acquisition',
    ru: 'Управление техпроцессом',
    desc: 'Диспетчерское управление оборудованием и сбор данных с датчиков.',
  },
  {
    abbr: 'ГИС / GIS',
    full: 'Geographic Information System',
    ru: 'Геоинформационная система',
    desc: 'Данные, привязанные к карте: объекты, участки, маршруты.',
  },
  {
    abbr: 'СУБД / DBMS',
    full: 'Database Management System',
    ru: 'Система управления базами данных',
    desc: 'Основа большинства учётных ИС — хранение и выборка структурированных данных.',
  },
]

// ── Свойства ИС (ГОСТ Р ИСО/МЭК 25010) ───────────────────────────────────────
const properties = [
  { title: 'Функциональная пригодность', body: 'Система решает те задачи, ради которых создана, полно и корректно.' },
  { title: 'Надёжность', body: 'Работает без сбоев, восстанавливается после отказов, доступна когда нужна.' },
  { title: 'Производительность', body: 'Отвечает быстро и выдерживает нужный объём данных и пользователей.' },
  { title: 'Защищённость', body: 'Разграничение доступа, целостность и конфиденциальность данных.' },
  { title: 'Удобство использования', body: 'Понятный интерфейс, в котором сотрудник разбирается без долгого обучения.' },
  { title: 'Сопровождаемость', body: 'Систему можно менять и развивать без переписывания с нуля.' },
]

// ── Жизненный цикл ИС (стадии по ГОСТ 34.601-90 / ГОСТ Р 59793-2021) ─────────
const lifecycle = [
  'Формирование требований',
  'Разработка концепции',
  'Техническое задание',
  'Эскизный проект',
  'Технический проект',
  'Рабочая документация',
  'Ввод в действие',
  'Сопровождение',
]

// ── Как создать ИС: три подхода ───────────────────────────────────────────────
const approaches = [
  {
    icon: <Settings2 size={20} />,
    tone: 'amber' as const,
    title: 'Заказная разработка',
    body: 'Максимально гибко, но дорого и долго: месяцы работы, зависимость от подрядчика, релиз на каждое изменение.',
  },
  {
    icon: <Boxes size={20} />,
    tone: 'amber' as const,
    title: 'Коробочные продукты',
    body: 'Быстрый старт, но приходится подстраивать процессы под систему; доработки снова упираются в подрядчика и лицензии.',
  },
  {
    icon: <Sparkles size={20} />,
    tone: 'blue' as const,
    title: 'Low-code платформа с ИИ',
    body: 'Структуру базы, роли и интерфейсы собирает конструктор — а с ИИ-агентом описание на русском превращается в готовую ИС за часы.',
  },
]

// ── Опоры Интеграма как конструктора ИС ──────────────────────────────────────
const integramPillars = [
  {
    icon: <Database size={24} />,
    title: 'База данных со связями',
    body: 'Реляционная модель, справочники и связи между сущностями — ядро любой учётной ИС, без формул ВПР и хрупких таблиц.',
  },
  {
    icon: <KeyRound size={24} />,
    title: 'Роли и права из коробки',
    body: 'Разграничение доступа на уровне строк и полей — организационное обеспечение ИС настраивается, а не программируется.',
  },
  {
    icon: <FileCode2 size={24} />,
    title: 'Интерфейсы и отчёты',
    body: 'Формы, отчёты и дашборды на чистом HTML — рабочие места сотрудников без отдельной команды фронтенда.',
  },
  {
    icon: <Bot size={24} />,
    title: 'ИИ собирает систему',
    body: 'Опишите задачу словами или загрузите Excel — ИИ-агент создаёт таблицы, права, меню и шаблоны единым API.',
  },
  {
    icon: <Server size={24} />,
    title: 'Свой контур, сервер в РФ',
    body: 'Данные остаются внутри компании: self-hosted или хостинг в России, без SaaS-зависимости и вендор-лока.',
  },
  {
    icon: <Network size={24} />,
    title: 'Интеграции через API',
    body: 'Обмен данными с другими системами по API/JSON вместо ручных выгрузок и копипаста между программами.',
  },
]

// ── FAQ ───────────────────────────────────────────────────────────────────────
const faq = [
  {
    q: 'Что такое информационная система простыми словами?',
    a: 'Это связка «данные + программы + техника + люди и правила», которая помогает собирать, хранить и обрабатывать информацию для конкретных задач: учёта, управления, документооборота. По 149-ФЗ — совокупность информации в базах данных и обеспечивающих её обработку технологий и технических средств.',
  },
  {
    q: 'Чем информационная система отличается от базы данных?',
    a: 'База данных — только хранилище структурированных данных. Информационная система — это база данных плюс программы обработки, интерфейсы для пользователей, роли и права, регламенты работы. База данных является частью ИС, но не равна ей.',
  },
  {
    q: 'Какие бывают виды информационных систем?',
    a: 'По назначению: ERP, CRM, СЭД (электронный документооборот), MES, СППР, АСУ ТП, ГИС. По масштабу — персональные, групповые и корпоративные. По степени автоматизации — ручные, автоматизированные и автоматические.',
  },
  {
    q: 'Можно ли создать информационную систему без программистов?',
    a: 'Да. На low-code платформе структура базы, роли, формы и отчёты настраиваются в конструкторе, а ИИ-агент собирает рабочую систему по описанию на естественном языке или по загруженным Excel-таблицам — без написания кода.',
  },
  {
    q: 'Сколько стоит создать информационную систему на Интеграме?',
    a: 'Тариф считается по токенам — объёму работы платформы, а не «за пользователя», поэтому расширение команды не увеличивает счёт кратно. Прототип рабочей ИС собирается за часы, а не за месяцы заказной разработки.',
  },
]

export default function InformationSystem() {
  useEffect(() => {
    document.title = PAGE_TITLE
    const canonical = `${SITE}${PATH}`
    const ogImage = `${SITE}/og/knowledge-base.png`

    setMetaTag('meta[name="description"]', 'name', 'description', PAGE_DESCRIPTION)
    setMetaTag('meta[name="keywords"]', 'name', 'keywords', PAGE_KEYWORDS)
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
          <Breadcrumbs
            items={[
              { name: 'Интеграм', to: '/' },
              { name: 'Информационная система', to: '/informatsionnaya-sistema.html' },
            ]}
          />

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-blue-500/30 text-blue-600 dark:text-blue-400 text-sm font-medium mb-5">
            <BookOpen size={14} />
            Основы: информационные системы
          </div>

          <motion.h1
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight mb-5"
          >
            Информационная система (ИС): <span className="text-blue-500">что это простыми словами</span>
          </motion.h1>

          <p className="text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
            Разбираем, что такое информационная система, из чего она состоит, какими бывают виды и
            свойства ИС — и как собрать работающую информационную систему на low-code платформе с ИИ,
            без месяцев заказной разработки.
          </p>
        </div>
      </section>

      {/* 1. Определение */}
      <section className="py-14 border-b border-slate-200 dark:border-slate-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">Что такое информационная система</h2>
          <p className="text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
            Информационная система (ИС) — это совокупность данных, программ, технических средств и людей,
            которая помогает собирать, хранить, обрабатывать и выдавать информацию для решения конкретных
            задач: учёта, управления, документооборота, анализа.
          </p>

          <blockquote className="border-l-4 border-blue-500 pl-4 py-1 my-6 text-slate-700 dark:text-slate-200 italic">
            «Информационная система — совокупность содержащейся в базах данных информации и обеспечивающих
            её обработку информационных технологий и технических средств».
            <span className="block not-italic text-sm text-slate-400 dark:text-slate-500 mt-2">
              — Федеральный закон № 149-ФЗ «Об информации, информационных технологиях и о защите
              информации», статья 2, пункт 3
            </span>
          </blockquote>

          <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
            То есть ИС — это не просто база данных. База данных лишь хранит данные; информационная система
            добавляет к ним технологии обработки, интерфейсы, роли и регламенты. В терминологии ГОСТ близкое
            понятие — «автоматизированная система»: система из персонала и средств автоматизации, реализующая
            информационную технологию выполнения установленных функций.
          </p>
        </div>
      </section>

      {/* 2. Состав */}
      <section className="py-14 border-b border-slate-200 dark:border-slate-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl md:text-3xl font-bold mb-2">Из чего состоит информационная система</h2>
          <p className="text-slate-500 dark:text-slate-400 mb-8 max-w-2xl">
            Структуру ИС описывают как набор видов обеспечения. Полный перечень задаёт ГОСТ 34.003
            (в РФ — ГОСТ Р 59853-2021); ключевые из них:
          </p>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {provisions.map((p, i) => (
              <div
                key={i}
                className="p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950"
              >
                <div className="w-11 h-11 rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-4">
                  {p.icon}
                </div>
                <h3 className="text-lg font-bold mb-1.5">{p.title}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{p.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 3. Классификация */}
      <section className="py-14 border-b border-slate-200 dark:border-slate-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl md:text-3xl font-bold mb-2">Классификация информационных систем</h2>
          <p className="text-slate-500 dark:text-slate-400 mb-8 max-w-2xl">
            Информационные системы классифицируют по нескольким основаниям одновременно — одна и та же ИС
            попадает в разные группы.
          </p>
          <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900/50">
                  <th className="text-left py-3 px-4 font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest text-xs">Основание</th>
                  <th className="text-left py-3 px-4 font-bold text-slate-500 dark:text-slate-400">Группы информационных систем</th>
                </tr>
              </thead>
              <tbody>
                {classification.map((r, i) => (
                  <tr key={i} className="border-t border-slate-100 dark:border-slate-800/60 align-top">
                    <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white whitespace-nowrap">{r.basis}</td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-300">{r.values}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* 4. Виды по назначению */}
      <section className="py-14 border-b border-slate-200 dark:border-slate-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl md:text-3xl font-bold mb-2">Виды информационных систем по назначению</h2>
          <p className="text-slate-500 dark:text-slate-400 mb-8 max-w-2xl">
            На практике информационные системы чаще всего называют по классу решаемых задач:
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            {systemTypes.map((t, i) => (
              <div
                key={i}
                className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950"
              >
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-base font-bold text-blue-600 dark:text-blue-400">{t.abbr}</span>
                  <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">{t.ru}</span>
                </div>
                <div className="text-xs text-slate-400 dark:text-slate-500 mb-2">{t.full}</div>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{t.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. Свойства */}
      <section className="py-14 border-b border-slate-200 dark:border-slate-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl md:text-3xl font-bold mb-2">Свойства информационных систем</h2>
          <p className="text-slate-500 dark:text-slate-400 mb-8 max-w-2xl">
            Качество ИС оценивают по характеристикам модели ГОСТ Р ИСО/МЭК 25010. Главные из них:
          </p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {properties.map((p, i) => (
              <div key={i} className="flex items-start gap-3">
                <CheckCircle2 size={18} className="text-blue-500 shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white">{p.title}</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{p.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. Жизненный цикл */}
      <section className="py-14 border-b border-slate-200 dark:border-slate-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl md:text-3xl font-bold mb-2">Жизненный цикл информационной системы</h2>
          <p className="text-slate-500 dark:text-slate-400 mb-8 max-w-2xl">
            Классические стадии создания ИС описывает ГОСТ 34.601 (в РФ — ГОСТ Р 59793-2021) — от идеи до
            сопровождения:
          </p>
          <div className="flex flex-wrap items-stretch gap-3">
            {lifecycle.map((step, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="flex items-center gap-2.5 px-4 py-3 rounded-2xl border border-blue-200 dark:border-blue-900/40 bg-blue-50/60 dark:bg-blue-950/30">
                  <span className="text-xs font-bold text-blue-500 dark:text-blue-400">{i + 1}</span>
                  <span className="text-sm font-semibold text-slate-800 dark:text-slate-100 whitespace-nowrap">
                    {step}
                  </span>
                </div>
                {i < lifecycle.length - 1 && (
                  <ArrowRight size={16} className="text-slate-300 dark:text-slate-600 shrink-0" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 7. Как создать ИС — три подхода */}
      <section className="py-16 border-b border-slate-200 dark:border-slate-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl md:text-3xl font-bold mb-2">Как создать информационную систему</h2>
          <p className="text-slate-500 dark:text-slate-400 mb-8 max-w-2xl">
            Тремя путями — и они сильно различаются по срокам, стоимости и зависимости от подрядчика.
          </p>
          <div className="grid gap-6 md:grid-cols-3">
            {approaches.map((a, i) => (
              <div
                key={i}
                className={
                  a.tone === 'blue'
                    ? 'p-6 rounded-3xl border border-blue-300 dark:border-blue-900/50 bg-gradient-to-b from-blue-50 to-white dark:from-blue-950/40 dark:to-slate-950'
                    : 'p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950'
                }
              >
                <div className="flex items-center gap-2 mb-3">
                  <span className={a.tone === 'blue' ? 'text-blue-500' : 'text-amber-500'}>{a.icon}</span>
                  <h3 className="text-lg font-bold">{a.title}</h3>
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{a.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 8. Интеграм как конструктор ИС */}
      <section className="py-16 border-b border-slate-200 dark:border-slate-900 bg-slate-50/60 dark:bg-slate-900/30">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-blue-500/30 text-blue-600 dark:text-blue-400 text-sm font-medium mb-4">
              <Building2 size={14} />
              Интеграм
            </div>
            <h2 className="text-2xl md:text-3xl font-bold mb-3">
              Интеграм — ИИ-конструктор информационных систем
            </h2>
            <p className="text-slate-600 dark:text-slate-300">
              Интеграм — российская low-code платформа, на которой информационная система собирается из
              готовых кирпичей: база данных, роли, интерфейсы и интеграции. А ИИ-агент проходит весь путь
              сам — по описанию на русском или по загруженным Excel-таблицам.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {integramPillars.map((p, i) => (
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
          <p className="text-center mt-10">
            <Link
              to="/knowledge-base/22-information-system-constructor.html"
              className="inline-flex items-center gap-1.5 text-blue-600 dark:text-blue-400 font-semibold hover:gap-2.5 transition-all"
            >
              Подробнее: как собрать ИС на Интеграме вместо заказной разработки
              <ArrowRight size={17} />
            </Link>
          </p>
        </div>
      </section>

      {/* 9. FAQ */}
      <section className="py-16 border-b border-slate-200 dark:border-slate-900">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl md:text-3xl font-bold mb-8">Частые вопросы об информационных системах</h2>
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

      {/* 10. CTA */}
      <section className="py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl border border-blue-500/30 bg-gradient-to-b from-blue-50 to-white dark:from-blue-950/40 dark:to-slate-950 p-8 text-center">
            <div className="flex justify-center mb-4">
              <div className="w-14 h-14 rounded-2xl bg-blue-600 text-white flex items-center justify-center">
                <Sparkles size={26} />
              </div>
            </div>
            <h3 className="text-xl md:text-2xl font-bold mb-3">Соберите свою информационную систему</h3>
            <p className="text-slate-600 dark:text-slate-300 mb-6 max-w-xl mx-auto">
              Загрузите Excel-таблицы — ИИ-агент Интеграма соберёт рабочую информационную систему с базой,
              правами и интерфейсами примерно за 45 минут.
            </p>
            <Link
              to="/excel-to-app.html#excel-form"
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-lg shadow-blue-600/20 transition-colors"
            >
              Загрузить Excel и получить систему
              <ArrowRight size={18} />
            </Link>
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-slate-400 dark:text-slate-500">
            <span className="inline-flex items-center gap-1.5"><Server size={14} /> Сервер в РФ — ideav.ru</span>
            <span className="inline-flex items-center gap-1.5"><ShieldCheck size={14} /> Данные принадлежат вам</span>
            <span className="inline-flex items-center gap-1.5"><Users size={14} /> Роли и права из коробки</span>
            <span className="inline-flex items-center gap-1.5"><Layers size={14} /> Реляционная база</span>
          </div>

          {/* Источники */}
          <div className="mt-12 pt-6 border-t border-slate-200 dark:border-slate-800">
            <div className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3">
              Источники
            </div>
            <ul className="space-y-1.5 text-sm text-slate-500 dark:text-slate-400">
              <li>
                <a href="https://www.consultant.ru/document/cons_doc_LAW_61798/c5051782233acca771e9adb35b47d3fb82c9ff1c/" target="_blank" rel="noopener noreferrer nofollow" className="hover:text-blue-500 transition-colors">
                  Федеральный закон № 149-ФЗ, ст. 2 — определение информационной системы →
                </a>
              </li>
              <li>
                <a href="https://base.garant.ru/187632/" target="_blank" rel="noopener noreferrer nofollow" className="hover:text-blue-500 transition-colors">
                  ГОСТ 34.003-90 — термины автоматизированных систем и виды обеспечения →
                </a>
              </li>
              <li>
                <a href="https://base.garant.ru/187735/" target="_blank" rel="noopener noreferrer nofollow" className="hover:text-blue-500 transition-colors">
                  ГОСТ 34.601-90 — стадии создания автоматизированных систем →
                </a>
              </li>
              <li>
                <a href="https://allgosts.ru/35/080/gost_r_iso!mek_25010-2015" target="_blank" rel="noopener noreferrer nofollow" className="hover:text-blue-500 transition-colors">
                  ГОСТ Р ИСО/МЭК 25010-2015 — характеристики качества →
                </a>
              </li>
            </ul>
          </div>

          <p className="mt-10 text-center text-sm">
            <Link to="/knowledge-base.html" className="text-slate-400 dark:text-slate-500 hover:text-blue-500 transition-colors">
              <span className="inline-flex items-center gap-1.5"><Globe size={14} /> Ещё разборы — в базе знаний →</span>
            </Link>
          </p>
        </div>
      </section>
    </div>
  )
}
