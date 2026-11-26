// routes/adminRoutes.js
import express from "express";
import {
  // Users & Roles
  getAllUsers,
  getUserById,
  updateUserRole,
  toggleUserActive,
  deleteUser,
  // Schedule
  getAllSchedule,
  createScheduleItem,
  updateScheduleItem,
  deleteScheduleItem,
} from "../controllers/adminController.js";
import { protect, adminOnly } from "../middleware/authMiddleware.js";

const router = express.Router();

/* ============================================================
   GATE EVERYTHING IN THIS FILE TO ADMIN ONLY
   ============================================================ */
router.use(protect, adminOnly);

/* ============================================================
   USERS & ROLES
   ============================================================ */
router.get("/users", getAllUsers);
router.get("/users/:id", getUserById);
router.patch("/users/:id/role", updateUserRole);
router.patch("/users/:id/active", toggleUserActive);
router.delete("/users/:id", deleteUser);

/* ============================================================
   SCHEDULE (Scheduler)
   ============================================================ */
router.get("/schedule", getAllSchedule);
router.post("/schedule", createScheduleItem);
router.patch("/schedule/:id", updateScheduleItem);
router.delete("/schedule/:id", deleteScheduleItem);

export default router;