# Banked Moves — Design Doc

Last updated: 2026-03-20 (v2 — all questions resolved)
Status: COMPLETE

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

### Bonus Round Prompt (unchanged)
- When score ≥ target AND regular moves > 0: **bonus prompt** appears as before —
  "Bonus Round" or "End Early"
- The bonus round is the primary mechanism for earning bonus moves when the target
  is reached with regular moves remaining
- Bonus prompt behavior is unchanged; this is separate from the save/spend flow below

### Bonus Moves Accrual
- Bonus moves accrue silently to their own counter throughout the game as score
  crosses 10k intervals (`CAMPAIGN_BONUS_MOVE_INTERVAL` / `BONUS_MOVE_INTERVAL`)
- No decision is required at the moment bonus moves are earned
- Counter is always visible in the header (🏦)

### Decision Point — Regular Moves = 0
- When regular moves hit 0, behavior depends on bonus moves pool:
  - **Pool > 0**: two-button prompt — **"Use extra moves"** or **"Save moves / End level"**
  - **Pool = 0**: normal game over / level complete (no change from current behavior)

### "Use Extra Moves" Flow
- Draws from the bonus moves pool; play continues
- A persistent **"End level"** button appears in the banner
- Player can end at any time; when they do (or pool exhausts), remaining bonus moves
  are banked/carried:
  - **Arcade**: remaining bonus moves → `match3_bankedMoves` (persistent localStorage)
  - **Campaign**: remaining bonus moves → `match3_campaign_bonusMoves` (carry to next level)

### "Save Moves / End Level" Flow
- Ends the game/level immediately
- All bonus moves in the pool are banked/carried (same arcade vs. campaign split above)
- Score stands as-is — no conversion bonus

### Accumulation
- Banked moves accumulate across games (save 3 in game 1, save 5 in game 2 → 8 banked)
- Subject to the 25-move cap
- Only **bonus moves** (earned via score intervals) are saveable — initial starting moves
  are never banked

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

## DECIDED — Game Flow (resolved 2026-03-20)

| Question | Decision |
|---|---|
| Q1 — What happens after saving? | Game ends immediately; all bonus moves in pool are banked. Score stands as-is. |
| Q2 — How are banked moves spent? | At regular moves=0, player chooses "Use extra moves" (draws from pool) or "Save moves / End level". Not at game start; not automatic. |
| Q3 — Score treatment when saving | Current score only — no conversion bonus. |
| Q4 — Which moves are saveable? | Only bonus moves (earned via score intervals). Initial starting moves are never banked. |

---

## Implementation Touchpoints (when ready)

| Location | Change | Status |
|---|---|---|
| Constants block | `BANKED_MOVES_CAP`, `BANKED_MOVES_WARN` | Ready |
| State declarations | `bankedMoves` (from localStorage) | Ready |
| `useEffect` | Persist `bankedMoves` on change | Ready |
| `addBankedMoves(n)` helper | Cap logic, returns actual amount added | Ready |
| Header render | Banked moves counter with color warning | Ready |
| Bonus prompt UI | Unchanged — "Bonus Round" / "End Early" | Ready |
| Moves=0 handler | "Use extra moves" / "Save moves / End level" prompt (if bonus pool > 0) | Ready to implement |
| `useExtraMoves()` function | Draw from bonus pool, show "End level" banner button | Ready to implement |
| `saveMoves()` function | Bank all bonus pool moves, end game, score as-is | Ready to implement |
| `restartGame()` | No change — banked moves are NOT applied at game start | Ready |
| `recordGameResult()` | Increment `movesSaved` in stats when saving | Ready to implement |

---

## Relationship to Stats Feature

- `match3_stats.movesSaved` will track total moves ever banked (lifetime)
- Each game history entry will include `endType: 'savedMoves'` when applicable
- Admin panel will show banked moves balance + moves-saved-per-game trend
