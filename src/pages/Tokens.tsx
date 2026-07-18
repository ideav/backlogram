import { motion } from 'framer-motion'
import { Zap, ArrowRight, Users, Clock } from 'lucide-react'
import Breadcrumbs from '../components/Breadcrumbs'

export default function Tokens() {
  const actionCosts = [
    { action: 'Открыть таблицу', cost: '1', heavy: false },
    { action: 'Создать запись', cost: '1', heavy: false },
    { action: 'Запустить отчёт по продажам', cost: '1', heavy: false },
    { action: 'Пересчёт сложной таблицы с формулами', cost: '5–10', heavy: true },
    { action: 'Выгрузить 10 000 строк в Excel', cost: '10–20', heavy: true },
    { action: 'Импорт прайс-листа на 50 000 позиций', cost: '30–50', heavy: true },
  ]

  const userTypes = [
    {
      role: 'Оператор / поддержка',
      actionsPerHour: '40–60',
      examples: 'Ответы, закрытие тикетов, открытие чатов',
    },
    {
      role: 'Менеджер по продажам',
      actionsPerHour: '20–40',
      examples: 'Заполнение CRM, email, звонки',
    },
    {
      role: 'Планово-экономический отдел (ПЭО)',
      actionsPerHour: '15–30',
      examples: 'Открытие таблиц, расчёты, выгрузки, формирование отчётов',
      highlighted: true,
    },
  ]

  return (
    <div className="overflow-hidden">
      {/* Action costs table */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Breadcrumbs
            className="flex justify-center"
            items={[
              { name: 'Интеграм', to: '/' },
              { name: 'Токены и стоимость', to: '/tokens.html' },
            ]}
          />
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Почему стоимость в токенах</h2>
            <p className="text-slate-500 dark:text-slate-400 max-w-2xl mx-auto">
              Обычно в облачных сервисах платят за количество пользователей и гигабайты места. Здесь вы платите за реальную работу. Большинство ваших действий в системе тратят по 1 токену. Тяжёлые действия — дороже.
            </p>
            <p className="text-slate-500 dark:text-slate-400 max-w-2xl mx-auto">
              Каждый раз, когда вы что-то делаете в системе, счетчик делает «щелчок». Это честно: заплатили только за то, чем реально пользовались.
            </p>
          </div>

          <div className="max-w-3xl mx-auto">
            <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 overflow-hidden shadow-sm dark:shadow-none">
              <div className="grid grid-cols-2 bg-slate-50 dark:bg-slate-900/50 px-8 py-4 border-b border-slate-200 dark:border-slate-800">
                <span className="text-xs font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Действие</span>
                <span className="text-xs font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 text-right">Токенов</span>
              </div>
              {actionCosts.map((row, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05 }}
                  className={`grid grid-cols-2 px-8 py-5 border-b border-slate-100 dark:border-slate-900 last:border-0 ${row.heavy ? 'bg-amber-50/40 dark:bg-amber-900/10' : ''}`}
                >
                  <div className="flex items-center gap-3">
                    {row.heavy && (
                      <span className="text-amber-500 flex-shrink-0">
                        <Zap size={14} className="fill-current" />
                      </span>
                    )}
                    <span className={`text-sm ${row.heavy ? 'font-semibold text-slate-800 dark:text-slate-100' : 'text-slate-600 dark:text-slate-300'}`}>
                      {row.action}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className={`text-sm font-bold ${row.heavy ? 'text-amber-600 dark:text-amber-400' : 'text-blue-500'}`}>
                      {row.cost}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
            <p className="text-center text-xs text-slate-400 dark:text-slate-500 mt-4 italic flex items-center justify-center gap-1">
              <Zap size={12} className="fill-current text-amber-500 flex-shrink-0" /> — тяжёлые операции, которые расходуют больше одного токена
            </p>
          </div>
        </div>
      </section>

      {/* User types / consumption */}
      <section className="py-24 bg-slate-50 dark:bg-slate-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Сколько токенов расходует пользователь?</h2>
            <p className="text-slate-500 dark:text-slate-400 max-w-2xl mx-auto">
              Расход зависит от типа деятельности.{' '}
              <a
                href="https://www.activtrak.com/news/press-release-productivity-benchmarks-report-1h2024/"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-slate-700 dark:hover:text-slate-200"
              >
                Исследование ActivTrak
              </a>{' '}
              (135 000 пользователей)
              подтверждает: сотрудник продуктивно работает ~6,5 часов в день из 8.
            </p>
          </div>

          <div className="max-w-4xl mx-auto space-y-4 mb-12">
            {userTypes.map((user, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className={`p-6 rounded-2xl border ${user.highlighted
                  ? 'border-blue-500/40 bg-blue-50/50 dark:bg-blue-900/10'
                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950'
                } flex flex-col sm:flex-row sm:items-center gap-4 shadow-sm dark:shadow-none`}
              >
                <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-blue-600/10 flex items-center justify-center text-blue-500">
                  <Users size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-slate-800 dark:text-slate-100">
                    {user.role}
                    {user.highlighted && (
                      <span className="ml-2 text-xs font-black uppercase tracking-widest text-blue-500 bg-blue-500/10 px-2 py-0.5 rounded-full">
                        типичный пример
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{user.examples}</div>
                </div>
                <div className="flex items-center gap-2 text-right flex-shrink-0">
                  <Clock size={14} className="text-slate-400" />
                  <span className="text-sm font-bold text-slate-700 dark:text-slate-300 whitespace-nowrap">
                    {user.actionsPerHour} действий/час
                  </span>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="max-w-4xl mx-auto p-8 rounded-3xl border border-blue-500/20 bg-blue-50/50 dark:bg-blue-900/10">
            <h3 className="text-xl font-bold mb-4 text-slate-800 dark:text-slate-100">
              Пример расчёта для ПЭО
            </h3>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
              Сотрудник ПЭО делает ~20 действий в час × 6,5 продуктивных часов = <strong>~130 действий в день</strong>.
              За 22 рабочих дня это около 2 860 токенов — бесплатный тариф «Знакомство» (3 000 токенов на месяц) 
              вполне подходит для такого сотрудника.
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 border-t border-slate-200 dark:border-slate-900">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <a
              href="/start.html"
              className="w-full sm:w-auto px-8 py-4 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold rounded-xl transition-all text-center"
            >
              Начать работу
            </a>
          </motion.div>
        </div>
      </section>
    </div>
  )
}
