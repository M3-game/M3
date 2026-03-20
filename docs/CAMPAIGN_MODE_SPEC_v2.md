# Match-3 Campaign Mode - Design Specification
## Version 2.0

---

## Overview

Campaign Mode is an 8-level progression system where players advance through increasingly challenging levels with varying board sizes, move counts, and two time attack levels woven into the arc. Stars are earned based on score performance and gate access to the bonus and prestige levels. Bonus moves are earned through high scoring and carry over between levels, acting as a strategic resource.

This is a casual game — fun over difficulty. All TBDs are intentionally deferred pending gameplay testing, not missing decisions. Don't fill them in with assumptions. An 11-level version is planned but not in scope yet — don't architect for it.

---

## Level Structure

| Level | Type | Grid | Moves | Notes |
|-------|------|------|-------|-------|
| 1 | Standard | 8×10 | 12 | Tutorial feel — small board, limited moves |
| 2 | Standard | 10×12 | 20 | Step up in board size |
| 3 | Time Attack | — | 60 seconds | First time attack — lower score target |
| 4 | Standard | 10×12 | 20 | Mid-campaign standard level |
| 5 | Standard | 12×14 | 25 | Challenge ramp — large board |
| 6 | Time Attack | — | 2 minutes | Second time attack — full duration |
| 7 | Bonus | 12×14 | 25 | Gated — see unlock requirements |
| 8 | Prestige | 12×14 | 25 | Gated — see unlock requirements |

*Note: No level should feel smaller or easier than a previous one of the same type. Level 8 is the largest board available.*

---

## Target Scores

All point targets are **TBD pending gameplay analysis and testing.** The v1.0 formula-based targets (~46 points per tile) have been retired. Targets will be set empirically after observing real play sessions.

Placeholder structure (to be filled after testing):

| Level | Type | Target Score |
|-------|------|-------------|
| 1 | Standard 8×10 | TBD |
| 2 | Standard 10×12 | TBD |
| 3 | Time Attack 60s | TBD (expect lower than Level 6) |
| 4 | Standard 10×12 | TBD |
| 5 | Standard 12×14 | TBD |
| 6 | Time Attack 2min | TBD |
| 7 | Bonus 12×14 | TBD |
| 8 | Prestige 12×14 | TBD |

---

## Star System

All 8 levels award **1–5 stars** based on score performance. Maximum possible stars: **40**.

### Standard & Bonus Levels (Score vs. Target)

| Stars | Score Threshold |
|-------|----------------|
| ⭐ | 100% of target |
| ⭐⭐ | 115% of target |
| ⭐⭐⭐ | 130% of target |
| ⭐⭐⭐⭐ | 150% of target |
| ⭐⭐⭐⭐⭐ | 175% of target |

### Time Attack Levels (Score Achieved)

Star thresholds for Levels 3 and 6 are **TBD pending gameplay testing.** Since the player can continue scoring after hitting the target, star tiers should reflect meaningful score milestones above the base target, not just pass/fail.

*Design note: Time attack stars should feel achievable with good play but not trivial — they are part of the unlock path for Levels 7 and 8.*

---

## Level Unlock Requirements

### Levels 1–6
No unlock gate. Players advance sequentially on a win.

### Level 7 (Bonus) — Either/Or
- Earn **3+ stars** on Level 5 **OR** Level 6, OR
- Earn **~18–20 stars** total across Levels 1–6 (exact threshold TBD)

*Rationale: Requiring high scores on both Level 5 and 6 would make it pointless to continue after a poor Level 5 result. Either path keeps both levels meaningful. The star total is always accumulating as a background safety net.*

### Level 8 (Prestige) — Any One Of
- Hit a high score threshold on Level 7 (TBD), OR
- Hit a cumulative score total across all 7 levels (TBD), OR
- Earn **25+ stars** across Levels 1–7

*Rationale: 25 out of 40 possible stars (~63%) is accessible to an engaged casual player without requiring perfection. This should be reachable by roughly 40–50% of players on a first full playthrough.*

---

## Progression System

### Level Advancement

- **Win:** Advance to next level (or unlock gate check for Levels 7 and 8)
- **Lose:** Player choice:
  - **Retry Level** — Free, restart same level
  - **Start Over** — Reset to Level 1 (keeps high scores and star records)

### On Failing a Level

