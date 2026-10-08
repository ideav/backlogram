import { Wrench } from 'lucide-react'
import { Button, CtaBand, Eyebrow, Faq, H2, Lead, Section } from '../components/ui'
import { PricingCards } from '../components/PricingCards'
import { ACTION_EXAMPLES, DONE_FOR_YOU, EXTRA_PACK } from '../data/pricing'
import { PRICING_FAQ } from '../data/faq'

export default function Pricing() {
  return (
    <>
      <Section className="border-b border-slate-200">
        <div className="mx-auto max-w-3xl text-center">
          <Eyebrow>Pricing</Eyebrow>
          <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
            Pay for the work the app does, not for every login
          </h1>
          <Lead>
            One flat monthly price per workspace, with a generous allowance of actions. Invite the whole team, including
            the people who only look at a report once a week.
          </Lead>
        </div>
        <div className="mt-14">
          <PricingCards />
        </div>
        <p className="mt-6 text-center text-sm text-slate-500">
          Prices in US dollars, excluding applicable taxes. {EXTRA_PACK} on any paid plan.
        </p>
      </Section>

      <Section muted>
        <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <Eyebrow>How actions work</Eyebrow>
            <H2>One action is one thing the app does for you</H2>
            <Lead>
              Opening a table, saving a record or running a report is one action, whether a person does it in the
              browser or your agent does it through the API. Heavy jobs count as more.
            </Lead>
            <p className="mt-4 leading-relaxed text-slate-600">
              Why “actions” and not “tokens”? Because if you work with AI, a token already means something else. An
              action has nothing to do with LLM usage: your agent’s model is billed by its own provider.
            </p>
          </div>
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
            <table className="w-full text-left">
              <caption className="sr-only">Examples of action costs</caption>
              <thead className="bg-slate-50 text-sm">
                <tr>
                  <th scope="col" className="px-5 py-3.5 font-semibold text-slate-700">Operation</th>
                  <th scope="col" className="px-5 py-3.5 font-semibold text-slate-700">Cost</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {ACTION_EXAMPLES.map(([op, cost]) => (
                  <tr key={op}>
                    <td className="px-5 py-3.5 text-slate-700">{op}</td>
                    <td className="whitespace-nowrap px-5 py-3.5 font-medium text-slate-900">{cost}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="border-t border-slate-200 bg-blue-50 px-5 py-4 text-sm leading-relaxed text-slate-700">
              <strong className="text-slate-900">Worked example.</strong> A planner doing 20 operations an hour, 6.5 hours a
              day, 22 working days a month uses about 2,860 actions. That fits the free plan.
            </div>
          </div>
        </div>
      </Section>

      <Section>
        <div className="flex flex-col items-start gap-6 rounded-2xl border border-slate-200 p-8 sm:flex-row sm:items-center sm:justify-between sm:p-10">
          <div className="flex gap-5">
            <Wrench size={28} aria-hidden="true" className="mt-1 shrink-0 text-blue-600" />
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-slate-900">{DONE_FOR_YOU.title}</h2>
              <p className="mt-2 max-w-2xl leading-relaxed text-slate-600">{DONE_FOR_YOU.text}</p>
              <p className="mt-3 font-semibold text-slate-900">{DONE_FOR_YOU.price}</p>
            </div>
          </div>
          <Button to="/contact" arrow>
            Book a demo
          </Button>
        </div>
      </Section>

      <Section muted>
        <Faq items={PRICING_FAQ} title="Pricing questions" />
      </Section>

      <CtaBand title="Start on the free plan today" />
    </>
  )
}
