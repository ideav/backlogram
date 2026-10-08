import { A, Breadcrumbs, CtaBand, Eyebrow, Lead, Section, Zoomable } from '../components/ui'
import { getImageAlt } from '../content/imageAlt'
import { useCases } from '../content/usecases'
import { href } from '../site'

export default function UseCases() {
  return (
    <>
      <Section className="border-b border-slate-200">
        <Breadcrumbs items={[{ name: 'Home', path: '/' }, { name: 'Use cases', path: '/use-cases' }]} />
        <div className="max-w-3xl">
          <Eyebrow>Use cases</Eyebrow>
          <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
            Apps teams build on Integram
          </h1>
          <Lead>
            Each of these started life as a spreadsheet, a shared inbox or a chat thread. Pick the one closest to yours:
            every page shows the tables, the roles and how an AI agent can help.
          </Lead>
        </div>
      </Section>

      <Section>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {useCases.map((uc) => (
            <div
              key={uc.slug}
              className="flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white transition-shadow hover:shadow-md"
            >
              {/* The picture enlarges on click; the text below leads to the use case page. */}
              <Zoomable src={uc.image} alt={getImageAlt(uc.image)}>
                <img
                  src={href(uc.image)}
                  alt=""
                  width={1536}
                  height={1024}
                  loading="lazy"
                  decoding="async"
                  className="aspect-[3/2] w-full bg-slate-100 object-cover"
                />
              </Zoomable>
              <A to={`/use-cases/${uc.slug}`} className="group flex flex-1 flex-col p-6">
                <h2 className="text-lg font-semibold text-slate-900 group-hover:text-blue-700">{uc.title}</h2>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-600">{uc.subheadline}</p>
                <p className="mt-4 text-xs font-medium uppercase tracking-wider text-slate-500">For: {uc.audience}</p>
              </A>
            </div>
          ))}
        </div>
      </Section>

      <CtaBand title="Do not see yours?" text="Most apps on Integram are one of a kind. Start from your own spreadsheet, or tell us what you need and we will show you how it would look." />
    </>
  )
}
