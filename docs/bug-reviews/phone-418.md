# Bug Review: match3-v10.5.4-418px-phone.html

Reviewed: 2026-03-19
Reviewer: Claude Code (automated)

Note: This platform is a self-contained HTML file (React 18.2 loaded from CDN, game
logic in a plain `<script>` tag). It cannot be imported into the Vite build and must
be opened directly in a browser. Tile size is 40px / 2px gap = 418px board width.

---

## Known Bugs (from tablet v11 review)

### Bug K1 — e.detail phantom click guard (HIGH)
**Line:** 1241
`if (e.detail === 0) return; // v10.2: Ignore synthetic clicks (mobile double-tap)`

Modern touch browsers emit `detail=1` for synthesized clicks after a drag-swap, so
this guard is ineffective. A phantom click registers at the drag origin immediately
after the swap fires.

**Fix:** `swapFiredRef` pattern (per tablet v11): set a ref synchronously when
drag-swap fires, block the next click, clear after 300 ms.

---

### Bug K2 — dragStart useState race condition (CRITICAL)
**Line:** 759
`const [dragStart, setDragStart] = useState(null);`

Same root cause as the tablet bug that caused the 2→0 move skip. Rapid `touchmove`
events arrive before React re-renders, so `dragStart` is still non-null in stale
closures and `attemptSwap` can fire multiple times per drag.

**Fix:** Replace with `useRef`; clear `dragStart.current = null` synchronously before
calling `attemptSwap`.

---

### Bug K3 — Special tile instant pop-in (HIGH)
**Lines:** 2217–2218

```js
animX: col * (TILE_SIZE + TILE_GAP),
animY: row * (TILE_SIZE + TILE_GAP)
```

Special tiles created from 4+ matches are given `animY` equal to their final grid
position. The render loop seeds `animStateRef` from `animY` on first encounter, so the
tile starts at its destination and never animates.

Note: unlike the desktop/phone-341 files which use `_initAnimY`, this file uses `animY`
directly (same field the render loop reads). The v11.1 fix for the tablet — changing
to `(row - 1) * (TILE_SIZE + TILE_GAP)` — applies here too.

---

## New Bugs

### Bug N1 — Stale dragStart closure at end of drag (MEDIUM)
**Lines:** 1308–1311

```js
setDragStart(null);
setSelectedTile(null);
attemptSwap(dragStart.row, dragStart.col, targetRow, targetCol);
```

`setDragStart(null)` is async; the call to `attemptSwap` on the next line still uses
the old `dragStart` value from the closure, which is fine for this call. The problem
is the inverse: if another `handleDragMove` fires before the re-render, the guard
`if (!dragStart || ...)` at the top of the function sees the OLD non-null state and
re-enters. Combined with K2, this makes the double-swap window even wider.

This is essentially a variant of K2 (both are fixed by converting to `useRef`).

---

### Bug N2 — comboRef stale in cascade generations (MEDIUM)
**Line:** 2297

```js
processMatches(newGrid, matchGroups, lShapeMatches, comboRef.current + comboIncrease, ...);
```

`comboRef` is updated via `useEffect(() => { comboRef.current = combo; }, [combo])`,
which runs *after* the current render. `setCombo(prev => prev + comboIncrease)` at
line 2292 schedules a state update, but `comboRef.current` still holds the previous
value when the `processMatches` call is made 3 lines later. For deep cascades
(generation ≥ 2), each level's combo multiplier is one generation behind.

**Observable effect:** Combo multipliers don't accumulate correctly across cascade
generations — scoring is lower than it should be for long chains.

---

### Bug N3 — Special detection reads pre-swap grid (MEDIUM)
**Lines:** 1350–1354

```js
const tile1Special = newGrid[row1][col1]?.special;
const tile2Special = newGrid[row2][col2]?.special;
[newGrid[row1][col1], newGrid[row2][col2]] = [newGrid[row2][col2], newGrid[row1][col1]];
```

