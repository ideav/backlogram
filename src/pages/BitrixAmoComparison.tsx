import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  GitCompare,
  Lock,
  Repeat,
  Layers,
  Server,
  ShieldCheck,
  Boxes,
  Clock,
  Infinity as InfinityIcon,
  Star,
  User,
  Wallet,
} from 'lucide-react'
import { Logo } from '../components/Logo'

const SITE = 'https://ideav.ru'
const PATH = '/sravnenie-s-bitrix-amocrm.html'

const PAGE_TITLE =
  'Интеграм vs Битрикс24 и AmoCRM: сравнение и альтернатива CRM — Интеграм'
const PAGE_DESCRIPTION =
  'Чем Интеграм отличается от Битрикс24 и AmoCRM: в коробочных CRM часть логики нельзя изменить даже за деньги — например, перенос лида между воронками. Интеграм — конструктор: модель данных, воронки и правила настраиваются под ваш процесс. Честное сравнение и альтернатива на собственном ядре.'

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

// Вещи, которые в коробочных CRM зашиты в ядро и не меняются даже за деньги.
const locked = [
  {
    icon: <Repeat size={22} />,
    title: 'Воронки и перенос лида',
    body: 'Структура воронок и правила перехода лида между ними заданы вендором. Перенести лид из одной воронки в другую без потери данных и истории — типовая боль, которую не закрывает ни настройка, ни доработка.',
  },
  {
    icon: <Layers size={22} />,
    title: 'Модель данных',
    body: 'Сущности «лид / сделка / контакт / компания» фиксированы. Добавить свою сущность с собственной логикой или переопределить связи между ними нельзя — можно лишь навесить поля.',
  },
  {
    icon: <Wallet size={22} />,
    title: 'Модель оплаты',
    body: 'Оплата за каждого пользователя ежемесячно. Читающие руководители, подрядчики, аудиторы — все считаются «пользователями» и увеличивают счёт.',
  },
  {
    icon: <Lock size={22} />,
    title: 'Границы кастомизации',
    body: 'Доработки упираются в API, виджеты и маркетплейс — надстройку над закрытым ядром. Само ядро продукта заказчику недоступно, поэтому часть ограничений не снимается в принципе.',
  },
]

// Наглядное сравнение колонками «что нельзя поменять в коробке» (issue #4264):
// у Битрикс24 и AmoCRM — ограничения (красный ✗), у Интеграма — гибкость (зелёный ✓).
type CompareColumn = {
  key: string
  positive: boolean
  items: string[]
}

const bitrixLimits: CompareColumn = {
  key: 'bitrix',
  positive: false,
  items: [
    'Воронки ограничены',
    'Сущности фиксированы',
    'Доработки не меняют ядро',
    'Оплата за пользователя',
    'On-prem только коробка',
  ],
}

const amoLimits: CompareColumn = {
  key: 'amo',
  positive: false,
  items: [
    'Перенос между воронками с потерями',
    'Сущности фиксированы',
    'Только API и виджеты',
    'Оплата за пользователя',
    'Только облако',
  ],
}

const integramWins: CompareColumn = {
  key: 'integram',
  positive: true,
  items: [
    'Любые сущности и связи',
    'Гибкие воронки и переходы',
    'Бизнес-логика ваша',
    'Подписка или лицензия',
    'Облако РФ или on-prem',
  ],
}

// «Почему выбирают Интеграм» — три коротких аргумента с яркими иконками.
const whyChoose = [
  {
    icon: <User size={22} />,
    title: 'Под ваш процесс',
    body: 'Настраивайте под свою модель работы.',
  },
  {
    icon: <InfinityIcon size={22} />,
    title: 'Без ограничений коробки',
    body: 'Никаких лимитов на логику и доработки.',
  },
  {
    icon: <Star size={22} />,
    title: 'Подходит для нестандартных CRM',
    body: 'Сложные сценарии — легко.',
  },
]

const faq = [
  {
    q: 'Можно ли перенести данные из Битрикс24 или AmoCRM?',
    a: 'Да. Клиенты, сделки и история выгружаются из Битрикс24 / AmoCRM в Excel или CSV и загружаются в базу Интеграма при настройке.',
  },
  {
    q: 'Это дороже коробочной CRM?',
    a: 'Модель оплаты другая — не за каждого пользователя ежемесячно, а подписка или лицензия. На командах с большим числом «читающих» пользователей и на объёме данных это часто выходит дешевле.',
  },
  {
    q: 'А если нам хватает возможностей коробки?',
    a: 'Тогда честно берите коробку — это быстрее. Интеграм нужен там, где процесс нестандартный, выходит за рамки CRM или вы уже упёрлись в «это нельзя изменить».',
  },
  {
    q: 'Можно ли развернуть на своём сервере?',
    a: 'Да, возможна локальная установка (on-prem) на вашей инфраструктуре — в отличие от облачных CRM, где данные остаются у вендора.',
  },
]