- Stars from previous attempts on that level are retained (best score counts)
- Bonus moves banked from prior levels are retained
- Supernova/Hypernova specials placed on the board are lost

---

## Bonus Move System

Bonus moves replace the retired Refresh and Shuffle power-ups as the primary between-level carry resource.

### Earning Bonus Moves

- **+1 bonus move per 10,000 points** scored during any level
- Earned bonus moves are added to the player's banked bonus move total at level end

### Bonus Move Behavior

- Displayed separately from the main move counter (e.g., `Moves: 20 | Bonus: +3`)
- **Consumed last** — main moves are used first; bonus moves extend play when the main counter hits zero
- Carry over from level to level, including through time attack levels
- Not lost on level failure (they were consumed during play if used)
- No expiration

### Bonus Moves in Time Attack Levels

- Bonus moves are **held in reserve** during time attack — they do not affect the timer while time remains
- If the **timer expires before the target is reached**, each banked bonus move activates automatically, adding **5 seconds** per move
- Unused bonus moves after a time attack level carry forward to the next level as normal

---

## Power-Up System

### Removed
- 🔄 Refresh — retired
- 🔀 Shuffle — retired

### Retained
- 🌌 Supernova — auto-placed on board at score threshold (TBD)
- 🌠 Hypernova — auto-placed on board at score threshold (TBD)

### Special Placement Rules (Unchanged)
- Auto-placed specials avoid outer 2 rows/columns
- Placed on a random non-special tile
- Valid area: inner board (rows 2 to ROWS-3, cols 2 to COLS-3)

### High Score Rewards (Thresholds TBD)
Structure retained from v1.0 pending threshold revision after gameplay testing:
- Supernova/Hypernova auto-placed at a high score milestone
- Additional random special tiles (line/bomb/cross) at further milestones
- Exact point thresholds to be set after testing

---

## Level Transition Screen

Displayed between levels on a win. Should include a **brief star fanfare** — satisfying but not prolonged.

```
┌─────────────────────────────────────┐
│         LEVEL 2 COMPLETE!           │
├─────────────────────────────────────┤
│  ⭐⭐⭐⭐☆                            │
│                                     │
│  Score: 6,240                       │
│  Target: 5,500 ✓                    │
│                                     │
│  Moves Used: 17/20                  │
│  Best Combo: x7                     │
│  Specials Created: 4                │
│                                     │
│  Bonus Moves Earned: +2             │
│  Bonus Moves Banked: 5              │
├─────────────────────────────────────┤
│         [NEXT LEVEL →]              │
└─────────────────────────────────────┘
```

### Info Shown
1. Level number and status
2. Stars earned this level (with light fanfare animation)
3. Final score vs target
4. Moves efficiency
5. Best combo achieved
6. Specials created this level
7. Bonus moves earned this level
8. Total bonus moves now banked

---

## Game Over Screen

```
┌─────────────────────────────────────┐
│         LEVEL 5 FAILED              │
├─────────────────────────────────────┤
│  Score: 4,120                       │
│  Target: 5,800                      │
│  Best Score This Level: 4,980       │
│                                     │
│  Stars: ⭐☆☆☆☆ (best: ⭐☆☆☆☆)      │
├─────────────────────────────────────┤
│  [RETRY LEVEL]    [START OVER]      │
└─────────────────────────────────────┘
```

---

## Campaign Complete Screen

Displayed after Level 8 is won. Exact design TBD, but should include:
- Total campaign score
- Total stars earned (X / 40)
- Replay / share prompt
- Acknowledgment of any special achievements (all stars, etc.)

*Full design to be specced when Level 8 implementation begins.*

---

## UI Changes for Campaign

### Header
- "Level X of 8" indicator or progress bar
- Running campaign score total
- Bonus moves banked (separate from move counter)

### Move Counter
- Main moves and bonus moves displayed distinctly
- Example: `Moves: 14 remaining  |  +3 bonus`

### Game Over / Win State
- Stars displayed prominently on win
- Retry and Start Over on loss

---

## Technical Implementation Notes

### New State Variables

```javascript
// Campaign state
const [currentLevel, setCurrentLevel] = useState(1);
const [campaignScore, setCampaignScore] = useState(0);    // Running total
const [levelScores, setLevelScores] = useState([]);        // Per-level history
const [levelStars, setLevelStars] = useState([]);          // Best stars per level

// Bonus moves
const [bonusMoves, setBonusMoves] = useState(0);           // Banked bonus moves

// Level configuration
const [boardRows, setBoardRows] = useState(10);
const [boardCols, setBoardCols] = useState(8);
```

