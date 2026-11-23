// src/pages/Radio.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { 
  Play, Pause, Volume2, VolumeX, Share2, Radio as RadioIcon,
  ArrowLeft, MessageSquare, Calendar, Heart, Clock, Loader2
} from 'lucide-react';
import { socket } from '../services/socket'; 
import LiveChat from '../components/LiveChat'; 
import { useAudioPlayer } from '../context/AudioPlayerContext';

// =========================================
// VISUALIZER COMPONENT
// =========================================
const Visualizer = ({ isPlaying, barCount = 24, height = 'h-16' }) => {
  const [bars, setBars] = useState(Array(barCount).fill(15));

  useEffect(() => {
    let interval;
    if (isPlaying) {
      interval = setInterval(() => {
        setBars(Array.from({ length: barCount }, () => Math.floor(Math.random() * 80) + 20));
      }, 120);
    } else { setBars(Array(barCount).fill(15)); }
    return () => clearInterval(interval);
  }, [isPlaying, barCount]);

  return (
    <div className={`flex items-end justify-center gap-1 w-full ${height}`}>
      {bars.map((h, i) => (
        <div key={i} className="w-1.5 rounded-t-sm bg-gradient-to-t from-yellow-500/40 to-yellow-500 transition-all duration-150 ease-in-out" style={{ height: `${h}%` }} />
      ))}
    </div>
  );
};

