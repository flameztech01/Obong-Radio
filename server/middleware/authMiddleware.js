// middleware/authMiddleware.js
import jwt from "jsonwebtoken";
import asyncHandler from "express-async-handler";
import User from "../models/userModel.js";

// Helper to extract and verify token
const getUserFromToken = async (req) => {
  const authHeader = req.headers?.authorization;
  const headerToken = authHeader && authHeader.startsWith("Bearer ") ? authHeader.split(" ")[1] : null;
  const cookieToken = req.cookies?.jwt || null;

  const tokensToTry = [headerToken, cookieToken].filter(Boolean);
  if (!tokensToTry.length) return null;

  for (const token of tokensToTry) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const userId = decoded.userId || decoded.id;
      const user = await User.findById(userId).select("-password");
      if (user) return user;
    } catch (err) {
      // Token failed (expired, invalid), continue to next token if any
    }
  }
  return null;
};

// ==========================================
// 1. PROTECT (Strict Auth)
// ==========================================
export const protect = asyncHandler(async (req, res, next) => {
  const user = await getUserFromToken(req);

  if (!user) {
    res.status(401);
    throw new Error("Not authorized, user token failed or missing");
  }

  req.user = user;
  next();
});

// ==========================================
// 2. OPTIONAL AUTH (For Public Routes that benefit from user context)
// ==========================================
export const optionalAuth = asyncHandler(async (req, res, next) => {
  // We try to get the user, but we DO NOT throw an error if it fails
  const user = await getUserFromToken(req);
  
  if (user) {
    req.user = user;
  } else {
    req.user = null; // Explicitly set to null for clarity in controllers
  }
  
  next();
});

// ==========================================
// 3. ADMIN ONLY
// ==========================================
export const adminOnly = asyncHandler(async (req, res, next) => {
  if (req.user && (req.user.role === "admin" || req.user.role === "super_admin")) {
    next();
  } else {
    res.status(403);
    throw new Error("Access denied: Admin privileges required");
  }
});