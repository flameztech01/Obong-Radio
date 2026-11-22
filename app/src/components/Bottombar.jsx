// src/components/Bottombar.jsx
import React from 'react';
import { NavLink } from 'react-router';
import { Home, Users, Radio, User, Settings } from 'lucide-react';

const Bottombar = () => {
  const navItems = [
    { name: 'Home', path: '/home', icon: <Home size={20} /> },
    { name: 'Socials', path: '/socials', icon: <Users size={20} /> },
    { name: 'Radio', path: '/radio', icon: <Radio size={26} />, isCenter: true },
    { name: 'Profile', path: '/profile', icon: <User size={20} /> },
    { name: 'Settings', path: '/settings', icon: <Settings size={20} /> },
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-zinc-950/90 backdrop-blur-xl border-t border-zinc-800 pb-safe">
      <div className="flex justify-around items-end h-16 px-2">
        {navItems.map((item) => {
          // Special rendering for the center Radio button
          if (item.isCenter) {
            return (
              <div key={item.name} className="relative -top-5 flex flex-col items-center">
                <NavLink
                  to={item.path}
                  className={({ isActive }) => `
                    flex items-center justify-center w-14 h-14 rounded-full shadow-[0_0_20px_rgba(234,179,8,0.3)] border-4 border-zinc-950 transition-all active:scale-95
                    ${isActive ? 'bg-yellow-400 text-zinc-950' : 'bg-yellow-500 text-zinc-950 hover:bg-yellow-400'}
                  `}
                >
                  {item.icon}
                </NavLink>
                <span className="text-[9px] font-bold text-zinc-400 mt-1 uppercase tracking-wider">
                  {item.name}
                </span>
              </div>
            );
          }

          // Standard links
          return (
            <NavLink
              key={item.name}
              to={item.path}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center w-16 h-full space-y-1 transition-colors ${
                  isActive ? 'text-yellow-500' : 'text-zinc-500 hover:text-zinc-300'
                }`
              }
            >
              {item.icon}
              <span className="text-[10px] font-bold uppercase tracking-wider">{item.name}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};

export default Bottombar;