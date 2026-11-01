import React from 'react'
import { motion } from 'framer-motion'
import { reachGoal } from '../lib/metrika'
import {
  Zap,
  Code2,
  Mail,
  ShieldCheck,
  Database,
  Layers,
  ArrowRight,
  MessageSquare,
  Briefcase,
  FileSpreadsheet,
} from 'lucide-react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { SITE_SECTIONS, CONTACTS } from '../data/siteSections'
import { HOME_FAQ } from '../data/home-faq'
import { movedAnchorTarget } from '../lib/movedAnchor'
import ClientLogos from '@/components/ClientLogos'
import BlogSlider from '@/components/BlogSlider'
import LeadForm from '@/components/LeadForm'

// #823: иконки карточек выбора раздела на первом экране.
const ROUTE_ICONS = { excel: FileSpreadsheet, business: Briefcase, developer: Code2 } as const

/**
 * #827: главная — только общее (выбор раздела, коротко о платформе, клиенты,
 * форма, FAQ, блог). Содержательные блоки переехали на страницы разделов, а
 * их прежние якоря главной продолжают работать: ссылки `/#cases`, `/#pricing`
 * и т. п. живут в рекламе, статьях блога и чужих закладках, поэтому такой
 * якорь переадресуется на тот же блок в разделе.
 */
export const MOVED_ANCHORS: Record<string, string> = {
  'excel-promo': '/zamena-excel.html',
  problem: '/avtomatizaciya-biznesa.html#problem',
  'for-whom': '/avtomatizaciya-biznesa.html#for-whom',
  process: '/avtomatizaciya-biznesa.html#pilot',
  analysts: '/zamena-excel.html#no-code',
  ai: '/avtomatizaciya-biznesa.html#ai',
  integration: '/avtomatizaciya-biznesa.html#integration',
  cases: '/avtomatizaciya-biznesa.html#cases',
  'project-types': '/avtomatizaciya-biznesa.html#project-types',
  solutions: '/zamena-excel.html#solutions',
  pricing: '/avtomatizaciya-biznesa.html#pricing',
  team: '/avtomatizaciya-biznesa.html#team',
  try: '/razrabotchikam.html#start',
  'cloud-tariffs': '/zamena-excel.html#pricing',
}

