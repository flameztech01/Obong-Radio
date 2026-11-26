// src/components/Sidebar.jsx
import React from 'react';
import { NavLink, useNavigate } from 'react-router';
import { Home, Users, Radio, User, Settings, Play, Pause } from 'lucide-react';
import { useAudioPlayer } from '../context/AudioPlayerContext';

const Sidebar = () => {
  const navigate = useNavigate();
  
  // Get real-time audio data from context
  const { currentShow, isPlaying, isMusicMode, togglePlay } = useAudioPlayer();

  const navItems = [
    { name: 'Home', path: '/home', icon: <Home size={20} /> },
    { name: 'Live Radio', path: '/radio', icon: <Radio size={20} /> },
    { name: 'Socials', path: '/socials', icon: <Users size={20} /> },
    { name: 'Stream Profile', path: '/profile', icon: <User size={20} /> },
    { name: 'Settings', path: '/settings', icon: <Settings size={20} /> },
  ];

  return (
    <aside className="hidden lg:flex flex-col w-[280px] bg-zinc-950 border-r border-zinc-800 h-screen sticky top-0 shrink-0">
      
      {/* =========================================
          Brand Header
          ========================================= */}
      <div 
        onClick={() => navigate('/home')}
        className="h-20 flex items-center px-6 border-b border-zinc-800 gap-3 shrink-0 cursor-pointer hover:bg-zinc-900/50 transition-colors"
      >
        <img 
          src="/logo.jfif" 
          alt="Logo" 
          className="h-9 w-9 object-cover rounded-full border border-zinc-700 bg-white"
        />
        <div>
          <h1 className="font-serif text-[17px] tracking-tight text-white leading-tight">O.B Radio</h1>
          <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Campus Portal</p>
        </div>
      </div>

      {/* =========================================
          Navigation Links
          ========================================= */}
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

      {/* =========================================
          Bottom Widget (Real Mini Player)
          ========================================= */}
      <div className="p-4 border-t border-zinc-800 shrink-0">
        <div 
          onClick={() => navigate('/radio')}
          className="bg-zinc-900 border border-zinc-800 rounded-2xl p-3 relative overflow-hidden group cursor-pointer hover:border-yellow-500/50 transition-colors"
        >
          <div className="flex items-center gap-3 relative z-10">
            
            {/* Cover Image */}
            <div className="h-11 w-11 rounded-lg overflow-hidden border border-zinc-700 shrink-0 bg-zinc-950">
              <img 
                src={currentShow.image} 
                alt="Cover" 
                className="h-full w-full object-cover" 
              />
            </div>

            {/* Track Info */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className="relative flex h-1.5 w-1.5">
                  <span className={`absolute inline-flex h-full w-full rounded-full ${isMusicMode ? 'bg-yellow-500' : 'bg-red-500'} opacity-75 ${isPlaying ? 'animate-ping' : ''}`}></span>
                  <span className={`relative inline-flex h-1.5 w-1.5 rounded-full ${isMusicMode ? 'bg-yellow-500' : 'bg-red-500'}`}></span>
                </span>
                <p className={`text-[9px] font-bold uppercase tracking-wider ${isMusicMode ? 'text-yellow-500' : 'text-red-500'}`}>
                  {isMusicMode ? 'Auto DJ' : 'Live Radio'}
                </p>
              </div>
              <p className="text-[12.5px] font-semibold text-white truncate leading-tight">{currentShow.title}</p>
              <p className="text-[10.5px] text-zinc-400 truncate mt-0.5">{currentShow.host}</p>
            </div>

            {/* Play/Pause Button inside Widget */}
            <button 
              onClick={(e) => { e.stopPropagation(); togglePlay(); }}
              className="h-8 w-8 rounded-full bg-yellow-500 text-zinc-950 flex items-center justify-center shrink-0 hover:scale-105 active:scale-95 transition-transform"
            >
              {isPlaying ? <Pause size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" className="ml-0.5" />}
            </button>
          </div>
          
          {/* Subtle glow in the background */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-500/5 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none group-hover:bg-yellow-500/10 transition-colors"></div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;