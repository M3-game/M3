# Admin Panel — Spec & Design Decisions

Created: 2026-03-20

---

## Overview

The admin panel is a developer-facing overlay for monitoring game balance and
reviewing per-game statistics. It is intentionally hidden from regular players.

**File:** `core/AdminPanel.jsx`
**Type:** Standalone React component — reads localStorage directly, no game
state dependencies. Can be imported into any platform file.

---

## Access Methods

Two independent triggers, both wired up by the host platform file:

### 1. URL parameter
Append `?admin=1` to the game URL:
```
http://localhost:5173?admin=1
https://m3-game.github.io/M3/?admin=1
```
Checked once on mount via `useState(() => new URLSearchParams(window.location.search).get('admin') === '1')`.
Panel opens immediately on load. Closing it sets `showAdmin` to false but does
not remove the URL param — refreshing will reopen it.

### 2. Secret gesture
Long-press the score counter in the game header for **1.5 seconds**.
Implemented via `onPointerDown` / `onPointerUp` / `onPointerLeave` on the
score `<div>`, using `adminPressTimerRef` to hold the timeout.
Works on both mouse and touch.

---

## Design Decisions

| Decision | Choice | Reason |
|---|---|---|
| File location | `core/AdminPanel.jsx` | Shared across all platforms; reads only from localStorage so has no platform dependencies |
| Access method | URL param + secret gesture (both) | URL param for desktop dev workflow; gesture for on-device testing without changing the URL |
| Stats storage | Single `match3_stats` JSON object | Easier to extend than individual keys; atomic read/write; one DevTools expand to inspect |
| History cap | 50 entries (ring buffer) | Enough for trend analysis; limits localStorage size |
| Styling | Dark monospace theme, inline styles | Self-contained — no CSS file dependency; monospace suits a dev tool |
| Constants | Passed as props from host | AdminPanel cannot import game constants directly (they live in the game component file, not exported) |
| Export | JSON file download | Lets developer snapshot stats before clearing; standard browser download API |
| Clear | Two-tap confirm (3s timeout) | Prevents accidental wipe |

---

## Props

```jsx
<AdminPanel
  onClose={fn}          // required — called when panel is dismissed
  constants={{          // optional — key/value pairs displayed in Constants section
    BASE_TARGET: 5000,
    TARGET_VARIANCE: 1500,
    MIN_MOVES: 18,
    MAX_MOVES: 24,
    BONUS_MOVE_INTERVAL: 10000,
    BANKED_MOVES_CAP: 25,
    BANKED_MOVES_WARN: 20,
  }}
/>
```

---

## Sections

### Balance Health
Key metrics for deciding whether score targets need adjustment.

| Metric | How computed |
|---|---|
| Win rate — all time | `gamesWon / gamesPlayed` |
| Win rate — last 20 games | wins in `history.slice(-20)` |
| Avg score vs target (wins) | mean of `finalScore / levelTarget` across all won games |
| Avg score vs target (losses) | mean of `finalScore / levelTarget` across all lost games |
| Bonus round uptake (of wins) | `bonusRoundsTaken / gamesWon` |
| Early end rate (of wins) | `earlyEnds / gamesWon` |

**Auto-recommendation flag** (shown when ≥10 games played):
- Win rate (last 20) > 80% → amber: "consider raising BASE_TARGET"
- Win rate (last 20) < 35% → red: "consider lowering BASE_TARGET or adding moves"
- Otherwise → green: "win rate in healthy range (35–80%)"

### Difficulty Ramp
Tracks how difficulty accumulates over time.

| Metric | How computed |
|---|---|
| Avg level target (last 10) | mean of `levelTarget` in `history.slice(-10)` |
| Avg difficulty bonus (last 10) | mean of `difficultyBonus` in `history.slice(-10)` |
| Banked moves (current) | read from `match3_bankedMoves` key |

### Constants Reference
Read-only display of the values passed via the `constants` prop. Lets the
developer see what the game is currently configured with without opening the
source file.

### Game History
Expandable table of the last 50 games (most recent first).

Columns: `#`, `Result`, `Score`, `Target`, `%` (score/target), `Type` (endType),
`Combo`, `Date`

