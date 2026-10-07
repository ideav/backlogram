import {
  ArrowRight,
  CheckCircle2,
  Cloud,
  Code2,
  FileSearch,
  Package,
  Rocket,
  Server,
  Settings,
  Star,
  type LucideIcon,
} from 'lucide-react'
import { PRICING_GROUPS, type Plan } from './content'

// Сами цены живут в content.ts: оттуда их берут и карточки ниже, и
// `/pricing.md` с `/llms.txt`, которые собираются при сборке (issue #626).
// Здесь остаётся разметка и сопоставление имён иконок с компонентами.

const ICONS: Record<string, LucideIcon> = {
  Cloud,
  Code2,
  FileSearch,
  Package,
  Rocket,
  Server,
  Settings,
}

function PlanCard({ plan, onOrder }: { plan: Plan; onOrder: (plan: string) => void }) {
  const Icon = ICONS[plan.icon]
  const button = `mt-6 w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-semibold transition-colors ${
    plan.accent ? 'bg-brand text-white shadow-lg shadow-indigo-500/30 hover:brightness-110' : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700'
  }`
  return (
    <div
      className={`relative flex flex-col rounded-2xl bg-white p-6 transition duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-indigo-500/10 ${
        plan.accent && plan.badge ? 'border-2 border-violet-500 shadow-xl shadow-violet-500/15' : 'border border-slate-200 shadow-sm'
      }`}
    >
      {plan.badge && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 inline-flex items-center gap-1 px-3 py-1 rounded-full bg-brand text-white text-xs font-bold uppercase tracking-wide shadow-md shadow-violet-500/30">
          <Star size={12} fill="currentColor" /> {plan.badge}
        </span>
      )}
      <div className="flex gap-4">
        <span className="shrink-0 w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-violet-500 text-white shadow-md shadow-indigo-500/30 flex items-center justify-center">
          <Icon size={22} />
        </span>
        <div>
          <h4 className="font-bold leading-snug">{plan.title}</h4>
          <p className="mt-1 text-sm text-slate-500 leading-relaxed">{plan.sub}</p>
        </div>
      </div>
      <p className="mt-5 text-3xl font-extrabold tracking-tight">
        {plan.price} <span className="text-lg font-semibold text-slate-400">₽ {plan.unit ?? ''}</span>
      </p>
      <ul className="mt-4 space-y-2 flex-1">
        {plan.items.map(item => (
          <li key={item} className="flex items-start gap-2 text-sm text-slate-700">
            <CheckCircle2 size={18} className="text-emerald-500 shrink-0 mt-px" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
      {plan.href ? (
        <a href={plan.href} target="_blank" rel="noopener noreferrer" className={button}>
          {plan.cta} <ArrowRight size={18} />
        </a>
      ) : (
        <button type="button" onClick={() => onOrder(plan.title)} className={button}>
          {plan.cta} <ArrowRight size={18} />
        </button>
      )}
    </div>
  )
}

/**
 * Цены на виду, без клика (критика в issue #613: «клиент не понимает, сколько
 * это стоит»). Кнопки карточек открывают модальную заявку на экспресс-разработку
 * с названием выбранной карточки (issue #619). Сама кнопка целей не шлёт: цель
 * `express_lead` уходит только после принятой заявки, см. conversion.ts.
 */
export function Pricing({ onOrder }: { onOrder: (plan: string) => void }) {
  return (
    <section id="ceny" className="scroll-mt-16 max-w-6xl mx-auto px-4 sm:px-6 py-12 space-y-6">
      <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Сколько стоит</h2>
      <p className="text-slate-600 max-w-2xl">
        Демонстрация на ваших файлах — бесплатно. Дальше — по шагам: каждый заканчивается
        результатом, который остаётся у вас.
      </p>
      {PRICING_GROUPS.map(({ icon, tag, title, lead, body, plans }) => {
        const Icon = ICONS[icon]
        return (
          <div
            key={title}
            className="rounded-3xl border border-indigo-100 bg-gradient-to-br from-slate-50 via-white to-indigo-50/60 p-5 sm:p-8 grid gap-6 lg:grid-cols-[1fr_2fr] lg:items-start"
          >
            <div>
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-100 text-violet-700 text-xs font-bold uppercase tracking-wider">
                <Icon size={14} /> {tag}
              </span>
              <h3 className="mt-4 text-2xl sm:text-3xl font-extrabold tracking-tight">{title}</h3>
              <p className="mt-2 text-lg text-slate-600">{lead}</p>
              <p className="mt-3 text-sm text-slate-500 leading-relaxed">{body}</p>
            </div>
            <div className={`grid gap-6 ${plans.length > 1 ? 'sm:grid-cols-2' : ''}`}>
              {plans.map(plan => (
                <PlanCard key={plan.title} plan={plan} onOrder={onOrder} />
              ))}
            </div>
          </div>
        )
      })}
    </section>
  )
}
