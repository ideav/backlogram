import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Menu, X, Sun, Moon } from 'lucide-react'
import { useState } from 'react'
import { useTheme } from '../context/ThemeContext'

export function Header() {
  const [isOpen, setIsOpen] = useState(false)
  const { theme, toggleTheme } = useTheme()

  const navLinks = [
    { name: 'Технология', href: '/#technology' },
    { name: 'Как работаем', href: '/#process' },
    { name: 'Примеры', href: '/#cases' },
    { name: 'Цены', href: '/#pricing' },
    { name: 'База знаний', href: '/knowledge-base.html' },
    { name: 'Блог', href: 'https://blog.ideav.ru/', external: true },
  ]

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link to="/" className="text-xl font-bold tracking-tight flex items-center gap-2">
              <span className="bg-blue-600 w-8 h-8 rounded flex items-center justify-center text-white font-black italic">I</span>
              <span>Интеграм</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                {...(link.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                className="text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-blue-500 dark:hover:text-blue-400 transition-colors"
              >
                {link.name}
              </a>
            ))}
            <button
              onClick={toggleTheme}
              aria-label={theme === 'dark' ? 'Включить светлую тему' : 'Включить тёмную тему'}
              className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:text-blue-500 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <a
              href="https://ideav.ru/start.html"
              target="start"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-all"
            >
              Начать
            </a>
          </nav>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center gap-2">
            <button
              onClick={toggleTheme}
              aria-label={theme === 'dark' ? 'Включить светлую тему' : 'Включить тёмную тему'}
              className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:text-blue-500 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            >
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="md:hidden bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800"
        >
          <div className="px-4 pt-2 pb-6 space-y-1">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                onClick={() => setIsOpen(false)}
                {...(link.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                className="block px-3 py-4 text-base font-medium text-slate-600 dark:text-slate-300 hover:text-blue-500 dark:hover:text-blue-400 border-b border-slate-100 dark:border-slate-800/50"
              >
                {link.name}
              </a>
            ))}
            <div className="pt-4 px-3">
              <a
                href="https://ideav.ru/start.html"
                target="start"
                rel="noopener noreferrer"
                onClick={() => setIsOpen(false)}
                className="flex items-center justify-center w-full px-4 py-3 bg-blue-600 text-white font-semibold rounded-lg"
              >
                Войти
              </a>
            </div>
          </div>
        </motion.div>
      )}
    </header>
  )
}
