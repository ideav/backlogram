import { Suspense, useEffect, useState } from 'react'
import { PresenceContext } from 'framer-motion'
import { Outlet, useLocation } from 'react-router-dom'
import { Header } from './components/Header'
import { Footer } from './components/Footer'
import { CookieConsent } from './components/CookieConsent'
import { ThemeProvider } from './context/ThemeContext'

function ScrollToRouteTarget() {
  const { pathname, search, hash } = useLocation()

  useEffect(() => {
    if (!hash) {
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
      return
    }

    const id = hash.slice(1)
    const tryScroll = (attempts = 0) => {
      const el = document.getElementById(id)
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' })
      } else if (attempts < 10) {
        setTimeout(() => tryScroll(attempts + 1), 50)
      }
    }
    tryScroll()
  }, [pathname, search, hash])

  return null
}

// Фолбэк на время подгрузки чанка ленивой страницы. min-h держит подвал внизу,
// чтобы не было скачка вёрстки.
function RouteFallback() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center" role="status" aria-label="Загрузка">
      <div className="h-8 w-8 rounded-full border-2 border-slate-200 dark:border-slate-700 border-t-blue-600 animate-spin" />
    </div>
  )
}

// backlogram#910: страница, отрисованная на сборке, появляется сразу в
// итоговом виде. Элементы framer-motion с initial={{ opacity: 0 }} иначе
// попадали бы в HTML невидимыми и проявлялись бы только после загрузки JS.
// Пока страница гидрируется, контекст «присутствия» говорит им initial: false
// (как AnimatePresence initial={false}) — они рисуются сразу в состоянии
// animate, а whileInView-элементы — без стартового сдвига. Значение
// читается один раз при монтировании, поэтому всё, что появляется после
// гидрации (переходы по сайту, меню), анимируется как раньше. Объект
// контекста остаётся непустым всегда: framer-motion вызывает разный набор
// хуков для пустого и непустого контекста.
const noop = () => {}
const PRESENCE_HYDRATING = { id: 'ssr', isPresent: true, initial: false as const, register: () => noop }
const PRESENCE_LIVE = { id: 'ssr', isPresent: true, register: () => noop }

export default function App() {
  const [hydrated, setHydrated] = useState(false)
  useEffect(() => setHydrated(true), [])

  return (
    <PresenceContext.Provider value={hydrated ? PRESENCE_LIVE : PRESENCE_HYDRATING}>
    <ThemeProvider>
      <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-50 selection:bg-blue-500/30">
        <ScrollToRouteTarget />
        <Header />
        <main>
          <Suspense fallback={<RouteFallback />}>
            <Outlet />
          </Suspense>
        </main>
        <Footer />
        <CookieConsent />
      </div>
    </ThemeProvider>
    </PresenceContext.Provider>
  )
}
