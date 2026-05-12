import { Link } from 'react-router-dom'
import { Send, Mail, Phone, ExternalLink } from 'lucide-react'

export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-900 pt-16 pb-8 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          {/* Brand and Mission */}
          <div className="lg:col-span-1">
            <Link to="/" className="text-xl font-bold tracking-tight flex items-center gap-2 mb-6">
              <span className="bg-blue-600 w-8 h-8 rounded flex items-center justify-center text-white font-black italic shadow-lg shadow-blue-900/20">I</span>
              <span>Интеграм</span>
            </Link>
            <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed mb-6">
              Промышленная платформа для корпоративной разработки без программирования.<br />
              Разгружаем программистов, сохраняя контроль над архитектурой и безопасностью.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-slate-800 dark:text-slate-100 font-semibold mb-6">Продукт</h3>
            <ul className="space-y-4">
              <li><a href="/#technology" className="text-slate-500 dark:text-slate-400 hover:text-blue-500 dark:hover:text-blue-400 text-sm transition-colors">Технология</a></li>
              <li><a href="/#process" className="text-slate-500 dark:text-slate-400 hover:text-blue-500 dark:hover:text-blue-400 text-sm transition-colors">Схема работы</a></li>
              <li><a href="/#cases" className="text-slate-500 dark:text-slate-400 hover:text-blue-500 dark:hover:text-blue-400 text-sm transition-colors">Примеры</a></li>
              <li><a href="/#pricing" className="text-slate-500 dark:text-slate-400 hover:text-blue-500 dark:hover:text-blue-400 text-sm transition-colors">Стоимость</a></li>
            </ul>
          </div>

          {/* Documentation / Legal */}
          <div>
            <h3 className="text-slate-800 dark:text-slate-100 font-semibold mb-6">Ресурсы</h3>
            <ul className="space-y-4">
              <li><a href="https://help.integram.io/" target="_blank" rel="noopener noreferrer" className="text-slate-500 dark:text-slate-400 hover:text-blue-500 dark:hover:text-blue-400 text-sm transition-colors flex items-center gap-2">Документация <ExternalLink size={12} /></a></li>
              <li><Link to="/knowledge-base.html" className="text-slate-500 dark:text-slate-400 hover:text-blue-500 dark:hover:text-blue-400 text-sm transition-colors">База знаний</Link></li>
              <li><a href="https://integram.io/api.html" target="_blank" rel="noopener noreferrer" className="text-slate-500 dark:text-slate-400 hover:text-blue-500 dark:hover:text-blue-400 text-sm transition-colors">Интеграции</a></li>
              <li><Link to="/tokens.html" className="text-slate-500 dark:text-slate-400 hover:text-blue-500 dark:hover:text-blue-400 text-sm transition-colors">Токены</Link></li>
              <li><a href="https://integram.io/terms.html" target="_blank" rel="noopener noreferrer" className="text-slate-500 dark:text-slate-400 hover:text-blue-500 dark:hover:text-blue-400 text-sm transition-colors">Правила использования</a></li>
              <li><a href="https://rutube.ru/channel/41204904/videos/" target="_blank" rel="noopener noreferrer" className="text-slate-500 dark:text-slate-400 hover:text-blue-500 dark:hover:text-blue-400 text-sm transition-colors">RUTUBE</a></li>
              <li><a href="https://blog.ideav.online/" target="_blank" rel="noopener noreferrer" className="text-slate-500 dark:text-slate-400 hover:text-blue-500 dark:hover:text-blue-400 text-sm transition-colors flex items-center gap-2">Блог <ExternalLink size={12} /></a></li>
            </ul>
          </div>

          {/* Contacts */}
          <div id="contacts">
            <h3 className="text-slate-800 dark:text-slate-100 font-semibold mb-6">Контакты</h3>
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
            © {currentYear} АО «Интеграм». Все права защищены.
          </div>
          <div className="text-slate-400 dark:text-slate-500 text-xs italic">
            Не только замена Excel. Промышленный инструмент ускорения разработки.
          </div>
        </div>
      </div>
    </footer>
  )
}
