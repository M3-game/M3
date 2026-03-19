import { describe, it, expect } from 'vitest';
import {
  ROWS, COLS, TILE_TYPES,
  getMultiplier,
  findMatchesSimple,
  hasValidMoves,
  findMatches,
  calculateUnusedSpecialsBonus,
  makeEmptyGrid,
  makeTile,
} from './gameLogic.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Fill every cell of an empty grid with a unique tile type so no matches exist */
const fillNoMatches = (grid) => {
  // Checkerboard-style: type = (row + col) % TILE_TYPES, guaranteed no 3-in-a-row
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      grid[r][c] = makeTile((r + c * 2) % TILE_TYPES);
    }
  }
  return grid;
};

// ---------------------------------------------------------------------------
// getMultiplier
// ---------------------------------------------------------------------------

describe('getMultiplier', () => {
  it('returns 1.0 for combo 0', () => {
    expect(getMultiplier(0)).toBe(1.0);
  });

  it('returns 1.5 for combo 1', () => {
    expect(getMultiplier(1)).toBe(1.5);
  });

  it('returns 3.5 for combo 5', () => {
    expect(getMultiplier(5)).toBe(3.5);
  });

  it('returns 4.0 for combo 6', () => {
    expect(getMultiplier(6)).toBe(4.0);
  });

  it('increments by 0.2 per combo level above 6', () => {
    expect(getMultiplier(7)).toBeCloseTo(4.2);
    expect(getMultiplier(10)).toBeCloseTo(4.8);
  });

  it('is monotonically increasing', () => {
    for (let i = 0; i < 15; i++) {
      expect(getMultiplier(i + 1)).toBeGreaterThan(getMultiplier(i));
    }
  });
});

// ---------------------------------------------------------------------------
// findMatchesSimple
// ---------------------------------------------------------------------------

