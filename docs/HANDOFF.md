# M3 Bug Fix Handoff

Last updated: 2026-03-19

## What has been done

### Tablet (COMPLETE)
- `platforms/tablet/match3-v11.1-tablet.jsx` — active, deployed to GitHub Pages
- Fix 1: `dragStart` useState → useRef (2→0 move skip bug)
- Fix 2: `swapFiredRef` pattern for phantom click after touch drag
- Fix 3: Special tile `animY` starts one tile-height above final position
- `src/main.jsx` points to v11.1

### Phone-341 (COMPLETE)
- `platforms/phone-341/match3-v11-phone-341px.jsx`
- Same fixes 1–3 as tablet
- Fix 4: Removed duplicate `processMatches` definition (dead code)
- Fix 5: Added missing closing brace in `restartGame` (was a syntax error — file did not compile)

### Bug reviews (all committed to docs/bug-reviews/)
- `desktop.md` — 3 known + 10 new bugs
- `phone-341.md` — updated to reflect fixes applied
- `phone-418.md` — 3 known + 4 new bugs; note standalone HTML file
- `timeattack.md` — 3 known + 7 new bugs; time-extension cap is highest priority

---

## What still needs fixing

### Desktop — `platforms/desktop/match3-v10.5.4-desktop.jsx`
Next version: `match3-v10.6-desktop.jsx` (or `v11-desktop.jsx` — follow existing naming)

Key fixes needed (in priority order):
1. **K2** `dragStart` useState → useRef (line 623) — same pattern as tablet v11 Fix 1
2. **K1** `swapFiredRef` phantom click guard (line 1037) — same as tablet v11 Fix 2
3. **K3** Special tile `_initAnimY` at final position (lines 2099–2100) — same as tablet v11.1 Fix 3
4. **N6** `fillEmptySpaces` emptyCount direction — **RE-EVALUATE**: this was flagged HIGH by
   automated agent but on manual analysis appears to produce correct synchronized-drop
   animation. Do NOT fix without verifying it looks wrong in practice.
5. Other N-bugs from `docs/bug-reviews/desktop.md` are medium/low priority

### Time-attack — `platforms/timeattack/match3-v10.6.2-desktop-timeattack.jsx`
Next version: increment patch or use v11 naming

Key fixes needed:
1. **K2** `dragStart` useState → useRef (line 761)
2. **K1** `swapFiredRef` phantom click guard (line 1251)
3. **K3** Special tile `_initAnimY` (lines 2325–2334)
4. **N1** No cap on time extensions per cascade (lines 1566–1568, 2336) — HIGH, game balance
5. **N2** Multiple `addTimeExtension` calls from independent triggers (lines 881–889, 1567)

### Phone-418 — `platforms/phone-418/match3-v10.5.4-418px-phone.html`
IMPORTANT: This is a standalone HTML file — React loaded from CDN, no JSX transpiler.
All fixes must be plain JavaScript. Use `dragStart.current` pattern but without import/export.
The render tree uses `React.createElement(...)` directly.

Key fixes needed:
1. **K2** `dragStart` useState → useRef (line 759)
2. **K1** `swapFiredRef` phantom click guard (line 1241)
3. **K3** Special tile `animY` at final position (lines 2217–2218) — uses `animY` not `_initAnimY`
4. **N2** `comboRef` stale in cascade generations (line 2297)

---

## Fix patterns (copy these exactly)

### Fix 1 — dragStart useRef

Replace:
```js
const [dragStart, setDragStart] = useState(null);
```
With:
```js
const dragStart = useRef(null);          // Fix 1: synchronous clear prevents double-swap
const swapFiredRef = useRef(false);      // Fix 2: blocks phantom click after drag-swap
```

In `handleDragStart`: replace `setDragStart({ row, col, x, y })` with `dragStart.current = { row, col, x, y }`

In `handleDragMove`: replace all `dragStart.x/y/row/col` with `dragStart.current.x/y/row/col`,
replace `setDragStart(null)` with the capture-then-clear pattern:
```js
const { row: startRow, col: startCol } = dragStart.current;
dragStart.current = null;
swapFiredRef.current = true;
setTimeout(() => { swapFiredRef.current = false; }, 300);
setSelectedTile(null);
attemptSwap(startRow, startCol, targetRow, targetCol);
```

In `handleDragEnd`: replace `if (dragStart)` with `if (dragStart.current)`,
replace `setDragStart(null)` with `dragStart.current = null`

### Fix 2 — phantom click guard

Replace:
```js
if (e.detail === 0) return;
```
With:
```js
if (swapFiredRef.current || e.detail === 0) return;
```

### Fix 3 — special tile animation

In `removeMatches`, inside `specialsToCreate.forEach(...)`:

Replace:
```js
_initAnimY: row * (TILE_SIZE + TILE_GAP)
```
With:
```js
_initAnimY: (row - 1) * (TILE_SIZE + TILE_GAP)
```
(For phone-418, the field is `animY` not `_initAnimY` — same value.)

---

## Repo / build notes
- Vite project, `npm run build`, deploys to GitHub Pages via `.github/workflows/deploy.yml`
- Base path: `/M3/` — set in `vite.config.js`
- Tests: `npm test` — Vitest, pure logic only, all passing
- Archive convention: always move current file to `platforms/<platform>/archive/` before
  creating the new versioned file. Never overwrite.
- `src/main.jsx` only needs updating if the tablet version changes (it's the deployed entry point)
