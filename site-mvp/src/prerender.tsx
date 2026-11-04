import { renderToStaticMarkup } from 'react-dom/server'
import { CallmePage, CookieBar, Footer, Header, Home, SuccessPage } from './components'

/**
 * Вход пререндера (scripts/prerender-site-mvp.mjs собирает его esbuild'ом под
 * Node). Здесь только разметка body; head, стили и счётчик делает скрипт.
 */
export function renderPage(path: string): string {
  const page =
    path === '/success' ? <SuccessPage /> : path === '/ideav_callme' ? <CallmePage /> : <Home />
  return renderToStaticMarkup(
    <>
      <Header />
      {page}
      <Footer withLinks={path === '/'} />
      <CookieBar />
    </>,
  )
}
