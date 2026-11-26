// src/pages/admin/Schedule.jsx
import React, { useMemo, useState } from "react";
import { useSelector } from "react-redux";
import {
  Calendar,
  Plus,
  Radio,
  User,
  AlertCircle,
  Loader2,
  X,
  Check,
  Pencil,
  Trash2,
} from "lucide-react";
import {
  useGetAdminScheduleQuery,
  useCreateScheduleItemMutation,
  useUpdateScheduleItemMutation,
  useDeleteScheduleItemMutation,
} from "../../features/adminApiSlice";

/* ---------- shared field styles (matches Dashboard/Studio) ---------- */
const fieldCls =
  "w-full rounded-lg border border-zinc-800 bg-zinc-900/40 px-3.5 py-2.5 text-[13px] text-white placeholder-zinc-600 transition-colors focus:border-yellow-500/40 focus:bg-zinc-900 focus:outline-none";
const labelCls =
  "block text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1.5";

/* ---------- days (0 = Sunday, JS standard) ---------- */
const DAYS = [
  { value: 1, label: "Mon", full: "Monday" },
  { value: 2, label: "Tue", full: "Tuesday" },
  { value: 3, label: "Wed", full: "Wednesday" },
  { value: 4, label: "Thu", full: "Thursday" },
  { value: 5, label: "Fri", full: "Friday" },
  { value: 6, label: "Sat", full: "Saturday" },
  { value: 0, label: "Sun", full: "Sunday" },
];

const todayValue = () => new Date().getDay();

/* ---------- time helpers ---------- */
const parseTime = (hhmm) => {
  if (!hhmm) return 0;
  const [h, m] = String(hhmm).split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
};

const formatTime = (hhmm) => {
  const total = parseTime(hhmm);
  const h = Math.floor(total / 60);
  const m = total % 60;
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
};

const nowMinutes = () => {
  const d = new Date();
  return d.getHours() * 60 + d.getMinutes();
};

/* ---------- shared modal ---------- */
const Modal = ({ open, onClose, title, children, footer }) => {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl max-h-[90vh] flex flex-col overflow-hidden"
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

const Alert = ({ children }) => (
  <div className="px-3 py-2.5 rounded-lg border text-[12px] font-medium flex items-start gap-2 bg-red-500/5 border-red-500/20 text-red-400">
    <AlertCircle size={13} className="mt-0.5 shrink-0" />
    <span className="leading-relaxed break-words">{children}</span>
  </div>
);

/* ---------- one show row ---------- */
const ShowRow = ({ show, isLive, isFinished, isAdmin, onEdit, onDelete }) => {
  return (
    <div
      className={`flex items-start gap-3 p-3 rounded-lg border transition-colors min-w-0 ${
        isLive
          ? "border-red-500/30 bg-red-500/5"
          : isFinished
            ? "border-zinc-800/60 bg-zinc-900/20 opacity-60"
            : "border-zinc-800/80 bg-zinc-900/40 hover:border-zinc-800"
      }`}
    >
      {/* Time column */}
      <div className="w-14 sm:w-16 shrink-0 pt-0.5">
        <p className="text-[11px] font-bold text-white whitespace-nowrap leading-tight">
          {formatTime(show.startTime)}
        </p>
        <p className="text-[10px] text-zinc-500 whitespace-nowrap leading-tight mt-0.5">
          {formatTime(show.endTime)}
        </p>
      </div>

      {/* Accent bar */}
      <div
        className={`w-0.5 self-stretch rounded-full shrink-0 ${
          isLive ? "bg-red-500" : "bg-zinc-800"
        }`}
      />

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-0.5">
          <h3 className="text-[13px] font-semibold text-white truncate">
            {show.title}
          </h3>
          {isLive && (
            <span className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-red-500 bg-red-500/10 px-1.5 py-0.5 rounded whitespace-nowrap">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-500" />
              </span>
              Live
            </span>
          )}
        </div>
        {show.host && (
          <p className="text-[11px] text-zinc-400 flex items-center gap-1 truncate">
            <User size={10} className="shrink-0" />
            {show.host}
          </p>
        )}
        {show.description && (
          <p className="text-[11px] text-zinc-500 mt-1 leading-snug line-clamp-2">
            {show.description}
          </p>
        )}
      </div>

      {/* Admin actions */}
      {isAdmin && (
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => onEdit(show)}
            className="p-1.5 rounded-md text-zinc-500 hover:text-white hover:bg-zinc-800 transition-colors"
            title="Edit"
          >
            <Pencil size={12} />
          </button>
          <button
            onClick={() => onDelete(show)}
            className="p-1.5 rounded-md text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
            title="Delete"
          >
            <Trash2 size={12} />
          </button>
        </div>
      )}
    </div>
  );
};

