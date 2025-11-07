// Utilities for Rummisphere: grouping, run/set logic, placement planning, validation

export const RUN_MIN = 3; // min tiles in a valid run (true run, scoring-valid)
export const SET_MIN = 3; // min tiles in a valid set
export const SET_MAX = 13; // max tiles in a valid set (your variant rules)

/** Get board cell ID */
export function getCellId(r, c) {
  return `cell-${r}-${c}`;
}

/** Returns {row, col} for a tile if placed on board, else null */
export function getTileBoardPos(tiles, tileId) {
  const t = tiles[tileId];
  if (!t || !t.location || t.location.type !== "board") return null;
  return { row: t.location.row, col: t.location.col };
}

/** Get contiguous occupied block on a given row that includes `col` */
export function getContiguousBlockOnRow(board, row, col) {
  if (!board[row] || !board[row][col] || !board[row][col].tileId) return null;
  let L = col;
  let R = col;
  while (L - 1 >= 0 && board[row][L - 1].tileId) L--;
  while (R + 1 < board[row].length && board[row][R + 1].tileId) R++;
  return { startCol: L, endCol: R };
}

/** Analyze a segment to determine if it's a valid RUN or SET */
export function analyzeSegment(board, tiles, row, startCol, endCol) {
  const cells = [];
  for (let c = startCol; c <= endCol; c++) {
    const id = board[row][c].tileId;
    if (!id) return { type: "invalid", reason: "gap", cells: [] };
    const t = tiles[id];
    cells.push({ id, row, col: c, color: t.color, value: t.value });
  }
  const len = cells.length;

  const color = cells[0].color;
  const sameColor = cells.every((x) => x.color === color);
  const values = cells.map((x) => x.value);
  const consecutive = values.every((v, i, arr) =>
    i === 0 ? true : v === arr[i - 1] + 1
  );
  const maybeRun = sameColor && consecutive && len >= RUN_MIN;

  const v0 = cells[0].value;
  const sameValue = cells.every((x) => x.value === v0);
  const distinctColors = new Set(cells.map((x) => x.color)).size === len;
  const maybeSet =
    sameValue && distinctColors && len >= SET_MIN && len <= SET_MAX;

  if (maybeRun) return { type: "run", cells, length: len };
  if (maybeSet) return { type: "set", cells, length: len };

  if (len < Math.min(RUN_MIN, SET_MIN)) {
    return { type: "invalid", reason: "too-short", cells };
  }

  return { type: "invalid", reason: "pattern", cells };
}

/** NEW: find same-color consecutive sequences length ≥ 2 (proto-runs) */
function getRunLikeSegments(board, tiles, row) {
  const segments = [];
  const cols = board[row].length;

  let c = 0;
  while (c < cols) {
    if (!board[row][c].tileId) {
      c++;
      continue;
    }
    let s = c;
    while (c + 1 < cols && board[row][c + 1].tileId) c++;
    const e = c;

    const cells = [];
    for (let cc = s; cc <= e; cc++) {
      const id = board[row][cc].tileId;
      const t = tiles[id];
      cells.push({ col: cc, color: t.color, value: t.value, id });
    }

    let block = [cells[0]];
    for (let i = 1; i < cells.length; i++) {
      if (cells[i].col === cells[i - 1].col + 1) {
        block.push(cells[i]);
      } else {
        maybeAddRunLike(block, segments);
        block = [cells[i]];
      }
    }
    maybeAddRunLike(block, segments);

    c++;
  }

  return segments;
}

function maybeAddRunLike(block, segments) {
  if (block.length < 2) return;
  const sameColor = block.every((x) => x.color === block[0].color);
  const strictlyInc = block.every((x, i, arr) =>
    i === 0 ? true : x.value === arr[i - 1].value + 1
  );
  if (sameColor && strictlyInc) {
    segments.push({
      startCol: block[0].col,
      endCol: block[block.length - 1].col,
      color: block[0].color,
      values: block.map((x) => x.value),
      length: block.length,
    });
  }
}

/** Public: get TRUE runs (length >= RUN_MIN) */
export function getRowRunsOnRow(board, tiles, row) {
  const segments = getRunLikeSegments(board, tiles, row);
  return segments.filter((s) => s.length >= RUN_MIN);
}

/** Grouping logic unchanged */
export function gatherGroupForTile(board, tiles, tileId) {
  const pos = getTileBoardPos(tiles, tileId);
  if (!pos)
    return {
      kind: "single",
      row: null,
      ids: [tileId],
      columns: null,
      anchorId: tileId,
    };

  const { row, col } = pos;
  const block = getContiguousBlockOnRow(board, row, col);
  if (!block)
    return {
      kind: "single",
      row,
      ids: [tileId],
      columns: [col],
      anchorId: tileId,
    };

  const a = analyzeSegment(board, tiles, row, block.startCol, block.endCol);
  if (a.type === "run" || a.type === "set") {
    const ids = a.cells.map((x) => x.id);
    const columns = a.cells.map((x) => x.col);
    return { kind: a.type, row, ids, columns, anchorId: tileId };
  }

  return {
    kind: "single",
    row,
    ids: [tileId],
    columns: [col],
    anchorId: tileId,
  };
}

