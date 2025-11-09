import { createServer } from "http";
import { Server } from "socket.io";

import {
  createEmptyBoard,
  createTileDeck,
} from "./src/lib/gameSetup.js";
import { validateBoard } from "./src/lib/rummiRules.js";

const httpServer = createServer();
const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});

const waitingPlayers = [];
const games = new Map();

function createTilesState() {
  const deckObjects = createTileDeck();
  const tiles = {};
  const deck = deckObjects.map((tile) => {
    tiles[tile.id] = {
      id: tile.id,
      color: tile.color,
      value: tile.value,
      isJoker: tile.isJoker,
      owner: null,
      location: { type: "pool" },
    };
    return tile.id;
  });
  return { deck, tiles };
}

function dealTiles(game, playerId, count = 14) {
  const tray = [];
  for (let i = 0; i < count && game.deck.length > 0; i += 1) {
    const tileId = game.deck.pop();
    const tile = game.tiles[tileId];
    if (!tile) continue;
    tile.owner = playerId;
    tile.location = { type: "tray", owner: playerId };
    tray.push(tileId);
  }
  game.trays[playerId] = tray;
}

function cloneBoard(board) {
  return board.map((row) => row.map((cell) => ({ tileId: cell.tileId ?? null })));
}

function buildVisibleTiles(game, playerId) {
  const visibleIds = new Set();
  game.board.forEach((row) =>
    row.forEach((cell) => {
      if (cell.tileId) visibleIds.add(cell.tileId);
    })
  );
  (game.trays[playerId] ?? []).forEach((id) => visibleIds.add(id));

  const result = {};
  visibleIds.forEach((id) => {
    const tile = game.tiles[id];
    if (!tile) return;
    const location = tile.location?.type === "board"
      ? { type: "board", row: tile.location.row, col: tile.location.col }
      : { type: "tray" };
    result[id] = {
      id: tile.id,
      color: tile.color,
      value: tile.value,
      isJoker: tile.isJoker,
      location,
    };
  });

  return result;
}

function normalizeIncomingBoard(game, incomingBoard) {
  const template = game.board.length ? game.board : createEmptyBoard();
  return template.map((row, r) =>
    row.map((_, c) => {
      const tileId = incomingBoard?.[r]?.[c]?.tileId;
      return { tileId: tileId ? String(tileId) : null };
    })
  );
}

function sendStateToPlayer(game, playerId, event, extras = {}) {
  const socket = io.sockets.sockets.get(playerId);
  if (!socket) return;

  const payload = {
    roomId: game.roomId,
    board: cloneBoard(game.board),
    tiles: buildVisibleTiles(game, playerId),
    trayOrder: [...(game.trays[playerId] ?? [])],
    players: game.players.map((player) => ({
      id: player.id,
      name: player.name,
      username: player.name,
      connected: player.connected,
    })),
    currentTurn: game.currentTurn,
    playerId,
    isYourTurn: game.players[game.currentTurn]?.id === playerId,
    ...extras,
  };

  socket.emit(event, payload);
}

function createGame(roomId, players) {
  const { deck, tiles } = createTilesState();
  const board = createEmptyBoard();

  const game = {
    roomId,
    players: players.map((player) => ({
      id: player.socket.id,
      name: player.username,
      connected: true,
    })),
    board,
    tiles,
    deck,
    trays: {},
    currentTurn: 0,
  };

  players.forEach(({ socket, username }) => {
    dealTiles(game, socket.id);
    socket.join(roomId);
    socket.emit("match_found", { roomId });
  });

  games.set(roomId, game);

  game.players.forEach((player) => {
    sendStateToPlayer(game, player.id, "game_start", {
      message: "Game ready!",
    });
  });

  const currentPlayer = game.players[game.currentTurn];
  if (currentPlayer) {
    const turnSocket = io.sockets.sockets.get(currentPlayer.id);
    if (turnSocket) turnSocket.emit("your_turn");
  }
}

function pairPlayers() {
  while (waitingPlayers.length >= 2) {
    const playerA = waitingPlayers.shift();
    const playerB = waitingPlayers.shift();
    if (!playerA || !playerB) break;

    const roomId = `room_${Math.random().toString(36).slice(2, 9)}`;
    createGame(roomId, [playerA, playerB]);
  }
}

