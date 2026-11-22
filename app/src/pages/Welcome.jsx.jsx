import React from 'react';
import { Link } from 'react-router';
import { Play, Radio, ShieldCheck } from 'lucide-react';

const Welcome = () => {
  return (
    // h-[100dvh] restricts the height exactly to the screen size, no scrolling
    <div className="relative h-[100dvh] w-full flex flex-col overflow-hidden bg-zinc-950 font-sans selection:bg-zinc-800 selection:text-white">
      
      {/* =========================================
          BACKGROUND IMAGE & OVERLAYS
          ========================================= */}
      <div className="absolute inset-0 z-0">
        {/* Using a moody, premium radio/microphone studio image */}
        <div 
          className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center bg-no-repeat opacity-60"
          aria-hidden="true"
        ></div>
        
        {/* Dark Overlay to ensure text readability */}
        <div className="absolute inset-0 bg-zinc-950/80 mix-blend-multiply"></div>
        
        {/* Vignette for cinematic depth */}
        <div className="absolute inset-0 shadow-[inset_0_0_200px_rgba(0,0,0,0.95)]"></div>
      </div>

      {/* =========================================
          MATURE USE OF SCHOOL COLORS (Top Ribbon)
          ========================================= */}
      <div className="absolute top-0 left-0 w-full h-1 flex z-20 shrink-0">
        <div className="flex-1 bg-red-700"></div>
        <div className="flex-1 bg-yellow-500"></div>
        <div className="flex-1 bg-green-700"></div>
      </div>

      {/* =========================================
          TOP NAV / LOGO
          ========================================= */}
      <header className="relative z-10 w-full px-6 py-5 md:px-10 md:py-6 flex items-center justify-between shrink-0 animate-in fade-in slide-in-from-top-4 duration-700">
        <div className="flex items-center gap-3 md:gap-4">
          <img 
            src="/logo.jfif" 
            alt="Obong University Logo" 
            className="w-10 h-10 md:w-12 md:h-12 object-contain drop-shadow-lg"
          />
          <div className="flex flex-col">
            <span className="text-zinc-100 font-semibold tracking-widest uppercase text-xs md:text-sm">
              Obong University
            </span>
            <span className="text-yellow-500 text-[10px] md:text-xs tracking-wider uppercase font-bold">
              Campus Radio 98.5
            </span>
          </div>
        </div>
        <div className="hidden sm:block">
          <span className="flex items-center gap-2 text-zinc-400 text-[10px] md:text-xs tracking-widest uppercase border border-zinc-700/50 px-3 py-1.5 rounded-full bg-zinc-900/50 backdrop-blur-md">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
            </span>
            Live Stream
          </span>
        </div>
      </header>

      {/* =========================================
          MAIN HERO CONTENT
          Mobile: Bottom Left | Desktop: Left Split
          ========================================= */}
      <main className="relative z-10 flex-grow flex flex-col justify-end md:justify-center px-6 md:px-16 lg:px-24 pb-12 md:pb-0 w-full max-w-7xl mx-auto">
        
        <div className="w-full md:w-[65%] lg:w-[60%] flex flex-col items-start text-left animate-in fade-in slide-in-from-bottom-8 duration-700 delay-150 fill-mode-both">
          
          {/* Small color accent lines */}
          <div className="flex items-center gap-2 mb-6 md:mb-8">
            <div className="w-6 md:w-8 h-[2px] bg-red-700"></div>
            <div className="w-6 md:w-8 h-[2px] bg-yellow-500"></div>
            <div className="w-6 md:w-8 h-[2px] bg-green-700"></div>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-5xl lg:text-6xl font-serif text-white tracking-tight mb-4 md:mb-6 leading-[1.1] drop-shadow-md">
            The Sound of <br className="hidden md:block" />
            <span className="italic font-light text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 to-yellow-500">
              Obong University
            </span> 
            <br className="hidden md:block" /> Radio
          </h1>

          <p className="text-zinc-300 text-sm md:text-base lg:text-lg max-w-md md:max-w-xl leading-relaxed mb-8 md:mb-10 font-light drop-shadow">
            Your dedicated campus soundtrack. 
            <span className="hidden md:inline"> Tune in for live shows, campus news, music, and educational broadcasts designed for the students.</span>
          </p>

          <div className="flex flex-col sm:flex-row items-start gap-3 md:gap-4 w-full sm:w-auto">
            {/* Primary CTA linking to Radio */}
            <Link 
              to="/radio" 
              className="group w-full sm:w-auto px-8 py-3.5 md:px-10 md:py-4 bg-yellow-500 hover:bg-yellow-400 text-zinc-950 text-xs md:text-sm font-bold tracking-widest uppercase transition-all duration-300 shadow-[0_0_20px_rgba(234,179,8,0.2)] hover:shadow-[0_0_30px_rgba(234,179,8,0.4)] text-center flex items-center justify-center gap-2"
            >
              <Play size={16} className="fill-current group-hover:scale-110 transition-transform" />
              Listen Live
            </Link>
            
            {/* Secondary CTA (Optional, can be changed later) */}
            <a 
              href="/login" 
              className="w-full sm:w-auto px-8 py-3.5 md:px-10 md:py-4 border border-zinc-600 hover:border-zinc-400 bg-zinc-900/50 backdrop-blur-sm text-zinc-200 hover:text-white text-xs md:text-sm font-bold tracking-widest uppercase transition-all duration-300 text-center"
            >
              Student Portal
            </a>
          </div>
        </div>

      </main>

      {/* =========================================
          FOOTER
          ========================================= */}
      <footer className="relative z-10 w-full px-6 py-5 md:px-10 shrink-0 bg-gradient-to-t from-zinc-950 to-transparent animate-in fade-in duration-700 delay-300 fill-mode-both">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-3 md:gap-4 text-[10px] md:text-xs text-zinc-500 font-medium">
          <p>
            &copy; {new Date().getFullYear()} Obong University Radio.
          </p>
          <div className="flex items-center gap-2 bg-zinc-900/80 px-3 py-1.5 md:px-4 md:py-2 rounded-lg border border-zinc-800 w-full md:w-auto backdrop-blur-md">
            <Radio className="w-3.5 h-3.5 text-yellow-500 shrink-0" />
            <span>
              Broadcasting from the heart of the campus. 
              <span className="text-zinc-300 font-semibold ml-1">Education for Sustainable Development.</span>
            </span>
          </div>
        </div>
      </footer>

    </div>
  )
}

export default Welcome;