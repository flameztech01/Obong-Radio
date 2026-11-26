// src/pages/Profile.jsx
import React from 'react';
import { useNavigate, Link } from 'react-router';
import { 
  Settings, Edit3, Headphones, Heart, 
  Clock, Award, ChevronRight, LogOut, Bell, Shield,
  Loader2, User as UserIcon, LogIn, UserPlus
} from 'lucide-react';
import NowPlaying from '../components/NowPlaying';
import { useGetMeQuery, useLogoutMutation } from '../features/authApiSlice';

const Profile = () => {
  const navigate = useNavigate();
  
  // Fetch User Data & Logout Mutation
  const { data: userData, isLoading } = useGetMeQuery();
  const [logout, { isLoading: isLoggingOut }] = useLogoutMutation();
  
  const user = userData?.user;

  const handleLogout = async () => {
    try {
      await logout().unwrap();
      navigate('/'); // Send back to welcome/login page
    } catch (err) {
      console.error("Failed to logout:", err);
    }
  };

  // 1. Loading Skeleton
  if (isLoading) {
    return (
      <div className="w-full min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-zinc-500">
          <Loader2 className="h-8 w-8 animate-spin text-yellow-500" />
          <p className="text-[13px] font-medium tracking-wider uppercase">Loading Profile...</p>
        </div>
      </div>
    );
  }

  // 2. Unauthenticated State (Premium UI)
  if (!user) {
    return (
      <div className="w-full min-h-[calc(100vh-8rem)] flex items-center justify-center bg-zinc-950 relative overflow-hidden px-4 animate-in fade-in duration-500">
        
        {/* Ambient Yellow Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-yellow-500/10 blur-[100px] rounded-full pointer-events-none"></div>

        <div className="relative z-10 flex flex-col items-center text-center max-w-sm w-full">
          
          {/* Icon Box */}
          <div className="h-24 w-24 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-6 shadow-2xl relative">
            <UserIcon size={36} className="text-yellow-500" />
            {/* Little lock badge */}
            <div className="absolute bottom-1 right-1 bg-zinc-950 rounded-full p-1 border border-zinc-800">
              <Shield size={14} className="text-red-500" />
            </div>
          </div>

          {/* Text */}
          <h2 className="text-3xl font-serif tracking-tight text-white mb-3">
            You're not logged in
          </h2>
          <p className="text-[13.5px] text-zinc-400 mb-8 leading-relaxed">
            Log in or create an account to view your profile, track your listening history, and manage your preferences.
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col w-full gap-3">
            <Link
              to="/login" // Assuming '/' is your login page
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-yellow-500 py-3.5 text-[13px] font-bold uppercase tracking-wider text-zinc-950 transition-all hover:bg-yellow-400 active:scale-[0.98] shadow-[0_0_20px_rgba(234,179,8,0.2)]"
            >
              <LogIn size={18} />
              Log In
            </Link>
            <Link
              to="/register"
              className="w-full flex items-center justify-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900/50 py-3.5 text-[13px] font-bold uppercase tracking-wider text-white transition-all hover:bg-zinc-800 active:scale-[0.98]"
            >
              <UserPlus size={18} />
              Create Account
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // 3. Authenticated State
  const stats = [
    { label: 'Hours Listened', value: '124', icon: <Headphones size={16} /> },
    { label: 'Shows Followed', value: '8', icon: <Heart size={16} /> },
    { label: 'Badges Earned', value: '12', icon: <Award size={16} /> },
  ];

  const recentlyPlayed = [
    { id: 1, title: 'Morning Drive Show', date: 'Today, 8:00 AM', image: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?q=80&w=200&auto=format&fit=crop' },
    { id: 2, title: 'Midday Rhythms', date: 'Yesterday, 12:00 PM', image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=200&auto=format&fit=crop' },
  ];

  const coverImage = "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?q=80&w=1200&auto=format&fit=crop";

  return (
    <div className="w-full min-h-screen bg-zinc-950 text-white animate-in fade-in duration-500 pb-48">
      
      <div className="mx-auto max-w-4xl px-4 md:px-6 lg:px-8 pt-6 md:pt-8 w-full">
        
        {/* PROFILE HEADER */}
        <div className="relative mb-20 md:mb-24">
          <div className="h-32 md:h-48 w-full overflow-hidden rounded-3xl border border-zinc-800 relative">
            <img src={coverImage} alt="Cover" className="w-full h-full object-cover opacity-60" />
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 to-transparent"></div>
            <div className="absolute top-4 right-4 flex gap-2">
              <button className="flex h-8 w-8 items-center justify-center rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-white hover:bg-black/60 transition-colors">
                <Edit3 size={14} />
              </button>
            </div>
          </div>

          <div className="absolute -bottom-12 left-6 md:left-8 flex items-end gap-4">
            <div className="h-24 w-24 md:h-32 md:w-32 rounded-full border-4 border-zinc-950 bg-zinc-900 overflow-hidden shadow-2xl relative flex items-center justify-center">
              {user.profilePicture ? (
                <img src={user.profilePicture} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-4xl font-bold text-yellow-500">
                  {user.name?.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* USER INFO */}
        <div className="px-2 mb-8 flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-serif tracking-tight text-white mb-1">
              {user.name}
            </h1>
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] font-medium text-zinc-400">
              {user.matricNumber && <span>{user.matricNumber}</span>}
              {user.matricNumber && user.level && <span className="text-zinc-600">•</span>}
              {user.level && <span>{user.level} Level</span>}
            </div>
            <p className="text-[12px] text-zinc-500 mt-0.5">
              {user.department?.name || "No Department Assigned"}
            </p>
          </div>
          <button className="flex items-center justify-center gap-2 rounded-xl bg-zinc-900 border border-zinc-800 px-4 py-2 text-[12px] font-bold text-white hover:bg-zinc-800 transition-colors w-fit">
            <Settings size={14} />
            Edit Profile
          </button>
        </div>

        {/* STATS GRID */}
        <div className="grid grid-cols-3 gap-2 md:gap-4 mb-8">
          {stats.map((stat, idx) => (
            <div key={idx} className="flex flex-col items-center justify-center rounded-2xl bg-zinc-900 border border-zinc-800 p-4 text-center">
              <div className="mb-2 text-yellow-500">{stat.icon}</div>
              <span className="text-lg md:text-xl font-bold text-white leading-none mb-1">{stat.value}</span>
              <span className="text-[9px] md:text-[10px] font-bold uppercase tracking-wider text-zinc-500">{stat.label}</span>
            </div>
          ))}
        </div>

        {/* RECENTLY PLAYED */}
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

        {/* ACCOUNT SETTINGS LIST */}
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

            <button 
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="w-full flex items-center justify-between p-4 hover:bg-red-500/10 transition-colors group disabled:opacity-50"
            >
              <div className="flex items-center gap-3 text-red-400 group-hover:text-red-500">
                {isLoggingOut ? <Loader2 size={18} className="animate-spin" /> : <LogOut size={18} />}
                <span className="text-[13px] font-medium">
                  {isLoggingOut ? 'Logging out...' : 'Log Out'}
                </span>
              </div>
            </button>

          </div>
        </div>

      </div>

      <NowPlaying />
      
    </div>
  );
};

export default Profile;