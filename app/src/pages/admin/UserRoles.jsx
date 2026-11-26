// src/pages/admin/UsersRoles.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import {
  Users,
  Search,
  AlertCircle,
  Loader2,
  X,
  Check,
  Shield,
  ShieldCheck,
  Ban,
  UserCheck,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Mail,
  Hash,
  ChevronDown,
} from "lucide-react";
import {
  useGetAllUsersQuery,
  useUpdateUserRoleMutation,
  useToggleUserActiveMutation,
  useDeleteUserMutation,
} from "../../features/adminApiSlice";

/* ---------- shared field styles ---------- */
const fieldCls =
  "w-full rounded-lg border border-zinc-800 bg-zinc-900/40 px-3.5 py-2.5 text-[13px] text-white placeholder-zinc-600 transition-colors focus:border-yellow-500/40 focus:bg-zinc-900 focus:outline-none";
const labelCls =
  "block text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1.5";

/* ---------- role metadata ---------- */
const ROLES = [
  {
    value: "student",
    label: "Student",
    badge: "bg-zinc-700/40 text-zinc-300 border-zinc-700",
  },
  {
    value: "staff",
    label: "Staff",
    badge: "bg-sky-500/10 text-sky-400 border-sky-500/20",
  },
  {
    value: "dj",
    label: "DJ",
    badge: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  },
  {
    value: "moderator",
    label: "Moderator",
    badge: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  },
  {
    value: "admin",
    label: "Admin",
    badge: "bg-red-500/10 text-red-400 border-red-500/20",
  },
  {
    value: "super_admin",
    label: "Super Admin",
    badge: "bg-red-500/20 text-red-300 border-red-500/30",
  },
  {
    value: "guest",
    label: "Guest",
    badge: "bg-zinc-800/60 text-zinc-500 border-zinc-800",
  },
];

const roleMeta = (value) =>
  ROLES.find((r) => r.value === value) || {
    value,
    label: value,
    badge: "bg-zinc-800/60 text-zinc-400 border-zinc-800",
  };

const isAdminRole = (r) => r === "admin" || r === "super_admin";

/* ---------- modal ---------- */
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

/* ---------- role badge ---------- */
const RoleBadge = ({ role }) => {
  const meta = roleMeta(role);
  return (
    <span
      className={`inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border whitespace-nowrap ${meta.badge}`}
    >
      {isAdminRole(role) && <ShieldCheck size={9} />}
      {meta.label}
    </span>
  );
};

