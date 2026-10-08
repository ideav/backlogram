import { StrictMode } from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'
import './index.css'
import { App, type PageComponent } from './App'
import { matchPath, toSitePath, type PageKey } from './match'
import { BASE } from './site'
import { installLeadClickTracking, loadAnalytics } from './lib/analytics'
import { captureUtm, installUtmOnConsent } from './lib/utm'

// One chunk per page: a visitor downloads the code for the page they opened.
const loaders: Record<PageKey, () => Promise<{ default: PageComponent }>> = {
  home: () => import('./pages/Home'),
  pricing: () => import('./pages/Pricing'),
  'excel-to-app': () => import('./pages/ExcelToApp'),
  ai: () => import('./pages/Ai'),
  compare: () => import('./pages/Compare'),
  'use-cases': () => import('./pages/UseCases'),
  'use-case': () => import('./pages/UseCase'),
  'knowledge-base': () => import('./pages/KnowledgeBase'),
  'kb-article': () => import('./pages/KbArticle'),
  contact: () => import('./pages/Contact'),
  legal: () => import('./pages/Legal'),
}

captureUtm() // no-op without analytics consent
installUtmOnConsent()
installLeadClickTracking()
loadAnalytics() // no-op unless the visitor has already granted consent

async function boot() {
  const path = toSitePath(window.location.pathname, BASE)
  const match = matchPath(path) ?? { page: 'home' as PageKey }
  const { default: Page } = await loaders[match.page]()
  const root = document.getElementById('root')!
  const tree = (
    <StrictMode>
      <App path={path} Page={Page} slug={match.slug} />
    </StrictMode>
  )
  // Prerendered pages are hydrated; the dev server serves an empty shell.
  if (root.firstElementChild) hydrateRoot(root, tree)
  else createRoot(root).render(tree)
}

boot()
