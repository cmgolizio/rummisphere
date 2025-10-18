export function generateInitialBoard() {
  return []; // empty board to start
}

export function generateInitialTiles() {
  const colors = ["red", "blue", "black", "orange"];
  const tiles = [];
  for (let i = 1; i <= 13; i++) {
    for (const color of colors) {
      tiles.push({ id: `${color}-${i}-${Math.random()}`, color, value: i });
    }
  }
  // Pick 14 random tiles for the player
  const shuffled = tiles.sort(() => Math.random() - 0.5);
  return shuffled.slice(0, 14);
}
