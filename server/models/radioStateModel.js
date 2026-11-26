// models/radioStateModel.js
import mongoose from 'mongoose';

const radioStateSchema = new mongoose.Schema(
  {
    key:               { type: String, default: 'global', unique: true },
    playlistStartedAt: { type: Date, default: () => new Date() },
  },
  { timestamps: true }
);

export default mongoose.models.RadioState
  || mongoose.model('RadioState', radioStateSchema);