export default function Home() {
  const [isHeroTeaserActive, setIsHeroTeaserActive] = React.useState(false)
  const { hash, search } = useLocation()
  const navigate = useNavigate()

  React.useEffect(() => {
    const target = MOVED_ANCHORS[hash.slice(1)]
    if (target) navigate(movedAnchorTarget(target, search), { replace: true })
  }, [hash, search, navigate])

  return (
    // Бюджет заголовков (issue #514): один H1, до 10 H2 — только смысловые
    // разделы страницы. Подписи карточек и вопросы FAQ — обычный текст с теми
    // же классами. Тест — tests/issue-514-headings.
    <div className="overflow-hidden">
      {/* 1. Hero Section */}
      <section id="hero" className="scroll-mt-24 relative isolate overflow-hidden pt-24 pb-16 lg:pt-28 lg:pb-24">
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div
            className="hero-background-flicker"
            data-active={isHeroTeaserActive ? 'true' : 'false'}
          >
            <img
              src="/hero-ai-background.webp"
              alt=""
              aria-hidden="true"
              className="absolute inset-0 h-full w-full object-cover object-center"
            />
          </div>
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-[radial-gradient(circle_at_center,rgba(37,99,235,0.08)_0%,transparent_70%)]" />
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/20 to-transparent" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <motion.div
              initial={{ y: 20 }}
              animate={{ y: 0 }}
              transition={{ duration: 0.5 }}
              className="hero-teaser-badge inline-flex items-center gap-2 px-3 py-1 rounded-full border text-blue-500 dark:text-blue-400 text-sm font-medium mb-5"
              data-active={isHeroTeaserActive ? 'true' : 'false'}
            >
              <Zap size={14} className="fill-current" />
              <span
                className="hero-teaser-trigger opacity-100"
                data-active={isHeroTeaserActive ? 'true' : 'false'}
                onMouseEnter={() => setIsHeroTeaserActive(true)}
                onMouseLeave={() => setIsHeroTeaserActive(false)}
              >
                Автоматизация без программистов
              </span>
            </motion.div>

            <div className={`hero-copy-opacity-target transition-opacity duration-700 ease-in-out ${isHeroTeaserActive ? 'opacity-[0.10] dark:opacity-[0.20]' : 'opacity-100'}`}>
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight mb-6 md:mb-8"
              >
<span className="text-blue-500 italic">Интеграм</span> — российский no-code конструктор приложений и баз данных: замена Excel и аналог Airtable для бизнеса
              </motion.h1>


              {/* #823: выбор маршрута — сразу на первом экране. Три раздела
                  сайта по аудитории; реклама ведёт прямо на страницы разделов,
                  а с главной посетитель выбирает сам. Подписи — обычный текст,
                  не заголовки: бюджет заголовков главной (#514). */}
              <motion.nav
                aria-label="Выберите, что вам нужно"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="max-w-5xl mx-auto grid md:grid-cols-3 gap-3 md:gap-4 text-left"
              >
                {SITE_SECTIONS.map((section) => {
                  const Icon = ROUTE_ICONS[section.icon]
                  return (
                    <Link
                      key={section.slug}
                      to={`/${section.slug}.html`}
                      onClick={() => reachGoal('section_choice', { section: section.slug })}
                      className="group flex md:flex-col items-start gap-4 md:gap-0 h-full p-4 md:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/80 backdrop-blur hover:border-blue-500 dark:hover:border-blue-500 shadow-lg shadow-slate-900/5 transition-colors"
                    >
                      <span className="w-11 h-11 shrink-0 rounded-xl bg-blue-600/10 text-blue-600 dark:text-blue-400 flex items-center justify-center md:mb-3">
                        <Icon size={22} />
                      </span>
                      {/* На телефоне карточка в строку и без подписи маршрута —
                          все три выбора помещаются в первый экран. */}
                      <span className="flex flex-col flex-1 h-full">
                        <span className="text-base md:text-lg font-bold text-slate-900 dark:text-white mb-1">{section.choice}</span>
                        <span className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed md:mb-3">{section.choiceNote}</span>
                        <span className="hidden md:inline-flex mt-auto items-center gap-1.5 text-sm font-semibold text-blue-600 dark:text-blue-400">
                          {section.route}
                          <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                        </span>
                      </span>
                    </Link>
                  )
                })}
              </motion.nav>

              {/* Прежние кнопки hero (#319, #281) — вторым планом под выбором раздела. */}
              <div className="mt-6 flex flex-col sm:flex-row flex-wrap items-center justify-center gap-3">
                <a
                  href="#cta"
                  className="w-full sm:w-auto px-5 py-2.5 text-sm bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors"
                >
                  Отправить задачу из очереди задач (бэклога)
                </a>
                <a
                  href="https://ideav.ru/start.html#reg"
                  target="start"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto px-5 py-2.5 text-sm bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold rounded-xl transition-colors"
                >
                  Попробовать самому
                </a>
              </div>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="max-w-3xl mx-auto mt-8 text-base md:text-lg text-slate-900 dark:text-slate-100 leading-relaxed"
              >
                Из Excel-таблицы — рабочее веб-приложение за 45 минут. Реляционные данные, сотни тысяч записей, права доступа на уровне строк, локальное размещение в контуре заказчика. Автоматизация бизнес-процессов без программистов. В реестре отечественного ПО (запись №30872).
              </motion.p>
            </div>
          </div>
        </div>
      </section>

      {/* Коротко о платформе — общее для всех трёх разделов */}
      <section id="technology" className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Масштабируемые информационные системы без кода и автоматизация бизнес-процессов</h2>
            <p className="text-slate-500 dark:text-slate-400 max-w-2xl mx-auto italic">Это не просто «конструктор для менеджеров». Это промышленная платформа.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: Database,
                title: 'Не тормозит на объёмах',
                desc: 'Протестировано на сотнях миллионов записей: таблицы с миллионами строк — штатный режим, без отдельной оптимизации.',
                href: '/knowledge-base/02-excel-row-limit.html',
                linkText: 'Уйти от лимита строк Excel'
              },
              {
                icon: Layers,
                title: 'Любая сложность данных',
                desc: 'Связи, рекурсия и вложенные запросы без ручного кодирования — полноценная реляционная модель данных.',
                href: '/knowledge-base/04-related-tables.html',
                linkText: 'Связанные таблицы без ВПР'
              },
              {
                icon: ShieldCheck,
                title: 'Безопасность на уровне ядра',
                desc: 'Ролевая модель к таблицам, колонкам и записям. Журналы событий и контрольные точки — из коробки. Локальное размещение (on-premise) в контуре заказчика. Данные не покидают вашу инфраструктуру.',
                href: '/knowledge-base/23-security-fault-tolerance.html',
                linkText: 'Безопасность и отказоустойчивость'
              },
              {
                icon: Zap,
                title: 'Автоматизация рутинных задач',
                desc: 'Отчёты и рассылки по расписанию, счета и акты, распределение задач — без макросов и ошибок ручного копирования.',
                href: '/knowledge-base/14a-reports.html',
                linkText: 'Отчёты на той же базе'
              }
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.2 }}
                className="p-8 rounded-3xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/30 hover:bg-white dark:hover:bg-slate-900/50 transition-all group shadow-sm dark:shadow-none"
              >
                <div className="w-14 h-14 rounded-2xl bg-blue-600/10 flex items-center justify-center text-blue-500 mb-6 group-hover:scale-110 transition-transform">
                  <item.icon size={28} />
                </div>
                <p className="text-xl font-bold mb-4">{item.title}</p>
                <p className="text-slate-500 dark:text-slate-400 leading-relaxed">{item.desc}</p>
                {/* Перелинковка на разбор в базе знаний (issue #495) */}
                <Link
                  to={item.href}
                  className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600 dark:text-blue-400 hover:gap-2 transition-all"
                >
                  {item.linkText}
                  <ArrowRight size={15} />
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Клиенты */}
      <ClientLogos />

      {/* Форма заявки — общая для сайта (src/components/LeadForm.tsx, #827):
          на неё ведут кнопки «Заказать», «Уточнить условия» со всего сайта. */}
      <section id="cta" className="scroll-mt-24 py-24 border-t border-slate-200 dark:border-slate-900 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center bg-white dark:bg-slate-950 px-3 py-6 sm:p-8 lg:p-12 rounded-2xl lg:rounded-[3rem] border border-slate-200 dark:border-slate-800 shadow-xl dark:shadow-2xl overflow-hidden relative">
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 blur-[100px] rounded-full -z-10" />

            <div>
              <p className="text-3xl md:text-5xl font-bold mb-8">Готовы разгрузить свой бэклог (очередь задач)?</p>
              <p className="text-slate-500 dark:text-slate-400 text-lg mb-8">
                Пришлите описание задачи или проект из очереди, и мы сделаем предварительную оценку архитектуры и сроков за 24 часа
              </p>

              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-blue-500">
                    <MessageSquare size={20} />
                  </div>
                  <div>
                    <div className="text-sm text-slate-400 dark:text-slate-500 uppercase tracking-widest font-bold">Telegram</div>
                    <a href={CONTACTS.telegram.href} className="text-slate-700 dark:text-slate-200 hover:text-blue-500 font-bold transition-colors">{CONTACTS.telegram.label}</a>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-blue-500">
                    <Mail size={20} />
                  </div>
                  <div>
                    <div className="text-sm text-slate-400 dark:text-slate-500 uppercase tracking-widest font-bold">Email</div>
                    <a href={CONTACTS.email.href} className="text-slate-700 dark:text-slate-200 hover:text-blue-500 font-bold transition-colors">{CONTACTS.email.label}</a>
                  </div>
                </div>
              </div>
            </div>

            <LeadForm />
          </div>
        </div>
      </section>

      {/* 15. FAQ (issue #387, #433 — AI-native позиционирование вместо Instagram-disambiguation) */}
      <section id="faq" className="py-24 border-t border-slate-200 dark:border-slate-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-500 dark:text-blue-400 text-sm font-medium mb-6">
              <MessageSquare size={14} />
              <span>Частые вопросы</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold">Интеграм — коротко о главном</h2>
          </div>

          {/* Вопросы — из src/data/home-faq.mjs: тот же источник питает статический
              снапшот и разметку FAQPage в scripts/prerender-landing.mjs (issue #495).

              Вопросы размечены списком определений (dl/dt/dd), а не заголовками:
              семь H3 подряд размывали структуру страницы, а поисковику вопросы и
              ответы отдаёт разметка FAQPage из снапшота — она даёт расширенный
              сниппет, чего теги H3 не дают (issue #514). */}
          <dl className="space-y-4">
            {HOME_FAQ.map((item, i) => (
              <div
                key={i}
                className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/30"
              >
                <dt className="font-bold text-slate-800 dark:text-slate-100 mb-2">{item.q}</dt>
                <dd className="text-slate-500 dark:text-slate-400 leading-relaxed">
                  <p>{item.a}</p>
                  {item.link && (
                    <Link
                      to={item.link.href}
                      className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600 dark:text-blue-400 hover:gap-2 transition-all"
                    >
                      {item.link.text}
                      <ArrowRight size={15} />
                    </Link>
                  )}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>
      {/* 15b. Свежие статьи блога (issue #512) — данные из src/data/blogPosts.mjs.
          Предпоследний блок, перед SEO-текстом (issue #754). */}
      <BlogSlider />

      {/* 16. SEO-текст в подвал (af.md блок 14).

          Был одним абзацем-перечислением на 100 слов — со стороны выглядело
          переспамом (issue #518). Тот же смысл разложен списком: лид-абзац +
          пять пунктов по темам. Заголовком блок не делаем (issue #514): ключевая
          фраза «информационная система» стоит в H2 «Масштабируемые
          информационные системы», а подробности — на страницах разделов (#827). */}
      <section id="about" className="scroll-mt-24 py-16 border-t border-slate-200 dark:border-slate-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            <span className="font-semibold text-slate-700 dark:text-slate-200">Интеграм — российская no-code платформа для создания информационных систем, внутренних бизнес-приложений и баз данных без программирования.</span> Что на ней собирают:
          </p>
          <ul className="mt-4 grid sm:grid-cols-2 gap-x-8 gap-y-2.5 text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            <li>
              <span className="font-semibold text-slate-700 dark:text-slate-200">Приложение из Excel за 45 минут</span> — формы, отчёты, дашборды, права доступа на уровне строк.
            </li>
            <li>
              <span className="font-semibold text-slate-700 dark:text-slate-200">Замена Excel, Google Sheets и Airtable</span> — сотни тысяч записей, реляционные связи, локальное размещение (on-premise).
            </li>
            <li>
              <span className="font-semibold text-slate-700 dark:text-slate-200">Управление бизнес-процессами</span> — маршрутизация согласования, документооборот, управление заявками и инцидентами.
            </li>
            <li>
              <span className="font-semibold text-slate-700 dark:text-slate-200">Учёт и CRM</span> — система учёта данных, CRM для B2B-продаж, договоры и платежи.
            </li>
            <li>
              <span className="font-semibold text-slate-700 dark:text-slate-200">Автоматизация рутинных задач</span> — генерация отчётов по расписанию, парсинг Excel-файлов, интеграция данных из разрозненных источников.
            </li>
            <li>
              <span className="font-semibold text-slate-700 dark:text-slate-200">Российское ПО</span> — реестр отечественного ПО, запись №30872. Пилот за 2 недели, облако от 0 ₽/мес, локальная лицензия 590 000 ₽/год.
            </li>
          </ul>
          <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
            Подробнее — <Link to="/informatsionnaya-sistema.html" className="font-semibold text-blue-600 dark:text-blue-400 hover:underline">что такое информационная система</Link> и{' '}
            <Link to="/resheniya.html" className="font-semibold text-blue-600 dark:text-blue-400 hover:underline">готовые решения вместо Excel</Link>.
          </p>
        </div>
      </section>
    </div>
  )
}
