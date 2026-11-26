// src/context/AudioPlayerContext.jsx
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useMemo,
} from "react";
import { Room, RoomEvent, Track } from "livekit-client";
import {
  useGetListenerTokenQuery,
  useLazyGetNowPlayingQuery,
} from "../features/radioApiSlice";
import { socket } from "../services/socket";

const AudioPlayerContext = createContext();
export const useAudioPlayer = () => useContext(AudioPlayerContext);

const STALL_TIMEOUT_MS = 12000;
const DRIFT_THRESHOLD_SEC = 3;   // only re-seek if we're more than this off
const SYNC_POLL_MS = 45000;      // server re-sync cadence

const DEFAULT_COVER =
  "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=600&auto=format&fit=crop";
const MUSIC_BG =
  "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=1200&auto=format&fit=crop";
const LIVE_BG =
  "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?q=80&w=1200&auto=format&fit=crop";

const safePlay = (el, onBlocked) => {
  if (!el) return;
  const playPromise = el.play();
  if (playPromise !== undefined) {
    playPromise.catch((error) => {
      if (error.name === "AbortError") return;
      if (error.name === "NotAllowedError") onBlocked?.();
      else console.warn("Audio playback error:", error);
    });
  }
};

export const AudioPlayerProvider = ({ children }) => {
  /* ============================================================
     PLAYBACK INTENT
     ============================================================ */
  const [isPlaying, setIsPlaying] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(70);

  // The server-synchronized "what everyone is hearing right now"
  // shape: { track, offsetSec, durationSec, index, nextTrack }
  const [nowPlaying, setNowPlaying] = useState(null);

  /* ============================================================
     REFS
     ============================================================ */
  const audioRef = useRef(null);
  const livekitRoomRef = useRef(null);
  const livekitAudioContainerRef = useRef(null);

  // Mutable mirrors — event handlers + timers read these, never state
  const isPlayingRef = useRef(false);
  const isLiveRef = useRef(false);
  const volumeRef = useRef(70);
  const mutedRef = useRef(false);
  const tokenRef = useRef(null);

  // Synchronization state
  const currentTrackIdRef = useRef(null);      // Mongo _id of the track we've loaded
  const anchorRef = useRef({ offset: 0, at: 0 }); // local drift-calc anchor

  // Failure / stall handling
  const stallTimerRef = useRef(null);
  const failCountRef = useRef(0);

  /* ============================================================
     SERVER DATA
     ============================================================ */
  const { data: tokenData, refetch: refetchToken } = useGetListenerTokenQuery(
    undefined,
    { pollingInterval: 30000 }
  );
  const [fetchNowPlaying] = useLazyGetNowPlayingQuery();

  const isLive = tokenData?.active === true && !!tokenData?.token;
  const isMusicMode = !isLive;

  // Keep refs in sync every render
  isLiveRef.current = isLive;
  tokenRef.current = tokenData?.token || null;
  volumeRef.current = volume;
  mutedRef.current = isMuted;

  /* ============================================================
     STALL TIMER
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

  const armStallTimer = () => {
    clearStallTimer();
    stallTimerRef.current = setTimeout(() => {
      stallTimerRef.current = null;
      if (!isPlayingRef.current || isLiveRef.current) return;
      console.warn("Track took too long to start — re-syncing from server.");
      // Instead of skipping to the next track, re-fetch from the server.
      // It might point to the same track at a different offset, or a new track.
      resyncFromServer();
    }, STALL_TIMEOUT_MS);
  };

  /* ============================================================
     CORE: load a track at the server-given offset
     ============================================================ */
  const loadSyncedTrack = (np, autoplay) => {
    const audio = audioRef.current;
    if (!audio || !np?.track) return;

    const { track, offsetSec } = np;
    const isSameTrack = currentTrackIdRef.current === track._id;

    // Update anchor so local progress / drift calc is fresh
    anchorRef.current = { offset: offsetSec || 0, at: performance.now() };
    setNowPlaying(np);

    // Same track + already close enough → just correct drift, don't reload
    if (isSameTrack && audio.src) {
      const drift = Math.abs(audio.currentTime - (offsetSec || 0));
      if (drift > DRIFT_THRESHOLD_SEC) {
        audio.currentTime = offsetSec || 0;
        anchorRef.current = { offset: offsetSec || 0, at: performance.now() };
      }
      return;
    }

    // New track → load, seek, play
    currentTrackIdRef.current = track._id;
    audio.src = track.audioUrl;
    audio.load();

    const seekAndPlay = () => {
      try {
        audio.currentTime = offsetSec || 0;
      } catch (_) {
        /* seeking before metadata is ready — onloadedmetadata will fire */
      }
      if (autoplay) {
        setIsBuffering(true);
        armStallTimer();
        safePlay(audio, onAutoplayBlocked);
      }
    };

    if (audio.readyState >= 1) {
      seekAndPlay();
    } else {
      audio.addEventListener("loadedmetadata", seekAndPlay, { once: true });
    }
  };

  /* ============================================================
     RESYNC FROM SERVER (used by stall timer + poll + ended)
     ============================================================ */
  const resyncFromServer = async () => {
    if (!isMusicMode) return;
    try {
      const res = await fetchNowPlaying().unwrap();
      const np = res?.nowPlaying;
      if (!np?.track) return;
      loadSyncedTrack(np, isPlayingRef.current);
    } catch (err) {
      console.warn("resyncFromServer failed:", err?.message);
    }
  };

  /* ============================================================
     INITIAL SYNC — whenever tokenData gives us a nowPlaying snapshot
     ============================================================ */
  useEffect(() => {
    if (!isMusicMode) return;
    const np = tokenData?.nowPlaying;
    if (!np?.track) return;

    // If the track changed on the server, adopt it
    const changedTrack = currentTrackIdRef.current !== np.track._id;
    if (changedTrack) {
      loadSyncedTrack(np, isPlayingRef.current);
    } else {
      // Same track — keep the anchor accurate without disturbing playback
      anchorRef.current = { offset: np.offsetSec || 0, at: performance.now() };
      setNowPlaying(np);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tokenData?.nowPlaying?.track?._id, isMusicMode]);

  /* ============================================================
     DRIFT CORRECTION POLL — every 45s while playing
     ============================================================ */
  useEffect(() => {
    if (!isMusicMode || !isPlaying) return;

    const interval = setInterval(() => {
      resyncFromServer();
    }, SYNC_POLL_MS);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMusicMode, isPlaying]);

  /* ============================================================
     SOCKET: admin changed the track → jump everyone instantly
     ============================================================ */
  useEffect(() => {
    const handleTrackChanged = ({ nowPlaying: np }) => {
      if (!np?.track) return;
      loadSyncedTrack(np, isPlayingRef.current);
    };
    socket.on("radio:track_changed", handleTrackChanged);
    return () => socket.off("radio:track_changed", handleTrackChanged);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ============================================================
     SWITCHING BETWEEN LIVE AND MUSIC
     ============================================================ */
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (!isMusicMode) {
      // Going live → silence local audio
      audio.pause();
      clearStallTimer();
      setIsBuffering(false);
    } else if (isPlayingRef.current && currentTrackIdRef.current) {
      // Back to Auto-DJ → re-sync
      resyncFromServer();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMusicMode]);

  /* ============================================================
     <audio> EVENT HANDLERS
     ============================================================ */
  const handlePlaying = () => {
    clearStallTimer();
    failCountRef.current = 0;
    setIsBuffering(false);
  };

  const handleWaiting = () => {
    if (!isPlayingRef.current || isLiveRef.current) return;
    setIsBuffering(true);
    armStallTimer();
  };

  const handleError = () => {
    const audio = audioRef.current;
    if (!audio || !audio.getAttribute("src") || isLiveRef.current) return;
    failCountRef.current += 1;
    if (failCountRef.current > 3) {
      console.error("Too many consecutive playback errors — pausing.");
      isPlayingRef.current = false;
      setIsPlaying(false);
      setIsBuffering(false);
      return;
    }
    // Ask the server which track should be playing now
    resyncFromServer();
  };

  const handleEnded = () => {
    // Track finished — fetch the fresh "now playing" (which may be the next
    // track at offset 0, or something else if the admin hopped around).
    resyncFromServer();
  };

  /* ============================================================
     LIVEKIT (unchanged behaviour — only reconnects on live/music flip)
     ============================================================ */
  useEffect(() => {
    if (!isLive) return;

    let cancelled = false;
    const room = new Room();
    livekitRoomRef.current = room;

    room.on(RoomEvent.TrackSubscribed, (track) => {
      if (track.kind !== Track.Kind.Audio) return;
      const audioEl = track.attach();
      audioEl.volume = volumeRef.current / 100;
      audioEl.muted = mutedRef.current;
      livekitAudioContainerRef.current?.appendChild(audioEl);
      if (isPlayingRef.current) safePlay(audioEl);
    });

    room.on(RoomEvent.TrackUnsubscribed, (track) => {
      track.detach().forEach((el) => el.remove());
    });

    room
      .connect(
        import.meta.env.VITE_LIVEKIT_URL || "wss://your-url.livekit.cloud",
        tokenRef.current
      )
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
    livekitAudioContainerRef.current?.querySelectorAll("audio").forEach((el) => {
      el.volume = volume / 100;
      el.muted = isMuted;
    });
  }, [volume, isMuted]);

  /* ============================================================
     CLEANUP
     ============================================================ */
  useEffect(() => {
    return () => {
      clearStallTimer();
    };
  }, []);

  /* ============================================================
     CONTROLS
     ============================================================ */
  const togglePlay = async () => {
    const next = !isPlayingRef.current;
    isPlayingRef.current = next;
    setIsPlaying(next);

    // ---- LIVE MODE ----
    if (isLiveRef.current) {
      livekitRoomRef.current?.startAudio?.().catch(() => {});
      livekitAudioContainerRef.current
        ?.querySelectorAll("audio")
        .forEach((el) => {
          if (next) safePlay(el);
          else el.pause();
        });
      return;
    }

    // ---- AUTO-DJ MODE ----
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

    // First play → ask server where we should be and jump there
    if (!currentTrackIdRef.current) {
      await resyncFromServer();
      return;
    }

    // Same track → make sure we're aligned, then play
    try {
      const res = await fetchNowPlaying().unwrap();
      const np = res?.nowPlaying;
      if (np?.track) {
        const drift = Math.abs(audio.currentTime - (np.offsetSec || 0));
        if (np.track._id !== currentTrackIdRef.current || drift > DRIFT_THRESHOLD_SEC) {
          loadSyncedTrack(np, true);
          return;
        }
      }
    } catch (err) {
      console.warn("Pre-play sync failed:", err?.message);
    }

    armStallTimer();
    safePlay(audio, onAutoplayBlocked);
  };

  const handleVolumeChange = (e) => {
    const newVol = Number(e.target.value);
    setVolume(newVol);
    setIsMuted(newVol === 0);
  };

  const toggleMute = () => {
    if (isMuted && volume === 0) setVolume(70);
    setIsMuted(!isMuted);
  };

  /* ============================================================
     DERIVED DATA
     ============================================================ */
  const currentShow = useMemo(() => {
    if (!isMusicMode) {
      return {
        title: tokenData?.session?.title || "Live Broadcast",
        host: tokenData?.session?.hostName || "O.U Radio",
        image: tokenData?.session?.posterImage || LIVE_BG,
      };
    }
    const np = nowPlaying || tokenData?.nowPlaying;
    if (np?.track) {
      return {
        title: np.track.title,
        host: np.track.artist,
        image: np.track.image || DEFAULT_COVER,
      };
    }
    return {
      title: "Auto DJ",
      host: "Getting tracks ready…",
      image: DEFAULT_COVER,
    };
  }, [isMusicMode, nowPlaying, tokenData]);

  const showImage = isMusicMode
    ? MUSIC_BG
    : tokenData?.session?.posterImage || LIVE_BG;

  return (
    <AudioPlayerContext.Provider
      value={{
        // Playback state
        isPlaying,
        isBuffering,
        isMusicMode,
        isLive,
        // Data
        nowPlaying: nowPlaying || tokenData?.nowPlaying || null,
        currentShow,
        showImage,
        // Controls
        volume,
        isMuted,
        togglePlay,
        toggleMute,
        handleVolumeChange,
        // Escape hatches
        refetchToken,
        resyncFromServer,
      }}
    >
      <div ref={livekitAudioContainerRef} className="hidden" />
      <audio
        ref={audioRef}
        preload="auto"
        onPlaying={handlePlaying}
        onWaiting={handleWaiting}
        onError={handleError}
        onEnded={handleEnded}
        className="hidden"
      />
      {children}
    </AudioPlayerContext.Provider>
  );
};