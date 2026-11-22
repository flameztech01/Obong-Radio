// src/components/LiveChat.jsx
import React, { useState, useEffect, useRef } from 'react';
import { X, Send, Radio, User } from 'lucide-react';

const LiveChat = ({ isOpen, onClose, currentShow }) => {
  const [messages, setMessages] = useState([
    { id: 1, user: 'Chinedu', text: 'This morning show is fire! 🔥', time: '08:02 AM' },
    { id: 2, user: 'Amaka', text: 'Tobi is doing a great job today.', time: '08:04 AM' },
    { id: 3, user: 'Femi', text: 'Please play some Burna Boy next!', time: '08:05 AM' },
  ]);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom of chat
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) scrollToBottom();
  }, [messages, isOpen]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const newMessage = {
      id: Date.now(),
      user: 'You',
      text: input.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isMe: true
    };

    setMessages([...messages, newMessage]);
    setInput('');
  };

  if (!isOpen) return null;

  // Fallback image just in case
  const fallbackImage = "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?q=80&w=200&auto=format&fit=crop";

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 md:hidden transition-opacity"
        onClick={onClose}
      />

      {/* Chat Container */}
      <div className={`
        fixed z-50 flex flex-col bg-zinc-950 border-zinc-800 transition-transform duration-300
        /* Mobile: Full screen slide up */
        inset-0 md:inset-auto 
        /* Desktop: Bottom right side drawer */
        md:bottom-24 md:right-6 md:w-[380px] md:h-[600px] md:max-h-[calc(100vh-8rem)] md:rounded-2xl md:border md:shadow-2xl
        ${isOpen ? 'translate-y-0' : 'translate-y-full md:translate-y-0 md:opacity-0 md:pointer-events-none'}
      `}>
        
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-zinc-800 bg-zinc-900 p-4 md:rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-yellow-500/10">
              <Radio className="h-4 w-4 text-yellow-500" />
            </div>
            <div>
              <h2 className="text-[14px] font-bold text-white tracking-wide">Live Chat</h2>
              <p className="text-[10px] font-medium text-zinc-400">1.2k listening</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Now Playing Summary */}
        <div className="flex shrink-0 items-center gap-3 border-b border-zinc-800 bg-zinc-900/50 p-3">
          {/* Updated Image Container */}
          <div className="h-10 w-10 shrink-0 overflow-hidden rounded-md border border-zinc-700 bg-zinc-800">
            <img 
              src={currentShow.image || fallbackImage} 
              alt="Cover" 
              className="h-full w-full object-cover" 
            />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold uppercase tracking-wider text-yellow-500">Now Playing</p>
            <p className="truncate text-[12px] font-semibold text-white">{currentShow.title}</p>
            <p className="truncate text-[10px] text-zinc-500">{currentShow.host}</p>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div className="text-center text-[10px] font-medium text-zinc-600 uppercase tracking-widest my-2">Today</div>
          
          {messages.map((msg) => (
            <div key={msg.id} className={`flex flex-col ${msg.isMe ? 'items-end' : 'items-start'}`}>
              <div className="flex items-baseline gap-2 mb-1 px-1">
                <span className={`text-[11px] font-semibold ${msg.isMe ? 'text-yellow-500' : 'text-zinc-400'}`}>
                  {msg.user}
                </span>
                <span className="text-[9px] text-zinc-600">{msg.time}</span>
              </div>
              <div className={`
                max-w-[85%] rounded-2xl px-4 py-2.5 text-[13px] leading-relaxed shadow-sm
                ${msg.isMe 
                  ? 'bg-yellow-500 text-zinc-950 rounded-tr-sm font-medium' 
                  : 'bg-zinc-900 text-zinc-200 border border-zinc-800 rounded-tl-sm'}
              `}>
                {msg.text}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <form onSubmit={handleSend} className="shrink-0 border-t border-zinc-800 bg-zinc-900 p-3 md:rounded-b-2xl">
          <div className="relative flex items-center">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Send a message..."
              className="w-full rounded-full border border-zinc-700 bg-zinc-950 py-3 pl-4 pr-12 text-[13px] text-white placeholder-zinc-500 focus:border-yellow-500/50 focus:outline-none focus:ring-1 focus:ring-yellow-500/50 transition-all"
            />
            <button 
              type="submit"
              disabled={!input.trim()}
              className="absolute right-2 flex h-8 w-8 items-center justify-center rounded-full bg-yellow-500 text-zinc-950 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-yellow-400 transition-colors"
            >
              <Send size={14} className="ml-0.5" />
            </button>
          </div>
        </form>
      </div>
    </>
  );
};

export default LiveChat;