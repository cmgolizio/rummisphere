"use client";

import { create } from "zustand";

import { validateBoard } from "../lib/rummiRules";
import { BOARD_COLS, BOARD_ROWS, createEmptyBoard } from "../lib/gameSetup";

const createValidationState = () => ({
  ok: true,
  issues: [],
  invalidCells: new Set(),
});

const createInitialState = () => ({
  BOARD_ROWS,
  BOARD_COLS,
  board: createEmptyBoard(),
  tiles: {},
  trayOrder: [],
  dragMeta: null,
  validation: createValidationState(),
});

const useGameStore = create((set, get) => ({
  ...createInitialState(),

  resetState: () => set(createInitialState()),

  loadState: ({ board, tiles, trayOrder } = {}) => {
    set(() => {
      const normalizedBoard = Array.isArray(board) && board.length > 0
        ? board.map((row) =>
            Array.isArray(row)
              ? row.map((cell) => ({ tileId: cell?.tileId ?? null }))
              : Array.from({ length: BOARD_COLS }, () => ({ tileId: null }))
          )
        : createEmptyBoard();

      const normalizedTiles = {};
      if (tiles && typeof tiles === "object") {
        Object.keys(tiles).forEach((id) => {
          const tile = tiles[id];
          if (!tile) return;
          normalizedTiles[id] = {
            id,
            color: tile.color,
            value: tile.value,
            isJoker: Boolean(tile.isJoker),
            location: tile.location ?? { type: "tray" },
          };
        });
      }

      normalizedBoard.forEach((row, r) => {
        row.forEach((cell, c) => {
          if (!cell.tileId) return;
          const existing = normalizedTiles[cell.tileId] ?? {
            id: cell.tileId,
            color: "red",
            value: 0,
            isJoker: false,
          };
          normalizedTiles[cell.tileId] = {
            ...existing,
            location: { type: "board", row: r, col: c },
          };
        });
      });

      const dedupTray = [];
      const seen = new Set();
      const providedTray = Array.isArray(trayOrder) ? trayOrder : [];

      providedTray.forEach((id) => {
        if (!normalizedTiles[id] || seen.has(id)) return;
        if (normalizedTiles[id].location?.type !== "board") {
          normalizedTiles[id] = {
            ...normalizedTiles[id],
            location: { type: "tray" },
          };
        }
        dedupTray.push(id);
        seen.add(id);
      });

      Object.keys(normalizedTiles).forEach((id) => {
        const tile = normalizedTiles[id];
        if (tile.location?.type === "tray" && !seen.has(id)) {
          dedupTray.push(id);
          seen.add(id);
        }
      });

      return {
        board: normalizedBoard,
        tiles: normalizedTiles,
        trayOrder: dedupTray,
        dragMeta: null,
        validation: createValidationState(),
      };
    });
  },

  setDragMeta: (meta) => set({ dragMeta: meta }),

  ensureCellEmpty: (r, c) => {
    const board = get().board;
    return Boolean(board[r]) && Boolean(board[r][c]) && board[r][c].tileId === null;
  },

  moveTileToCell: (tileId, r, c) => {
    set((state) => {
      const { board, tiles, trayOrder } = state;
      if (!tiles[tileId] || !board[r] || !board[r][c]) return {};

      const newBoard = [...board];
      const currentTile = tiles[tileId];

      if (currentTile.location?.type === "board") {
        const prevRowIndex = currentTile.location.row;
        const prevColIndex = currentTile.location.col;
        if (newBoard[prevRowIndex]) {
          const prevRow = [...newBoard[prevRowIndex]];
          prevRow[prevColIndex] = { tileId: null };
          newBoard[prevRowIndex] = prevRow;
        }
      }

      const targetRow = [...newBoard[r]];
      targetRow[c] = { tileId };
      newBoard[r] = targetRow;

      const newTiles = {
        ...tiles,
        [tileId]: {
          ...currentTile,
          location: { type: "board", row: r, col: c },
        },
      };

      const newTray = trayOrder.includes(tileId)
        ? trayOrder.filter((id) => id !== tileId)
        : trayOrder;

      return { board: newBoard, tiles: newTiles, trayOrder: newTray };
    });
  },

  moveTileToTray: (tileId) => {
    set((state) => {
      const { board, tiles, trayOrder } = state;
      if (!tiles[tileId]) return {};

      const newBoard = board.map((row) =>
        row.map((cell) => (cell.tileId === tileId ? { tileId: null } : cell))
      );

      const newTiles = {
        ...tiles,
        [tileId]: {
          ...tiles[tileId],
          location: { type: "tray" },
        },
      };

      const seen = new Set();
      const filtered = trayOrder.filter((id) => {
        if (id === tileId) return false;
        if (seen.has(id)) return false;
        seen.add(id);
        return true;
      });
      filtered.push(tileId);

      return { board: newBoard, tiles: newTiles, trayOrder: filtered };
    });
  },

  placeBatch: (placements) => {
    set((state) => {
      const { board, tiles, trayOrder } = state;
      const newBoard = [...board];
      const newTiles = { ...tiles };

      placements.forEach(({ id }) => {
        const loc = newTiles[id]?.location;
        if (loc?.type === "board" && newBoard[loc.row]) {
          const rowClone = [...newBoard[loc.row]];
          rowClone[loc.col] = { tileId: null };
          newBoard[loc.row] = rowClone;
        }
      });

      placements.forEach((placement) => {
        const rowClone = [...newBoard[placement.row]];
        rowClone[placement.col] = { tileId: placement.id };
        newBoard[placement.row] = rowClone;

        newTiles[placement.id] = {
          ...newTiles[placement.id],
          location: { type: "board", row: placement.row, col: placement.col },
        };
      });

      const movedIds = new Set(placements.map((p) => p.id));
      const newTray = trayOrder.filter((id) => !movedIds.has(id));

      return { board: newBoard, tiles: newTiles, trayOrder: newTray };
    });
  },

  runValidation: () => {
    const { board, tiles } = get();
    const result = validateBoard(board, tiles);
    set({ validation: result });
    return result;
  },
}));

export default useGameStore;
