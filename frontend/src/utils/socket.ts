import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

export const initSocket = (userId: string | number): Socket => {
  if (!socket) {
    socket = io("https://freelancer.sangvish.com", {
      query: { userId: userId.toString() },
      autoConnect: true,
      transports: ["websocket", "polling"]
    });
    console.log("🔌 Socket.io connection initialized for user:", userId);
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
