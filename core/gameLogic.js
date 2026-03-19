// =============================================================================
// M3 Core Game Logic
// Pure functions extracted from the tablet platform for testing.
// These functions have no React dependencies and operate only on plain data.
// =============================================================================

export const ROWS = 12;
export const COLS = 10;
export const TILE_TYPES = 6;
export const TILE_SIZE = 50;
export const TILE_GAP = 4;

// Bonus points per unused special at game end
export const SPECIAL_BONUS = { line: 100, bomb: 150, cross: 200, supernova: 300, hypernova: 500 };

// ---------------------------------------------------------------------------
// Multiplier
// ---------------------------------------------------------------------------

export const getMultiplier = (comboValue) => {
  if (comboValue === 0) return 1.0;
  if (comboValue === 1) return 1.5;
  if (comboValue === 2) return 2.0;
  if (comboValue === 3) return 2.5;
  if (comboValue === 4) return 3.0;
  if (comboValue === 5) return 3.5;
  if (comboValue >= 6) return 4.0 + (comboValue - 6) * 0.2;
  return 1.0;
};

// ---------------------------------------------------------------------------
// Match finding (simple — used by hasValidMoves)
// ---------------------------------------------------------------------------

export const findMatchesSimple = (grid) => {
  const matches = [];

  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS - 2; col++) {
      if (
        grid[row][col] && grid[row][col + 1] && grid[row][col + 2] &&
        grid[row][col].type === grid[row][col + 1].type &&
        grid[row][col].type === grid[row][col + 2].type
      ) {
        matches.push({ row, col });
      }
    }
  }

  for (let row = 0; row < ROWS - 2; row++) {
    for (let col = 0; col < COLS; col++) {
      if (
        grid[row][col] && grid[row + 1][col] && grid[row + 2][col] &&
        grid[row][col].type === grid[row + 1][col].type &&
        grid[row][col].type === grid[row + 2][col].type
      ) {
        matches.push({ row, col });
      }
    }
  }

  return matches;
};

// ---------------------------------------------------------------------------
// Valid move detection
// ---------------------------------------------------------------------------

export const hasValidMoves = (grid) => {
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      if (col < COLS - 1) {
        const testGrid = grid.map(r => r.map(t => t ? { ...t } : null));
        [testGrid[row][col], testGrid[row][col + 1]] = [testGrid[row][col + 1], testGrid[row][col]];
        if (findMatchesSimple(testGrid).length > 0) return true;
      }
      if (row < ROWS - 1) {
        const testGrid = grid.map(r => r.map(t => t ? { ...t } : null));
        [testGrid[row][col], testGrid[row + 1][col]] = [testGrid[row + 1][col], testGrid[row][col]];
        if (findMatchesSimple(testGrid).length > 0) return true;
      }
    }
  }
  return false;
};

// ---------------------------------------------------------------------------
// Full match finding (with match groups, L-shapes, connected groups)
// ---------------------------------------------------------------------------

