// models/userModel.js
import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    // ==========================================
    // BASIC INFO
    // ==========================================
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
      default: null,
    },

    // ==========================================
    // ACADEMIC / IDENTIFICATION
    // (Sparse allows multiple nulls for guests/admins who don't have these)
    // ==========================================
    matricNumber: {
      type: String,
      unique: true,
      sparse: true, 
      uppercase: true,
      trim: true,
    },
    staffId: {
      type: String,
      unique: true,
      sparse: true,
      uppercase: true,
      trim: true,
    },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      required: [true, "Department is required"],
    },
    level: {
      type: Number,
      enum: [100, 200, 300, 400, 500],
      default: null,
    },

    // ==========================================
    // ROLES & PERMISSIONS
    // ==========================================
    role: {
      type: String,
      enum: ["student", "admin", "super_admin", "guest"],
      default: "student",
    },
    extraRoles: {
      type: [String],
      default: [],
    },
    // Used if an admin needs restricted access to specific levels/departments
    scope: {
      levels: {
        type: [Number],
        default: [],
      },
      departments: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Department",
        },
      ],
    },

    // ==========================================
    // PROFILE PICTURE (Cloudinary)
    // ==========================================
    profilePicture: {
      type: String,
      default: null,
    },
    // Hidden by default, requires .select('+profilePicturePublicId') to fetch
    profilePicturePublicId: {
      type: String,
      select: false, 
    },

    // ==========================================
    // ACADEMIC FLAGS (For Transfer/Historical Results)
    // ==========================================
    isTransferStudent: {
      type: Boolean,
      default: false,
    },
    hasUploadedHistoricalResults: {
      type: Boolean,
      default: false,
    },
    transferCgpa: {
      type: Number,
      default: null,
    },

    // ==========================================
    // AUTHENTICATION & OTP
    // ==========================================
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    otpHash: {
      type: String,
      default: undefined,
    },
    otpExpiresAt: {
      type: Date,
      default: undefined,
    },
    otpAttempts: {
      type: Number,
      default: 0,
    },
    otpLastSentAt: {
      type: Date,
      default: undefined,
    },
    lastLoginAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt
  }
);

// ==========================================
// INDEXES FOR PERFORMANCE
// ==========================================
userSchema.index({ department: 1, role: 1 });
userSchema.index({ isActive: 1 });

const User = mongoose.model("User", userSchema);

export default User;