`tile1Special` and `tile2Special` are read before the swap, then the swap is applied.
This is correct for detecting what *was* at each position. However, the downstream
`activateSpecialCombination(row1, col1, row2, col2, ...)` receives the *swapped* grid
but the *pre-swap* row/col indices. If `activateSpecialCombination` reads
`grid[row1][col1]` to verify the tile type, it now sees the tile that *arrived* there,
not the tile that *triggered* the combo. For most combinations this is harmless (same
two specials), but for directional specials (line, cross) the triggering position
affects blast direction and it could be the wrong tile's position.

---

### Bug N4 — Game-end useEffect race with turn completion setTimeout (MEDIUM)
**Line:** 875

`if (!turnComplete || isAnimating || ...) return;`

`turnComplete` is set inside a `setTimeout(..., 100)` at the end of `fillEmptySpaces`.
`isAnimating` is set to `false` in a sibling `setTimeout(..., 100)` at the same call
site. If the two timeouts resolve in different microtask batches, there is a one-frame
window where `isAnimating` is `false` but `turnComplete` is still `false`, causing the
game-end check to enter, find `!turnComplete`, and exit cleanly — but then
`turnComplete` flips and the game-end check fires again. Functionally harmless in
practice, but fragile.

---

### Bug N5 — Animation frame recreated on every grid/selection change (LOW)
**Line:** 1212 (renderCanvas dependency array)

`renderCanvas` is a `useCallback` that depends on `[grid, selectedTile, matchedTileSet,
pendingSpecialSet, boardWidth, boardHeight, flashingTileSet, glowingTileSet, isDarkMode]`.
The animation-loop `useEffect` depends on `renderCanvas`, so the `requestAnimationFrame`
loop is torn down and restarted every time any of those values change (which is very
frequent during gameplay). This can cause single-frame flicker during active matches.

---

## Not Bugs (false positives in automated review)

**fillEmptySpaces emptyCount direction** — The automated agent flagged this as CRITICAL
but then self-corrected: "This is mathematically correct!" The algorithm assigns the
largest above-board offset to the topmost empty slot and decrements for each lower slot,
so all tiles in a column fall the same distance and land simultaneously. This is the
intended synchronized-drop visual. Not a bug. (Same conclusion reached independently for
the tablet and desktop files.)

**Bonus move threshold formula** — Flagged then self-corrected as a false alarm. The
`Math.floor(score / BONUS_MOVE_INTERVAL)` calculation correctly awards multiple moves
when a score jump crosses several thresholds at once.

**Operator precedence ambiguity (line 1329)** — `&&` binds tighter than `||` in JS, so
the condition evaluates correctly without explicit parentheses. Code style issue only.

---

## Summary

| ID | Description | Severity |
|----|-------------|----------|
| K1 | Phantom click guard (`e.detail === 0`) | HIGH |
| K2 | `dragStart` useState race condition | CRITICAL |
| K3 | Special tile instant pop-in (`animY` at final position) | HIGH |
| N1 | Stale dragStart closure at drag end (variant of K2) | MEDIUM |
| N2 | `comboRef` stale in cascade generations | MEDIUM |
| N3 | Special detection reads pre-swap grid at activateSpecialCombination | MEDIUM |
| N4 | Game-end useEffect / setTimeout timing race | MEDIUM |
| N5 | `requestAnimationFrame` loop torn down on every grid change | LOW |

**Architecture note:** Because this file is standalone HTML with CDN React (not a Vite
module), the v11 fixes cannot be directly ported — they need to be adapted to plain JS
(no JSX, no import/export). Any fixes should be applied within the `<script>` tag and
tested by opening the file directly in a browser. The render tree uses
`React.createElement(...)` directly rather than JSX.

**Derived from phone-341:** This file was adapted from match3-v10.5.4-phone-341px.jsx.
The two critical bugs present in phone-341 were fixed in the adaptation:
- `restartGame` closing brace is present (phone-341 Bug N1 — not present here)
- Only one `processMatches` definition (phone-341 Bug N2 duplicate — not present here)
