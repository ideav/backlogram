import { Mail, Phone, Send } from 'lucide-react'

/**
 * Персональная страница с контактами (issue #553).
 *
 * Зачем именно так. Поддержка Хабра требует, чтобы в профиле стояла ссылка на
 * ПЕРСОНАЛЬНУЮ страницу с контактами, а не на лендинг с услугами. Поэтому здесь
 * нет ни цен, ни призывов купить, ни перечня услуг — только кто это, чем занят и
 * как связаться. Всё, что похоже на продажу, ломает смысл страницы.
 *
 * Тон — скромный (прямая просьба в тикете). Никаких «эксперт с N-летним опытом»:
 * страница обязана быть проверяемой, а не рекламной.
 */

const TELEGRAM = 'qdmadept'
const EMAIL = 'abc@integram.io'
const PHONE_HREF = '+79955060167'
const PHONE_TEXT = '+7 (995) 506-01-67'

export default function AlexeySemenov() {
  return (
    <div className="overflow-hidden">
      <section className="py-24">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-xs font-black uppercase tracking-widest text-blue-500 mb-3">
            Персональная страница
          </p>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Алексей Семёнов</h1>
          <p className="text-lg text-slate-600 dark:text-slate-300 mb-10">
            Основатель Интеграма — конструктора, в котором бизнес-приложение собирается
            из описания задачи.
          </p>

          <div className="space-y-4 text-slate-600 dark:text-slate-300 leading-relaxed">
            <p>
              Занимаюсь платформой и тем, что вокруг неё: разбираю задачи из практики,
              меряю, что получается, и пишу об этом — включая случаи, когда получается не так,
              как задумывалось.
            </p>
            <p>
              Пишу и отвечаю сам. Если у вас вопрос по платформе, задача или замечание —
              напишите любым удобным способом.
            </p>
          </div>

          <h2 className="text-xl font-bold mt-12 mb-4">Контакты</h2>
          <ul className="space-y-3">
            <li>
              <a
                href={`https://t.me/${TELEGRAM}`}
                className="inline-flex items-center gap-2 text-slate-700 dark:text-slate-200 hover:text-blue-500 transition-colors"
              >
                <Send className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span className="font-semibold">@{TELEGRAM}</span>
                <span className="text-slate-400 dark:text-slate-500">— Telegram</span>
              </a>
            </li>
            <li>
              <a
                href={`mailto:${EMAIL}`}
                className="inline-flex items-center gap-2 text-slate-700 dark:text-slate-200 hover:text-blue-500 transition-colors"
              >
                <Mail className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span className="font-semibold">{EMAIL}</span>
                <span className="text-slate-400 dark:text-slate-500">— почта</span>
              </a>
            </li>
            <li>
              <a
                href={`tel:${PHONE_HREF}`}
                className="inline-flex items-center gap-2 text-slate-700 dark:text-slate-200 hover:text-blue-500 transition-colors"
              >
                <Phone className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span className="font-semibold">{PHONE_TEXT}</span>
                <span className="text-slate-400 dark:text-slate-500">— телефон</span>
              </a>
            </li>
          </ul>

          <p className="mt-12 pt-6 border-t border-slate-200 dark:border-slate-800 text-sm text-slate-400 dark:text-slate-500">
            АО «Интеграм», ИНН 9716002710, ОГРН 1247700757590.
          </p>
        </div>
      </section>
    </div>
  )
}
