// controllers/livekitWebhookController.js
import { WebhookReceiver } from "livekit-server-sdk";
import RadioSession from "../models/radioSessionModel.js";
import { getIO } from "../socket.js";

const receiver = new WebhookReceiver(
  process.env.LIVEKIT_API_KEY,
  process.env.LIVEKIT_API_SECRET
);

export const handleLiveKitWebhook = async (req, res) => {
  try {
    const event = await receiver.receive(req.body, req.get("Authorization"));

    // When a room finishes (Admin disconnects or ends the session)
    if (event.event === "room_finished") {
      const roomName = event.room.name;
      
      // 1. Mark the active session as ended
      const endedSession = await RadioSession.findOneAndUpdate(
        { status: "live" },
        { status: "ended", endedAt: new Date() },
        { new: true }
      );

      // 2. Tell all connected clients (via Socket.io) to switch to Music Mode
      if (endedSession) {
        const io = getIO();
        io.emit("radio_session_ended", { 
          message: "The live session has ended. Switching to Music Mode." 
        });
      }
    }

    return res.status(200).send("OK");
  } catch (err) {
    console.error("LiveKit Webhook Error:", err);
    return res.status(400).send("Invalid webhook signature");
  }
};