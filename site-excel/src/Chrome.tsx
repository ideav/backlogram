import { useEffect, useState } from 'react'
import { ArrowUpRight, Check, Copy, Mail, Phone, Send } from 'lucide-react'
import {
  CONTACT_EMAIL,
  CONTACT_PHONE,
  CONTACT_PHONE_HOURS,
  CONTACT_PHONE_HREF,
  CONTACT_TELEGRAM_URL,
  PRIVACY_URL,
} from './content'
import { Logo } from './Logo'

// Шапка и подвал — общие у лендинга и статических страниц кейсов и сравнения
// (issue #626). Подвал несёт обязательную справку оператора персональных
// данных (ч. 2 ст. 18.1 152-ФЗ), поэтому он должен быть на каждой странице
// домена, а не только на главной.

// Верхнее меню (issue #5085, ideav/crm): только якоря на секции главной,
// и только те, что видны до раскрытия воронки — как кейсы, механизм и FAQ
// (см. README: целевая кнопка на странице одна, меню целевую не дублирует).
// Набор утвердил владелец: «Цены» не вошли — для нетипичного продукта цена
// не решающий фактор; «Контакты» ведут в подвал — к живым контактам (#5091)
// и адресу оператора.
const MENU = [
  { href: '#keysy', label: 'Примеры' },
  { href: '#kak-proishodit', label: 'Как это происходит' },
  { href: '#kontakty', label: 'Контакты' },
  { href: '#voprosy', label: 'Вопросы' },
]

export function SiteHeader({ homeHref }: { homeHref?: string }) {
  // На спутниках (кейсы, сравнение, прайс) якоря ведут на главную: /#keysy.
  const withBase = (href: string) => (homeHref ? `${homeHref}${href}` : href)
  return (
    <>
      <header className="border-b border-slate-200/70 bg-white/80 backdrop-blur-md sticky top-0 z-10">
        {/* Тонкая фирменная полоска сверху (issue #643). */}
        <div aria-hidden="true" className="h-[3px] bg-brand" />
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
          {homeHref ? (
            <a href={homeHref} aria-label="На главную">
              <Logo className="h-7 w-auto text-slate-900" />
            </a>
          ) : (
            <Logo className="h-7 w-auto text-slate-900" />
          )}
          <nav aria-label="Разделы" className="hidden md:flex items-center gap-6 text-sm">
            {MENU.map(({ href, label }) => (
              <a
                key={href}
                href={withBase(href)}
                className="font-medium text-slate-600 hover:text-violet-700 transition-colors whitespace-nowrap"
              >
                {label}
              </a>
            ))}
          </nav>
          {/* Контакты искали долго (issue #643) — заметная плашка справа ведёт
              к блоку контактов в подвале. Это якорь, а не tel:/mailto:: клик по
              ним — автоцели Метрики, достижимые кликером с первого экрана (#619). */}
          <a
            href={withBase('#kontakty')}
            className="shrink-0 inline-flex items-center gap-2 px-3.5 py-2 rounded-full bg-brand text-white text-sm font-semibold shadow-md shadow-indigo-500/25 hover:brightness-110 transition"
          >
            <Phone size={15} />
            {/* Номер — только с lg: на 768–1023 px он вместе с меню не влезал
                в строку и давал горизонтальный скролл на спутниках (issue #657). */}
            <span className="hidden lg:inline whitespace-nowrap">{CONTACT_PHONE}</span>
            <span className="lg:hidden">Контакты</span>
          </a>
        </div>
      </header>
      {/* Мобильное меню — второй строкой ПОД липкой шапкой, а не внутри неё:
          при скролле строка уезжает вместе со страницей, высота липкой части
          не меняется, и scroll-mt-16 у секций остаётся точным. У каждого
          <nav> своя видимость (hidden/md:flex и md:hidden), поэтому в дереве
          доступности в любой момент есть только один. */}
      <nav aria-label="Разделы" className="md:hidden border-b border-slate-200 bg-white">
        <div className="max-w-5xl mx-auto px-4 flex gap-5 overflow-x-auto py-2 text-sm whitespace-nowrap">
          {MENU.map(({ href, label }) => (
            <a
              key={href}
              href={withBase(href)}
              className="text-slate-600 hover:text-blue-600 transition-colors"
            >
              {label}
            </a>
          ))}
        </div>
      </nav>
    </>
  )
}

/**
 * Почта с кнопкой «скопировать». Кнопка появляется только после монтирования:
 * страницы кейсов и сравнения — чистый пререндер без скриптов, и мёртвая
 * кнопка там хуже, чем никакой.
 */
