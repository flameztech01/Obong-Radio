// frontend/src/services/socket.js
import { io } from "socket.io-client";

// Use the env variable, or fallback to the proxy
const SOCKET_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8080';

export const socket = io(SOCKET_URL, {
  withCredentials: true, 
  autoConnect: true,     
  reconnectionAttempts: 5, 
});