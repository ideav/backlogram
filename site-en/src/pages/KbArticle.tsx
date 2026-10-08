import { A, Breadcrumbs, Container, CtaBand } from '../components/ui'
import { Blocks } from '../components/Blocks'
import { articles } from '../content/kb'
import { formatDate } from './KnowledgeBase'

export default function KbArticle({ slug }: { slug?: string }) {
  const a = articles.find((x) => x.slug === slug)
  if (!a) return null
  const more = articles.filter((x) => x.slug !== a.slug).slice(0, 3)
  return (
    <>
      <article className="py-12 sm:py-16">
        <Container className="max-w-3xl">
          <Breadcrumbs
            items={[
              { name: 'Home', path: '/' },
              { name: 'Knowledge base', path: '/knowledge-base' },
              { name: a.title, path: `/knowledge-base/${a.slug}` },
            ]}
          />
          <header className="border-b border-slate-200 pb-8">
            <h1 className="text-3xl font-bold leading-tight tracking-tight text-slate-900 sm:text-4xl">{a.title}</h1>
            <p className="mt-4 text-lg leading-relaxed text-slate-600">{a.description}</p>
            <p className="mt-4 text-sm text-slate-500">
              <time dateTime={a.date}>{formatDate(a.date)}</time> · {a.readingMinutes} min read
              {a.tags.length > 0 && <> · {a.tags.join(', ')}</>}
            </p>
          </header>
          <div className="pt-8">
            <Blocks blocks={a.blocks} />
          </div>
        </Container>
      </article>

      {more.length > 0 && (
        <section className="border-t border-slate-200 bg-slate-50 py-14">
          <Container className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-wider text-slate-500">Keep reading</p>
            <ul className="mt-4 space-y-3">
              {more.map((m) => (
                <li key={m.slug}>
                  <A to={`/knowledge-base/${m.slug}`} className="font-semibold text-blue-700 hover:underline">
                    {m.title}
                  </A>
                </li>
              ))}
            </ul>
          </Container>
        </section>
      )}

      <CtaBand />
    </>
  )
}
