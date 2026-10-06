import { CONTACT_EMAIL, PRIVACY_URL } from './content'
import { Logo } from './Logo'

// Шапка и подвал — общие у лендинга и статических страниц кейсов и сравнения
// (issue #626). Подвал несёт обязательную справку оператора персональных
// данных (ч. 2 ст. 18.1 152-ФЗ), поэтому он должен быть на каждой странице
// домена, а не только на главной.

// Верхнее меню (issue #5085, ideav/crm): только якоря на секции главной,
// и только те, что видны до раскрытия воронки — как цены, кейсы и FAQ
// (см. README: целевая кнопка на странице одна, меню целевую не дублирует).
// «Контакты» отдельным пунктом не нужны: адрес и так стоит в шапке справа,
// а ссылка на подвал с тем же адресом ничего не добавляет.
const MENU = [
  { href: '#keysy', label: 'Примеры' },
  { href: '#kak-proishodit', label: 'Как это происходит' },
  { href: '#ceny', label: 'Цены' },
  { href: '#voprosy', label: 'Вопросы' },
]

export function SiteHeader({ homeHref }: { homeHref?: string }) {
  // На спутниках (кейсы, сравнение, прайс) якоря ведут на главную: /#keysy.
  const withBase = (href: string) => (homeHref ? `${homeHref}${href}` : href)
  return (
    <>
      <header className="border-b border-slate-200 bg-white/90 backdrop-blur sticky top-0 z-10">
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
                className="text-slate-600 hover:text-blue-600 transition-colors whitespace-nowrap"
              >
                {label}
              </a>
            ))}
          </nav>
          {/* Адрес текстом, а не почтовой ссылкой: клик по ней — автоцель Метрики
              «Клик по email», достижимая кликером с первого экрана (issue #619). */}
          <span className="text-sm text-slate-500 select-all">{CONTACT_EMAIL}</span>
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

export function SiteFooter() {
  return (
    <footer id="privacy" className="border-t border-slate-200 scroll-mt-6">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 text-sm text-slate-500 space-y-3">
        <p>
          Оператор персональных данных — АО «Интеграм», ИНН 9716002710, ОГРН 1247700757590.
          Через форму на этой странице мы собираем имя, контакт, описание задачи и приложенные
          файлы — только чтобы собрать демонстрацию и ответить на заявку. Данные не передаются
          третьим лицам и хранятся на сервере в России.
        </p>
        <p>
          Отозвать согласие и удалить данные можно письмом на{' '}
          <span className="text-slate-700 select-all">{CONTACT_EMAIL}</span>
          . Полный текст —{' '}
          <a
            href={PRIVACY_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline"
          >
            политика обработки персональных данных
          </a>
          .
        </p>
        <p>
          Сервис работает на платформе Интеграм (реестр отечественного ПО, запись №30872).
          Регистрация и биллинг — на{' '}
          <a href="https://ideav.ru/" className="text-blue-600 hover:underline">
            ideav.ru
          </a>
          .
        </p>
        <p>© {new Date().getFullYear()} АО «Интеграм»</p>
      </div>
    </footer>
  )
}
