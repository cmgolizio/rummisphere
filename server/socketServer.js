// const express = require("express");
// const http = require("http");
// const { Server } = require("socket.io");
// const {
//   placeTiles,
//   validateInitialMeld,
// } = require("./src/lib/rummikub/boardManager");

// const app = express();
// const server = http.createServer(app);
// const io = new Server(server, {
//   cors: { origin: "*" },
// });

// const PORT = 3001;

// // -------------------- In-Memory Data --------------------
// let waitingQueue = [];
// let rooms = {}; // { roomId: { players, board, tilesRemaining, currentTurn, playerTiles } }

// // -------------------- Helper Functions --------------------
// function generateTiles() {
//   const colors = ["red", "blue", "yellow", "black"];
//   let tiles = [];
//   for (let i = 1; i <= 13; i++) {
//     for (let color of colors) {
//       tiles.push({ color, number: i, id: `${color}-${i}-1` });
//       tiles.push({ color, number: i, id: `${color}-${i}-2` });
//     }
//   }
//   tiles.push({ color: null, number: 0, is_joker: true, id: "joker-1" });
//   tiles.push({ color: null, number: 0, is_joker: true, id: "joker-2" });
//   return shuffleArray(tiles);
// }

// function shuffleArray(array) {
//   for (let i = array.length - 1; i > 0; i--) {
//     const j = Math.floor(Math.random() * (i + 1));
//     [array[i], array[j]] = [array[j], array[i]];
//   }
//   return array;
// }

// // Get next player index
// function nextTurn(room) {
//   return (room.currentTurn + 1) % room.players.length;
// }

// // -------------------- Socket.io Events --------------------
// io.on("connection", (socket) => {
//   console.log(`Player connected: ${socket.id}`);

//   socket.on("join_queue", (username) => {
//     waitingQueue.push({ id: socket.id, username });
//     console.log(
//       `${username} joined queue. Queue length: ${waitingQueue.length}`
//     );
//     attemptMatchmaking();
//   });

//   socket.on(
//     "player_move",
//     ({ roomId, newBoard, tilesUsedThisTurn, initialMeld }) => {
//       const room = rooms[roomId];
//       if (!room) return;

//       const playerIndex = room.players.findIndex((p) => p.id === socket.id);
//       if (playerIndex !== room.currentTurn) return;

//       // Check initial meld if player hasn't played yet
//       if (initialMeld && !validateInitialMeld(tilesUsedThisTurn)) {
//         socket.emit("invalid_move", {
//           message: "Initial meld must be at least 30 points",
//         });
//         return;
//       }

//       // Validate rearranged board
//       const result = placeTiles(room.board, newBoard, tilesUsedThisTurn);
//       if (!result.success) {
//         socket.emit("invalid_move", { message: result.message });
//         return;
//       }

//       room.board = result.board;
//       // Remove tiles from player tray
//       room.playerTiles[socket.id] = room.playerTiles[socket.id].filter(
//         (t) => !tilesUsedThisTurn.find((pt) => pt.id === t.id)
//       );

//       io.to(roomId).emit("move_made", {
//         playerId: socket.id,
//         board: room.board,
//         playerTiles: room.playerTiles[socket.id],
//       });

//       room.currentTurn = (room.currentTurn + 1) % room.players.length;
//       const nextPlayer = room.players[room.currentTurn];
//       io.to(nextPlayer.id).emit("your_turn");
//     }
//   );

//   socket.on("disconnect", () => {
//     console.log(`Player disconnected: ${socket.id}`);
//     // TODO: Implement AI takeover logic
//   });
// });

// // -------------------- Matchmaking --------------------
// function attemptMatchmaking() {
//   while (waitingQueue.length >= 2) {
//     const numPlayers = Math.min(4, waitingQueue.length);
//     const players = waitingQueue.splice(0, numPlayers);

//     const roomId = `room-${Date.now()}`;
//     const tiles = generateTiles();

//     let playerTiles = {};
//     players.forEach((player) => {
//       playerTiles[player.id] = tiles.splice(0, 14);
//     });

//     rooms[roomId] = {
//       players,
//       board: [],
//       tilesRemaining: tiles,
//       currentTurn: 0,
//       playerTiles,
//     };

//     // Join sockets to room
//     players.forEach((player) => {
//       const socket = io.sockets.sockets.get(player.id);
//       if (socket) {
//         socket.join(roomId);
//         socket.emit("game_start", {
//           roomId,
//           yourTiles: playerTiles[player.id],
//           players: players.map((p) => ({ id: p.id, username: p.username })),
//           board: [],
//           currentTurn: 0,
//         });
//       }
//     });

//     console.log(`Room ${roomId} created with ${numPlayers} players`);
//   }
// }

// // -------------------- Start Server --------------------
// server.listen(PORT, () => {
//   console.log(`Socket.io server running on port ${PORT}`);
// });

import { Server } from "socket.io";
import { createServer } from "http";
import { setupNewGame, validateMove } from "../lib/gameServer";

const httpServer = createServer();
const io = new Server(httpServer, {
  cors: { origin: "*" }, // Adjust in production
});

const games = {}; // roomId -> game state

io.on("connection", (socket) => {
  console.log("Player connected", socket.id);

  socket.on("join_room", async ({ roomId, playerName }) => {
    socket.join(roomId);
    if (!games[roomId]) games[roomId] = setupNewGame();
    const game = games[roomId];

    // Persist updated game state
    await saveGameState(roomId, game);

    // Add player
    game.players.push({
      id: socket.id,
      name: playerName,
      tray: [],
      connected: true,
    });

    // Persist updated game state
    await saveGameState(roomId, game);

    io.to(roomId).emit("player_joined", game.players);
  });

  socket.on("player_move", async ({ roomId, newBoard }) => {
    const game = games[roomId];
    const validation = validateMove(game, socket.id, newBoard);

    if (validation.valid) {
      game.board = validation.updatedBoard;

      // Persist updated game state
      await saveGameState(roomId, game);

      io.to(roomId).emit("move_made", { board: game.board });
    } else {
      socket.emit("invalid_move", { reason: validation.reason });
    }
  });

  socket.on("disconnect", () => {
    // mark player disconnected, optionally trigger AI takeover
    Object.values(games).forEach(async (game) => {
      const player = game.players.find((p) => p.id === socket.id);
      if (player) player.connected = false;

      // Persist updated game state
      await saveGameState(game.roomId, game);
    });
  });
});

httpServer.listen(3001, () =>
  console.log("Socket.io server running on port 3001")
);
