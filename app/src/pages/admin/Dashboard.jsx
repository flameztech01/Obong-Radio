// src/pages/admin/Dashboard.jsx
import React, { useState, useRef } from "react";
import { useNavigate } from "react-router";
import {
  Radio,
  Play,
  Square,
  Link as LinkIcon,
  UploadCloud,
  Clock,
  CheckCircle2,
  AlertCircle,
  Copy,
  Loader2,
  Mic,
  Settings,
  Headphones,
  X,
  Check,
  ArrowRight,
  ExternalLink,
} from "lucide-react";
import {
  useStartLiveSessionMutation,
  useEndLiveSessionMutation,
  useGenerateGuestLinkMutation,
  useGetListenerTokenQuery,
  useGetPastSessionsQuery,
  useGetMusicQueueQuery,
} from "../../features/radioApiSlice";

/* ============================================================
   SMALL REUSABLES
   ============================================================ */
const Modal = ({ open, onClose, title, children, footer }) => {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl max-h-[90vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800 shrink-0">
          <h3 className="text-white font-semibold text-sm">{title}</h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
          >
            <X size={15} />
          </button>
        </div>
        <div className="p-4 overflow-y-auto flex-1">{children}</div>
        {footer && (
          <div className="px-4 py-3 border-t border-zinc-800 flex justify-end gap-2 shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

const Checkbox = ({ checked, onChange, label, description }) => (
  <div
    className="flex items-start gap-2.5 cursor-pointer group select-none"
    onClick={() => onChange(!checked)}
  >
    <div
      className={`mt-0.5 w-[18px] h-[18px] rounded border flex items-center justify-center transition-colors shrink-0 ${
        checked
          ? "bg-yellow-500 border-yellow-500"
          : "border-zinc-700 group-hover:border-zinc-600 bg-zinc-950"
      }`}
    >
      {checked && <Check size={11} className="text-zinc-950" strokeWidth={3} />}
    </div>
    <div className="min-w-0">
      <p className="text-[13px] text-zinc-200 font-medium leading-tight">
        {label}
      </p>
      {description && (
        <p className="text-[11px] text-zinc-500 mt-0.5 leading-snug">
          {description}
        </p>
      )}
    </div>
  </div>
);

const Alert = ({ kind, children }) => {
  const map = {
    error: {
      cls: "bg-red-500/5 border-red-500/20 text-red-400",
      icon: <AlertCircle size={13} />,
    },
    success: {
      cls: "bg-emerald-500/5 border-emerald-500/20 text-emerald-400",
      icon: <CheckCircle2 size={13} />,
    },
  };
  const { cls, icon } = map[kind];
  return (
    <div
      className={`px-3 py-2.5 rounded-lg border text-[12px] font-medium flex items-start gap-2 ${cls}`}
    >
      <span className="mt-0.5 shrink-0">{icon}</span>
      <span className="leading-relaxed break-words">{children}</span>
    </div>
  );
};

/* Shared field styling — matched to Studio for consistency */
const fieldCls =
  "w-full rounded-lg border border-zinc-800 bg-zinc-900/40 px-3.5 py-2.5 text-[13px] text-white placeholder-zinc-600 transition-colors focus:border-yellow-500/40 focus:bg-zinc-900 focus:outline-none";

const labelCls =
  "block text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1.5";

/* ============================================================
   AUTO-DJ STATUS (shown when NOT live)
   ============================================================ */
const AutoDJCard = ({ onManage }) => {
  const { data, isLoading } = useGetMusicQueueQuery(undefined, {
    pollingInterval: 15000,
  });
  const np = data?.nowPlaying;
  const total = data?.queue?.length || 0;

  const fmt = (s) => {
    const v = Math.max(0, Math.floor(s || 0));
    return `${Math.floor(v / 60)}:${String(v % 60).padStart(2, "0")}`;
  };

  if (isLoading) {
    return (
      <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/40 px-4 py-3 flex items-center gap-3">
        <Loader2 size={14} className="text-yellow-500 animate-spin shrink-0" />
        <p className="text-[12px] text-zinc-400 whitespace-nowrap">
          Loading Auto-DJ…
        </p>
      </div>
    );
  }

  if (!np?.track) {
    return (
      <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/40 px-4 py-3 flex items-center gap-3">
        <Headphones size={16} className="text-zinc-600 shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="text-[13px] text-white font-medium">No track loaded</p>
          <p className="text-[11px] text-zinc-500">
            Open Studio to load the queue
          </p>
        </div>
        <button
          onClick={onManage}
          className="text-[10px] font-bold uppercase tracking-wider text-yellow-500 hover:text-yellow-400 whitespace-nowrap"
        >
          Manage
        </button>
      </div>
    );
  }

  const progress = Math.min(
    100,
    (np.offsetSec / Math.max(1, np.durationSec)) * 100
  );

  return (
    <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/40 p-3 sm:p-4">
      <div className="flex items-center justify-between gap-2 mb-2.5">
        <div className="flex items-center gap-2 min-w-0">
          <Headphones size={13} className="text-yellow-500 shrink-0" />
          <span className="text-[10px] font-bold text-yellow-500 uppercase tracking-wider whitespace-nowrap">
            Listeners Are Hearing
          </span>
        </div>
        <button
          onClick={onManage}
          className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-zinc-500 hover:text-yellow-500 transition-colors whitespace-nowrap shrink-0"
        >
          Manage <ArrowRight size={11} />
        </button>
      </div>

      <div className="flex items-center gap-3">
        <img
          src={np.track.image}
          alt=""
          className="w-12 h-12 rounded-md object-cover bg-zinc-800 shrink-0"
        />
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-semibold text-white truncate">
            {np.track.title}
          </p>
          <p className="text-[11px] text-zinc-400 truncate">
            {np.track.artist}
          </p>
          <div className="mt-1.5 flex items-center gap-2">
            <span className="text-[10px] font-mono text-zinc-500 whitespace-nowrap">
              {fmt(np.offsetSec)} / {fmt(np.durationSec)}
            </span>
            <div className="flex-1 h-0.5 bg-zinc-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-yellow-500 transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="text-[10px] font-mono text-zinc-600 whitespace-nowrap">
              {total} tracks
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ============================================================
   MAIN DASHBOARD
   ============================================================ */
const AdminDashboard = () => {
  const navigate = useNavigate();

  const { data: tokenData, isLoading: isStatusLoading } =
    useGetListenerTokenQuery(undefined, { pollingInterval: 10000 });
  const { data: pastData, isLoading: isPastLoading } =
    useGetPastSessionsQuery();

  const [startSession, { isLoading: isStarting }] =
    useStartLiveSessionMutation();
  const [endSession, { isLoading: isEnding }] = useEndLiveSessionMutation();
  const [generateLink, { isLoading: isGeneratingLink }] =
    useGenerateGuestLinkMutation();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [poster, setPoster] = useState(null);
  const [posterPreview, setPosterPreview] = useState("");
  const [videoEnabled, setVideoEnabled] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [guestLink, setGuestLink] = useState("");
  const [copied, setCopied] = useState(false);
  const [showEndModal, setShowEndModal] = useState(false);

  const fileInputRef = useRef(null);

  const isLive = tokenData?.active === true;
  const activeSessionId = tokenData?.sessionId;

  const flashSuccess = (msg) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(""), 3000);
  };

  const handlePosterChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPoster(file);
    setPosterPreview(URL.createObjectURL(file));
  };

  const handleStartSession = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    if (!title.trim()) return setErrorMsg("Please provide a show title.");
    if (!poster) return setErrorMsg("Please upload a poster image.");

    const fd = new FormData();
    fd.append("title", title.trim());
    fd.append("description", description.trim());
    fd.append("poster", poster);
    fd.append("isVideoEnabled", videoEnabled ? "true" : "false");

    try {
      await startSession(fd).unwrap();
      navigate("/admin/studio");
    } catch (err) {
      setErrorMsg(err?.data?.message || "Failed to start session.");
    }
  };

  const handleEndSession = async () => {
    try {
      await endSession(activeSessionId).unwrap();
      setShowEndModal(false);
      setGuestLink("");
      flashSuccess("Broadcast ended.");
    } catch (err) {
      setErrorMsg(err?.data?.message || "Failed to end session.");
    }
  };

  const handleGenerateLink = async () => {
    setErrorMsg("");
    try {
      const res = await generateLink().unwrap();
      setGuestLink(`${window.location.origin}/guest-join?token=${res.token}`);
    } catch (err) {
      setErrorMsg(err?.data?.message || "Failed to generate guest link.");
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(guestLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white pb-16">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-6 sm:pt-8">
        {/* ============ HEADER ============ */}
        <div className="flex items-start sm:items-center justify-between gap-3 mb-6">
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-serif tracking-tight text-white mb-0.5 whitespace-nowrap">
              Command Center
            </h1>
            <p className="text-[12px] text-zinc-500 leading-relaxed">
              Manage your broadcasts.
            </p>
          </div>
          <button
            onClick={() => navigate("/admin/settings")}
            className="flex items-center gap-1.5 rounded-lg border border-zinc-800 px-3 py-2 text-[11px] font-semibold text-zinc-300 hover:text-white hover:border-zinc-700 transition-colors whitespace-nowrap shrink-0"
          >
            <Settings size={13} />
            Settings
          </button>
        </div>

        {/* ============ ALERTS ============ */}
        {errorMsg && (
          <div className="mb-4">
            <Alert kind="error">{errorMsg}</Alert>
          </div>
        )}
        {successMsg && (
          <div className="mb-4">
            <Alert kind="success">{successMsg}</Alert>
          </div>
        )}

        {/* ============ STATUS ============ */}
        {isStatusLoading ? (
          <div className="py-10 flex flex-col items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-yellow-500 mb-3" />
            <p className="text-zinc-500 text-xs whitespace-nowrap">
              Checking station status…
            </p>
          </div>
        ) : isLive ? (
          /* ============ LIVE ============ */
          <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/40 p-4 sm:p-5 mb-6">
            <div className="flex flex-col md:flex-row md:items-center gap-4 md:justify-between">
              <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                <div className="h-12 w-12 shrink-0 rounded-lg bg-red-500/10 border border-red-500/25 flex items-center justify-center relative">
                  <span className="absolute inset-0 rounded-lg border border-red-500/40 animate-ping opacity-40" />
                  <Radio size={20} className="text-red-500" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="relative flex h-1.5 w-1.5 shrink-0">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75" />
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-500" />
                    </span>
                    <p className="text-[10px] font-bold text-red-500 uppercase tracking-wider whitespace-nowrap">
                      On Air
                    </p>
                  </div>
                  <h2 className="text-base sm:text-lg font-medium text-white mb-0.5 truncate">
                    {tokenData?.session?.title || "Live Broadcast"}
                  </h2>
                  <p className="text-[11px] text-zinc-500 leading-snug">
                    Broadcasting to the campus.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:flex gap-2 shrink-0">
                <button
                  onClick={() => navigate("/admin/studio")}
                  className="col-span-2 sm:col-span-1 flex items-center justify-center gap-1.5 rounded-lg bg-yellow-500 hover:bg-yellow-400 px-3.5 py-2 text-[11px] font-bold uppercase tracking-wider text-zinc-950 transition-colors whitespace-nowrap"
                >
                  <ExternalLink size={13} />
                  Open Studio
                </button>
                <button
                  onClick={handleGenerateLink}
                  disabled={isGeneratingLink}
                  className="flex items-center justify-center gap-1.5 rounded-lg border border-zinc-800 hover:border-zinc-700 px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-zinc-300 hover:text-white transition-colors disabled:opacity-60 whitespace-nowrap"
                >
                  {isGeneratingLink ? (
                    <Loader2 size={13} className="animate-spin" />
                  ) : (
                    <LinkIcon size={13} />
                  )}
                  Invite
                </button>
                <button
                  onClick={() => setShowEndModal(true)}
                  disabled={isEnding}
                  className="flex items-center justify-center gap-1.5 rounded-lg bg-red-500/90 hover:bg-red-500 px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-white transition-colors disabled:opacity-60 whitespace-nowrap"
                >
                  <Square size={11} fill="currentColor" />
                  End
                </button>
              </div>
            </div>

            {guestLink && (
              <div className="mt-4 p-2.5 rounded-lg border border-zinc-800 bg-zinc-950 flex items-center gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider mb-0.5 whitespace-nowrap">
                    Guest Link
                  </p>
                  <p className="text-[11px] text-zinc-400 truncate">
                    {guestLink}
                  </p>
                </div>
                <button
                  onClick={copyToClipboard}
                  className={`p-1.5 rounded-md shrink-0 transition-colors ${
                    copied
                      ? "bg-emerald-500/15 text-emerald-400"
                      : "bg-zinc-800 hover:bg-zinc-700 text-zinc-300"
                  }`}
                >
                  {copied ? <Check size={13} /> : <Copy size={13} />}
                </button>
              </div>
            )}
          </div>
        ) : (
          /* ============ OFFLINE (no card, clean layout) ============ */
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-4">
              <Mic size={14} className="text-zinc-500" />
              <h2 className="text-sm font-semibold text-white">
                Start a Live Session
              </h2>
            </div>

            <form
              onSubmit={handleStartSession}
              className="flex flex-col md:flex-row gap-5"
            >
              {/* Poster — 16:9, Studio-style */}
              <div className="w-full md:w-2/5 shrink-0">
                <label className={labelCls}>Poster</label>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className={`relative aspect-[16/9] rounded-lg border-2 border-dashed transition-colors cursor-pointer overflow-hidden ${
                    posterPreview
                      ? "border-zinc-800"
                      : "border-zinc-800 hover:border-zinc-700 bg-zinc-900/40"
                  }`}
                >
                  {posterPreview ? (
                    <>
                      <img
                        src={posterPreview}
                        alt="Poster"
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 flex items-center justify-center transition-opacity">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-white whitespace-nowrap">
                          Change
                        </p>
                      </div>
                    </>
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 text-zinc-500 p-3 text-center">
                      <UploadCloud size={20} className="text-zinc-600" />
                      <p className="text-[11px] font-medium text-zinc-400 whitespace-nowrap">
                        Upload poster
                      </p>
                      <p className="text-[9px] text-zinc-600 whitespace-nowrap">
                        PNG · JPG · 5MB
                      </p>
                    </div>
                  )}
                </div>
                <input
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  onChange={handlePosterChange}
                  className="hidden"
                />
              </div>

              {/* Fields */}
              <div className="flex-1 min-w-0 space-y-3.5">
                <div>
                  <label className={labelCls}>Show Title *</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Morning Drive Show"
                    className={fieldCls}
                  />
                </div>

                <div>
                  <label className={labelCls}>
                    Description{" "}
                    <span className="text-zinc-600 normal-case font-normal">
                      (optional)
                    </span>
                  </label>
                  <textarea
                    rows={2}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="What is this show about?"
                    className={`${fieldCls} resize-none`}
                  />
                </div>

                <div className="rounded-lg border border-zinc-800 bg-zinc-900/40 px-3 py-2.5">
                  <Checkbox
                    checked={videoEnabled}
                    onChange={setVideoEnabled}
                    label="Enable video"
                    description="Your camera feed will be visible to listeners."
                  />
                </div>

                <button
                  type="submit"
                  disabled={isStarting}
                  className="w-full flex items-center justify-center gap-2 rounded-lg bg-yellow-500 py-2.5 text-[12px] font-bold uppercase tracking-wider text-zinc-950 transition-colors hover:bg-yellow-400 disabled:opacity-50 whitespace-nowrap"
                >
                  {isStarting ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      Starting…
                    </>
                  ) : (
                    <>
                      <Play size={13} fill="currentColor" />
                      Go Live Now
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ============ AUTO-DJ (only when NOT live) ============ */}
        {!isLive && !isStatusLoading && (
          <div className="mb-6">
            <AutoDJCard onManage={() => navigate("/admin/studio")} />
          </div>
        )}

        {/* ============ PAST BROADCASTS ============ */}
        <div className="pt-6 border-t border-zinc-800/60">
          <h2 className="text-[13px] font-semibold text-zinc-300 mb-3 whitespace-nowrap">
            Past Broadcasts
          </h2>

          {isPastLoading ? (
            <div className="space-y-2">
              {[1, 2].map((i) => (
                <div
                  key={i}
                  className="h-14 w-full animate-pulse bg-zinc-900/60 rounded-lg"
                />
              ))}
            </div>
          ) : pastData?.sessions?.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {pastData.sessions.map((session) => (
                <div
                  key={session._id}
                  className="flex items-center gap-2.5 p-2.5 rounded-lg border border-zinc-800/80 bg-zinc-900/30 min-w-0"
                >
                  <div className="h-10 w-10 shrink-0 rounded-md overflow-hidden border border-zinc-800 bg-zinc-800">
                    {session.posterImage && (
                      <img
                        src={session.posterImage}
                        alt={session.title}
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-[12px] font-medium text-white truncate">
                      {session.title}
                    </h4>
                    <p className="text-[10px] text-zinc-500 mt-0.5 flex items-center gap-1 whitespace-nowrap">
                      <Clock size={9} />
                      {new Date(session.endedAt).toLocaleDateString()}
                    </p>
                  </div>
                  {session.recordingUrl && (
                    <span className="shrink-0 text-[9px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded whitespace-nowrap">
                      Replay
                    </span>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 rounded-lg border border-dashed border-zinc-800/60">
              <p className="text-[12px] text-zinc-500">
                No past broadcasts yet.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ============ END MODAL ============ */}
      <Modal
        open={showEndModal}
        onClose={() => setShowEndModal(false)}
        title="End Broadcast"
        footer={
          <>
            <button
              onClick={() => setShowEndModal(false)}
              className="px-3 py-1.5 rounded-md border border-zinc-800 hover:border-zinc-700 text-zinc-300 text-[11px] font-semibold transition-colors whitespace-nowrap"
            >
              Cancel
            </button>
            <button
              onClick={handleEndSession}
              disabled={isEnding}
              className="px-3 py-1.5 rounded-md bg-red-500 hover:bg-red-600 disabled:opacity-60 text-white text-[11px] font-bold transition-colors flex items-center gap-1.5 whitespace-nowrap"
            >
              {isEnding ? (
                <Loader2 size={11} className="animate-spin" />
              ) : (
                <Square size={10} fill="currentColor" />
              )}
              {isEnding ? "Ending…" : "End Broadcast"}
            </button>
          </>
        }
      >
        <div className="flex items-start gap-2.5">
          <div className="h-8 w-8 rounded-md bg-red-500/10 border border-red-500/20 flex items-center justify-center shrink-0">
            <AlertCircle size={14} className="text-red-400" />
          </div>
          <div className="min-w-0">
            <p className="text-[13px] text-white font-medium leading-tight">
              End this broadcast?
            </p>
            <p className="text-[11px] text-zinc-500 mt-1 leading-relaxed">
              Listeners will switch to Auto-DJ. Your recording will be saved.
            </p>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default AdminDashboard;