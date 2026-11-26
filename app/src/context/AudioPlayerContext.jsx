// src/context/AudioPlayerContext.jsx
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
} from "react";
import { Room, RoomEvent, Track } from "livekit-client";
import {
  useGetListenerTokenQuery,
  useLazyGetNowPlayingQuery,
} from "../features/radioApiSlice";
import { socket } from "../services/socket";

const AudioPlayerContext = createContext();
export const useAudioPlayer = () => useContext(AudioPlayerContext);

/* ============================================================
   CONSTANTS
   ============================================================ */
const STALL_TIMEOUT_MS = 12000;       // skip/resync if playback never starts
const DRIFT_THRESHOLD_SEC = 3;        // only re-seek if we're this far off
const SYNC_POLL_MS = 45000;           // server re-sync cadence while playing
const MAX_CONSECUTIVE_ERRORS = 3;     // give up after N failed tracks

const DEFAULT_COVER =
  "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=600&auto=format&fit=crop";
const MUSIC_BG =
  "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=1200&auto=format&fit=crop";
const LIVE_BG =
  "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?q=80&w=1200&auto=format&fit=crop";

/* ============================================================
   SAFE PLAY — never throws, logs useful diagnostics
   ============================================================ */
const safePlay = (el, onBlocked) => {
  if (!el) return;
  const promise = el.play();
  if (promise !== undefined) {
    promise
      .then(() => {
        // Silent success — handlePlaying will fire soon
      })
      .catch((error) => {
        if (error.name === "AbortError") return; // interrupted by new load — normal
        if (error.name === "NotAllowedError") {
          onBlocked?.();
          return;
        }
        console.warn(
          "[Player] play() rejected:",
          error.name,
          "—",
          error.message,
          "| src:",
          (el.src || "").slice(0, 100)
        );
      });
  }
};

/* ============================================================
   PROVIDER
   ============================================================ */
