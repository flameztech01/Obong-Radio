// src/context/AudioPlayerContext.jsx
import React, { createContext, useContext, useState, useEffect, useRef, useMemo } from 'react';
import { Room, RoomEvent, Track } from 'livekit-client';
import { useGetListenerTokenQuery, useGetMusicQueueQuery } from '../features/radioApiSlice';

const AudioPlayerContext = createContext();

export const useAudioPlayer = () => useContext(AudioPlayerContext);

const EMPTY_QUEUE = [];
const STALL_TIMEOUT_MS = 12000; // if a track hasn't started playing after this, skip it
const DEFAULT_COVER = "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=600&auto=format&fit=crop";
const MUSIC_BG = "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=1200&auto=format&fit=crop";
const LIVE_BG = "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?q=80&w=1200&auto=format&fit=crop";

const safePlay = (el, onBlocked) => {
  if (!el) return;
  const playPromise = el.play();
  if (playPromise !== undefined) {
    playPromise.catch((error) => {
      if (error.name === 'AbortError') return; // interrupted by a new load, normal
      if (error.name === 'NotAllowedError') onBlocked?.(); // browser blocked autoplay
      else console.warn("Audio playback error:", error);
    });
  }
};

export const AudioPlayerProvider = ({ children }) => {
  const [isPlaying, setIsPlaying] = useState(false);     // what the listener WANTS (play/pause intent)
  const [isBuffering, setIsBuffering] = useState(false); // true until audio is actually coming out
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(70);
  const [currentTrack, setCurrentTrack] = useState({ title: 'Auto DJ', artist: 'Getting tracks ready...', image: null });

  // DOM / SDK refs
  const livekitRoomRef = useRef(null);
  const audioRef = useRef(null);
  const livekitAudioContainerRef = useRef(null);
  const preloadRef = useRef(null);

  // Mutable state refs (so event handlers and timers never read stale values)
  const isPlayingRef = useRef(false);
  const isLiveRef = useRef(false);
  const volumeRef = useRef(70);
  const mutedRef = useRef(false);
  const tokenRef = useRef(null);
  const queueRef = useRef(EMPTY_QUEUE);
  const indexRef = useRef(0);
  const hasLoadedRef = useRef(false);
  const failCountRef = useRef(0);
  const stallTimerRef = useRef(null);
  const preloadedIndexRef = useRef(-1);

  // Global fetching
  const { data: tokenData } = useGetListenerTokenQuery(undefined, { pollingInterval: 30000 });
  const isLive = tokenData?.active === true && !!tokenData?.token;
  const isMusicMode = !isLive;
  const { data: queueData } = useGetMusicQueueQuery(undefined, { skip: isLive });

  // Stable queue reference (the old code created a new [] every render)
  const musicQueue = useMemo(() => {
    if (tokenData?.musicQueue?.length > 0) return tokenData.musicQueue;
    return queueData?.queue?.length > 0 ? queueData.queue : EMPTY_QUEUE;
  }, [tokenData?.musicQueue, queueData?.queue]);

  // Keep refs in sync every render
  isLiveRef.current = isLive;
  tokenRef.current = tokenData?.token || null;
  queueRef.current = musicQueue;
  volumeRef.current = volume;
  mutedRef.current = isMuted;

  /* ============================================================
     AUTO DJ ENGINE
     ============================================================ */
  const clearStallTimer = () => {
    if (stallTimerRef.current) {
      clearTimeout(stallTimerRef.current);
      stallTimerRef.current = null;
    }
  };

  const onAutoplayBlocked = () => {
    clearStallTimer();
    isPlayingRef.current = false;
    setIsPlaying(false);
    setIsBuffering(false);
  };

  // Start a timer: if audio hasn't actually started by then, skip to the next track
  const armStallTimer = () => {
    clearStallTimer();
    stallTimerRef.current = setTimeout(() => {
      stallTimerRef.current = null;
      if (!isPlayingRef.current || isLiveRef.current) return;
      console.warn("Track took too long to start, skipping...");
      skipAfterFailure();
    }, STALL_TIMEOUT_MS);
  };

  const preloadNext = (currentIndex) => {
    const q = queueRef.current;
    if (q.length < 2) return;
    const next = q[(currentIndex + 1) % q.length];
    if (!next?.audioUrl) return;
    if (!preloadRef.current) preloadRef.current = new Audio();
    preloadRef.current.preload = 'auto';
    preloadRef.current.src = next.audioUrl;
  };

  const loadTrack = (index, autoplay) => {
    const audio = audioRef.current;
    const q = queueRef.current;
    if (!audio || q.length === 0) return;

    const i = ((index % q.length) + q.length) % q.length;
    const song = q[i];

    indexRef.current = i;
    hasLoadedRef.current = true;
    setCurrentTrack({ title: song.title, artist: song.artist, image: song.image });

    audio.src = song.audioUrl;
    audio.load();

    if (autoplay) {
      setIsBuffering(true);
      armStallTimer();
      safePlay(audio, onAutoplayBlocked);
    } else {
      setIsBuffering(false);
      clearStallTimer();
    }
  };

  const skipAfterFailure = () => {
    const q = queueRef.current;
    failCountRef.current += 1;

    // Every track in the queue failed in a row: stop instead of looping forever
    if (q.length === 0 || failCountRef.current >= q.length) {
      console.error("No playable tracks found in the queue.");
      failCountRef.current = 0;
      clearStallTimer();
      isPlayingRef.current = false;
      setIsPlaying(false);
      setIsBuffering(false);
      return;
    }

    loadTrack(indexRef.current + 1, isPlayingRef.current);
  };

  // <audio> element events: the source of truth for "is sound really playing"
  const handlePlaying = () => {
    clearStallTimer();
    failCountRef.current = 0;
    setIsBuffering(false);

    // Audio is flowing, so warm up the next track in the background
    if (preloadedIndexRef.current !== indexRef.current) {
      preloadedIndexRef.current = indexRef.current;
      preloadNext(indexRef.current);
    }
  };

  const handleWaiting = () => {
    if (!isPlayingRef.current || isLiveRef.current) return;
    setIsBuffering(true);
    armStallTimer();
  };

  const handleError = () => {
    const audio = audioRef.current;
    if (!audio || !audio.getAttribute('src') || isLiveRef.current) return;
    console.warn("Track failed to load:", audio.src, "code:", audio.error?.code);
    skipAfterFailure();
  };

  const handleSongEnd = () => {
    clearStallTimer();
    loadTrack(indexRef.current + 1, true);
  };

  // First load: pick a random starting track once the queue arrives
  useEffect(() => {
    if (!isMusicMode || musicQueue.length === 0 || hasLoadedRef.current) return;
    loadTrack(Math.floor(Math.random() * musicQueue.length), isPlayingRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMusicMode, musicQueue]);

  // Switching between live and Auto DJ
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (!isMusicMode) {
      audio.pause();
      clearStallTimer();
      setIsBuffering(false);
    } else if (isPlayingRef.current && hasLoadedRef.current) {
      setIsBuffering(true);
      armStallTimer();
      safePlay(audio, onAutoplayBlocked);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMusicMode]);

  /* ============================================================
     LIVEKIT (only reconnects when going live / ending, NOT on every poll)
     ============================================================ */
  useEffect(() => {
    if (!isLive) return;

    let cancelled = false;
    const room = new Room();
    livekitRoomRef.current = room;

    room.on(RoomEvent.TrackSubscribed, (track) => {
      if (track.kind !== Track.Kind.Audio) return;
      const audioElement = track.attach();
      audioElement.volume = volumeRef.current / 100;
      audioElement.muted = mutedRef.current;
      livekitAudioContainerRef.current?.appendChild(audioElement);
      if (isPlayingRef.current) safePlay(audioElement);
    });

    room.on(RoomEvent.TrackUnsubscribed, (track) => {
      track.detach().forEach((el) => el.remove());
    });

    room
      .connect(import.meta.env.VITE_LIVEKIT_URL || 'wss://your-url.livekit.cloud', tokenRef.current)
      .catch((err) => {
        if (!cancelled) console.error("LiveKit connect failed:", err);
      });

    return () => {
      cancelled = true;
      room.disconnect();
      livekitRoomRef.current = null;
      livekitAudioContainerRef.current?.replaceChildren();
    };
  }, [isLive]);

  /* ============================================================
     VOLUME / MUTE SYNC
     ============================================================ */
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume / 100;
      audioRef.current.muted = isMuted;
    }
    livekitAudioContainerRef.current?.querySelectorAll('audio').forEach((el) => {
      el.volume = volume / 100;
      el.muted = isMuted;
    });
  }, [volume, isMuted]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearStallTimer();
      if (preloadRef.current) {
        preloadRef.current.removeAttribute('src');
        preloadRef.current.load();
      }
    };
  }, []);

  /* ============================================================
     CONTROLS
     ============================================================ */
  const togglePlay = () => {
    const next = !isPlayingRef.current;
    isPlayingRef.current = next;
    setIsPlaying(next);

    // Live stream
    if (isLiveRef.current) {
      livekitRoomRef.current?.startAudio?.().catch(() => {});
      livekitAudioContainerRef.current?.querySelectorAll('audio').forEach((el) => {
        if (next) safePlay(el);
        else el.pause();
      });
      return;
    }

    // Auto DJ
    const audio = audioRef.current;
    if (!audio) return;

    if (!next) {
      audio.pause();
      clearStallTimer();
      setIsBuffering(false);
      return;
    }

    failCountRef.current = 0;
    setIsBuffering(true);

    // Queue hasn't arrived yet: the first-load effect will autoplay as soon as it does
    if (!hasLoadedRef.current) return;

    armStallTimer();
    safePlay(audio, onAutoplayBlocked);
  };

  const handleVolumeChange = (e) => {
    const newVol = Number(e.target.value);
    setVolume(newVol);
    setIsMuted(newVol === 0);
  };

  const toggleMute = () => {
    if (isMuted && volume === 0) setVolume(70); // unmuting at 0 would still be silent
    setIsMuted(!isMuted);
  };

  /* ============================================================
     DERIVED DATA
     ============================================================ */
  const showImage = isMusicMode
    ? MUSIC_BG
    : tokenData?.session?.posterImage || LIVE_BG;

  const currentShow = isMusicMode
    ? { title: currentTrack.title, host: currentTrack.artist, image: currentTrack.image || DEFAULT_COVER }
    : {
        title: tokenData?.session?.title || 'Live Broadcast',
        host: tokenData?.session?.hostName || 'O.U Radio',
        image: showImage,
      };

  return (
    <AudioPlayerContext.Provider value={{
      isPlaying, isBuffering, isMusicMode, currentShow, volume, isMuted,
      togglePlay, toggleMute, handleVolumeChange, showImage
    }}>
      <div ref={livekitAudioContainerRef} className="hidden" />
      <audio
        ref={audioRef}
        preload="auto"
        onPlaying={handlePlaying}
        onWaiting={handleWaiting}
        onError={handleError}
        onEnded={handleSongEnd}
        className="hidden"
      />
      {children}
    </AudioPlayerContext.Provider>
  );
};