export const findMatches = (currentGrid) => {
  const matches = [];
  const matchGroups = [];
  const visited = new Set();

  // Horizontal matches
  for (let row = 0; row < ROWS; row++) {
    let col = 0;
    while (col < COLS) {
      const tile = currentGrid[row][col];
      if (!tile) { col++; continue; }

      let matchLength = 1;
      while (col + matchLength < COLS &&
             currentGrid[row][col + matchLength]?.type === tile.type) {
        matchLength++;
      }

      if (matchLength >= 3) {
        const tiles = [];
        for (let i = 0; i < matchLength; i++) {
          tiles.push({ row, col: col + i });
          matches.push({ row, col: col + i });
          visited.add(`${row}-${col + i}`);
        }
        matchGroups.push({ tiles, length: matchLength, direction: 'horizontal', tileType: tile.type });
      }
      col += matchLength;
    }
  }

  // Vertical matches
  for (let col = 0; col < COLS; col++) {
    let row = 0;
    while (row < ROWS) {
      const tile = currentGrid[row][col];
      if (!tile) { row++; continue; }

      let matchLength = 1;
      while (row + matchLength < ROWS &&
             currentGrid[row + matchLength][col]?.type === tile.type) {
        matchLength++;
      }

      if (matchLength >= 3) {
        const tiles = [];
        for (let i = 0; i < matchLength; i++) {
          tiles.push({ row: row + i, col });
          if (!visited.has(`${row + i}-${col}`)) {
            matches.push({ row: row + i, col });
          }
        }
        matchGroups.push({ tiles, length: matchLength, direction: 'vertical', tileType: tile.type });
      }
      row += matchLength;
    }
  }

  // L-shapes (intersections of horizontal and vertical matches)
  const lShapeMatches = [];
  for (let i = 0; i < matchGroups.length; i++) {
    for (let j = i + 1; j < matchGroups.length; j++) {
      if (matchGroups[i].direction !== matchGroups[j].direction &&
          matchGroups[i].tileType === matchGroups[j].tileType) {
        const intersection = matchGroups[i].tiles.find(t1 =>
          matchGroups[j].tiles.some(t2 => t1.row === t2.row && t1.col === t2.col)
        );
        if (intersection) {
          const tileType = currentGrid[intersection.row][intersection.col]?.type;
          lShapeMatches.push({ ...intersection, tileType });
        }
      }
    }
  }

  // Connected match groups (determines special tile creation thresholds)
  const connectedGroups = [];
  const groupUsed = new Array(matchGroups.length).fill(false);

  for (let i = 0; i < matchGroups.length; i++) {
    if (groupUsed[i]) continue;

    const connectedTiles = new Set();
    const connectedGroupIndices = [i];
    const tileType = matchGroups[i].tileType;

    matchGroups[i].tiles.forEach(t => connectedTiles.add(`${t.row}-${t.col}`));
    groupUsed[i] = true;

    let foundNew = true;
    while (foundNew) {
      foundNew = false;
      for (let j = 0; j < matchGroups.length; j++) {
        if (groupUsed[j] || matchGroups[j].tileType !== tileType) continue;
        const shares = matchGroups[j].tiles.some(t => connectedTiles.has(`${t.row}-${t.col}`));
        if (shares) {
          matchGroups[j].tiles.forEach(t => connectedTiles.add(`${t.row}-${t.col}`));
          connectedGroupIndices.push(j);
          groupUsed[j] = true;
          foundNew = true;
        }
      }
    }

    const tilesArray = Array.from(connectedTiles).map(key => {
      const [row, col] = key.split('-').map(Number);
      return { row, col };
    });

    connectedGroups.push({
      tiles: tilesArray,
      totalUniqueTiles: tilesArray.length,
      tileType,
      groupIndices: connectedGroupIndices,
    });
  }

  return { matches, matchGroups, lShapeMatches, connectedGroups };
};

// ---------------------------------------------------------------------------
// Unused specials bonus (at game end)
// ---------------------------------------------------------------------------

export const calculateUnusedSpecialsBonus = (grid) => {
  let bonus = 0;
  const specials = { line: 0, bomb: 0, cross: 0, supernova: 0, hypernova: 0 };

  grid.forEach(row => {
    row.forEach(tile => {
      if (tile?.special) {
        specials[tile.special]++;
        bonus += SPECIAL_BONUS[tile.special] ?? 0;
      }
    });
  });

  return { bonus, specials };
};

// ---------------------------------------------------------------------------
// Grid helpers (for tests)
// ---------------------------------------------------------------------------

/** Create a blank ROWS×COLS grid filled with null */
export const makeEmptyGrid = () =>
  Array.from({ length: ROWS }, () => Array(COLS).fill(null));

/** Create a tile object with a given type (and optional special) */
export const makeTile = (type, special = null) => ({ type, special, id: `t-${Math.random()}` });
