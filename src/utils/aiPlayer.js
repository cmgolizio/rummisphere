// Extremely lightweight AI helper that looks for the simplest possible move:
// extend an existing same-colour run by adding a tile to the right-hand side.
// The function returns either a placement plan or a `pass` indicator so the
// caller can decide how to proceed.

export function computeNaiveAiMove({ board, tiles, trayOrder }) {
  if (!board || !Array.isArray(board) || !tiles) {
    return { type: "pass", rationale: "No board state available." };
  }

  const trayIds = Array.isArray(trayOrder)
    ? trayOrder
    : Object.keys(tiles).filter((id) => tiles[id]?.location?.type === "tray");

  for (const tileId of trayIds) {
    const tile = tiles[tileId];
    if (!tile) continue;

    for (let row = 0; row < board.length; row += 1) {
      const rowCells = board[row];
      for (let col = 0; col < rowCells.length; col += 1) {
        const cell = rowCells[col];
        if (!cell.tileId) continue;
        const anchor = tiles[cell.tileId];
        if (!anchor) continue;

        if (anchor.color === tile.color && anchor.value === tile.value - 1) {
          const targetCol = col + 1;
          if (
            targetCol < rowCells.length &&
            !rowCells[targetCol].tileId
          ) {
            return {
              type: "place",
              placements: [{ id: tileId, row, col: targetCol }],
              rationale: `Extend the ${tile.color} run on row ${row + 1}.`,
            };
          }
        }
      }
    }
  }

  return { type: "pass", rationale: "No simple extension found." };
}
