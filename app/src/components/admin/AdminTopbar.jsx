// src/components/admin/AdminTopbar.jsx
import React from 'react';
import { Menu, Bell, ShieldCheck, Terminal } from 'lucide-react';
import { useAudioPlayer } from '../../context/AudioPlayerContext';

const AdminTopbar = () => {
  const { isPlaying, isMusicMode } = useAudioPlayer();
  const isLive = isPlaying && !isMusicMode;

  return (
    <header className="sticky top-0 z-40 h-16 w-full bg-[#0c0c0c]/90 backdrop-blur-xl border-b border-zinc-800/80 flex items-center justify-between px-4 lg:px-8 shrink-0 transition-all">
      
      {/* Mobile Brand / Menu (if needed later) */}
      <div className="flex items-center gap-3">
        <button className="lg:hidden p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-900 transition-colors">
          <Menu size={22} />
        </button>
        <div className="hidden sm:flex items-center gap-2 text-zinc-500 font-mono text-xs tracking-widest">
          <Terminal size={14} className="text-red-500" />
          <span>ROOT@OBONG-RADIO:~$</span>
        </div>
      </div>

      {/* Right Side: Status & Profile */}
      <div className="flex items-center gap-3 sm:gap-5">
        
        {/* Live Stream Status */}
        <div className={`hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full border ${
          isLive 
            ? 'bg-red-500/10 border-red-500/30 text-red-500' 
            : 'bg-zinc-900 border-zinc-800 text-zinc-500'
        }`}>
          <span className="relative flex h-2 w-2">
            {isLive && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>}
            <span className={`relative inline-flex rounded-full h-2 w-2 ${isLive ? 'bg-red-500' : 'bg-zinc-600'}`}></span>
          </span>
          <span className="text-[10px] font-bold tracking-wider uppercase">
            {isLive ? 'Station Live' : 'Station Offline'}
          </span>
        </div>

        {/* Notifications */}
        <button className="relative p-2 text-zinc-400 hover:text-white transition-colors">
          <Bell size={20} />
          <span className="absolute top-2 right-2.5 h-1.5 w-1.5 rounded-full bg-red-500 border border-[#0c0c0c]"></span>
        </button>

        {/* Security Badge */}
        <div className="h-8 w-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-emerald-500">
          <ShieldCheck size={18} />
        </div>
      </div>

    </header>
  );
};

export default AdminTopbar;