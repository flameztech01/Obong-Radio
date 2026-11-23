// models/radioSessionModel.js
import mongoose from "mongoose";

const radioSessionSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    host: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: ["live", "ended"],
      default: "live",
    },
    isVideoEnabled: {
      type: Boolean,
      default: false,
    },
    posterImage: {
      type: String,
      required: true, // Cloudinary URL
    },
    egressId: {
      type: String, // LiveKit Egress ID for the recording
      default: null,
    },
    recordingUrl: {
      type: String, // Cloudinary URL for the audio replay
      default: null,
    },
    startedAt: {
      type: Date,
      default: Date.now,
    },
    endedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

// Index to quickly find the active live session
radioSessionSchema.index({ status: 1 });

const RadioSession = mongoose.model("RadioSession", radioSessionSchema);
export default RadioSession;