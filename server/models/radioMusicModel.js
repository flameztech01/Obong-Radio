// models/radioMusicModel.js
import mongoose from "mongoose";

const radioMusicSchema = new mongoose.Schema(
  {
    trackId: {
      type: String,
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    artist: {
      type: String,
      required: true,
    },
    audioUrl: {
      type: String,
      required: true,
    },
    image: {
      type: String,
    },
    // Length of the track in SECONDS.
    // Critical for the synchronized "everyone hears the same moment" playback:
    // the server walks the ordered queue summing durations to figure out
    // which track is playing and at what offset right now.
    duration: {
      type: Number,
      required: true,
      default: 180, // fallback if a source omits it
      min: 1,
    },
    order: {
      type: Number, // To maintain the playlist sequence
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    // 'auto' = fetched by the Auto-DJ (replaced on refresh)
    // 'admin' = uploaded manually (never deleted by refresh)
    source: {
      type: String,
      enum: ["auto", "admin"],
      default: "auto",
    },
  },
  { timestamps: true }
);

// Index to quickly fetch the active queue in order
radioMusicSchema.index({ isActive: 1, order: 1 });

const RadioMusic = mongoose.model("RadioMusic", radioMusicSchema);
export default RadioMusic;