/* ---------- avatar ---------- */
const Avatar = ({ user, size = "md" }) => {
  const cls = size === "lg" ? "h-12 w-12" : "h-10 w-10";
  if (user.profilePicture) {
    return (
      <img
        src={user.profilePicture}
        alt={user.name}
        className={`${cls} rounded-full object-cover bg-zinc-800 border border-zinc-800 shrink-0`}
      />
    );
  }
  const initials = (user.name || "?")
    .split(" ")
    .map((s) => s[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <div
      className={`${cls} rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-300 font-semibold text-[12px] shrink-0`}
    >
      {initials}
    </div>
  );
};

/* ---------- user row ---------- */
const UserRow = ({ user, isSelf, onEditRole, onToggleActive, onDelete }) => {
  const inactive = user.isActive === false;
  return (
    <div
      className={`flex items-start gap-3 p-3 rounded-lg border transition-colors min-w-0 ${
        inactive
          ? "border-zinc-800/40 bg-zinc-900/20 opacity-70"
          : "border-zinc-800/80 bg-zinc-900/40 hover:border-zinc-800"
      }`}
    >
      <Avatar user={user} />

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
          <h3 className="text-[13px] font-semibold text-white truncate">
            {user.name}
          </h3>
          <RoleBadge role={user.role} />
          {inactive && (
            <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-500 bg-zinc-800 px-1.5 py-0.5 rounded whitespace-nowrap">
              Inactive
            </span>
          )}
          {isSelf && (
            <span className="text-[9px] font-bold uppercase tracking-wider text-yellow-500/80 bg-yellow-500/10 px-1.5 py-0.5 rounded whitespace-nowrap">
              You
            </span>
          )}
        </div>
        <p className="text-[11px] text-zinc-400 flex items-center gap-1 truncate">
          <Mail size={10} className="shrink-0" />
          {user.email}
        </p>
        {user.matricNumber && (
          <p className="text-[10px] text-zinc-500 flex items-center gap-1 truncate mt-0.5">
            <Hash size={9} className="shrink-0" />
            {user.matricNumber}
          </p>
        )}
      </div>

      <div className="flex items-center gap-1 shrink-0">
        <button
          onClick={() => onEditRole(user)}
          className="p-1.5 rounded-md text-zinc-500 hover:text-white hover:bg-zinc-800 transition-colors"
          title="Edit role"
        >
          <Shield size={12} />
        </button>
        <button
          onClick={() => onToggleActive(user)}
          disabled={isSelf}
          className={`p-1.5 rounded-md transition-colors ${
            isSelf
              ? "text-zinc-800 cursor-not-allowed"
              : inactive
                ? "text-zinc-500 hover:text-emerald-400 hover:bg-emerald-500/10"
                : "text-zinc-500 hover:text-amber-400 hover:bg-amber-500/10"
          }`}
          title={
            isSelf
              ? "You can't deactivate yourself"
              : inactive
                ? "Activate user"
                : "Deactivate user"
          }
        >
          {inactive ? <UserCheck size={12} /> : <Ban size={12} />}
        </button>
        <button
          onClick={() => onDelete(user)}
          disabled={isSelf}
          className={`p-1.5 rounded-md transition-colors ${
            isSelf
              ? "text-zinc-800 cursor-not-allowed"
              : "text-zinc-500 hover:text-red-400 hover:bg-red-500/10"
          }`}
          title={isSelf ? "You can't delete yourself" : "Delete user"}
        >
          <Trash2 size={12} />
        </button>
      </div>
    </div>
  );
};

/* ---------- role editor modal ---------- */
const RoleEditor = ({ user, onSubmit, isSaving, error, currentUserId }) => {
  const [role, setRole] = useState(user.role);
  const [extraRoles, setExtraRoles] = useState(user.extraRoles || []);

  const isSelf = String(user._id) === String(currentUserId);

  const toggleExtra = (value) => {
    setExtraRoles((prev) =>
      prev.includes(value) ? prev.filter((r) => r !== value) : [...prev, value]
    );
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // extraRoles should not duplicate the primary role
    const cleaned = extraRoles.filter((r) => r !== role);
    onSubmit({ role, extraRoles: cleaned });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3.5">
      <div className="flex items-center gap-3 p-3 rounded-lg bg-zinc-950/60 border border-zinc-800">
        <Avatar user={user} />
        <div className="min-w-0">
          <p className="text-[13px] font-semibold text-white truncate">
            {user.name}
          </p>
          <p className="text-[11px] text-zinc-500 truncate">{user.email}</p>
        </div>
      </div>

      <div>
        <label className={labelCls}>Primary Role</label>
        <div className="relative">
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className={`${fieldCls} appearance-none pr-9`}
          >
            {ROLES.map((r) => (
              <option key={r.value} value={r.value} className="bg-zinc-900">
                {r.label}
              </option>
            ))}
          </select>
          <ChevronDown
            size={14}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none"
          />
        </div>
        {isSelf && isAdminRole(user.role) && role !== user.role && (
          <p className="text-[10px] text-amber-500 mt-1.5">
            Warning: changing your own admin role will revoke your access.
          </p>
        )}
      </div>

      <div>
        <label className={labelCls}>
          Extra Roles{" "}
          <span className="text-zinc-600 normal-case font-normal">
            (optional)
          </span>
        </label>
        <div className="grid grid-cols-2 gap-1.5">
          {ROLES.filter((r) => r.value !== role).map((r) => {
            const checked = extraRoles.includes(r.value);
            return (
              <button
                key={r.value}
                type="button"
                onClick={() => toggleExtra(r.value)}
                className={`flex items-center justify-between gap-1.5 px-2.5 py-1.5 rounded-md border text-[11px] font-medium transition-colors ${
                  checked
                    ? "bg-yellow-500/10 border-yellow-500/40 text-yellow-400"
                    : "bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700"
                }`}
              >
                <span className="truncate">{r.label}</span>
                {checked && <Check size={11} className="shrink-0" />}
              </button>
            );
          })}
        </div>
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
            <Check size={13} /> Save Role
          </>
        )}
      </button>
    </form>
  );
};

