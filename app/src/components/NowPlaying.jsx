// src/components/NowPlaying.jsx
import React from 'react';
import { useNavigate, useLocation } from 'react-router';
import { Play, Pause, Radio, ChevronRight } from 'lucide-react';

const NowPlaying = ({ 
  currentShow = { 
    title: 'Morning Drive Show', 
    host: 'Tobi & Amaka', 
    image: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?q=80&w=200&auto=format&fit=crop' 
  }, 
  isPlaying = false, 
  onTogglePlay 
}) => {
  const navigate = useNavigate();
  const location = useLocation();

  // Hide the mini-player if we are already on the radio page
  if (location.pathname === '/radio') return null;

  const handlePlayClick = (e) => {
    e.stopPropagation(); // Prevent navigating to the radio page when clicking play
    if (onTogglePlay) onTogglePlay();
  };

  return (
    <div 
      onClick={() => navigate('/radio')}
      className="
        fixed z-40 flex items-center justify-between 
        bg-zinc-900/95 backdrop-blur-xl border border-zinc-800 shadow-[0_10px_40px_rgba(0,0,0,0.5)] 
        rounded-xl p-2.5 cursor-pointer hover:bg-zinc-800/90 transition-all group animate-in slide-in-from-bottom-5
        /* Mobile Positioning: Floats above the bottombar */
        bottom-[76px] left-3 right-3 
        /* Desktop Positioning: Floating bottom right */
        md:bottom-6 md:right-6 md:w-[380px] md:left-auto
      "
    >
      <div className="flex items-center gap-3 min-w-0">
        {/* Cover Image */}
        <div className="relative h-11 w-11 shrink-0 rounded-lg overflow-hidden border border-zinc-700/50">
          <img 
            src={currentShow.image} 
            alt="Cover" 
            className="h-full w-full object-cover" 
          />
          {/* Subtle Play overlay on hover */}
          <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors"></div>
        </div>

        {/* Text Info */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className="relative flex h-1.5 w-1.5">
              <span className={`absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75 ${isPlaying ? 'animate-ping' : ''}`}></span>
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-red-500"></span>
            </span>
            <p className="text-[9px] font-bold uppercase tracking-wider text-yellow-500">Live Radio</p>
          </div>
          <p className="truncate text-[13px] font-semibold text-white leading-tight">
            {currentShow.title}
          </p>
          <p className="truncate text-[10px] text-zinc-400 mt-0.5">
            {currentShow.host}
          </p>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-2 pl-3 shrink-0">
        <button 
          onClick={handlePlayClick}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-yellow-500 text-zinc-950 hover:scale-105 active:scale-95 transition-transform"
        >
          {isPlaying ? (
            <Pause size={16} fill="currentColor" />
          ) : (
            <Play size={16} fill="currentColor" className="ml-0.5" />
          )}
        </button>
        <ChevronRight size={18} className="text-zinc-500 hidden sm:block" />
      </div>
    </div>
  );
};

export default NowPlaying;