io.on("connection", (socket) => {
  socket.on("join_queue", (rawUsername) => {
    const username = (rawUsername || "Guest").trim() || "Guest";
    socket.data.username = username;

    const existingIndex = waitingPlayers.findIndex(
      (p) => p.socket.id === socket.id
    );
    if (existingIndex !== -1) waitingPlayers.splice(existingIndex, 1);

    waitingPlayers.push({ socket, username });
    pairPlayers();
  });

  socket.on("request_state", ({ roomId }) => {
    const game = games.get(roomId);
    if (!game) return;
    if (!game.players.some((player) => player.id === socket.id)) return;
    sendStateToPlayer(game, socket.id, "game_update", {
      message: "State synchronised.",
    });
  });

  socket.on("player_move", ({ roomId, board, trayOrder }) => {
    const game = games.get(roomId);
    if (!game) return;

    const currentPlayer = game.players[game.currentTurn];
    if (!currentPlayer || currentPlayer.id !== socket.id) {
      socket.emit("invalid_move", { message: "Not your turn." });
      return;
    }

    const normalizedBoard = normalizeIncomingBoard(game, board);
    const boardTileIds = new Set();

    for (let r = 0; r < normalizedBoard.length; r += 1) {
      for (let c = 0; c < normalizedBoard[r].length; c += 1) {
        const tileId = normalizedBoard[r][c].tileId;
        if (!tileId) continue;
        const tile = game.tiles[tileId];
        if (!tile) {
          socket.emit("invalid_move", {
            message: "Unknown tile placed on board.",
          });
          return;
        }
        if (boardTileIds.has(tileId)) {
          socket.emit("invalid_move", {
            message: "Tile appears multiple times on board.",
          });
          return;
        }
        boardTileIds.add(tileId);
      }
    }

    const validation = validateBoard(normalizedBoard, game.tiles);
    if (!validation.ok) {
      socket.emit("invalid_move", {
        message: "Board validation failed.",
        issues: validation.issues,
      });
      return;
    }

    const trayIds = Array.isArray(trayOrder)
      ? trayOrder.map((id) => String(id))
      : [];

    const ownedIds = Object.values(game.tiles)
      .filter((tile) => tile.owner === socket.id)
      .map((tile) => tile.id);
    const ownedSet = new Set(ownedIds);

    for (const id of trayIds) {
      if (!ownedSet.has(id)) {
        socket.emit("invalid_move", {
          message: "Tray contains a tile you do not own.",
        });
        return;
      }
      if (boardTileIds.has(id)) {
        socket.emit("invalid_move", {
          message: "Tray references a tile already on the board.",
        });
        return;
      }
    }

    for (const id of ownedIds) {
      if (!boardTileIds.has(id) && !trayIds.includes(id)) {
        socket.emit("invalid_move", {
          message: "One of your tiles is missing from the submission.",
        });
        return;
      }
    }

    Object.values(game.tiles).forEach((tile) => {
      if (tile.location?.type === "board") {
        tile.location = { type: "pool" };
      }
    });

    normalizedBoard.forEach((row, r) => {
      row.forEach((cell, c) => {
        if (!cell.tileId) return;
        const tile = game.tiles[cell.tileId];
        if (!tile) return;
        tile.location = { type: "board", row: r, col: c };
      });
    });

    trayIds.forEach((id) => {
      const tile = game.tiles[id];
      if (!tile) return;
      tile.owner = socket.id;
      tile.location = { type: "tray", owner: socket.id };
    });

    game.trays[socket.id] = trayIds;
    game.board = normalizedBoard;

    game.currentTurn = (game.currentTurn + 1) % game.players.length;

    game.players.forEach((player) => {
      const extras = player.id === socket.id
        ? { message: "Move accepted." }
        : {};
      sendStateToPlayer(game, player.id, "game_update", extras);
    });

    const nextPlayer = game.players[game.currentTurn];
    if (nextPlayer) {
      const turnSocket = io.sockets.sockets.get(nextPlayer.id);
      if (turnSocket) turnSocket.emit("your_turn");
    }
  });

  socket.on("disconnect", () => {
    const waitingIndex = waitingPlayers.findIndex(
      (player) => player.socket.id === socket.id
    );
    if (waitingIndex !== -1) {
      waitingPlayers.splice(waitingIndex, 1);
    }

    games.forEach((game) => {
      const player = game.players.find((p) => p.id === socket.id);
      if (!player) return;
      player.connected = false;
      game.players
        .filter((p) => p.id !== socket.id)
        .forEach((p) => {
          sendStateToPlayer(game, p.id, "game_update", {
            message: `${player.name} disconnected.`,
          });
        });
    });
  });
});

const PORT = 3001;
httpServer.listen(PORT, () => {
  console.log(`🚀 Game server running on http://localhost:${PORT}`);
});
