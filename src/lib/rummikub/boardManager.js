// Board manager & move validator for Rummikub
// State format:
// board = [
//   [ {color, number, id, is_joker}, ... ], // a set or run
//   ...
// ]

// Board manager & move validator for Rummikub

// Clone board helper
function cloneBoard(board) {
  return board.map((set) => set.map((tile) => ({ ...tile })));
}

// -------------------- Validation Helpers --------------------

// Check if a set is valid (same number, different colors)
function isValidSet(tiles) {
  if (tiles.length < 3 || tiles.length > 4) return false;

  const numbers = tiles.map((t) => t.number);
  const uniqueNumbers = new Set(numbers.filter((n) => n !== 0));
  if (uniqueNumbers.size !== 1 && !tiles.some((t) => t.is_joker)) return false;

  const colors = tiles.map((t) => t.color).filter((c) => c != null);
  const uniqueColors = new Set(colors);

  return (
    uniqueColors.size === tiles.length - tiles.filter((t) => t.is_joker).length
  );
}

// Check if a run is valid (consecutive numbers, same color)
function isValidRun(tiles) {
  if (tiles.length < 3) return false;

  const jokers = tiles.filter((t) => t.is_joker);
  const nonJokers = tiles.filter((t) => !t.is_joker);

  if (nonJokers.length === 0) return false;

  // All same color
  const color = nonJokers[0].color;
  if (!nonJokers.every((t) => t.color === color)) return false;

  // Sort numbers
  const numbers = nonJokers.map((t) => t.number).sort((a, b) => a - b);

  // Count gaps to see if jokers can fill them
  let gaps = 0;
  for (let i = 0; i < numbers.length - 1; i++) {
    gaps += numbers[i + 1] - numbers[i] - 1;
  }

  return gaps <= jokers.length;
}

// Validate a set/run
function validateTiles(tiles) {
  return isValidSet(tiles) || isValidRun(tiles);
}

// -------------------- Board Placement --------------------

// Place tiles or rearranged board during a turn
// newBoard is the proposed board after player rearrangement
function placeTiles(board, newBoard, tilesUsedThisTurn) {
  // Validate all sets in newBoard
  for (let set of newBoard) {
    if (!validateTiles(set)) {
      return { success: false, message: "Invalid set/run after rearrangement" };
    }
  }

  // Optional: check that all tiles in tilesUsedThisTurn came from player's tray
  // and/or previously on the board

  return { success: true, board: cloneBoard(newBoard) };
}

// -------------------- Initial Meld --------------------

// Calculate points (numbers sum, jokers = 30)
function calculateMeldPoints(tiles) {
  return tiles.reduce((sum, t) => sum + (t.is_joker ? 30 : t.number), 0);
}

// Check if initial meld meets ≥30 points
function validateInitialMeld(tiles) {
  return calculateMeldPoints(tiles) >= 30;
}

// Example usage
// let board = [];
// const tiles = [
//   { color: 'red', number: 3, id: 'red-3-1' },
//   { color: 'blue', number: 3, id: 'blue-3-1' },
//   { color: null, number: 0, is_joker: true, id: 'joker-1' }
// ];
// console.log(placeTiles(board, tiles));

// -------------------- Export --------------------
module.exports = {
  isValidSet,
  isValidRun,
  validateTiles,
  placeTiles,
  calculateMeldPoints,
  validateInitialMeld,
};
