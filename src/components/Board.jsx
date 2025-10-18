// "use client";

// import React, { useState, useRef } from "react";
// import {
//   DndContext,
//   closestCenter,
//   useSensor,
//   useSensors,
//   PointerSensor,
//   DragOverlay,
// } from "@dnd-kit/core";
// import { SortableContext } from "@dnd-kit/sortable";
// import { isValidBoard, isValidInitialMeld } from "@/utils/rummikubValidator";
// import DroppableSet from "./DroppableSet";
// import Tile from "./Tile";
// import { generateMockGameState } from "@/lib/mockGameState";

// const CELL_SIZE = 80;
// const SNAP_THRESHOLD = 30;

// const mockGameState = generateMockGameState();

// export default function Board({
//   board,
//   playerTiles,
//   setBoard,
//   setPlayerTiles,
//   submitMove,
//   initialMeldDone,
//   setInitialMeldDone,
// }) {
//   const [activeTile, setActiveTile] = useState(null);
//   const [draggingRun, setDraggingRun] = useState([]);

//   const prevBoardRef = useRef(board);
//   const prevTrayRef = useRef(playerTiles);
//   const sensors = useSensors(useSensor(PointerSensor));

//   // 🟢 --- Drag start ---
//   const handleDragStart = (event, run = []) => {
//     setActiveTile(event.active.id);
//     setDraggingRun(run);
//   };

//   // 🔵 --- Drag end ---
//   const handleDragEnd = (event) => {
//     const { active, over } = event;
//     if (!over) {
//       setActiveTile(null);
//       setDraggingRun([]);
//       return;
//     }

//     let newBoard = board.map((set) => [...set]);
//     let movingTiles = draggingRun.length ? draggingRun : [];

//     // Single tile move
//     if (movingTiles.length === 0) {
//       const tileIndex = playerTiles.findIndex((t) => t.id === active.id);
//       if (tileIndex === -1) return;

//       movingTiles = [playerTiles[tileIndex]];
//       setPlayerTiles((prev) => prev.filter((t) => t.id !== active.id));
//     } else {
//       // Remove multi-tile run from its set
//       newBoard = newBoard.map((set) =>
//         set.filter((tile) => !movingTiles.find((t) => t.id === tile.id))
//       );
//     }

//     // Drop target → existing set or new set
//     const destSetIndex = over.id.startsWith("set-")
//       ? parseInt(over.id.split("-")[1])
//       : newBoard.length;

//     if (!newBoard[destSetIndex]) newBoard[destSetIndex] = [];

//     // Determine grid-based position + adjacency logic
//     const placedTiles = movingTiles.map((tile) => {
//       // Default snapping
//       const snappedX = Math.round((tile.x ?? 0) / CELL_SIZE) * CELL_SIZE || 0;
//       const snappedY = Math.round((tile.y ?? 0) / CELL_SIZE) * CELL_SIZE || 0;

//       // Try to find an adjacent match on the same Y level
//       const neighbors = newBoard
//         .flat()
//         .filter((t) => Math.abs(t.y - snappedY) < SNAP_THRESHOLD);

//       let finalX = snappedX;
//       let finalY = snappedY;

//       for (const neighbor of neighbors) {
//         const closeX = Math.abs(neighbor.x - snappedX) < CELL_SIZE * 1.5;
//         const sequential =
//           neighbor.color === tile.color &&
//           Math.abs(neighbor.number - tile.number) === 1;

//         if (closeX && sequential) {
//           if (neighbor.number < tile.number) finalX = neighbor.x + CELL_SIZE;
//           else finalX = neighbor.x - CELL_SIZE;
//         } else if (closeX && !sequential) {
//           // enforce one cell spacing if not valid
//           finalX = neighbor.x + CELL_SIZE * 2;
//         }
//       }

//       return { ...tile, x: finalX, y: finalY };
//     });

//     newBoard[destSetIndex].push(...placedTiles);

//     // 🧩 Validate board
//     if (!isValidBoard(newBoard)) {
//       setBoard(prevBoardRef.current);
//       setPlayerTiles(prevTrayRef.current);
//     } else {
//       setBoard(newBoard);
//     }

//     setActiveTile(null);
//     setDraggingRun([]);
//   };