// =========================================
// MAIN RADIO COMPONENT
// =========================================
const Radio = () => {
  const navigate = useNavigate();
  
  // 1. Get Audio Player State from Context
  const { 
    isPlaying, isBuffering, isMusicMode, currentShow, 
    volume, isMuted, togglePlay, toggleMute, 
    handleVolumeChange, showImage 
  } = useAudioPlayer();

  // Real state: sound is only "active" once audio is actually coming out
  const showSpinner = isPlaying && isBuffering;
  const isActive = isPlaying && !isBuffering;
  const statusLabel = isMusicMode
    ? (showSpinner ? 'Loading…' : isPlaying ? 'Playing' : 'Paused')
    : 'On Air';
  
  // 2. Local State for Live Chat
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [listenerCount, setListenerCount] = useState(0);

  // 3. Socket.io Connection for Live Chat
  useEffect(() => {
    socket.emit('join_radio_room', 'obong_radio_main_studio');

    const handleMessage = (msg) => setMessages((prev) => [...prev, msg]);
    const handleCount = (count) => setListenerCount(count);

    socket.on('receive_radio_message', handleMessage);
    socket.on('listener_count_update', handleCount);

    return () => {
      socket.off('receive_radio_message', handleMessage);
      socket.off('listener_count_update', handleCount);
    };
  }, []);

  const upcomingShows = [
    { time: '10:00 AM', title: 'Campus Buzz', host: 'Chinedu O.' },
    { time: '12:00 PM', title: 'Midday Rhythms', host: 'DJ Spin' },
    { time: '02:00 PM', title: 'The Scholar\'s Hour', host: 'Dr. Adebayo' },
    { time: '04:00 PM', title: 'Sports Update', host: 'Femi & Co.' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex h-[100dvh] w-full flex-col overflow-hidden bg-zinc-950 text-white animate-in fade-in duration-500">
      
      {/* Background Image */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <img src={showImage} alt="Background" className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-zinc-950/75"></div>
        <div className="absolute inset-0 shadow-[inset_0_0_150px_rgba(0,0,0,0.8)]"></div>
      </div>

      <LiveChat 
        isOpen={isChatOpen} 
        onClose={() => setIsChatOpen(false)} 
        currentShow={currentShow} 
        messages={messages}
        listenerCount={listenerCount}
      />

      {/* =========================================
          MOBILE VIEW
          ========================================= */}
      <div className="relative z-10 flex h-full w-full flex-col md:hidden">
        
        {/* Mobile Header */}
        <div className="flex shrink-0 items-center justify-between px-5 pb-2 pt-6">
          <button onClick={() => navigate('/home')} className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-900/80 backdrop-blur-md text-zinc-400 border border-zinc-800 active:scale-95 transition-transform">
            <ArrowLeft size={16} />
          </button>
          <div className="flex items-center gap-2 text-zinc-400">
            <RadioIcon size={14} className="text-yellow-500" />
            <span className="text-[10px] font-bold uppercase tracking-[0.14em]">O.U Radio</span>
          </div>
          <button onClick={() => setIsChatOpen(true)} className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-900/80 backdrop-blur-md text-zinc-400 border border-zinc-800 active:scale-95 transition-transform">
            <MessageSquare size={16} />
          </button>
        </div>

        {/* Hero Art Area */}
        <div className="flex flex-1 flex-col items-center justify-center px-6 overflow-hidden min-h-0">
          <div className="relative mb-6 flex aspect-square w-full max-w-[200px] sm:max-w-[240px] items-center justify-center overflow-hidden rounded-2xl border border-zinc-800 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
            <img src={currentShow.image} alt="Show Cover" className="absolute inset-0 h-full w-full object-cover" />
            <div className="absolute inset-0 bg-zinc-950/10"></div>

            <div className="absolute left-3 top-3 z-10 flex items-center gap-1.5 rounded-md border border-white/10 bg-black/40 px-2 py-0.5 backdrop-blur-md">
              <span className="relative flex h-1.5 w-1.5">
                <span className={`absolute inline-flex h-full w-full rounded-full ${isMusicMode ? 'bg-yellow-500' : 'bg-red-500'} opacity-75 ${isActive ? 'animate-ping' : ''}`}></span>
                <span className={`relative inline-flex h-1.5 w-1.5 rounded-full ${isMusicMode ? 'bg-yellow-500' : 'bg-red-500'}`}></span>
              </span>
              <span className="text-[8px] font-bold tracking-widest text-white">{isMusicMode ? 'AUTO DJ' : 'LIVE'}</span>
            </div>
          </div>

          <div className="mb-4 w-full text-center">
            <h1 className="mb-1 font-serif text-2xl tracking-tight text-white drop-shadow-md truncate px-4">{currentShow.title}</h1>
            <p className="text-[11px] font-medium uppercase tracking-wider text-zinc-400">
              {isMusicMode ? 'Playing' : 'Hosted by'} <span className="text-zinc-200">{currentShow.host}</span>
            </p>
          </div>

          <div className="w-full max-w-[200px]">
            <Visualizer isPlaying={isActive} height="h-8" barCount={16} />
          </div>
        </div>

        {/* Mobile Bottom Controls */}
        <div className="shrink-0 bg-zinc-900/90 backdrop-blur-xl border-t border-zinc-800/80 pb-safe rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.6)]">
          <div className="flex flex-col px-6 pt-5 pb-6">
            
            <div className="mb-4">
              <div className="flex justify-between text-[9px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5">
                <span>{isMusicMode ? 'Auto DJ Queue' : 'Live Stream'}</span>
                <span className={isMusicMode ? 'text-zinc-400' : 'text-yellow-500'}>{statusLabel}</span>
              </div>
              <div className="h-1.5 w-full bg-zinc-800/80 rounded-full overflow-hidden">
                <div className={`h-full w-full ${isMusicMode ? 'bg-zinc-600' : 'bg-yellow-500 animate-pulse'} ${showSpinner ? 'animate-pulse' : ''}`}></div>
              </div>
            </div>

            <div className="flex items-center gap-3 mb-6">
              <button onClick={toggleMute} className="text-zinc-500 hover:text-white transition-colors">
                {isMuted || volume === 0 ? <VolumeX size={16} /> : <Volume2 size={16} />}
              </button>
              <input 
                type="range" min="0" max="100" value={isMuted ? 0 : volume} 
                onChange={handleVolumeChange} 
                className="h-1 w-full cursor-pointer appearance-none rounded-lg bg-zinc-800/80 accent-yellow-500" 
              />
            </div>

            <div className="flex items-center justify-between">
              <button onClick={() => setIsChatOpen(true)} className="flex flex-col items-center gap-1.5 text-zinc-400 hover:text-yellow-500 transition-colors w-16">
                <MessageSquare size={22} />
                <span className="text-[9px] font-bold uppercase tracking-wider">Chat</span>
              </button>

              <button 
                onClick={togglePlay}
                className="flex h-16 w-16 items-center justify-center rounded-full bg-yellow-500 text-zinc-950 shadow-[0_0_30px_rgba(234,179,8,0.3)] transition-all active:scale-95"
              >
                {showSpinner ? (
                  <Loader2 size={28} className="animate-spin" />
                ) : isPlaying ? (
                  <Pause size={28} fill="currentColor" />
                ) : (
                  <Play size={28} fill="currentColor" className="ml-1" />
                )}
              </button>

              <button className="flex flex-col items-center gap-1.5 text-zinc-400 hover:text-yellow-500 transition-colors w-16">
                <Calendar size={22} />
                <span className="text-[9px] font-bold uppercase tracking-wider">Schedule</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* =========================================
          DESKTOP VIEW
          ========================================= */}
      <div className="relative z-10 mx-auto hidden h-full w-full max-w-7xl gap-6 p-6 md:flex lg:p-8">
        
        {/* Left Column: Player */}
        <div className="relative flex flex-1 flex-col overflow-hidden rounded-2xl border border-zinc-800/80 bg-zinc-900/60 backdrop-blur-2xl shadow-2xl">
          
          <div className="flex w-full items-center justify-between p-6 border-b border-zinc-800/50">
            <button onClick={() => navigate('/home')} className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-zinc-400 hover:text-white transition-colors">
              <ArrowLeft size={14} /> Back to App
            </button>
            <div className="flex items-center gap-2 rounded-md border border-zinc-800/80 bg-zinc-950/80 px-3 py-1">
              <span className="relative flex h-2 w-2">
                <span className={`absolute inline-flex h-full w-full rounded-full ${isMusicMode ? 'bg-yellow-500' : 'bg-red-500'} opacity-75 ${isActive ? 'animate-ping' : ''}`}></span>
                <span className={`relative inline-flex h-2 w-2 rounded-full ${isMusicMode ? 'bg-yellow-500' : 'bg-red-500'}`}></span>
              </span>
              <span className="text-[10px] font-bold tracking-widest text-white">{isMusicMode ? 'AUTO DJ' : 'ON AIR'}</span>
            </div>
          </div>

          <div className="flex flex-1 flex-col items-center justify-center p-8 lg:p-12">
            <div className="flex w-full max-w-2xl flex-col items-center gap-8 lg:flex-row lg:gap-12">
              
              <div className="relative flex h-64 w-64 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-zinc-700/50 shadow-[0_20px_50px_rgba(0,0,0,0.6)]">
                <img src={currentShow.image} alt="Cover" className="h-full w-full object-cover" />
              </div>

              <div className="flex-1 text-center lg:text-left">
                <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.14em] text-yellow-500">
                  {isMusicMode ? (showSpinner ? 'Loading track…' : 'Auto DJ Playing') : 'Currently Playing'}
                </p>
                <h1 className="mb-3 font-serif text-4xl leading-tight tracking-tight text-white lg:text-5xl drop-shadow-lg line-clamp-2">{currentShow.title}</h1>
                <p className="mb-6 text-[13px] font-medium text-zinc-400">
                  {isMusicMode ? 'Artist' : 'Hosted by'} <span className="text-zinc-200">{currentShow.host}</span> <br/>
                  <span className="mt-1 block text-[11px] uppercase tracking-wider text-zinc-500">Obong University Radio 98.5</span>
                </p>
                <div className="mx-auto w-full max-w-xs lg:mx-0">
                  <Visualizer isPlaying={isActive} height="h-12" barCount={24} />
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-zinc-800/80 bg-zinc-950/40 backdrop-blur-md">
            <div className="w-full h-1 bg-zinc-800/50">
               <div className={`h-full w-full ${isMusicMode ? 'bg-zinc-600' : 'bg-yellow-500 animate-pulse'} ${showSpinner ? 'animate-pulse' : ''}`}></div>
            </div>
            
            <div className="flex items-center justify-between p-6">
              <div className="flex w-64 items-center gap-4">
                <button onClick={toggleMute} className="text-zinc-500 hover:text-white transition-colors">
                  {isMuted || volume === 0 ? <VolumeX size={20} /> : <Volume2 size={20} />}
                </button>
                <input 
                  type="range" min="0" max="100" value={isMuted ? 0 : volume} 
                  onChange={handleVolumeChange} 
                  className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-zinc-800 accent-yellow-500" 
                />
              </div>

              <button 
                onClick={togglePlay} 
                className="flex h-16 w-16 items-center justify-center rounded-full bg-yellow-500 text-zinc-950 shadow-[0_0_30px_rgba(234,179,8,0.3)] transition-all hover:scale-105 active:scale-95"
              >
                {showSpinner ? (
                  <Loader2 size={28} className="animate-spin" />
                ) : isPlaying ? (
                  <Pause size={28} fill="currentColor" />
                ) : (
                  <Play size={28} fill="currentColor" className="ml-1" />
                )}
              </button>

              <div className="flex w-64 items-center justify-end gap-6">
                <button onClick={() => setIsChatOpen(true)} className="flex items-center gap-2 text-zinc-400 hover:text-yellow-500 transition-colors">
                  <MessageSquare size={20} />
                  <span className="text-[11px] font-bold uppercase tracking-wider">Chat</span>
                </button>
                <button className="text-zinc-500 hover:text-white transition-colors"><Share2 size={20} /></button>
                <button className="text-zinc-500 hover:text-red-500 transition-colors"><Heart size={20} /></button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Schedule */}
        <div className="flex w-[360px] shrink-0 flex-col overflow-hidden rounded-2xl border border-zinc-800/80 bg-zinc-900/60 backdrop-blur-2xl shadow-2xl">
          <div className="flex shrink-0 items-center justify-between border-b border-zinc-800/80 p-5">
            <h2 className="flex items-center gap-2 font-serif text-[15px] tracking-tight text-white">
              <Clock size={16} className="text-yellow-500" /> Up Next
            </h2>
            <span className="rounded border border-zinc-800 bg-zinc-950/50 px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-zinc-500">Schedule</span>
          </div>

          <div className="flex-1 space-y-1 overflow-y-auto p-3">
            {upcomingShows.map((show, idx) => (
              <div key={idx} className="group flex cursor-pointer gap-4 rounded-xl border border-transparent p-3 transition-colors hover:border-zinc-800 hover:bg-zinc-950/50">
                <div className="flex w-12 shrink-0 flex-col items-center justify-start pt-1">
                  <span className="text-[11px] font-bold text-zinc-300">{show.time.split(' ')[0]}</span>
                  <span className="text-[9px] font-semibold uppercase text-zinc-600">{show.time.split(' ')[1]}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="truncate text-[13.5px] font-semibold text-white transition-colors group-hover:text-yellow-500">{show.title}</h4>
                  <p className="mt-0.5 truncate text-[11px] text-zinc-500">{show.host}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Radio;