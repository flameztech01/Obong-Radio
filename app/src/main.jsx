import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { createBrowserRouter, RouterProvider } from 'react-router'
import App from './App.jsx' 
import Layout from './components/Layout.jsx'
import Welcome from './pages/Welcome.jsx.jsx'
import Radio from './pages/Radio.jsx'
import Socials from './pages/Socials.jsx'
import Profile from './pages/Profile.jsx'
import Settings from './pages/Settings.jsx'

import Homepage from './pages/Homepage.jsx'

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />, // Root wrapper (must have <Outlet />)
    children: [
      { 
        index: true, 
        element: <Welcome /> // Landing page at "/"
      },
      { 
        path: 'radio', 
        element: <Radio /> // Standalone Radio page at "/radio"
      },
      {
        // Pathless wrapper for your main app pages (Dashboard, Results, etc.)
        element: <Layout />, 
        children: [
          {path: 'home', element: <Homepage />},
          {path: 'socials', element: <Socials />},
          {path: 'profile', element: <Profile />},
          {path: 'settings', element: <Settings />},
          // Add your Layout pages here later, e.g.:
          // { path: 'dashboard', element: <Dashboard /> }
        ]
      }
    ]
  }
])

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
)