//   // 🟠 --- End turn ---
//   const handleEndTurn = async () => {
//     prevBoardRef.current = board.map((set) => [...set]);
//     prevTrayRef.current = [...playerTiles];

//     if (!isValidBoard(board) || !isValidInitialMeld(board, initialMeldDone)) {
//       setBoard(prevBoardRef.current);
//       setPlayerTiles(prevTrayRef.current);
//       return;
//     }

//     try {
//       await submitMove(board, []);
//       if (!initialMeldDone) setInitialMeldDone(true);
//     } catch {
//       setBoard(prevBoardRef.current);
//       setPlayerTiles(prevTrayRef.current);
//     }
//   };

//   return (
//     <DndContext
//       sensors={sensors}
//       collisionDetection={closestCenter}
//       onDragStart={handleDragStart}
//       onDragEnd={handleDragEnd}
//     >
//       <SortableContext items={board.flatMap((set) => set.map((t) => t.id))}>
//         <div
//           className='w-full min-h-[400px] bg-green-200 p-4 rounded-lg flex flex-wrap gap-2 border-2 border-green-300 shadow-inner relative'
//           style={{
//             backgroundImage:
//               "linear-gradient(to right, rgba(0,0,0,0.1) 1px, transparent 1px), linear-gradient(to bottom, rgba(0,0,0,0.1) 1px, transparent 1px)",
//             backgroundSize: `${CELL_SIZE}px ${CELL_SIZE}px`,
//           }}
//         >
//           {board.map((set, i) => (
//             <DroppableSet
//               key={i}
//               set={set}
//               setIndex={i}
//               onDragStart={handleDragStart}
//             />
//           ))}

//           {/* Area to create new sets */}
//           <div
//             id={`set-${board.length}`}
//             className='min-h-[60px] min-w-[60px] bg-green-100 rounded flex items-center justify-center text-sm text-gray-700 italic'
//           >
//             Drop tile here to create new set
//           </div>
//         </div>
//       </SortableContext>

//       <DragOverlay>
//         {activeTile && draggingRun.length > 0 ? (
//           draggingRun.map((tile) => <Tile key={tile.id} tile={tile} />)
//         ) : activeTile ? (
//           <Tile tile={playerTiles.find((t) => t.id === activeTile)} />
//         ) : null}
//       </DragOverlay>

//       <button
//         className='mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded shadow-md transition'
//         onClick={handleEndTurn}
//       >
//         End Turn
//       </button>
//     </DndContext>
//   );
// }
"use client";

import React, { useState, useRef } from "react";
import {
  DndContext,
  closestCenter,
  useSensor,
  useSensors,
  PointerSensor,
  DragOverlay,
} from "@dnd-kit/core";
import { SortableContext } from "@dnd-kit/sortable";

import { isValidBoard, isValidInitialMeld } from "@/utils/rummikubValidator";
import DroppableSet from "./DroppableSet";
import DraggableTile from "./DraggableTile";

const CELL_SIZE = 80;
const ROW_GAP = 16; // vertical gap between sets
const SNAP_THRESHOLD = 40;

