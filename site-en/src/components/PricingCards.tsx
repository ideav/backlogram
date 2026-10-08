import { Check } from 'lucide-react'
import { PLANS } from '../data/pricing'
import { A } from './ui'

export function PricingCards({ compact = false }: { compact?: boolean }) {
  return (
    <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
      {PLANS.map((plan) => (
        <div
          key={plan.id}
          className={`relative flex flex-col rounded-2xl border bg-white p-7 ${
            plan.highlight ? 'border-blue-600 shadow-lg shadow-blue-600/10 ring-1 ring-blue-600' : 'border-slate-200'
          }`}
        >
          {plan.highlight && (
            <span className="absolute -top-3 left-7 rounded-full bg-blue-600 px-3 py-1 text-xs font-semibold text-white">
              Most teams start here
            </span>
          )}
          <h3 className="text-lg font-semibold text-slate-900">{plan.name}</h3>
          <p className="mt-1 text-sm text-slate-500">{plan.tagline}</p>
          <p className="mt-5 flex items-baseline gap-2">
            <span className="text-4xl font-bold tracking-tight text-slate-900">{plan.price}</span>
            <span className="text-sm text-slate-500">{plan.period}</span>
          </p>
          <ul className="mt-4 space-y-1 text-sm font-medium text-slate-800">
            <li>{plan.users}</li>
            <li>{plan.actions}</li>
          </ul>
          {!compact && (
            <ul className="mt-5 space-y-2.5 border-t border-slate-100 pt-5 text-sm text-slate-600">
              {plan.features.map((f) => (
                <li key={f} className="flex gap-2.5">
                  <Check size={16} aria-hidden="true" className="mt-0.5 shrink-0 text-blue-600" />
                  {f}
                </li>
              ))}
            </ul>
          )}
          <div className="mt-auto pt-7">
            <A
              to={plan.cta.href}
              className={`block rounded-lg px-4 py-3 text-center font-semibold transition-colors ${
                plan.highlight
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'border border-slate-300 text-slate-900 hover:bg-slate-50'
              }`}
            >
              {plan.cta.label}
            </A>
          </div>
        </div>
      ))}
    </div>
  )
}
