// Lightweight in-memory persistence used in place of an actual Supabase
// integration. The API mirrors the async contract you would expect from
// Supabase, making it easy to swap out later without touching the rest of the
// codebase.

const gameStore = new Map();

export async function saveGameState(roomId, state) {
  const snapshot = JSON.parse(JSON.stringify(state));
  gameStore.set(roomId, snapshot);
  return snapshot;
}

export async function loadGameState(roomId) {
  const snapshot = gameStore.get(roomId);
  return snapshot ? JSON.parse(JSON.stringify(snapshot)) : null;
}

export async function deleteGameState(roomId) {
  gameStore.delete(roomId);
}

export function clearAllGameStates() {
  gameStore.clear();
}
