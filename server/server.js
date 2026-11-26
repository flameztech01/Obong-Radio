// backend/server.js
import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import http from "http";

import authRoutes from "./routes/authRoutes.js";
import radioRoutes from "./routes/radioRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import { notFound, errorHandler } from "./middleware/errorMiddleware.js";
import { handleLiveKitWebhook } from "./controllers/livekitWebhookController.js";
import { initSocket } from "./socket.js";

dotenv.config();

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 8080;

// ==========================================
// ⚠️ WEBHOOK MUST BE BEFORE express.json()
// ==========================================
app.post(
  "/api/livekit/webhook", 
  express.raw({ type: "application/webhook+json" }), 
  handleLiveKitWebhook
);

// ==========================================
// STANDARD MIDDLEWARE
// ==========================================
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(cors({
    origin: [
       'http://localhost:2020',
       'http://127.0.0.1:2020',
       process.env.FRONTEND_URL
    ].filter(Boolean), // Remove undefined values
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Initialize Socket.io
initSocket(server);

// Health Check
app.get("/api/health", (req, res) => {
  res.status(200).json({ success: true, message: "Backend is reachable" });
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/radio", radioRoutes);
app.use("/api/admin", adminRoutes);

// Error Handling
app.use(notFound);
app.use(errorHandler);

// Database & Server Start
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB connected");
    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error("MongoDB connection error:", error.message);
  });