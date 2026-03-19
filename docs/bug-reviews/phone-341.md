# Bug Review: match3-v10.5.4-phone-341px.jsx

Reviewed: 2026-03-18
Reviewer: Claude Code (automated)

---

## Known Bugs (from tablet v11 review)

### Bug K1 — dragStart useState race condition (HIGH)
**Lines:** 730, 1276–1278

`dragStart` is `useState`. Rapid touchmove events before React re-renders can cause `attemptSwap` to fire multiple times with stale coordinates, skipping moves (2→0 skip bug).

**Fix:** Replace with `useRef`; clear synchronously before `attemptSwap`.

---

### Bug K2 — e.detail phantom click guard (MEDIUM)
**Line:** 1214
`if (e.detail === 0) return;`

Unreliable on modern touch browsers — synthesized clicks emit `detail=1`.

**Fix:** Add `swapFiredRef` pattern (per tablet v11).

---

### Bug K3 — Special tile instant pop-in (MEDIUM)
**Line:** 2253
`_initAnimY: row * (TILE_SIZE + TILE_GAP)`

Sets animation start to final position; tile appears instantly instead of dropping.

**Fix:** Use `(row - 1) * (TILE_SIZE + TILE_GAP)` (per tablet v11.1).

---

## New Bugs

### Bug N1 — CRITICAL: Syntax error — missing closing brace in restartGame (CRITICAL)
**Line:** ~2512

`restartGame` is missing its closing `};`. This is a syntax error that prevents the component from compiling. The game will fail to load entirely.

---

### Bug N2 — Duplicate processMatches definition / dead code (HIGH)
**Lines:** 1483, 1521

`processMatches` is defined twice. The first definition (lines 1483–1518) is fully shadowed by the second and never executes. This indicates a merge error. If the second definition is ever removed or renamed, behavior silently reverts to the shadowed version.

---

### Bug N3 — fillEmptySpaces emptyCount decremented in wrong direction (MEDIUM)
**Lines:** 2300–2316

`emptyCount` is totalled once (top-to-bottom), then decremented as each empty slot is filled. The topmost empty slot gets the largest negative offset; lower slots get smaller offsets. This is the reverse of a natural falling column (lower gaps should start closer to the board).

---

### Bug N4 — Combo double-counts L-shape matches (MEDIUM)
**Lines:** 1335, 2326

`comboIncrease = matchGroups.length + lShapeMatches.length`. An L-shape contributes 2 matchGroups (one horizontal, one vertical) AND 1 entry in `lShapeMatches`, so the same physical match increments the combo by 3 instead of 2.

---

### Bug N5 — Game-end / bonus move race condition (MEDIUM)
**Lines:** 852–854

The pending-threshold guard (`pendingThreshold > bonusMoveThresholdRef.current`) tries to defer game-end until bonus moves are awarded, but both effects depend on `score` and can fire in the same render cycle. If a player reaches the target score exactly at a `BONUS_MOVE_INTERVAL` boundary, the bonus move flash may be lost.

---

### Bug N6 — Missing special combo case: line + cross (LOW)
**Lines:** 1719–1722 (combo routing)

The combo switch uses `[type1, type2].sort().join('+')`. The combination `'cross+line'` (alphabetical sort) does not appear to have an explicit handler — it falls through to the generic fallback that activates both specials individually.

---

### Bug N7 — L-shape detection O(n²) with potential double-detection (LOW)
**Lines:** 1414–1428

The nested loop that finds L-shape intersections is O(matchGroups²). For a board with many simultaneous matches this grows quadratically. Additionally, if the same pair of groups can be matched through multiple shared tiles, the same intersection could be pushed twice.

---

### Bug N8 — comboRef partial stale-closure fix (MEDIUM)
**Lines:** 1335, 2332

`attemptSwap` passes `comboIncrease` directly; `fillEmptySpaces` passes `comboRef.current + comboIncrease`. If React has not yet committed the state update from `setCombo(comboIncrease)` before the first cascade fires, `comboRef.current` is stale and cascade multipliers are wrong.

---

### Bug N9 — animStateRef tile ID collision possible (LOW)
**Line:** 2248, 1116

Special tile IDs are `special-${row}-${col}-${Date.now()}`. Multiple specials created in the same millisecond (common during cascades) share the same timestamp and could collide, causing one tile to inherit another tile's animation position.

---

## Summary

| ID | Description | Severity |
|----|-------------|----------|
| K1 | `dragStart` useState race condition | HIGH |
| K2 | Phantom click guard (`e.detail === 0`) | MEDIUM |
| K3 | Special tile instant pop-in (`_initAnimY`) | MEDIUM |
| N1 | **Missing closing brace in restartGame — syntax error** | CRITICAL |
| N2 | Duplicate `processMatches` definition (dead code) | HIGH |
| N3 | fillEmptySpaces emptyCount direction wrong | MEDIUM |
| N4 | Combo double-counts L-shapes | MEDIUM |
| N5 | Game-end / bonus move race condition | MEDIUM |
| N6 | Missing `line+cross` special combo handler | LOW |
| N7 | L-shape detection O(n²) / double detection | LOW |
| N8 | comboRef partial stale-closure | MEDIUM |
| N9 | animStateRef ID collision | LOW |

**Action required before shipping phone-341:** Bug N1 (syntax error) must be fixed; the file will not compile as-is.
