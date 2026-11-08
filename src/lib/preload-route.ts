// backlogram#910: дождаться ленивого чанка страницы до гидрации.
//
// Страницы подключены через React.lazy (src/router.tsx). Если гидрировать
// раньше, чем пришёл чанк, React оставит серверную разметку под Suspense и
// догидрирует её позже — без мигания, но шапка и подвал станут интерактивны
// раньше страницы, а чанк всё равно уже качается (modulepreload из
// scripts/preload-page-chunks.mjs). Проще и предсказуемее дождаться его здесь.

import { matchRoutes, type RouteObject } from 'react-router-dom'
import type { ReactElement } from 'react'

const REACT_LAZY = Symbol.for('react.lazy')

interface LazyType {
  $$typeof: symbol
  _payload: unknown
  _init: (payload: unknown) => unknown
}

function load(element: unknown): Promise<void> | undefined {
  const type = (element as ReactElement | undefined)?.type as unknown as LazyType | undefined
  if (!type || typeof type !== 'object' || type.$$typeof !== REACT_LAZY) return
  try {
    // Тот же вызов, что делает React при рендере: запускает import() и
    // бросает промис, пока модуль не загружен; после — возвращает компонент.
    type._init(type._payload)
  } catch (pending) {
    if (pending && typeof (pending as PromiseLike<unknown>).then === 'function') {
      return Promise.resolve(pending as PromiseLike<unknown>).then(
        () => undefined,
        () => undefined,
      )
    }
  }
}

export async function preloadRoute(routes: RouteObject[], pathname: string): Promise<void> {
  const matches = matchRoutes(routes, pathname) ?? []
  await Promise.all(matches.map(m => load(m.route.element)))
}
