import { useRef, useState, type KeyboardEvent, type PointerEvent } from 'react'
import { ArrowRight, ChevronLeft, ChevronRight, FileSpreadsheet, LayoutDashboard, ZoomIn } from 'lucide-react'
import { CASES, type Case, type Shot } from './content'
import { SITE_BASE } from './site-base'

export type { Shot } from './content'

const SWIPE_PX = 50

function Column({ tone, title, items }: { tone: 'before' | 'after'; title: string; items: string[] }) {
  const before = tone === 'before'
  const Icon = before ? FileSpreadsheet : LayoutDashboard
  return (
    <div className={`rounded-2xl p-5 sm:p-6 ${before ? 'bg-slate-100' : 'bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-500/20'}`}>
      <h4
        className={`flex items-center gap-2 text-sm font-bold uppercase tracking-wide ${
          before ? 'text-slate-500' : 'text-emerald-700'
        }`}
      >
        <Icon size={18} /> {title}
      </h4>
      <ul className="mt-4 space-y-3">
        {items.map(item => (
          <li key={item} className={`text-sm leading-relaxed ${before ? 'text-slate-600' : 'text-slate-800'}`}>
            {item}
          </li>
        ))}
      </ul>
    </div>
  )
}

/**
 * Один кейс целиком. Используется и в слайдере, и на отдельной странице
 * кейса (`pages/CasePage.tsx`) — чтобы содержимое не разъехалось.
 */
export function CaseBody({ item, onZoom }: { item: Case; onZoom?: (shot: Shot) => void }) {
  return (
    <>
      <div className="mt-6 grid gap-4 md:grid-cols-[1fr_auto_1fr] md:items-stretch">
        <Column tone="before" title="Было" items={item.before} />
        <div className="flex items-center justify-center text-blue-600">
          <ArrowRight size={28} className="rotate-90 md:rotate-0" />
        </div>
        <Column tone="after" title="Стало" items={item.after} />
      </div>

      {item.screens && (
        <div className="mt-6">
          <div className="grid gap-3 grid-cols-3">
            {item.screens.map(shot =>
              onZoom ? (
                <button
                  key={shot.src}
                  type="button"
                  onClick={() => onZoom(shot)}
                  aria-label={`Открыть в полный размер: ${shot.caption}`}
                  className="group relative block rounded-xl border border-slate-200 overflow-hidden cursor-zoom-in focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
                >
                  <img src={SITE_BASE + shot.src} alt={shot.alt} loading="lazy" className="w-full h-24 sm:h-32 object-cover object-left-top" />
                  <span className="absolute top-1.5 right-1.5 p-1 rounded-md bg-slate-900/55 text-white group-hover:bg-slate-900/75 transition-colors">
                    <ZoomIn size={14} />
                  </span>
                </button>
              ) : (
                <figure key={shot.src} className="rounded-xl border border-slate-200 overflow-hidden">
                  <img src={SITE_BASE + shot.src} alt={shot.alt} loading="lazy" className="w-full h-24 sm:h-32 object-cover object-left-top" />
                  <figcaption className="px-2 py-1.5 text-xs text-slate-500">{shot.caption}</figcaption>
                </figure>
              ),
            )}
          </div>
          <p className="mt-2 text-xs text-slate-400">Экраны сняты на демо-данных: клиенты, суммы и логотип заменены.</p>
        </div>
      )}

      <ul className="mt-6 flex flex-wrap gap-2">
        {item.facts.map(fact => (
          <li key={fact} className="px-3 py-1 rounded-full bg-slate-100 text-xs font-medium text-slate-600">
            {fact}
          </li>
        ))}
      </ul>
    </>
  )
}

/**
 * Слайдер «было → стало»: стрелки, точки, свайп и клавиши ←/→.
 *
 * Все четыре кейса лежат в разметке всегда, скрытые — через `hidden`
 * (issue #626). Раньше в DOM попадал только открытый слайд: три кейса из
 * четырёх — самый содержательный материал сайта — для краулера, который не
 * листает карусель, не существовали вовсе. Каждый кейс дублируется отдельной
 * страницей `/keysy/<slug>/`, ссылка на неё — внизу слайда.
 */
