# Bug Review: match3-v10.6.2-desktop-timeattack.jsx

Reviewed: 2026-03-18
Reviewer: Claude Code (automated)

---

## Known Bugs (from tablet v11 review)

### Bug K1 — dragStart useState race condition (HIGH)
**Line:** 761
`const [dragStart, setDragStart] = useState(null);`

Rapid mousemove/touchmove events before React re-renders can call `attemptSwap` multiple times. In time-attack mode this wastes precious seconds and breaks combos.

**Fix:** Replace with `useRef`; clear synchronously before `attemptSwap`.

---

### Bug K2 — e.detail phantom click guard (MEDIUM)
**Line:** 1251
`if (e.detail === 0) return;`

Modern browsers emit `detail=1` for touch-synthesized clicks after a drag-swap, so the guard fails.

**Fix:** Add `swapFiredRef` pattern (per tablet v11).

---

### Bug K3 — Special tile instant pop-in (MEDIUM)
**Lines:** 2325–2334
`_initAnimY: row * (TILE_SIZE + TILE_GAP)`

Sets animation start to final position; tile appears instantly.

**Fix:** Use `(row - 1) * (TILE_SIZE + TILE_GAP)` (per tablet v11.1).

---

## New Bugs

### Bug N1 — No cap on time extensions per cascade (HIGH)
**Lines:** 1566–1568, 2336

Every special tile created during a cascade calls `addTimeExtension('+5s ...')`. A single large cascade can create 5–10 specials, adding 25–50 seconds. There is no per-turn or per-cascade cap, so a player who triggers a chain reaction can effectively extend the game indefinitely.

**Suggested fix:** Track time added per turn; cap at e.g. +15 s or +20 s per player action.

---

### Bug N2 — Multiple addTimeExtension calls from independent triggers (MEDIUM)
**Lines:** 881–889, 1567

`addTimeExtension` is called from:
1. Score milestone useEffect (every `TIME_EXTENSION_SCORE_INTERVAL` points)
2. `processMatches` when `combo >= 5`
3. `removeMatches` when a special is created
4. `activateSpecialCombination` when specials chain

A cascade that hits a score milestone and has combo ≥ 5 simultaneously triggers conditions 1 and 2, awarding +5 s twice for the same event.

---

### Bug N3 — Timer setInterval re-created on every score change (LOW)
**Lines:** 822–848

The timer `useEffect` depends on `[gameState, score, highScore]`. Every score update clears and recreates the `setInterval`, meaning the 1000 ms tick resets every time points land. Under heavy cascades (rapid score changes) the timer may effectively pause mid-cascade.

---

### Bug N4 — Timer boundary: game-end at `prev <= 1` skips 0:01 display (MEDIUM)
**Lines:** 826–845

The interval fires at `prev <= 1` and immediately sets time to 0, scheduling the game-end check in `setTimeout(100)`. If the player is mid-match when the clock transitions from 2 to 1, the display skips from 0:02 to 0:00 without showing 0:01, and the player may complete 1–2 more moves before the end check fires.

---

### Bug N5 — Duplicate time extension popups (LOW)
**Lines:** 892–910

Both `addTimeExtension` and `addTimeExtensionPopup` push to the same `timeExtensions` array without duplicate checking. A cascade that simultaneously triggers multiple conditions (combo, milestone, special created) produces visually stacked identical popup messages.

---

### Bug N6 — Cascade continues after game end (LOW)
**Lines:** 2410–2434

`fillEmptySpaces` does not check `gameState` before recursing into `processMatches`. If the timer expires mid-cascade, animations and match processing continue for 0.5–1 s before the game-over screen appears.

---

### Bug N7 — Combo does not reset cleanly between rapid moves (LOW)
**Lines:** 2413–2419, 2426

Combo is reset at line 2426 only when no further matches are found. If a player makes two swaps within ~2 s while a cascade is still animating, the combo from move 1 carries forward into move 2, inflating the multiplier and producing higher-than-intended scores.

---

## Summary

| ID | Description | Severity |
|----|-------------|----------|
| K1 | `dragStart` useState race condition | HIGH |
| K2 | Phantom click guard (`e.detail === 0`) | MEDIUM |
| K3 | Special tile instant pop-in (`_initAnimY`) | MEDIUM |
| N1 | No cap on time extensions per cascade | HIGH |
| N2 | Multiple `addTimeExtension` calls per event | MEDIUM |
| N3 | Timer interval resets on every score update | LOW |
| N4 | Timer skips 0:01 display / late game-end | MEDIUM |
| N5 | Duplicate time extension popups | LOW |
| N6 | Cascade continues after game end | LOW |
| N7 | Combo carries over between rapid moves | LOW |

**Time-attack–specific priority:** N1 (uncapped time extensions) and N2 (double-award on same event) most directly affect game balance and should be fixed before release.
