// =============================================================================
// simCore.js — pure headless match-3 core logic for tablet-sim
// =============================================================================
// v1.3 — E-2a (2026-04-23): extracted from match3-v1.2-tablet-sim.jsx so
// both the main thread (for the 1-ply synchronous path) and Web Workers
// (sim-worker.js, for the Monte Carlo path) can import the same bot + game
// implementation. No React, no DOM, no CSS, no sessionStorage. Single
// source of truth for all gameplay simulation logic.
//
// Also added in v1.3:
//   - Monte Carlo bot (`mcPickBestSwap`) alongside the existing 1-ply
//     heuristic. MC objective = expected total score at horizon: for each
//     valid swap, run N rollouts each simulating up to depthCap moves
//     using the chosen rollout strategy (1-ply heuristic / random); pick
//     the swap with highest average final score.
//   - `runGame` dispatches on `opts.bot`: `'heuristic-1-ply'` (default)
//     or `'monte-carlo'` (consumes `opts.botParams = { n, depthCap,
//     rolloutStrategy }`).
//
// Co-located supporting module, edited in place going forward (not a
// versioned platform file — CLAUDE.md's never-overwrite rule applies to
// platform files, not shared libraries like this one or core/).
// =============================================================================

// -----------------------------------------------------------------------------
// Game constants
// -----------------------------------------------------------------------------
export const ROWS = 12;
export const COLS = 10;
export const TILE_TYPES = 6;

// Difficulty
export const MIN_MOVES = 18;
export const MAX_MOVES = 24;
export const BASE_TARGET = 5000;
export const TARGET_VARIANCE = 1500;

// One bonus move earned per BONUS_MOVE_INTERVAL points scored (v10.4).
export const BONUS_MOVE_INTERVAL = 10000;

// Special-formation thresholds (connected-match size → special type).
export const SUPERNOVA_MIN_TILES = 6;
export const HYPERNOVA_MIN_TILES = 7;

// -----------------------------------------------------------------------------
// Pure helpers — formerly module-scope in match3-v1.2-tablet-sim.jsx, used
// by both _SIM and the React game. Imported back by v1.3 for React-side use.
// -----------------------------------------------------------------------------
export const findMatchesSimple = (grid) => {
  const matches = [];
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS - 2; col++) {
      if (grid[row][col] && grid[row][col + 1] && grid[row][col + 2] &&
          grid[row][col].type === grid[row][col + 1].type &&
          grid[row][col].type === grid[row][col + 2].type) {
        matches.push({ row, col });
      }
    }
  }
  for (let row = 0; row < ROWS - 2; row++) {
    for (let col = 0; col < COLS; col++) {
      if (grid[row][col] && grid[row + 1][col] && grid[row + 2][col] &&
          grid[row][col].type === grid[row + 1][col].type &&
          grid[row][col].type === grid[row + 2][col].type) {
        matches.push({ row, col });
      }
    }
  }
  return matches;
};

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

export const calculateUnusedSpecialsBonus = (grid) => {
  let bonus = 0;
  const specials = { line: 0, bomb: 0, cross: 0, supernova: 0, hypernova: 0 };
  grid.forEach(row => {
    row.forEach(tile => {
      if (tile?.special) {
        specials[tile.special]++;
        switch (tile.special) {
          case 'line': bonus += 100; break;
          case 'bomb': bonus += 150; break;
          case 'cross': bonus += 200; break;
          case 'supernova': bonus += 300; break;
          case 'hypernova': bonus += 500; break;
        }
      }
    });
  });
  return { bonus, specials };
};