export function Cases({ onZoom }: { onZoom: (shot: Shot) => void }) {
  const [index, setIndex] = useState(0)
  const startX = useRef<number | null>(null)
  const current = CASES[index]
  const go = (next: number) => setIndex((next + CASES.length) % CASES.length)

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>): void {
    if (event.key === 'ArrowLeft') go(index - 1)
    if (event.key === 'ArrowRight') go(index + 1)
  }

  function onPointerUp(event: PointerEvent<HTMLDivElement>): void {
    if (startX.current === null) return
    const dx = event.clientX - startX.current
    startX.current = null
    if (Math.abs(dx) >= SWIPE_PX) go(dx < 0 ? index + 1 : index - 1)
  }

  const arrow =
    'p-2 rounded-full border border-slate-300 bg-white text-slate-600 hover:border-blue-500 hover:text-blue-600 transition-colors'

  return (
    <section id="keysy" className="scroll-mt-16 max-w-5xl mx-auto px-4 sm:px-6 py-12">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Было в Excel → <span className="text-gradient">стало приложением</span></h2>
          <p className="mt-3 text-slate-600 max-w-2xl">
            Реальные внедрения на Интеграме. Все начинались с таблиц.
          </p>
        </div>
        <div className="hidden sm:flex gap-2 shrink-0">
          <button type="button" aria-label="Предыдущий кейс" onClick={() => go(index - 1)} className={arrow}>
            <ChevronLeft size={20} />
          </button>
          <button type="button" aria-label="Следующий кейс" onClick={() => go(index + 1)} className={arrow}>
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      <div
        role="group"
        aria-roledescription="слайдер"
        aria-label={`Кейс ${index + 1} из ${CASES.length}: ${current.client}`}
        tabIndex={0}
        onKeyDown={onKeyDown}
        onPointerDown={event => {
          startX.current = event.clientX
        }}
        onPointerUp={onPointerUp}
        onPointerCancel={() => {
          startX.current = null
        }}
        className="mt-8 rounded-3xl border border-slate-200 bg-white p-5 sm:p-8 shadow-xl shadow-indigo-500/10 select-none touch-pan-y focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
      >
        {CASES.map((item, i) => (
          <article
            key={item.slug}
            className={i === index ? undefined : 'hidden'}
            aria-hidden={i === index ? undefined : true}
          >
            <p className="text-sm font-semibold text-violet-600">{item.client}</p>
            <h3 className="mt-1 text-xl sm:text-2xl font-bold">{item.industry}</h3>

            <CaseBody item={item} onZoom={onZoom} />

            <p className="mt-6">
              <a
                href={`${SITE_BASE}keysy/${item.slug}/`}
                className="inline-flex items-center gap-1 text-blue-600 font-medium hover:underline"
              >
                Кейс целиком: {item.client} <ArrowRight size={16} />
              </a>
            </p>
          </article>
        ))}
      </div>

      <div className="mt-5 flex items-center justify-center gap-3">
        <button type="button" aria-label="Предыдущий кейс" onClick={() => go(index - 1)} className={`sm:hidden ${arrow}`}>
          <ChevronLeft size={18} />
        </button>
        {CASES.map((c, i) => (
          <button
            key={c.client}
            type="button"
            aria-label={`Кейс: ${c.client}`}
            aria-current={i === index}
            onClick={() => setIndex(i)}
            className={`h-2.5 rounded-full transition-all ${i === index ? 'w-8 bg-brand' : 'w-2.5 bg-slate-300 hover:bg-slate-400'}`}
          />
        ))}
        <button type="button" aria-label="Следующий кейс" onClick={() => go(index + 1)} className={`sm:hidden ${arrow}`}>
          <ChevronRight size={18} />
        </button>
      </div>
    </section>
  )
}