export default function BitrixAmoComparison() {
  useEffect(() => {
    document.title = PAGE_TITLE
    const canonical = `${SITE}${PATH}`
    const ogImage = `${SITE}/og/knowledge-base.png`

    setMetaTag('meta[name="description"]', 'name', 'description', PAGE_DESCRIPTION)
    setMetaTag('meta[name="keywords"]', 'name', 'keywords',
      'битрикс24,amocrm,амосрм,альтернатива битрикс24,альтернатива amocrm,сравнение crm,crm конструктор,перенос лида между воронками,переключение воронок,замена битрикс24,чем заменить amocrm,crm под свой процесс,интеграм')
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
            to="/crm-uchet-klientov.html"
            className="flex w-fit items-center gap-1.5 text-sm text-slate-400 dark:text-slate-500 hover:text-blue-500 transition-colors mb-6"
          >
            <ArrowLeft size={16} /> CRM-учёт клиентов на Интеграме
          </Link>

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-blue-500/30 text-blue-600 dark:text-blue-400 text-sm font-medium mb-5">
            <GitCompare size={14} />
            Сравнение CRM
          </div>

          <motion.h1
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight mb-5"
          >
            Интеграм vs Битрикс24 и AmoCRM:{' '}
            <span className="text-blue-500">что нельзя поменять в коробке</span>
          </motion.h1>

          <p className="text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
            В Битрикс24 и AmoCRM есть вещи, которые нельзя изменить даже за деньги: они зашиты в ядро
            продукта. Типичный пример — переключение воронок и перенос лида из одной воронки в другую.
            Интеграм — это конструктор: модель данных, воронки и правила процесса настраиваются под вас,
            а не вы подстраиваетесь под чужую логику.
          </p>
        </div>
      </section>

      {/* Реальный случай: воронки */}
      <section className="py-14 border-b border-slate-200 dark:border-slate-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl md:text-3xl font-bold mb-2">Реальный случай: перенос лида между воронками</h2>
          <p className="text-slate-500 dark:text-slate-400 mb-8 max-w-2xl">
            У нашего клиента процесс продаж шёл через несколько воронок, и лид должен был переходить из
            одной в другую по ходу сделки.
          </p>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
              <div className="flex items-center gap-2 mb-3 text-slate-900 dark:text-white font-bold">
                <Lock size={18} className="text-slate-400" /> В коробочной CRM
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                Переключение воронок и перенос лида между ними ограничены логикой продукта: теряются
                поля, история и связи, а часть переходов невозможна вовсе. Доработка за деньги не
                помогает — это поведение ядра, к которому у заказчика нет доступа.
              </p>
            </div>
            <div className="p-6 rounded-2xl border border-blue-200 dark:border-blue-900/40 bg-blue-50/60 dark:bg-blue-950/30">
              <div className="flex items-center gap-2 mb-3 text-slate-900 dark:text-white font-bold">
                <Repeat size={18} className="text-blue-500" /> На Интеграме
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                Воронка — это ваши поля и правила. Перенос лида между воронками, свои этапы и условия
                переходов настраиваются запросом без релиза; история и связи сохраняются, потому что
                модель данных ваша.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Что нельзя поменять даже за деньги */}
      <section className="py-14 border-b border-slate-200 dark:border-slate-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl md:text-3xl font-bold mb-2">Что в коробочных CRM нельзя поменять даже за деньги</h2>
          <p className="text-slate-500 dark:text-slate-400 mb-8 max-w-2xl">
            Готовая CRM — это фиксированная модель. Настройками и доработками вы двигаетесь только в тех
            рамках, что заложил вендор. Вот что упирается в ядро продукта.
          </p>

          <div className="grid gap-4 sm:grid-cols-2">
            {locked.map((item, i) => (
              <div
                key={i}
                className="flex gap-4 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950"
              >
                <span className="w-11 h-11 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                  {item.icon}
                </span>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white mb-1">{item.title}</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{item.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Сравнение колонками — «что нельзя поменять в коробке», красочно (issue #4264) */}
      <section className="py-16 border-b border-slate-200 dark:border-slate-900">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-bold mb-2">Что нельзя поменять в коробке</h2>
            <p className="text-slate-500 dark:text-slate-400 max-w-2xl mx-auto">
              В коробочных CRM часть логики зашита в ядро. На Интеграме процессы настраиваются под вас.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-3 items-start">
            {/* Битрикс24 — ограничения */}
            <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-6 sm:p-7">
              <div className="flex items-center gap-1.5 h-9 mb-6">
                <span className="text-2xl font-extrabold tracking-tight text-[#2ba6e0]">Битрикс24</span>
                <Clock size={15} className="text-[#2ba6e0]" />
              </div>
              <ul className="space-y-4">
                {bitrixLimits.items.map((t) => (
                  <li key={t} className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300">
                    <XCircle size={20} className="shrink-0 text-red-500" />
                    {t}
                  </li>
                ))}
              </ul>
            </div>

            {/* AmoCRM — ограничения */}
            <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-6 sm:p-7">
              <div className="flex items-baseline h-9 mb-6">
                <span className="text-2xl font-extrabold tracking-tight lowercase text-slate-400 dark:text-slate-500">amo</span>
                <span className="text-2xl font-extrabold tracking-tight text-sky-500">CRM</span>
                <span className="text-2xl font-extrabold text-sky-500">.</span>
              </div>
              <ul className="space-y-4">
                {amoLimits.items.map((t) => (
                  <li key={t} className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300">
                    <XCircle size={20} className="shrink-0 text-red-500" />
                    {t}
                  </li>
                ))}
              </ul>
            </div>

            {/* Интеграм — выделен зелёным */}
            <div className="rounded-3xl border-2 border-green-400/70 dark:border-green-500/40 bg-white dark:bg-slate-950 p-6 sm:p-7 shadow-xl shadow-green-500/10">
              <div className="flex items-center h-9 mb-6">
                <Logo className="h-6 w-auto text-slate-900 dark:text-white" />
              </div>
              <ul className="space-y-4">
                {integramWins.items.map((t) => (
                  <li key={t} className="flex items-center gap-3 text-sm font-medium text-slate-800 dark:text-slate-100">
                    <CheckCircle2 size={20} className="shrink-0 text-green-500" />
                    {t}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Почему выбирают Интеграм */}
          <div className="mt-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/40 p-6 sm:p-8">
            <h3 className="text-center text-lg md:text-xl font-bold mb-6">Почему выбирают Интеграм</h3>
            <div className="grid gap-6 sm:grid-cols-3">
              {whyChoose.map((w) => (
                <div key={w.title} className="flex items-start gap-4">
                  <span className="w-11 h-11 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-lg shadow-blue-600/20">
                    {w.icon}
                  </span>
                  <div>
                    <div className="font-bold text-slate-900 dark:text-white leading-snug">{w.title}</div>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{w.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 p-5 rounded-2xl border border-amber-300/50 dark:border-amber-900/40 bg-amber-50/50 dark:bg-amber-950/20 max-w-3xl mx-auto">
            <div className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-300">
              <AlertTriangle size={16} className="text-amber-500 shrink-0 mt-0.5" />
              <span>
                Честно: если ваш процесс — это стандартные продажи и он укладывается в готовую CRM,
                берите Битрикс24 или AmoCRM — так быстрее и дешевле на старте. Конструктор нужен, когда
                процесс нестандартный, растёт, выходит за рамки CRM или вы уже упёрлись в «это нельзя
                изменить».
              </span>
            </div>
          </div>

          <p className="mt-8 text-center text-sm">
            <Link to="/crm-uchet-klientov.html" className="inline-flex items-center gap-1.5 font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 transition-colors">
              Подробнее: CRM-учёт клиентов на Интеграме <ArrowRight size={16} />
            </Link>
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 border-b border-slate-200 dark:border-slate-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl md:text-3xl font-bold mb-8">Частые вопросы</h2>
          <div className="space-y-4">
            {faq.map((f, i) => (
              <div key={i} className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
                <h3 className="font-bold text-slate-900 dark:text-white mb-2">{f.q}</h3>
                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{f.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">Упёрлись в «это нельзя изменить»?</h2>
          <p className="text-slate-500 dark:text-slate-400 mb-8 max-w-2xl mx-auto">
            Покажем, как ваш процесс продаж ложится на конструктор Интеграм — с вашими воронками,
            полями и правилами.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <a
              href="https://ideav.ru/start.html"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-600/20 transition-all"
            >
              Начать с Интеграмом <ArrowRight size={18} />
            </a>
            <Link
              to="/crm-uchet-klientov.html"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-bold rounded-xl hover:border-blue-400 dark:hover:border-blue-600 transition-colors"
            >
              CRM на Интеграме
            </Link>
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-slate-400 dark:text-slate-500">
            <span className="inline-flex items-center gap-1.5"><Server size={14} /> Сервер в РФ — ideav.ru</span>
            <span className="inline-flex items-center gap-1.5"><ShieldCheck size={14} /> Реестр отечественного ПО №30872</span>
            <span className="inline-flex items-center gap-1.5"><Boxes size={14} /> Без программирования</span>
          </div>

          <p className="mt-10 text-center text-sm">
            <Link to="/resheniya.html" className="text-slate-400 dark:text-slate-500 hover:text-blue-500 transition-colors">
              Все решения на Интеграме вместо Excel и коробок →
            </Link>
          </p>
        </div>
      </section>
    </div>
  )
}
