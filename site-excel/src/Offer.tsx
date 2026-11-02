import type { ReactNode } from 'react'
import { CheckCircle2 } from 'lucide-react'

/**
 * Блок оффера первого экрана (issue #835): что человек получит, сколько это
 * стоит и одна главная кнопка. Стоит сразу под H1, чтобы на экране телефона
 * (~375 px) цена и кнопка были видны без прокрутки. Кнопку передаёт страница:
 * на каждой она своя (ссылка на форму главной, открытие формы, запись).
 */
export function OfferCard({
  title,
  bullets,
  price,
  children,
  footnote,
}: {
  title?: string
  bullets: string[]
  /** Строка цены — реальные цены сайта, см. OFFER_PRICE_LINE в content.ts. */
  price: ReactNode
  children: ReactNode
  footnote?: string
}) {
  return (
    <div data-offer="" className="mt-5 max-w-2xl rounded-2xl border border-indigo-200 bg-white/90 p-4 sm:p-6 shadow-lg shadow-indigo-500/10">
      {title && <p className="text-lg sm:text-xl font-bold leading-snug text-slate-900">{title}</p>}
      <ul className={`${title ? 'mt-3' : ''} space-y-1.5`}>
        {bullets.map(item => (
          <li key={item} className="flex items-start gap-2 text-sm sm:text-base text-slate-800">
            <CheckCircle2 size={18} aria-hidden="true" className="text-emerald-500 shrink-0 mt-0.5" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
      <p data-offer-price="" className="mt-3 text-sm sm:text-base font-semibold text-slate-900">{price}</p>
      <div className="mt-4 flex flex-wrap items-center gap-3">{children}</div>
      {footnote && <p className="mt-3 text-xs sm:text-sm text-slate-600">{footnote}</p>}
    </div>
  )
}
