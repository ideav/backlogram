// backlogram#910: серверная точка входа — рендер настоящего React-дерева каждой
// страницы на сборке. Собирается `vite build --ssr` в dist-ssr/, вызывается из
// scripts/render-ssr.mjs; в браузерный бандл не попадает.
import { StrictMode } from 'react'
// Web-стримы (есть в Node 18+): в отличие от renderToPipeableStream не тянут
// типы node:stream, а allReady так же ждёт все ленивые чанки.
import { renderToReadableStream } from 'react-dom/server.browser'
import {
  createStaticHandler,
  createStaticRouter,
  matchRoutes,
  StaticRouterProvider,
} from 'react-router-dom'
import { routes } from './router'

/** Есть ли у адреса своя страница (не только «*» → NotFound). */
export function hasRoute(pathname: string): boolean {
  const matches = matchRoutes(routes, pathname) ?? []
  const leaf = matches[matches.length - 1]
  return Boolean(leaf && leaf.route.path !== '*')
}

/**
 * HTML содержимого #root для адреса. Ждёт все ленивые чанки (allReady),
 * так что в разметке страница целиком, без фолбэка Suspense.
 */
export async function render(pathname: string): Promise<string> {
  const handler = createStaticHandler(routes)
  const context = await handler.query(new Request(`https://ideav.ru${pathname}`))
  if (context instanceof Response) throw new Error(`render(${pathname}): ответ ${context.status}`)
  const router = createStaticRouter(handler.dataRoutes, context)

  let failed: unknown = null
  const stream = await renderToReadableStream(
    <StrictMode>
      <StaticRouterProvider router={router} context={context} hydrate={false} />
    </StrictMode>,
    {
      onError(error) {
        failed = error
      },
    },
  )
  await stream.allReady
  const html = await new Response(stream).text()
  // Ошибка рендера внутри Suspense не роняет поток (React отдаёт фолбэк и
  // дорисует на клиенте) — для сборки это брак страницы, поэтому падаем.
  if (failed) throw failed
  return html
}