export const AudioPlayerProvider = ({ children }) => {
  /* ---------- Playback intent ---------- */
  const [isPlaying, setIsPlaying] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(70);

  // Server-synchronized "everyone is hearing this exact second"
  // shape: { track, offsetSec, durationSec, index, nextTrack }
  const [nowPlaying, setNowPlaying] = useState(null);

  /* ---------- Refs ---------- */
  const audioRef = useRef(null);
  const livekitRoomRef = useRef(null);
  const livekitAudioContainerRef = useRef(null);

  // Mutable mirrors — event handlers + timers never read stale state
  const isPlayingRef = useRef(false);
  const isLiveRef = useRef(false);
  const volumeRef = useRef(70);
  const mutedRef = useRef(false);
  const tokenRef = useRef(null);

  // Synchronization
  const currentTrackIdRef = useRef(null);
  const anchorRef = useRef({ offset: 0, at: 0 });

  // Failure handling
  const stallTimerRef = useRef(null);
  const failCountRef = useRef(0);

  /* ---------- Server data ---------- */
  const { data: tokenData, refetch: refetchToken } = useGetListenerTokenQuery(
    undefined,
    { pollingInterval: 30000 }
  );
  const [fetchNowPlaying] = useLazyGetNowPlayingQuery();

  const isLive = tokenData?.active === true && !!tokenData?.token;
  const isMusicMode = !isLive;

  // Keep refs in sync every render
  isPlayingRef.current = isPlaying;
  isLiveRef.current = isLive;
  tokenRef.current = tokenData?.token || null;
  volumeRef.current = volume;
  mutedRef.current = isMuted;

  /* ============================================================
     STALL TIMER
     ============================================================ */
  const clearStallTimer = useCallback(() => {
    if (stallTimerRef.current) {
      clearTimeout(stallTimerRef.current);
      stallTimerRef.current = null;
    }
  }, []);

  const onAutoplayBlocked = useCallback(() => {
    clearStallTimer();
    isPlayingRef.current = false;
    setIsPlaying(false);
    setIsBuffering(false);
  }, [clearStallTimer]);

  /* ============================================================
     LOAD A TRACK AT THE SERVER-GIVEN OFFSET
     — this is the heart of the sync engine
     ============================================================ */
  const loadSyncedTrack = useCallback(
    (np, autoplay) => {
      const audio = audioRef.current;
      if (!audio || !np?.track) return;

      const { track, offsetSec } = np;
      const isSameTrack = currentTrackIdRef.current === track._id;

      // Refresh anchor so local progress calc is accurate
      anchorRef.current = { offset: offsetSec || 0, at: performance.now() };
      setNowPlaying(np);

      /* ---------- SAME TRACK: drift-correct + honour play intent ---------- */
      if (isSameTrack && audio.src) {
        const drift = Math.abs(audio.currentTime - (offsetSec || 0));

        if (drift > DRIFT_THRESHOLD_SEC) {
          try {
            audio.currentTime = offsetSec || 0;
          } catch (_) {
            /* seek before ready — will be corrected on next poll */
          }
        }

        // ✅ THE FIX — if the user wants playback and audio is paused,
        //    start it now instead of silently returning.
        if (autoplay && audio.paused) {
          setIsBuffering(true);
          armStallTimer();
          safePlay(audio, onAutoplayBlocked);
        }
        return;
      }

      /* ---------- NEW TRACK: load, seek after metadata, play ---------- */
      currentTrackIdRef.current = track._id;
      audio.src = track.audioUrl;
      audio.load();

      const seekAndPlay = () => {
        try {
          audio.currentTime = offsetSec || 0;
        } catch (_) {
          /* seek not ready — retry on next sync */
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
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  /* ---------- Arm stall timer ---------- */
  const armStallTimer = useCallback(() => {
    clearStallTimer();
    stallTimerRef.current = setTimeout(() => {
      stallTimerRef.current = null;
      if (!isPlayingRef.current || isLiveRef.current) return;
      console.warn("[Player] Stall — re-syncing from server.");
      // eslint-disable-next-line no-use-before-define
      resyncFromServer();
    }, STALL_TIMEOUT_MS);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clearStallTimer]);

  /* ============================================================
     RESYNC FROM SERVER
     ============================================================ */
  const resyncFromServer = useCallback(async () => {
    if (!isMusicMode) return;
    try {
      const res = await fetchNowPlaying().unwrap();
      const np = res?.nowPlaying;
      if (!np?.track) return;
      loadSyncedTrack(np, isPlayingRef.current);
    } catch (err) {
      console.warn("[Player] resyncFromServer failed:", err?.message);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMusicMode, fetchNowPlaying, loadSyncedTrack]);

  /* ============================================================
     INITIAL SYNC — when tokenData delivers a nowPlaying snapshot
     ============================================================ */
  useEffect(() => {
    if (!isMusicMode) return;
    const np = tokenData?.nowPlaying;
    if (!np?.track) return;

    const changedTrack = currentTrackIdRef.current !== np.track._id;
    if (changedTrack) {
      loadSyncedTrack(np, isPlayingRef.current);
    } else {
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
  }, [isMusicMode, isPlaying, resyncFromServer]);

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
  }, [loadSyncedTrack]);

  /* ============================================================
     SWITCHING LIVE ↔ MUSIC
     ============================================================ */
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (!isMusicMode) {
      audio.pause();
      clearStallTimer();
      setIsBuffering(false);
    } else if (isPlayingRef.current && currentTrackIdRef.current) {
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
    console.warn("[Player] audio error", {
      code: audio.error?.code,
      message: audio.error?.message,
      src: (audio.src || "").slice(0, 100),
    });

    if (failCountRef.current > MAX_CONSECUTIVE_ERRORS) {
      console.error("[Player] Too many consecutive errors — pausing.");
      isPlayingRef.current = false;
      setIsPlaying(false);
      setIsBuffering(false);
      return;
    }
    resyncFromServer();
  };

  const handleEnded = () => {
    // Track finished — server tells us what should be next
    resyncFromServer();
  };

  /* ============================================================
     LIVEKIT
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
        if (!cancelled) console.error("[LiveKit] connect failed:", err);
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
  }, [clearStallTimer]);

  /* ============================================================
     CONTROLS
     ============================================================ */
  const togglePlay = async () => {
    const next = !isPlayingRef.current;
    isPlayingRef.current = next;
    setIsPlaying(next);

    /* ---------- LIVE MODE ---------- */
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

    /* ---------- AUTO-DJ MODE ---------- */
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

    // Ask the server where we should be right now, then start
    try {
      const res = await fetchNowPlaying().unwrap();
      const np = res?.nowPlaying;
      if (np?.track) {
        loadSyncedTrack(np, true);
        return;
      }
    } catch (err) {
      console.warn("[Player] Pre-play sync failed:", err?.message);
    }

    // Fallback: already-loaded track, no fresh server data
    if (currentTrackIdRef.current) {
      armStallTimer();
      safePlay(audio, onAutoplayBlocked);
      return;
    }

    // Nothing at all — turn off the spinner
    isPlayingRef.current = false;
    setIsPlaying(false);
    setIsBuffering(false);
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

  /* ============================================================
     PROVIDER
     ============================================================ */
  return (
    <AudioPlayerContext.Provider
      value={{
        isPlaying,
        isBuffering,
        isMusicMode,
        isLive,
        nowPlaying: nowPlaying || tokenData?.nowPlaying || null,
        currentShow,
        showImage,
        volume,
        isMuted,
        togglePlay,
        toggleMute,
        handleVolumeChange,
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