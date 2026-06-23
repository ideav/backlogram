import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
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
} from 'lucide-react'

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

// Полный цикл сопоставления — от двух сырых каталогов до выгрузки результата.
const flow = [
  { icon: <Upload size={18} />, label: 'Загрузка каталогов' },
  { icon: <Scissors size={18} />, label: 'Токенизация' },
  { icon: <GitCompare size={18} />, label: 'Сопоставление' },
  { icon: <Cpu size={18} />, label: 'Массовый подбор' },
  { icon: <ListChecks size={18} />, label: 'Проверка кандидатов' },
  { icon: <FileSpreadsheet size={18} />, label: 'Выгрузка в Excel' },
]

interface Step {
  icon: React.ReactNode
  title: string
  body: string
}

const steps: Step[] = [
  {
    icon: <Upload size={22} />,
    title: 'Загрузка по сохранённой настройке',
    body: 'Свой каталог (SKU) и каталог контрагента (RFP) загружаются из Excel по заранее сохранённой настройке: Интеграм сам распознаёт листы и колонки и показывает, сколько строк будет загружено. Скорость — порядка 500–1000 записей в секунду.',
  },
  {
    icon: <Scissors size={22} />,
    title: 'Токенизация наименований',
    body: 'Один запрос разбивает наименование позиции на отдельные слова-токены и наполняет общий справочник токенов. Обе таблицы используют один и тот же справочник — именно это позволяет искать пересечения.',
  },
  {
    icon: <GitCompare size={22} />,
    title: 'Рабочее место сопоставления',
    body: 'Для любой позиции контрагента Интеграм по токенам подбирает кандидатов из вашего каталога. Совпадение марки, модели и типа подсвечивается зелёным; под каждый тип продукции настройка задаётся запросом, без программирования.',
  },
  {
    icon: <Cpu size={22} />,
    title: 'Массовый автоматический подбор',
    body: 'Кнопка Start запускает автоподбор в несколько потоков: механизм сам находит лучшие пары и пишет в таблицу RFP подобранный артикул и альтернативных кандидатов. Скорость — порядка 120 сопоставлений в минуту; 22 000 позиций обрабатываются за пару-тройку часов.',
  },
  {
    icon: <FileSpreadsheet size={22} />,
    title: 'Выгрузка и передача',
    body: 'Отдельный запрос собирает подобранный артикул и все альтернативы и выгружает результат в Excel или отдаёт через JSON API во внешнюю систему.',
  },
  {
    icon: <Sparkles size={22} />,
    title: 'Доуточнение языковой моделью',
    body: 'Когда объём невелик, шорт-лист кандидатов можно отдать языковой модели — она выберет из коротких списков только то, что точно совпадает. Дорогое перемножение «все на все» при этом не нужно: модель работает уже по отобранным парам.',
  },
]

interface CompareRow {
  criterion: string
  them: string
  us: string
}

const compareRows: CompareRow[] = [
  {
    criterion: 'Запуск',
    them: 'Развёртывание Elasticsearch, индексы, пайплайны, код разработчика',
    us: 'Готовые таблицы и запросы в конструкторе — без кода',
  },
  {
    criterion: 'Логика сопоставления',
    them: 'Алгоритмы нечёткого поиска нужно писать и сопровождать',
    us: 'Токены + пересечение + веса настраиваются запросом',
  },
  {
    criterion: 'Настройка под тип товара',
    them: 'Правки в коде и переиндексация',
    us: 'Меняется условие запроса, без релиза',
  },
  {
    criterion: 'Массовый прогон',
    them: 'Свой многопоточный обработчик',
    us: 'Встроенный автоподбор в несколько потоков',
  },
  {
    criterion: 'Результат',
    them: 'Нужно выгружать отдельно',
    us: 'Подобранный артикул, альтернативы, экспорт в Excel и API из коробки',
  },
  {
    criterion: 'Где хранятся данные',
    them: 'Зависит от инфраструктуры',
    us: 'Сервер в РФ — ideav.ru, данные принадлежат вам',
  },
]

