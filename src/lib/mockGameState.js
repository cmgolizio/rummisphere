import { createEmptyBoard } from "./gameSetup";

function makeTile(color, value, suffix, location) {
  return {
    id: `mock-${color}-${value}-${suffix}`,
    color,
    value,
    isJoker: color === "joker",
    location,
  };
}

export function generateMockGameState() {
  const board = createEmptyBoard();
  const tiles = {};
  const trayOrder = [];

  const boardPlacements = [
    { color: "red", value: 3, row: 0, col: 0 },
    { color: "red", value: 4, row: 0, col: 1 },
    { color: "red", value: 5, row: 0, col: 2 },
    { color: "blue", value: 7, row: 1, col: 0 },
    { color: "yellow", value: 7, row: 1, col: 1 },
    { color: "black", value: 7, row: 1, col: 2 },
  ];

  boardPlacements.forEach((placement, idx) => {
    const tile = makeTile(placement.color, placement.value, `board-${idx}`, {
      type: "board",
      row: placement.row,
      col: placement.col,
    });
    board[placement.row][placement.col] = { tileId: tile.id };
    tiles[tile.id] = tile;
  });

  const traySeed = [
    { color: "yellow", value: 1 },
    { color: "yellow", value: 2 },
    { color: "yellow", value: 3 },
    { color: "blue", value: 10 },
    { color: "blue", value: 11 },
    { color: "black", value: 6 },
    { color: "black", value: 8 },
    { color: "red", value: 8 },
    { color: "red", value: 9 },
    { color: "red", value: 10 },
    { color: "blue", value: 2 },
    { color: "black", value: 12 },
    { color: "yellow", value: 5 },
    { color: "joker", value: 0 },
  ];

  traySeed.forEach((seed, idx) => {
    const tile = makeTile(seed.color, seed.value, `tray-${idx}`, {
      type: "tray",
    });
    tiles[tile.id] = tile;
    trayOrder.push(tile.id);
  });

  return {
    board,
    tiles,
    trayOrder,
    players: [
      { id: "mock-player", name: "You" },
      { id: "mock-ai", name: "AI Opponent" },
    ],
    currentTurn: 0,
  };
}
