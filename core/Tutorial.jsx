// =============================================================================
// core/Tutorial.jsx — Portable, reusable tutorial component (shared across
// every platform). Verses TODO #4 / docs/verses/tutorial-storyboard.md.
//
// ARCHITECTURE (Option A, locked 2026-06-23): this single core component holds
// ALL panel/section definitions. Each platform passes two small things:
//   - `sections`: an ordered list of section ids to show (so arcade can show
//     only the shared match panels, verses can add its own, etc.)
//   - `config`:   a small bundle of that platform's own numbers/copy (unused
//     for the shared match panels so far; reserved for the verses/campaign
//     panels and the real-scoring values pulled in when the multipliers panel
//     is built — see storyboard "Real-scoring core extraction").
// Platform files gain only a button + a few lines; the panel code lives here.
//
// VISUAL FIDELITY (Option A, locked): the demo board paints with the SAME
// `drawTile` / `drawSpecialIcon` canvas code the live game uses
// (core/tileDrawing.js, Session 1), so tutorial tiles are pixel-identical to
// gameplay tiles.
//
// BOARD SIZING (revised from the storyboard's "one consistent board",
// 2026-06-23): tile pixel size is CONSTANT across every panel and the modal
// reserves the largest (8x8) footprint; smaller grids center inside it. So the
// modal never resizes and tiles always render at the same size, while the grid
// grows in tiers as the effects escalate (6x6 basic/line -> 7x7 bomb/cross ->
// 8x8 novas/multipliers/fusion). Each panel's grid size = its hard-coded
// `board` dimensions.
//
// STATUS: Session 2 mock — only the first two SHARED panels are built
// (basic match, line special), on 6x6, for a look-approval checkpoint. Panels
// 3-8 follow the same per-panel structure. Scores here are illustrative and
// consistent with the demo board width; the exact in-game scoring lands with
// the real-scoring extraction when the multipliers panel (7) is built.
//
// CHOREOGRAPHY NOTES (from user feedback 2026-06-26):
//  - Slowed to ~1/3 speed (SPEED below) so a first-timer can follow it.
//  - The hand DRAGS the tile from source to destination (carries it), modeling
//    the real swap gesture, instead of tiles teleporting.
//  - A special is USED the way the real game works: you swap it INTO a line of
//    3+ matching tiles, which consumes it in the match and unleashes its blast
//    (row clear) — never by tapping the special alone.
// =============================================================================

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { drawTile, drawSpecialIcon } from './tileDrawing.js';
// Real scoring math (same source the game uses) so panel 7's numbers are the
// TRUE in-game scores, not illustrative. See docs/verses/tutorial-storyboard.md
// "Panel 7 — build plan".
import {
  getMultiplier, getCascadeMultiplier,
  MATCH_POINTS_PER_TILE, LINE_POINTS_PER_TILE, BOMB_POINTS,
} from './gameLogic.js';

// ---- Demo board metrics --------------------------------------------------
// Constant tile size; the modal reserves the 8x8 footprint so it never resizes.
const DEMO_TILE = 46;
const DEMO_GAP = 4;
const MAX_GRID = 8;
const CELL = DEMO_TILE + DEMO_GAP;
const FOOTPRINT = MAX_GRID * DEMO_TILE + (MAX_GRID - 1) * DEMO_GAP; // 396px

const gridPx = (n) => n * DEMO_TILE + (n - 1) * DEMO_GAP;
const gridOffset = (n) => (FOOTPRINT - gridPx(n)) / 2;

// ---- Animation timing ----------------------------------------------------
// SPEED scales all durations (3 = roughly 1/3 the original pace). EASE / the
// per-frame increments below are tuned to match so motion stays smooth, not
// just longer-held.
const SPEED = 2;
const T = {
  pause: 700 * SPEED,
  hand: 520 * SPEED,
  drag: 700 * SPEED,
  clear: 360 * SPEED,
  gravity: 460 * SPEED,
  form: 520 * SPEED,
  rowclear: 600 * SPEED,
};
const EASE = 0.11;       // per-frame lerp for tile/hand motion (lower = slower)
const CLEAR_RATE = 0.03; // per-frame pop-out progress
const SCORE_RATE = 0.11; // per-frame score count-up

let _uid = 0;
const uid = () => `t${_uid++}`;

// ---- Board construction --------------------------------------------------
// Boards are HARD-CODED per panel (see PANELS below). Every starting tile is
// authored so the ONLY available match is the one the tutorial makes, and that
// match is exactly the size we're teaching (no stray same-color neighbor turns
// a 3-match into a 4). Tile types: 0 red · 1 blue · 2 green · 3 gold star ·
// 4 purple · 5 orange.
const buildTilesFromGrid = (grid) => {
  const n = grid.length;
  const o = gridOffset(n);
  const tiles = [];
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      const px = o + c * CELL, py = o + r * CELL;
      tiles.push({
        key: uid(), type: grid[r][c], special: null,
        row: r, col: c, px, py, tx: px, ty: py,
        scale: 1, alpha: 1, clearing: false, clearT: 0, dragging: false, pulse: 0,
      });
    }
  }
  return tiles;
};

// Would type `t` at (r,c) complete a 3-in-a-row with already-settled neighbors?
// Checks all six windows the cell can belong to (left/middle/right horizontally,
// up/middle/down vertically). Not-yet-filled cells are null and don't match —
// and the cell that fills them runs the same check, so a refill that would line
// up with a FIXED survivor on its right/up side is still caught (the 2-sided
// left/below-only check missed exactly that case).
const completesRun = (ft, n, r, c, t) => {
  const eq = (rr, cc) => rr >= 0 && rr < n && cc >= 0 && cc < n && ft[rr][cc] === t;
  return (
    (eq(r, c - 1) && eq(r, c - 2)) || (eq(r, c - 1) && eq(r, c + 1)) || (eq(r, c + 1) && eq(r, c + 2)) ||
    (eq(r - 1, c) && eq(r - 2, c)) || (eq(r - 1, c) && eq(r + 1, c)) || (eq(r + 1, c) && eq(r + 2, c))
  );
};

// Pick a color for a brand-new refill cell. We must skip any type that would
// complete a run (that guarantee is load-bearing — the panels are sim-verified
// run-free). But we must NOT always scan from red (type 0): a big blast empties
// a wide region whose cells have no settled same-color neighbors yet, so a
// scan-from-0 makes red "safe" almost everywhere and the refill comes in a
// red/blue wash. Instead each cell starts its scan at a position-derived offset
// and cycles through all six types, so the run-free colors spread evenly across
// the board. Still fully deterministic (no RNG) — same board every replay.
const firstSafeType = (ft, n, r, c) => {
  const start = (r * n + c) % 6;
  for (let i = 0; i < 6; i++) {
    const t = (start + i) % 6;
    if (!completesRun(ft, n, r, c, t)) return t;
  }
  return start;
};

