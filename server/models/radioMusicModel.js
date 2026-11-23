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