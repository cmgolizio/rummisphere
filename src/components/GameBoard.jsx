"use client";

import useGameStore from "../store/gameStore";
import DroppableCell from "./DroppableCell";
import DraggableTile from "./DraggableTile";

export default function GameBoard() {
  const { BOARD_ROWS, BOARD_COLS, board, tiles, validation, dragMeta } =
    useGameStore();

  // During group drag, optionally dim the group's tiles on the board (so they don’t look duplicated)
  const dimIds = new Set(
    dragMeta?.type === "group" ? dragMeta.group?.ids ?? [] : []
  );

  return (
    <div className='relative rounded-lg border bg-white shadow-sm p-2'>
      <div
        className='grid gap-1'
        style={{ gridTemplateColumns: `repeat(${BOARD_COLS}, minmax(0, 1fr))` }}
      >
        {Array.from({ length: BOARD_ROWS }).map((_, r) =>
          Array.from({ length: BOARD_COLS }).map((_, c) => {
            const cellId = `cell-${r}-${c}`;
            const tid = board[r][c].tileId;
            const invalid = validation.invalidCells.has(`${r}:${c}`);

            return (
              <DroppableCell key={cellId} id={cellId} invalid={invalid}>
                {tid ? (
                  <div className={dimIds.has(tid) ? "opacity-40" : ""}>
                    <DraggableTile tile={tiles[tid]} />
                  </div>
                ) : null}
              </DroppableCell>
            );
          })
        )}
      </div>
    </div>
  );
}