// Cells a special's blast clears, given the shape + the cell it activates in.
const inBounds = (n, r, c) => r >= 0 && r < n && c >= 0 && c < n;
const blastCells = (shape, n, br, bc) => {
  const set = new Set();
  const add = (r, c) => { if (inBounds(n, r, c)) set.add(`${r},${c}`); };
  const row = () => { for (let c = 0; c < n; c++) add(br, c); };
  const col = () => { for (let r = 0; r < n; r++) add(r, bc); };
  const square = (rad) => { for (let dr = -rad; dr <= rad; dr++) for (let dc = -rad; dc <= rad; dc++) add(br + dr, bc + dc); };
  if (shape === 'bomb') { square(1); row(); col(); }
  else if (shape === 'cross') { row(); col(); }
  else if (shape === 'supernova') { square(2); row(); col(); }
  else if (shape === 'hypernova') {
    square(2); row(); col();
    // ...plus ~half of everything else (every other remaining cell) to imply
    // the board-wide swath; the caption states the true effect.
    let toggle = 0;
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) { if (!set.has(`${r},${c}`) && (toggle++ % 2 === 0)) add(r, c); }
  }
  return [...set].map(s => s.split(',').map(Number));
};

const tileAt = (tiles, row, col) => tiles.find(t => t.row === row && t.col === col && !t.clearing);

// =============================================================================
// PANEL DEFINITIONS
// Step vocabulary: pause | hand | drag | clear | form | gravity | rowclear.
//   hand     { to:{row,col} }                 finger slides onto a tile
//   drag     { from:{row,col}, to:{row,col} } finger carries the tile + swaps
//   clear    { cells, score, popup }          matched tiles pop out
//   form     { cell, special }                a special tile forms (pulse)
//   gravity  {}                               survivors fall + refill
//   rowclear { row, extra, score, popup }     a line special clears its row
// Type 2 = green clover, type 3 = gold star (used for the scripted matches).
// =============================================================================
// Run-free 8×8 filler for the fusion panel (panel 8). The two specials are
// overlaid at (4,3)+(4,4); the tile colors underneath are just backdrop.
const FUSION_BOARD = [
  [0, 1, 2, 3, 4, 5, 0, 1],
  [2, 3, 4, 5, 0, 1, 2, 3],
  [4, 5, 0, 1, 2, 3, 4, 5],
  [0, 1, 2, 3, 4, 5, 0, 1],
  [2, 3, 4, 5, 0, 1, 2, 3],
  [4, 5, 0, 1, 2, 3, 4, 5],
  [0, 1, 2, 3, 4, 5, 0, 1],
  [2, 3, 4, 5, 0, 1, 2, 3],
];

