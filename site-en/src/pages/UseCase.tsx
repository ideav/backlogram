import { ArrowRight, Bot, Check, X } from 'lucide-react'
import { A, Breadcrumbs, Button, Container, CtaBand, Eyebrow, Faq, H2, Img, Section } from '../components/ui'
import { useCases } from '../content/usecases'
import { SIGNUP_PATH } from '../site'

export default function UseCase({ slug }: { slug?: string }) {
  const uc = useCases.find((u) => u.slug === slug)
  if (!uc) return null
  const related = useCases.filter((u) => u.slug !== uc.slug).slice(0, 3)
  return (
    <>
      <section className="border-b border-slate-200">
        <Container className="py-12 sm:py-16">
          <Breadcrumbs
            items={[
              { name: 'Home', path: '/' },
              { name: 'Use cases', path: '/use-cases' },
              { name: uc.title, path: `/use-cases/${uc.slug}` },
            ]}
          />
          <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr]">
            <div>
              <Eyebrow>{uc.title}</Eyebrow>
              <h1 className="text-4xl font-bold leading-tight tracking-tight text-slate-900 sm:text-5xl">{uc.headline}</h1>
              <p className="mt-5 text-lg leading-relaxed text-slate-600">{uc.subheadline}</p>
              <p className="mt-4 text-sm text-slate-500">
                <span className="font-semibold text-slate-700">Built for:</span> {uc.audience}
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button to={SIGNUP_PATH} arrow>
                  Start free
                </Button>
                <Button to="/contact" variant="secondary">
                  Book a demo
                </Button>
              </div>
            </div>
            <Img src={uc.image} eager />
          </div>
        </Container>
      </section>

      {uc.pains.length > 0 && (
        <Section muted>
          <H2>Sound familiar?</H2>
          <ul className="mt-8 grid gap-4 md:grid-cols-3">
            {uc.pains.map((p) => (
              <li key={p} className="flex gap-3 rounded-2xl border border-slate-200 bg-white p-5 text-slate-700">
                <X size={18} aria-hidden="true" className="mt-0.5 shrink-0 text-slate-400" />
                {p}
              </li>
            ))}
          </ul>
        </Section>
      )}

      {uc.solution.length > 0 && (
        <Section>
          <H2>How Integram handles it</H2>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {uc.solution.map((s) => (
              <div key={s.title} className="rounded-2xl border border-slate-200 p-6">
                <Check size={20} aria-hidden="true" className="text-blue-600" />
                <h3 className="mt-3 text-lg font-semibold text-slate-900">{s.title}</h3>
                <p className="mt-2 leading-relaxed text-slate-600">{s.text}</p>
              </div>
            ))}
          </div>
        </Section>
      )}

      <Section muted>
        <div className="grid gap-10 lg:grid-cols-2">
          {uc.steps.length > 0 && (
            <div>
              <H2>Set it up</H2>
              <ol className="mt-8 space-y-4">
                {uc.steps.map((s, i) => (
                  <li key={s} className="flex gap-4 rounded-xl border border-slate-200 bg-white p-5">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-600 text-sm font-semibold text-white">
                      {i + 1}
                    </span>
                    <span className="leading-relaxed text-slate-700">{s}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}
          {uc.aiAngle && (
            <div className="self-start rounded-2xl bg-slate-900 p-8 text-white">
              <Bot size={26} aria-hidden="true" className="text-blue-300" />
              <h2 className="mt-4 text-2xl font-bold tracking-tight">With an AI agent</h2>
              <p className="mt-3 leading-relaxed text-slate-300">{uc.aiAngle}</p>
              <A to="/ai" className="mt-5 inline-flex items-center gap-1.5 font-semibold text-blue-300 hover:underline">
                Connect an agent via MCP <ArrowRight size={16} aria-hidden="true" />
              </A>
            </div>
          )}
        </div>
      </Section>

      {uc.faq.length > 0 && (
        <Section>
          <Faq items={uc.faq} />
        </Section>
      )}

      {related.length > 0 && (
        <Section muted>
          <p className="text-sm font-semibold uppercase tracking-wider text-slate-500">More use cases</p>
          <div className="mt-6 grid gap-6 md:grid-cols-3">
            {related.map((r) => (
              <A key={r.slug} to={`/use-cases/${r.slug}`} className="group rounded-2xl border border-slate-200 bg-white p-6 hover:shadow-md">
                <h3 className="font-semibold text-slate-900 group-hover:text-blue-700">{r.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{r.subheadline}</p>
              </A>
            ))}
          </div>
        </Section>
      )}

      <CtaBand />
    </>
  )
}
