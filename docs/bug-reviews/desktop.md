# Bug Review: match3-v10.5.4-desktop.jsx

Reviewed: 2026-03-18
Reviewer: Claude Code (automated)

---

## Known Bugs (from tablet v11 review)

### Bug K1 — e.detail phantom click guard (HIGH)
**Line:** 1037
`if (e.detail === 0) return;`

Modern browsers emit `detail=1` for touch-synthesized clicks after a drag-swap, so this guard fails. A phantom click registers immediately after a drag, potentially selecting a tile or triggering a second `attemptSwap`.

**Fix:** Add a `swapFiredRef` pattern (per tablet v11 fix): set a ref synchronously when a drag-swap fires, block the next click in the handler, and clear the ref after 300 ms.

---

### Bug K2 — dragStart useState race condition (MEDIUM)
**Lines:** 623, 1072, 1099, 1106–1107

`dragStart` is React state (`useState`). Rapid mousemove/touchmove events can arrive before React re-renders, so `attemptSwap` may fire multiple times with stale drag coordinates.

**Fix:** Replace `useState` with `useRef` for `dragStart` and clear it synchronously (`dragStart.current = null`) before calling `attemptSwap`.

---

### Bug K3 — Special tile instant pop-in (HIGH)
**Lines:** 2099–2100
`_initAnimY: row * (TILE_SIZE + TILE_GAP)`

Initial animation Y is set to the tile's final grid position, so the animation system seeds from the destination and the tile appears instantly. Regular tiles and new fill tiles correctly start above the board.

**Fix:** Set `_initAnimY: (row - 1) * (TILE_SIZE + TILE_GAP)` (per tablet v11.1 fix).

---

## New Bugs

### Bug N1 — Unrecognized special combo fallback is broken (MEDIUM)
**Lines:** 1650–1670

The fallback for unrecognized special combos calls `activateSpecialTile` twice using the original `currentGrid` for both calls. The second activation does not see tiles cleared by the first, which can double-count points on overlapping areas.

---

### Bug N2 — Bonus move/game-end useEffect race condition (MEDIUM)
**Lines:** 717–731, 735–795

The bonus-move-award effect and the game-end check both depend on `score`/`turnComplete` and can fire simultaneously. A turn that simultaneously ends and crosses a `BONUS_MOVE_INTERVAL` boundary can leave `bonusMoveFlashPendingRef` unflushed.

---

### Bug N3 — Bonus round multiplier applied at inconsistent pipeline stages (MEDIUM)
**Lines:** 1323–1329, 1766, 1982

For regular matches the `bonusRoundActive` multiplier is applied in `processMatches`. For cascade specials it is applied again in `removeMatches` after the cascade multiplier. The double-application path is fragile and can produce inconsistent point totals during bonus rounds.

---

### Bug N4 — Duplicate tiles in matches array for L-shape intersections (LOW)
**Lines:** 1209–1234

The horizontal scan unconditionally pushes to `matches` and marks the `visited` set. The vertical scan checks `visited` before pushing, but intersection tiles are still added to `matchGroups[].tiles` for both directions. Downstream deduplication (via `Set`) hides the issue but the data is inconsistent.

---

### Bug N5 — Gravity overwrite risk for repeated tile IDs (MEDIUM)
**Lines:** 2110–2141

`applyGravity` overwrites `animStateRef.current[tileId].animY` unconditionally. If two tiles somehow share an ID (e.g., `Date.now()` collision on the same millisecond), the second tile's animation start position is destroyed.

---

### Bug N6 — fillEmptySpaces emptyCount is decremented in wrong direction (HIGH)
**Lines:** 2146–2164

`emptyCount` is tallied top-to-bottom, then used as-is for the first empty slot and decremented for each subsequent one. This assigns the largest above-board offset to the top-most empty slot and progressively smaller offsets to lower slots — the opposite of a natural falling column. New tiles at the bottom of a gap start too high and appear to fall too short.

---

### Bug N7 — Bonus move threshold only checks highest crossed boundary (MEDIUM)
**Lines:** 720–731

The formula `(threshold - bonusMoveThresholdRef.current) / BONUS_MOVE_INTERVAL` counts how many intervals were crossed if `score` jumps by more than `BONUS_MOVE_INTERVAL` in one update. However the `threshold` variable is computed as `Math.floor(score / BONUS_MOVE_INTERVAL) * BONUS_MOVE_INTERVAL`, so only the highest crossed boundary is captured — intermediate boundaries are correct due to the subtraction, but the logic is easy to misread and fragile.

---

### Bug N8 — showBonusPrompt / bonus move flash interaction (MEDIUM)
**Lines:** 756–759, 725–728

Between `setShowBonusPrompt(true)` and the re-render, `showBonusPrompt` in the bonus-move effect closure is still `false`, so bonus move flashes are delivered via `setBonusMoveFlash` instead of queued in `bonusMoveFlashPendingRef`. When `startBonusRound` runs it finds the pending ref at 0 and does not re-flash.

---

### Bug N9 — Hypernova chainedSpecials relies on implicit empty array (LOW)
**Line:** 1481

The hypernova path has a comment `// No chainedSpecials — hypernova never touches specials` but relies on `addRegular` never adding specials to `tilesToClear`. An explicit `return { ..., chainedSpecials: [] }` would make the contract clear.

---

### Bug N10 — Cross+Line combo uses O(n²) duplicate check (LOW)
**Lines:** 1562–1576

The second loop in the cross+line combo calls `tilesToRemove.some(...)` for every candidate tile instead of using a Set. With a 10×12 board the overhead is ~14 000 comparisons per combo, then duplicates are stripped again at lines 1672–1681 anyway.

---

## Summary

| ID | Description | Severity |
|----|-------------|----------|
| K1 | Phantom click guard (`e.detail === 0`) | HIGH |
| K2 | `dragStart` useState race condition | MEDIUM |
| K3 | Special tile instant pop-in (`_initAnimY`) | HIGH |
| N1 | Fallback combo activates with stale grid | MEDIUM |
| N2 | Bonus move / game-end useEffect race | MEDIUM |
| N3 | Bonus round multiplier applied twice | MEDIUM |
| N4 | Duplicate tiles in matches array (L-shape) | LOW |
| N5 | Gravity tile ID overwrite risk | MEDIUM |
| N6 | fillEmptySpaces emptyCount direction wrong | HIGH |
| N7 | Bonus move threshold boundary logic fragile | MEDIUM |
| N8 | showBonusPrompt / flash interaction race | MEDIUM |
| N9 | Hypernova chainedSpecials implicit contract | LOW |
| N10 | Cross+Line combo O(n²) duplicate check | LOW |
