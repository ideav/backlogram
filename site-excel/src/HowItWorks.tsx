import {
  ArrowRight,
  CheckCircle2,
  GitBranch,
  LayoutDashboard,
  ListTree,
  Minus,
  Sigma,
  UserCheck,
  type LucideIcon,
} from 'lucide-react'
import { BLOG_POST_URL, COMPARE, COMPARE_PAGE, FORMULAS, OURS, READING } from './content'
import { SITE_BASE } from './site-base'

// Тексты обоих блоков живут в content.ts: их же читают отдельная страница
// сравнения и /llms.txt. Здесь остаётся только разметка.

const ICONS: Record<string, LucideIcon> = { ListTree, GitBranch, LayoutDashboard, UserCheck }

// Плитки иконок по кругу — чтобы четыре одинаковые карточки не сливались (issue #643).
const TONES = [
  'from-blue-500 to-indigo-500 shadow-blue-500/30',
  'from-violet-500 to-fuchsia-500 shadow-violet-500/30',
  'from-emerald-500 to-teal-500 shadow-emerald-500/30',
  'from-amber-400 to-orange-500 shadow-amber-500/30',
]

/** Сравнение с Power Apps / Quickbase / Glide — и то же на `/sravnenie-power-apps/`. */
export function CompareBody() {
  return (
    <div className="mt-8 grid gap-6 lg:grid-cols-2">
      <div className="space-y-4">
        {COMPARE.map(({ name, their }) => (
          <div key={name} className="flex gap-3">
            <Minus size={20} className="text-slate-400 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold">{name}</h3>
              <p className="mt-1 text-slate-600 leading-relaxed text-sm">{their}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="rounded-2xl p-[2px] bg-brand shadow-xl shadow-indigo-500/15">
        <div className="h-full rounded-[calc(1rem-2px)] bg-white p-6">
        <h3 className="font-extrabold text-gradient">Интеграм</h3>
        <ul className="mt-4 space-y-3">
          {OURS.map(item => (
            <li key={item} className="flex items-start gap-3 text-sm text-slate-700">
              <CheckCircle2 size={18} className="text-emerald-500 shrink-0 mt-px" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
        </div>
      </div>
    </div>
  )
}

/** Формулы и макросы как преимущество (issue #655) — и то же на странице сравнения. */
export function FormulasNote() {
  return (
    <div className="mt-8 flex gap-4 rounded-2xl border border-emerald-200 bg-emerald-50/60 p-5">
      <span className="shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-md shadow-emerald-500/30 flex items-center justify-center">
        <Sigma size={20} />
      </span>
      <div>
        <h3 className="font-semibold">{FORMULAS.title}</h3>
        <p className="mt-1 text-slate-600 leading-relaxed text-sm">{FORMULAS.body}</p>
        <a
          href={BLOG_POST_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 inline-flex items-center gap-1 text-sm text-blue-600 hover:underline"
        >
          Подробно о том, как агент читает таблицу <ArrowRight size={14} />
        </a>
      </div>
    </div>
  )
}

export function HowItWorks() {
  return (
    <>
      <section id="kak" className="scroll-mt-16 bg-gradient-to-b from-slate-50 to-violet-50/50 border-y border-slate-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Как агент читает вашу структуру</h2>
          <p className="mt-3 text-slate-600 max-w-2xl">
            Не «нейросеть угадывает по заголовкам». Excel для агента — снимок того, как уже устроен
            ваш бизнес. Модель данных строится из того, что в нём реально лежит.
          </p>
          <div className="mt-8 grid gap-6 sm:grid-cols-2">
            {READING.map(({ icon, title, body }, i) => {
              const Icon = ICONS[icon]
              return (
                <div key={title} className="flex gap-4 rounded-2xl border border-slate-200 bg-white p-5 transition duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-indigo-500/10">
                  <span className={`shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br text-white shadow-md flex items-center justify-center ${TONES[i % TONES.length]}`}>
                    <Icon size={20} />
                  </span>
                  <div>
                    <h3 className="font-semibold">{title}</h3>
                    <p className="mt-1 text-slate-600 leading-relaxed text-sm">{body}</p>
                  </div>
                </div>
              )
            })}
          </div>
          <FormulasNote />
        </div>
      </section>

      <section id="sravnenie" className="scroll-mt-16 max-w-5xl mx-auto px-4 sm:px-6 py-12">
        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">А Power Apps или Quickbase?</h2>
        <p className="mt-3 text-slate-600 max-w-2xl">
          Сделать приложение из таблицы умеют и они. Разница в том, чья структура получится на
          выходе и где будут жить данные.
        </p>
        <CompareBody />
        <p className="mt-6 text-sm">
          <a
            href={`${SITE_BASE}${COMPARE_PAGE.slug}/`}
            className="inline-flex items-center gap-1 text-blue-600 font-medium hover:underline"
          >
            Сравнение отдельной страницей <ArrowRight size={14} />
          </a>
        </p>
      </section>
    </>
  )
}
