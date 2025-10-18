import { createServer } from "http";
import { Server } from "socket.io";
import {
  generateInitialBoard,
  generateInitialTiles,
} from "./src/lib/gameSetup.js";

const httpServer = createServer();
const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});

// --- Matchmaking Queue ---
let waitingPlayer = null;
const rooms = new Map();

io.on("connection", (socket) => {
  console.log(`🟢 New connection: ${socket.id}`);

  // --- Player joins matchmaking queue ---
  socket.on("join_queue", (username) => {
    socket.data.username = username;

    if (!waitingPlayer) {
      console.log(`${username} waiting for match...`);
      waitingPlayer = socket;
    } else {
      // Pair players
      const roomId = `room_${Math.random().toString(36).substring(2, 9)}`;
      const player1 = waitingPlayer;
      const player2 = socket;

      waitingPlayer = null;

      // Initialize game data
      const gameData = {
        roomId,
        players: [
          { id: player1.id, username: player1.data.username },
          { id: player2.id, username: player2.data.username },
        ],
        board: generateInitialBoard(),
        currentTurn: 0,
        playerTiles: {
          [player1.id]: generateInitialTiles(),
          [player2.id]: generateInitialTiles(),
        },
      };

      rooms.set(roomId, gameData);

      // Join both sockets to the room
      player1.join(roomId);
      player2.join(roomId);

      console.log(
        `🎮 Match started: ${player1.data.username} vs ${player2.data.username} (${roomId})`
      );

      // Notify both clients to navigate to room
      player1.emit("match_found", { roomId });
      player2.emit("match_found", { roomId });

      // Send initial game state
      io.to(roomId).emit("game_start", {
        board: gameData.board,
        players: gameData.players,
        currentTurn: gameData.currentTurn,
        yourTiles: gameData.playerTiles[socket.id],
      });
    }
  });

  // --- Handle player move ---
  socket.on("player_move", ({ roomId, newBoard, tilesUsedThisTurn }) => {
    const gameData = rooms.get(roomId);
    if (!gameData) return;

    const currentPlayer = gameData.players[gameData.currentTurn];
    if (socket.id !== currentPlayer.id) {
      socket.emit("invalid_move", { message: "Not your turn!" });
      return;
    }

    // TODO: validate move later (for now just broadcast)
    gameData.board = newBoard;

    io.to(roomId).emit("move_made", {
      board: gameData.board,
      playerTiles: gameData.playerTiles,
    });

    // Switch turn
    gameData.currentTurn = (gameData.currentTurn + 1) % gameData.players.length;
    const nextPlayer = gameData.players[gameData.currentTurn];
    io.to(nextPlayer.id).emit("your_turn");
  });

  socket.on("disconnect", () => {
    console.log(`🔴 Disconnected: ${socket.id}`);
    if (waitingPlayer && waitingPlayer.id === socket.id) {
      waitingPlayer = null;
    }
  });
});

const PORT = 3001;
httpServer.listen(PORT, () => {
  console.log(`🚀 Game server running on http://localhost:${PORT}`);
});
