import { createBrowserRouter } from 'react-router-dom'
import Home from './pages/Home'
import NotFound from './pages/NotFound'
import Success from './pages/Success'
import Fail from './pages/Fail'
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
        path: 'success',
        element: <Success />,
      },
      {
        path: 'fail',
        element: <Fail />,
      },
      {
        path: '*',
        element: <NotFound />,
      },
    ],
  },
])
