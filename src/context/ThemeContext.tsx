import { createContext, useContext, useEffect, useState } from 'react'

type Theme = 'dark' | 'light'

interface ThemeContextValue {
  theme: Theme
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: 'light',
  toggleTheme: () => {},
})

// Класс темы на <html> ставит inline-скрипт в index.html ещё до первой
// отрисовки, поэтому здесь его трогает только переключатель.
function applyTheme(theme: Theme) {
  const root = document.documentElement
  root.classList.toggle('dark', theme === 'dark')
  root.classList.toggle('light', theme === 'light')
  try {
    localStorage.setItem('theme', theme)
  } catch {
    // приватный режим или запрет хранилища — тема просто не запомнится
  }
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // backlogram#910: страница рендерится на сборке и гидрируется в браузере —
  // первый рендер обязан совпадать с серверным, поэтому сохранённая тема
  // читается только после него. Разметка от темы не зависит (иконки
  // переключателя меняет CSS-класс dark:), так что смена состояния ничего не
  // перерисовывает на экране.
  const [theme, setTheme] = useState<Theme>('light')

  useEffect(() => {
    let stored: string | null = null
    try {
      stored = localStorage.getItem('theme')
    } catch {
      stored = null
    }
    if (stored === 'dark') setTheme(stored)
  }, [])

  function toggleTheme() {
    const next: Theme = theme === 'dark' ? 'light' : 'dark'
    applyTheme(next)
    setTheme(next)
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  return useContext(ThemeContext)
}
