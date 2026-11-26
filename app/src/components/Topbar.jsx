// src/components/Topbar.jsx
import React from 'react';
import { Search, Bell, LogIn } from 'lucide-react';
import { Link, useNavigate } from 'react-router';
import { useGetMeQuery } from '../features/authApiSlice';
import { useAudioPlayer } from '../context/AudioPlayerContext';

const Topbar = () => {
  const navigate = useNavigate();
  const { data: userData } = useGetMeQuery();
  const { isPlaying, isMusicMode } = useAudioPlayer();
  
  const user = userData?.user;
  const isLive = isPlaying && !isMusicMode;

  return (
    <header className="sticky top-0 z-40 h-16 w-full bg-zinc-950/80 backdrop-blur-xl border-b border-zinc-800/80 flex items-center justify-between px-4 lg:px-8 shrink-0 transition-all">
      
      {/* =========================================
          LEFT SIDE: Logo & Brand
          ========================================= */}
      <Link to="/home" className="flex items-center gap-3 group">
        <div className="h-8 w-8 rounded-full overflow-hidden border border-zinc-700 shadow-sm shrink-0 bg-white transition-colors group-hover:border-yellow-500/50">
          <img 
            src="/logo.jfif" 
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
      </Link>

      {/* =========================================
          RIGHT SIDE: Search, Status & Profile
          ========================================= */}
      <div className="flex items-center gap-3 sm:gap-4">
        
        {/* Desktop Search Bar */}
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

        {/* Live Indicator - Only shows when LIVE, not Auto DJ */}
        {isLive && (
          <div className="hidden sm:flex items-center gap-2 bg-red-500/10 border border-red-500/20 px-3 py-1.5 rounded-full animate-in fade-in duration-300">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
            </span>
            <span className="text-[10px] font-bold text-red-400 tracking-wider">LIVE</span>
          </div>
        )}

        {/* Notification Bell */}
        <button className="relative p-2 text-zinc-400 hover:text-white transition-colors hidden sm:block">
          <Bell size={20} />
          <span className="absolute top-2 right-2.5 h-1.5 w-1.5 rounded-full bg-yellow-500 border border-zinc-950"></span>
        </button>

        {/* =========================================
            USER AVATAR OR SIGN IN BUTTON
            ========================================= */}
        {user ? (
          // Logged In: Show Avatar / Initial
          <button 
            onClick={() => navigate('/profile')}
            className="h-9 w-9 rounded-full overflow-hidden border border-zinc-700 shrink-0 cursor-pointer hover:border-yellow-500 transition-colors bg-zinc-900 flex items-center justify-center"
          >
            {user.profilePicture ? (
              <img 
                src={user.profilePicture} 
                alt={user.name} 
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="text-[13px] font-bold text-yellow-500">
                {user.name?.charAt(0).toUpperCase()}
              </span>
            )}
          </button>
        ) : (
          // Logged Out: Show Sign In Button
          <Link 
            to="/"
            className="flex items-center gap-1.5 rounded-full bg-yellow-500 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-zinc-950 transition-all hover:bg-yellow-400 active:scale-95"
          >
            <LogIn size={14} />
            <span className="hidden sm:inline">Sign In</span>
          </Link>
        )}
      </div>

    </header>
  );
};

export default Topbar;