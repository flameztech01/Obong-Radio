import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { createBrowserRouter, RouterProvider } from 'react-router'
import App from './App.jsx' 
import store from "./store";
import { Provider } from "react-redux";

// Context
import { AudioPlayerProvider } from './context/AudioPlayerContext'; 

// Layouts
import Layout from './components/Layout.jsx'
import AdminLayout from './components/admin/AdminLayout.jsx'; // <-- Added AdminLayout

// Student Pages
import Welcome from './pages/Welcome.jsx' 
import Register from './pages/Register.jsx'
import Login from './pages/Login.jsx'
import Radio from './pages/Radio.jsx'
import Socials from './pages/Socials.jsx'
import Profile from './pages/Profile.jsx'
import Settings from './pages/Settings.jsx'
import Homepage from './pages/Homepage.jsx'

// Admin Pages
import AdminLogin from './pages/admin/Login.jsx'
import AdminDashboard from './pages/admin/Dashboard.jsx'
import Studio from './pages/admin/Studio.jsx'
import Schedule from './pages/admin/Schedule.jsx'
import UsersRoles from './pages/admin/UserRoles.jsx'

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
        path: 'register',
        element: <Register /> // Registration page at "/register"
      },
      {
        path: 'login',
        element: <Login /> // Login page at "/login"
      },
      { 
        path: 'radio', 
        element: <Radio /> // Standalone Radio page at "/radio"
      },
      
      // ==========================================
      // STUDENT PORTAL (Wrapped in standard Layout)
      // ==========================================
      {
        element: <Layout />, 
        children: [
          {path: 'home', element: <Homepage />},
          {path: 'socials', element: <Socials />},
          {path: 'profile', element: <Profile />},
          {path: 'settings', element: <Settings />},
        ]
      },

      // ==========================================
      // ADMIN PORTAL
      // ==========================================
      {
        path: 'admin',
        children: [
          {
            path: 'login',
            element: <AdminLogin /> // Admin login is standalone (no sidebar)
          },
          {
            // Admin Layout wrapper (Command Center Sidebar + Topbar)
            element: <AdminLayout />,
            children: [
              { 
                path: 'dashboard', 
                element: <AdminDashboard /> 
              },
              { 
                path: 'studio', 
                element: <Studio /> 
              },
              { 
                path: 'schedule', 
                element: <Schedule /> 
              },
              {
                path: 'users',
                element: <UsersRoles />
              },
              // Add more admin routes here later:
              // { path: 'users', element: <AdminUsers /> },
            ]
          }
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