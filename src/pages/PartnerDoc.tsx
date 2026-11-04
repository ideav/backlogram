import { useEffect } from 'react'
import { FileText, Mail, Phone } from 'lucide-react'
import Breadcrumbs from '../components/Breadcrumbs'
import { PARTNER_DOCS, PARTNER_DOCS_OPERATOR } from '../data/partner-docs'
import type { PartnerDocKey, PartnerDocLink } from '../data/partner-docs'

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

/** Абзац с необязательной ссылкой на месте {link}. */
function Para({ text, link }: { text: string; link?: PartnerDocLink }) {
  if (!link || !text.includes('{link}')) return <>{text}</>
  const [before, after] = text.split('{link}')
  return (
    <>
      {before}
      {/* Обычная <a>: /self-hosting.html лежит на сервере вне SPA, роутер его не знает. */}
      <a href={link.href} className="text-blue-600 dark:text-blue-400 underline hover:text-blue-500">
        {link.text}
      </a>
      {after}
    </>
  )
}

/**
 * Документы партнёрской программы (ideav/courses#3): оферта партнёра, оферта
 * адепта и описание взаимодействия. Текст — в src/data/partner-docs.mjs, общий
 * с пререндером scripts/prerender-partner-docs.mjs.
 */
export default function PartnerDoc({ doc }: { doc: PartnerDocKey }) {
  const d = PARTNER_DOCS[doc]
  const m = d.meta

  useEffect(() => {
    document.title = m.title
    const canonical = `${SITE}${m.path}`
    const ogImage = `${SITE}/og/knowledge-base.png`
    setMetaTag('meta[name="description"]', 'name', 'description', m.description)
    setMetaTag('meta[name="keywords"]', 'name', 'keywords', m.keywords)
    setMetaTag('meta[property="og:type"]', 'property', 'og:type', 'article')
    setMetaTag('meta[property="og:title"]', 'property', 'og:title', m.title)
    setMetaTag('meta[property="og:description"]', 'property', 'og:description', m.description)
    setMetaTag('meta[property="og:url"]', 'property', 'og:url', canonical)
    setMetaTag('meta[property="og:image"]', 'property', 'og:image', ogImage)
    setMetaTag('meta[property="og:site_name"]', 'property', 'og:site_name', 'Интеграм')
    setMetaTag('meta[property="og:locale"]', 'property', 'og:locale', 'ru_RU')
    setMetaTag('meta[name="twitter:card"]', 'name', 'twitter:card', 'summary_large_image')
    setMetaTag('meta[name="twitter:title"]', 'name', 'twitter:title', m.title)
    setMetaTag('meta[name="twitter:description"]', 'name', 'twitter:description', m.description)
    setMetaTag('meta[name="twitter:image"]', 'name', 'twitter:image', ogImage)
    setCanonical(canonical)
  }, [m])

  return (
    <div className="overflow-hidden">
      <section className="pt-28 pb-10 lg:pt-36 lg:pb-14 border-b border-slate-200 dark:border-slate-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Breadcrumbs
            items={[
              { name: 'Интеграм', to: '/' },
              { name: 'Партнёрам', to: '/partners.html' },
              { name: m.crumb, to: m.path },
            ]}
          />
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-blue-500/30 text-blue-600 dark:text-blue-400 text-sm font-medium mb-5">
            <FileText size={14} />
            {m.eyebrow}
          </div>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight mb-4">{m.h1}</h1>
          <p className="text-sm text-slate-400 dark:text-slate-500 mb-5">
            Редакция от <time dateTime={m.updatedISO}>{m.updated}</time>
          </p>
          <p className="text-lg text-slate-600 dark:text-slate-300 leading-relaxed">{d.intro}</p>
        </div>
      </section>

      <section className="py-12 lg:py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          {d.sections.map(section => (
            <div key={section.id} id={section.id} className="scroll-mt-24">
              <h2 className="text-xl md:text-2xl font-bold mb-4">{section.h}</h2>
              <div className="space-y-4">
                {section.blocks.map((block, i) =>
                  block.list ? (
                    <ul key={i} className="space-y-2 pl-1">
                      {block.list.map((item, j) => (
                        <li key={j} className="flex gap-3 text-slate-600 dark:text-slate-300 leading-relaxed">
                          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p key={i} className="text-slate-600 dark:text-slate-300 leading-relaxed">
                      <Para text={block.p} link={block.link} />
                    </p>
                  ),
                )}
              </div>
            </div>
          ))}

          <div id="rekvizity" className="scroll-mt-24">
            <h2 className="text-xl md:text-2xl font-bold mb-4">Реквизиты и контакты</h2>
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 p-6">
              <p className="font-semibold text-slate-800 dark:text-slate-100 mb-3">{PARTNER_DOCS_OPERATOR.name}</p>
              <dl className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
                <div className="flex gap-2">
                  <dt className="text-slate-400 dark:text-slate-500">ИНН:</dt>
                  <dd>{PARTNER_DOCS_OPERATOR.inn}</dd>
                </div>
                <div className="flex gap-2">
                  <dt className="text-slate-400 dark:text-slate-500">ОГРН:</dt>
                  <dd>{PARTNER_DOCS_OPERATOR.ogrn}</dd>
                </div>
              </dl>
              <div className="mt-4 flex flex-col gap-2 text-sm">
                <a href={`mailto:${PARTNER_DOCS_OPERATOR.email}`} className="flex w-fit items-center gap-2 text-slate-600 dark:text-slate-300 hover:text-blue-500 transition-colors">
                  <Mail size={16} /> {PARTNER_DOCS_OPERATOR.email}
                </a>
                <a href={`tel:${PARTNER_DOCS_OPERATOR.phoneHref}`} className="flex w-fit items-center gap-2 text-slate-600 dark:text-slate-300 hover:text-blue-500 transition-colors">
                  <Phone size={16} /> {PARTNER_DOCS_OPERATOR.phone}
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
