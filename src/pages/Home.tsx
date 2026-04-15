import React from 'react'
import { motion } from 'framer-motion'
import {
  Zap,
  Code2,
  Send, Mail, Phone, ExternalLink,
  ShieldCheck,
  Database,
  Layers,
  ArrowRight,
  CheckCircle2,
  Activity,
  Users,
  Settings2,
  Cpu,
  Lock,
  Globe,
  FileText,
  BarChart3,
  RefreshCcw,
  MessageSquare,
  Scale,
  Megaphone,
  HardHat,
  Heart,
  GraduationCap,
  Plane,
  Shield,
  TrendingUp,
  Truck,
  Rocket,
  Building2,
  Wrench
} from 'lucide-react'
import { Link } from 'react-router-dom'
import ClientLogos from '@/components/ClientLogos'

type FormState = 'idle' | 'sending' | 'success' | 'error'

export default function Home() {
  const [formState, setFormState] = React.useState<FormState>('idle')
  const [errorMsg, setErrorMsg]   = React.useState('')
  const [consentChecked, setConsentChecked] = React.useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    const data = {
      name:    (form.elements.namedItem('name')    as HTMLInputElement).value,
      company: (form.elements.namedItem('company') as HTMLInputElement).value,
      contact: (form.elements.namedItem('contact') as HTMLInputElement).value,
      task:    (form.elements.namedItem('task')    as HTMLTextAreaElement).value,
    }

    setFormState('sending')
    setErrorMsg('')

    try {
      const res = await fetch('/telegram-notify.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const json = await res.json()
      if (json.ok) {
        setFormState('success')
        form.reset()
      } else {
        setFormState('error')
        setErrorMsg(json.error ?? 'Произошла ошибка. Попробуйте позже.')
      }
    } catch {
      setFormState('error')
      setErrorMsg('Не удалось отправить запрос. Проверьте соединение.')
    }
  }

  return (
    <div className="overflow-hidden">
      {/* 1. Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32">
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-[radial-gradient(circle_at_center,rgba(37,99,235,0.08)_0%,transparent_70%)]" />
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/20 to-transparent" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-500 dark:text-blue-400 text-sm font-medium mb-6"
            >
              <Zap size={14} className="fill-current" />
              <span>Автоматизация без программистов</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-8"
            >
              Инструмент для <span className="text-blue-500 italic">ускорения</span> внутренней разработки
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="max-w-3xl mx-auto text-lg md:text-xl text-slate-500 dark:text-slate-400 leading-relaxed mb-10"
            >
              Разгрузите программистов, не жертвуя контролем.<br />
              Платформа, которая встраивается в вашу ИТ-среду и реализует проекты быстрее, чем вы успеете написать ТЗ на обычную разработку.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              <a
                href="#cta"
                className="w-full sm:w-auto px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-600/20 transition-all flex items-center justify-center gap-2 group"
              >
                Отправить задачу из очереди задач (бэклога)
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </a>
              <a
                href="https://ideav.ru/start.html"
                target="start"
                rel="noopener noreferrer"
                className="w-full sm:w-auto px-8 py-4 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold rounded-xl transition-all"
              >
                Попробовать самому
              </a>
            </motion.div>
          </div>
        </div>
      </section>

      {/* 2. Problem Section */}
      <section className="py-24 bg-slate-50 dark:bg-slate-900/50 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-6">Своя разработка — это хорошо, но...</h2>
              <div className="space-y-6">
                {[
                  {
                    title: 'Программисты тонут в рутине',
                    desc: 'Вместо реализации сложной бизнес-логики команда тратит ресурс на организационную рутину'
                  },
                  {
                    title: 'Бэклог (очередь) растет бесконечно',
                    desc: 'Скорость поставки падает, а бизнес ждет инструменты месяцами'
                  },
                  {
                    title: 'Скрытая нагрузка на бюджет',
                    desc: 'Внутренние разработки требуют дорогостоящего "переключения фокуса" для сопровождения'
                  }
                ].map((item, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    className="flex gap-4 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/40 hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
                  >
                    <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500">
                      <Code2 size={20} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-800 dark:text-slate-100 mb-1">{item.title}</h3>
                      <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">{item.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="absolute -inset-4 bg-blue-600/10 rounded-3xl blur-3xl" />
              <div className="relative p-8 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-2xl">
                <div className="mb-6 flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500" />
                    <div className="w-3 h-3 rounded-full bg-amber-500" />
                    <div className="w-3 h-3 rounded-full bg-emerald-500" />
                  </div>
                  <div className="text-xs text-slate-400 dark:text-slate-500 font-mono italic">Backlog Status: CRITICAL</div>
                </div>
                <div className="space-y-4">
                  <div className="h-4 w-3/4 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />
                  <div className="h-4 w-1/2 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />
                  <div className="h-4 w-5/6 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />
                  <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
                    <p className="text-blue-500 dark:text-blue-400 font-semibold mb-2">Наше предложение:</p>
                    <p className="text-slate-700 dark:text-slate-300">Мы берем на себя задачи, которые съедают значительный ресурс вашей команды, и выполняем их беспрецедентно быстро</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="border-t border-slate-200 dark:border-slate-800" />

      {/* 2b. For Whom Section */}
      <section id="for-whom" className="py-24 bg-slate-50 dark:bg-slate-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Для кого</h2>
            <p className="text-slate-500 dark:text-slate-400 max-w-2xl mx-auto">
              Интеграм создан для тех, кто устал от хаоса в бизнес-процессах. Платформа позволяет навести порядок в учёте, заменить громоздкое ПО в планово-экономических отделах, прогнозировать доходы и снижать расходы — без долгих внедрений.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mb-10">
            {[
              { icon: Scale,         label: 'Юридические фирмы' },
              { icon: Megaphone,     label: 'Рекламные агентства' },
              { icon: HardHat,       label: 'Строительные компании' },
              { icon: Heart,         label: 'Медицинские клиники' },
              { icon: GraduationCap, label: 'Образование' },
              { icon: Code2,         label: 'ИТ-компании' },
              { icon: Plane,         label: 'Туристические агентства' },
              { icon: Shield,        label: 'Страховые компании' },
              { icon: TrendingUp,    label: 'Финансовые компании' },
              { icon: Truck,         label: 'Логистика' },
              { icon: Wrench,        label: 'Технический сервис' },
              { icon: Users,         label: 'Любой бизнес с процессами' },
            ].map(({ icon: Icon, label }) => (
              <div
                key={label}
                className="flex flex-col items-center gap-3 p-5 rounded-2xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-md transition-all group"
              >
                <div className="w-11 h-11 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center group-hover:bg-blue-50 dark:group-hover:bg-blue-900/30 transition-colors">
                  <Icon size={20} className="text-slate-500 dark:text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" />
                </div>
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300 text-center leading-tight">{label}</span>
              </div>
            ))}
          </div>

          <p className="text-center text-sm text-slate-400 dark:text-slate-500">
            Оптимальное решение для компаний со штатом до 700 сотрудников — с собственным ИТ-отделом или специалистами на аутсорсинге
          </p>
        </div>
      </section>

      {/* 3. Technology Section */}
      <section id="technology" className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Работаем там, где обычные конструкторы «падают»</h2>
            <p className="text-slate-500 dark:text-slate-400 max-w-2xl mx-auto italic">Это не просто «конструктор для менеджеров». Это промышленная платформа.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Database,
                title: 'Не тормозит на объемах',
                desc: 'Протестировано на сотнях миллионов записей. Ваши корпоративные объемы — это штатный режим для Интеграма.'
              },
              {
                icon: Layers,
                title: 'Любая сложность данных',
                desc: 'Связи, рекурсия и вложенные запросы без ручного кодирования. Реальная замена традиционной БД.'
              },
              {
                icon: ShieldCheck,
                title: 'Безопасность на уровне ядра',
                desc: 'Ролевая модель к таблицам, колонкам и записям. Журналы событий и контрольные точки — из коробки.'
              }
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.2 }}
                className="p-8 rounded-3xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/30 hover:bg-white dark:hover:bg-slate-900/50 transition-all group shadow-sm dark:shadow-none"
              >
                <div className="w-14 h-14 rounded-2xl bg-blue-600/10 flex items-center justify-center text-blue-500 mb-6 group-hover:scale-110 transition-transform">
                  <item.icon size={28} />
                </div>
                <h3 className="text-xl font-bold mb-4">{item.title}</h3>
                <p className="text-slate-500 dark:text-slate-400 leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. Model of Interaction */}
      <section id="process" className="py-24 bg-slate-50 dark:bg-slate-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-slate-800 dark:text-slate-100"><a href="#cta" className="text-blue-500 dark:text-blue-400 hover:text-blue-600 dark:hover:text-blue-300 transition-colors underline underline-offset-4 decoration-blue-500/50 dark:decoration-blue-400/50">Пришлите задачу</a>. Мы сделаем её работающим приложением.</h2>
            <p className="text-slate-500 dark:text-slate-400 max-w-2xl mx-auto">Ваш бэклог (очередь задач) — наш приоритет. От идеи до эксплуатации в корпоративном контуре.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 relative">
            <div className="hidden md:block absolute top-1/2 left-0 right-0 h-px bg-slate-200 dark:bg-slate-800 -z-10" />

            {[
              {
                step: '01',
                title: 'Выбор задачи',
                desc: 'Вы выбираете любой проект из очереди: учет, согласование, отчетность, справочники или админки'
              },
              {
                step: '02',
                title: 'Проектирование',
                desc: 'Мы анализируем требования и разворачиваем решение на платформе «Интеграм» под ваши требования'
              },
              {
                step: '03',
                title: 'Готовый инструмент',
                desc: 'Вы получаете приложение с SSO (единый вход), API (программный интерфейс), аудитом и внешним видом в корпоративном стиле'
              }
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.2 }}
                className="bg-white dark:bg-slate-950 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 relative group shadow-sm dark:shadow-none"
              >
                <div className="text-4xl font-black text-slate-100 dark:text-slate-900 group-hover:text-blue-500/10 transition-colors absolute top-4 right-6 leading-none">
                  {item.step}
                </div>
                <h3 className="text-xl font-bold mb-4 text-slate-800 dark:text-slate-100 group-hover:text-blue-500 transition-colors">{item.title}</h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>

          <div className="mt-12 p-8 rounded-3xl bg-blue-600/5 border border-blue-500/10 flex flex-col md:flex-row items-center gap-6">
            <div className="flex-shrink-0 w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-500">
              <CheckCircle2 size={24} />
            </div>
            <p className="text-slate-600 dark:text-slate-300 text-lg">
              Результат — <span className="text-slate-800 dark:text-slate-100 font-bold">100% настроенное под вас коробочное решение</span>, которое живет внутри вашего контура и не требует команды сопровождения
            </p>
          </div>
        </div>
      </section>

      {/* 5. Analysts not Programmers */}
      <section className="py-24 border-y border-slate-200 dark:border-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="order-2 lg:order-1 grid grid-cols-2 gap-4">
              {[
                { icon: RefreshCcw, label: 'SQL Конструктор', sub: 'Включая рекурсию' },
                { icon: FileText, label: 'Формы и отчеты', sub: 'Без кодирования' },
                { icon: Globe, label: 'Импорт/Экспорт', sub: 'Excel, JSON, API' },
                { icon: Lock, label: 'Ролевая модель', sub: 'Настройка без кода' }
              ].map((item, i) => (
                <div key={i} className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/30">
                  <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-blue-500 mb-4">
                    <item.icon size={20} />
                  </div>
                  <h4 className="font-bold text-slate-800 dark:text-slate-100 mb-1">{item.label}</h4>
                  <p className="text-xs text-slate-400 dark:text-slate-500 uppercase tracking-wider">{item.sub}</p>
                </div>
              ))}
            </div>

            <div className="order-1 lg:order-2">
              <h2 className="text-3xl md:text-4xl font-bold mb-6">Изменения вносятся бизнес-аналитиками, а не программистами</h2>
              <p className="text-slate-500 dark:text-slate-400 text-lg mb-8 leading-relaxed">
                Ваши ИТ-ресурсы перестают тратить время на правки отчетов и интерфейсов. Этим занимаются аналитики или бизнес-пользователи в рамках их полномочий.
              </p>
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300">
                  <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 size={14} />
                  </div>
                  <span>Сокращение времени вывода на рынок (Time-to-Market) для минорных правок</span>
                </div>
                <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300">
                  <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 size={14} />
                  </div>
                  <span>Полный аудит всех изменений логики</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. AI Section */}
      <section className="py-24 bg-slate-50 dark:bg-slate-900/50 relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-blue-600/5 blur-[100px] rounded-full -z-10" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-500 dark:text-blue-400 text-sm font-medium mb-6">
              <Cpu size={14} />
              <span>AI-native (органично интегрировано с ИИ)</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-slate-800 dark:text-slate-100">
              Мы строим продукты, интегрированные с <span className="text-blue-500 dark:text-blue-400">искусственным интеллектом</span>
            </h2>
            <p className="text-slate-500 dark:text-slate-400 max-w-2xl mx-auto text-lg">
              Языковые модели и агенты берут на себя большую часть работы по программированию и интеграции — мы используем их полную мощь, чтобы доставлять решения быстрее.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: Cpu,
                title: 'ИИ в ядре',
                desc: 'Языковые модели встроены в архитектуру продукта, а не добавлены сверху как функция'
              },
              {
                icon: Code2,
                title: 'Агенты пишут код',
                desc: 'Агенты генерируют, тестируют и оптимизируют код — разработчики контролируют результат, а не пишут рутину'
              },
              {
                icon: Zap,
                title: 'Автоматические интеграции',
                desc: 'Подключение к внешним системам описывается на языке задачи — агент строит интеграцию самостоятельно'
              },
              {
                icon: Activity,
                title: 'Непрерывное улучшение',
                desc: 'Модели обучаются на действующих сценариях вашего бизнеса и становятся точнее с каждым запросом'
              }
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 hover:border-blue-500/30 transition-colors shadow-sm dark:shadow-none"
              >
                <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-500 dark:text-blue-400 mb-5">
                  <item.icon size={22} />
                </div>
                <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-2">{item.title}</h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 7. Integration Section */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-600/5 blur-[120px] rounded-full -z-10" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Мы не заменяем, мы дополняем</h2>
            <p className="text-slate-500 dark:text-slate-400 max-w-2xl mx-auto">Инструмент, который бесшовно встраивается в ваш существующий ИТ-ландшафт.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Activity, title: 'Интеграции', desc: 'Настройка интеграционных модулей без программирования' },
              { icon: Users, title: 'Аутентификация', sub: 'Интеграция с корпоративными методами аутентификации' },
              { icon: BarChart3, title: 'Мониторинг и Аудит', sub: 'Выгрузка данных в ваши системы (ELK, Zabbix и др.)' },
              { icon: Settings2, title: 'Локальная установка', sub: 'Работа на вашем контуре для полной безопасности' }
            ].map((item, i) => (
              <div key={i} className="p-8 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 hover:border-slate-300 dark:hover:border-slate-700 transition-all text-center shadow-sm dark:shadow-none">
                <div className="mx-auto w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500 mb-6">
                  <item.icon size={24} />
                </div>
                <h3 className="font-bold mb-2">{item.title}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{item.desc || item.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 8. Case Study Section */}
      <section id="cases" className="py-24 bg-slate-50 dark:bg-slate-900/50 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Примеры из практики</h2>
            <p className="text-slate-500 dark:text-slate-400 max-w-2xl mx-auto">Реальные проекты, реализованные на платформе для разных отраслей и задач</p>
          </div>

          {/* Case 1: Construction Worker Motivation System */}
          <div className="grid lg:grid-cols-2 gap-16 items-center mb-24">
            <div className="space-y-8">
              <div className="p-8 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/80 shadow-lg dark:shadow-xl">
                <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-6 flex items-center gap-3">
                  <span className="w-1.5 h-6 bg-blue-500 rounded-full" />
                  Система мотивации строительного персонала
                </h3>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed mb-6">
                  Заказчик хотел глобальную платформу типа WeChat — покрыть все задачи прораба и интегрироваться в жизнь заказчиков и исполнителей проектов.
                </p>
                <div className="space-y-4">
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-6 h-6 rounded bg-red-500/10 text-red-500 flex items-center justify-center">
                      <ArrowRight size={14} className="rotate-45" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-700 dark:text-slate-200">Задача:</h4>
                      <p className="text-sm text-slate-500 dark:text-slate-400">Регистрация, адаптация, заведение проектов, распределение задач, процесс выполнения проекта.</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-6 h-6 rounded bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                      <CheckCircle2 size={14} />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-700 dark:text-slate-200">Реализация:</h4>
                      <p className="text-sm text-slate-500 dark:text-slate-400">Структура данных и наполнение, сводная панель метрик, планирование H_min, назначения, мониторинг, экономика и симуляция сценариев.</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 text-center shadow-sm dark:shadow-none">
                  <div className="text-2xl font-black text-blue-500 mb-1">Запуск</div>
                  <div className="text-xs text-slate-400 dark:text-slate-500 uppercase font-bold tracking-widest">за 6 недель</div>
                </div>
                <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 text-center shadow-sm dark:shadow-none">
                  <div className="text-2xl font-black text-blue-500 mb-1">7</div>
                  <div className="text-xs text-slate-400 dark:text-slate-500 uppercase font-bold tracking-widest">модулей</div>
                </div>
                <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 text-center shadow-sm dark:shadow-none">
                  <div className="text-2xl font-black text-blue-500 mb-1">0</div>
                  <div className="text-xs text-slate-400 dark:text-slate-500 uppercase font-bold tracking-widest">кода вручную</div>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="absolute -inset-10 bg-blue-600/10 blur-[100px] rounded-full -z-10 animate-pulse" />
              <div className="p-2 rounded-[2rem] bg-gradient-to-br from-slate-200 dark:from-slate-800 to-slate-100 dark:to-slate-950 border border-slate-200 dark:border-slate-800 shadow-2xl">
                <div className="bg-white dark:bg-slate-900 rounded-[1.5rem] overflow-hidden">
                  <div className="h-10 bg-slate-50 dark:bg-slate-950 flex items-center px-6 gap-2 border-b border-slate-200 dark:border-slate-800">
                    <div className="w-2.5 h-2.5 rounded-full bg-slate-200 dark:bg-slate-800" />
                    <div className="w-2.5 h-2.5 rounded-full bg-slate-200 dark:bg-slate-800" />
                    <div className="w-2.5 h-2.5 rounded-full bg-slate-200 dark:bg-slate-800" />
                    <div className="ml-auto flex items-center gap-4">
                      <div className="w-32 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full" />
                      <div className="w-8 h-4 rounded bg-blue-600/20" />
                    </div>
                  </div>
                  <img
                    src={`${import.meta.env.BASE_URL}case-orbita-planner.png`}
                    alt="Орбита Planner — система управления строительным персоналом"
                    className="w-full block"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Case 2: Venture Fund Sovereignty Audit */}
          <div className="grid lg:grid-cols-2 gap-16 items-center mb-24">
            <div className="relative order-last lg:order-first">
              <div className="absolute -inset-10 bg-blue-600/10 blur-[100px] rounded-full -z-10 animate-pulse" />
              <div className="p-2 rounded-[2rem] bg-gradient-to-br from-slate-200 dark:from-slate-800 to-slate-100 dark:to-slate-950 border border-slate-200 dark:border-slate-800 shadow-2xl">
                <div className="bg-white dark:bg-slate-900 rounded-[1.5rem] overflow-hidden">
                  <div className="h-10 bg-slate-50 dark:bg-slate-950 flex items-center px-6 gap-2 border-b border-slate-200 dark:border-slate-800">
                    <div className="w-2.5 h-2.5 rounded-full bg-slate-200 dark:bg-slate-800" />
                    <div className="w-2.5 h-2.5 rounded-full bg-slate-200 dark:bg-slate-800" />
                    <div className="w-2.5 h-2.5 rounded-full bg-slate-200 dark:bg-slate-800" />
                    <div className="ml-auto flex items-center gap-4">
                      <div className="w-32 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full" />
                      <div className="w-8 h-4 rounded bg-blue-600/20" />
                    </div>
                  </div>
                  <img
                    src={`${import.meta.env.BASE_URL}case-sovereignty-audit.png`}
                    alt="Аудит суверенности 9D — оценка технологической независимости портфельных компаний"
                    className="w-full block"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-8">
              <div className="p-8 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/80 shadow-lg dark:shadow-xl">
                <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-6 flex items-center gap-3">
                  <span className="w-1.5 h-6 bg-blue-500 rounded-full" />
                  Аудит суверенности портфеля инвестиционного фонда
                </h3>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed mb-6">
                  Фонд, инвестирующий в технологические компании (БПЛА, дроны, глубокие технологии). Портфель из десятков стартапов с разной степенью зависимости от иностранных технологий.
                </p>
                <div className="space-y-4">
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-6 h-6 rounded bg-red-500/10 text-red-500 flex items-center justify-center">
                      <ArrowRight size={14} className="rotate-45" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-700 dark:text-slate-200">Задача:</h4>
                      <p className="text-sm text-slate-500 dark:text-slate-400">Единая методология оценки суверенности по 9 измерениям, проверка соответствия НПА (ПП-1726, ФЗ-149) и дорожная карта.</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-6 h-6 rounded bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                      <CheckCircle2 size={14} />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-700 dark:text-slate-200">Реализация:</h4>
                      <p className="text-sm text-slate-500 dark:text-slate-400">9D Аудит, пирамида суверенности, моделировщик, анализатор хранилищ кода (50+ метрик) и автоматические дорожные карты.</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 text-center shadow-sm dark:shadow-none">
                  <div className="text-2xl font-black text-blue-500 mb-1">9</div>
                  <div className="text-xs text-slate-400 dark:text-slate-500 uppercase font-bold tracking-widest">измерений</div>
                </div>
                <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 text-center shadow-sm dark:shadow-none">
                  <div className="text-2xl font-black text-blue-500 mb-1">50+</div>
                  <div className="text-xs text-slate-400 dark:text-slate-500 uppercase font-bold tracking-widest">метрик</div>
                </div>
                <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 text-center shadow-sm dark:shadow-none">
                  <div className="text-2xl font-black text-blue-500 mb-1">11</div>
                  <div className="text-xs text-slate-400 dark:text-slate-500 uppercase font-bold tracking-widest">агентов</div>
                </div>
              </div>
            </div>
          </div>

          {/* Case 3: Bank PD management */}
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-8">
              <div className="p-8 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/80 shadow-lg dark:shadow-xl">
                <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-6 flex items-center gap-3">
                  <span className="w-1.5 h-6 bg-blue-500 rounded-full" />
                  Управление процессами обработки персональных данных (ПДн)
                </h3>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed mb-6">
                  Крупный банк с тысячами сотрудников и десятками разрозненных ИТ-систем.
                </p>
                <div className="space-y-4">
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-6 h-6 rounded bg-red-500/10 text-red-500 flex items-center justify-center">
                      <ArrowRight size={14} className="rotate-45" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-700 dark:text-slate-200">Задача:</h4>
                      <p className="text-sm text-slate-500 dark:text-slate-400">Централизованный учет ПДн, версионность, согласование и интеграция с аудитом.</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-6 h-6 rounded bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                      <CheckCircle2 size={14} />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-700 dark:text-slate-200">Реализация:</h4>
                      <p className="text-sm text-slate-500 dark:text-slate-400">Реестр процессов, автоматическая отчетность без программирования, встроенная ролевая модель.</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 text-center shadow-sm dark:shadow-none">
                  <div className="text-3xl font-black text-blue-500 mb-2">1–3</div>
                  <div className="text-xs text-slate-400 dark:text-slate-500 uppercase font-bold tracking-widest">месяца на внедрение</div>
                </div>
                <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 text-center shadow-sm dark:shadow-none">
                  <div className="text-3xl font-black text-blue-500 mb-2">590к</div>
                  <div className="text-xs text-slate-400 dark:text-slate-500 uppercase font-bold tracking-widest">₽ под ключ</div>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="absolute -inset-10 bg-blue-600/10 blur-[100px] rounded-full -z-10 animate-pulse" />
              <div className="p-2 rounded-[2rem] bg-gradient-to-br from-slate-200 dark:from-slate-800 to-slate-100 dark:to-slate-950 border border-slate-200 dark:border-slate-800 shadow-2xl">
                <div className="bg-white dark:bg-slate-900 rounded-[1.5rem] overflow-hidden">
                  <div className="h-10 bg-slate-50 dark:bg-slate-950 flex items-center px-6 gap-2 border-b border-slate-200 dark:border-slate-800">
                    <div className="w-2.5 h-2.5 rounded-full bg-slate-200 dark:bg-slate-800" />
                    <div className="w-2.5 h-2.5 rounded-full bg-slate-200 dark:bg-slate-800" />
                    <div className="w-2.5 h-2.5 rounded-full bg-slate-200 dark:bg-slate-800" />
                    <div className="ml-auto flex items-center gap-4">
                      <div className="w-32 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full" />
                      <div className="w-8 h-4 rounded bg-blue-600/20" />
                    </div>
                  </div>
                  <img
                    src={`${import.meta.env.BASE_URL}case-pdn.png`}
                    alt="Процессы обработки персональных данных (ПДн) — реестр процессов в банке"
                    className="w-full block"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 8b. Client Logos */}
      <ClientLogos />

      {/* 9. Ready Projects Types */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Готовые типы проектов для вашего бэклога (очереди задач)</h2>
            <p className="text-slate-500 dark:text-slate-400">Любая из этих задач может быть реализована как полноценное веб-приложение</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              'Системы учета договоров и платежей',
              'Управление заявками и инцидентами',
              'Реестры и справочники с версионностью',
              'Админки для смежных систем',
              'Отчетность и информационные панели',
              'Инвентаризация и учет оборудования',
              'Бюджетирование и согласование',
              'Центры управления НСИ',
              'Анкеты и опросы сотрудников'
            ].map((task, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="p-5 flex items-center gap-4 bg-slate-50 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-800 rounded-2xl hover:border-blue-500/30 hover:bg-white dark:hover:bg-slate-900/50 transition-all cursor-default group shadow-sm dark:shadow-none"
              >
                <div className="w-8 h-8 rounded-lg bg-blue-600/10 text-blue-500 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                  <CheckCircle2 size={16} />
                </div>
                <span className="text-slate-600 dark:text-slate-300 font-medium">{task}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 10. Pricing Section */}
      <section id="pricing" className="py-24 bg-slate-50 dark:bg-slate-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Как начать быстро и комфортно</h2>
            <p className="text-slate-500 dark:text-slate-400 max-w-2xl mx-auto italic italic">Прозрачные условия для пилота и эксплуатации</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="p-8 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 relative flex flex-col hover:border-slate-300 dark:hover:border-slate-700 transition-all shadow-sm dark:shadow-none">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 px-4 py-1 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-[10px] font-black uppercase tracking-[0.2em] rounded-full">
                срок: 2 недели
              </div>
              <div className="flex items-start gap-4 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0">
                  <Rocket size={22} className="text-slate-600 dark:text-slate-300" />
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-1">Пилотный проект</h3>
                  <p className="text-slate-400 dark:text-slate-500 text-sm">Для проверки на реальной задаче</p>
                </div>
              </div>
              <div className="mb-6">
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-black text-slate-900 dark:text-white">от 93 750</span>
                  <span className="text-slate-400 dark:text-slate-500 text-xl font-bold">р</span>
                </div>
              </div>
              <ul className="space-y-4 mb-8 flex-1">
                {['Выбор задачи из очереди', 'Полный цикл разработки', 'Развертывание в контуре', 'Инструкции и доки'].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm text-slate-500 dark:text-slate-400">
                    <CheckCircle2 size={14} className="text-blue-500" />
                    {item}
                  </li>
                ))}
              </ul>
              <a href="#cta" className="w-full py-4 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-600 text-slate-800 dark:text-white font-bold rounded-xl transition-all text-center block">
                Выбрать задачу
              </a>
            </div>

            <div className="p-8 rounded-3xl border-2 border-blue-600 bg-white dark:bg-slate-950 relative flex flex-col shadow-[0_0_50px_-12px_rgba(37,99,235,0.3)]">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 px-4 py-1 bg-blue-600 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-full">
                Популярно
              </div>
              <div className="flex items-start gap-4 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                  <Building2 size={22} className="text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-1">Локальная лицензия</h3>
                  <p className="text-slate-400 dark:text-slate-500 text-sm">В контуре предприятия (год)</p>
                </div>
              </div>
              <div className="mb-6 flex items-baseline gap-2">
                <span className="text-4xl font-black text-slate-900 dark:text-white">290 000</span>
                <span className="text-slate-400 dark:text-slate-500 text-xl font-bold">₽</span>
              </div>
              <ul className="space-y-4 mb-8 flex-1">
                {['Неограниченное количество записей', 'Полный функционал интеграции', 'Приоритетная поддержка', 'Любые коннекторы'].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm text-slate-500 dark:text-slate-400">
                    <CheckCircle2 size={14} className="text-blue-500" />
                    {item}
                  </li>
                ))}
              </ul>
              <a href="#cta" className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-600/20 transition-all text-center block">
                Уточнить условия
              </a>
            </div>

            <div className="p-8 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 flex flex-col hover:border-slate-300 dark:hover:border-slate-700 transition-all shadow-sm dark:shadow-none">
              <div className="flex items-start gap-4 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0">
                  <Wrench size={22} className="text-slate-600 dark:text-slate-300" />
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-1">Разработка</h3>
                  <p className="text-slate-400 dark:text-slate-500 text-sm">Аналитика и настройка</p>
                </div>
              </div>
              <div className="mb-6 flex items-baseline gap-2">
                <span className="text-4xl font-black text-slate-900 dark:text-white">3 750</span>
                <span className="text-slate-400 dark:text-slate-500 text-xl font-bold">₽/час</span>
              </div>
              <ul className="space-y-4 mb-8 flex-1">
                {['Проектирование системы', 'Настройка сложных интеграций', 'Настройка интерфейсов', 'Обучение сотрудников'].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm text-slate-500 dark:text-slate-400">
                    <CheckCircle2 size={14} className="text-blue-500" />
                    {item}
                  </li>
                ))}
              </ul>
              <a href="#cta" className="w-full py-4 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-600 text-slate-800 dark:text-white font-bold rounded-xl transition-all text-center block">
                Заказать под ключ
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* 11. Team Roles Section */}
      <section className="py-24 border-t border-slate-200 dark:border-slate-900 bg-white dark:bg-slate-950/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Кто работает над вашей задачей</h2>
            <p className="text-slate-500 dark:text-slate-400 max-w-2xl mx-auto">Мы предоставляем экспертов, которые знают платформу и понимают бизнес-процессы.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="p-8 rounded-3xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex gap-6 items-start shadow-sm dark:shadow-none">
              <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500 flex-shrink-0">
                <Users size={24} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2">Системный аналитик</h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
                  Сбор требований, проектирование структур данных и логики процессов. Переводит бизнес-язык в архитектуру платформы.
                </p>
              </div>
            </div>

            <div className="p-8 rounded-3xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex gap-6 items-start shadow-sm dark:shadow-none">
              <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500 flex-shrink-0">
                <Settings2 size={24} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2">Разработчик платформы</h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
                  Настройка логики, интеграций и интерфейсов. Обеспечивает бесшовную работу приложения в вашем контуре.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-12 text-center text-slate-400 dark:text-slate-500 text-sm italic">
            Результат сдается в виде готового приложения, полной технической документации и пользовательских инструкций.
          </div>
        </div>
      </section>

      {/* 12. Final CTA Form */}
      <section id="cta" className="py-24 border-t border-slate-200 dark:border-slate-900 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center bg-white dark:bg-slate-950 px-3 py-6 sm:p-8 lg:p-12 rounded-2xl lg:rounded-[3rem] border border-slate-200 dark:border-slate-800 shadow-xl dark:shadow-2xl overflow-hidden relative">
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 blur-[100px] rounded-full -z-10" />

            <div>
              <h2 className="text-3xl md:text-5xl font-bold mb-8">Готовы разгрузить свой бэклог (очередь задач)?</h2>
              <p className="text-slate-500 dark:text-slate-400 text-lg mb-8">
                Пришлите описание задачи или проект из очереди, и мы сделаем предварительную оценку архитектуры и сроков за 24 часа
              </p>

              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-blue-500">
                    <MessageSquare size={20} />
                  </div>
                  <div>
                    <div className="text-sm text-slate-400 dark:text-slate-500 uppercase tracking-widest font-bold">Telegram</div>
                    <a href="https://t.me/qdmadept" className="text-slate-700 dark:text-slate-200 hover:text-blue-500 font-bold transition-colors">@qdmadept</a>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-blue-500">
                    <Mail size={20} />
                  </div>
                  <div>
                    <div className="text-sm text-slate-400 dark:text-slate-500 uppercase tracking-widest font-bold">Email</div>
                    <a href="mailto:abc@integram.io" className="text-slate-700 dark:text-slate-200 hover:text-blue-500 font-bold transition-colors">abc@integram.io</a>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-900/50 px-3 py-5 sm:p-8 rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-slate-800 backdrop-blur-sm">
              <form className="space-y-4" onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 ml-1">Имя</label>
                    <input name="name" type="text" className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2 sm:py-3 text-slate-800 dark:text-slate-100 focus:border-blue-500 outline-none transition-all" placeholder="Александр" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 ml-1">Компания</label>
                    <input name="company" type="text" className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2 sm:py-3 text-slate-800 dark:text-slate-100 focus:border-blue-500 outline-none transition-all" placeholder="Digital Corp" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 ml-1">Email / Telegram</label>
                  <input name="contact" type="text" className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2 sm:py-3 text-slate-800 dark:text-slate-100 focus:border-blue-500 outline-none transition-all" placeholder="@username" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 ml-1">Задача (коротко)</label>
                  <textarea name="task" rows={3} className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2 sm:py-3 text-slate-800 dark:text-slate-100 focus:border-blue-500 outline-none transition-all resize-none" placeholder="Нужно перенести учет ПДн из Excel..." />
                </div>

                {formState === 'success' && (
                  <div className="flex items-center gap-2 text-green-500 dark:text-green-400 text-sm font-medium">
                    <CheckCircle2 size={16} />
                    Заявка отправлена! Мы свяжемся с вами в течение 24 часов.
                  </div>
                )}
                {formState === 'error' && (
                  <div className="text-red-500 dark:text-red-400 text-sm font-medium">{errorMsg}</div>
                )}

                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={consentChecked}
                    onChange={e => setConsentChecked(e.target.checked)}
                    className="mt-0.5 h-4 w-4 shrink-0 rounded border-slate-300 dark:border-slate-600 accent-blue-600 cursor-pointer"
                  />
                  <span className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    Я даю согласие на{' '}
                    <a
                      href="/privacy"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline hover:text-blue-500 transition-colors"
                    >
                      обработку персональных данных
                    </a>
                  </span>
                </label>
                <button
                  type="submit"
                  disabled={formState === 'sending' || formState === 'success' || !consentChecked}
                  className="w-full py-3 sm:py-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl shadow-lg shadow-blue-600/20 transition-all flex items-center justify-center gap-2"
                >
                  {formState === 'sending' ? 'Отправка...' : 'Отправить на оценку'}
                  {formState !== 'sending' && <Send size={18} />}
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* 13. Try it yourself link */}
      <section className="py-16 border-t border-slate-200 dark:border-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <a
            href="https://ideav.ru/start.html"
            target="start"
            rel="noopener noreferrer"
            className="inline-flex flex-col sm:flex-row items-center justify-center gap-3 px-10 py-6 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white font-bold rounded-2xl shadow-xl shadow-blue-600/25 transition-all group"
          >
            <ExternalLink size={22} className="shrink-0 group-hover:scale-110 transition-transform" />
            <span className="leading-tight">
              Посмотреть и попробовать самому: своя песочница, описание, интерактивные уроки
            </span>
          </a>
        </div>
      </section>

      {/* 14. Cloud Hosting Tariffs */}
      <section id="cloud-tariffs" className="py-24 border-t border-slate-200 dark:border-slate-900 bg-slate-50 dark:bg-slate-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Тарифы на хостинг в облаке</h2>
            <p className="text-slate-500 dark:text-slate-400 max-w-2xl mx-auto">
              Используйте платформу в облаке со справедливой тарифной моделью оплаты за фактически потребляемые ресурсы. 1 токен ≈ одному действию: открытие таблицы, создание записи, запуск отчёта.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Free plan */}
            <div className="p-8 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 flex flex-col hover:border-slate-300 dark:hover:border-slate-700 transition-all shadow-sm dark:shadow-none">
              <h3 className="text-xl font-bold mb-1">Знакомство</h3>
              <p className="text-slate-400 dark:text-slate-500 text-sm mb-6">Личная песочница</p>
              <div className="mb-6 flex items-baseline gap-2">
                <span className="text-4xl font-black text-slate-900 dark:text-white">0</span>
                <span className="text-slate-400 dark:text-slate-500 text-xl font-bold">₽/мес</span>
              </div>
              <ul className="space-y-3 mb-8 flex-1">
                {[
                  '3 000 токенов в месяц',
                  'Один пользователь',
                  '~2 часа активной работы в день',
                  'Навсегда бесплатно',
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm text-slate-500 dark:text-slate-400">
                    <CheckCircle2 size={14} className="text-blue-500 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              <a
                href="https://ideav.ru/start.html"
                target="start"
                rel="noopener noreferrer"
                className="w-full py-4 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-600 text-slate-800 dark:text-white font-bold rounded-xl transition-all text-center block"
              >
                Начать бесплатно
              </a>
            </div>

            {/* Startup plan */}
            <div className="p-8 rounded-3xl border-2 border-blue-600 bg-white dark:bg-slate-950 relative flex flex-col shadow-[0_0_50px_-12px_rgba(37,99,235,0.3)]">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 px-4 py-1 bg-blue-600 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-full">
                Популярно
              </div>
              <h3 className="text-xl font-bold mb-1">Стартап</h3>
              <p className="text-slate-400 dark:text-slate-500 text-sm mb-6">Подходит для 80% клиентов</p>
              <div className="mb-2 flex items-baseline gap-2">
                <span className="text-4xl font-black text-slate-900 dark:text-white">1 950</span>
                <span className="text-slate-400 dark:text-slate-500 text-xl font-bold">₽/мес</span>
              </div>
              <ul className="space-y-3 mb-8 flex-1">
                {[
                  '5 000 токенов в месяц',
                  'Несколько пользователей',
                  '3–4 часа командной работы в день (5 чел.)',
                  'Превышение не блокирует работу',
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm text-slate-500 dark:text-slate-400">
                    <CheckCircle2 size={14} className="text-blue-500 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              <a
                href="https://ideav.ru/start.html"
                target="start"
                rel="noopener noreferrer"
                className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-600/20 transition-all text-center block"
              >
                Подключить
              </a>
            </div>

            {/* Scalable plan */}
            <div className="p-8 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 flex flex-col hover:border-slate-300 dark:hover:border-slate-700 transition-all shadow-sm dark:shadow-none">
              <h3 className="text-xl font-bold mb-1">Масштабируемый</h3>
              <p className="text-slate-400 dark:text-slate-500 text-sm mb-6">Регрессивная цена пакетов</p>
              <div className="mb-6 flex items-baseline gap-2">
                <span className="text-4xl font-black text-slate-900 dark:text-white">от 4 900</span>
                <span className="text-slate-400 dark:text-slate-500 text-xl font-bold">₽/мес</span>
              </div>
              <ul className="space-y-3 mb-8 flex-1">
                {[
                  'от 10 000 токенов в месяц',
                  'Несколько пользователей',
                  'Каждый следующий пакет на 20% дешевле',
                  'Превышение не блокирует работу',
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm text-slate-500 dark:text-slate-400">
                    <CheckCircle2 size={14} className="text-blue-500 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              <a
                href="https://ideav.ru/start.html"
                target="start"
                rel="noopener noreferrer"
                className="w-full py-4 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-600 text-slate-800 dark:text-white font-bold rounded-xl transition-all text-center block"
              >
                Подробнее
              </a>
            </div>
          </div>
          <div className="text-center mt-10">
            <a
              href="https://ideav.ru/start.html#tarif"
              target="start"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium underline underline-offset-4 transition-colors"
            >
              Подробнее об облачных тарифах
            </a>
          </div>
        </div>
      </section>
    </div>
  )
}
