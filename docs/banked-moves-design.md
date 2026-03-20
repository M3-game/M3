# Banked Moves — Design Doc

Last updated: 2026-03-20
Status: PARTIAL — game flow decisions pending (see Open Questions)

---

## What This Feature Is

A persistent move-savings system. Players can bank unused moves from a completed
game and carry them forward to future games. Banked moves are tracked separately
from regular moves and never automatically merged into the regular move pool.

---

## DECIDED

### Storage
- localStorage key: `match3_bankedMoves` (integer, standalone — not part of stats JSON)
- Separate from `match3_stats`; it is live game state, not history

### Cap & Warning
- Hard cap: **25 banked moves**
- Warning threshold: **20 banked moves** (counter turns amber)
- At cap: `addBankedMoves()` is a no-op; UI should communicate this clearly
- Counter turns red at cap

### On-Screen Display
- Two separate counters always visible in the header during play:
  - `Moves: 18` (regular — current game only)
  - `🏦 7` (banked — persists across games)
- Banked moves are **NOT** added to the regular move counter
- Banked counter color: normal → amber at 20 → red at 25

### Entry Point
- A "Save Moves" option is presented at the **bonus prompt banner**
  (the same moment that currently offers "Bonus Round" and "End Early")
- The game **can continue** after saving — saving is not necessarily a game-ending action

### Accumulation
- Banked moves accumulate across games (save 3 in game 1, save 5 in game 2 → 8 banked)
- Subject to the 25-move cap

### Helper: `addBankedMoves(n)`
- Reads current banked total from state
- Applies cap: actual amount added = `Math.min(n, BANKED_MOVES_CAP - current)`
- Updates state + localStorage
- Returns actual amount added (so caller can show "saved 3 of 5" if capped)

### Constants (to add near top of file)
```js
const BANKED_MOVES_CAP = 25;
const BANKED_MOVES_WARN = 20;
```

---

## UNDECIDED — Open Questions

### Q1: What happens to the current game after saving?

Three options identified; user to decide:

**Option A — Save ends the game (simplest)**
- Saving banks all remaining `moves`
- Game ends immediately (like "End Early" but no move-to-score conversion)
- Score stands as-is (specials bonus still cashed out — TBD, see below)
- "Continue" means the banked moves carry forward to future games, not that
  this game keeps going

**Option B — Save + Bonus Round (most generous)**
- Saving banks a portion of remaining moves AND starts the bonus round with
  the rest
- Player explicitly splits their move pool (e.g., save 5, play bonus round
  with 3 remaining)
- Requires a split UI (stepper or preset options)

**Option C — Save at end of bonus round**
- Player starts the bonus round normally
- Any moves unused at the end of the bonus round are automatically banked
  (instead of being lost)
- No new decision point — saving is passive/automatic
- Simplest UX, but player has least control

### Q2: How are banked moves spent?

Three sub-options; user to decide:

**Option A — Applied at game start only**
- `restartGame()` reads banked moves, shows "🏦 +8 saved moves applied" indicator
- Banked moves are transferred to regular moves at start and bank is cleared
- Simplest; banked moves essentially become a starting-move bonus

**Option B — Manual spend mid-game**
- Banked pool stays separate throughout the game
- A button (e.g., "+5 from bank") appears when regular moves are running low
- Player actively converts banked → regular when they choose
- More strategic; requires spend UI

**Option C — Automatic fallback**
- When regular moves hit 0, game offers "Use banked moves?" before game-over
- Draws from bank automatically in increments (e.g., 5 at a time)
- Middle ground between A and B

### Q3: Score treatment when saving (relevant to Q1 Options A & B)

When a player saves moves, what score do they walk away with?
- Current score only (no bonuses)? — penalizes saving
- Current score + specials bonus? — matches "End Early" behavior
- Some fraction of the move bonus? — would need a formula

### Q4: How many moves are saveable?

- All remaining `moves` at the time of saving?
- Only "bonus-awarded" moves (those earned via `BONUS_MOVE_INTERVAL`) — not
  the initial random starting moves?
- A fixed maximum per game (e.g., save up to 5 per game regardless of remaining)?

The distinction matters for balance: if the initial 18–24 moves are saveable,
a skilled player could rapidly accumulate the cap.

---

## Implementation Touchpoints (when ready)

| Location | Change | Status |
|---|---|---|
| Constants block | `BANKED_MOVES_CAP`, `BANKED_MOVES_WARN` | Ready |
| State declarations | `bankedMoves` (from localStorage) | Ready |
| `useEffect` | Persist `bankedMoves` on change | Ready |
| `addBankedMoves(n)` helper | Cap logic, returns actual amount added | Ready |
| Header render | Banked moves counter with color warning | Ready |
| Bonus prompt UI | "Save Moves" button + count display | Blocked on Q1 |
| `saveMoves()` function | Game flow after saving | Blocked on Q1, Q3, Q4 |
| `restartGame()` | Apply/clear banked moves | Blocked on Q2 |
| `recordGameResult()` | Increment `movesSaved` in stats | Blocked on Q1 |

---

## Relationship to Stats Feature

- `match3_stats.movesSaved` will track total moves ever banked (lifetime)
- Each game history entry will include `endType: 'savedMoves'` when applicable
- Admin panel will show banked moves balance + moves-saved-per-game trend
