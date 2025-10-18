export function generateMockGameState() {
  const colors = ["red", "blue", "yellow", "black"];
  const tiles = [];

  // Generate random sample tiles for player tray
  for (let i = 0; i < 14; i++) {
    const color = colors[Math.floor(Math.random() * colors.length)];
    const number = Math.ceil(Math.random() * 13);
    tiles.push({ id: i, color, number });
  }

  return {
    board: [
      [
        { id: 101, color: "red", number: 3 },
        { id: 102, color: "red", number: 4 },
        { id: 103, color: "red", number: 5 },
      ],
      [
        { id: 104, color: "blue", number: 7 },
        { id: 105, color: "yellow", number: 7 },
        { id: 106, color: "black", number: 7 },
      ],
    ],
    playerTiles: tiles,
  };
}
