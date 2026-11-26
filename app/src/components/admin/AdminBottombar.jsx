// src/components/admin/AdminBottombar.jsx
import React from 'react';
import { NavLink } from 'react-router';
import { LayoutDashboard, Mic2, Users, Settings } from 'lucide-react';

const AdminBottombar = () => {
  const navItems = [
    { name: 'Dash', path: '/admin/dashboard', icon: <LayoutDashboard size={20} /> },
    { name: 'Users', path: '/admin/users', icon: <Users size={20} /> },
    { name: 'Studio', path: '/admin/studio', icon: <Mic2 size={26} />, isCenter: true },
    { name: 'Settings', path: '/admin/settings', icon: <Settings size={20} /> },
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#0c0c0c]/95 backdrop-blur-xl border-t border-zinc-800 pb-safe">
      <div className="flex justify-around items-end h-16 px-2">
        {navItems.map((item) => {
          if (item.isCenter) {
            return (
              <div key={item.name} className="relative -top-5 flex flex-col items-center">
                <NavLink
                  to={item.path}
                  className={({ isActive }) => `
                    flex items-center justify-center w-14 h-14 rounded-full shadow-[0_0_20px_rgba(239,68,68,0.3)] border-4 border-[#0c0c0c] transition-all active:scale-95
                    ${isActive ? 'bg-red-400 text-zinc-950' : 'bg-red-600 text-white hover:bg-red-500'}
                  `}
                >
                  {item.icon}
                </NavLink>
                <span className="text-[9px] font-bold text-zinc-400 mt-1 uppercase tracking-wider font-mono">
                  {item.name}
                </span>
              </div>
            );
          }

          return (
            <NavLink
              key={item.name}
              to={item.path}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center w-16 h-full space-y-1 transition-colors ${
                  isActive ? 'text-red-500' : 'text-zinc-500 hover:text-zinc-300'
                }`
              }
            >
              {item.icon}
              <span className="text-[10px] font-bold uppercase tracking-wider font-mono">{item.name}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};

export default AdminBottombar;