const pillars = [
  {
    icon: <Boxes size={24} />,
    title: 'Один справочник токенов на оба каталога',
    body: 'Токены ваших позиций и позиций контрагента живут в одной таблице — пересечение находится одним JOIN, а не внешним поисковым движком.',
  },
  {
    icon: <Gauge size={24} />,
    title: 'Понятная и настраиваемая оценка',
    body: 'Точность пары считается из числа совпавших токенов и отношения их общей длины к длине наименования. Формулу видно, её можно усложнять и оттачивать.',
  },
  {
    icon: <Layers size={24} />,
    title: 'Веса и обязательные совпадения',
    body: 'Частым словам — меньший вес, маркерам бренда и типа товара — флажки «обязательно совпадает». Разметку токенов помогает проставить ИИ.',
  },
]

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

  return (
    <div className="overflow-hidden">
      {/* Hero */}
      <section className="pt-28 pb-12 lg:pt-36 lg:pb-16 border-b border-slate-200 dark:border-slate-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link
            to="/knowledge-base.html"
            className="inline-flex items-center gap-1.5 text-sm text-slate-400 dark:text-slate-500 hover:text-blue-500 transition-colors mb-6"
          >
            <ArrowLeft size={16} /> К базе знаний
          </Link>

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
            Массовое сопоставление каталогов{' '}
            <span className="text-blue-500">на сотни тысяч позиций</span>
          </motion.h1>

          <p className="text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
            Один и тот же товар в вашем каталоге и в каталоге контрагента назван по-разному и имеет
            разные артикулы. Инструмент сопоставляет такие позиции автоматически — через токенизацию
            наименований и пересечение токенов, в несколько потоков и без программирования. Раньше под
            это разворачивали Elasticsearch и нанимали программистов; здесь всё собрано на конструкторе
            Интеграм.
          </p>
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

      {/* Full flow */}
      <section className="py-14 border-b border-slate-200 dark:border-slate-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl md:text-3xl font-bold mb-2">Полный цикл сопоставления</h2>
          <p className="text-slate-500 dark:text-slate-400 mb-8 max-w-2xl">
            От двух сырых выгрузок до готового файла с подобранными артикулами — внутри одной базы
            Интеграма:
          </p>

          <div className="flex flex-wrap items-stretch gap-3">
            {flow.map((step, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="flex items-center gap-2.5 px-4 py-3 rounded-2xl border border-blue-200 dark:border-blue-900/40 bg-blue-50/60 dark:bg-blue-950/30">
                  <span className="text-blue-600 dark:text-blue-400">{step.icon}</span>
                  <span className="text-sm font-semibold text-slate-800 dark:text-slate-100 whitespace-nowrap">
                    {step.label}
                  </span>
                </div>
                {i < flow.length - 1 && (
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
            {steps.map((s, i) => (
              <div
                key={i}
                className="p-7 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-sm dark:shadow-none"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-11 h-11 rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                    {s.icon}
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
                {compareRows.map((r, i) => (
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

      {/* Conclusion + CTA */}
      <section className="py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">Кому это нужно</h2>
          <p className="text-lg text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
            Поставщикам и дистрибьюторам, которые отвечают на запросы (RFP) и подбирают свои аналоги к
            чужой номенклатуре; закупкам, сводящим прайс-листы поставщиков; всем, у кого две таблицы
            «про одно и то же», но названные разными словами.
          </p>
          <p className="text-lg text-slate-600 dark:text-slate-300 leading-relaxed mb-10">
            Инструмент собран на конструкторе Интеграм — без программирования, с хостингом в России,
            и так же легко настраивается под вашу номенклатуру.
          </p>

          <div className="rounded-3xl border border-blue-500/30 bg-gradient-to-b from-blue-50 to-white dark:from-blue-950/40 dark:to-slate-950 p-8 text-center">
            <div className="flex justify-center mb-4">
              <div className="w-14 h-14 rounded-2xl bg-blue-600 text-white flex items-center justify-center">
                <Sparkles size={26} />
              </div>
            </div>
            <h3 className="text-xl md:text-2xl font-bold mb-3">Сопоставить ваши каталоги</h3>
            <p className="text-slate-600 dark:text-slate-300 mb-6 max-w-xl mx-auto">
              Пришлите два каталога — настроим токенизацию и сопоставление под вашу номенклатуру и
              вернём подобранные пары.
            </p>
            <a
              href="https://ideav.ru/start.html"
              target="start"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-lg shadow-blue-600/20 transition-colors"
            >
              Начать с Интеграмом
              <ArrowRight size={18} />
            </a>
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-slate-400 dark:text-slate-500">
            <span className="inline-flex items-center gap-1.5"><Server size={14} /> Сервер в РФ — ideav.ru</span>
            <span className="inline-flex items-center gap-1.5"><ShieldCheck size={14} /> Ваши данные принадлежат вам</span>
            <span className="inline-flex items-center gap-1.5"><Boxes size={14} /> Без программирования</span>
          </div>

          <p className="mt-10 text-center text-sm">
            <a
              href="https://blog.ideav.ru/posts/massovoe-sopostavlenie-katalogov/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-400 dark:text-slate-500 hover:text-blue-500 transition-colors"
            >
              Подробный разбор в блоге: массовый автоподбор пар →
            </a>
          </p>
          <p className="mt-2 text-center text-sm">
            <Link to="/knowledge-base/21-catalog-matching.html" className="text-slate-400 dark:text-slate-500 hover:text-blue-500 transition-colors">
              В базе знаний: Интеграм вместо Elasticsearch →
            </Link>
          </p>
        </div>
      </section>
    </div>
  )
}