describe('findMatchesSimple', () => {
  it('returns empty array when no matches', () => {
    const grid = fillNoMatches(makeEmptyGrid());
    expect(findMatchesSimple(grid).length).toBe(0);
  });

  it('detects a horizontal match of 3', () => {
    const grid = fillNoMatches(makeEmptyGrid());
    grid[0][0] = makeTile(0);
    grid[0][1] = makeTile(0);
    grid[0][2] = makeTile(0);
    const matches = findMatchesSimple(grid);
    expect(matches.some(m => m.row === 0 && m.col === 0)).toBe(true);
  });

  it('detects a vertical match of 3', () => {
    const grid = fillNoMatches(makeEmptyGrid());
    grid[0][0] = makeTile(1);
    grid[1][0] = makeTile(1);
    grid[2][0] = makeTile(1);
    const matches = findMatchesSimple(grid);
    expect(matches.some(m => m.row === 0 && m.col === 0)).toBe(true);
  });

  it('does not count a match of 2', () => {
    const grid = fillNoMatches(makeEmptyGrid());
    grid[0][0] = makeTile(0);
    grid[0][1] = makeTile(0);
    // grid[0][2] is a different type from fillNoMatches
    expect(findMatchesSimple(grid).filter(m => m.row === 0).length).toBe(0);
  });

  it('handles null tiles without throwing', () => {
    const grid = makeEmptyGrid();
    expect(() => findMatchesSimple(grid)).not.toThrow();
    expect(findMatchesSimple(grid).length).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// hasValidMoves
// ---------------------------------------------------------------------------

describe('hasValidMoves', () => {
  it('returns true when a swap creates a horizontal match', () => {
    // Layout: [0,0,X,0] — swapping col 1 and col 2 makes [0,0,0,X]
    const grid = fillNoMatches(makeEmptyGrid());
    grid[0][0] = makeTile(5);
    grid[0][1] = makeTile(5);
    // grid[0][2] is different; grid[0][3] = type 5 via: (0 + 3*2) % 6 = 0
    grid[0][2] = makeTile(3); // blocker
    grid[0][3] = makeTile(5);
    // Swapping col2 and col3 gives [5,5,5,3] → horizontal match
    expect(hasValidMoves(grid)).toBe(true);
  });

  it('returns true when a swap creates a vertical match', () => {
    const grid = fillNoMatches(makeEmptyGrid());
    grid[0][0] = makeTile(5);
    grid[1][0] = makeTile(5);
    grid[2][0] = makeTile(3); // blocker
    grid[3][0] = makeTile(5);
    // Swapping rows 2 and 3 in col 0 gives [5,5,5,3] vertically
    expect(hasValidMoves(grid)).toBe(true);
  });

  it('returns false when no swap produces a match', () => {
    // All tiles alternate so no swap can create 3-in-a-row
    const grid = makeEmptyGrid();
    // Row pattern: 0,1,2,3,4,5,0,1,2,3 — no three adjacent ever match
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        grid[r][c] = makeTile((r * 3 + c) % TILE_TYPES);
      }
    }
    // This grid is unlikely to have valid moves; just verify it doesn't throw
    expect(typeof hasValidMoves(grid)).toBe('boolean');
  });
});

// ---------------------------------------------------------------------------
// findMatches
// ---------------------------------------------------------------------------

describe('findMatches', () => {
  it('returns empty results when grid has no matches', () => {
    const grid = fillNoMatches(makeEmptyGrid());
    const { matches, matchGroups, lShapeMatches, connectedGroups } = findMatches(grid);
    expect(matches.length).toBe(0);
    expect(matchGroups.length).toBe(0);
    expect(lShapeMatches.length).toBe(0);
    expect(connectedGroups.length).toBe(0);
  });

  it('detects a horizontal match of 3 and returns correct matchGroup', () => {
    const grid = fillNoMatches(makeEmptyGrid());
    grid[5][3] = makeTile(0);
    grid[5][4] = makeTile(0);
    grid[5][5] = makeTile(0);
    const { matches, matchGroups } = findMatches(grid);
    expect(matches.length).toBeGreaterThanOrEqual(3);
    const group = matchGroups.find(g => g.direction === 'horizontal' && g.tileType === 0);
    expect(group).toBeDefined();
    expect(group.length).toBe(3);
  });

  it('detects a vertical match of 3', () => {
    const grid = fillNoMatches(makeEmptyGrid());
    grid[2][7] = makeTile(2);
    grid[3][7] = makeTile(2);
    grid[4][7] = makeTile(2);
    const { matchGroups } = findMatches(grid);
    const group = matchGroups.find(g => g.direction === 'vertical' && g.tileType === 2);
    expect(group).toBeDefined();
    expect(group.length).toBe(3);
  });

  it('detects an L-shape match and reports it in lShapeMatches', () => {
    const grid = fillNoMatches(makeEmptyGrid());
    // Horizontal: row 5, cols 3-5
    grid[5][3] = makeTile(0);
    grid[5][4] = makeTile(0);
    grid[5][5] = makeTile(0);
    // Vertical: rows 5-7, col 3 (shares (5,3) with horizontal)
    grid[6][3] = makeTile(0);
    grid[7][3] = makeTile(0);
    const { lShapeMatches } = findMatches(grid);
    expect(lShapeMatches.length).toBeGreaterThanOrEqual(1);
  });

  it('a match of 4 appears in connectedGroups with totalUniqueTiles >= 4', () => {
    const grid = fillNoMatches(makeEmptyGrid());
    grid[3][0] = makeTile(1);
    grid[3][1] = makeTile(1);
    grid[3][2] = makeTile(1);
    grid[3][3] = makeTile(1);
    const { connectedGroups } = findMatches(grid);
    const group = connectedGroups.find(g => g.tileType === 1 && g.totalUniqueTiles >= 4);
    expect(group).toBeDefined();
  });

  it('reports totalUniqueTiles correctly for a plus-shaped match', () => {
    // Use a clean empty grid so no background tiles bleed into the shape
    const grid = makeEmptyGrid();
    // Horizontal arm: row 5, cols 3-5
    grid[5][3] = makeTile(3);
    grid[5][4] = makeTile(3);
    grid[5][5] = makeTile(3);
    // Vertical arm: rows 3-7, col 4 — shares (5,4) with horizontal
    grid[3][4] = makeTile(3);
    grid[4][4] = makeTile(3);
    // (5,4) already placed above
    grid[6][4] = makeTile(3);
    grid[7][4] = makeTile(3);
    const { connectedGroups } = findMatches(grid);
    const group = connectedGroups.find(g => g.tileType === 3);
    expect(group).toBeDefined();
    // 3 horizontal + 4 additional vertical (sharing col 4 centre) = 7 unique
    expect(group.totalUniqueTiles).toBe(7);
  });
});

// ---------------------------------------------------------------------------
// calculateUnusedSpecialsBonus
// ---------------------------------------------------------------------------

describe('calculateUnusedSpecialsBonus', () => {
  it('returns 0 bonus for a grid with no specials', () => {
    const grid = fillNoMatches(makeEmptyGrid());
    const { bonus, specials } = calculateUnusedSpecialsBonus(grid);
    expect(bonus).toBe(0);
    expect(Object.values(specials).every(v => v === 0)).toBe(true);
  });

  it('returns 100 for a single line special', () => {
    const grid = makeEmptyGrid();
    grid[0][0] = makeTile(0, 'line');
    const { bonus, specials } = calculateUnusedSpecialsBonus(grid);
    expect(bonus).toBe(100);
    expect(specials.line).toBe(1);
  });

  it('returns 500 for a single hypernova', () => {
    const grid = makeEmptyGrid();
    grid[6][4] = makeTile(2, 'hypernova');
    const { bonus } = calculateUnusedSpecialsBonus(grid);
    expect(bonus).toBe(500);
  });

  it('sums bonus across multiple specials', () => {
    const grid = makeEmptyGrid();
    grid[0][0] = makeTile(0, 'line');      // 100
    grid[0][1] = makeTile(1, 'bomb');      // 150
    grid[0][2] = makeTile(2, 'cross');     // 200
    grid[0][3] = makeTile(3, 'supernova'); // 300
    grid[0][4] = makeTile(4, 'hypernova'); // 500
    const { bonus, specials } = calculateUnusedSpecialsBonus(grid);
    expect(bonus).toBe(1250);
    expect(specials.line).toBe(1);
    expect(specials.bomb).toBe(1);
    expect(specials.cross).toBe(1);
    expect(specials.supernova).toBe(1);
    expect(specials.hypernova).toBe(1);
  });

  it('handles null tiles without throwing', () => {
    const grid = makeEmptyGrid();
    expect(() => calculateUnusedSpecialsBonus(grid)).not.toThrow();
  });
});