function EmailCopy() {
  const [mounted, setMounted] = useState(false)
  const [copied, setCopied] = useState(false)
  useEffect(() => setMounted(true), [])

  async function copy(): Promise<void> {
    try {
      await navigator.clipboard.writeText(CONTACT_EMAIL)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Буфер недоступен (не https, запрет браузера) — адрес выделяется вручную.
    }
  }

  return (
    <span className="flex items-center gap-2">
      <span className="text-lg font-semibold text-white select-all break-all">{CONTACT_EMAIL}</span>
      {mounted && (
        <button
          type="button"
          onClick={copy}
          aria-label="Скопировать адрес почты"
          className="shrink-0 p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-slate-200 transition-colors"
        >
          {copied ? <Check size={15} className="text-emerald-300" /> : <Copy size={15} />}
        </button>
      )}
    </span>
  )
}

const card =
  'group relative flex flex-col gap-3 rounded-2xl bg-white/[0.06] ring-1 ring-white/10 p-5 sm:p-6 transition hover:bg-white/[0.1] hover:ring-white/20'
const cardIcon = 'w-11 h-11 rounded-xl bg-gradient-to-br text-white flex items-center justify-center shadow-lg'

export function SiteFooter() {
  return (
    <footer id="kontakty" className="relative overflow-hidden bg-slate-950 text-slate-400 scroll-mt-16">
      <div aria-hidden="true" className="absolute -top-40 left-1/4 w-[32rem] h-[32rem] bg-indigo-600/25 blur-[140px] rounded-full pointer-events-none" />
      <div aria-hidden="true" className="absolute -bottom-40 right-0 w-[28rem] h-[28rem] bg-violet-600/20 blur-[140px] rounded-full pointer-events-none" />

      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 pt-14 pb-8">
        {/* Контакты (issue #643): пользователь искал их долго — теперь это
            первое, что есть в подвале, крупно и карточками. Живые контакты те же,
            что на ideav.ru (issue #5091). Почта текстом, без mailto-ссылки:
            клик по ней — автоцель Метрики «Клик по email» (issue #619). Телеграм
            открывается в новой вкладке — заполненная форма не должна теряться,
            как и при переходе к политике. */}
        <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">Контакты</h2>
        <p className="mt-3 text-slate-300 max-w-xl">
          Пишите или звоните — расскажем, подойдёт ли ваш Excel, и соберём демонстрацию.
        </p>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <a href={CONTACT_TELEGRAM_URL} target="_blank" rel="noopener noreferrer" className={card}>
            <span className={`${cardIcon} from-sky-400 to-blue-600 shadow-sky-500/30`}>
              <Send size={20} />
            </span>
            <span className="text-xs font-semibold uppercase tracking-widest text-slate-400">Telegram</span>
            <span className="text-lg font-semibold text-white">@qdmadept</span>
            <span className="inline-flex items-center gap-1 text-sm text-sky-300">
              Написать <ArrowUpRight size={15} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </span>
          </a>

          <a href={CONTACT_PHONE_HREF} className={card}>
            <span className={`${cardIcon} from-emerald-400 to-teal-600 shadow-emerald-500/30`}>
              <Phone size={20} />
            </span>
            <span className="text-xs font-semibold uppercase tracking-widest text-slate-400">Телефон</span>
            <span className="text-lg font-semibold text-white whitespace-nowrap">{CONTACT_PHONE}</span>
            <span className="text-sm text-slate-300">{CONTACT_PHONE_HOURS}</span>
          </a>

          <div className={card}>
            <span className={`${cardIcon} from-violet-400 to-fuchsia-600 shadow-violet-500/30`}>
              <Mail size={20} />
            </span>
            <span className="text-xs font-semibold uppercase tracking-widest text-slate-400">Почта</span>
            <EmailCopy />
            <span className="text-sm text-slate-300">файлы и ТЗ — тоже сюда</span>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-white/10 grid gap-8 md:grid-cols-[1.4fr_1fr]">
          <div>
            <Logo className="h-7 w-auto text-white" />
            <p className="mt-4 text-sm leading-relaxed">
              Сервис работает на платформе Интеграм (реестр отечественного ПО, запись №30872).
              Регистрация и биллинг — на{' '}
              <a href="https://ideav.ru/" className="text-slate-200 underline underline-offset-2 hover:text-white">
                ideav.ru
              </a>
              .
            </p>
          </div>
          <div className="text-sm leading-relaxed space-y-3">
            <p>
              Оператор персональных данных — АО «Интеграм», ИНН 9716002710, ОГРН 1247700757590.
              Через форму на этой странице мы собираем имя, контакт, описание задачи и приложенные
              файлы — только чтобы собрать демонстрацию и ответить на заявку. Данные не передаются
              третьим лицам и хранятся на сервере в России.
            </p>
            <p>
              Отозвать согласие и удалить данные можно письмом на{' '}
              <span className="text-slate-200 select-all">{CONTACT_EMAIL}</span>
              . Полный текст —{' '}
              <a
                href={PRIVACY_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-200 underline underline-offset-2 hover:text-white"
              >
                политика обработки персональных данных
              </a>
              .
            </p>
          </div>
        </div>

        <p className="mt-10 text-xs text-slate-400">© {new Date().getFullYear()} АО «Интеграм»</p>
      </div>
    </footer>
  )
}
