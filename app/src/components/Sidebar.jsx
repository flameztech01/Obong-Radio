// src/components/Sidebar.jsx
import React from 'react';
import { NavLink } from 'react-router';
import { Home, Users, Radio, User, Settings, Headphones } from 'lucide-react';

const Sidebar = () => {
  const navItems = [
    { name: 'Home', path: '/home', icon: <Home size={20} /> },
    { name: 'Live Radio', path: '/radio', icon: <Radio size={20} /> },
    { name: 'Socials', path: '/socials', icon: <Users size={20} /> },
    { name: 'Stream Profile', path: '/profile', icon: <User size={20} /> },
    { name: 'Settings', path: '/settings', icon: <Settings size={20} /> },
  ];

  return (
    <aside className="hidden lg:flex flex-col w-[280px] bg-zinc-950 border-r border-zinc-800 h-screen sticky top-0 shrink-0">
      
      {/* Brand Header */}
      <div className="h-20 flex items-center px-6 border-b border-zinc-800 gap-3 shrink-0">
        {/* Replace with your actual logo path if you have it */}
        <img 
          src="https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?q=80&w=100&auto=format&fit=crop" 
          alt="Logo" 
          className="h-9 w-9 object-cover rounded-full border border-zinc-700"
        />
        <div>
          <h1 className="font-serif text-[17px] tracking-tight text-white leading-tight">O.U Radio</h1>
          <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Campus Portal</p>
        </div>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 py-6 px-4 space-y-1.5 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl text-[13.5px] font-semibold transition-all ${
                isActive
                  ? 'bg-zinc-900 text-yellow-500 border border-zinc-800'
                  : 'text-zinc-400 border border-transparent hover:bg-zinc-900/50 hover:text-white'
              }`
            }
          >
            {item.icon}
            {item.name}
          </NavLink>
        ))}
      </div>

      {/* Bottom Widget (Mini Player Placeholder) */}
      <div className="p-4 border-t border-zinc-800 shrink-0">
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 relative overflow-hidden group cursor-pointer hover:border-yellow-500/50 transition-colors">
          <div className="flex items-center gap-3 relative z-10">
            <div className="h-10 w-10 bg-zinc-950 rounded-full flex items-center justify-center border border-zinc-800 shrink-0">
              <Headphones size={18} className="text-yellow-500" />
            </div>
            <div className="min-w-0">
              <p className="text-[9px] font-bold uppercase tracking-widest text-yellow-500 mb-0.5">Now Playing</p>
              <p className="text-[12px] font-semibold text-white truncate">Morning Drive Show</p>
              <p className="text-[10px] text-zinc-500 truncate">Tobi & Amaka</p>
            </div>
          </div>
          
          {/* Subtle glow in the background */}
          <div className="absolute top-0 right-0 w-24 h-24 bg-yellow-500/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none group-hover:bg-yellow-500/20 transition-colors"></div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;