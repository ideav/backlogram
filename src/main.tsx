import { StrictMode } from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import './index.css'
import { createRouter, routes } from './router'
import { installTypography } from './lib/install-typography'
import { preloadRoute } from './lib/preload-route'

const container = document.getElementById('root')!

// Живая микротипографика (issue #753) ставится до монтирования, а не эффектом:
// при гидрации React сверяет серверный текст (там уже &nbsp; из
// scripts/apply-typography.mjs) со своими строками, считает U+00A0 и пробел
// равными (плагин hydrateNbsp в vite.config.ts) и переписывает узел обычными
// пробелами. Наблюдатель склеивает его обратно в микрозадаче — до отрисовки
// кадра, так что на экране текст не меняется.
installTypography()

const app = (
  <StrictMode>
    <RouterProvider router={createRouter()} />
  </StrictMode>
)

// backlogram#910: в собранных страницах #root уже содержит настоящую страницу,
// отрисованную на сборке (scripts/render-ssr.mjs ставит data-ssr) — её
// гидрируем. В dev-сервере #root пуст — обычный рендер.
if (container.hasAttribute('data-ssr')) {
  preloadRoute(routes, window.location.pathname).then(() => hydrateRoot(container, app))
} else {
  createRoot(container).render(app)
}
