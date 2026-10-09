import { FAQ } from './content'

/**
 * Частые вопросы (issue #626).
 *
 * Два повода, помимо посетителя, которому проще найти ответ списком:
 *
 *   1. На странице почти не было заголовков-вопросов — одни метки вроде
 *      «КАК ЭТО ПРОИСХОДИТ». Модель, разбивающая запрос на уточняющие
 *      подвопросы, цепляется за вопрос с коротким самодостаточным ответом.
 *   2. Из этого же массива `vite.config.ts` собирает JSON-LD `FAQPage`, а
 *      сборка — `/llms.txt`. Разметка и текст на странице гарантированно
 *      совпадают, потому что источник один.
 *
 * Раскрывающихся блоков здесь нет намеренно: содержимое <details> видно
 * краулеру, но прятать текст, ради которого страницу и открыли, незачем —
 * ровно на этом погорела карусель кейсов.
 */
export function Faq({
  items = FAQ,
  id = 'voprosy',
  title = 'Частые вопросы',
}: {
  /** Свои вопросы страницы — у кейсов (issue #738); по умолчанию — вопросы главной. */
  items?: readonly { q: string; a: string }[]
  id?: string
  title?: string
} = {}) {
  return (
    <section id={id} className="scroll-mt-16 bg-gradient-to-b from-slate-50 to-blue-50/50 border-y border-slate-200">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">{title}</h2>
        <div className="mt-8 grid gap-6 sm:grid-cols-2">
          {items.map(({ q, a }) => (
            <div key={q} className="rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-indigo-300 hover:shadow-lg hover:shadow-indigo-500/10">
              <h3 className="font-semibold">{q}</h3>
              <p className="mt-2 text-slate-600 leading-relaxed text-sm">{a}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