### Level Configuration Function

```javascript
const getLevelConfig = (level) => {
  switch(level) {
    case 1: return { type: 'standard', rows: 10, cols: 8,  moves: 12 };
    case 2: return { type: 'standard', rows: 12, cols: 10, moves: 20 };
    case 3: return { type: 'timeattack', duration: 60 };
    case 4: return { type: 'standard', rows: 12, cols: 10, moves: 20 };
    case 5: return { type: 'standard', rows: 14, cols: 12, moves: 25 };
    case 6: return { type: 'timeattack', duration: 120 };
    case 7: return { type: 'standard', rows: 14, cols: 12, moves: 25 };
    case 8: return { type: 'standard', rows: 14, cols: 12, moves: 25 };
    default: return null;
  }
};
```

### Star Calculation Function

```javascript
const calculateStars = (score, target) => {
  const ratio = score / target;
  if (ratio >= 1.75) return 5;
  if (ratio >= 1.50) return 4;
  if (ratio >= 1.30) return 3;
  if (ratio >= 1.15) return 2;
  if (ratio >= 1.00) return 1;
  return 0;
};
```

### Bonus Move Calculation

```javascript
const calculateBonusMoves = (score) => Math.floor(score / 10000);
```

### Unlock Check Functions

```javascript
const isLevel7Unlocked = (levelStars, levelScores) => {
  const totalStars = levelStars.slice(0, 6).reduce((a, b) => a + b, 0);
  const level5Stars = levelStars[4] ?? 0;
  const level6Stars = levelStars[5] ?? 0;
  return (level5Stars >= 3 || level6Stars >= 3) || totalStars >= 18; // threshold TBD
};

const isLevel8Unlocked = (levelStars, levelScores, level7Score) => {
  const totalStars = levelStars.slice(0, 7).reduce((a, b) => a + b, 0);
  const totalScore = levelScores.slice(0, 7).reduce((a, b) => a + b, 0);
  return totalStars >= 25
    || level7Score >= TBD_HIGH_SCORE_THRESHOLD
    || totalScore >= TBD_CUMULATIVE_THRESHOLD;
};
```

### LocalStorage Keys

```javascript
'match3_campaign_level'          // Current level reached
'match3_campaign_highScores'     // Array of best scores per level
'match3_campaign_stars'          // Array of best stars per level
'match3_campaign_totalScore'     // All-time campaign total
'match3_campaign_bonusMoves'     // Banked bonus moves (persists across sessions)
```

---

## Estimated Implementation Effort

| Component | Hours |
|-----------|-------|
| Variable board sizes + level config | 2–3 |
| Level progression + unlock logic | 2–3 |
| Star calculation + display | 2–3 |
| Bonus move system | 2–3 |
| Time attack bonus move integration | 1–2 |
| Special auto-placement (retained) | 1 |
| Transition screen + star fanfare | 2–3 |
| Game over / retry flow | 1–2 |
| Campaign complete screen (placeholder) | 1 |
| Testing & polish | 3–4 |
| **Total** | **17–25 hours** |

---

## Open Questions

1. Exact point targets for all levels (pending gameplay testing)
2. Time attack star thresholds for Levels 3 and 6 (pending testing)
3. Supernova / Hypernova score thresholds (pending testing)
4. Level 7 star unlock threshold — currently ~18–20, exact number TBD
5. Level 8 high score and cumulative score thresholds (TBD)
6. Campaign Complete screen full design (TBD at implementation time)
7. Should levels have names or themes?
8. Should there be achievements for campaign milestones?
9. How to handle localStorage clearing — backup/export system?

---

## Version History

- **v1.0** (Jan 28, 2026): Initial specification — formula-based targets, consistent move counts, Refresh/Shuffle power-ups, single bonus level
- **v2.0** (Mar 20, 2026): Major revision — 8-level structure with two time attack levels; 1–5 star system; bonus move system replacing Refresh/Shuffle; gated Levels 7 and 8 with either/or unlock paths; point targets moved to TBD pending testing; move counts differentiated by board size

---

*This document is a living spec. Update as decisions are made. Game is currently at v11 — campaign mode spec versioned independently.*
