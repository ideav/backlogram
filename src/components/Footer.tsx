import { Link } from 'react-router-dom'
import { Send, Mail, Phone, ExternalLink } from 'lucide-react'
import { Logo } from './Logo'
import { footerNavGroups } from '../data/nav'
import type { NavLink } from '../data/nav'

const LINK_CLASS =
  'text-slate-500 dark:text-slate-400 hover:text-blue-500 dark:hover:text-blue-400 text-sm transition-colors'

// Пункт подвала. Внутренние адреса — через Link (роутер, без перезагрузки),
// внешние — обычной <a> в новой вкладке. Сами ссылки лежат в src/data/nav.mjs:
// оттуда их же берёт статический блок навигации в сыром HTML (issue #627, п. 3).
function FooterLink({ link }: { link: NavLink }) {
  const icon = link.icon === 'external' ? <ExternalLink size={12} /> : null
  if (link.external) {
    return (
      <a
        href={link.href}
        target="_blank"
        rel="noopener noreferrer"
        className={icon ? `${LINK_CLASS} flex items-center gap-2` : LINK_CLASS}
      >
        {link.name}
        {icon}
      </a>
    )
  }
  // Якоря главной (/#technology) роутеру не нужны — это навигация внутри
  // документа, и <a> отрабатывает её сама.
  if (link.href.startsWith('/#')) {
    return (
      <a href={link.href} className={LINK_CLASS}>
        {link.name}
      </a>
    )
  }
  return (
    <Link to={link.href} className={LINK_CLASS}>
      {link.name}
    </Link>
  )
}

export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-900 pt-16 pb-8 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          {/* Brand and Mission */}
          <div className="lg:col-span-1">
            <Link to="/" aria-label="Интеграм — на главную" className="inline-flex items-center mb-6">
              <Logo className="h-8 w-auto text-slate-900 dark:text-white" />
            </Link>
            <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed mb-6">
              Промышленная платформа для корпоративной разработки без программирования.<br />
              Разгружаем программистов, сохраняя контроль над архитектурой и безопасностью.
            </p>
            <div className="inline-flex flex-col rounded-2xl border border-blue-500/20 bg-blue-500/5 px-4 py-3 text-sm leading-snug">
              <span className="font-semibold text-slate-700 dark:text-slate-200">В реестре отечественного ПО</span>
              <span className="mt-1 text-slate-500 dark:text-slate-400">Реестровая запись №30872</span>
            </div>
          </div>

          {/* Группы ссылок: «Продукт» и «Ресурсы» из src/data/nav.mjs */}
          {footerNavGroups.map((group) => (
            <div key={group.title}>
              <p className="text-slate-800 dark:text-slate-100 font-semibold mb-6">{group.title}</p>
              <ul className="space-y-4">
                {group.links.map((link) => (
                  <li key={link.href}>
                    <FooterLink link={link} />
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Contacts */}
          <div id="contacts">
            <p className="text-slate-800 dark:text-slate-100 font-semibold mb-6">Контакты</p>
            <ul className="space-y-4">
              <li>
                <a href="https://t.me/qdmadept" className="flex items-center gap-3 text-slate-500 dark:text-slate-400 hover:text-blue-500 dark:hover:text-blue-400 text-sm transition-colors">
                  <Send size={16} /> @qdmadept
                </a>
              </li>
              <li>
                <a href="mailto:abc@integram.io" className="flex items-center gap-3 text-slate-500 dark:text-slate-400 hover:text-blue-500 dark:hover:text-blue-400 text-sm transition-colors">
                  <Mail size={16} /> abc@integram.io
                </a>
              </li>
              <li>
                <a href="tel:+79955060167" className="flex items-center gap-3 text-slate-500 dark:text-slate-400 hover:text-blue-500 dark:hover:text-blue-400 text-sm transition-colors">
                  <Phone size={16} /> +7 (995) 506-01-67
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-slate-200 dark:border-slate-900 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-slate-400 dark:text-slate-500 text-xs">
            {/* Реквизиты на каждой странице — коммерческий сигнал для Яндекса (issue #578). */}
            © {currentYear} АО «Интеграм». Все права защищены. · ИНН 9716002710 · ОГРН 1247700757590
          </div>
          <div className="text-slate-400 dark:text-slate-500 text-xs italic">
            Не только замена Excel. Промышленный инструмент ускорения разработки.
          </div>
        </div>
      </div>
    </footer>
  )
}
