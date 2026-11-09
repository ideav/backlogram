import { useEffect, useRef, useState } from 'react'
import { Building2, Loader2, Search } from 'lucide-react'
import { reachGoal } from '../lib/metrika'
import { companyAge, innValid } from '../lib/innProfile'
import type { InnProfile } from '../lib/innProfile'

// Шаг «ИНН» перед калькулятором потерь (backlogram#913): форма и карточка
// найденного в открытых данных ФНС. Сам запрос — /inn-lookup.php.

const ERRORS: Record<string, string> = {
  invalid_inn: 'Проверьте ИНН: у компании 10 цифр, у ИП 12, и контрольная цифра должна сходиться.',
  rate_limited: 'Слишком много запросов подряд. Подождите несколько минут или впишите цифры в калькулятор сами.',
  source_unavailable: 'Сервис ФНС сейчас не ответил. Попробуйте ещё раз через минуту или впишите цифры сами.',
  network: 'Не удалось связаться с сервером. Проверьте соединение или впишите цифры сами.',
}

function innFromUrl(): string {
  try {
    return (new URLSearchParams(window.location.search).get('inn') ?? '').replace(/\D/g, '').slice(0, 12)
  } catch {
    return ''
  }
}

/** Запоминаем ИНН в адресе, чтобы расчётом можно было поделиться. */
function rememberInn(inn: string) {
  try {
    const url = new URL(window.location.href)
    url.searchParams.set('inn', inn)
    window.history.replaceState(window.history.state, '', url)
  } catch { /* нет history */ }
}

export function InnForm({ slug, onResult }: { slug: string; onResult: (p: InnProfile) => void }) {
  const [inn, setInn] = useState(innFromUrl)
  const [state, setState] = useState<'idle' | 'loading' | 'error'>('idle')
  const [error, setError] = useState('')
  const autorun = useRef(false)

  const lookup = async (value: string) => {
    const clean = value.replace(/\D/g, '')
    if (!innValid(clean)) {
      setState('error')
      setError(ERRORS.invalid_inn)
      return
    }
    setState('loading')
    setError('')
    reachGoal('inn_lookup', { page: slug })
    try {
      const res = await fetch(`/inn-lookup.php?inn=${clean}`, { headers: { Accept: 'application/json' } })
      const data = (await res.json()) as InnProfile
      if (!data.ok) {
        setState('error')
        setError(ERRORS[data.error ?? ''] ?? ERRORS.source_unavailable)
        return
      }
      setState('idle')
      rememberInn(clean)
      onResult(data)
    } catch {
      setState('error')
      setError(ERRORS.network)
    }
  }

  // Ссылка вида /ocenka-po-inn.html?inn=… сразу показывает расчёт.
  useEffect(() => {
    if (autorun.current || !innValid(inn)) return
    autorun.current = true
    void lookup(inn)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <form
      onSubmit={(e) => { e.preventDefault(); void lookup(inn) }}
      className="max-w-xl"
      noValidate
    >
      <label htmlFor="inn" className="block font-semibold mb-2">ИНН компании или ИП</label>
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          id="inn"
          name="inn"
          inputMode="numeric"
          autoComplete="off"
          maxLength={12}
          placeholder="10 или 12 цифр"
          value={inn}
          onChange={(e) => setInn(e.target.value.replace(/\D/g, '').slice(0, 12))}
          aria-invalid={state === 'error'}
          aria-describedby="inn-msg"
          className="flex-1 min-w-0 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 px-4 py-3 text-lg tabular-nums tracking-wider"
        />
        <button
          type="submit"
          disabled={state === 'loading'}
          className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-70 text-white font-bold rounded-xl shadow-lg shadow-blue-600/20 transition-all"
        >
          {state === 'loading' ? <Loader2 size={18} className="animate-spin" /> : <Search size={18} />}
          {state === 'loading' ? 'Ищем в ФНС…' : 'Посчитать'}
        </button>
      </div>
      <p id="inn-msg" className={`text-sm mt-2 ${state === 'error' ? 'text-red-600 dark:text-red-400' : 'text-slate-500 dark:text-slate-400'}`} aria-live="polite">
        {state === 'error' ? error : 'Данные — из открытого сервиса ФНС «Прозрачный бизнес». '}
        {state !== 'error' && <a href="#calc" className="text-blue-600 dark:text-blue-400 hover:underline">Ввести цифры вручную</a>}
      </p>
    </form>
  )
}

const fmtMln = (rub: number) =>
  (rub / 1e6).toLocaleString('ru-RU', { maximumFractionDigits: rub >= 1e8 ? 0 : 1 }).replace(/[\s  ]/g, ' ') + ' млн ₽'

const fmtDate = (iso: string) => iso.split('-').reverse().join('.')

function years(n: number): string {
  const m10 = n % 10
  const m100 = n % 100
  if (m10 === 1 && m100 !== 11) return `${n} год`
  if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return `${n} года`
  return `${n} лет`
}

export function CompanyCard({ p }: { p: InnProfile }) {
  if (!p.found) {
    return (
      <div className="mb-6 p-5 rounded-2xl border border-amber-300/60 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800/60 text-sm">
        По ИНН {p.inn} в открытых данных ФНС ничего не нашлось. Впишите выручку и численность в калькулятор сами.
      </div>
    )
  }
  const age = companyAge(p.regDate)
  const rows: [string, string][] = []
  if (p.regDate) rows.push(['Зарегистрирована', `${fmtDate(p.regDate)}${age !== null ? ` · ${age > 0 ? years(age) : 'меньше года'}` : ''}`])
  if (p.okvedName) rows.push(['Основной вид деятельности', `${p.okved} ${p.okvedName}`])
  if (p.revenue) rows.push([`Выручка за ${p.revenue.year} год`, fmtMln(p.revenue.rub)])
  if (p.expense) rows.push([`Расходы за ${p.expense.year} год`, fmtMln(p.expense.rub)])
  if (p.employees) rows.push([`Сотрудников в ${p.employees.year} году`, `${p.employees.n} чел.`])
  if (p.contributions) rows.push([`Страховые взносы за ${p.contributions.year} год`, fmtMln(p.contributions.rub)])
  const missing = !p.revenue || !p.employees

  return (
    <div className="mb-6 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40" data-inn-card>
      <div className="flex items-start gap-3 mb-3">
        <Building2 size={20} className="text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
        <div>
          <p className="font-bold">{p.name}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">ИНН {p.inn}{p.region ? ` · ${p.region}` : ''}{p.active === false ? ' · не действует' : ''}</p>
        </div>
      </div>
      {rows.length > 0 && (
        <dl className="grid gap-x-6 gap-y-1.5 sm:grid-cols-2 text-sm">
          {rows.map(([k, v]) => (
            <div key={k} className="flex justify-between gap-3 border-b border-slate-200/70 dark:border-slate-800/70 py-1">
              <dt className="text-slate-500 dark:text-slate-400">{k}</dt>
              <dd className="font-semibold tabular-nums text-right">{v}</dd>
            </div>
          ))}
        </dl>
      )}
      <p className="text-xs text-slate-500 dark:text-slate-400 mt-3">
        {missing ? 'Выручку или численность ФНС не раскрывает — впишите их в калькулятор сами. ' : 'Цифры уже подставлены в калькулятор, их можно поправить. '}
        Источник: {p.source}{p.boUrl && <>, <a href={p.boUrl} target="_blank" rel="noopener noreferrer" className="hover:underline">отчётность в ГИР БО</a></>}.
      </p>
    </div>
  )
}
