import { useEffect } from 'react'
import { ShieldCheck, Mail, Phone } from 'lucide-react'
import Breadcrumbs from '../components/Breadcrumbs'
import {
  PRIVACY_META,
  PRIVACY_OPERATOR,
  PRIVACY_INTRO,
  PRIVACY_SECTIONS,
} from '../data/privacy'

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
 * Политика обработки персональных данных — страница /privacy.html (issue #542).
 *
 * На неё ведёт ссылка «обработку персональных данных» из галочки согласия под
 * каждой формой-заявкой, поэтому документ обязан открываться, а не теряться в
 * маршрутизации. Текст живёт в src/data/privacy.mjs — общий источник с
 * пререндером (scripts/prerender-privacy.mjs), чтобы версия «для людей» и
 * версия «для краулеров и клиентов без JS» не разъезжались.
 */
export default function Privacy() {
  useEffect(() => {
    document.title = PRIVACY_META.title
    const canonical = `${SITE}${PRIVACY_META.path}`
    const ogImage = `${SITE}/og/knowledge-base.png`

    setMetaTag('meta[name="description"]', 'name', 'description', PRIVACY_META.description)
    setMetaTag('meta[name="keywords"]', 'name', 'keywords', PRIVACY_META.keywords)
    setMetaTag('meta[property="og:type"]', 'property', 'og:type', 'article')
    setMetaTag('meta[property="og:title"]', 'property', 'og:title', PRIVACY_META.title)
    setMetaTag('meta[property="og:description"]', 'property', 'og:description', PRIVACY_META.description)
    setMetaTag('meta[property="og:url"]', 'property', 'og:url', canonical)
    setMetaTag('meta[property="og:image"]', 'property', 'og:image', ogImage)
    setMetaTag('meta[property="og:site_name"]', 'property', 'og:site_name', 'Интеграм')
    setMetaTag('meta[property="og:locale"]', 'property', 'og:locale', 'ru_RU')
    setMetaTag('meta[name="twitter:card"]', 'name', 'twitter:card', 'summary_large_image')
    setMetaTag('meta[name="twitter:title"]', 'name', 'twitter:title', PRIVACY_META.title)
    setMetaTag('meta[name="twitter:description"]', 'name', 'twitter:description', PRIVACY_META.description)
    setMetaTag('meta[name="twitter:image"]', 'name', 'twitter:image', ogImage)
    setCanonical(canonical)
  }, [])

  return (
    <div className="overflow-hidden">
      {/* Hero */}
      <section className="pt-28 pb-10 lg:pt-36 lg:pb-14 border-b border-slate-200 dark:border-slate-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Breadcrumbs
            items={[
              { name: 'Интеграм', to: '/' },
              { name: 'Политика обработки персональных данных', to: PRIVACY_META.path },
            ]}
          />

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-blue-500/30 text-blue-600 dark:text-blue-400 text-sm font-medium mb-5">
            <ShieldCheck size={14} />
            Документ по 152-ФЗ
          </div>

          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight mb-4">
            Политика обработки <span className="text-blue-500">персональных данных</span>
          </h1>

          <p className="text-sm text-slate-400 dark:text-slate-500 mb-5">
            Редакция от <time dateTime={PRIVACY_META.updatedISO}>{PRIVACY_META.updated}</time>
          </p>

          <p className="text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
            {PRIVACY_INTRO}
          </p>
        </div>
      </section>

      {/* Разделы документа */}
      <section className="py-12 lg:py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          {PRIVACY_SECTIONS.map(section => (
            <div key={section.id} id={section.id} className="scroll-mt-24">
              <h2 className="text-xl md:text-2xl font-bold mb-4">{section.h}</h2>
              <div className="space-y-4">
                {section.blocks.map((block, i) =>
                  block.list ? (
                    <ul key={i} className="space-y-2 pl-1">
                      {block.list.map((item, j) => (
                        <li
                          key={j}
                          className="flex gap-3 text-slate-600 dark:text-slate-300 leading-relaxed"
                        >
                          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p key={i} className="text-slate-600 dark:text-slate-300 leading-relaxed">
                      {block.p}
                    </p>
                  ),
                )}
              </div>
            </div>
          ))}

          {/* Контакты оператора */}
          <div id="kontakty" className="scroll-mt-24">
            <h2 className="text-xl md:text-2xl font-bold mb-4">13. Контакты</h2>
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 p-6">
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
              </div>
              <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
                По вопросам обработки персональных данных, для отзыва согласия и для запросов
                по статьям 14–16 152-ФЗ пишите на указанный адрес электронной почты.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
