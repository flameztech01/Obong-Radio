// src/pages/Profile.jsx
import React from 'react';
import { 
  Settings, Edit3, Headphones, Heart, 
  Clock, Award, ChevronRight, LogOut, Bell, Shield
} from 'lucide-react';
import NowPlaying from '../components/NowPlaying';

const Profile = () => {
  // Mock User Data
  const user = {
    name: 'Tobi Amaka',
    matric: 'OBU/2021/CS/045',
    level: '300 Level',
    department: 'Computer Science',
    avatar: 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?q=80&w=200&auto=format&fit=crop', // Placeholder portrait
    cover: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?q=80&w=1200&auto=format&fit=crop' // Studio background
  };

  // Mock Stats
  const stats = [
    { label: 'Hours Listened', value: '124', icon: <Headphones size={16} /> },
    { label: 'Shows Followed', value: '8', icon: <Heart size={16} /> },
    { label: 'Badges Earned', value: '12', icon: <Award size={16} /> },
  ];

  // Mock Recently Played
  const recentlyPlayed = [
    { id: 1, title: 'Morning Drive Show', date: 'Today, 8:00 AM', image: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?q=80&w=200&auto=format&fit=crop' },
    { id: 2, title: 'Midday Rhythms', date: 'Yesterday, 12:00 PM', image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=200&auto=format&fit=crop' },
  ];

  const currentShowData = {
    title: 'Morning Drive Show', 
    host: 'Tobi & Amaka', 
    image: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?q=80&w=200&auto=format&fit=crop' 
  };

  return (
    <div className="w-full min-h-screen bg-zinc-950 text-white animate-in fade-in duration-500 pb-48">
      
      <div className="mx-auto max-w-4xl px-4 md:px-6 lg:px-8 pt-6 md:pt-8 w-full">
        
        {/* =========================================
            PROFILE HEADER (Cover & Avatar)
            ========================================= */}
        <div className="relative mb-20 md:mb-24">
          {/* Cover Image */}
          <div className="h-32 md:h-48 w-full overflow-hidden rounded-3xl border border-zinc-800 relative">
            <img 
              src={user.cover} 
              alt="Cover" 
              className="w-full h-full object-cover opacity-60"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 to-transparent"></div>
            
            {/* Top Right Buttons */}
            <div className="absolute top-4 right-4 flex gap-2">
              <button className="flex h-8 w-8 items-center justify-center rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-white hover:bg-black/60 transition-colors">
                <Edit3 size={14} />
              </button>
            </div>
          </div>

          {/* Avatar */}
          <div className="absolute -bottom-12 left-6 md:left-8 flex items-end gap-4">
            <div className="h-24 w-24 md:h-32 md:w-32 rounded-full border-4 border-zinc-950 bg-zinc-900 overflow-hidden shadow-2xl relative">
              <img 
                src={user.avatar} 
                alt={user.name} 
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>

        {/* =========================================
            USER INFO
            ========================================= */}
        <div className="px-2 mb-8 flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-serif tracking-tight text-white mb-1">
              {user.name}
            </h1>
            <p className="text-[13px] font-medium text-zinc-400">
              {user.matric} • {user.level}
            </p>
            <p className="text-[12px] text-zinc-500 mt-0.5">
              {user.department}
            </p>
          </div>
          <button className="flex items-center justify-center gap-2 rounded-xl bg-zinc-900 border border-zinc-800 px-4 py-2 text-[12px] font-bold text-white hover:bg-zinc-800 transition-colors">
            <Settings size={14} />
            Edit Profile
          </button>
        </div>

        {/* =========================================
            STATS GRID
            ========================================= */}
        <div className="grid grid-cols-3 gap-2 md:gap-4 mb-8">
          {stats.map((stat, idx) => (
            <div key={idx} className="flex flex-col items-center justify-center rounded-2xl bg-zinc-900 border border-zinc-800 p-4 text-center">
              <div className="mb-2 text-yellow-500">
                {stat.icon}
              </div>
              <span className="text-lg md:text-xl font-bold text-white leading-none mb-1">
                {stat.value}
              </span>
              <span className="text-[9px] md:text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                {stat.label}
              </span>
            </div>
          ))}
        </div>

        {/* =========================================
            RECENTLY PLAYED
            ========================================= */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4 px-2">
            <h2 className="text-[15px] font-serif tracking-tight text-white">Recently Played</h2>
            <button className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 hover:text-yellow-500 transition-colors">
              See All
            </button>
          </div>
          <div className="space-y-2">
            {recentlyPlayed.map((item) => (
              <div key={item.id} className="group flex items-center gap-4 p-3 rounded-2xl bg-zinc-900/50 border border-transparent hover:border-zinc-800 hover:bg-zinc-900 transition-colors cursor-pointer">
                <div className="h-12 w-12 shrink-0 rounded-lg overflow-hidden border border-zinc-800">
                  <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-[13.5px] font-semibold text-white truncate group-hover:text-yellow-500 transition-colors">
                    {item.title}
                  </h4>
                  <p className="text-[11px] text-zinc-500 flex items-center gap-1.5 mt-0.5">
                    <Clock size={10} /> {item.date}
                  </p>
                </div>
                <ChevronRight size={18} className="text-zinc-600 group-hover:text-white transition-colors" />
              </div>
            ))}
          </div>
        </div>

        {/* =========================================
            ACCOUNT SETTINGS LIST
            ========================================= */}
        <div>
          <h2 className="text-[15px] font-serif tracking-tight text-white mb-4 px-2">Account Settings</h2>
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
            
            <button className="w-full flex items-center justify-between p-4 border-b border-zinc-800/50 hover:bg-zinc-800/50 transition-colors">
              <div className="flex items-center gap-3 text-zinc-300">
                <Bell size={18} className="text-zinc-500" />
                <span className="text-[13px] font-medium">Notifications</span>
              </div>
              <ChevronRight size={16} className="text-zinc-600" />
            </button>

            <button className="w-full flex items-center justify-between p-4 border-b border-zinc-800/50 hover:bg-zinc-800/50 transition-colors">
              <div className="flex items-center gap-3 text-zinc-300">
                <Shield size={18} className="text-zinc-500" />
                <span className="text-[13px] font-medium">Privacy & Security</span>
              </div>
              <ChevronRight size={16} className="text-zinc-600" />
            </button>

            <button className="w-full flex items-center justify-between p-4 hover:bg-red-500/10 transition-colors group">
              <div className="flex items-center gap-3 text-red-400 group-hover:text-red-500">
                <LogOut size={18} />
                <span className="text-[13px] font-medium">Log Out</span>
              </div>
            </button>

          </div>
        </div>

      </div>

      {/* =========================================
          NOW PLAYING OVERLAY
          ========================================= */}
      <NowPlaying currentShow={currentShowData} isPlaying={true} />
      
    </div>
  );
};

export default Profile;