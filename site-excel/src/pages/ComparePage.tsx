import { CompareBody, FormulasNote } from '../HowItWorks'
import { CASES, COMPARE_PAGE, COMPARE_TABLE } from '../content'
import { SITE_BASE } from '../site-base'
import { StaticPage } from './StaticPage'

/**
 * Страница сравнения (issue #626, находка 2): «Excel → приложение vs Power
 * Apps» — отдельный запрос, которому на главной доставался общий title.
 *
 * Про чужие продукты здесь только общеизвестное и без цен: цены и состав
 * тарифов у них меняются, а страница живёт долго.
 *
 * Таблица (issue #738) — тот же смысл построчно: её ИИ-ответы на «чем
 * отличается» цитируют охотнее, чем карточки.
 */
export function ComparePage() {
  return (
    <StaticPage
      breadcrumb={[{ href: SITE_BASE, title: 'Excel → приложение' }]}
      h1="Приложение из Excel: Интеграм, Power Apps, Quickbase и конструкторы"
      lead={COMPARE_PAGE.lead}
      dates={COMPARE_PAGE}
    >
      <section className="max-w-5xl mx-auto px-4 sm:px-6 py-4">
        <h2 className="text-2xl sm:text-3xl font-bold">Чем отличаются подходы</h2>
        <CompareBody />

        <h2 className="mt-12 text-2xl sm:text-3xl font-bold">Сравнение по пунктам</h2>
        <div className="mt-6 overflow-x-auto rounded-2xl border border-slate-200">
          <table className="w-full min-w-[44rem] text-sm text-left">
            <caption className="sr-only">
              Приложение из Excel: Интеграм, Power Apps, Quickbase и конструкторы Glide, Softr, Adalo
            </caption>
            <thead className="bg-slate-50 text-slate-900">
              <tr>
                <th scope="col" className="p-3 font-semibold">Что сравниваем</th>
                {COMPARE_TABLE.columns.map((name, i) => (
                  <th key={name} scope="col" className={`p-3 font-semibold ${i === 0 ? 'text-blue-700' : ''}`}>
                    {name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {COMPARE_TABLE.rows.map(row => (
                <tr key={row.feature} className="border-t border-slate-200 align-top">
                  <th scope="row" className="p-3 font-medium text-slate-900">{row.feature}</th>
                  {row.values.map((value, i) => (
                    <td key={COMPARE_TABLE.columns[i]} className={`p-3 ${i === 0 ? 'bg-blue-50/60 text-slate-900' : 'text-slate-600'}`}>
                      {value}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

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
