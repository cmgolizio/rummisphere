"use client";

import { create } from "zustand";
import { validateBoard } from "../lib/rummiRules";

const BOARD_ROWS = 8;
const BOARD_COLS = 14;

const startTiles = [
  { id: "t1", color: "red", value: 5 },
  { id: "t2", color: "red", value: 6 },
  { id: "t3", color: "red", value: 7 },
  { id: "t4", color: "red", value: 9 },
  { id: "t5", color: "blue", value: 12 },
  { id: "t6", color: "black", value: 3 },
  { id: "t7", color: "yellow", value: 1 },
  { id: "t8", color: "yellow", value: 2 },
];

const emptyBoard = () =>
  Array.from({ length: BOARD_ROWS }, () =>
    Array.from({ length: BOARD_COLS }, () => ({ tileId: null }))
  );

const useGameStore = create((set, get) => ({
  BOARD_ROWS,
  BOARD_COLS,
  board: emptyBoard(),
  tiles: startTiles.reduce((acc, t) => {
    acc[t.id] = { ...t, location: { type: "tray" } };
    return acc;
  }, {}),
  trayOrder: startTiles.map((t) => t.id),

  // Drag meta (single or group)
  dragMeta: null, // {type: 'single'|'group', group:{ids,row,columns,anchorId,kind}}
  // Validation state
  validation: { ok: true, issues: [], invalidCells: new Set() },

  setDragMeta: (meta) => set({ dragMeta: meta }),

  ensureCellEmpty: (r, c) => {
    const b = get().board;
    return b[r] && b[r][c] && b[r][c].tileId === null;
  },

  // moveTileToCell: (tileId, r, c) => {
  //   set((state) => {
  //     const nextBoard = state.board.map((row) =>
  //       row.map((cell) => ({ ...cell }))
  //     );

  //     // remove tile from existing cell
  //     for (let i = 0; i < state.BOARD_ROWS; i++) {
  //       for (let j = 0; j < state.BOARD_COLS; j++) {
  //         if (nextBoard[i][j].tileId === tileId) nextBoard[i][j].tileId = null;
  //       }
  //     }

  //     nextBoard[r][c].tileId = tileId;

  //     const nextTiles = { ...state.tiles };
  //     nextTiles[tileId] = {
  //       ...nextTiles[tileId],
  //       location: { type: "board", row: r, col: c },
  //     };

  //     const nextTray = state.trayOrder.filter((id) => id !== tileId);

  //     return { board: nextBoard, tiles: nextTiles, trayOrder: nextTray };
  //   });
  // },
  moveTileToCell: (tileId, r, c) => {
    set((state) => {
      const board = state.board; // reference
      const tiles = state.tiles;

      // Clone only the affected rows (old row + new row)
      const newBoard = [...board];

      // 1) Remove tile from old cell (if it was on board)
      const oldLoc = tiles[tileId].location;
      if (oldLoc?.type === "board") {
        const oldRow = [...newBoard[oldLoc.row]];
        oldRow[oldLoc.col] = { tileId: null };
        newBoard[oldLoc.row] = oldRow;
      }

      // 2) Place tile in new cell
      const newRow = [...newBoard[r]];
      newRow[c] = { tileId };
      newBoard[r] = newRow;

      // 3) Update tile metadata
      const newTiles = {
        ...tiles,
        [tileId]: {
          ...tiles[tileId],
          location: { type: "board", row: r, col: c },
        },
      };

      // 4) Update tray order only if needed
      const newTray = state.trayOrder.includes(tileId)
        ? state.trayOrder.filter((id) => id !== tileId)
        : state.trayOrder;

      return { board: newBoard, tiles: newTiles, trayOrder: newTray };
    });
  },

  moveTileToTray: (tileId) => {
    set((state) => {
      const nextBoard = state.board.map((row) =>
        row.map((cell) =>
          cell.tileId === tileId ? { tileId: null } : { ...cell }
        )
      );

      const nextTiles = { ...state.tiles };
      nextTiles[tileId] = { ...nextTiles[tileId], location: { type: "tray" } };

      const nextTray = state.trayOrder.includes(tileId)
        ? state.trayOrder.slice()
        : [...state.trayOrder, tileId];

      return { board: nextBoard, tiles: nextTiles, trayOrder: nextTray };
    });
  },

  /** Batch-place multiple tiles at once (used for group placement) */
  // placeBatch: (placements) => {
  //   set((state) => {
  //     const nextBoard = state.board.map((row) =>
  //       row.map((cell) => ({ ...cell }))
  //     );
  //     const nextTiles = { ...state.tiles };

  //     // Clear any boards cells that will be re-occupied by these ids
  //     const ids = placements.map((p) => p.id);
  //     for (let i = 0; i < state.BOARD_ROWS; i++) {
  //       for (let j = 0; j < state.BOARD_COLS; j++) {
  //         if (nextBoard[i][j].tileId && ids.includes(nextBoard[i][j].tileId)) {
  //           nextBoard[i][j].tileId = null;
  //         }
  //       }
  //     }

  //     // Place all
  //     for (const p of placements) {
  //       nextBoard[p.row][p.col].tileId = p.id;
  //       nextTiles[p.id] = {
  //         ...nextTiles[p.id],
  //         location: { type: "board", row: p.row, col: p.col },
  //       };
  //     }

  //     const nextTray = state.trayOrder.filter((id) => !ids.includes(id));
  //     return { board: nextBoard, tiles: nextTiles, trayOrder: nextTray };
  //   });
  // },
  placeBatch: (placements) => {
    set((state) => {
      const board = state.board;
      const tiles = state.tiles;

      const newBoard = [...board];
      const newTiles = { ...tiles };

      // Clear old cells
      for (const { id } of placements) {
        const loc = newTiles[id].location;
        if (loc?.type === "board") {
          const rowClone = [...newBoard[loc.row]];
          rowClone[loc.col] = { tileId: null };
          newBoard[loc.row] = rowClone;
        }
      }

      // Place new cells
      for (const p of placements) {
        const rowClone = [...newBoard[p.row]];
        rowClone[p.col] = { tileId: p.id };
        newBoard[p.row] = rowClone;

        newTiles[p.id] = {
          ...newTiles[p.id],
          location: { type: "board", row: p.row, col: p.col },
        };
      }

      const movedIds = placements.map((p) => p.id);
      const newTray = state.trayOrder.filter((id) => !movedIds.includes(id));

      return { board: newBoard, tiles: newTiles, trayOrder: newTray };
    });
  },

  /** Validation */
  runValidation: () => {
    const { board, tiles } = get();
    const res = validateBoard(board, tiles);
    set({ validation: res });
    return res;
  },
}));

export default useGameStore;
