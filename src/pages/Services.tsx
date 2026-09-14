import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { CheckCircle2, Clock, Send, Mail, Phone, ArrowRight } from 'lucide-react'
import Breadcrumbs from '../components/Breadcrumbs'
import { SERVICES_META, SERVICES, ORDER_STEPS, formatPrice } from '../data/services'
import { PRIVACY_OPERATOR } from '../data/privacy'

const SITE = 'https://ideav.ru'

function setMetaTag(selector: string, attr: 'name' | 'property', key: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(selector)
  if (!el) { el = document.createElement('meta'); el.setAttribute(attr, key); document.head.appendChild(el) }
  el.setAttribute('content', content)
}
function setCanonical(href: string) {
  let el = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')
  if (!el) { el = document.createElement('link'); el.setAttribute('rel', 'canonical'); document.head.appendChild(el) }
  el.setAttribute('href', href)
}

/**
 * «Услуги и цены» — /uslugi.html (issue #578).
 *
 * Каталог услуг с ценами, порядком заказа и реквизитами продавца — чтобы
 * Яндекс классифицировал ideav.ru как сайт услуг и показывал рейтинг в
 * Поиске. Данные живут в src/data/services.mjs — общий источник с пререндером
 * (scripts/prerender-uslugi.mjs), чтобы версия «для людей» и версия «для
 * краулеров» не разъезжались.
 */
export default function Services() {
  useEffect(() => {
    document.title = SERVICES_META.title
    const canonical = `${SITE}${SERVICES_META.path}`

    setMetaTag('meta[name="description"]', 'name', 'description', SERVICES_META.description)
    setMetaTag('meta[property="og:type"]', 'property', 'og:type', 'website')
    setMetaTag('meta[property="og:title"]', 'property', 'og:title', SERVICES_META.title)
    setMetaTag('meta[property="og:description"]', 'property', 'og:description', SERVICES_META.description)
    setMetaTag('meta[property="og:url"]', 'property', 'og:url', canonical)
    setCanonical(canonical)
  }, [])

  return (
    <div className="overflow-hidden">
      <section className="pt-32 pb-12 lg:pt-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Breadcrumbs
            className="flex justify-center"
            items={[
              { name: 'Интеграм', to: '/' },
              { name: 'Услуги и цены', to: '/uslugi.html' },
            ]}
          />
          <div className="text-center mb-16">
            {/* H1 дословно повторяет заголовок из scripts/prerender-uslugi.mjs:
                сырой HTML и отрендеренный DOM должны совпадать. */}
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight mb-4">
              {SERVICES_META.h1}
            </h1>
            <p className="text-slate-500 dark:text-slate-400 max-w-3xl mx-auto">
              {SERVICES_META.lead}
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {SERVICES.map((s) => (
              <div
                key={s.id}
                id={s.id}
                className="p-8 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 relative flex flex-col hover:border-slate-300 dark:hover:border-slate-700 transition-all shadow-sm dark:shadow-none scroll-mt-24"
              >
                {s.term && (
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 px-4 py-1 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-[10px] font-black uppercase tracking-[0.2em] rounded-full inline-flex items-center gap-1">
                    <Clock size={10} /> срок: {s.term}
                  </div>
                )}
                <h2 className="text-xl font-bold mb-3">{s.name}</h2>
                <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed mb-6">
                  {s.description}
                </p>
                <div className="mb-6 flex items-baseline gap-2">
                  <span className="text-4xl font-black text-slate-900 dark:text-white">
                    {s.priceFrom ? 'от ' : ''}{formatPrice(s.price)}
                  </span>
                  <span className="text-slate-400 dark:text-slate-500 text-xl font-bold">{s.unit}</span>
                </div>
                <ul className="space-y-3 mb-8 flex-1">
                  {s.features.map((item, i) => (
                    <li key={i} className="flex items-center gap-3 text-sm text-slate-500 dark:text-slate-400">
                      <CheckCircle2 size={14} className="text-blue-500 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
                {/* Якорные ссылки — обычным <a>: полная навигация докрутит до якоря
                    надёжнее SPA-перехода. Кнопки на форму главной (/#cta) — вторичные,
                    ссылки на страницы услуг — основные (синие). */}
                {s.url.includes('#') ? (
                  <a
                    href={s.url}
                    className={
                      s.url.startsWith('/#')
                        ? 'w-full py-4 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-600 text-slate-800 dark:text-white font-bold rounded-xl transition-all text-center inline-flex items-center justify-center gap-2 group'
                        : 'w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-600/20 transition-all text-center inline-flex items-center justify-center gap-2 group'
                    }
                  >
                    {s.cta}
                    <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                  </a>
                ) : (
                  <Link
                    to={s.url}
                    className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-600/20 transition-all text-center inline-flex items-center justify-center gap-2 group"
                  >
                    {s.cta}
                    <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                  </Link>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Порядок заказа и оплаты */}
      <section className="py-16 bg-slate-50 dark:bg-slate-900/50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl md:text-3xl font-bold mb-8 text-center">Как заказать и оплатить</h2>
          <ol className="space-y-6">
            {ORDER_STEPS.map((step, i) => (
              <li key={i} className="flex gap-4">
                <span className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center shrink-0">
                  {i + 1}
                </span>
                <div>
                  <h3 className="font-bold mb-1">{step.h}</h3>
                  <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">{step.p}</p>
                </div>
              </li>
            ))}
          </ol>
          <p className="mt-8 text-sm text-slate-400 dark:text-slate-500 text-center">
            Условия использования платформы — в{' '}
            <Link to="/terms.html" className="underline hover:text-blue-500 transition-colors">
              правилах использования
            </Link>
            , обработка данных — в{' '}
            <Link to="/privacy.html" className="underline hover:text-blue-500 transition-colors">
              политике персональных данных
            </Link>
            .
          </p>
        </div>
      </section>

      {/* Продавец и контакты */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl md:text-3xl font-bold mb-8 text-center">Продавец услуг</h2>
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 p-6 max-w-xl mx-auto">
            <p className="font-semibold text-slate-800 dark:text-slate-100 mb-3">
              {PRIVACY_OPERATOR.name}
            </p>
            <dl className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
              <div className="flex gap-2">
                <dt className="text-slate-400 dark:text-slate-500">ИНН:</dt>
                <dd>{PRIVACY_OPERATOR.inn}</dd>
              </div>
              <div className="flex gap-2">
                <dt className="text-slate-400 dark:text-slate-500">ОГРН:</dt>
                <dd>{PRIVACY_OPERATOR.ogrn}</dd>
              </div>
            </dl>
            <div className="mt-4 flex flex-col gap-2 text-sm">
              <a
                href={`mailto:${PRIVACY_OPERATOR.email}`}
                className="flex w-fit items-center gap-2 text-slate-600 dark:text-slate-300 hover:text-blue-500 transition-colors"
              >
                <Mail size={16} /> {PRIVACY_OPERATOR.email}
              </a>
              <a
                href={`tel:${PRIVACY_OPERATOR.phoneHref}`}
                className="flex w-fit items-center gap-2 text-slate-600 dark:text-slate-300 hover:text-blue-500 transition-colors"
              >
                <Phone size={16} /> {PRIVACY_OPERATOR.phone}
              </a>
              <a
                href="https://t.me/qdmadept"
                className="flex w-fit items-center gap-2 text-slate-600 dark:text-slate-300 hover:text-blue-500 transition-colors"
              >
                <Send size={16} /> @qdmadept
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
