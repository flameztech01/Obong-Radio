// src/pages/admin/Studio.jsx
import React, { useState, useEffect, useRef } from "react";
import { Room, RoomEvent, Track, createLocalVideoTrack } from "livekit-client";
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  PhoneOff,
  Users,
  Link as LinkIcon,
  Copy,
  MessageSquare,
  Send,
  AlertCircle,
  Music,
  Radio as RadioIcon,
  Upload,
  Play,
  RefreshCw,
  Trash2,
  X,
  Check,
  Image as ImageIcon,
  Loader2,
  Headphones,
  ListMusic,
  Plus,
} from "lucide-react";
import { socket } from "../../services/socket";
import {
  useGetListenerTokenQuery,
  useGenerateGuestLinkMutation,
  useEndLiveSessionMutation,
  useStartLiveSessionMutation,
  useGetMusicQueueQuery,
  useSetCurrentTrackMutation,
  useRefreshMusicQueueMutation,
  useUploadMusicTrackMutation,
  useDeleteMusicTrackMutation,
} from "../../features/radioApiSlice";

/* ---------- utils ---------- */
const fmt = (sec) => {
  const s = Math.max(0, Math.floor(sec || 0));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
};

/* ============================================================
   SMALL REUSABLE UI
   ============================================================ */
const Modal = ({ open, onClose, title, children, footer }) => {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl max-h-[90vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800 shrink-0">
          <h3 className="text-white font-semibold text-sm">{title}</h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
          >
            <X size={16} />
          </button>
        </div>
        <div className="p-5 overflow-y-auto flex-1">{children}</div>
        {footer && (
          <div className="px-5 py-4 border-t border-zinc-800 flex justify-end gap-2 shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

const Checkbox = ({ checked, onChange, label, description }) => (
  <div
    className="flex items-start gap-3 cursor-pointer group select-none"
    onClick={() => onChange(!checked)}
  >
    <div
      className={`mt-0.5 w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all shrink-0 ${
        checked
          ? "bg-red-500 border-red-500"
          : "border-zinc-700 group-hover:border-zinc-600 bg-zinc-950"
      }`}
    >
      {checked && <Check size={13} className="text-white" strokeWidth={3} />}
    </div>
    <div className="min-w-0">
      <p className="text-sm text-zinc-200 font-medium leading-tight">{label}</p>
      {description && (
        <p className="text-xs text-zinc-500 mt-0.5 leading-snug">
          {description}
        </p>
      )}
    </div>
  </div>
);

const LoadingScreen = ({ label = "Loading…" }) => (
  <div className="h-[calc(100vh-4rem)] bg-zinc-950 flex items-center justify-center">
    <div className="flex flex-col items-center gap-3">
      <Loader2 className="w-7 h-7 text-red-500 animate-spin" />
      <p className="text-zinc-500 text-xs font-mono uppercase tracking-widest whitespace-nowrap">
        {label}
      </p>
    </div>
  </div>
);

const ErrorBanner = ({ message }) =>
  !message ? null : (
    <div className="flex items-start gap-2 text-red-400 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3">
      <AlertCircle size={14} className="mt-0.5 shrink-0" />
      <p className="text-xs leading-relaxed">{message}</p>
    </div>
  );

/* ============================================================
   PRE-LIVE SCREEN
   ============================================================ */
const PreLiveScreen = ({ onLive }) => {
  const [view, setView] = useState("start");

  return (
    <div className="h-[calc(100vh-4rem)] bg-zinc-950 flex flex-col overflow-hidden">
      <div className="shrink-0 border-b border-zinc-800 bg-zinc-900/40">
        <div className="max-w-3xl mx-auto flex">
          <button
            onClick={() => setView("start")}
            className={`flex-1 sm:flex-none px-4 sm:px-6 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors whitespace-nowrap ${
              view === "start"
                ? "text-red-500 border-red-500"
                : "text-zinc-500 border-transparent hover:text-zinc-300"
            }`}
          >
            <RadioIcon size={14} className="inline mr-1.5 -mt-0.5" />
            Go Live
          </button>
          <button
            onClick={() => setView("music")}
            className={`flex-1 sm:flex-none px-4 sm:px-6 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors whitespace-nowrap ${
              view === "music"
                ? "text-yellow-500 border-yellow-500"
                : "text-zinc-500 border-transparent hover:text-zinc-300"
            }`}
          >
            <Music size={14} className="inline mr-1.5 -mt-0.5" />
            Auto-DJ
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {view === "start" ? <GoLiveForm onLive={onLive} /> : <MusicPanel />}
      </div>
    </div>
  );
};

/* ============================================================
   GO LIVE FORM
   ============================================================ */
const GoLiveForm = ({ onLive }) => {
  const [startSession, { isLoading }] = useStartLiveSessionMutation();
  const [poster, setPoster] = useState(null);
  const [posterPreview, setPosterPreview] = useState("");
  const [title, setTitle] = useState("Live Radio Broadcast");
  const [description, setDescription] = useState("Streaming live from Obong University");
  const [videoEnabled, setVideoEnabled] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef(null);

  const pickPoster = (file) => {
    if (!file) return;
    setPoster(file);
    setPosterPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!poster) return setError("A poster image is required to go live.");

    const fd = new FormData();
    fd.append("poster", poster);
    fd.append("title", title.trim() || "Live Radio Broadcast");
    fd.append("description", description.trim() || "Streaming live");
    fd.append("isVideoEnabled", videoEnabled ? "true" : "false");

    try {
      await startSession(fd).unwrap();
      onLive();
    } catch (err) {
      setError(err?.data?.message || "Failed to start broadcast.");
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4 sm:p-8">
      <div className="mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-white mb-1">
          Start Broadcast
        </h1>
        <p className="text-sm text-zinc-500 leading-relaxed">
          Fill in the details below to go on air. Your poster will be shown to
          all listeners.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-widest mb-2 whitespace-nowrap">
            Broadcast Poster
          </label>
          <div
            onClick={() => fileRef.current?.click()}
            className={`relative aspect-[16/9] rounded-xl border-2 border-dashed transition-colors cursor-pointer overflow-hidden ${
              posterPreview
                ? "border-zinc-700"
                : "border-zinc-800 hover:border-zinc-700 bg-zinc-900/40"
            }`}
          >
            {posterPreview ? (
              <>
                <img
                  src={posterPreview}
                  alt="Poster preview"
                  className="absolute inset-0 w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                  <span className="text-white text-xs font-bold uppercase tracking-wider bg-zinc-900/80 px-3 py-1.5 rounded-lg whitespace-nowrap">
                    Change Image
                  </span>
                </div>
              </>
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-zinc-500 p-4 text-center">
                <ImageIcon size={28} className="opacity-60" />
                <p className="text-xs font-medium whitespace-nowrap">
                  Click to upload a poster
                </p>
                <p className="text-[10px] text-zinc-600 whitespace-nowrap">
                  PNG, JPG · 5MB max
                </p>
              </div>
            )}
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              onChange={(e) => pickPoster(e.target.files?.[0])}
              className="hidden"
            />
          </div>
        </div>

        <div>
          <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-widest mb-2 whitespace-nowrap">
            Session Title
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Friday Night Afrobeats"
            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-600 focus:border-red-500/50 focus:outline-none focus:ring-1 focus:ring-red-500/30 transition-all"
          />
        </div>

        <div>
          <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-widest mb-2 whitespace-nowrap">
            Description{" "}
            <span className="text-zinc-600 normal-case font-normal">
              (optional)
            </span>
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-600 focus:border-red-500/50 focus:outline-none focus:ring-1 focus:ring-red-500/30 transition-all resize-none"
          />
        </div>

        <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4">
          <Checkbox
            checked={videoEnabled}
            onChange={setVideoEnabled}
            label="Enable video for listeners"
            description="Allow your camera feed to be visible to the audience."
          />
        </div>

        <ErrorBanner message={error} />

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-red-500 hover:bg-red-600 disabled:opacity-60 disabled:cursor-not-allowed text-white py-3.5 rounded-xl font-bold uppercase tracking-wider text-xs transition-colors flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <Loader2 size={14} className="animate-spin" />
              <span className="whitespace-nowrap">Going live…</span>
            </>
          ) : (
            <>
              <RadioIcon size={14} />
              <span className="whitespace-nowrap">Go Live Now</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
};

/* ============================================================
   MUSIC PANEL (Auto-DJ)
   ============================================================ */
const MusicPanel = () => {
  const { data, isLoading, refetch } = useGetMusicQueueQuery(undefined, {
    pollingInterval: 30000,
  });
  const [setCurrentTrack] = useSetCurrentTrackMutation();
  const [refreshQueue, { isLoading: isRefreshing }] = useRefreshMusicQueueMutation();
  const [deleteTrack] = useDeleteMusicTrackMutation();
  const [uploadMusic, { isLoading: isUploading }] = useUploadMusicTrackMutation();

  const [showUpload, setShowUpload] = useState(false);
  const [error, setError] = useState("");

  const queue = data?.queue || [];
  const np = data?.nowPlaying;
  const currentId = np?.track?._id;

  const handlePlayNow = async (track) => {
    setError("");
    try {
      await setCurrentTrack({ trackId: track._id }).unwrap();
      refetch();
    } catch (err) {
      setError(err?.data?.message || "Could not switch track");
    }
  };

  const handleRefresh = async () => {
    setError("");
    try {
      await refreshQueue().unwrap();
      refetch();
    } catch (err) {
      setError(err?.data?.message || "Refresh failed");
    }
  };

  const handleDelete = async (id) => {
    setError("");
    try {
      await deleteTrack(id).unwrap();
      refetch();
    } catch (err) {
      setError(err?.data?.message || "Delete failed");
    }
  };

  if (isLoading) return <LoadingScreen label="Loading queue" />;

  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-8 space-y-6">
      <div className="min-w-0">
        <h1 className="text-xl sm:text-2xl font-bold text-white mb-1">
          Auto-DJ Queue
        </h1>
        <p className="text-sm text-zinc-500 leading-relaxed">
          When you're not live, this playlist plays on a shared timeline —
          everyone hears the same moment. Tap{" "}
          <Play size={11} className="inline -mt-0.5" /> to switch for all
          listeners instantly.
        </p>
      </div>

      {np?.track && (
        <div className="bg-gradient-to-br from-yellow-500/10 to-zinc-900 border border-yellow-500/20 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Headphones size={14} className="text-yellow-500" />
            <span className="text-[10px] font-bold text-yellow-500 uppercase tracking-widest whitespace-nowrap">
              Now Playing
            </span>
          </div>
          <div className="flex items-center gap-3">
            <img
              src={np.track.image}
              alt=""
              className="w-14 h-14 rounded-lg object-cover bg-zinc-800 shrink-0"
            />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-white truncate">
                {np.track.title}
              </p>
              <p className="text-xs text-zinc-400 truncate">{np.track.artist}</p>
              <div className="mt-1.5 flex items-center gap-2 text-[10px] text-zinc-500 font-mono">
                <span className="whitespace-nowrap">
                  {fmt(np.offsetSec)} / {fmt(np.durationSec)}
                </span>
                <div className="flex-1 h-1 bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-yellow-500 transition-all"
                    style={{
                      width: `${Math.min(
                        100,
                        (np.offsetSec / Math.max(1, np.durationSec)) * 100
                      )}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-white text-xs font-bold transition-colors disabled:opacity-50 whitespace-nowrap"
        >
          <RefreshCw size={13} className={isRefreshing ? "animate-spin" : ""} />
          Refresh Auto Queue
        </button>
        <button
          onClick={() => setShowUpload(true)}
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-yellow-500 hover:bg-yellow-400 text-zinc-950 text-xs font-bold transition-colors whitespace-nowrap"
        >
          <Plus size={13} />
          Upload Track
        </button>
      </div>

      <ErrorBanner message={error} />

      <div>
        <h2 className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest whitespace-nowrap flex items-center gap-2 mb-3">
          <ListMusic size={13} />
          Queue ({queue.length})
        </h2>
        <div className="space-y-1.5">
          {queue.map((track, i) => {
            const isCurrent = track._id === currentId;
            return (
              <div
                key={track._id}
                className={`flex items-center gap-3 p-2 rounded-xl border transition-colors ${
                  isCurrent
                    ? "bg-yellow-500/10 border-yellow-500/30"
                    : "bg-zinc-900/40 border-zinc-800/60 hover:border-zinc-700"
                }`}
              >
                <span className="text-[10px] font-mono text-zinc-600 w-5 text-right shrink-0">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <img
                  src={track.image}
                  alt=""
                  className="w-10 h-10 rounded object-cover bg-zinc-800 shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <p
                    className={`text-xs font-semibold truncate ${
                      isCurrent ? "text-yellow-400" : "text-white"
                    }`}
                  >
                    {track.title}
                  </p>
                  <p className="text-[10px] text-zinc-500 truncate">
                    {track.artist}
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {isCurrent ? (
                    <span className="text-[9px] font-bold uppercase text-yellow-500 tracking-wider px-2 whitespace-nowrap">
                      Playing
                    </span>
                  ) : (
                    <button
                      onClick={() => handlePlayNow(track)}
                      className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-colors"
                      title="Play this now for everyone"
                    >
                      <Play size={12} fill="currentColor" />
                    </button>
                  )}
                  {track.source === "admin" && (
                    <button
                      onClick={() => handleDelete(track._id)}
                      className="p-1.5 rounded-lg bg-zinc-800 hover:bg-red-500/20 text-zinc-400 hover:text-red-400 transition-colors"
                      title="Delete track"
                    >
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
          {queue.length === 0 && (
            <div className="text-center py-10 text-zinc-600 text-xs">
              No tracks in queue yet. Click "Refresh Auto Queue" to fetch music.
            </div>
          )}
        </div>
      </div>

      <UploadTrackModal
        open={showUpload}
        onClose={() => setShowUpload(false)}
        uploadMusic={uploadMusic}
        isUploading={isUploading}
        onDone={() => {
          setShowUpload(false);
          refetch();
        }}
      />
    </div>
  );
};

const UploadTrackModal = ({ open, onClose, uploadMusic, isUploading, onDone }) => {
  const [title, setTitle] = useState("");
  const [artist, setArtist] = useState("");
  const [duration, setDuration] = useState("");
  const [audio, setAudio] = useState(null);
  const [cover, setCover] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setTitle("");
      setArtist("");
      setDuration("");
      setAudio(null);
      setCover(null);
      setError("");
    }
  }, [open]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!audio) return setError("Audio file is required.");
    if (!title.trim()) return setError("Title is required.");

    const fd = new FormData();
    fd.append("audio", audio);
    if (cover) fd.append("cover", cover);
    fd.append("title", title.trim());
    fd.append("artist", artist.trim() || "Unknown Artist");
    if (duration) fd.append("duration", duration);

    try {
      await uploadMusic(fd).unwrap();
      onDone();
    } catch (err) {
      setError(err?.data?.message || "Upload failed.");
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Upload Track">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1.5 whitespace-nowrap">
            Audio File *
          </label>
          <input
            type="file"
            accept="audio/*"
            onChange={(e) => setAudio(e.target.files?.[0] || null)}
            className="w-full text-xs text-zinc-400 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:bg-zinc-800 file:text-white file:font-bold file:cursor-pointer"
          />
        </div>
        <div>
          <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1.5 whitespace-nowrap">
            Title *
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:border-yellow-500/50 focus:outline-none"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1.5 whitespace-nowrap">
              Artist
            </label>
            <input
              type="text"
              value={artist}
              onChange={(e) => setArtist(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:border-yellow-500/50 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1.5 whitespace-nowrap">
              Duration (s)
            </label>
            <input
              type="number"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              placeholder="180"
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:border-yellow-500/50 focus:outline-none"
            />
          </div>
        </div>
        <div>
          <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1.5 whitespace-nowrap">
            Cover Image
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setCover(e.target.files?.[0] || null)}
            className="w-full text-xs text-zinc-400 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:bg-zinc-800 file:text-white file:font-bold file:cursor-pointer"
          />
        </div>
        <ErrorBanner message={error} />
        <button
          type="submit"
          disabled={isUploading}
          className="w-full bg-yellow-500 hover:bg-yellow-400 disabled:opacity-60 text-zinc-950 py-2.5 rounded-lg font-bold text-xs uppercase tracking-wider transition-colors flex items-center justify-center gap-2 whitespace-nowrap"
        >
          {isUploading ? (
            <>
              <Loader2 size={13} className="animate-spin" />
              Uploading…
            </>
          ) : (
            <>
              <Upload size={13} />
              Upload
            </>
          )}
        </button>
      </form>
    </Modal>
  );
};

/* ============================================================
   LIVE STUDIO
   ============================================================ */
const LiveStudio = ({ tokenData, onEnded }) => {
  const [generateLink, { isLoading: isGeneratingLink }] = useGenerateGuestLinkMutation();
  const [endSession, { isLoading: isEnding }] = useEndLiveSessionMutation();

  const [room, setRoom] = useState(null);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isCamOn, setIsCamOn] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [listenerCount, setListenerCount] = useState(0);
  const [guestLink, setGuestLink] = useState("");
  const [copied, setCopied] = useState(false);
  const [showEndModal, setShowEndModal] = useState(false);
  const [uiError, setUiError] = useState("");
  const [tab, setTab] = useState("broadcast");

  const videoRef = useRef(null);
  const chatEndRef = useRef(null);

  useEffect(() => {
    socket.emit("join_radio_room", "obong_radio_main_studio");
    const onMsg = (m) => setMessages((p) => [...p, m]);
    const onCnt = (c) => setListenerCount(c);
    socket.on("receive_radio_message", onMsg);
    socket.on("listener_count_update", onCnt);
    return () => {
      socket.off("receive_radio_message", onMsg);
      socket.off("listener_count_update", onCnt);
    };
  }, []);

  useEffect(() => {
    if (!tokenData?.token) return;
    const r = new Room();
    setRoom(r);
    let cancelled = false;

    (async () => {
      try {
        await r.connect(import.meta.env.VITE_LIVEKIT_URL, tokenData.token);
        if (cancelled) return r.disconnect();
        await r.localParticipant.setMicrophoneEnabled(true);
        r.on(RoomEvent.LocalTrackPublished, (pub) => {
          if (pub.track.kind === Track.Kind.Video && videoRef.current) {
            pub.track.attach(videoRef.current);
          }
        });
      } catch (err) {
        console.error("LiveKit:", err);
        setUiError("Failed to connect to LiveKit.");
      }
    })();

    return () => {
      cancelled = true;
      r.disconnect();
    };
  }, [tokenData?.token]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, tab]);

  const toggleMic = async () => {
    if (!room) return;
    const next = !isMicOn;
    await room.localParticipant.setMicrophoneEnabled(next);
    setIsMicOn(next);
  };

  const toggleCam = async () => {
    if (!room) return;
    const next = !isCamOn;
    if (next) {
      const vt = await createLocalVideoTrack();
      await room.localParticipant.publishTrack(vt);
    } else {
      room.localParticipant.videoTracks.forEach((pub) => {
        if (pub.track) {
          room.localParticipant.unpublishTrack(pub.track);
          pub.track.stop();
        }
      });
    }
    setIsCamOn(next);
  };

  const handleEnd = async () => {
    try {
      await endSession(tokenData?.sessionId).unwrap();
      setShowEndModal(false);
      room?.disconnect();
      onEnded();
    } catch (err) {
      setUiError(err?.data?.message || "Failed to end session.");
    }
  };

  const handleGenerateLink = async () => {
    setUiError("");
    try {
      const res = await generateLink().unwrap();
      setGuestLink(`${window.location.origin}/guest-join?token=${res.token}`);
    } catch (err) {
      setUiError(err?.data?.message || "Could not generate guest link.");
    }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(guestLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    socket.emit("send_radio_message", {
      roomId: "obong_radio_main_studio",
      user: { name: "Host (You)", avatar: null },
      text: input.trim(),
      time: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      isMe: true,
    });
    setInput("");
  };

  return (
    <div className="h-[calc(100vh-4rem)] bg-zinc-950 flex flex-col overflow-hidden">
      {/* Top bar */}
      <div className="shrink-0 h-14 px-3 sm:px-5 bg-zinc-900/40 border-b border-zinc-800 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="relative flex h-2.5 w-2.5 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
          </span>
          <span className="text-[10px] font-bold text-red-500 tracking-widest uppercase whitespace-nowrap">
            On Air
          </span>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-800">
            <Users size={12} className="text-zinc-400 shrink-0" />
            <span className="text-[11px] font-bold text-white whitespace-nowrap">
              {listenerCount}
            </span>
          </div>
          <button
            onClick={() => setShowEndModal(true)}
            className="px-3 py-1.5 rounded-lg bg-red-500 hover:bg-red-600 text-white text-[10px] font-bold uppercase tracking-wider whitespace-nowrap transition-colors"
          >
            End Show
          </button>
        </div>
      </div>

      {/* Mobile tabs */}
      <div className="lg:hidden shrink-0 flex border-b border-zinc-800 bg-zinc-900/20">
        <button
          onClick={() => setTab("broadcast")}
          className={`flex-1 py-2.5 text-[11px] font-bold uppercase tracking-wider border-b-2 transition-colors whitespace-nowrap ${
            tab === "broadcast"
              ? "text-red-500 border-red-500"
              : "text-zinc-500 border-transparent"
          }`}
        >
          <RadioIcon size={12} className="inline mr-1 -mt-0.5" />
          Broadcast
        </button>
        <button
          onClick={() => setTab("chat")}
          className={`flex-1 py-2.5 text-[11px] font-bold uppercase tracking-wider border-b-2 transition-colors whitespace-nowrap ${
            tab === "chat"
              ? "text-yellow-500 border-yellow-500"
              : "text-zinc-500 border-transparent"
          }`}
        >
          <MessageSquare size={12} className="inline mr-1 -mt-0.5" />
          Chat
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* BROADCAST */}
        <div
          className={`flex-1 flex-col bg-[#0a0a0a] min-h-0 ${
            tab === "broadcast" ? "flex" : "hidden"
          } lg:flex`}
        >
          <div className="flex-1 flex items-center justify-center p-4 sm:p-6 min-h-0">
            {isCamOn ? (
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                className="w-full h-full max-w-3xl object-cover rounded-2xl border border-zinc-800 shadow-2xl"
              />
            ) : (
              <div className="flex flex-col items-center justify-center">
                <div className="h-28 w-28 sm:h-32 sm:w-32 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-4 shadow-2xl">
                  <span className="text-4xl font-serif text-zinc-600">A</span>
                </div>
                <p className="text-zinc-500 text-xs font-mono tracking-wider uppercase whitespace-nowrap">
                  Camera Off
                </p>
              </div>
            )}
          </div>

          {uiError && (
            <div className="mx-4 mb-3">
              <ErrorBanner message={uiError} />
            </div>
          )}

          <div className="shrink-0 h-20 sm:h-24 bg-zinc-900/40 border-t border-zinc-800 flex items-center justify-center gap-4 sm:gap-6 px-4">
            <button
              onClick={toggleMic}
              className="flex flex-col items-center gap-1.5 w-14 sm:w-16 group"
            >
              <div
                className={`h-11 w-11 sm:h-12 sm:w-12 rounded-full flex items-center justify-center border transition-all ${
                  isMicOn
                    ? "bg-zinc-800 border-zinc-700 text-white group-hover:bg-zinc-700"
                    : "bg-red-500/10 border-red-500/30 text-red-500"
                }`}
              >
                {isMicOn ? <Mic size={18} /> : <MicOff size={18} />}
              </div>
              <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-400 whitespace-nowrap">
                {isMicOn ? "Mute" : "Unmute"}
              </span>
            </button>

            <button
              onClick={toggleCam}
              className="flex flex-col items-center gap-1.5 w-14 sm:w-16 group"
            >
              <div
                className={`h-11 w-11 sm:h-12 sm:w-12 rounded-full flex items-center justify-center border transition-all ${
                  isCamOn
                    ? "bg-zinc-800 border-zinc-700 text-white group-hover:bg-zinc-700"
                    : "bg-zinc-800 border-zinc-700 text-zinc-400 group-hover:text-white group-hover:bg-zinc-700"
                }`}
              >
                {isCamOn ? <Video size={18} /> : <VideoOff size={18} />}
              </div>
              <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-400 whitespace-nowrap">
                Camera
              </span>
            </button>

            <div className="w-px h-8 bg-zinc-800" />

            <button
              onClick={() => setShowEndModal(true)}
              disabled={isEnding}
              className="flex flex-col items-center gap-1.5 w-14 sm:w-16 disabled:opacity-50"
            >
              <div className="h-11 w-11 sm:h-12 sm:w-12 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center shadow-[0_0_15px_rgba(239,68,68,0.4)] transition-all">
                <PhoneOff size={18} />
              </div>
              <span className="text-[9px] font-bold uppercase tracking-wider text-red-500 whitespace-nowrap">
                End
              </span>
            </button>
          </div>
        </div>

        {/* CHAT */}
        <div
          className={`w-full lg:w-[380px] shrink-0 flex-col bg-zinc-950 border-l border-zinc-800 min-h-0 ${
            tab === "chat" ? "flex" : "hidden"
          } lg:flex`}
        >
          <div className="p-3 sm:p-4 border-b border-zinc-800 bg-zinc-900/20 shrink-0">
            <h3 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2 flex items-center gap-1.5 whitespace-nowrap">
              <LinkIcon size={12} className="text-red-500" />
              Guest Invite
            </h3>
            {guestLink ? (
              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  value={guestLink}
                  readOnly
                  className="flex-1 min-w-0 bg-zinc-950 border border-zinc-800 text-[10px] text-zinc-400 rounded-lg px-2.5 py-2 focus:outline-none truncate"
                />
                <button
                  onClick={copyLink}
                  className={`p-2 rounded-lg transition-colors shrink-0 ${
                    copied
                      ? "bg-emerald-500/20 text-emerald-500"
                      : "bg-zinc-800 text-white hover:bg-zinc-700"
                  }`}
                >
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                </button>
              </div>
            ) : (
              <button
                onClick={handleGenerateLink}
                disabled={isGeneratingLink}
                className="w-full flex items-center justify-center gap-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 py-2 text-[10px] font-bold uppercase tracking-wider text-white transition-colors disabled:opacity-60 whitespace-nowrap"
              >
                {isGeneratingLink ? (
                  <Loader2 size={12} className="animate-spin" />
                ) : (
                  <LinkIcon size={12} />
                )}
                {isGeneratingLink ? "Generating…" : "Generate Co-host Link"}
              </button>
            )}
          </div>

          <div className="px-4 py-2.5 border-b border-zinc-800 flex items-center justify-between shrink-0">
            <h3 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-1.5 whitespace-nowrap">
              <MessageSquare size={12} className="text-yellow-500" />
              Live Chat
            </h3>
            <span className="text-[10px] font-mono text-zinc-600 whitespace-nowrap">
              {listenerCount} online
            </span>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-3 min-h-0">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-zinc-700">
                <MessageSquare size={28} className="mb-2 opacity-30" />
                <p className="text-[11px]">No messages yet</p>
              </div>
            ) : (
              messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex flex-col ${
                    msg.isMe ? "items-end" : "items-start"
                  }`}
                >
                  <div className="flex items-baseline gap-1.5 mb-0.5 px-1">
                    <span
                      className={`text-[10px] font-bold truncate max-w-[120px] ${
                        msg.isMe ? "text-yellow-500" : "text-zinc-400"
                      }`}
                    >
                      {msg.user.name}
                    </span>
                    <span className="text-[9px] text-zinc-600 whitespace-nowrap">
                      {msg.time}
                    </span>
                  </div>
                  <div
                    className={`max-w-[85%] rounded-2xl px-3 py-1.5 text-[12px] leading-snug break-words ${
                      msg.isMe
                        ? "bg-yellow-500 text-zinc-950 rounded-tr-sm font-medium"
                        : "bg-zinc-900 text-zinc-200 border border-zinc-800 rounded-tl-sm"
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              ))
            )}
            <div ref={chatEndRef} />
          </div>

          <form
            onSubmit={handleSendMessage}
            className="shrink-0 border-t border-zinc-800 bg-zinc-900/30 p-2.5"
          >
            <div className="relative">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Reply to listeners…"
                className="w-full rounded-xl border border-zinc-800 bg-zinc-950 py-2.5 pl-3 pr-10 text-[12px] text-white placeholder-zinc-600 focus:border-yellow-500/50 focus:outline-none focus:ring-1 focus:ring-yellow-500/30 transition-all"
              />
              <button
                type="submit"
                disabled={!input.trim()}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 flex h-7 w-7 items-center justify-center rounded-lg bg-yellow-500 text-zinc-950 disabled:opacity-40 hover:bg-yellow-400 transition-colors"
              >
                <Send size={12} />
              </button>
            </div>
          </form>
        </div>
      </div>

      <Modal
        open={showEndModal}
        onClose={() => setShowEndModal(false)}
        title="End Broadcast"
        footer={
          <>
            <button
              onClick={() => setShowEndModal(false)}
              className="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold transition-colors whitespace-nowrap"
            >
              Cancel
            </button>
            <button
              onClick={handleEnd}
              disabled={isEnding}
              className="px-4 py-2 rounded-lg bg-red-500 hover:bg-red-600 disabled:opacity-60 text-white text-xs font-bold transition-colors flex items-center gap-1.5 whitespace-nowrap"
            >
              {isEnding ? (
                <Loader2 size={12} className="animate-spin" />
              ) : (
                <PhoneOff size={12} />
              )}
              {isEnding ? "Ending…" : "End Broadcast"}
            </button>
          </>
        }
      >
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center shrink-0">
            <AlertCircle size={18} className="text-red-500" />
          </div>
          <div className="min-w-0">
            <p className="text-sm text-white font-medium leading-tight">
              End this broadcast?
            </p>
            <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
              Listeners will be switched to the auto-DJ. The session recording
              will be saved.
            </p>
          </div>
        </div>
      </Modal>
    </div>
  );
};

/* ============================================================
   MAIN
   ============================================================ */
const Studio = () => {
  const {
    data: tokenData,
    isLoading: isTokenLoading,
    refetch: refetchToken,
  } = useGetListenerTokenQuery();

  if (isTokenLoading) return <LoadingScreen label="Connecting to studio" />;

  if (tokenData?.active === true) {
    return (
      <LiveStudio
        tokenData={tokenData}
        onEnded={() => refetchToken()}
      />
    );
  }

  return <PreLiveScreen onLive={() => refetchToken()} />;
};

export default Studio;