export default function Board({
  board,
  playerTiles,
  setBoard,
  setPlayerTiles,
  submitMove,
  initialMeldDone,
  setInitialMeldDone,
}) {
  const [activeTile, setActiveTile] = useState(null);
  const [draggingRun, setDraggingRun] = useState([]);
  const prevBoardRef = useRef(board);
  const prevTrayRef = useRef(playerTiles);
  const sensors = useSensors(useSensor(PointerSensor));

  // --- Helpers --------------------------------------------------------------

  // map board (which is array of sets) to a display board where every tile has x,y
  // without mutating the original board objects
  const computeDisplayBoard = (inputBoard) =>
    inputBoard.map((set, setIndex) =>
      set.map((tile, tileIndex) => {
        // If the tile already has x/y (was placed previously), keep it.
        if (tile.x != null && tile.y != null) return { ...tile };
        // Default layout: tile index maps to x; setIndex maps to y
        return {
          ...tile,
          x: tileIndex * CELL_SIZE,
          y: setIndex * (CELL_SIZE + ROW_GAP),
        };
      })
    );

  // Checks whether tile logically fits next to neighbor (run or group)
  const isValidNeighbor = (tile, neighbor) => {
    // Group: same number, different colors (at least 3 in final validation)
    const isGroup =
      tile.number === neighbor.number && tile.color !== neighbor.color;
    // Run: same color, consecutive numbers
    const isRun =
      tile.color === neighbor.color &&
      Math.abs(tile.number - neighbor.number) === 1;
    return isGroup || isRun;
  };

  // Attach tile to beginning or end of set if it logically fits
  const placeTileInSet = (set, tile) => {
    // set is array of tiles (may or may not have x/y)
    if (!set || set.length === 0) {
      // empty set — put at index 0
      return { ...tile, x: 0, y: 0 };
    }

    // compute first and last (use existing x,y if available)
    const first = set[0];
    const last = set[set.length - 1];

    // preferred: attach to end if sequential with last
    if (isValidNeighbor(tile, last)) {
      // place to right of last
      return {
        ...tile,
        x: (last.x ?? (set.length - 1) * CELL_SIZE) + CELL_SIZE,
        y: last.y ?? 0,
      };
    }

    // else if sequential with first and should go before
    if (isValidNeighbor(tile, first)) {
      return {
        ...tile,
        x: (first.x ?? 0) - CELL_SIZE,
        y: first.y ?? 0,
      };
    }

    // else, cannot attach logically — place at end but keep a gap (2 * CELL_SIZE)
    return {
      ...tile,
      x: (last.x ?? (set.length - 1) * CELL_SIZE) + CELL_SIZE * 2,
      y: last.y ?? 0,
    };
  };

  // Compute absolute snapped position (snaps to grid aligned to board origin)
  const snapToGrid = (x, y, setIndex) => {
    const baseY = setIndex * (CELL_SIZE + ROW_GAP);
    const snappedX = Math.round(x / CELL_SIZE) * CELL_SIZE;
    const snappedY = Math.round((y - baseY) / CELL_SIZE) * CELL_SIZE + baseY;
    return { x: snappedX, y: snappedY };
  };

  // --- DnD handlers ---------------------------------------------------------

  const handleDragStart = (event, run = []) => {
    setActiveTile(event.active.id);
    setDraggingRun(run);
  };

  // const handleDragEnd = (event) => {
  //   const { active, over, delta } = event;

  //   // if dropped nowhere, cancel
  //   if (!over) {
  //     setActiveTile(null);
  //     setDraggingRun([]);
  //     return;
  //   }

  //   // snapshot prior state
  //   prevBoardRef.current = board.map((s) => s.map((t) => ({ ...t })));
  //   prevTrayRef.current = playerTiles.map((t) => ({ ...t }));

  //   let newBoard = board.map((set) => set.map((t) => ({ ...t })));
  //   let movingTiles = draggingRun.length
  //     ? draggingRun.map((t) => ({ ...t }))
  //     : [];

  //   // If movingTiles empty → single tile dragged from tray
  //   if (movingTiles.length === 0) {
  //     const tileIndex = playerTiles.findIndex((t) => t.id === active.id);
  //     if (tileIndex === -1) {
  //       setActiveTile(null);
  //       setDraggingRun([]);
  //       return;
  //     }
  //     movingTiles = [playerTiles[tileIndex]];
  //     // remove from tray (we'll persist newBoard state later)
  //     setPlayerTiles((prev) => prev.filter((t) => t.id !== active.id));
  //   } else {
  //     // If moving tiles came from board, remove them from their origin sets
  //     newBoard = newBoard.map((set) =>
  //       set.filter((tile) => !movingTiles.some((m) => m.id === tile.id))
  //     );
  //   }

  //   // Determine destination set index
  //   const destSetIndex =
  //     over.id && over.id.startsWith("set-")
  //       ? parseInt(over.id.split("-")[1])
  //       : newBoard.length;
  //   if (!newBoard[destSetIndex]) newBoard[destSetIndex] = [];

  //   // Compute display-ready board to evaluate neighbors
  //   const displayBoard = computeDisplayBoard(newBoard);
  //   const allExisting = displayBoard.flat();

  //   // For each moving tile, compute where to place it
  //   const placedTiles = movingTiles.map((tile, idx) => {
  //     // If tile already had x/y (moved on board) consider its previous x,y + delta
  //     const prevX = tile.x ?? 0;
  //     const prevY = tile.y ?? destSetIndex * (CELL_SIZE + ROW_GAP);
  //     // delta may be undefined for some DnD events; fallback to 0
  //     const dropX = prevX + (delta?.x ?? 0);
  //     const dropY = prevY + (delta?.y ?? 0);

  //     // Snap relative to target set row
  //     const { x: snappedX, y: snappedY } = snapToGrid(
  //       dropX,
  //       dropY,
  //       destSetIndex
  //     );

  //     // Find neighbors in same row (tolerance for y)
  //     const neighbors = allExisting.filter(
  //       (t) => Math.abs(t.y - snappedY) < SNAP_THRESHOLD
  //     );

  //     // Try to attach logically within the dest set
  //     let final = null;
  //     if (newBoard[destSetIndex].length > 0) {
  //       // attempt to place relative to this set's logical ends
  //       const candidatePlacement = placeTileInSet(newBoard[destSetIndex], tile);

  //       // candidatePlacement includes x,y relative to that set; candidatePlacement.y may be 0, so set proper y
  //       final = {
  //         ...tile,
  //         x: candidatePlacement.x,
  //         y: candidatePlacement.y || destSetIndex * (CELL_SIZE + ROW_GAP),
  //       };

  //       // validate that the candidate placement is either a logical attach or enforces gap
  //       // we check neighbors to ensure we're not overlapping an incompatible tile
  //       const touching = neighbors.some(
  //         (n) => Math.abs((n.x ?? 0) - final.x) <= CELL_SIZE * 0.9
  //       );
  //       if (!touching && neighbors.length > 0) {
  //         // If not touching but neighbors exist, move further away (spacing)
  //         final.x =
  //           (neighbors[0].x ?? 0) +
  //           (neighbors[0].x < final.x ? CELL_SIZE * 2 : -CELL_SIZE * 2);
  //       }
  //     } else {
  //       // empty set — snap to zero position
  //       final = { ...tile, x: snappedX, y: snappedY };
  //     }

  //     return final;
  //   });

  //   // push placed tiles into destination set
  //   newBoard[destSetIndex].push(...placedTiles);

  //   // Final validation using your validator
  //   if (!isValidBoard(newBoard)) {
  //     // revert
  //     setBoard(prevBoardRef.current);
  //     setPlayerTiles(prevTrayRef.current);
  //   } else {
  //     setBoard(newBoard);
  //   }

  //   setActiveTile(null);
  //   setDraggingRun([]);
  // };

  const handleDragEnd = (event) => {
    const { active, over, delta } = event;

    if (!over) {
      setActiveTile(null);
      setDraggingRun([]);
      return;
    }

    // snapshot prior state
    prevBoardRef.current = board.map((s) => s.map((t) => ({ ...t })));
    prevTrayRef.current = playerTiles.map((t) => ({ ...t }));

    let newBoard = board.map((set) => set.map((t) => ({ ...t })));
    let movingTiles = draggingRun.length
      ? draggingRun.map((t) => ({ ...t }))
      : [];

    // Single tile from tray
    if (movingTiles.length === 0) {
      const tileIndex = playerTiles.findIndex((t) => t.id === active.id);
      if (tileIndex === -1) {
        setActiveTile(null);
        setDraggingRun([]);
        return;
      }
      movingTiles = [playerTiles[tileIndex]];
      setPlayerTiles((prev) => prev.filter((t) => t.id !== active.id));
    } else {
      // Remove tiles from their original board sets
      newBoard = newBoard.map((set) =>
        set.filter((tile) => !movingTiles.some((m) => m.id === tile.id))
      );
    }

    // Determine target set
    const destSetIndex = over.id.startsWith("set-")
      ? parseInt(over.id.split("-")[1])
      : newBoard.length;

    if (!newBoard[destSetIndex]) newBoard[destSetIndex] = [];

    // --- Snap each moving tile ---
    const placedTiles = movingTiles.map((tile) => {
      // Calculate base position (snap to grid)
      const baseX = Math.round((tile.x ?? 0) / CELL_SIZE) * CELL_SIZE;
      const baseY = Math.round((tile.y ?? 0) / CELL_SIZE) * CELL_SIZE;

      // Get all tiles already on the board
      const allTiles = newBoard.flat();

      // Find nearby tiles on the same row
      const neighbors = allTiles.filter(
        (t) => Math.abs(t.y - baseY) < SNAP_THRESHOLD
      );

      let finalX = baseX;
      let finalY = baseY;
      let attached = false;

      for (const neighbor of neighbors) {
        const dx = neighbor.x - baseX;
        const closeX = Math.abs(dx) < CELL_SIZE * 1.5;

        const sameColor = tile.color === neighbor.color;
        const consecutiveNumber = Math.abs(tile.number - neighbor.number) === 1;
        const sameNumberDifferentColor =
          tile.number === neighbor.number && tile.color !== neighbor.color;

        if (
          closeX &&
          ((sameColor && consecutiveNumber) || sameNumberDifferentColor)
        ) {
          // Valid adjacency: snap next to neighbor
          finalX =
            neighbor.number < tile.number
              ? neighbor.x + CELL_SIZE
              : neighbor.x - CELL_SIZE;
          attached = true;
          break;
        }
      }

      if (!attached && neighbors.length > 0) {
        // Invalid adjacency → enforce at least one-cell gap
        const neighbor = neighbors[0];
        finalX =
          baseX < neighbor.x
            ? neighbor.x - CELL_SIZE * 2
            : neighbor.x + CELL_SIZE * 2;
      }

      return { ...tile, x: finalX, y: finalY };
    });

    newBoard[destSetIndex].push(...placedTiles);

    // Validate board
    if (!isValidBoard(newBoard)) {
      setBoard(prevBoardRef.current);
      setPlayerTiles(prevTrayRef.current);
    } else {
      setBoard(newBoard);
    }

    setActiveTile(null);
    setDraggingRun([]);
  };

  // --- End turn ------------------------------------------------------------
  const handleEndTurn = async () => {
    prevBoardRef.current = board.map((set) => set.map((t) => ({ ...t })));
    prevTrayRef.current = playerTiles.map((t) => ({ ...t }));

    if (!isValidBoard(board) || !isValidInitialMeld(board, initialMeldDone)) {
      setBoard(prevBoardRef.current);
      setPlayerTiles(prevTrayRef.current);
      return;
    }

    try {
      await submitMove(board, []);
      if (!initialMeldDone) setInitialMeldDone(true);
    } catch {
      setBoard(prevBoardRef.current);
      setPlayerTiles(prevTrayRef.current);
    }
  };

  // Compute displayBoard each render so tiles without x/y render in grid positions
  const displayBoard = computeDisplayBoard(board);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={board.flatMap((set) => set.map((t) => t.id))}>
        <div
          className='w-full min-h-[400px] bg-green-200 p-4 rounded-lg flex flex-wrap gap-2 border-2 border-green-300 shadow-inner relative'
          style={{
            backgroundImage:
              "linear-gradient(to right, rgba(0,0,0,0.06) 1px, transparent 1px), linear-gradient(to bottom, rgba(0,0,0,0.06) 1px, transparent 1px)",
            backgroundSize: `${CELL_SIZE}px ${CELL_SIZE}px`,
          }}
        >
          {/* Render sets visually; DroppableSet still handles drop target behavior and internal rendering */}
          {displayBoard.map((set, i) => (
            <DroppableSet
              key={i}
              set={set}
              setIndex={i}
              onDragStart={handleDragStart}
            />
          ))}

          {/* Area to create new sets */}
          <div
            id={`set-${displayBoard.length}`}
            className='min-h-[60px] min-w-[60px] bg-green-100 rounded flex items-center justify-center text-sm text-gray-700 italic'
          >
            Drop tile here to create new set
          </div>

          {/* Render absolute-positioned tiles for displayBoard (so placed tiles show at their x,y) */}
          {displayBoard.flat().map((tile) => (
            <DraggableTile key={tile.id} tile={tile} />
          ))}
        </div>
      </SortableContext>

      <DragOverlay>
        {activeTile && draggingRun.length > 0 ? (
          draggingRun.map((tile) => <DraggableTile key={tile.id} tile={tile} />)
        ) : activeTile ? (
          // show tray tile in overlay
          <DraggableTile
            tile={
              playerTiles.find((t) => t.id === activeTile) || {
                ...playerTiles[0],
              }
            }
          />
        ) : null}
      </DragOverlay>

      <button
        className='mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded shadow-md transition'
        onClick={handleEndTurn}
      >
        End Turn
      </button>
    </DndContext>
  );
}
