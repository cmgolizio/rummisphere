// Check if a set is a valid Rummikub set or run
export function isValidSet(set) {
  if (!set || set.length < 3) return false;

  const numbers = set.map((t) => (t.is_joker ? null : t.number));
  const colors = set.map((t) => t.color);

  // Joker counts
  const jokerCount = set.filter((t) => t.is_joker).length;

  // Check for same number, different colors (group)
  const uniqueNumbers = new Set(numbers.filter((n) => n !== null));
  const uniqueColors = new Set(colors.filter((c) => c !== null));
  if (
    uniqueNumbers.size === 1 &&
    uniqueColors.size + jokerCount === set.length
  ) {
    return true;
  }

  // Check for run (consecutive numbers, same color)
  const colorSet = new Set(colors.filter((c) => c !== null));
  if (colorSet.size === 1) {
    const sortedNumbers = numbers
      .filter((n) => n !== null)
      .sort((a, b) => a - b);
    for (let i = 1; i < sortedNumbers.length; i++) {
      if (sortedNumbers[i] !== sortedNumbers[i - 1] + 1) {
        // Allow jokers to fill gaps
        if (jokerCount > 0) continue;
        return false;
      }
    }
    return true;
  }

  return false;
}

// Check entire board
export function isValidBoard(board) {
  return board.every((set) => isValidSet(set));
}

// Calculate total points of tiles (ignore jokers for simplicity)
export function calculateSetPoints(set) {
  return set.reduce((sum, tile) => sum + (tile.is_joker ? 0 : tile.number), 0);
}

// Check initial meld meets 30 points
export function isValidInitialMeld(board, initialMeldDone) {
  if (initialMeldDone) return true; // Already done in previous turns

  const pointsThisTurn = board.reduce((total, set) => {
    return total + calculateSetPoints(set);
  }, 0);

  return pointsThisTurn >= 30;
}
