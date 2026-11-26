// routes/radioRoutes.js
import express from "express";
import {
  startLiveSession,
  endLiveSession,
  getListenerToken,
  generateGuestLink,
  getMusicQueue,
  getNowPlaying,
  refreshMusicQueue,
  uploadMusicTrack,
  deleteMusicTrack,
  setCurrentTrack,
  handleRecordingWebhook,
} from "../controllers/radioController.js";
import { protect, adminOnly, optionalAuth } from "../middleware/authMiddleware.js";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";

const router = express.Router();

// Cloudinary Config
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET,
});

// Multer Setup
// - Poster: 5MB (images)
// - Music:  50MB (audio + optional cover)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB ceiling for audio uploads
});

// ==========================================
// ADMIN ROUTES (Strictly Protected)
// ==========================================
router.post(
  "/start-session",
  protect,
  adminOnly,
  upload.fields([{ name: "poster", maxCount: 1 }]),
  startLiveSession
);
router.post("/end-session", protect, adminOnly, endLiveSession);
router.post("/guest-link", protect, adminOnly, generateGuestLink);

// ---- Music management (admin only) ----
router.post(
  "/music/upload",
  protect,
  adminOnly,
  upload.fields([
    { name: "audio", maxCount: 1 },
    { name: "cover", maxCount: 1 },
  ]),
  uploadMusicTrack
);
router.post("/music/refresh", protect, adminOnly, refreshMusicQueue);

// Force a specific track to play for EVERYONE right now.
// Body: { trackId }  ← Mongo _id OR the string trackId (both work)
router.post("/music/play", protect, adminOnly, setCurrentTrack);

// Delete a track (auto tracks are refreshed anyway, admin tracks removed permanently)
router.delete("/music/:id", protect, adminOnly, deleteMusicTrack);

// ==========================================
// PUBLIC ROUTES (Listeners & Guests)
// ==========================================
// optionalAuth allows anonymous access but identifies logged-in users.
// If an admin is logged in, they get publish rights in the returned LiveKit token.
router.get("/listener-token", optionalAuth, getListenerToken);

// Full queue + current synchronized nowPlaying state
router.get("/music/queue", getMusicQueue);

// Ultra-light nowPlaying poll (~every 30–60s from client to stay in sync)
router.get("/music/now", getNowPlaying);

// ==========================================
// WEBHOOKS (For LiveKit Egress)
// ==========================================
router.post(
  "/webhook/recording-complete",
  express.raw({ type: "*/*", limit: "100mb" }),
  handleRecordingWebhook
);

export default router;