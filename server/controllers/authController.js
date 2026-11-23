// controllers/authController.js
import crypto from "crypto";
import { v2 as cloudinary } from "cloudinary";
import User from "../models/userModel.js";
import Department from "../models/departmentModel.js"; // Kept if you still want users to select a department
import generateToken from "../utils/generateToken.js";
import { sendOtpEmail } from "../services/emailService.js";

/* ---------- cloudinary helper ---------- */
const uploadFileToCloudinary = async (file, folder, options = {}) => {
  if (!file) return null;

  return new Promise((resolve, reject) => {
    const uploadOptions = {
      folder,
      resource_type: "image",
      ...options,
    };

    cloudinary.uploader
      .upload_stream(uploadOptions, (error, result) => {
        if (error) reject(error);
        else resolve(result);
      })
      .end(file.buffer);
  });
};

const deleteFromCloudinary = async (publicId) => {
  if (!publicId) return null;
  try {
    return await cloudinary.uploader.destroy(publicId);
  } catch (err) {
    console.error("Cloudinary delete failed:", err.message);
    return null;
  }
};

/* ---------- constants ---------- */
const OTP_EXPIRY_MS = 10 * 60 * 1000;
const OTP_RESEND_COOLDOWN_MS = 60 * 1000;
const MAX_OTP_ATTEMPTS = 5;

/* ---------- helpers ---------- */
const generateOtp = () => Math.floor(100000 + Math.random() * 900000).toString();
const hashOtp = (otp) => crypto.createHash("sha256").update(otp).digest("hex");

const maskEmail = (email) => {
  const [local, domain] = email.split("@");
  const visible = local.slice(0, 1);
  const hidden = "*".repeat(Math.min(Math.max(local.length - 1, 3), 4));
  return `${visible}${hidden}@${domain}`;
};

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
  createdAt: user.createdAt,
});

const findUserByIdentifier = async (identifier) => {
  const raw = String(identifier || "").trim();
  if (!raw) return null;
  return User.findOne({
    $or: [{ email: raw.toLowerCase() }, { matricNumber: raw.toUpperCase() }],
  }).populate("department", "name code");
};

const createAndSendOtp = async (user) => {
  const otp = generateOtp();
  user.otpHash = hashOtp(otp);
  user.otpExpiresAt = new Date(Date.now() + OTP_EXPIRY_MS);
  user.otpAttempts = 0;
  user.otpLastSentAt = new Date();
  await user.save();
  await sendOtpEmail(user.email, otp, user.name);
};

/* ============================================================
   SIGNUP
   ============================================================ */

export const signup = async (req, res) => {
  try {
    const { 
      name, 
      email, 
      matricNumber, 
      department, // Optional now, depending on if you want them to select it
      level, 
      phone, 
    } = req.body;

    // Name and Email are the only strictly required fields for a Radio App signup
    if (!name || !email) {
      return res.status(400).json({
        message: "Name and email are required",
      });
    }

    // Only validate department if one was provided
    if (department) {
      const dept = await Department.findById(department);
      if (!dept) return res.status(404).json({ message: "Department not found" });
    }

    const emailLower = email.toLowerCase().trim();
    const matricUpper = matricNumber ? matricNumber.toUpperCase().trim() : undefined;

    // Find if user already exists
    let user = await User.findOne({
      $or: [
        { email: emailLower }, 
        ...(matricUpper ? [{ matricNumber: matricUpper }] : [])
      ],
    });

    if (user) {
      // If they are already verified, block them
      if (user.isEmailVerified) {
        return res.status(409).json({
          message: "Account already exists. Please log in.",
        });
      }

      // If they exist but are UNVERIFIED, we update their info and resend OTP!
      user.name = name.trim();
      user.email = emailLower;
      user.matricNumber = matricUpper;
      user.department = department || null;
      user.level = level ? Number(level) : null;
      user.phone = phone?.trim() || null;
      
      await user.save(); // Save the overwritten details

    } else {
      // Create a brand new user
      user = await User.create({
        name: name.trim(),
        email: emailLower,
        matricNumber: matricUpper,
        department: department || null,
        level: level ? Number(level) : null,
        phone: phone?.trim() || null,
        role: "student", // Default role
        isEmailVerified: false,
        isActive: true,
      });
    }

    // Generate and send a fresh OTP (this works for both new and overwritten users)
    await createAndSendOtp(user);

    return res.status(201).json({
      message: "Signup successful. An OTP has been sent to your email.",
      email: maskEmail(user.email),
      identifier: user.matricNumber || user.email, // Send back whichever they used
    });
  } catch (err) {
    console.error("signup error:", err);
    
    if (err.code === 11000) {
      return res.status(409).json({ 
        message: "This email or matric number is already linked to another account." 
      });
    }
    
    return res.status(500).json({ message: "Server error" });
  }
};

