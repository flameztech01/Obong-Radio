// src/pages/Settings.jsx
import React, { useState } from 'react';
import { 
  Volume2, Bell, Database, Moon, Shield, 
  HelpCircle, ChevronRight, Smartphone 
} from 'lucide-react';
import NowPlaying from '../components/NowPlaying';
import Toggle from '../components/Toggle'; // <-- Import the new Toggle

const Settings = () => {
  const [settings, setSettings] = useState({
    highQuality: true,
    dataSaver: false,
    pushNotifications: true,
    chatMentions: true,
    darkMode: true,
  });

  const toggleSetting = (key) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const currentShowData = {
    title: 'Morning Drive Show', 
    host: 'Tobi & Amaka', 
    image: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?q=80&w=200&auto=format&fit=crop' 
  };

  return (
    <div className="w-full min-h-screen bg-zinc-950 text-white animate-in fade-in duration-500 pb-48">
      <div className="mx-auto max-w-3xl px-4 md:px-6 lg:px-8 pt-6 md:pt-8 w-full">
        
        <div className="mb-8 px-2">
          <h1 className="text-3xl md:text-4xl font-serif tracking-tight text-white mb-2">Settings</h1>
          <p className="text-[13px] md:text-[14px] text-zinc-400">
            Manage your app preferences and audio settings.
          </p>
        </div>

        <div className="space-y-8">
          
          {/* AUDIO & PLAYBACK */}
          <section>
            <h2 className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-3 px-2">Audio & Playback</h2>
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
              
              <div className="flex items-center justify-between p-4 border-b border-zinc-800/50 hover:bg-zinc-800/30 transition-colors">
                <div className="flex items-center gap-3 text-zinc-300">
                  <Volume2 size={18} className="text-zinc-500" />
                  <div>
                    <p className="text-[14px] font-medium text-white">High Quality Audio</p>
                    <p className="text-[11px] text-zinc-500 mt-0.5">Stream at 320kbps when on Wi-Fi</p>
                  </div>
                </div>
                <Toggle 
                  checked={settings.highQuality} 
                  onChange={() => toggleSetting('highQuality')} 
                />
              </div>

              <div className="flex items-center justify-between p-4 hover:bg-zinc-800/30 transition-colors">
                <div className="flex items-center gap-3 text-zinc-300">
                  <Database size={18} className="text-zinc-500" />
                  <div>
                    <p className="text-[14px] font-medium text-white">Data Saver</p>
                    <p className="text-[11px] text-zinc-500 mt-0.5">Reduces audio quality to save data</p>
                  </div>
                </div>
                <Toggle 
                  checked={settings.dataSaver} 
                  onChange={() => toggleSetting('dataSaver')} 
                />
              </div>

            </div>
          </section>

          {/* NOTIFICATIONS */}
          <section>
            <h2 className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-3 px-2">Notifications</h2>
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
              
              <div className="flex items-center justify-between p-4 border-b border-zinc-800/50 hover:bg-zinc-800/30 transition-colors">
                <div className="flex items-center gap-3 text-zinc-300">
                  <Bell size={18} className="text-zinc-500" />
                  <div>
                    <p className="text-[14px] font-medium text-white">Push Notifications</p>
                    <p className="text-[11px] text-zinc-500 mt-0.5">Get alerts for live shows</p>
                  </div>
                </div>
                <Toggle 
                  checked={settings.pushNotifications} 
                  onChange={() => toggleSetting('pushNotifications')} 
                />
              </div>

              <div className="flex items-center justify-between p-4 hover:bg-zinc-800/30 transition-colors">
                <div className="flex items-center gap-3 text-zinc-300">
                  <Smartphone size={18} className="text-zinc-500" />
                  <div>
                    <p className="text-[14px] font-medium text-white">Chat Mentions</p>
                    <p className="text-[11px] text-zinc-500 mt-0.5">Notify me when someone replies</p>
                  </div>
                </div>
                <Toggle 
                  checked={settings.chatMentions} 
                  onChange={() => toggleSetting('chatMentions')} 
                />
              </div>

            </div>
          </section>

          {/* APP PREFERENCES */}
          <section>
            <h2 className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-3 px-2">App Preferences</h2>
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
              
              <div className="flex items-center justify-between p-4 border-b border-zinc-800/50 hover:bg-zinc-800/30 transition-colors">
                <div className="flex items-center gap-3 text-zinc-300">
                  <Moon size={18} className="text-zinc-500" />
                  <p className="text-[14px] font-medium text-white">Dark Mode</p>
                </div>
                <Toggle 
                  checked={settings.darkMode} 
                  onChange={() => toggleSetting('darkMode')} 
                />
              </div>

              <button className="w-full flex items-center justify-between p-4 border-b border-zinc-800/50 hover:bg-zinc-800/50 transition-colors">
                <div className="flex items-center gap-3 text-zinc-300">
                  <Shield size={18} className="text-zinc-500" />
                  <span className="text-[14px] font-medium">Privacy Policy</span>
                </div>
                <ChevronRight size={16} className="text-zinc-600" />
              </button>

              <button className="w-full flex items-center justify-between p-4 hover:bg-zinc-800/50 transition-colors">
                <div className="flex items-center gap-3 text-zinc-300">
                  <HelpCircle size={18} className="text-zinc-500" />
                  <span className="text-[14px] font-medium">Help & Support</span>
                </div>
                <ChevronRight size={16} className="text-zinc-600" />
              </button>

            </div>
          </section>

          <div className="text-center pt-4">
            <p className="text-[11px] font-medium text-zinc-600">Obong University Radio</p>
            <p className="text-[10px] text-zinc-700 mt-0.5">Version 1.0.0 (Build 42)</p>
          </div>

        </div>
      </div>

      <NowPlaying currentShow={currentShowData} isPlaying={true} />
    </div>
  );
};

export default Settings;