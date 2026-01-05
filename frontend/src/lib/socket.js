// src/lib/socket.js
import { io } from "socket.io-client";

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_BASE || "http://localhost:4000";

let socket = null;

export function getSocket() {
  if (!socket) {
    socket = io(BACKEND, { transports: ["websocket"] });
  }
  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
