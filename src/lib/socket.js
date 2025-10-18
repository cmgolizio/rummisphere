// import { io } from "socket.io-client";

// let socket;

// export const getSocket = () => {
//   if (!socket) socket = io("http://localhost:3001"); // adjust origin in prod
//   return socket;
// };
import { io } from "socket.io-client";

// Point to your local socket server
const socket = io("http://localhost:3001", {
  transports: ["websocket"],
  autoConnect: false,
});

export default socket;