const PANELS = {
  // --- Panel 1: basic match (3) ------------------------------------------
  // Greens (2) at (4,1),(4,2) with a green waiting at (3,3); the only available
  // match is dragging that green DOWN into (4,3) to make exactly 3 across
  // (4,1)-(4,3). No other green sits beside the row, so the match is exactly 3.
  'basic-match': {
    id: 'basic-match',
    title: 'Basic match',
    caption: 'Swap two tiles to line up 3 or more of a kind. Matches clear, and new tiles fall in.',
    board: [
      [0, 1, 2, 3, 4, 5],
      [2, 3, 4, 5, 0, 1],
      [4, 5, 0, 1, 2, 3],
      [0, 1, 3, 2, 4, 5],
      [1, 2, 2, 5, 0, 1],
      [4, 5, 0, 1, 2, 3],
    ],
    steps() {
      return [
        { type: 'pause', dur: T.pause },
        { type: 'hand', to: { row: 3, col: 3 }, dur: T.hand },
        { type: 'drag', from: { row: 3, col: 3 }, to: { row: 4, col: 3 }, dur: T.drag },
        { type: 'clear', cells: [[4, 1], [4, 2], [4, 3]], score: 60, popup: { text: 'Match! +60' }, dur: T.clear },
        { type: 'gravity', dur: T.gravity },
        { type: 'pause', dur: T.pause },
      ];
    },
  },

  // --- Panel 2: line special (4 in a row) --------------------------------
  // MAKE: stars (3) at (2,1),(2,2),(2,4) with a gap at (2,3) and a star waiting
  // at (1,3). Drag it DOWN into (2,3) -> exactly 4-in-a-row -> a LINE special
  // forms at (2,3) (3 clear + 1 special). USE: stars at (4,3),(5,3) sit in the
  // stable column 3. Drag the line special DOWN into (3,3) so it joins them as
  // a vertical 3-match — that consumes it and unleashes its row clear.
  'line-special': {
    id: 'line-special',
    title: 'Line special',
    caption: 'Match 4 in a row to make a line special (⚡). To use it, swap it into a match — it clears that whole row.',
    board: [
      [0, 1, 2, 0, 4, 5],
      [2, 3, 4, 3, 0, 1],
      [4, 3, 3, 1, 3, 2],
      [0, 1, 2, 1, 4, 5],
      [2, 3, 4, 3, 0, 1],
      [4, 5, 0, 3, 2, 3],
    ],
    steps() {
      return [
        { type: 'pause', dur: T.pause },
        // Make the special.
        { type: 'hand', to: { row: 1, col: 3 }, dur: T.hand },
        { type: 'drag', from: { row: 1, col: 3 }, to: { row: 2, col: 3 }, dur: T.drag },
        { type: 'clear', cells: [[2, 1], [2, 2], [2, 4]], score: 60, popup: { text: 'Match 4! +60' }, dur: T.clear },
        { type: 'form', cell: { row: 2, col: 3 }, special: 'line', dur: T.form },
        { type: 'gravity', dur: T.gravity },
        { type: 'pause', dur: T.pause },
        // Use the special by swapping it into a match.
        { type: 'hand', to: { row: 2, col: 3 }, dur: T.hand },
        { type: 'drag', from: { row: 2, col: 3 }, to: { row: 3, col: 3 }, dur: T.drag },
        { type: 'rowclear', row: 3, extra: [[4, 3], [5, 3]], score: 180, popup: { text: '⚡ LINE CLEAR! +180' }, dur: T.rowclear },
        { type: 'gravity', dur: T.gravity },
        { type: 'pause', dur: T.pause },
      ];
    },
  },

  // --- Panel 3: bomb (5 in a straight line) — DRAFT, 7×7 -----------------
  // MAKE: blue (1) tiles M _ M M (gap at (2,3)) split 2+2 so nothing is
  // pre-matched; a blue waits at (1,3). Drag it DOWN into (2,3) -> 5 straight ->
  // a BOMB forms (4 clear + 1 special). USE: blues at (4,3),(5,3) in stable
  // column 3; drag the bomb DOWN into (3,3) -> vertical 3-match -> it blasts a
  // 3×3 area plus its full row and column.
  'bomb': {
    id: 'bomb',
    title: 'Bomb',
    caption: 'Match 5 in a straight line to make a bomb (💣). To use it, swap it into a match — it blasts a 3×3 area plus its whole row and column.',
    board: [
      [0, 1, 2, 3, 4, 5, 0],
      [2, 3, 4, 1, 0, 1, 2],
      [4, 1, 1, 4, 1, 1, 4],
      [0, 1, 2, 4, 4, 5, 0],
      [2, 3, 4, 1, 0, 1, 2],
      [4, 5, 0, 1, 2, 3, 4],
      [0, 1, 2, 3, 4, 5, 0],
    ],
    steps() {
      return [
        { type: 'pause', dur: T.pause },
        { type: 'hand', to: { row: 1, col: 3 }, dur: T.hand },
        { type: 'drag', from: { row: 1, col: 3 }, to: { row: 2, col: 3 }, dur: T.drag },
        { type: 'clear', cells: [[2, 1], [2, 2], [2, 4], [2, 5]], score: 80, popup: { text: 'Match 5! +80' }, dur: T.clear },
        { type: 'form', cell: { row: 2, col: 3 }, special: 'bomb', dur: T.form },
        { type: 'gravity', dur: T.gravity },
        { type: 'pause', dur: T.pause },
        { type: 'hand', to: { row: 2, col: 3 }, dur: T.hand },
        { type: 'drag', from: { row: 2, col: 3 }, to: { row: 3, col: 3 }, dur: T.drag },
        { type: 'blast', shape: 'bomb', center: { row: 3, col: 3 }, score: 750, popup: { text: '💣 BOOM! +750', color: '#FF7043' }, dur: T.rowclear },
        { type: 'gravity', dur: T.gravity },
        { type: 'pause', dur: T.pause },
      ];
    },
  },

  // --- Panel 4: cross (5 in an L/T shape) — DRAFT, 7×7 -------------------
  // MAKE: green (2) arms with the junction (2,3) empty so neither arm is a
  // pre-match — vertical arm (0,3),(1,3); horizontal arm (2,4),(2,5); a green
  // waits at (2,2). Drag it RIGHT into (2,3) -> the L/T completes -> a CROSS
  // forms (4 clear + 1 special). USE: greens at (4,3),(5,3); drag the cross
  // DOWN into (3,3) -> vertical 3-match -> it clears a full row and column.
  // The cross tile is GREEN, so at the use step column 3 reads green-cross(2,3)
  // / target(3,3) / green(4,3) / green(5,3). The intended down-swap fills (3,3)
  // with the cross -> a 3-match fires it. (3,2) is kept NON-green (red) on
  // purpose: were it green, sliding it right into (3,3) would line up a green 4
  // (cross + three greens) — a better-looking move than the taught 3-match,
  // which we must not leave available. With (3,2) red, the intended 3-match is
  // the only trigger at that spot (sim-verified: zero 4-swaps at the use step).
  // The trigger down-swap also pushes the tile at (3,3) UP into (2,3). (2,2) is
  // forced to the old junction color (orange) by the make-swap, so (2,1) is kept
  // NON-orange (blue): otherwise the displaced tile lands beside (2,1)+(2,2) as a
  // third orange, forming an incidental row-2 match the scripted blast can't
  // clear (only its own row/col clears, so (2,3) goes but (2,1),(2,2) linger).
  // With (2,1) blue, the green cross-trigger is the only match the swap makes.
  'cross': {
    id: 'cross',
    title: 'Cross',
    caption: 'Match 5 in an L or T shape to make a cross (✨). To use it, swap it into a match — it clears an entire row and column at once.',
    board: [
      [0, 1, 2, 2, 4, 5, 0],
      [2, 3, 4, 2, 0, 1, 2],
      [4, 1, 2, 5, 2, 2, 4],
      [0, 1, 0, 5, 4, 5, 0],
      [2, 3, 4, 2, 0, 1, 2],
      [4, 5, 0, 2, 2, 3, 4],
      [0, 1, 2, 3, 4, 5, 0],
    ],
    steps() {
      return [
        { type: 'pause', dur: T.pause },
        { type: 'hand', to: { row: 2, col: 2 }, dur: T.hand },
        { type: 'drag', from: { row: 2, col: 2 }, to: { row: 2, col: 3 }, dur: T.drag },
        { type: 'clear', cells: [[2, 4], [2, 5], [0, 3], [1, 3]], score: 80, popup: { text: 'Match 5! +80' }, dur: T.clear },
        { type: 'form', cell: { row: 2, col: 3 }, special: 'cross', dur: T.form },
        { type: 'gravity', dur: T.gravity },
        { type: 'pause', dur: T.pause },
        { type: 'hand', to: { row: 2, col: 3 }, dur: T.hand },
        { type: 'drag', from: { row: 2, col: 3 }, to: { row: 3, col: 3 }, dur: T.drag },
        { type: 'blast', shape: 'cross', center: { row: 3, col: 3 }, score: 500, popup: { text: '✨ CROSS BLAST! +500', color: '#00E5FF' }, dur: T.rowclear },
        { type: 'gravity', dur: T.gravity },
        { type: 'pause', dur: T.pause },
      ];
    },
  },

  // --- Panel 5: supernova (6 tiles) — DRAFT, 8×8 ------------------------
  // A "6-match" is 6 connected tiles in ANY shape (the game counts the unique
  // tiles in a connected group, not a straight line — match3 ~line 2472). MAKE:
  // purple (4) forms a horizontal 4 crossing a vertical 3 (= 6 connected) from
  // ONE swap — drag the purple at (1,3) DOWN into the junction (2,3). The 5
  // matched tiles clear (incl. cells below the junction), so the SUPERNOVA falls
  // to (4,3). USE: drag it DOWN into (5,3) onto the purples at (6,3),(7,3) ->
  // vertical 3-match -> it clears a 5×5 area plus its full row and column.
  'supernova': {
    id: 'supernova',
    title: 'Supernova',
    caption: 'Match 6 tiles at once — cross a row and a column — to make a supernova (🌌). To use it, swap it into a match — it clears a 5×5 area plus its full row and column.',
    board: [
      [0, 1, 2, 3, 4, 5, 0, 1],
      [2, 3, 4, 4, 0, 1, 2, 3],
      [1, 4, 4, 1, 4, 3, 4, 5],
      [0, 1, 2, 4, 4, 5, 0, 1],
      [2, 3, 4, 4, 0, 1, 2, 3],
      [4, 5, 0, 1, 2, 3, 4, 5],
      [0, 1, 2, 4, 4, 5, 0, 1],
      [2, 3, 4, 4, 0, 1, 2, 3],
    ],
    steps() {
      return [
        { type: 'pause', dur: T.pause },
        { type: 'hand', to: { row: 1, col: 3 }, dur: T.hand },
        { type: 'drag', from: { row: 1, col: 3 }, to: { row: 2, col: 3 }, dur: T.drag },
        { type: 'clear', cells: [[2, 1], [2, 2], [2, 4], [3, 3], [4, 3]], score: 100, popup: { text: 'Match 6! +100' }, dur: T.clear },
        { type: 'form', cell: { row: 2, col: 3 }, special: 'supernova', dur: T.form },
        { type: 'gravity', dur: T.gravity },
        { type: 'pause', dur: T.pause },
        { type: 'hand', to: { row: 4, col: 3 }, dur: T.hand },
        { type: 'drag', from: { row: 4, col: 3 }, to: { row: 5, col: 3 }, dur: T.drag },
        { type: 'blast', shape: 'supernova', center: { row: 5, col: 3 }, score: 2000, popup: { text: '🌌 SUPERNOVA! +2000', color: '#FF00FF' }, dur: T.rowclear },
        { type: 'gravity', dur: T.gravity },
        { type: 'pause', dur: T.pause },
      ];
    },
  },

  // --- Panel 6: hypernova (7 tiles) — DRAFT, 8×8 ------------------------
  // 7 connected tiles -> the strongest single special. MAKE: orange (5) forms a
  // horizontal 5 crossing a vertical 3 (= 7 connected) from ONE swap — drag the
  // orange at (1,3) DOWN into the junction (2,3). The HYPERNOVA falls to (4,3).
  // USE: drag it DOWN into (5,3) onto the oranges at (6,3),(7,3) -> vertical
  // 3-match -> it wipes a 5×5 + full row + column AND about half of everything
  // else on the board.
  'hypernova': {
    id: 'hypernova',
    title: 'Hypernova',
    caption: 'Match 7 tiles at once to make a hypernova (🌠) — the strongest. To use it, swap it into a match — it wipes a 5×5 area, its full row and column, and about half of everything else.',
    board: [
      [0, 1, 2, 3, 4, 5, 0, 1],
      [2, 3, 4, 5, 0, 1, 2, 3],
      [4, 5, 5, 2, 5, 5, 4, 5],
      [0, 1, 2, 5, 4, 5, 0, 1],
      [2, 3, 4, 5, 0, 1, 2, 3],
      [4, 5, 0, 2, 2, 3, 4, 5],
      [0, 1, 2, 5, 4, 5, 0, 1],
      [2, 3, 4, 5, 0, 1, 2, 3],
    ],
    steps() {
      return [
        { type: 'pause', dur: T.pause },
        { type: 'hand', to: { row: 1, col: 3 }, dur: T.hand },
        { type: 'drag', from: { row: 1, col: 3 }, to: { row: 2, col: 3 }, dur: T.drag },
        { type: 'clear', cells: [[2, 1], [2, 2], [2, 4], [2, 5], [3, 3], [4, 3]], score: 120, popup: { text: 'Match 7! +120' }, dur: T.clear },
        { type: 'form', cell: { row: 2, col: 3 }, special: 'hypernova', dur: T.form },
        { type: 'gravity', dur: T.gravity },
        { type: 'pause', dur: T.pause },
        { type: 'hand', to: { row: 4, col: 3 }, dur: T.hand },
        { type: 'drag', from: { row: 4, col: 3 }, to: { row: 5, col: 3 }, dur: T.drag },
        { type: 'blast', shape: 'hypernova', center: { row: 5, col: 3 }, score: 5000, popup: { text: '🌠 HYPERNOVA! +5000', color: '#FFD700' }, dur: T.rowclear },
        { type: 'gravity', dur: T.gravity },
        { type: 'pause', dur: T.pause },
      ];
    },
  },

  // --- Panel 7: scoring multipliers (combo + cascade) — DRAFT, 8×8 --------
  // Teaches BOTH multipliers in one paced turn (storyboard "Concrete demo
  // turn"). Authored beat-by-beat; every score is the REAL value from the core
  // scoring functions (getMultiplier / getCascadeMultiplier + point constants).
  // Combo readout follows decision C: show the honest points multiplier + match
  // count, NOT the game's confusing x{count+1} headline. Cascade popups mirror
  // the game faithfully. Reuses a bomb + line purely as cascade vehicles.
  // HONEST cascade (review round 1, items 7+8): the swap makes TWO matches
  // (green col + blue col); the fall lines up a THIRD match (orange) that
  // INCLUDES the bomb, so clearing that match genuinely FIRES the bomb (a
  // special fires when part of a color match — verified in the game code). The
  // bomb's blast reaches down its column to the line, which is spared (it
  // chains) and fires next. Explicit choreography, no gravity between the
  // special beats, so positions stay put. Board look + timing tunable in review.
  'multipliers': {
    id: 'multipliers',
    title: 'Multipliers',
    caption: 'Two things multiply your score in one turn: combos (how many matches you make) and cascades (when other matches or specials are triggered). Watch both climb — one big turn beats a dozen small moves.',
    reference: 'A basic match is only about +60.',
    board: [
      [1, 3, 4, 5, 5, 0, 3, 1],
      [4, 0, 1, 2, 1, 3, 0, 4],
      [0, 5, 3, 2, 1, 4, 5, 0],
      [5, 1, 0, 1, 2, 5, 4, 3],
      [2, 4, 5, 0, 3, 1, 2, 5],
      [3, 0, 2, 4, 5, 0, 1, 4],
      [1, 2, 4, 3, 0, 5, 3, 0],
      [4, 3, 0, 5, 1, 2, 4, 1],
    ],
    specials: [
      { row: 3, col: 5, type: 'bomb' },   // orange — the fall's 3rd match includes it, firing it
      { row: 6, col: 5, type: 'line' },   // in the bomb's column blast; spared, then fires its row
    ],
    steps() {
      // Real multipliers + scores, straight from the core functions.
      const comboA = getMultiplier(2);       // 2.0  (2 matches from the swap)
      const comboB = getMultiplier(3);       // 2.5  (3rd match via cascade)
      const cascA = getCascadeMultiplier(2); // 1.5  (bomb fires, cascade depth 2)
      const cascB = getCascadeMultiplier(3); // 2.0  (line fires, cascade depth 3)
      const sSwap = 2 * Math.floor(3 * MATCH_POINTS_PER_TILE * comboA);   // 120 (two 3-matches)
      const sMatch3 = Math.floor(3 * MATCH_POINTS_PER_TILE * comboB);     // 75 (the orange 3-match)
      const sBomb = Math.floor(BOMB_POINTS * cascA);                      // 1125
      const lineTiles = 8;
      const sLine = Math.floor(lineTiles * LINE_POINTS_PER_TILE * cascB); // 480
      return [
        { type: 'pause', dur: T.pause },
        // BEAT 1 — combo: one swap completes TWO matches (green col + blue col).
        // Hand starts ON the source tile so it carries it across (review item 4).
        { type: 'hand', to: { row: 3, col: 3 }, dur: T.hand },
        { type: 'drag', from: { row: 3, col: 3 }, to: { row: 3, col: 4 }, dur: T.drag },
        { type: 'clear', cells: [[1, 3], [2, 3], [3, 3], [1, 4], [2, 4], [3, 4]],
          score: sSwap, combo: { matches: 2, mult: comboA },
          highlights: [{ r1: 1, c1: 3, r2: 3, c2: 3 }, { r1: 1, c1: 4, r2: 3, c2: 4 }],
          popup: { text: '2 matches from one swap!', color: '#667eea', pos: 'bottom' }, dur: T.clear },
        { type: 'gravity', dur: T.gravity },
        { type: 'pause', dur: T.pause },
        // BEAT 2 — combo climbs: the fall lines up a 3rd match (orange). It
        // INCLUDES the bomb at (3,5), so this match will fire it next. Clear the
        // two normal oranges; the bomb (3rd tile of the match) stays to fire.
        { type: 'clear', cells: [[3, 3], [3, 4]],
          score: sMatch3, combo: { matches: 3, mult: comboB },
          highlights: [{ r1: 3, c1: 3, r2: 3, c2: 5 }],
          popup: { text: 'Falling tiles make a 3rd match — combo climbs!', color: '#667eea', pos: 'bottom' }, dur: T.clear },
        { type: 'pause', dur: T.pause },
        // BEAT 3 — cascade: the bomb was part of that match, so it fires. Its
        // blast reaches down its column to the line (spared via `except` — it
        // chains). No gravity yet, so the line stays put for its own beat.
        { type: 'blast', shape: 'bomb', center: { row: 3, col: 5 }, except: [[6, 5]],
          score: sBomb, combo: null,
          popup: { text: `🔥 CASCADE x${cascA.toFixed(1)}! 💣 BOOM! +${sBomb}`, color: '#FF7043', pos: 'top' }, dur: T.rowclear },
        { type: 'pause', dur: T.pause },
        // BEAT 4 — cascade climbs: the line the bomb reached now fires its row.
        { type: 'rowclear', row: 6,
          score: sLine,
          popup: { text: `🔥 CASCADE x${cascB.toFixed(1)}! ⚡ LINE CLEAR! +${sLine}`, color: '#00E5FF', pos: 'top' }, dur: T.rowclear },
        { type: 'gravity', dur: T.gravity },
        { type: 'pause', dur: T.pause },
      ];
    },
  },

  // --- Panel 8: fusion (finale) — DRAFT, 8×8 -----------------------------
  // The last shared panel. Shows THREE fusions in ascending order so the player
  // learns fusion SCALES with the specials combined. Each runs on a FRESH board
  // (a `setup` step resets between them — a fusion's blast would otherwise wipe
  // out the next demo's specials, which the user flagged). Real popups + points
  // (from the game's activateSpecialCombination). A climbing "fusion ladder"
  // tally keeps all three values in one view. Explicit clear footprints per the
  // real effects: line+line = row + column; bomb+bomb = 7×7 + row + col; nova =
  // (near) the whole board. DRAFT — first on-screen version, tune in review.
  'fusion': {
    id: 'fusion',
    title: 'Fusion',
    caption: 'Fusion is swapping two special tiles into each other — they combine into one blast. The bigger the specials, the bigger the result: from a solid +700 to a board-clearing +8000. (Different from a cascade: here you deliberately combine two specials.)',
    board: FUSION_BOARD,
    specials: [
      { row: 4, col: 3, type: 'line' },
      { row: 4, col: 4, type: 'line' },
    ],
    steps() {
      const N = FUSION_BOARD.length;
      const all = [];
      for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) all.push([r, c]);
      const cross = (rr, cc) => all.filter(([r, c]) => r === rr || c === cc);
      const mega = (rr, cc) => all.filter(([r, c]) => (Math.abs(r - rr) <= 3 && Math.abs(c - cc) <= 3) || r === rr || c === cc);
      const twoSpecials = (t1, t2) => [{ row: 4, col: 3, type: t1 }, { row: 4, col: 4, type: t2 }];
      // One fusion demo: (reset board, except the first) → hand swaps the two
      // specials together → the combined blast, with its real popup + ladder entry.
      const fuse = (t1, t2, cells, text, points, label, reset) => [
        ...(reset ? [{ type: 'setup', grid: FUSION_BOARD, specials: twoSpecials(t1, t2), dur: T.form }] : []),
        { type: 'pause', dur: T.pause },
        { type: 'hand', to: { row: 4, col: 3 }, dur: T.hand },
        { type: 'drag', from: { row: 4, col: 3 }, to: { row: 4, col: 4 }, dur: T.drag },
        { type: 'clear', cells, score: points,
          ladder: { label, points },
          highlights: [{ r1: 4, c1: 3, r2: 4, c2: 4 }],
          popup: { text, color: '#FFD700', pos: 'bottom' }, dur: T.rowclear },
        { type: 'pause', dur: T.pause },
      ];
      return [
        { type: 'pause', dur: T.pause },
        ...fuse('line', 'line', cross(4, 4), '⚡⚡ DOUBLE LINE! +700', 700, 'Line + Line', false),
        ...fuse('bomb', 'bomb', mega(4, 4), '💣💣 MEGA BLAST! +1500', 1500, 'Bomb + Bomb', true),
        ...fuse('hypernova', 'supernova', all, '🌠🌌 NOVA FUSION! +8000', 8000, 'Nova fusion', true),
      ];
    },
  },
};

