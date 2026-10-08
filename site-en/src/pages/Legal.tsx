import { Blocks } from '../components/Blocks'
import { Breadcrumbs, Container } from '../components/ui'
import { LEGAL } from '../data/legal'

/**
 * Terms, Privacy and Cookies share one layout; the text lives in data/legal.ts.
 * Bracketed placeholders like [Legal entity name] are deliberate: the operating
 * entity, its address and the governing law are filled in by the owner before
 * launch, never invented here.
 */
export default function Legal({ slug }: { slug?: string }) {
  const doc = LEGAL.find((d) => d.slug === slug) ?? LEGAL[0]
  return (
    <article className="py-12 sm:py-16">
      <Container className="max-w-3xl">
        <Breadcrumbs items={[{ name: 'Home', path: '/' }, { name: doc.title, path: `/${doc.slug}` }]} />
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">{doc.title}</h1>
        <p className="mt-3 text-sm text-slate-500">Last updated: {doc.updated}</p>
        {doc.slug === 'cookies' && (
          <button
            type="button"
            onClick={() => window.dispatchEvent(new Event('integram-open-consent'))}
            className="mt-6 rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-800 hover:bg-slate-50"
          >
            Change my cookie choice
          </button>
        )}
        <div className="mt-8">
          <Blocks blocks={doc.blocks} />
        </div>
      </Container>
    </article>
  )
}
