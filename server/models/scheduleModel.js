// models/scheduleModel.js
import mongoose from "mongoose";

const scheduleSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Show title is required"],
      trim: true,
      maxlength: [120, "Title must be 120 characters or less"],
    },

    host: {
      type: String,
      trim: true,
      default: "",
      maxlength: [80, "Host name must be 80 characters or less"],
    },

    // 0 = Sunday … 6 = Saturday (matches JS Date.getDay())
    dayOfWeek: {
      type: Number,
      required: [true, "dayOfWeek is required"],
      min: [0, "dayOfWeek must be 0 (Sun) to 6 (Sat)"],
      max: [6, "dayOfWeek must be 0 (Sun) to 6 (Sat)"],
      validate: {
        validator: Number.isInteger,
        message: "dayOfWeek must be an integer",
      },
    },

    // "HH:mm" 24-hour format — validated in the controller too,
    // but keeping a schema-level check guards direct DB writes.
    startTime: {
      type: String,
      required: [true, "startTime is required"],
      match: [/^([01]\d|2[0-3]):[0-5]\d$/, "startTime must be HH:mm (00:00–23:59)"],
    },
    endTime: {
      type: String,
      required: [true, "endTime is required"],
      match: [/^([01]\d|2[0-3]):[0-5]\d$/, "endTime must be HH:mm (00:00–23:59)"],
    },

    description: {
      type: String,
      trim: true,
      default: "",
      maxlength: [500, "Description must be 500 characters or less"],
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

/* ============================================================
   INDEXES
   ============================================================ */
// Fast lookup: "give me all shows for Monday, sorted by time"
scheduleSchema.index({ dayOfWeek: 1, startTime: 1 });

/* ============================================================
   VIRTUALS (handy for the frontend, no schema storage)
   ============================================================ */
const toMinutes = (hhmm) => {
  if (!hhmm) return 0;
  const [h, m] = String(hhmm).split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
};

scheduleSchema.virtual("startMinutes").get(function () {
  return toMinutes(this.startTime);
});

scheduleSchema.virtual("endMinutes").get(function () {
  return toMinutes(this.endTime);
});

scheduleSchema.virtual("durationMinutes").get(function () {
  return Math.max(0, toMinutes(this.endTime) - toMinutes(this.startTime));
});

/* ============================================================
   PRE-SAVE VALIDATION: endTime must be after startTime
   (belt-and-braces — controller also checks, but this covers
    anything that bypasses the controller, e.g. seeds/scripts)
   ============================================================ */
scheduleSchema.pre("validate", function (next) {
  if (this.startTime && this.endTime) {
    if (toMinutes(this.endTime) <= toMinutes(this.startTime)) {
      this.invalidate(
        "endTime",
        "End time must be after start time",
        this.endTime
      );
    }
  }
  next();
});

const Schedule =
  mongoose.models.Schedule || mongoose.model("Schedule", scheduleSchema);

export default Schedule;