// src/context/AudioPlayerContext.jsx
import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { Room, RoomEvent, Track } from 'livekit-client';
import { useGetListenerTokenQuery, useGetMusicQueueQuery } from '../features/radioApiSlice';

const AudioPlayerContext = createContext();

export const useAudioPlayer = () => useContext(AudioPlayerContext);

const safePlay = (audioEl) => {
  if (!audioEl) return;
  const playPromise = audioEl.play();
  if (playPromise !== undefined) {
    playPromise.catch((error) => {
      if (error.name !== 'AbortError') console.warn("Audio playback error:", error);
    });
  }
};

export const AudioPlayerProvider = ({ children }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(70);
  const [isMusicMode, setIsMusicMode] = useState(false);
  const [currentTrack, setCurrentTrack] = useState({ title: 'Auto DJ', artist: 'Playing...' });
  
  const livekitRoomRef = useRef(null);
  const audioRef = useRef(null); 
  const livekitAudioContainerRef = useRef(null);
  const currentSongIndexRef = useRef(0);

  // Global Fetching
  const { data: tokenData } = useGetListenerTokenQuery(undefined, { pollingInterval: 30000 });
  const { data: queueData } = useGetMusicQueueQuery(undefined, { skip: tokenData?.active === true });

  // LiveKit Connection
  useEffect(() => {
    if (!tokenData?.token || tokenData?.active === false) {
      setIsMusicMode(true);
      return;
    }
    setIsMusicMode(false); 
    const room = new Room();
    livekitRoomRef.current = room;

    const connectToRoom = async () => {
      await room.connect(import.meta.env.VITE_LIVEKIT_URL || 'wss://your-url.livekit.cloud', tokenData.token);
      room.on(RoomEvent.TrackSubscribed, (track) => {
        if (track.kind === Track.Kind.Audio) {
          const audioElement = track.attach();
          livekitAudioContainerRef.current?.appendChild(audioElement);
          if (isPlaying) safePlay(audioElement);
        }
      });
    };
    connectToRoom();

    return () => { room.disconnect(); };
  }, [tokenData]);

  // Auto DJ Playback
  const activeMusicQueue = tokenData?.musicQueue?.length > 0 ? tokenData.musicQueue : queueData?.queue || [];

  useEffect(() => {
    if (isMusicMode && activeMusicQueue.length > 0 && audioRef.current) {
      const song = activeMusicQueue[currentSongIndexRef.current];
      setCurrentTrack({ title: song.title, artist: song.artist });
      if (audioRef.current.src !== song.audioUrl) {
        audioRef.current.src = song.audioUrl;
        if (isPlaying) safePlay(audioRef.current);
      }
    }
  }, [isMusicMode, activeMusicQueue, isPlaying]);

  const handleSongEnd = () => {
    if (activeMusicQueue.length > 0) {
      currentSongIndexRef.current = (currentSongIndexRef.current + 1) % activeMusicQueue.length;
      const nextSong = activeMusicQueue[currentSongIndexRef.current];
      setCurrentTrack({ title: nextSong.title, artist: nextSong.artist });
      audioRef.current.src = nextSong.audioUrl;
      safePlay(audioRef.current); 
    }
  };

  // Controls
  const togglePlay = () => {
    const newPlayState = !isPlaying;
    setIsPlaying(newPlayState);
    if (livekitRoomRef.current) {
      livekitRoomRef.current.localParticipant.setMicrophoneEnabled(false); 
      const audioEls = livekitAudioContainerRef.current?.querySelectorAll('audio');
      audioEls?.forEach(el => newPlayState ? safePlay(el) : el.pause());
    } 
    if (isMusicMode && audioRef.current) {
      if (newPlayState) safePlay(audioRef.current);
      else audioRef.current.pause();
    }
  };

  const handleVolumeChange = (e) => {
    const newVol = Number(e.target.value);
    setVolume(newVol);
    setIsMuted(newVol === 0);
    if (audioRef.current) audioRef.current.volume = newVol / 100;
    const audioEls = livekitAudioContainerRef.current?.querySelectorAll('audio');
    audioEls?.forEach(el => el.volume = newVol / 100);
  };

  const toggleMute = () => {
    const newMuteState = !isMuted;
    setIsMuted(newMuteState);
    if (audioRef.current) audioRef.current.muted = newMuteState;
    const audioEls = livekitAudioContainerRef.current?.querySelectorAll('audio');
    audioEls?.forEach(el => el.muted = newMuteState);
  };

  // Derived Data
  const showImage = isMusicMode 
    ? "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=1200&auto=format&fit=crop" 
    : tokenData?.session?.posterImage || "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?q=80&w=1200&auto=format&fit=crop";

  const currentShow = isMusicMode 
    ? { title: currentTrack.title, host: currentTrack.artist, image: activeMusicQueue[currentSongIndexRef.current]?.image || showImage }
    : { title: tokenData?.session?.title || 'Live Broadcast', host: tokenData?.session?.hostName || 'O.U Radio', image: showImage };

  return (
    <AudioPlayerContext.Provider value={{
      isPlaying, isMusicMode, currentShow, volume, isMuted,
      togglePlay, toggleMute, handleVolumeChange, showImage
    }}>
      <div ref={livekitAudioContainerRef} className="hidden" />
      <audio ref={audioRef} onEnded={handleSongEnd} className="hidden" />
      {children}
    </AudioPlayerContext.Provider>
  );
};