// -----------------------------------------------------------------------------
// _SIM namespace — IIFE encapsulates internal helpers; exports the public
// API via its return object. Unchanged from v1.2 except for the addition
// of `mcPickBestSwap` and the `bot === 'monte-carlo'` branch in `runGame`.
// -----------------------------------------------------------------------------
export const _SIM = (() => {
  const POINTS_PER_TILE = 10;
  const CASCADE_MULTIPLIERS = [1, 1, 1.5, 2, 2.5, 3]; // index = cascadeDepth; caps at 3
  const SPECIAL_ACTIVATION_POINTS = {
    line: 750, cross: 750, bomb: 750,
    supernova: 2000, hypernova: 5000,
  };
  const getCascadeMult = (d) =>
    d >= CASCADE_MULTIPLIERS.length
      ? CASCADE_MULTIPLIERS[CASCADE_MULTIPLIERS.length - 1]
      : CASCADE_MULTIPLIERS[d];

  const cloneGrid = (g) => g.map(r => r.map(t => t ? { ...t } : null));
  const inBounds  = (r, c) => r >= 0 && r < ROWS && c >= 0 && c < COLS;

  function init(tileCount) {
    const g = [];
    for (let r = 0; r < ROWS; r++) {
      g[r] = [];
      for (let c = 0; c < COLS; c++) {
        let type;
        let attempts = 0;
        do {
          type = Math.floor(Math.random() * tileCount);
          attempts++;
          if (attempts > 50) break;
        } while (
          (c >= 2 && g[r][c - 1]?.type === type && g[r][c - 2]?.type === type) ||
          (r >= 2 && g[r - 1]?.[c]?.type === type && g[r - 2]?.[c]?.type === type)
        );
        g[r][c] = { type, special: null };
      }
    }
    return g;
  }

  function findGroups(grid) {
    const groups = [];
    for (let r = 0; r < ROWS; r++) {
      let runStart = 0;
      for (let c = 1; c <= COLS; c++) {
        const endOfRun = c === COLS
          || !grid[r][c] || !grid[r][runStart]
          || grid[r][c].type !== grid[r][runStart].type;
        if (endOfRun) {
          const runLen = c - runStart;
          if (runLen >= 3 && grid[r][runStart]) {
            const tiles = [];
            for (let cc = runStart; cc < c; cc++) tiles.push({ row: r, col: cc });
            groups.push({ tiles, type: grid[r][runStart].type, length: runLen, direction: 'horizontal' });
          }
          runStart = c;
        }
      }
    }
    for (let c = 0; c < COLS; c++) {
      let runStart = 0;
      for (let r = 1; r <= ROWS; r++) {
        const endOfRun = r === ROWS
          || !grid[r]?.[c] || !grid[runStart]?.[c]
          || grid[r][c].type !== grid[runStart][c].type;
        if (endOfRun) {
          const runLen = r - runStart;
          if (runLen >= 3 && grid[runStart][c]) {
            const tiles = [];
            for (let rr = runStart; rr < r; rr++) tiles.push({ row: rr, col: c });
            groups.push({ tiles, type: grid[runStart][c].type, length: runLen, direction: 'vertical' });
          }
          runStart = r;
        }
      }
    }
    return groups;
  }

  function activationZone(row, col, specialType) {
    const z = new Set();
    const add = (r, c) => { if (inBounds(r, c)) z.add(`${r}-${c}`); };
    if (specialType === 'line') {
      for (let r = 0; r < ROWS; r++) add(r, col);
    } else if (specialType === 'cross') {
      for (let r = 0; r < ROWS; r++) add(r, col);
      for (let c = 0; c < COLS; c++) add(row, c);
    } else if (specialType === 'bomb' || specialType === 'supernova' || specialType === 'hypernova') {
      const radius = specialType === 'bomb' ? 1 : 2;
      for (let dr = -radius; dr <= radius; dr++) {
        for (let dc = -radius; dc <= radius; dc++) add(row + dr, col + dc);
      }
      for (let r = 0; r < ROWS; r++) add(r, col);
      for (let c = 0; c < COLS; c++) add(row, c);
    }
    return z;
  }

  function resolveMatches(grid, groups, cascadeDepth) {
    const newGrid = cloneGrid(grid);
    const cleared = new Set();

    groups.forEach(g => {
      g.tiles.forEach(({ row, col }) => cleared.add(`${row}-${col}`));
    });

    let activationPts = 0;
    const processed = new Set();
    let expansionPass = true;
    while (expansionPass) {
      expansionPass = false;
      for (const posKey of Array.from(cleared)) {
        if (processed.has(posKey)) continue;
        const [r, c] = posKey.split('-').map(Number);
        const tile = grid[r]?.[c];
        if (tile?.special) {
          const zone = activationZone(r, c, tile.special);
          zone.forEach(k => {
            if (!cleared.has(k)) { cleared.add(k); expansionPass = true; }
          });
          activationPts += (SPECIAL_ACTIVATION_POINTS[tile.special] || 0);
          processed.add(posKey);
        } else {
          processed.add(posKey);
        }
      }
    }

    const toCreate = [];
    groups.forEach(g => {
      if (g.length < 4) return;
      let kind = null;
      if (g.length === 4) kind = 'line';
      else if (g.length === 5) kind = 'bomb';
      else if (g.length === SUPERNOVA_MIN_TILES) kind = 'supernova';
      else if (g.length >= HYPERNOVA_MIN_TILES) kind = 'hypernova';
      if (kind) {
        const midTile = g.tiles[Math.floor(g.tiles.length / 2)];
        toCreate.push({ row: midTile.row, col: midTile.col, kind, type: g.type });
      }
    });

    let matchPts = 0;
    groups.forEach(g => { matchPts += g.length * POINTS_PER_TILE; });

    const mult = getCascadeMult(cascadeDepth);
    const earnedPoints = Math.floor((matchPts + activationPts) * mult);

    cleared.forEach(k => {
      const [r, c] = k.split('-').map(Number);
      newGrid[r][c] = null;
    });

    toCreate.forEach(({ row, col, kind, type }) => {
      newGrid[row][col] = { type, special: kind };
    });

    return {
      grid: newGrid,
      points: earnedPoints,
      tilesCleared: cleared.size,
      specialsCreated: toCreate.length,
      specialsActivated: processed.size,
    };
  }

  function applyGravity(grid) {
    const ng = cloneGrid(grid);
    for (let c = 0; c < COLS; c++) {
      let emptyRow = ROWS - 1;
      for (let r = ROWS - 1; r >= 0; r--) {
        if (ng[r][c] !== null) {
          if (r !== emptyRow) {
            ng[emptyRow][c] = ng[r][c];
            ng[r][c] = null;
          }
          emptyRow--;
        }
      }
    }
    return ng;
  }

  function fillEmpties(grid, tileCount) {
    const ng = cloneGrid(grid);
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (ng[r][c] === null) ng[r][c] = { type: Math.floor(Math.random() * tileCount), special: null };
      }
    }
    return ng;
  }

  function runCascade(grid, initialGroups, tileCount) {
    let g = grid;
    let totalPts = 0, totalCleared = 0, totalCreated = 0, depth = 0, maxDepth = 0;
    let groups = initialGroups;
    while (groups.length > 0) {
      depth++;
      maxDepth = Math.max(maxDepth, depth);
      const r = resolveMatches(g, groups, depth);
      totalPts += r.points;
      totalCleared += r.tilesCleared;
      totalCreated += r.specialsCreated;
      g = fillEmpties(applyGravity(r.grid), tileCount);
      groups = findGroups(g);
    }
    return { grid: g, points: totalPts, tilesCleared: totalCleared, specialsCreated: totalCreated, maxCombo: maxDepth };
  }

  function trySwap(grid, r1, c1, r2, c2) {
    if (!inBounds(r1, c1) || !inBounds(r2, c2)) return { valid: false };
    if (Math.abs(r1 - r2) + Math.abs(c1 - c2) !== 1) return { valid: false };
    if (!grid[r1][c1] || !grid[r2][c2]) return { valid: false };

    const tile1 = grid[r1][c1], tile2 = grid[r2][c2];
    const bothSpecial = !!(tile1.special && tile2.special);

    const ng = cloneGrid(grid);
    [ng[r1][c1], ng[r2][c2]] = [ng[r2][c2], ng[r1][c1]];
    let groups = findGroups(ng);

    if (groups.length === 0) {
      if (!bothSpecial) return { valid: false };
      groups = [
        { tiles: [{ row: r1, col: c1 }], type: tile1.type, length: 1, direction: 'horizontal' },
        { tiles: [{ row: r2, col: c2 }], type: tile2.type, length: 1, direction: 'horizontal' },
      ];
    }
    return { valid: true, swappedGrid: ng, groups, bothSpecial, tile1, tile2 };
  }

  function enumerateValidSwaps(grid) {
    const swaps = [];
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        for (const [dr, dc] of [[0, 1], [1, 0]]) {
          const res = trySwap(grid, r, c, r + dr, c + dc);
          if (res.valid) swaps.push({ r1: r, c1: c, r2: r + dr, c2: c + dc, ...res });
        }
      }
    }
    return swaps;
  }

  const PHASE_WEIGHTS = {
    early:     { match: 1.0, special: 1.5, proximity: 1.2, loe: 1.2 },
    mid:       { match: 1.0, special: 1.0, proximity: 1.0, loe: 1.0 },
    late:      { match: 1.2, special: 0.7, proximity: 0.8, loe: 0.8 },
    desperate: { match: 1.5, special: 0.3, proximity: 0.3, loe: 0.3 },
  };
  const CREATION_BONUS = { line: 375, cross: 375, bomb: 375, supernova: 1000, hypernova: 2500 };
  const COMBO_SWAP_BONUS = 3000;
  const BONUS_MOVE_DESPERATE_BONUS = 1800;

  function getPhase(score, target, movesRemaining) {
    const ratio = target > 0 ? score / target : 0;
    if (movesRemaining <= 4 && ratio < 0.95) return 'desperate';
    if (ratio < 0.3)  return 'early';
    if (ratio >= 0.8) return 'late';
    return 'mid';
  }

  function scoreSwap(swap, grid, score, target, movesRemaining) {
    const phase = getPhase(score, target, movesRemaining);
    const w = PHASE_WEIGHTS[phase];

    let matchPts = 0, creationPts = 0, proximityPts = 0, loePts = 0, comboPts = 0, bonusMovePts = 0;

    if (swap.bothSpecial) comboPts = COMBO_SWAP_BONUS;

    const mult = getCascadeMult(1);
    swap.groups.forEach(g => { if (g.length >= 3) matchPts += g.length * POINTS_PER_TILE; });
    matchPts = Math.floor(matchPts * mult);

    const created = [];
    swap.groups.forEach(g => {
      let kind = null;
      if (g.length === 4) kind = 'line';
      else if (g.length === 5) kind = 'bomb';
      else if (g.length === SUPERNOVA_MIN_TILES) kind = 'supernova';
      else if (g.length >= HYPERNOVA_MIN_TILES) kind = 'hypernova';
      if (kind) {
        creationPts += CREATION_BONUS[kind];
        const midTile = g.tiles[Math.floor(g.tiles.length / 2)];
        created.push({ row: midTile.row, col: midTile.col, special: kind });
      }
    });

    if (created.length > 0) {
      const existing = [];
      for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
          if (grid[r][c]?.special) existing.push({ row: r, col: c, special: grid[r][c].special });
        }
      }
      created.forEach(cp => {
        existing.forEach(es => {
          const dist = Math.abs(cp.row - es.row) + Math.abs(cp.col - es.col);
          proximityPts += Math.max(0, 400 - dist * 80);
          const zExisting = activationZone(es.row, es.col, es.special);
          if (zExisting.has(`${cp.row}-${cp.col}`)) loePts += 300;
          const zCreated = activationZone(cp.row, cp.col, cp.special);
          if (zCreated.has(`${es.row}-${es.col}`)) loePts += 300;
        });
      });
    }

    if (phase === 'desperate') {
      const newScore = score + matchPts;
      const oldN = Math.floor(score / BONUS_MOVE_INTERVAL);
      const newN = Math.floor(newScore / BONUS_MOVE_INTERVAL);
      if (newN > oldN) bonusMovePts = BONUS_MOVE_DESPERATE_BONUS;
    }

    const total =
      w.match * matchPts +
      w.special * creationPts +
      w.proximity * proximityPts +
      w.loe * loePts +
      comboPts + bonusMovePts;

    return { total, phase, matchPts, creationPts, proximityPts, loePts, comboPts, bonusMovePts };
  }

  function pickBestSwap(grid, score, target, movesRemaining) {
    const swaps = enumerateValidSwaps(grid);
    if (swaps.length === 0) return null;
    let best = null, bestScore = -Infinity;
    for (const s of swaps) {
      const ev = scoreSwap(s, grid, score, target, movesRemaining);
      if (ev.total > bestScore) { bestScore = ev.total; best = { swap: s, eval: ev }; }
    }
    return best;
  }

  // ---------------------------------------------------------------------------
  // v1.3 — E-2a: Monte Carlo bot
  // ---------------------------------------------------------------------------
  // For each candidate swap from the current state: run N rollouts starting
  // from the post-swap state. Each rollout plays up to `depthCap` follow-up
  // moves via the chosen strategy (1-ply heuristic or random). Objective =
  // average final score across the N rollouts. Pick the swap with the best
  // average.
  //
  // Simplifications vs. a full MCTS:
  //   - No tree reuse; every call evaluates from scratch.
  //   - Rollout-step cost is flat `1 per step`, tracked against `depthCap`
  //     directly (we don't distinguish base vs. bonus moves in the rollout
  //     budget — the rollout's purpose is short-horizon score estimation,
  //     not full-game simulation, and conflating the two keeps total
  //     rollout cost predictable at `N × depthCap` cascades).
  //   - Refill randomness is the main source of rollout variance — even
  //     with the deterministic 1-ply strategy, different rollouts see
  //     different refill sequences, so N > 1 provides signal.
  // ---------------------------------------------------------------------------
  function rolloutRandom(grid, scoreIn, tileCount, depthCap) {
    let g = grid;
    let s = scoreIn;
    let remaining = depthCap;
    while (remaining > 0) {
      const swaps = enumerateValidSwaps(g);
      if (swaps.length === 0) break;
      const pick = swaps[Math.floor(Math.random() * swaps.length)];
      const res = runCascade(pick.swappedGrid, pick.groups, tileCount);
      s += res.points;
      g = res.grid;
      remaining--;
    }
    return s;
  }

  function rolloutHeuristic(grid, scoreIn, target, tileCount, depthCap) {
    let g = grid;
    let s = scoreIn;
    let remaining = depthCap;
    while (remaining > 0) {
      const best = pickBestSwap(g, s, target, remaining);
      if (!best) break;
      const res = runCascade(best.swap.swappedGrid, best.swap.groups, tileCount);
      s += res.points;
      g = res.grid;
      remaining--;
    }
    return s;
  }

  function mcPickBestSwap(grid, score, target, tileCount, params) {
    const n = params?.n ?? 30;
    const depthCap = params?.depthCap ?? 5;
    const rolloutStrategy = params?.rolloutStrategy ?? 'heuristic-1-ply';
    const swaps = enumerateValidSwaps(grid);
    if (swaps.length === 0) return null;

    let best = null;
    let bestAvg = -Infinity;
    for (const swap of swaps) {
      // Apply this candidate swap once, then start N independent rollouts
      // from the post-swap state. The rollout sees N different refill
      // sequences, which is where rollout-to-rollout variance comes from.
      const postSwap = runCascade(swap.swappedGrid, swap.groups, tileCount);
      const postSwapGrid = postSwap.grid;
      const postSwapScore = score + postSwap.points;

      let sum = 0;
      for (let i = 0; i < n; i++) {
        const finalS = rolloutStrategy === 'random'
          ? rolloutRandom(postSwapGrid, postSwapScore, tileCount, depthCap)
          : rolloutHeuristic(postSwapGrid, postSwapScore, target, tileCount, depthCap);
        sum += finalS;
      }
      const avg = sum / n;
      if (avg > bestAvg) {
        bestAvg = avg;
        best = { swap, eval: { total: avg, phase: 'mc', mcAvg: avg, mcN: n, mcDepth: depthCap } };
      }
    }
    return best;
  }

  function runGame(opts = {}) {
    // Canonical opts shape (v1.2 + v1.3): { bot, target, moves, botParams }.
    // Legacy keys (tileCount, levelTarget) still honored so window.runSimGame()
    // from pre-v1.2 continues to work. `bot` + `botParams` are echoed back
    // in the result so callers (batch runner, worker) can include them in
    // JSON metadata without a separate parameter.
    const bot         = opts.bot ?? 'heuristic-1-ply';
    const botParams   = opts.botParams ?? null;
    const tileCount   = opts.tileCount ?? TILE_TYPES;
    const levelTarget = opts.target ?? opts.levelTarget ?? (BASE_TARGET + Math.floor(Math.random() * TARGET_VARIANCE));
    const startMoves  = opts.moves ?? (MIN_MOVES + Math.floor(Math.random() * (MAX_MOVES - MIN_MOVES + 1)));

    const t0 = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();

    let grid = init(tileCount);
    let tries = 0;
    while (!hasValidMoves(grid) && tries < 5) { grid = init(tileCount); tries++; }

    let score = 0, moves = startMoves, bonusMoves = 0, movesUsed = 0;
    let bonusMovesEarned = 0;
    let specialsCreated = 0, maxCombo = 0, stuck = false;

    // v1.1 — E-1a2: no early exit on target hit; bot plays until moves/bonusMoves exhausted.
    while (moves > 0 || bonusMoves > 0) {
      const effectiveMoves = moves + bonusMoves;
      let best;
      if (bot === 'monte-carlo') {
        best = mcPickBestSwap(grid, score, levelTarget, tileCount, botParams);
      } else {
        best = pickBestSwap(grid, score, levelTarget, effectiveMoves);
      }
      if (!best) { stuck = true; break; }
      const res = runCascade(best.swap.swappedGrid, best.swap.groups, tileCount);

      const oldN = Math.floor(score / BONUS_MOVE_INTERVAL);
      score += res.points;
      const newN = Math.floor(score / BONUS_MOVE_INTERVAL);
      const earnedThisMove = Math.max(0, newN - oldN);
      bonusMoves += earnedThisMove;
      bonusMovesEarned += earnedThisMove;

      grid = res.grid;
      movesUsed++;
      specialsCreated += res.specialsCreated;
      maxCombo = Math.max(maxCombo, res.maxCombo);

      if (moves > 0) moves--;
      else bonusMoves--;
    }

    const { bonus: endBonus } = calculateUnusedSpecialsBonus(grid);
    score += endBonus;

    const t1 = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();

    const won = score >= levelTarget;
    return {
      outcome: stuck ? 'stuck' : (won ? 'win' : 'loss'),
      won,
      finalScore: score,
      levelTarget,
      movesUsed,
      movesRemaining: moves,
      bonusMovesEarned,
      bonusMovesRemaining: bonusMoves,
      specialsCreated,
      maxCombo,
      stuck,
      endBonus,
      runtimeMs: t1 - t0,
      bot,
      botParams,
    };
  }

  return {
    init, findGroups, resolveMatches, applyGravity, fillEmpties, runCascade,
    trySwap, enumerateValidSwaps, scoreSwap, pickBestSwap, mcPickBestSwap, runGame,
    getPhase, PHASE_WEIGHTS, CREATION_BONUS,
  };
})();