/* ---------- main ---------- */
const UsersRoles = () => {
  // auth from Redux
  const userInfo = useSelector((state) => state.auth.userInfo);
  const me = userInfo?.user ?? userInfo;
  const currentUserId = me?.id || me?._id;

  // search/filter state
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [page, setPage] = useState(1);
  const limit = 20;

  // ui state
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [formError, setFormError] = useState("");
  const [actionError, setActionError] = useState("");

  // debounce search input
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(searchInput);
      setPage(1);
    }, 350);
    return () => clearTimeout(t);
  }, [searchInput]);

  // reset page when role filter changes
  useEffect(() => {
    setPage(1);
  }, [roleFilter]);

  // data
  const { data, isLoading, isError, isFetching } = useGetAllUsersQuery({
    search: debouncedSearch,
    role: roleFilter,
    page,
    limit,
  });

  const [updateRole, { isLoading: isSavingRole }] =
    useUpdateUserRoleMutation();
  const [toggleActive, { isLoading: isToggling }] = useToggleUserActiveMutation();
  const [deleteUser, { isLoading: isDeletingUser }] = useDeleteUserMutation();

  const users = data?.users || [];
  const pagination = data?.pagination || {
    page: 1,
    limit,
    total: 0,
    pages: 1,
  };

  const canPrev = pagination.page > 1;
  const canNext = pagination.page < pagination.pages;

  const handleSaveRole = async (payload) => {
    setFormError("");
    try {
      await updateRole({ id: editing._id, ...payload }).unwrap();
      setEditing(null);
    } catch (err) {
      setFormError(err?.data?.message || "Failed to update role.");
    }
  };

  const handleToggleActive = async (user) => {
    setActionError("");
    try {
      await toggleActive(user._id).unwrap();
    } catch (err) {
      setActionError(err?.data?.message || "Failed to toggle user status.");
    }
  };

  const handleDelete = async () => {
    setActionError("");
    try {
      await deleteUser(deleting._id).unwrap();
      setDeleting(null);
    } catch (err) {
      setActionError(err?.data?.message || "Failed to delete user.");
    }
  };

  const fromItem = pagination.total === 0 ? 0 : (pagination.page - 1) * limit + 1;
  const toItem = Math.min(pagination.total, pagination.page * limit);

  return (
    <div className="min-h-screen bg-zinc-950 text-white pb-16">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-6 sm:pt-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-xl sm:text-2xl font-serif tracking-tight text-white mb-0.5 whitespace-nowrap">
            Users & Roles
          </h1>
          <p className="text-[12px] text-zinc-500 leading-relaxed">
            Manage accounts, permissions, and access.
          </p>
        </div>

        {actionError && (
          <div className="mb-4">
            <Alert>{actionError}</Alert>
          </div>
        )}

        {/* Search + filter */}
        <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-2 mb-4">
          <div className="relative">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600 pointer-events-none"
            />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search by name, email, or matric…"
              className={`${fieldCls} pl-9`}
            />
            {searchInput && (
              <button
                onClick={() => setSearchInput("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded text-zinc-500 hover:text-white hover:bg-zinc-800 transition-colors"
              >
                <X size={12} />
              </button>
            )}
          </div>
          <div className="relative">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className={`${fieldCls} appearance-none pr-9 sm:w-[160px]`}
            >
              <option value="" className="bg-zinc-900">
                All roles
              </option>
              {ROLES.map((r) => (
                <option key={r.value} value={r.value} className="bg-zinc-900">
                  {r.label}
                </option>
              ))}
            </select>
            <ChevronDown
              size={14}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none"
            />
          </div>
        </div>

        {/* Count */}
        <div className="flex items-center justify-between mb-3 px-1">
          <p className="text-[10px] text-zinc-600 uppercase tracking-wider whitespace-nowrap">
            {isLoading
              ? "Loading…"
              : pagination.total === 0
                ? "0 users"
                : `${fromItem}–${toItem} of ${pagination.total}`}
          </p>
          {isFetching && !isLoading && (
            <Loader2 size={11} className="text-zinc-600 animate-spin" />
          )}
        </div>

        {/* List */}
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="h-[68px] w-full animate-pulse bg-zinc-900/60 rounded-lg"
              />
            ))}
          </div>
        ) : isError ? (
          <Alert>Failed to load users.</Alert>
        ) : users.length === 0 ? (
          <div className="text-center py-12 rounded-lg border border-dashed border-zinc-800/60">
            <Users size={28} className="mx-auto text-zinc-700 mb-2" />
            <p className="text-[12px] text-zinc-500">
              {debouncedSearch || roleFilter
                ? "No users match your filters."
                : "No users yet."}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {users.map((user) => (
              <UserRow
                key={user._id}
                user={user}
                isSelf={String(user._id) === String(currentUserId)}
                onEditRole={(u) => {
                  setFormError("");
                  setEditing(u);
                }}
                onToggleActive={handleToggleActive}
                onDelete={(u) => setDeleting(u)}
              />
            ))}
          </div>
        )}

        {/* Pagination */}
        {!isLoading && !isError && pagination.pages > 1 && (
          <div className="flex items-center justify-between mt-5">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={!canPrev}
              className="flex items-center gap-1 rounded-lg border border-zinc-800 px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-zinc-300 hover:border-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
            >
              <ChevronLeft size={12} />
              Prev
            </button>
            <p className="text-[11px] font-mono text-zinc-500 whitespace-nowrap">
              Page {pagination.page} / {pagination.pages}
            </p>
            <button
              onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}
              disabled={!canNext}
              className="flex items-center gap-1 rounded-lg border border-zinc-800 px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-zinc-300 hover:border-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
            >
              Next
              <ChevronRight size={12} />
            </button>
          </div>
        )}
      </div>

      {/* Role editor */}
      <Modal
        open={!!editing}
        onClose={() => setEditing(null)}
        title="Edit Role"
      >
        {editing && (
          <RoleEditor
            user={editing}
            onSubmit={handleSaveRole}
            isSaving={isSavingRole}
            error={formError}
            currentUserId={currentUserId}
          />
        )}
      </Modal>

      {/* Delete confirm */}
      <Modal
        open={!!deleting}
        onClose={() => setDeleting(null)}
        title="Delete User"
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
              disabled={isDeletingUser}
              className="px-3 py-1.5 rounded-md bg-red-500 hover:bg-red-600 disabled:opacity-60 text-white text-[11px] font-bold transition-colors flex items-center gap-1.5 whitespace-nowrap"
            >
              {isDeletingUser ? (
                <Loader2 size={11} className="animate-spin" />
              ) : (
                <Trash2 size={11} />
              )}
              {isDeletingUser ? "Deleting…" : "Delete"}
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
              Delete "{deleting?.name}"?
            </p>
            <p className="text-[11px] text-zinc-500 mt-1 leading-relaxed">
              This removes the account permanently. Their profile picture will
              also be deleted. This cannot be undone.
            </p>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default UsersRoles;