export const BOARD_ROWS = 8;
export const BOARD_COLS = 14;

export const TILE_COLORS = ["red", "blue", "yellow", "black"];
const COPIES_PER_TILE = 2;

function shuffleInPlace(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

export function createEmptyBoard(rows = BOARD_ROWS, cols = BOARD_COLS) {
  return Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => ({ tileId: null }))
  );
}

export function createTileDeck() {
  const tiles = [];

  TILE_COLORS.forEach((color) => {
    for (let value = 1; value <= 13; value += 1) {
      for (let copy = 1; copy <= COPIES_PER_TILE; copy += 1) {
        tiles.push({
          id: `${color}-${value}-${copy}`,
          color,
          value,
          isJoker: false,
        });
      }
    }
  });

  tiles.push({ id: "joker-1", color: "joker", value: 0, isJoker: true });
  tiles.push({ id: "joker-2", color: "joker", value: 0, isJoker: true });

  return shuffleInPlace(tiles);
}

export function drawTiles(deck, count) {
  const drawn = [];
  for (let i = 0; i < count && deck.length > 0; i += 1) {
    const tile = deck.pop();
    if (tile) drawn.push(tile);
  }
  return drawn;
}

export function generateInitialBoard() {
  return createEmptyBoard();
}

export function generateInitialTiles(count = 14) {
  const deck = createTileDeck();
  return {
    tiles: drawTiles(deck, count),
    remainingDeck: deck,
  };
}
