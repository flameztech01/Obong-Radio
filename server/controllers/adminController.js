// controllers/adminController.js
import { v2 as cloudinary } from "cloudinary";
import User from "../models/userModel.js";
import Schedule from "../models/scheduleModel.js";

/* ============================================================
   SHARED HELPERS
   ============================================================ */
const ALLOWED_ROLES = [
  "student",
  "staff",
  "dj",
  "moderator",
  "admin",
  "super_admin",
  "guest",
];

const sanitizeUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  matricNumber: user.matricNumber || null,
  department: user.department || null,
  level: user.level ?? null,
  role: user.role,
  extraRoles: user.extraRoles || [],
  scope: user.scope || { levels: [], departments: [] },
  phone: user.phone || null,
  profilePicture: user.profilePicture || null,
  isEmailVerified: user.isEmailVerified,
  isActive: user.isActive,
  lastLoginAt: user.lastLoginAt || null,
  createdAt: user.createdAt,
});

const deleteFromCloudinary = async (publicId) => {
  if (!publicId) return null;
  try {
    return await cloudinary.uploader.destroy(publicId);
  } catch (err) {
    console.error("Cloudinary delete failed:", err.message);
    return null;
  }
};

const isSelf = (req, id) => String(id) === String(req.user.id);

/* ============================================================
   SECTION 1 — USER & ROLE MANAGEMENT
   ============================================================ */

/**
 * GET /api/admin/users?search=&role=&page=&limit=
 * Paginated, searchable list. Strips sensitive fields.
 */