// =============================================================================
// TutorialCanvas — plays one panel's timeline on a canvas.
// =============================================================================
function TutorialCanvas({ panel, replayKey, onScore, onPopup, onFinish, onMultiplier, onLadder }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = FOOTPRINT * dpr;
    canvas.height = FOOTPRINT * dpr;
    canvas.style.width = `${FOOTPRINT}px`;
    canvas.style.height = `${FOOTPRINT}px`;
    const ctx = canvas.getContext('2d');

    const n = panel.board.length;
    const o = gridOffset(n);
    const center = (row, col) => ({ x: o + col * CELL + DEMO_TILE / 2, y: o + row * CELL + DEMO_TILE / 2 });
    const HAND_PARK = { x: FOOTPRINT / 2, y: FOOTPRINT + 40 };

    const S = {
      tiles: buildTilesFromGrid(panel.board),
      steps: panel.steps(),
      stepIndex: -1,
      stepStart: 0,
      hand: { x: HAND_PARK.x, y: HAND_PARK.y, tx: HAND_PARK.x, ty: HAND_PARK.y, visible: false },
      dragTile: null,
      scoreTarget: 0,
      scoreShown: 0,
      raf: 0,
      done: false,
      highlights: [],  // attention boxes drawn around matches as they clear
    };
    // Pre-place any specials the panel uses as cascade vehicles (panel 7).
    (panel.specials || []).forEach(({ row, col, type }) => {
      const t = S.tiles.find(tt => tt.row === row && tt.col === col);
      if (t) t.special = type;
    });
    onScore(0);
    if (onMultiplier) onMultiplier(null);
    if (onLadder) onLadder(null);

    const parkHand = () => {
      S.hand.visible = false;
      S.hand.x = S.hand.tx = HAND_PARK.x;
      S.hand.y = S.hand.ty = HAND_PARK.y;
    };

    const applyGravity = () => {
      // 1) Settle survivors to the bottom of each column; record the final type
      //    grid (new cells left null). EXISTING tiles keep their color, always —
      //    a tile already on the board never changes type (that's not how the
      //    game works). Each panel's board is authored so survivors can't fall
      //    into a run; only brand-new tiles are color-checked below.
      const finalType = Array.from({ length: n }, () => Array(n).fill(null));
      const newCells = []; // { r, c, depth }
      for (let c = 0; c < n; c++) {
        const col = S.tiles.filter(t => t.col === c && !t.clearing).sort((a, b) => a.row - b.row);
        const newCount = n - col.length;
        col.forEach((t, i) => {
          const newRow = newCount + i;
          t.row = newRow; t.tx = o + c * CELL; t.ty = o + newRow * CELL;
          finalType[newRow][c] = t.type;
        });
        for (let r = 0; r < newCount; r++) newCells.push({ r, c, depth: newCount - r });
      }
      // 2) Fill ONLY the empty (new) cells, bottom-up / left-right, choosing a
      //    type that completes no run with its settled neighbors — so nothing
      //    falls in as a phantom match.
      for (let r = n - 1; r >= 0; r--) {
        for (let c = 0; c < n; c++) {
          if (finalType[r][c] === null) finalType[r][c] = firstSafeType(finalType, n, r, c);
        }
      }
      // 3) Spawn the new tiles above the board so they drop in.
      newCells.forEach(({ r, c, depth }) => {
        const px = o + c * CELL;
        S.tiles.push({
          key: uid(), type: finalType[r][c], special: null,
          row: r, col: c, px, py: o + (r - depth) * CELL,
          tx: px, ty: o + r * CELL, scale: 1, alpha: 1, clearing: false, clearT: 0, dragging: false, pulse: 0,
        });
      });
    };

    const enterStep = (i) => {
      // Release any in-progress drag onto its committed target.
      if (S.dragTile) { S.dragTile.dragging = false; S.dragTile = null; }
      S.stepIndex = i;
      S.stepStart = performance.now();
      if (i >= S.steps.length) { S.done = true; onFinish(); return; }
      const step = S.steps[i];
      // Combo/multiplier readout (panel 7) — a step may set or clear it.
      if (step.combo !== undefined && onMultiplier) onMultiplier(step.combo);
      // Fusion ladder (panel 8): a step may append a completed fusion to the tally.
      if (step.ladder && onLadder) onLadder(step.ladder);
      // Attention highlights (panel 7): a step may box the match(es) it clears.
      // Each entry is { r1, c1, r2, c2 } (a tile-cell bounding box); reset each step.
      S.highlights = (step.highlights || []).map(h => ({ ...h, start: performance.now() }));
      switch (step.type) {
        case 'hand': {
          const cc = center(step.to.row, step.to.col);
          S.hand.visible = true; S.hand.tx = cc.x; S.hand.ty = cc.y;
          break;
        }
        case 'drag': {
          const a = tileAt(S.tiles, step.from.row, step.from.col);
          const b = tileAt(S.tiles, step.to.row, step.to.col);
          const cc = center(step.to.row, step.to.col);
          S.hand.visible = true; S.hand.tx = cc.x; S.hand.ty = cc.y;
          if (a) {
            a.row = step.to.row; a.col = step.to.col;
            a.tx = o + step.to.col * CELL; a.ty = o + step.to.row * CELL;
            a.dragging = true; S.dragTile = a;
          }
          if (b) {
            b.row = step.from.row; b.col = step.from.col;
            b.tx = o + step.from.col * CELL; b.ty = o + step.from.row * CELL;
          }
          break;
        }
        case 'clear': {
          parkHand();
          step.cells.forEach(([r, c]) => { const t = tileAt(S.tiles, r, c); if (t) t.clearing = true; });
          if (step.score) S.scoreTarget += step.score;
          if (step.popup) onPopup(step.popup);
          break;
        }
        case 'form': {
          const t = tileAt(S.tiles, step.cell.row, step.cell.col);
          if (t) { t.special = step.special; t.pulse = performance.now(); }
          break;
        }
        case 'rowclear': {
          parkHand();
          S.tiles.forEach(t => { if (t.row === step.row && !t.clearing) t.clearing = true; });
          (step.extra || []).forEach(([r, c]) => { const t = tileAt(S.tiles, r, c); if (t) t.clearing = true; });
          if (step.score) S.scoreTarget += step.score;
          if (step.popup) onPopup(step.popup);
          break;
        }
        case 'blast': {
          parkHand();
          // `except` spares cells that CHAIN instead of clearing — e.g. a line
          // special caught in the bomb's footprint, which then fires next beat.
          const skip = new Set((step.except || []).map(([r, c]) => `${r},${c}`));
          blastCells(step.shape, n, step.center.row, step.center.col).forEach(([r, c]) => {
            if (skip.has(`${r},${c}`)) return;
            const t = tileAt(S.tiles, r, c); if (t) t.clearing = true;
          });
          if (step.score) S.scoreTarget += step.score;
          if (step.popup) onPopup(step.popup);
          break;
        }
        case 'gravity': { applyGravity(); break; }
        // Board reset (panel 8 fusion): swap in a fresh board + specials so each
        // fusion demo runs on a clean board (their blasts would otherwise wipe
        // out the next demo's specials).
        case 'setup': {
          parkHand();
          S.tiles = buildTilesFromGrid(step.grid);
          (step.specials || []).forEach(({ row, col, type }) => {
            const t = S.tiles.find(tt => tt.row === row && tt.col === col);
            if (t) t.special = type;
          });
          S.highlights = [];
          // Fresh board → fresh score, so each fusion shows its own value; the
          // ladder tally carries the running escalation.
          S.scoreTarget = 0; S.scoreShown = 0; onScore(0);
          break;
        }
        default: break;
      }
    };

    const drawHand = () => {
      if (!S.hand.visible) return;
      ctx.save();
      ctx.font = '34px serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.shadowColor = 'rgba(0,0,0,0.45)';
      ctx.shadowBlur = 6;
      ctx.fillText('👆', S.hand.x, S.hand.y + 6);
      ctx.restore();
    };

    const paintTile = (t, now) => {
      let scale = t.scale;
      if (t.pulse) {
        const p = Math.min(1, (now - t.pulse) / T.form);
        scale = 1 + Math.sin(p * Math.PI) * 0.18;
        if (p >= 1) t.pulse = 0;
      }
      drawTile(ctx, t.px, t.py, DEMO_TILE, t.type, { opacity: t.alpha, scale, isSpecial: !!t.special });
      if (t.special && t.alpha > 0.5) drawSpecialIcon(ctx, t.px, t.py, DEMO_TILE, t.special);
    };

    const frame = (now) => {
      if (S.stepIndex === -1) enterStep(0);
      else if (!S.done) {
        const step = S.steps[S.stepIndex];
        if (now - S.stepStart >= step.dur) { enterStep(S.stepIndex + 1); }
      }

      // Motion + clear + score easing.
      S.hand.x += (S.hand.tx - S.hand.x) * EASE;
      S.hand.y += (S.hand.ty - S.hand.y) * EASE;
      S.tiles.forEach(t => {
        if (t.dragging) {
          // Pin the carried tile under the finger.
          t.px = S.hand.x - DEMO_TILE / 2;
          t.py = S.hand.y - DEMO_TILE / 2;
        } else {
          t.px += (t.tx - t.px) * EASE;
          t.py += (t.ty - t.py) * EASE;
        }
        if (t.clearing) { t.clearT = Math.min(1, t.clearT + CLEAR_RATE); t.scale = 1 - t.clearT; t.alpha = 1 - t.clearT; }
      });
      S.tiles = S.tiles.filter(t => !(t.clearing && t.clearT >= 1));
      if (S.scoreShown !== S.scoreTarget) {
        S.scoreShown += Math.ceil((S.scoreTarget - S.scoreShown) * SCORE_RATE);
        if (Math.abs(S.scoreTarget - S.scoreShown) <= 1) S.scoreShown = S.scoreTarget;
        onScore(S.scoreShown);
      }

      // Render.
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, FOOTPRINT, FOOTPRINT);
      const bg = ctx.createLinearGradient(0, 0, FOOTPRINT, FOOTPRINT);
      bg.addColorStop(0, '#2b2b3a');
      bg.addColorStop(1, '#1f1f2b');
      ctx.fillStyle = bg;
      const bx = gridOffset(n) - DEMO_GAP, bw = gridPx(n) + DEMO_GAP * 2;
      ctx.fillRect(bx, bx, bw, bw);

      // Draw stationary tiles first, the carried tile on top.
      S.tiles.forEach(t => { if (!t.dragging) paintTile(t, now); });
      S.tiles.forEach(t => { if (t.dragging) paintTile(t, now); });

      // Attention boxes around the just-matched group(s), fading as they clear.
      S.highlights.forEach(h => {
        const age = now - h.start;
        const alpha = Math.max(0, 1 - age / (T.clear * 1.1));
        if (alpha <= 0) return;
        const pad = 3;
        const x = o + h.c1 * CELL - pad;
        const y = o + h.r1 * CELL - pad;
        const w = (h.c2 - h.c1) * CELL + DEMO_TILE + pad * 2;
        const hh = (h.r2 - h.r1) * CELL + DEMO_TILE + pad * 2;
        ctx.save();
        ctx.strokeStyle = `rgba(255, 214, 10, ${alpha})`;
        ctx.lineWidth = 3;
        ctx.shadowColor = `rgba(255, 214, 10, ${alpha * 0.8})`;
        ctx.shadowBlur = 10;
        if (ctx.roundRect) { ctx.beginPath(); ctx.roundRect(x, y, w, hh, 8); ctx.stroke(); }
        else ctx.strokeRect(x, y, w, hh);
        ctx.restore();
      });

      drawHand();

      if (!S.done) S.raf = requestAnimationFrame(frame);
    };

    S.raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(S.raf);
  }, [panel, replayKey, onScore, onPopup, onFinish, onMultiplier, onLadder]);

  return <canvas ref={canvasRef} style={{ borderRadius: '10px', display: 'block' }} />;
}

