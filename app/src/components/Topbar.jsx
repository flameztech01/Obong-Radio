// src/components/Topbar.jsx
import React from 'react';
import { Search, Bell } from 'lucide-react';

const Topbar = () => {
  return (
    <header className="sticky top-0 z-40 h-16 w-full bg-zinc-950/80 backdrop-blur-xl border-b border-zinc-800/80 flex items-center justify-between px-4 lg:px-8 shrink-0 transition-all">
      
      {/* =========================================
          LEFT SIDE: Logo
          ========================================= */}
      <div className="flex items-center gap-3">
        {/* Using the Unsplash image as a placeholder for the logo to match the current aesthetic */}
        <div className="h-8 w-8 rounded-full overflow-hidden border border-zinc-700 shadow-sm shrink-0">
          <img 
            src="https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?q=80&w=100&auto=format&fit=crop" 
            alt="O.U Radio" 
            className="h-full w-full object-cover"
          />
        </div>
        <div className="hidden sm:block">
          <h1 className="font-serif text-[15px] font-semibold tracking-tight text-white leading-none mb-0.5">
            Obong University
          </h1>
          <p className="text-[9px] font-bold text-yellow-500 uppercase tracking-widest">
            Campus Radio
          </p>
        </div>
      </div>

      {/* =========================================
          RIGHT SIDE: Search, Status & Profile
          ========================================= */}
      <div className="flex items-center gap-3 sm:gap-4">
        
        {/* Desktop Search Bar (Optional, but looks good) */}
        <div className="hidden md:flex relative items-center">
          <Search className="absolute left-3 text-zinc-500" size={14} />
          <input 
            type="text" 
            placeholder="Search..." 
            className="w-48 rounded-full border border-zinc-800 bg-zinc-900/50 py-1.5 pl-9 pr-4 text-[12px] text-white placeholder-zinc-500 focus:border-yellow-500/50 focus:outline-none focus:ring-1 focus:ring-yellow-500/50 transition-all"
          />
        </div>

        {/* Mobile Search Icon */}
        <button className="md:hidden p-2 text-zinc-400 hover:text-white transition-colors">
          <Search size={20} />
        </button>

        {/* Live Indicator (Subtle) */}
        <div className="hidden sm:flex items-center gap-2 bg-zinc-900 border border-zinc-800 px-3 py-1.5 rounded-full">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
          </span>
          <span className="text-[10px] font-bold text-zinc-300 tracking-wider">LIVE</span>
        </div>

        {/* Notification Bell */}
        <button className="relative p-2 text-zinc-400 hover:text-white transition-colors hidden sm:block">
          <Bell size={20} />
          <span className="absolute top-2 right-2.5 h-1.5 w-1.5 rounded-full bg-yellow-500 border border-zinc-950"></span>
        </button>

        {/* User Avatar (Logo.jfif) */}
        <div className="h-8 w-8 rounded-full overflow-hidden border border-zinc-700 shrink-0 cursor-pointer hover:border-yellow-500/50 transition-colors bg-white">
          <img 
            src="/logo.jfif" 
            alt="Logo" 
            className="h-full w-full object-cover"
          />
        </div>
      </div>

    </header>
  );
};

export default Topbar;