/* ---------- add/edit form ---------- */
const ShowForm = ({ initial, onSubmit, isSaving, error }) => {
  const [title, setTitle] = useState(initial?.title || "");
  const [host, setHost] = useState(initial?.host || "");
  const [dayOfWeek, setDayOfWeek] = useState(
    initial?.dayOfWeek ?? todayValue()
  );
  const [startTime, setStartTime] = useState(initial?.startTime || "09:00");
  const [endTime, setEndTime] = useState(initial?.endTime || "10:00");
  const [description, setDescription] = useState(initial?.description || "");

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      title: title.trim(),
      host: host.trim(),
      dayOfWeek,
      startTime,
      endTime,
      description: description.trim(),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3.5">
      <div>
        <label className={labelCls}>Show Title *</label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Morning Drive"
          className={fieldCls}
          required
        />
      </div>

      <div>
        <label className={labelCls}>Host</label>
        <input
          value={host}
          onChange={(e) => setHost(e.target.value)}
          placeholder="e.g. DJ Kemi"
          className={fieldCls}
        />
      </div>

      <div>
        <label className={labelCls}>Day</label>
        <div className="grid grid-cols-7 gap-1">
          {DAYS.map((d) => (
            <button
              key={d.value}
              type="button"
              onClick={() => setDayOfWeek(d.value)}
              className={`py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider transition-colors ${
                dayOfWeek === d.value
                  ? "bg-yellow-500 text-zinc-950"
                  : "bg-zinc-950 border border-zinc-800 text-zinc-400 hover:border-zinc-700"
              }`}
            >
              {d.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className={labelCls}>Start</label>
          <input
            type="time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            className={fieldCls}
            required
          />
        </div>
        <div>
          <label className={labelCls}>End</label>
          <input
            type="time"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            className={fieldCls}
            required
          />
        </div>
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
          className={`${fieldCls} resize-none`}
        />
      </div>

      {error && <Alert>{error}</Alert>}

      <button
        type="submit"
        disabled={isSaving}
        className="w-full rounded-lg bg-yellow-500 hover:bg-yellow-400 disabled:opacity-50 text-zinc-950 py-2.5 text-[12px] font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-1.5 whitespace-nowrap"
      >
        {isSaving ? (
          <>
            <Loader2 size={13} className="animate-spin" /> Saving…
          </>
        ) : (
          <>
            <Check size={13} /> {initial ? "Update Show" : "Add Show"}
          </>
        )}
      </button>
    </form>
  );
};

/* ---------- main ---------- */
const Schedule = () => {
  // ── auth (Redux) ─────────────────────────────────────
  const userInfo = useSelector((state) => state.auth.userInfo);
  const user = userInfo?.user ?? userInfo;
  const isAdmin =
    user?.role === "admin" || user?.role === "super_admin" || user?.isAdmin === true;

  // ── data (admin endpoints) ───────────────────────────
  const { data, isLoading, isError } = useGetAdminScheduleQuery();
  const [createItem, { isLoading: isCreating }] =
    useCreateScheduleItemMutation();
  const [updateItem, { isLoading: isUpdating }] =
    useUpdateScheduleItemMutation();
  const [deleteItem, { isLoading: isDeleting }] =
    useDeleteScheduleItemMutation();

  // ── ui state ─────────────────────────────────────────
  const [selectedDay, setSelectedDay] = useState(todayValue());
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [formError, setFormError] = useState("");
  const [actionError, setActionError] = useState("");

  const today = todayValue();
  const now = nowMinutes();
  const schedule = data?.schedule || [];

  const countByDay = useMemo(() => {
    const m = {};
    schedule.forEach((s) => {
      m[s.dayOfWeek] = (m[s.dayOfWeek] || 0) + 1;
    });
    return m;
  }, [schedule]);

  const dayShows = useMemo(
    () =>
      schedule
        .filter((s) => s.dayOfWeek === selectedDay)
        .sort((a, b) => parseTime(a.startTime) - parseTime(b.startTime)),
    [schedule, selectedDay]
  );

  const isLiveNow = (show) =>
    show.dayOfWeek === today &&
    now >= parseTime(show.startTime) &&
    now < parseTime(show.endTime);

  const isFinished = (show) =>
    show.dayOfWeek === today && now >= parseTime(show.endTime);

  const handleSubmit = async (payload) => {
    setFormError("");
    if (!payload.title) return setFormError("Title is required.");
    if (parseTime(payload.endTime) <= parseTime(payload.startTime)) {
      return setFormError("End time must be after start time.");
    }
    try {
      if (editing) {
        await updateItem({ id: editing._id, ...payload }).unwrap();
      } else {
        await createItem(payload).unwrap();
      }
      setShowForm(false);
      setEditing(null);
    } catch (err) {
      setFormError(err?.data?.message || "Failed to save.");
    }
  };

  const handleDelete = async () => {
    setActionError("");
    try {
      await deleteItem(deleting._id).unwrap();
      setDeleting(null);
    } catch (err) {
      setActionError(err?.data?.message || "Failed to delete.");
    }
  };

  const openCreate = () => {
    setEditing(null);
    setFormError("");
    setShowForm(true);
  };

  const openEdit = (show) => {
    setEditing(show);
    setFormError("");
    setShowForm(true);
  };

  const currentDayLabel =
    DAYS.find((d) => d.value === selectedDay)?.full || "";

  return (
    <div className="min-h-screen bg-zinc-950 text-white pb-16">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-6 sm:pt-8">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-6">
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-serif tracking-tight text-white mb-0.5 whitespace-nowrap">
              Schedule
            </h1>
            <p className="text-[12px] text-zinc-500 leading-relaxed">
              Weekly shows and broadcasts.
            </p>
          </div>
          {isAdmin && (
            <button
              onClick={openCreate}
              className="flex items-center gap-1.5 rounded-lg bg-yellow-500 hover:bg-yellow-400 px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-zinc-950 transition-colors whitespace-nowrap shrink-0"
            >
              <Plus size={13} />
              Add Show
            </button>
          )}
        </div>

        {actionError && (
          <div className="mb-4">
            <Alert>{actionError}</Alert>
          </div>
        )}

        {/* Day selector */}
        <div className="grid grid-cols-7 mb-5 border-b border-zinc-800/60">
          {DAYS.map((d) => {
            const isSelected = d.value === selectedDay;
            const isToday = d.value === today;
            const count = countByDay[d.value] || 0;
            return (
              <button
                key={d.value}
                onClick={() => setSelectedDay(d.value)}
                className={`relative py-2.5 sm:py-3 transition-colors border-b-2 -mb-px whitespace-nowrap ${
                  isSelected
                    ? "border-yellow-500 text-white"
                    : "border-transparent text-zinc-500 hover:text-zinc-300"
                }`}
              >
                <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider">
                  {d.label}
                </p>
                <p
                  className={`text-[8px] sm:text-[9px] mt-0.5 ${
                    isSelected
                      ? "text-yellow-500"
                      : isToday
                        ? "text-zinc-400"
                        : "text-zinc-600"
                  }`}
                >
                  {isToday ? "Today" : count > 0 ? count : "—"}
                </p>
              </button>
            );
          })}
        </div>

        {/* Day header */}
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[13px] font-semibold text-zinc-300 whitespace-nowrap">
            {currentDayLabel}
          </h2>
          <span className="text-[10px] text-zinc-600 uppercase tracking-wider whitespace-nowrap">
            {dayShows.length} {dayShows.length === 1 ? "show" : "shows"}
          </span>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-20 w-full animate-pulse bg-zinc-900/60 rounded-lg"
              />
            ))}
          </div>
        ) : isError ? (
          <Alert>Failed to load schedule.</Alert>
        ) : dayShows.length === 0 ? (
          <div className="text-center py-12 rounded-lg border border-dashed border-zinc-800/60">
            <Calendar size={28} className="mx-auto text-zinc-700 mb-2" />
            <p className="text-[12px] text-zinc-500">
              No shows scheduled for {currentDayLabel}.
            </p>
            {isAdmin && (
              <button
                onClick={openCreate}
                className="mt-3 text-[11px] font-bold uppercase tracking-wider text-yellow-500 hover:text-yellow-400 transition-colors whitespace-nowrap"
              >
                + Add a show
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {dayShows.map((show) => (
              <ShowRow
                key={show._id}
                show={show}
                isLive={isLiveNow(show)}
                isFinished={isFinished(show)}
                isAdmin={isAdmin}
                onEdit={openEdit}
                onDelete={(s) => setDeleting(s)}
              />
            ))}
          </div>
        )}

        {/* Hint for non-admins (if page ever shared) */}
        {!isAdmin && dayShows.length > 0 && (
          <p className="mt-6 text-center text-[10px] text-zinc-600 flex items-center justify-center gap-1">
            <Radio size={10} /> Times shown in your local timezone
          </p>
        )}
      </div>

      {/* Add/Edit modal */}
      <Modal
        open={showForm}
        onClose={() => {
          setShowForm(false);
          setEditing(null);
        }}
        title={editing ? "Edit Show" : "Add Show"}
      >
        <ShowForm
          initial={editing}
          onSubmit={handleSubmit}
          isSaving={isCreating || isUpdating}
          error={formError}
        />
      </Modal>

      {/* Delete modal */}
      <Modal
        open={!!deleting}
        onClose={() => setDeleting(null)}
        title="Delete Show"
        footer={
          <>
            <button
              onClick={() => setDeleting(null)}
              className="px-3 py-1.5 rounded-md border border-zinc-800 hover:border-zinc-700 text-zinc-300 text-[11px] font-semibold transition-colors whitespace-nowrap"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="px-3 py-1.5 rounded-md bg-red-500 hover:bg-red-600 disabled:opacity-60 text-white text-[11px] font-bold transition-colors flex items-center gap-1.5 whitespace-nowrap"
            >
              {isDeleting ? (
                <Loader2 size={11} className="animate-spin" />
              ) : (
                <Trash2 size={11} />
              )}
              {isDeleting ? "Deleting…" : "Delete"}
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
              Delete "{deleting?.title}"?
            </p>
            <p className="text-[11px] text-zinc-500 mt-1 leading-relaxed">
              This removes the show from the weekly schedule. Cannot be undone.
            </p>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Schedule;