// src/pages/Socials.jsx
import React from 'react';
import { FaInstagram, FaXTwitter, FaFacebook, FaYoutube, FaLinkedin } from 'react-icons/fa6'; // Brand icons
import { Globe, ArrowUpRight } from 'lucide-react'; // Standard icons
import NowPlaying from '../components/NowPlaying';

const Socials = () => {
  const socialAccounts = [
    {
      id: 1,
      name: 'Instagram',
      handle: '@obonguniversityradio',
      url: 'https://instagram.com',
      icon: <FaInstagram size={22} />,
      color: 'group-hover:text-pink-500',
      bgColor: 'group-hover:bg-pink-500/10'
    },
    {
      id: 2,
      name: 'X (Twitter)',
      handle: '@obongradio',
      url: 'https://twitter.com',
      icon: <FaXTwitter size={22} />,
      color: 'group-hover:text-sky-400',
      bgColor: 'group-hover:bg-sky-400/10'
    },
    {
      id: 3,
      name: 'Facebook',
      handle: 'Obong University Radio',
      url: 'https://facebook.com',
      icon: <FaFacebook size={22} />,
      color: 'group-hover:text-blue-500',
      bgColor: 'group-hover:bg-blue-500/10'
    },
    {
      id: 4,
      name: 'YouTube',
      handle: 'O.U Radio Live',
      url: 'https://youtube.com',
      icon: <FaYoutube size={22} />,
      color: 'group-hover:text-red-500',
      bgColor: 'group-hover:bg-red-500/10'
    },
    {
      id: 5,
      name: 'LinkedIn',
      handle: 'Obong University',
      url: 'https://linkedin.com',
      icon: <FaLinkedin size={22} />,
      color: 'group-hover:text-blue-400',
      bgColor: 'group-hover:bg-blue-400/10'
    },
    {
      id: 6,
      name: 'Official Website',
      handle: 'obonguniversity.edu.ng',
      url: 'https://obonguniversity.edu.ng',
      icon: <Globe size={22} />,
      color: 'group-hover:text-emerald-500',
      bgColor: 'group-hover:bg-emerald-500/10'
    },
  ];

  const currentShowData = {
    title: 'Morning Drive Show', 
    host: 'Tobi & Amaka', 
    image: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?q=80&w=200&auto=format&fit=crop' 
  };

  return (
    <div className="w-full min-h-screen bg-zinc-950 text-white animate-in fade-in duration-500 pb-48">
      <div className="mx-auto max-w-4xl px-4 md:px-6 lg:px-8 pt-6 md:pt-8 w-full">
        
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-serif tracking-tight text-white mb-2">Connect With Us</h1>
          <p className="text-[13px] md:text-[14px] text-zinc-400 max-w-lg leading-relaxed">
            Stay in the loop with Obong University Radio. Follow our official accounts for live show alerts, campus news, and exclusive behind-the-scenes content.
          </p>
        </div>

        <div className="space-y-3">
          {socialAccounts.map((social) => (
            <a
              key={social.id}
              href={social.url}
              target="_blank"
              rel="noreferrer"
              className="group flex items-center justify-between p-4 md:p-5 bg-zinc-900 border border-zinc-800 rounded-2xl hover:border-zinc-700 hover:bg-zinc-900/80 transition-all active:scale-[0.99]"
            >
              <div className="flex items-center gap-4">
                <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-400 transition-colors ${social.color} ${social.bgColor}`}>
                  {social.icon}
                </div>
                <div className="min-w-0">
                  <h3 className="text-[15px] font-semibold text-white truncate">{social.name}</h3>
                  <p className="text-[12px] text-zinc-500 truncate mt-0.5">{social.handle}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 pl-4">
                <span className="hidden sm:block text-[10px] font-bold uppercase tracking-wider text-zinc-500 group-hover:text-white transition-colors">Follow</span>
                <ArrowUpRight size={18} className="text-zinc-600 group-hover:text-yellow-500 transition-colors" />
              </div>
            </a>
          ))}
        </div>

        <div className="mt-10 text-center">
          <p className="text-[11px] text-zinc-600">
            Tag us in your campus moments using <span className="text-yellow-500 font-semibold">#ObongRadio</span>
          </p>
        </div>
      </div>

      <NowPlaying currentShow={currentShowData} isPlaying={true} />
    </div>
  );
};

export default Socials;