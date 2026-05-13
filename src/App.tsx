import { useEffect } from 'react'
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

export default function App() {
  return (
    <ThemeProvider>
      <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-50 selection:bg-blue-500/30 transition-colors duration-300">
        <ScrollToRouteTarget />
        <Header />
        <main>
          <Outlet />
        </main>
        <Footer />
        <CookieConsent />
      </div>
    </ThemeProvider>
  )
}
