// "use client";

// import useGameStore from "../store/gameStore";
// import DroppableCell from "./DroppableCell";
// import DraggableTile from "./DraggableTile";

// export default function GameBoard() {
//   const { BOARD_ROWS, BOARD_COLS, board, tiles, validation, dragMeta } =
//     useGameStore();

//   // During group drag, optionally dim the group's tiles on the board (so they don’t look duplicated)
//   const dimIds = new Set(
//     dragMeta?.type === "group" ? dragMeta.group?.ids ?? [] : []
//   );

//   return (
//     <div className='relative rounded-lg border bg-white shadow-sm p-2'>
//       <div
//         className='grid gap-1'
//         style={{ gridTemplateColumns: `repeat(${BOARD_COLS}, minmax(0, 1fr))` }}
//       >
//         {Array.from({ length: BOARD_ROWS }).map((_, r) =>
//           Array.from({ length: BOARD_COLS }).map((_, c) => {
//             const cellId = `cell-${r}-${c}`;
//             const tid = board[r][c].tileId;
//             const invalid = validation.invalidCells.has(`${r}:${c}`);

//             return (
//               <DroppableCell key={cellId} id={cellId} invalid={invalid}>
//                 {tid ? (
//                   <div className={dimIds.has(tid) ? "opacity-40" : ""}>
//                     <DraggableTile tile={tiles[tid]} />
//                   </div>
//                 ) : null}
//               </DroppableCell>
//             );
//           })
//         )}
//       </div>
//     </div>
//   );
// }
"use client";

import React from "react";
import useGameStore from "../store/gameStore";
import DroppableCell from "./DroppableCell";
import DraggableTile from "./DraggableTile";

export default function GameBoard() {
  const { BOARD_ROWS, BOARD_COLS } = useGameStore();

  return (
    <div className='relative rounded-lg border bg-white shadow-sm p-2'>
      <div
        className='grid gap-1'
        style={{ gridTemplateColumns: `repeat(${BOARD_COLS}, minmax(0, 1fr))` }}
      >
        {Array.from({ length: BOARD_ROWS }).map((_, r) => (
          <MemoizedRow key={r} row={r} />
        ))}
      </div>
    </div>
  );
}

const MemoizedRow = React.memo(function Row({ row }) {
  const board = useGameStore((s) => s.board[row]); // select only this row
  const tiles = useGameStore((s) => s.tiles);
  const invalidCells = useGameStore((s) => s.validation.invalidCells);

  return (
    <>
      {board.map((cell, c) => {
        const tid = cell.tileId;
        return (
          <MemoizedCell
            key={`${row}-${c}`}
            r={row}
            c={c}
            tile={tid ? tiles[tid] : null}
            invalid={invalidCells.has(`${row}:${c}`)}
          />
        );
      })}
    </>
  );
});

const MemoizedCell = React.memo(function Cell({ r, c, tile, invalid }) {
  return (
    <DroppableCell id={`cell-${r}-${c}`} invalid={invalid}>
      {tile && <DraggableTile tile={tile} />}
    </DroppableCell>
  );
});