// =============================================================================
// Tutorial — the modal shell (title, score, board, caption, controls).
// =============================================================================
export default function Tutorial({ sections, config = {}, onClose }) {
  const panels = sections.map(id => PANELS[id]).filter(Boolean);
  const [index, setIndex] = useState(0);
  const [replayKey, setReplayKey] = useState(0);
  const [score, setScore] = useState(0);
  const [popup, setPopup] = useState(null);
  const [finished, setFinished] = useState(false);
  const [mult, setMult] = useState(null);
  const [ladder, setLadder] = useState([]);

  const panel = panels[index];

  const handleScore = useCallback((v) => setScore(v), []);
  const handlePopup = useCallback((p) => setPopup({ ...p, key: Date.now() }), []);
  const handleFinish = useCallback(() => setFinished(true), []);
  const handleMultiplier = useCallback((m) => setMult(m), []);
  const handleLadder = useCallback((entry) => setLadder(prev => (entry ? [...prev, entry] : [])), []);

  const goTo = (i) => { setIndex(i); setScore(0); setPopup(null); setMult(null); setLadder([]); setFinished(false); setReplayKey(k => k + 1); };
  const replay = () => { setScore(0); setPopup(null); setMult(null); setLadder([]); setFinished(false); setReplayKey(k => k + 1); };

  if (!panel) return null;

  const dot = (active) => ({
    width: '9px', height: '9px', borderRadius: '50%',
    background: active ? '#667eea' : '#cfcfe0', display: 'inline-block', margin: '0 4px',
  });

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 4000, fontFamily: 'Arial, sans-serif', padding: '16px',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#fff', borderRadius: '18px', padding: '18px 22px 16px',
          width: `${FOOTPRINT + 56}px`, maxWidth: '95vw',
          boxShadow: '0 18px 50px rgba(0,0,0,0.4)', position: 'relative',
        }}
      >
        {/* Title bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
          <div style={{ fontSize: '17px', fontWeight: 'bold', color: '#333' }}>
            How to Play <span style={{ color: '#888', fontWeight: 'normal', fontSize: '14px' }}>· {panel.title}</span>
          </div>
          <button
            onClick={onClose}
            aria-label="Close tutorial"
            style={{ border: 'none', background: 'transparent', fontSize: '20px', cursor: 'pointer', color: '#888', lineHeight: 1, padding: '2px 6px' }}
          >✕</button>
        </div>

        {/* Live score + combo multiplier readout (panel 7, decision C: honest
            points multiplier + match count, not the game's x{count+1} headline) */}
        <div style={{ textAlign: 'center', fontSize: '20px', fontWeight: 'bold', color: '#333', marginBottom: '2px' }}>
          Score: <span style={{ color: '#667eea' }}>{score}</span>
          {mult && (
            <span style={{ marginLeft: '12px', fontSize: '16px', color: '#e8590c' }}>
              🔥 {mult.matches} matches · ×{mult.mult.toFixed(1)} pts
            </span>
          )}
        </div>
        {panel.reference && (
          <div style={{ textAlign: 'center', fontSize: '12px', color: '#999', marginBottom: '6px' }}>
            {panel.reference}
          </div>
        )}

        {/* Demo board + popup overlay */}
        <div style={{ position: 'relative', width: `${FOOTPRINT}px`, maxWidth: '100%', margin: '0 auto' }}>
          <TutorialCanvas
            panel={panel}
            replayKey={replayKey}
            onScore={handleScore}
            onPopup={handlePopup}
            onFinish={handleFinish}
            onMultiplier={handleMultiplier}
            onLadder={handleLadder}
          />
          {/* Fusion ladder (panel 8): climbing tally so the +700 → +1500 →
              +8000 escalation is visible in one view. */}
          {ladder.length > 0 && (
            <div style={{
              position: 'absolute', left: '10px', top: '10px', zIndex: 6, pointerEvents: 'none',
              background: 'rgba(0,0,0,0.82)', borderRadius: '10px', padding: '8px 12px', minWidth: '158px',
            }}>
              <div style={{ color: '#FFD700', fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>Fusion ladder</div>
              {ladder.map((e, i) => (
                <div key={i} style={{ color: '#fff', fontSize: '13px', display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
                  <span>{e.label}</span><span style={{ color: '#FFD54F', fontWeight: 700 }}>+{e.points}</span>
                </div>
              ))}
            </div>
          )}
          {popup && (
            <div
              key={popup.key}
              style={{
                position: 'absolute', left: '50%',
                top: popup.pos === 'top' ? '13%' : popup.pos === 'bottom' ? '85%' : '42%',
                transform: 'translate(-50%,-50%)',
                color: popup.color || '#FFD700', fontWeight: 900, fontSize: '20px', whiteSpace: 'nowrap',
                background: 'rgba(0,0,0,0.9)', padding: '8px 14px', borderRadius: '10px',
                border: `2px solid ${popup.color || '#FFD700'}`, boxShadow: '0 0 20px rgba(255,215,0,0.6)',
                pointerEvents: 'none', animation: 'tutPopup 1.8s ease-out forwards', zIndex: 5,
              }}
            >{popup.text}</div>
          )}
        </div>

        {/* Caption */}
        <div style={{ textAlign: 'center', color: '#444', fontSize: '15px', lineHeight: 1.45, margin: '12px 6px 10px', minHeight: '44px' }}>
          {panel.caption}
        </div>

        {/* Controls */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <button
            onClick={() => goTo(Math.max(0, index - 1))}
            disabled={index === 0}
            style={{
              border: 'none', background: 'transparent', fontSize: '15px',
              color: index === 0 ? '#ccc' : '#667eea', cursor: index === 0 ? 'default' : 'pointer', fontWeight: 'bold',
            }}
          >‹ Back</button>

          <div style={{ display: 'flex', alignItems: 'center' }}>
            {panels.map((p, i) => (
              <span
                key={p.id}
                onClick={() => goTo(i)}
                title={p.title}
                style={{ ...dot(i === index), cursor: 'pointer' }}
              />
            ))}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <button
              onClick={replay}
              style={{
                border: `1px solid ${finished ? '#667eea' : '#ddd'}`, background: finished ? '#667eea' : '#fff',
                color: finished ? '#fff' : '#667eea', borderRadius: '999px', padding: '5px 14px',
                fontSize: '14px', cursor: 'pointer', fontWeight: 'bold',
              }}
            >↻ Replay</button>
            <button
              onClick={() => goTo(Math.min(panels.length - 1, index + 1))}
              disabled={index === panels.length - 1}
              style={{
                border: 'none', background: 'transparent', fontSize: '15px',
                color: index === panels.length - 1 ? '#ccc' : '#667eea',
                cursor: index === panels.length - 1 ? 'default' : 'pointer', fontWeight: 'bold',
              }}
            >Next ›</button>
          </div>
        </div>

        <style>{`@keyframes tutPopup {
          0%   { opacity: 0; transform: translate(-50%,-40%) scale(0.85); }
          14%  { opacity: 1; transform: translate(-50%,-50%) scale(1); }
          82%  { opacity: 1; transform: translate(-50%,-58%) scale(1); }
          100% { opacity: 0; transform: translate(-50%,-72%) scale(1); }
        }`}</style>
      </div>
    </div>
  );
}
