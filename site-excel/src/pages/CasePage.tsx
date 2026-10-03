import { ArrowRight } from 'lucide-react'
import { CaseBody } from '../Cases'
import { BLOG_POST_URL, CASES, COMPARE_PAGE, type Case } from '../content'
import { SITE_BASE } from '../site-base'
import { StaticPage } from './StaticPage'

/**
 * Отдельная страница одного кейса (issue #626, находка 2).
 *
 * Четыре кейса — самый содержательный материал домена: цифры, отрасли,
 * «было → стало». Пока они жили якорем внутри одной SPA, по запросам
 * «автоматизация производства кормов» или «сопоставление заявок с каталогом»
 * конкурировала одна и та же главная.
 */
export function CasePage({ item }: { item: Case }) {
  const others = CASES.filter(c => c.slug !== item.slug)
  return (
    <StaticPage
      breadcrumb={[
        { href: SITE_BASE, title: 'Excel → приложение' },
        { href: `${SITE_BASE}#keysy`, title: 'Кейсы' },
      ]}
      h1={`${item.industry}: из Excel в приложение`}
      lead={item.lead}
    >
      <section className="max-w-5xl mx-auto px-4 sm:px-6 py-4">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-8 shadow-sm">
          <p className="text-sm font-semibold text-blue-600">{item.client}</p>
          <h2 className="mt-1 text-xl sm:text-2xl font-bold">Что было в таблицах и что стало в приложении</h2>
          <CaseBody item={item} />
        </div>

        <p className="mt-8 text-sm text-slate-500">
          Как агент разбирает такие файлы на таблицы, связи и роли —{' '}
          <a
            href={BLOG_POST_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-blue-600 hover:underline"
          >
            в статье с границами автоматизации <ArrowRight size={14} />
          </a>
        </p>

        <h2 className="mt-12 text-2xl font-bold">Другие кейсы</h2>
        <ul className="mt-6 grid gap-4 sm:grid-cols-3">
          {others.map(other => (
            <li key={other.slug} className="rounded-2xl border border-slate-200 p-5">
              <p className="text-sm font-semibold text-blue-600">{other.client}</p>
              <a
                href={`${SITE_BASE}keysy/${other.slug}/`}
                className="mt-1 block font-semibold hover:text-blue-600 hover:underline"
              >
                {other.industry}
              </a>
              <p className="mt-2 text-sm text-slate-500">{other.facts.join(' · ')}</p>
            </li>
          ))}
        </ul>

        <p className="mt-6 text-sm">
          <a
            href={`${SITE_BASE}${COMPARE_PAGE.slug}/`}
            className="inline-flex items-center gap-1 text-blue-600 font-medium hover:underline"
          >
            Чем это отличается от Power Apps и Quickbase <ArrowRight size={14} />
          </a>
        </p>
      </section>
    </StaticPage>
  )
}
