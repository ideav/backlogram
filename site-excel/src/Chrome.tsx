import { CONTACT_EMAIL, PRIVACY_URL } from './content'
import { Logo } from './Logo'

// Шапка и подвал — общие у лендинга и статических страниц кейсов и сравнения
// (issue #626). Подвал несёт обязательную справку оператора персональных
// данных (ч. 2 ст. 18.1 152-ФЗ), поэтому он должен быть на каждой странице
// домена, а не только на главной.

export function SiteHeader({ homeHref }: { homeHref?: string }) {
  return (
    <header className="border-b border-slate-200 bg-white/90 backdrop-blur sticky top-0 z-10">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
        {homeHref ? (
          <a href={homeHref} aria-label="На главную">
            <Logo className="h-7 w-auto text-slate-900" />
          </a>
        ) : (
          <Logo className="h-7 w-auto text-slate-900" />
        )}
        {/* Адрес текстом, а не почтовой ссылкой: клик по ней — автоцель Метрики
            «Клик по email», достижимая кликером с первого экрана (issue #619). */}
        <span className="text-sm text-slate-500 select-all">{CONTACT_EMAIL}</span>
      </div>
    </header>
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
