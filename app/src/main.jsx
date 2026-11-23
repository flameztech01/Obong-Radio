import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { createBrowserRouter, RouterProvider } from 'react-router'
import App from './App.jsx' 
import store from "./store";
import { Provider } from "react-redux";

// Context
import { AudioPlayerProvider } from './context/AudioPlayerContext'; 

// Pages & Layout
import Layout from './components/Layout.jsx'
import Welcome from './pages/Welcome.jsx' // (Fixed the double .jsx.jsx)
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
        // Pathless wrapper for your main app pages
        element: <Layout />, 
        children: [
          {path: 'home', element: <Homepage />},
          {path: 'socials', element: <Socials />},
          {path: 'profile', element: <Profile />},
          {path: 'settings', element: <Settings />},
        ]
      }
    ]
  }
])

createRoot(document.getElementById('root')).render(
  <Provider store={store}>
      <StrictMode>
        {/* Wrap the Router so audio plays globally across all pages */}
        <AudioPlayerProvider>
          <RouterProvider router={router} />
        </AudioPlayerProvider>
      </StrictMode>
  </Provider>
)