Collapsed by default to keep the panel compact on first open.

### Actions

- **Export JSON** — downloads `match3-stats-<timestamp>.json` containing
  `match3_stats`, current `match3_bankedMoves`, legacy high score keys, and
  an `exportedAt` timestamp.
- **Clear stats** — removes `match3_stats` from localStorage. Requires a
  second tap within 3 seconds to confirm. Does NOT clear `match3_bankedMoves`
  or legacy keys.
- **Close** — calls `onClose` prop.

---

## Exports

```js
import AdminPanel, { defaultStats, STATS_KEY, BANKED_KEY } from '../../core/AdminPanel.jsx';
```

| Export | Type | Purpose |
|---|---|---|
| `default` (AdminPanel) | React component | The panel itself |
| `defaultStats` | function `() => object` | Returns a zeroed stats object — used by `recordGameResult()` in host files to safely initialise `match3_stats` |
| `STATS_KEY` | string | `'match3_stats'` — localStorage key |
| `BANKED_KEY` | string | `'match3_bankedMoves'` — localStorage key |

---

## How the host file wires it up (tablet example)

```jsx
// 1. Import
import AdminPanel, { defaultStats, STATS_KEY, BANKED_KEY } from '../../core/AdminPanel.jsx';

// 2. State
const [showAdmin, setShowAdmin] = useState(
  () => new URLSearchParams(window.location.search).get('admin') === '1'
);
const adminPressTimerRef = useRef(null);

// 3. Score counter with long-press gesture
<div
  onPointerDown={() => { adminPressTimerRef.current = setTimeout(() => setShowAdmin(true), 1500); }}
  onPointerUp={() => clearTimeout(adminPressTimerRef.current)}
  onPointerLeave={() => clearTimeout(adminPressTimerRef.current)}
>
  Score: {score}
</div>

// 4. Render panel
{showAdmin && (
  <AdminPanel
    onClose={() => setShowAdmin(false)}
    constants={{ BASE_TARGET, TARGET_VARIANCE, MIN_MOVES, MAX_MOVES, BONUS_MOVE_INTERVAL }}
  />
)}
```

---

## Platform status

| Platform | AdminPanel wired? |
|---|---|
| Tablet v11.2 | ✅ Yes |
| Desktop v11 | ❌ Not yet |
| Time-attack v11 | ❌ Not yet |
| Phone-341 v11 | ❌ Not yet |
| Phone-418 v11 | ⚠ Standalone HTML — import not possible; approach TBD |

---

## Stats recording — `recordGameResult()`

Each host platform file contains a local `recordGameResult({ endType, finalScore, won })`
function that writes to `match3_stats`. It is NOT part of AdminPanel itself —
AdminPanel only reads. The function is defined near the other game helpers and
called at every game-end code path.

```js
const recordGameResult = ({ endType, finalScore, won }) => {
  try {
    const raw = localStorage.getItem(STATS_KEY);
    const stats = raw ? { ...defaultStats(), ...JSON.parse(raw) } : defaultStats();
    stats.gamesPlayed++;
    if (won) stats.gamesWon++; else stats.gamesLost++;
    if (endType === 'bonusRound') stats.bonusRoundsTaken++;
    if (endType === 'earlyEnd')   stats.earlyEnds++;
    if (endType === 'savedMoves') stats.movesSaved++;
    stats.history = [...stats.history.slice(-49), {
      ts: Date.now(), won, finalScore,
      levelTarget, movesRemaining: moves,
      endType, difficultyBonus, maxCombo: maxComboReached,
    }];
    localStorage.setItem(STATS_KEY, JSON.stringify(stats));
  } catch (e) { /* fail silently — localStorage full or parse error */ }
};
```

Call sites in the tablet file:
- `endLevelEarly()` → `endType: 'earlyEnd'`
- game-end useEffect, bonus round path → `endType: 'bonusRound'`
- game-end useEffect, plain win path → `endType: 'won'`
- game-end useEffect, game over path → `endType: 'lost'`
- `saveMoves()` (future) → `endType: 'savedMoves'`
