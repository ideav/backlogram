import { renderToStaticMarkup } from 'react-dom/server'
import { CookieBar, Footer, Header, Home, SuccessPage } from './components'

/**
 * Вход пререндера (scripts/prerender-site-finmo.mjs собирает его esbuild'ом под
 * Node). Здесь только разметка body; head, стили и счётчик делает скрипт.
 */
export function renderPage(path: string): string {
  const page = path === '/success' ? <SuccessPage /> : <Home />
  return renderToStaticMarkup(
    <>
      <Header />
      {page}
      <Footer />
      <CookieBar />
    </>,
  )
}
