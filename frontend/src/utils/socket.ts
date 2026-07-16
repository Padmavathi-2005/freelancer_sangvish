import { io, Socket } from "socket.io-client";
import { API_BASE_URL } from "@/config/api";

let socket: Socket | null = null;

export const initSocket = (userId: string | number): Socket => {
  if (!socket) {
    socket = io(API_BASE_URL, {
      query: { userId: userId.toString() },
      autoConnect: true,
      transports: ["websocket", "polling"]
    });
    console.log("🔌 Socket.io connection initialized for user:", userId, "on URL:", API_BASE_URL);
  }
  return socket;
};

export const getSocket = (): Socket | null => {
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
    console.log("🔌 Socket.io connection closed.");
  }
};