/* ============================================================
   LOGIN (request OTP)
   ============================================================ */

export const login = async (req, res) => {
  try {
    const { identifier } = req.body;
    if (!identifier) {
      return res.status(400).json({ message: "Enter your email or matric number" });
    }

    const user = await findUserByIdentifier(identifier);
    if (!user) {
      return res.status(404).json({
        message: "No account found with that email or matric number",
      });
    }
    
    if (!user.isActive) {
      return res.status(403).json({ message: "Account deactivated. Contact admin." });
    }

    // Check for 60-second cooldown
    if (user.otpLastSentAt) {
      const elapsed = Date.now() - new Date(user.otpLastSentAt).getTime();
      if (elapsed < OTP_RESEND_COOLDOWN_MS) {
        const wait = Math.ceil((OTP_RESEND_COOLDOWN_MS - elapsed) / 1000);
        return res.status(429).json({
          message: `Please wait ${wait}s before requesting another OTP`,
        });
      }
    }

    await createAndSendOtp(user);

    return res.json({
      message: "OTP sent to your email",
      email: maskEmail(user.email),
      identifier: user.email, 
    });
  } catch (err) {
    console.error("login error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

/* ============================================================
   RESEND OTP
   ============================================================ */

export const resendOtp = async (req, res) => {
  try {
    const { identifier } = req.body;
    if (!identifier)
      return res.status(400).json({ message: "Identifier is required" });

    const user = await findUserByIdentifier(identifier);
    if (!user) return res.status(404).json({ message: "No account found" });
    if (!user.isActive)
      return res.status(403).json({ message: "Account deactivated" });

    if (user.otpLastSentAt) {
      const elapsed = Date.now() - new Date(user.otpLastSentAt).getTime();
      if (elapsed < OTP_RESEND_COOLDOWN_MS) {
        const wait = Math.ceil((OTP_RESEND_COOLDOWN_MS - elapsed) / 1000);
        return res.status(429).json({ message: `Please wait ${wait}s` });
      }
    }

    await createAndSendOtp(user);
    return res.json({
      message: "A new OTP has been sent to your email",
      email: maskEmail(user.email),
    });
  } catch (err) {
    console.error("resendOtp error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

/* ============================================================
   VERIFY OTP  (login + signup verification)
   ============================================================ */

export const verifyOtp = async (req, res) => {
  try {
    const { identifier, otp } = req.body;

    if (!identifier || !otp) {
      return res.status(400).json({ message: "Identifier and OTP are required" });
    }
    if (!/^\d{6}$/.test(String(otp))) {
      return res.status(400).json({ message: "OTP must be a 6-digit code" });
    }

    const user = await findUserByIdentifier(identifier);
    if (!user) return res.status(404).json({ message: "No account found" });
    if (!user.isActive)
      return res.status(403).json({ message: "Account deactivated" });

    if (!user.otpHash || !user.otpExpiresAt) {
      return res.status(400).json({ message: "No active OTP. Please request a new one." });
    }
    if (new Date(user.otpExpiresAt).getTime() < Date.now()) {
      return res.status(400).json({ message: "OTP expired. Please request a new one." });
    }
    if ((user.otpAttempts || 0) >= MAX_OTP_ATTEMPTS) {
      return res.status(429).json({ message: "Too many failed attempts. Request a new OTP." });
    }

    if (hashOtp(String(otp)) !== user.otpHash) {
      user.otpAttempts = (user.otpAttempts || 0) + 1;
      await user.save();
      const remaining = MAX_OTP_ATTEMPTS - user.otpAttempts;
      return res.status(401).json({
        message: `Invalid OTP. ${remaining} attempt${remaining === 1 ? "" : "s"} left.`,
      });
    }

    user.isEmailVerified = true;
    user.otpHash = undefined;
    user.otpExpiresAt = undefined;
    user.otpAttempts = 0;
    user.otpLastSentAt = undefined;
    user.lastLoginAt = new Date();
    await user.save();

    // Generate the 30-day token & set the httpOnly cookie
    const token = generateToken(res, user._id);

    return res.json({
      message: "Verified successfully",
      user: sanitizeUser(user),
      token,
    });
  } catch (err) {
    console.error("verifyOtp error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

/* ============================================================
   LOGOUT & ME
   ============================================================ */

export const logout = async (req, res) => {
  try {
    res.cookie("jwt", "", {
      httpOnly: true,
      expires: new Date(0),
      secure: process.env.NODE_ENV === "production",
      sameSite: "none",
      path: "/",
    });
    return res.json({ message: "Logged out" });
  } catch (err) {
    console.error("logout error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate("department", "name code");
    if (!user) return res.status(404).json({ message: "User not found" });
    return res.json({ user: sanitizeUser(user) });
  } catch (err) {
    console.error("getMe error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

/* ============================================================
   PROFILE PICTURE
   ============================================================ */

export const updateProfilePicture = async (req, res) => {
  try {
    const file = req.files?.profilePicture?.[0];
    if (!file) {
      return res.status(400).json({ message: "No image file provided" });
    }

    const user = await User.findById(req.user.id).select("+profilePicturePublicId");
    if (!user) return res.status(404).json({ message: "User not found" });

    const upload = await uploadFileToCloudinary(file, "school_portal/profile_pictures");

    if (user.profilePicturePublicId) {
      await deleteFromCloudinary(user.profilePicturePublicId);
    }

    user.profilePicture = upload.secure_url;
    user.profilePicturePublicId = upload.public_id;
    await user.save();

    return res.json({
      message: "Profile picture updated",
      profilePicture: user.profilePicture,
    });
  } catch (err) {
    console.error("updateProfilePicture error:", err);
    return res.status(500).json({ message: "Failed to upload profile picture" });
  }
};

export const deleteProfilePicture = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("+profilePicturePublicId");
    if (!user) return res.status(404).json({ message: "User not found" });

    if (user.profilePicturePublicId) {
      await deleteFromCloudinary(user.profilePicturePublicId);
    }

    user.profilePicture = null;
    user.profilePicturePublicId = null;
    await user.save();

    return res.json({ message: "Profile picture removed" });
  } catch (err) {
    console.error("deleteProfilePicture error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

/* ============================================================
   DELETE ACCOUNT
   ============================================================ */

export const deleteAccount = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("+profilePicturePublicId");
    if (!user) return res.status(404).json({ message: "User not found" });

    if (user.profilePicturePublicId) {
      await deleteFromCloudinary(user.profilePicturePublicId);
    }

    await User.deleteOne({ _id: user._id });
    
    res.cookie("jwt", "", { httpOnly: true, expires: new Date(0) });
    
    return res.json({ message: "Account deleted successfully" });
  } catch (err) {
    console.error("deleteAccount error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

/* ============================================================
   PUBLIC DEPARTMENTS
   ============================================================ */
export const getPublicDepartments = async (_req, res) => {
  try {
    const departments = await Department.find()
      .select("name code")
      .sort({ name: 1 })
      .lean();

    return res.json({ departments });
  } catch (err) {
    console.error("getPublicDepartments error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};