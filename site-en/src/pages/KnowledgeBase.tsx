import { A, Breadcrumbs, CtaBand, Eyebrow, Lead, Section } from '../components/ui'
import { articles } from '../content/kb'

export function formatDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number)
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
  return y && m && d ? `${months[m - 1]} ${d}, ${y}` : iso
}

export default function KnowledgeBase() {
  const sorted = [...articles].sort((a, b) => b.date.localeCompare(a.date))
  return (
    <>
      <Section className="border-b border-slate-200">
        <Breadcrumbs items={[{ name: 'Home', path: '/' }, { name: 'Knowledge base', path: '/knowledge-base' }]} />
        <div className="max-w-3xl">
          <Eyebrow>Knowledge base</Eyebrow>
          <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
            Guides for moving work out of spreadsheets
          </h1>
          <Lead>
            Practical articles on data modeling, access control, internal tools and putting AI agents to work on business
            data. No fluff, no gated PDFs.
          </Lead>
        </div>
      </Section>

      <Section>
        <ul className="grid gap-6 md:grid-cols-2">
          {sorted.map((a) => (
            <li key={a.slug}>
              <A
                to={`/knowledge-base/${a.slug}`}
                className="group flex h-full flex-col rounded-2xl border border-slate-200 p-7 transition-shadow hover:shadow-md"
              >
                <p className="text-sm text-slate-500">
                  <time dateTime={a.date}>{formatDate(a.date)}</time> · {a.readingMinutes} min read
                </p>
                <h2 className="mt-2 text-xl font-semibold text-slate-900 group-hover:text-blue-700">{a.title}</h2>
                <p className="mt-2 flex-1 leading-relaxed text-slate-600">{a.description}</p>
                {a.tags.length > 0 && (
                  <p className="mt-4 flex flex-wrap gap-2">
                    {a.tags.map((t) => (
                      <span key={t} className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                        {t}
                      </span>
                    ))}
                  </p>
                )}
              </A>
            </li>
          ))}
        </ul>
      </Section>

      <CtaBand />
    </>
  )
}
