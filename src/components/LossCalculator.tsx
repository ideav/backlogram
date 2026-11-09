import { useMemo, useState } from 'react'
import { ArrowRight, ChevronDown } from 'lucide-react'
import { reachGoal } from '../lib/metrika'
import { computeLoss, formatPct, formatRub } from '../lib/lossCalc'
import { LOSS_CALC_NOTE, LOSS_CTA_URL, LOSS_DEFAULT_CTA, LOSS_DEFAULT_RESULT_LABEL, LOSS_EMAIL, LOSS_PHONE } from '../data/lossLandings'
import type { LossCalc, LossField } from '../data/lossLandings'

// Цвета долей — от тёмного к светлому, как «вес» статьи потерь.
const BAR_COLORS = ['bg-blue-700', 'bg-blue-500', 'bg-blue-300', 'bg-blue-200']

/**
 * Начальные значения: по умолчанию из данных, поверх — `?id=значение` из адреса,
 * поверх — `preset` (данные ФНС по ИНН, backlogram#913).
 */
function initialValues(calc: LossCalc, preset?: Record<string, number>): Record<string, string> {
  const out: Record<string, string> = {}
  let q: URLSearchParams | null = null
  try { q = new URLSearchParams(window.location.search) } catch { /* нет window */ }
  for (const f of [...calc.fields, ...calc.assumptions]) {
    const raw = q?.get(f.id)
    const ok = raw !== null && raw !== undefined && raw !== '' && Number.isFinite(Number(raw.replace(',', '.')))
    out[f.id] = ok ? raw.replace(',', '.') : String(f.value)
    if (preset && preset[f.id] !== undefined) out[f.id] = String(preset[f.id])
  }
  return out
}

function NumberInput({ f, value, onChange, large }: { f: LossField; value: string; onChange: (id: string, v: string) => void; large?: boolean }) {
  return (
    <input
      id={f.id}
      type="number"
      min={0}
      step={f.step ?? 1}
      inputMode="decimal"
      value={value}
      onChange={(e) => onChange(f.id, e.target.value)}
      className={`w-full min-w-0 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 px-3 py-2 ${large ? 'text-lg' : 'text-sm'}`}
    />
  )
}

export default function LossCalculator({ calc, slug, preset, sources }: {
  calc: LossCalc
  slug: string
  /** Значения полей, подставленные из внешних данных (ИНН). Сменить — перемонтировать через key. */
  preset?: Record<string, number>
  /** Откуда взято значение поля: показывается под полем. */
  sources?: Record<string, string>
}) {
  const [values, setValues] = useState(() => initialValues(calc, preset))
  const set = (id: string, v: string) => setValues((s) => ({ ...s, [id]: v }))
  const r = useMemo(() => computeLoss(calc, values), [calc, values])
  const cta = calc.ctaText ?? LOSS_DEFAULT_CTA
  const onCta = () => reachGoal(calc.goal, { page: slug })

  return (
    <div>
      <div className="grid gap-6 md:grid-cols-2 items-start">
        <div className="p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-sm dark:shadow-none">
          {calc.fields.map((f) => (
            <div key={f.id} className="mb-5">
              <label htmlFor={f.id} className="block font-semibold mb-1.5">{f.label}</label>
              <div className="flex items-center gap-2">
                <NumberInput f={f} value={values[f.id]} onChange={set} large />
                {f.unit && <span className="text-sm text-slate-500 dark:text-slate-400 whitespace-nowrap">{f.unit}</span>}
              </div>
              {sources?.[f.id] && <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-1">{sources[f.id]}</p>}
              {f.hint && <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{f.hint}</p>}
            </div>
          ))}
          <details className="group border-t border-slate-200 dark:border-slate-800 pt-4">
            <summary className="flex items-center gap-1.5 cursor-pointer font-semibold text-blue-600 dark:text-blue-400 list-none">
              <ChevronDown size={16} className="transition-transform group-open:rotate-180" /> Допущения расчёта
            </summary>
            <div className="mt-4 space-y-3">
              {calc.assumptions.map((f) => (
                <div key={f.id} className="grid gap-1.5 sm:grid-cols-[1fr_7rem] sm:items-center">
                  <label htmlFor={f.id} className="text-sm text-slate-600 dark:text-slate-300">
                    {f.label}
                    {sources?.[f.id] && <span className="block text-xs text-emerald-700 dark:text-emerald-400">{sources[f.id]}</span>}
                  </label>
                  <NumberInput f={f} value={values[f.id]} onChange={set} />
                </div>
              ))}
            </div>
            <div className="mt-4 space-y-1.5 text-xs text-slate-500 dark:text-slate-400">
              {calc.parts.map((p) => (
                <p key={p.label}><b className="font-semibold">{p.label}</b> = {p.text}</p>
              ))}
            </div>
          </details>
        </div>

        <div className="p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-sm dark:shadow-none md:sticky md:top-24" aria-live="polite">
          <p className="text-sm text-slate-500 dark:text-slate-400">{calc.resultLabel ?? LOSS_DEFAULT_RESULT_LABEL}</p>
          <div data-loss-total className="text-4xl md:text-5xl font-extrabold text-blue-600 dark:text-blue-400 tabular-nums leading-tight my-1.5">{formatRub(r.total)}</div>
          <p data-loss-sub className="text-sm text-slate-500 dark:text-slate-400 mb-4">
            {r.share !== null ? `${formatPct(r.share)} ${calc.baseLabel ?? ''} · ` : ''}{formatRub(r.perMonth)} в месяц
          </p>
          <div className="flex h-3 rounded-full overflow-hidden bg-slate-200 dark:bg-slate-800 mb-4" aria-hidden="true">
            {r.parts.map((p, i) => (
              <i key={i} className={`block h-full ${BAR_COLORS[i] ?? 'bg-blue-100'}`} style={{ width: r.total > 0 ? `${(p / r.total) * 100}%` : 0 }} />
            ))}
          </div>
          <ul className="space-y-2 mb-6 text-sm">
            {calc.parts.map((p, i) => (
              <li key={p.label} className="flex items-start gap-2">
                <span className={`mt-1.5 w-2.5 h-2.5 rounded-full shrink-0 ${BAR_COLORS[i] ?? 'bg-blue-100'}`} />
                <span className="flex-1 text-slate-600 dark:text-slate-300">{p.label}</span>
                <b className="tabular-nums whitespace-nowrap">{formatRub(r.parts[i])}</b>
              </li>
            ))}
          </ul>
          <a href={LOSS_CTA_URL} onClick={onCta} className="inline-flex w-full items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-600/20 transition-all">
            {cta} <ArrowRight size={18} />
          </a>
          <p className="text-sm text-slate-500 dark:text-slate-400 text-center mt-3">
            <a href={LOSS_PHONE.href} className="hover:underline">{LOSS_PHONE.text}</a> · <a href={`mailto:${LOSS_EMAIL}`} className="hover:underline">{LOSS_EMAIL}</a>
          </p>
        </div>
      </div>
      <p className="text-xs text-slate-500 dark:text-slate-400 mt-4">{LOSS_CALC_NOTE}</p>
    </div>
  )
}

