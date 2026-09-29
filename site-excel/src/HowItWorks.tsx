import { ArrowRight, CheckCircle2, GitBranch, LayoutDashboard, ListTree, Minus, UserCheck } from 'lucide-react'

// Оба блока закрывают вопросы из критики в issue #613: «как именно вы читаете
// структуру» и «чем это отличается от Power Apps / Quickbase». Тексты — сжатие
// статьи в блоге, на неё же ведёт ссылка; утверждения о чужих продуктах — только
// общеизвестные, без цен и цифр, которые быстро устаревают.

const BLOG_POST_URL =
  'https://ideav.ru/blog/posts/excel-v-prilozhenie-za-45-minut-kak-rabotaet-ii-agent-integrama/'

const READING = [
  {
    icon: ListTree,
    title: 'Сущности и поля — из содержимого, а не из названий листов',
    body: 'Агент смотрит на колонки, повторяющиеся значения, статусы, даты и суммы. Так появляются «Заказ», «Клиент», «Партия», а у каждого поля — тип: число, дата, статус, файл или ссылка.',
  },
  {
    icon: GitBranch,
    title: 'Связи — по совпадающим колонкам в разных файлах',
    body: 'Один клиент — много заказов, один заказ — много позиций. Для каждой связи выбирается тип: ссылка на справочник или подчинённая таблица. От этого зависят отчёты и права.',
  },
  {
    icon: LayoutDashboard,
    title: 'Рабочие места — из типовых для вашей отрасли',
    body: 'Журнал заказов, карточка, экран оператора, сводка руководителя. Каждой роли — свои данные и свой экран.',
  },
  {
    icon: UserCheck,
    title: 'Человек проверяет, а не проектирует с нуля',
    body: 'Из 45 минут агенту нужны 10–15. Остальное время оператор Интеграма проверяет типы связей и роли и убирает явные нелепости.',
  },
]

const COMPARE = [
  {
    name: 'Microsoft Power Apps',
    their: 'Таблицы создаются в Dataverse, приложение живёт внутри Power Platform. Официально в России не продаётся.',
  },
  {
    name: 'Quickbase',
    their: 'Импорт Excel с ИИ, но это корпоративная платформа с долгим внедрением и оплатой в валюте.',
  },
  {
    name: 'Glide, Softr, Adalo',
    their: 'Быстрое приложение из Google Sheets по шаблону. Ролей, прав на уровне записей и сложных запросов почти нет.',
  },
]

const OURS = [
  'Структура — ваша: любые таблицы и связи, а не фиксированный список сущностей',
  'Роли, права на записи и запросы, которые выполняются с правами владельца',
  'Данные на сервере в России, платформа в реестре отечественного ПО',
  'Можно в облаке или на своём сервере — одно и то же приложение',
]

export function HowItWorks() {
  return (
    <>
      <section id="kak" className="scroll-mt-16 bg-slate-50 border-y border-slate-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
          <h2 className="text-2xl sm:text-3xl font-bold">Как агент читает вашу структуру</h2>
          <p className="mt-3 text-slate-600 max-w-2xl">
            Не «нейросеть угадывает по заголовкам». Excel для агента — снимок того, как уже устроен
            ваш бизнес. Модель данных строится из того, что в нём реально лежит.
          </p>
          <div className="mt-8 grid gap-6 sm:grid-cols-2">
            {READING.map(({ icon: Icon, title, body }) => (
              <div key={title} className="flex gap-4 rounded-2xl border border-slate-200 bg-white p-5">
                <Icon size={22} className="text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold">{title}</h3>
                  <p className="mt-1 text-slate-600 leading-relaxed text-sm">{body}</p>
                </div>
              </div>
            ))}
          </div>
          <p className="mt-6 text-sm text-slate-500">
            Формулы ячеек и макросы сами не переезжают — их логика заново собирается из полей,
            статусов и запросов.{' '}
            <a
              href={BLOG_POST_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-blue-600 hover:underline"
            >
              Подробно, с границами автоматизации <ArrowRight size={14} />
            </a>
          </p>
        </div>
      </section>

      <section id="sravnenie" className="scroll-mt-16 max-w-5xl mx-auto px-4 sm:px-6 py-12">
        <h2 className="text-2xl sm:text-3xl font-bold">А Power Apps или Quickbase?</h2>
        <p className="mt-3 text-slate-600 max-w-2xl">
          Сделать приложение из таблицы умеют и они. Разница в том, чья структура получится на
          выходе и где будут жить данные.
        </p>
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
          <div className="rounded-2xl border border-blue-500/30 bg-blue-50/60 p-6">
            <h3 className="font-bold">Интеграм</h3>
            <ul className="mt-4 space-y-3">
              {OURS.map(item => (
                <li key={item} className="flex items-start gap-3 text-sm text-slate-700">
                  <CheckCircle2 size={18} className="text-blue-600 shrink-0 mt-px" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </>
  )
}
