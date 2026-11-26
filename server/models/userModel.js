// models/userModel.js
import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    /* BASIC */
    name:  { type: String, required: [true, "Name is required"], trim: true },
    email: { type: String, required: [true, "Email is required"], unique: true, lowercase: true, trim: true },
    phone: { type: String, trim: true, default: null },

    /* ACADEMIC (sparse → guests/admins can exist without these) */
    matricNumber: { type: String, unique: true, sparse: true, uppercase: true, trim: true },
    staffId:      { type: String, unique: true, sparse: true, uppercase: true, trim: true },

    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      default: null,
      // Required only for student/staff — DJs, admins, moderators, guests can be dept-less
      required: function () {
        return this.role === "student" || this.role === "staff";
      },
    },
    level: { type: Number, enum: [100, 200, 300, 400, 500], default: null },

    /* ROLES */
    role: {
      type: String,
      enum: ["student", "staff", "dj", "moderator", "admin", "super_admin", "guest"],
      default: "student",
    },
    extraRoles: { type: [String], default: [] },
    scope: {
      levels:      { type: [Number], default: [] },
      departments: [{ type: mongoose.Schema.Types.ObjectId, ref: "Department" }],
    },

    /* PROFILE PICTURE */
    profilePicture:         { type: String, default: null },
    profilePicturePublicId: { type: String, select: false },

    /* ACADEMIC FLAGS */
    isTransferStudent:          { type: Boolean, default: false },
    hasUploadedHistoricalResults: { type: Boolean, default: false },
    transferCgpa:               { type: Number, default: null },

    /* AUTH & OTP */
    isEmailVerified: { type: Boolean, default: false },
    isActive:        { type: Boolean, default: true },
    otpHash:         { type: String, default: undefined },
    otpExpiresAt:    { type: Date,   default: undefined },
    otpAttempts:     { type: Number, default: 0 },
    otpLastSentAt:   { type: Date,   default: undefined },
    lastLoginAt:     { type: Date,   default: null },
  },
  {
    timestamps: true,
    toJSON:   { virtuals: true },
    toObject: { virtuals: true },
  }
);

/* ---- VIRTUAL: isAdmin (backed by role, single source of truth) ---- */
userSchema.virtual("isAdmin").get(function () {
  return this.role === "admin" || this.role === "super_admin";
});

/* ---- INDEXES ---- */
userSchema.index({ department: 1, role: 1 });
userSchema.index({ isActive: 1 });
userSchema.index({ role: 1 }); // speeds up /admin/users?role=dj

const User = mongoose.model("User", userSchema);
export default User;