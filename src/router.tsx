import { lazy } from 'react'
import { createBrowserRouter } from 'react-router-dom'
import Home from './pages/Home'
import { USE_CASES } from './data/usecases'
import App from './App'

// Главная и layout грузятся сразу (самый частый вход). Остальные страницы —
// по требованию (code-splitting), чтобы начальный бандл не тянул код всех
// разделов и первый экран открывался быстрее (issue #451).
const NotFound = lazy(() => import('./pages/NotFound'))
const Success = lazy(() => import('./pages/Success'))
const Fail = lazy(() => import('./pages/Fail'))
const ExcelToApp = lazy(() => import('./pages/ExcelToApp'))
const AgentPlatforms = lazy(() => import('./pages/AgentPlatforms'))
const CatalogMatching = lazy(() => import('./pages/CatalogMatching'))
const ExcelConstructor = lazy(() => import('./pages/ExcelConstructor'))
const InformationSystem = lazy(() => import('./pages/InformationSystem'))
const Tokens = lazy(() => import('./pages/Tokens'))
const AdImages = lazy(() => import('./pages/AdImages'))
const KnowledgeBase = lazy(() => import('./pages/KnowledgeBase'))
const KnowledgeBaseArticle = lazy(() => import('./pages/KnowledgeBaseArticle'))
const UseCaseLanding = lazy(() => import('./pages/UseCaseLanding'))
const UseCaseHub = lazy(() => import('./pages/UseCaseHub'))

export const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      {
        index: true,
        element: <Home />,
      },
      {
        path: 'success.html',
        element: <Success />,
      },
      {
        path: 'fail.html',
        element: <Fail />,
      },
      {
        path: 'excel-to-app.html',
        element: <ExcelToApp />,
      },
      {
        path: 'agent-platforms.html',
        element: <AgentPlatforms />,
      },
      {
        path: 'agent-platforms',
        element: <AgentPlatforms />,
      },
      {
        path: 'catalog-matching.html',
        element: <CatalogMatching />,
      },
      {
        path: 'catalog-matching',
        element: <CatalogMatching />,
      },
      {
        path: 'konstruktor-prilozhenij.html',
        element: <ExcelConstructor />,
      },
      {
        path: 'konstruktor-prilozhenij',
        element: <ExcelConstructor />,
      },
      {
        path: 'informatsionnaya-sistema.html',
        element: <InformationSystem />,
      },
      {
        path: 'informatsionnaya-sistema',
        element: <InformationSystem />,
      },
      {
        path: 'tokens.html',
        element: <Tokens />,
      },
      {
        path: 'ad-images.html',
        element: <AdImages />,
      },
      {
        path: 'knowledge-base.html',
        element: <KnowledgeBase />,
      },
      {
        path: 'knowledge-base',
        element: <KnowledgeBase />,
      },
      {
        path: 'knowledge-base/:slug',
        element: <KnowledgeBaseArticle />,
      },
      // Хаб тематических решений (issue #431)
      {
        path: 'resheniya.html',
        element: <UseCaseHub />,
      },
      {
        path: 'resheniya',
        element: <UseCaseHub />,
      },
      // 10 тематических лендингов «замена Excel по задаче» — генерируются из
      // src/data/usecases.mjs (тот же источник, что у пререндера).
      ...USE_CASES.flatMap((u) => [
        { path: `${u.slug}.html`, element: <UseCaseLanding slug={u.slug} /> },
        { path: u.slug, element: <UseCaseLanding slug={u.slug} /> },
      ]),
      {
        path: '*',
        element: <NotFound />,
      },
    ],
  },
])
