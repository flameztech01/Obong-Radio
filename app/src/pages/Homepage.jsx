// src/pages/Homepage.jsx
import React from 'react';
import { Link } from 'react-router';
import { 
  Search, SlidersHorizontal, Bell, Play, ChevronRight 
} from 'lucide-react';
import NowPlaying from '../components/NowPlaying'; // Import the mini-player

const Homepage = () => {
  // Mock Data for the Horizontal Lists
  const madeForYou = [
    { id: 1, title: 'Campus Buzz', image: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?q=80&w=400&auto=format&fit=crop' },
    { id: 2, title: 'Midday Rhythms', image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=400&auto=format&fit=crop' },
    { id: 3, title: 'The Scholar\'s Hour', image: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?q=80&w=400&auto=format&fit=crop' },
    { id: 4, title: 'Night Vibes', image: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?q=80&w=400&auto=format&fit=crop' },
  ];

  const newReleases = [
    { id: 1, title: 'Sports Update', host: 'Femi & Co.', image: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?q=80&w=400&auto=format&fit=crop' },
    { id: 2, title: 'Night Vibes', host: 'DJ Spin', image: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?q=80&w=400&auto=format&fit=crop' },
  ];

  // Data for the NowPlaying overlay
  const currentShowData = {
    title: 'Morning Drive Show', 
    host: 'Tobi & Amaka', 
    image: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?q=80&w=200&auto=format&fit=crop' 
  };

  return (
    // Added pb-48 to ensure the last items scroll past the floating NowPlaying + Bottombar
    <div className="w-full min-h-screen bg-zinc-950 text-white animate-in fade-in duration-500 pb-48">
      
      {/* Centered Max-Width Container */}
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

          {/* Search Bar */}
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
            FEATURED HERO BANNER
            ========================================= */}
        <div className="mb-10 w-full">
          <Link 
            to="/radio"
            className="relative block w-full h-[200px] md:h-[280px] lg:h-[320px] overflow-hidden rounded-3xl border border-zinc-800 group shadow-2xl"
          >
            <img 
              src="https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?q=80&w=1600&auto=format&fit=crop" 
              alt="Live Radio" 
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            {/* Dark Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/60 to-transparent"></div>
            
            {/* Live Badge */}
            <div className="absolute top-4 left-4 flex items-center gap-1.5 rounded-md border border-white/10 bg-black/40 px-2.5 py-1 backdrop-blur-md">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75 animate-ping"></span>
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-red-500"></span>
              </span>
              <span className="text-[9px] font-bold tracking-widest text-white">LIVE NOW</span>
            </div>

            {/* Content */}
            <div className="absolute bottom-0 left-0 w-full p-5 md:p-8 flex items-end justify-between">
              <div>
                <p className="text-[10px] md:text-[11px] font-bold uppercase tracking-[0.14em] text-yellow-500 mb-1">On Air</p>
                <h2 className="text-2xl md:text-4xl font-serif tracking-tight text-white mb-1 md:mb-2">Morning Drive Show</h2>
                <p className="text-[11px] md:text-[13px] font-medium text-zinc-300">Hosted by Tobi & Amaka</p>
              </div>
              
              {/* Play Button */}
              <div className="flex h-12 w-12 md:h-16 md:w-16 shrink-0 items-center justify-center rounded-full bg-yellow-500 text-zinc-950 shadow-[0_0_20px_rgba(234,179,8,0.4)] group-hover:scale-105 transition-transform">
                <Play size={20} fill="currentColor" className="ml-1 md:w-6 md:h-6" />
              </div>
            </div>
          </Link>
        </div>

        {/* =========================================
            HORIZONTAL SCROLL SECTIONS
            ========================================= */}
        <div className="space-y-10">
          
          {/* Made For You */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg md:text-xl font-serif tracking-tight text-white">Made For You</h3>
              <button className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 hover:text-yellow-500 transition-colors flex items-center gap-1">
                See All <ChevronRight size={14} />
              </button>
            </div>
            
            {/* Horizontal Scroll Container */}
            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x">
              {madeForYou.map((item) => (
                <Link 
                  key={item.id} 
                  to="/radio"
                  className="group flex flex-col shrink-0 w-[140px] md:w-[180px] snap-start"
                >
                  <div className="relative aspect-square w-full overflow-hidden rounded-2xl border border-zinc-800 mb-3 shadow-lg">
                    <img 
                      src={item.image} 
                      alt={item.title} 
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors"></div>
                  </div>
                  <h4 className="truncate text-[13px] md:text-[14px] font-semibold text-white group-hover:text-yellow-500 transition-colors">{item.title}</h4>
                  <p className="truncate text-[11px] text-zinc-500 mt-0.5">Radio Show</p>
                </Link>
              ))}
            </div>
          </section>

          {/* New Releases / Recent */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg md:text-xl font-serif tracking-tight text-white">Recent Broadcasts</h3>
              <button className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 hover:text-yellow-500 transition-colors flex items-center gap-1">
                See All <ChevronRight size={14} />
              </button>
            </div>
            <div className="flex flex-col gap-3 w-full max-w-3xl">
              {newReleases.map((item) => (
                <Link 
                  key={item.id}
                  to="/radio"
                  className="group flex items-center gap-4 rounded-xl border border-transparent hover:border-zinc-800 hover:bg-zinc-900/50 p-2 transition-colors"
                >
                  <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-zinc-800">
                    <img 
                      src={item.image} 
                      alt={item.title} 
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="truncate text-[14px] md:text-[15px] font-semibold text-white group-hover:text-yellow-500 transition-colors">{item.title}</h4>
                    <p className="truncate text-[11.5px] text-zinc-500 mt-0.5">{item.host}</p>
                  </div>
                  <button className="flex h-8 w-8 md:h-10 md:w-10 shrink-0 items-center justify-center rounded-full bg-zinc-800 text-zinc-400 group-hover:bg-yellow-500 group-hover:text-zinc-950 transition-colors">
                    <Play size={14} fill="currentColor" className="ml-0.5 md:w-4 md:h-4" />
                  </button>
                </Link>
              ))}
            </div>
          </section>

        </div>
      </div>

      {/* =========================================
          NOW PLAYING OVERLAY
          ========================================= */}
      {/* Because of its built-in fixed positioning, this will hover perfectly 
          above the Bottombar on mobile, and bottom-right on desktop. */}
      <NowPlaying 
        currentShow={currentShowData}
        isPlaying={true} 
        onTogglePlay={() => console.log('Toggle play from Homepage')}
      />

    </div>
  );
};

export default Homepage;