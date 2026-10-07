import { CompareBody, FormulasNote } from '../HowItWorks'
import { CASES, COMPARE_PAGE } from '../content'
import { SITE_BASE } from '../site-base'
import { StaticPage } from './StaticPage'

/**
 * Страница сравнения (issue #626, находка 2): «Excel → приложение vs Power
 * Apps» — отдельный запрос, которому на главной доставался общий title.
 *
 * Про чужие продукты здесь только общеизвестное и без цен: цены и состав
 * тарифов у них меняются, а страница живёт долго.
 */
export function ComparePage() {
  return (
    <StaticPage
      breadcrumb={[{ href: SITE_BASE, title: 'Excel → приложение' }]}
      h1="Приложение из Excel: Интеграм, Power Apps, Quickbase и конструкторы"
      lead={COMPARE_PAGE.lead}
    >
      <section className="max-w-5xl mx-auto px-4 sm:px-6 py-4">
        <h2 className="text-2xl sm:text-3xl font-bold">Чем отличаются подходы</h2>
        <CompareBody />

        <h2 className="mt-12 text-2xl sm:text-3xl font-bold">
          Что именно получается из таблицы на выходе
        </h2>
        <p className="mt-3 text-slate-600 max-w-3xl leading-relaxed">
          Разница видна не в списке возможностей, а в собранных приложениях. Все четыре начинались
          с рабочих файлов Excel или Google-таблиц, и структура в каждом — своя, а не подогнанная
          под шаблон платформы.
        </p>
        <ul className="mt-6 grid gap-4 sm:grid-cols-2">
          {CASES.map(item => (
            <li key={item.slug} className="rounded-2xl border border-slate-200 p-5">
              <p className="text-sm font-semibold text-blue-600">{item.client}</p>
              <a
                href={`${SITE_BASE}keysy/${item.slug}/`}
                className="mt-1 block font-semibold hover:text-blue-600 hover:underline"
              >
                {item.industry}
              </a>
              <p className="mt-2 text-sm text-slate-500">{item.facts.join(' · ')}</p>
            </li>
          ))}
        </ul>

        <FormulasNote />
      </section>
    </StaticPage>
  )
}
