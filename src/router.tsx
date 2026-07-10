import { createBrowserRouter } from 'react-router-dom'
import Home from './pages/Home'
import NotFound from './pages/NotFound'
import Success from './pages/Success'
import Fail from './pages/Fail'
import ExcelToApp from './pages/ExcelToApp'
import AgentPlatforms from './pages/AgentPlatforms'
import CatalogMatching from './pages/CatalogMatching'
import InformationSystem from './pages/InformationSystem'
import Tokens from './pages/Tokens'
import AdImages from './pages/AdImages'
import KnowledgeBase from './pages/KnowledgeBase'
import KnowledgeBaseArticle from './pages/KnowledgeBaseArticle'
import App from './App'

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
      {
        path: '*',
        element: <NotFound />,
      },
    ],
  },
])
