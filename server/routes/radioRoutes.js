// routes/radioRoutes.js
import express from "express";
import { 
  startLiveSession, 
  endLiveSession, 
  getListenerToken, 
  generateGuestLink, 
  getMusicQueue, 
  handleRecordingWebhook 
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

// Multer Setup for Poster Image Uploads
const upload = multer({ 
  storage: multer.memoryStorage(), 
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit for poster
});

// ==========================================
// ADMIN ROUTES (Strictly Protected)
// ==========================================
router.post("/start-session", protect, adminOnly, upload.fields([{ name: "poster", maxCount: 1 }]), startLiveSession);
router.post("/end-session", protect, adminOnly, endLiveSession);
router.post("/guest-link", protect, adminOnly, generateGuestLink);

// ==========================================
// PUBLIC ROUTES (Listeners & Guests)
// ==========================================
// optionalAuth allows anonymous access but identifies logged-in users
router.get("/listener-token", optionalAuth, getListenerToken);
router.get("/music/queue", getMusicQueue);

// ==========================================
// WEBHOOKS (For LiveKit Egress)
// ==========================================
router.post(
  "/webhook/recording-complete", 
  express.raw({ type: '*/*', limit: '100mb' }), 
  handleRecordingWebhook
);

export default router;