/** Plan group drop unchanged */
export function planGroupDrop(board, tiles, group, dropRow, dropCol) {
  if (group.row !== null && dropRow !== group.row) {
    return { ok: false, reason: "must-stay-same-row" };
  }

  let anchorCol = null;
  if (group.row !== null) {
    const pos = getTileBoardPos(tiles, group.anchorId);
    if (!pos) return { ok: false, reason: "anchor-not-on-board" };
    anchorCol = pos.col;
  } else {
    if (group.ids.length > 1 && group.columns) {
      anchorCol = group.columns[group.ids.indexOf(group.anchorId)];
    } else {
      anchorCol = 0;
    }
  }

  const delta = dropCol - anchorCol;
  const placements = [];

  for (let i = 0; i < group.ids.length; i++) {
    const id = group.ids[i];
    const curr = getTileBoardPos(tiles, id);
    const fromCol = curr
      ? curr.col
      : group.columns
      ? group.columns[i]
      : dropCol;
    const targetRow = dropRow;
    const targetCol = fromCol + delta;

    if (targetRow < 0 || targetRow >= board.length)
      return { ok: false, reason: "oob-row" };
    if (targetCol < 0 || targetCol >= board[0].length)
      return { ok: false, reason: "oob-col" };

    placements.push({ id, row: targetRow, col: targetCol });
  }

  const groupCells = new Set();
  for (const id of group.ids) {
    const p = getTileBoardPos(tiles, id);
    if (p) groupCells.add(`${p.row}:${p.col}`);
  }

  for (const p of placements) {
    const occupiedId = board[p.row][p.col].tileId;
    const occupiedBySelf = occupiedId && group.ids.includes(occupiedId);
    if (occupiedId && !occupiedBySelf)
      return { ok: false, reason: "collision" };
  }

  return { ok: true, placements };
}

/**
 * SINGLE TILE DROP LOGIC:
 * - Auto-extend ONLY on true runs (>= RUN_MIN).
 * - NEXT: For proto-runs (length 2), enforce a gap unless tile logically belongs.
 */
export function handleDropWithRules({
  board,
  tiles,
  dropRow,
  dropCol,
  tileId,
}) {
  if (board[dropRow][dropCol].tileId) return { type: "tray" };
  const tile = tiles[tileId];

  const trueRuns = getRowRunsOnRow(board, tiles, dropRow);
  const protoRuns = getRunLikeSegments(board, tiles, dropRow);

  const touchingTrue = findTouchingSegment(trueRuns, dropCol);
  if (touchingTrue) {
    const leftVal = touchingTrue.values[0];
    const rightVal = touchingTrue.values[touchingTrue.values.length - 1];

    if (tile.color === touchingTrue.color) {
      if (tile.value === leftVal - 1 && dropCol === touchingTrue.startCol - 1)
        return { type: "place", row: dropRow, col: touchingTrue.startCol - 1 };
      if (tile.value === rightVal + 1 && dropCol === touchingTrue.endCol + 1)
        return { type: "place", row: dropRow, col: touchingTrue.endCol + 1 };
    }

    const gap =
      dropCol === touchingTrue.startCol - 1
        ? touchingTrue.startCol - 2
        : touchingTrue.endCol + 2;
    return safePlaceOrTray(board, dropRow, gap);
  }

  const touchingProto = findTouchingSegment(protoRuns, dropCol);
  if (touchingProto) {
    const leftVal = touchingProto.values[0];
    const rightVal = touchingProto.values[touchingProto.values.length - 1];

    const fits =
      tile.color === touchingProto.color &&
      ((tile.value === leftVal - 1 && dropCol === touchingProto.startCol - 1) ||
        (tile.value === rightVal + 1 && dropCol === touchingProto.endCol + 1));

    if (!fits) {
      const gap =
        dropCol === touchingProto.startCol - 1
          ? touchingProto.startCol - 2
          : touchingProto.endCol + 2;
      return safePlaceOrTray(board, dropRow, gap);
    }

    return { type: "place", row: dropRow, col: dropCol };
  }

  return { type: "place", row: dropRow, col: dropCol };
}

function findTouchingSegment(segments, col) {
  return segments.find(
    (s) =>
      col === s.startCol - 1 ||
      col === s.endCol + 1 ||
      (col >= s.startCol && col <= s.endCol)
  );
}

function safePlaceOrTray(board, row, col) {
  if (row < 0 || row >= board.length) return { type: "tray" };
  if (col < 0 || col >= board[0].length) return { type: "tray" };
  if (board[row][col].tileId) return { type: "tray" };
  return { type: "place", row, col };
}

/** Validation unchanged (based on true run/set rules) */
export function validateBoard(board, tiles) {
  const issues = [];
  const invalidCells = new Set();

  for (let r = 0; r < board.length; r++) {
    const cols = board[r].length;
    let c = 0;
    while (c < cols) {
      if (!board[r][c].tileId) {
        c++;
        continue;
      }
      let s = c;
      while (c + 1 < cols && board[r][c + 1].tileId) c++;
      const e = c;
      const a = analyzeSegment(board, tiles, r, s, e);

      if (a.type === "invalid") {
        issues.push({ row: r, startCol: s, endCol: e, reason: a.reason });
        for (let cc = s; cc <= e; cc++) invalidCells.add(`${r}:${cc}`);
      } else {
        if (a.type === "run" && a.length < RUN_MIN) {
          issues.push({
            row: r,
            startCol: s,
            endCol: e,
            reason: "too-short-run",
          });
          for (let cc = s; cc <= e; cc++) invalidCells.add(`${r}:${cc}`);
        }
        if (a.type === "set" && (a.length < SET_MIN || a.length > SET_MAX)) {
          issues.push({
            row: r,
            startCol: s,
            endCol: e,
            reason: "invalid-set-size",
          });
          for (let cc = s; cc <= e; cc++) invalidCells.add(`${r}:${cc}`);
        }
      }
      c++;
    }
  }

  return { ok: issues.length === 0, issues, invalidCells };
}
