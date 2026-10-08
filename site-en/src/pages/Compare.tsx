import { ArrowRight, ExternalLink } from 'lucide-react'
import { A, Breadcrumbs, Button, CtaBand, Eyebrow, Faq, H2, Lead, Section } from '../components/ui'
import { COMPETITORS } from '../data/compare'
import { SIGNUP_PATH } from '../site'

export default function Compare({ slug }: { slug?: string }) {
  const c = COMPETITORS.find((x) => x.slug === slug) ?? COMPETITORS[0]
  const others = COMPETITORS.filter((x) => x.slug !== c.slug)
  return (
    <>
      <Section className="border-b border-slate-200">
        <Breadcrumbs items={[{ name: 'Home', path: '/' }, { name: c.headline, path: `/compare/${c.slug}` }]} />
        <div className="max-w-3xl">
          <Eyebrow>Comparison</Eyebrow>
          <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">{c.headline}</h1>
          <Lead>{c.intro}</Lead>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button to={SIGNUP_PATH} arrow>
              Try Integram free
            </Button>
            <Button to="/contact" variant="secondary">
              Book a demo
            </Button>
          </div>
        </div>
      </Section>

      <Section>
        <H2>Side by side</H2>
        <div className="mt-8 overflow-x-auto rounded-2xl border border-slate-200">
          <table className="w-full min-w-[680px] text-left">
            <caption className="sr-only">
              Integram compared with {c.name}
            </caption>
            <thead className="bg-slate-50 text-sm">
              <tr>
                <th scope="col" className="w-1/5 px-5 py-4 font-semibold text-slate-700">
                  <span className="sr-only">Aspect</span>
                </th>
                <th scope="col" className="px-5 py-4 font-semibold text-blue-700">Integram</th>
                <th scope="col" className="px-5 py-4 font-semibold text-slate-700">{c.name}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 align-top">
              {c.rows.map((r) => (
                <tr key={r.label}>
                  <th scope="row" className="px-5 py-4 font-medium text-slate-900">{r.label}</th>
                  <td className="px-5 py-4 leading-relaxed text-slate-700">{r.us}</td>
                  <td className="px-5 py-4 leading-relaxed text-slate-700">{r.them}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-4 text-sm text-slate-500">
          Summarized from {c.name}’s public product and pricing pages. Plans change; check{' '}
          <A to={c.pricingUrl} className="inline-flex items-center gap-1 font-medium text-blue-700 hover:underline">
            {c.name} pricing <ExternalLink size={13} aria-hidden="true" />
          </A>{' '}
          for current numbers. Spotted something out of date?{' '}
          <A to="/contact" className="font-medium text-blue-700 hover:underline">
            Tell us
          </A>
          .
        </p>
      </Section>

      <Section muted>
        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-7">
            <h2 className="text-xl font-semibold text-slate-900">Choose {c.name} if</h2>
            <ul className="mt-4 list-disc space-y-2.5 pl-5 leading-relaxed text-slate-700 marker:text-slate-400">
              {c.chooseThem.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl border border-blue-200 bg-white p-7 ring-1 ring-blue-100">
            <h2 className="text-xl font-semibold text-slate-900">Choose Integram if</h2>
            <ul className="mt-4 list-disc space-y-2.5 pl-5 leading-relaxed text-slate-700 marker:text-blue-600">
              {c.chooseUs.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
          </div>
        </div>
      </Section>

      <Section>
        <div className="mx-auto max-w-3xl">
          <H2>Moving from {c.name}</H2>
          <Lead>{c.migration}</Lead>
        </div>
      </Section>

      <Section muted>
        <Faq items={c.faq} />
      </Section>

      <Section>
        <p className="text-sm font-semibold uppercase tracking-wider text-slate-500">Other comparisons</p>
        <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2">
          {others.map((o) => (
            <A key={o.slug} to={`/compare/${o.slug}`} className="inline-flex items-center gap-1.5 font-semibold text-blue-700 hover:underline">
              {o.headline} <ArrowRight size={16} aria-hidden="true" />
            </A>
          ))}
          <A to="/pricing" className="inline-flex items-center gap-1.5 font-semibold text-blue-700 hover:underline">
            Integram pricing <ArrowRight size={16} aria-hidden="true" />
          </A>
        </div>
      </Section>

      <CtaBand title={`Try Integram with your ${c.name} data`} text="Export to CSV or Excel, upload, and see your tables linked in minutes. Free plan, no credit card." />
    </>
  )
}
