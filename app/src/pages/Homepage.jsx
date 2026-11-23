// src/pages/Homepage.jsx
import React from 'react';
import { Link } from 'react-router';
import { 
  Search, SlidersHorizontal, Bell, Play, ChevronRight, Disc, Radio as RadioIcon
} from 'lucide-react';
import NowPlaying from '../components/NowPlaying'; 
import { useAudioPlayer } from '../context/AudioPlayerContext';
import { useGetPastSessionsQuery } from '../features/radioApiSlice';

const Homepage = () => {
  // Context handles the current playing audio state
  const { currentShow, isMusicMode, isPlaying, togglePlay } = useAudioPlayer();
  
  // Fetch past sessions for the "Recent Broadcasts" list
  const { data: pastData, isLoading: isPastLoading } = useGetPastSessionsQuery();
  const pastSessions = pastData?.sessions || [];

  return (
    <div className="w-full min-h-screen bg-zinc-950 text-white animate-in fade-in duration-500 pb-48">
      
      <div className="mx-auto max-w-7xl px-4 md:px-6 lg:px-8 pt-6 md:pt-8 w-full">
        
        {/* =========================================
            TOP HEADER & SEARCH
            ========================================= */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl md:text-4xl font-serif tracking-tight text-white">Discover</h1>
            <div className="flex items-center gap-3">
              <button className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white transition-colors">
                <SlidersHorizontal size={18} />
              </button>
              <button className="relative flex h-10 w-10 items-center justify-center rounded-full bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white transition-colors">
                <Bell size={18} />
                <span className="absolute top-2.5 right-2.5 h-2 w-2 rounded-full bg-red-500 border-2 border-zinc-900"></span>
              </button>
            </div>
          </div>

          <div className="relative flex items-center w-full max-w-2xl">
            <Search className="absolute left-4 text-zinc-500" size={18} />
            <input 
              type="text" 
              placeholder="Search for shows, hosts, or topics..." 
              className="w-full rounded-2xl border border-zinc-800 bg-zinc-900 py-3.5 pl-11 pr-4 text-[13px] text-white placeholder-zinc-500 focus:border-yellow-500/50 focus:outline-none focus:ring-1 focus:ring-yellow-500/50 transition-all"
            />
          </div>
        </div>

        {/* =========================================
            FEATURED HERO BANNER (LIVE OR AUTO DJ)
            ========================================= */}
        <div className="mb-10 w-full">
          <Link 
            to="/radio"
            className="relative block w-full h-[200px] md:h-[280px] lg:h-[320px] overflow-hidden rounded-3xl border border-zinc-800 group shadow-2xl"
          >
            <img 
              src={currentShow.image} 
              alt="Radio Cover" 
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/60 to-transparent"></div>
            
            {/* Badge */}
            <div className="absolute top-4 left-4 flex items-center gap-1.5 rounded-md border border-white/10 bg-black/40 px-2.5 py-1 backdrop-blur-md">
              <span className="relative flex h-1.5 w-1.5">
                <span className={`absolute inline-flex h-full w-full rounded-full ${isMusicMode ? 'bg-yellow-500' : 'bg-red-500'} opacity-75 ${isPlaying ? 'animate-ping' : ''}`}></span>
                <span className={`relative inline-flex h-1.5 w-1.5 rounded-full ${isMusicMode ? 'bg-yellow-500' : 'bg-red-500'}`}></span>
              </span>
              <span className="text-[9px] font-bold tracking-widest text-white">{isMusicMode ? 'AUTO DJ' : 'LIVE NOW'}</span>
            </div>

            {/* Content */}
            <div className="absolute bottom-0 left-0 w-full p-5 md:p-8 flex items-end justify-between">
              <div>
                <p className={`text-[10px] md:text-[11px] font-bold uppercase tracking-[0.14em] mb-1 ${isMusicMode ? 'text-yellow-500' : 'text-red-500'}`}>
                  {isMusicMode ? 'Currently Playing' : 'On Air'}
                </p>
                <h2 className="text-2xl md:text-4xl font-serif tracking-tight text-white mb-1 md:mb-2 line-clamp-1">{currentShow.title}</h2>
                <p className="text-[11px] md:text-[13px] font-medium text-zinc-300 line-clamp-1">
                  {isMusicMode ? 'Artist: ' : 'Hosted by '} {currentShow.host}
                </p>
              </div>
              
              <button 
                onClick={(e) => { e.preventDefault(); togglePlay(); }}
                className="flex h-12 w-12 md:h-16 md:w-16 shrink-0 items-center justify-center rounded-full bg-yellow-500 text-zinc-950 shadow-[0_0_20px_rgba(234,179,8,0.4)] group-hover:scale-105 transition-transform z-10"
              >
                {isPlaying ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="md:w-6 md:h-6"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>
                ) : (
                  <Play size={20} fill="currentColor" className="ml-1 md:w-6 md:h-6" />
                )}
              </button>
            </div>
          </Link>
        </div>

        {/* =========================================
            RECENT BROADCASTS
            ========================================= */}
        <div className="space-y-10">
          <section>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg md:text-xl font-serif tracking-tight text-white">Recent Broadcasts</h3>
              <button className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 hover:text-yellow-500 transition-colors flex items-center gap-1">
                See All <ChevronRight size={14} />
              </button>
            </div>
            
            {isPastLoading ? (
              <div className="space-y-3 w-full max-w-3xl">
                {[1, 2, 3].map(i => <div key={i} className="h-16 w-full animate-pulse bg-zinc-900 rounded-xl" />)}
              </div>
            ) : pastSessions.length > 0 ? (
              <div className="flex flex-col gap-3 w-full max-w-3xl">
                {pastSessions.map((session) => (
                  <Link 
                    key={session._id}
                    to="/radio" 
                    className="group flex items-center gap-4 rounded-xl border border-transparent hover:border-zinc-800 hover:bg-zinc-900/50 p-2 transition-colors"
                  >
                    <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-zinc-800">
                      <img 
                        src={session.posterImage} 
                        alt={session.title} 
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="truncate text-[14px] md:text-[15px] font-semibold text-white group-hover:text-yellow-500 transition-colors">{session.title}</h4>
                      <p className="truncate text-[11.5px] text-zinc-500 mt-0.5">Hosted by {session.host?.name || 'O.U Radio'}</p>
                    </div>
                    <button className="flex h-8 w-8 md:h-10 md:w-10 shrink-0 items-center justify-center rounded-full bg-zinc-800 text-zinc-400 group-hover:bg-yellow-500 group-hover:text-zinc-950 transition-colors">
                      <Play size={14} fill="currentColor" className="ml-0.5 md:w-4 md:h-4" />
                    </button>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-8 border border-dashed border-zinc-800 rounded-2xl bg-zinc-900/20 w-full max-w-3xl">
                <Disc className="h-8 w-8 text-zinc-600 mb-3" />
                <p className="text-[13px] text-zinc-500">No past broadcasts yet. Check back later!</p>
              </div>
            )}
          </section>
        </div>
      </div>

      {/* Global Floating Player */}
      <NowPlaying />
    </div>
  );
};

export default Homepage;