export const getAllUsers = async (req, res) => {
  try {
    const { search = "", role, page = 1, limit = 20 } = req.query;
    const filter = {};

    if (search) {
      const s = String(search).trim();
      filter.$or = [
        { name: { $regex: s, $options: "i" } },
        { email: { $regex: s, $options: "i" } },
        { matricNumber: { $regex: s, $options: "i" } },
      ];
    }
    if (role && ALLOWED_ROLES.includes(role)) filter.role = role;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const [users, total] = await Promise.all([
      User.find(filter)
        .select(
          "-otpHash -otpExpiresAt -otpAttempts -otpLastSentAt -profilePicturePublicId"
        )
        .populate("department", "name code")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      User.countDocuments(filter),
    ]);

    return res.json({
      users,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.max(1, Math.ceil(total / limitNum)),
      },
    });
  } catch (err) {
    console.error("getAllUsers error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

/**
 * GET /api/admin/users/:id
 */
export const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).populate(
      "department",
      "name code"
    );
    if (!user) return res.status(404).json({ message: "User not found" });
    return res.json({ user: sanitizeUser(user) });
  } catch (err) {
    console.error("getUserById error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

/**
 * PATCH /api/admin/users/:id/role
 * Body: { role, extraRoles? }
 */
export const updateUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role, extraRoles } = req.body;

    if (!role || !ALLOWED_ROLES.includes(role)) {
      return res
        .status(400)
        .json({ message: `Role must be one of: ${ALLOWED_ROLES.join(", ")}` });
    }
    if (
      extraRoles !== undefined &&
      (!Array.isArray(extraRoles) ||
        extraRoles.some((r) => !ALLOWED_ROLES.includes(r)))
    ) {
      return res.status(400).json({ message: "Invalid extraRoles" });
    }
    // Guard: can't demote yourself
    if (isSelf(req, id) && role !== "admin") {
      return res
        .status(400)
        .json({ message: "You cannot demote yourself from admin" });
    }

    const user = await User.findByIdAndUpdate(
      id,
      { role, ...(extraRoles !== undefined ? { extraRoles } : {}) },
      { new: true, runValidators: true }
    ).populate("department", "name code");

    if (!user) return res.status(404).json({ message: "User not found" });
    return res.json({ message: "Role updated", user: sanitizeUser(user) });
  } catch (err) {
    console.error("updateUserRole error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

/**
 * PATCH /api/admin/users/:id/active
 * Flips isActive. Prevents self-deactivation.
 */
export const toggleUserActive = async (req, res) => {
  try {
    const { id } = req.params;
    if (isSelf(req, id)) {
      return res
        .status(400)
        .json({ message: "You cannot deactivate yourself" });
    }

    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.isActive = !user.isActive;
    await user.save();

    return res.json({
      message: user.isActive ? "User activated" : "User deactivated",
      isActive: user.isActive,
    });
  } catch (err) {
    console.error("toggleUserActive error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

/**
 * DELETE /api/admin/users/:id
 * Cleans up Cloudinary profile pic, then removes the user.
 */
export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    if (isSelf(req, id)) {
      return res
        .status(400)
        .json({ message: "Use /auth/account to delete your own account" });
    }

    const user = await User.findById(id).select("+profilePicturePublicId");
    if (!user) return res.status(404).json({ message: "User not found" });

    if (user.profilePicturePublicId) {
      await deleteFromCloudinary(user.profilePicturePublicId);
    }
    await User.deleteOne({ _id: user._id });

    return res.json({ message: "User deleted" });
  } catch (err) {
    console.error("deleteUser error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

/* ============================================================
   SECTION 2 — SCHEDULE (Scheduler for Admin)
   ============================================================ */

const isHHmm = (v) => /^([01]\d|2[0-3]):[0-5]\d$/.test(String(v || ""));

const toMinutes = (hhmm) => {
  const [h, m] = String(hhmm).split(":").map(Number);
  return h * 60 + m;
};

/**
 * GET /api/admin/schedule
 * Returns all shows ordered by day + start time.
 */
export const getAllSchedule = async (_req, res) => {
  try {
    const schedule = await Schedule.find()
      .sort({ dayOfWeek: 1, startTime: 1 })
      .lean();
    return res.json({ schedule });
  } catch (err) {
    console.error("getAllSchedule error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

/**
 * POST /api/admin/schedule
 * Body: { title, host?, dayOfWeek, startTime, endTime, description? }
 */
export const createScheduleItem = async (req, res) => {
  try {
    const { title, host, dayOfWeek, startTime, endTime, description } =
      req.body || {};

    if (!title || !String(title).trim()) {
      return res.status(400).json({ message: "Title is required" });
    }
    const day = Number(dayOfWeek);
    if (!Number.isInteger(day) || day < 0 || day > 6) {
      return res
        .status(400)
        .json({ message: "dayOfWeek must be 0 (Sun) to 6 (Sat)" });
    }
    if (!isHHmm(startTime) || !isHHmm(endTime)) {
      return res
        .status(400)
        .json({ message: "startTime and endTime must be HH:mm" });
    }
    if (toMinutes(endTime) <= toMinutes(startTime)) {
      return res
        .status(400)
        .json({ message: "End time must be after start time" });
    }

    const item = await Schedule.create({
      title: String(title).trim(),
      host: (host || "").trim(),
      dayOfWeek: day,
      startTime,
      endTime,
      description: (description || "").trim(),
    });

    return res.status(201).json({ message: "Show created", item });
  } catch (err) {
    console.error("createScheduleItem error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

/**
 * PATCH /api/admin/schedule/:id
 */
export const updateScheduleItem = async (req, res) => {
  try {
    const { id } = req.params;
    const patch = {};
    const {
      title,
      host,
      dayOfWeek,
      startTime,
      endTime,
      description,
    } = req.body || {};

    if (title !== undefined) {
      if (!String(title).trim())
        return res.status(400).json({ message: "Title cannot be empty" });
      patch.title = String(title).trim();
    }
    if (host !== undefined) patch.host = String(host).trim();
    if (description !== undefined)
      patch.description = String(description).trim();
    if (dayOfWeek !== undefined) {
      const day = Number(dayOfWeek);
      if (!Number.isInteger(day) || day < 0 || day > 6) {
        return res
          .status(400)
          .json({ message: "dayOfWeek must be 0 (Sun) to 6 (Sat)" });
      }
      patch.dayOfWeek = day;
    }
    if (startTime !== undefined) {
      if (!isHHmm(startTime))
        return res.status(400).json({ message: "startTime must be HH:mm" });
      patch.startTime = startTime;
    }
    if (endTime !== undefined) {
      if (!isHHmm(endTime))
        return res.status(400).json({ message: "endTime must be HH:mm" });
      patch.endTime = endTime;
    }

    // Validate the resulting start < end combo
    const existing = await Schedule.findById(id);
    if (!existing) return res.status(404).json({ message: "Show not found" });

    const finalStart = patch.startTime ?? existing.startTime;
    const finalEnd = patch.endTime ?? existing.endTime;
    if (toMinutes(finalEnd) <= toMinutes(finalStart)) {
      return res
        .status(400)
        .json({ message: "End time must be after start time" });
    }

    Object.assign(existing, patch);
    await existing.save();

    return res.json({ message: "Show updated", item: existing });
  } catch (err) {
    console.error("updateScheduleItem error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

/**
 * DELETE /api/admin/schedule/:id
 */
export const deleteScheduleItem = async (req, res) => {
  try {
    const item = await Schedule.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ message: "Show not found" });
    return res.json({ message: "Show deleted" });
  } catch (err) {
    console.error("deleteScheduleItem error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};