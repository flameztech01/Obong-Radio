// backend/socket.js
import { Server } from "socket.io";

let io;

export const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      // Allow the frontend to connect
      origin: [
        process.env.FRONTEND_URL || "http://localhost:2020",
        "http://127.0.0.1:2020"
      ],
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  const roomListeners = new Map();

  io.on("connection", (socket) => {
    console.log(`New socket connected: ${socket.id}`);

    socket.on("join_radio_room", (roomId) => {
      socket.join(roomId);
      const currentCount = roomListeners.get(roomId) || 0;
      roomListeners.set(roomId, currentCount + 1);
      io.to(roomId).emit("listener_count_update", roomListeners.get(roomId));
    });

    socket.on("send_radio_message", (data) => {
      io.to(data.roomId).emit("receive_radio_message", data);
    });

    socket.on("disconnect", () => {
      console.log(`Socket disconnected: ${socket.id}`);
      roomListeners.forEach((count, roomId) => {
        if (count > 0) {
          roomListeners.set(roomId, count - 1);
          io.to(roomId).emit("listener_count_update", roomListeners.get(roomId));
        }
      });
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) throw new Error("Socket.io not initialized!");
  return io;
};