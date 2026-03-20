# Campaign Mode — Implementation Plan

Last updated: 2026-03-20

---

## Architecture decisions (locked)

| Decision | Choice | Rationale |
|---|---|---|
| Platform folder | `platforms/campaign/tablet/` | Mode-first structure; future phone/desktop campaign live alongside |
| Shell vs. game separation | Both in same file (`match3-v1-campaign-tablet.jsx`) | Keeps campaign self-contained until stable; extract when a second platform needs it |
| Shared logic | `levels/campaignConfig.js` | Level configs, star calc, unlock checks, bonus move math — identical across all platforms, no UI |
| Board parameterization | ROWS/COLS/moves/target derived from `getLevelConfig()` inside the component | Module-level functions parameterized; component-level functions use closure |
| `difficultyBonus` mechanic | Dropped | Campaign uses fixed targets per level |
| Banked moves | Present in campaign (same as arcade) | User decision; both campaign bonus moves AND save mechanic coexist |
| Time attack levels | Placeholder for now | Full implementation is Session 3 |
| Target scores | TBD (`PLACEHOLDER_TARGETS` in campaignConfig.js) | Set empirically after gameplay testing |

---

## What `levels/campaignConfig.js` contains (done)

- `LEVEL_CONFIGS` — all 8 levels with type, grid, moves, targetScore (null = TBD)
- `PLACEHOLDER_TARGETS` — dev-only fallback targets until real ones are set
- `getLevelConfig(level)` — returns config for a level number
- `getLevelTarget(levelConfig)` — returns targetScore or placeholder
- `calculateStars(score, target)` — 1–5 stars based on score ratio
- `calculateBonusMovesEarned(score)` — floor(score / 10000)
- `isLevel7Unlocked(levelStars)` — 3+ stars on L5 or L6, OR ≥18 total stars
- `isLevel8Unlocked(levelStars)` — ≥25 stars across L1–7
- `canAdvanceToLevel(nextLevel, levelStars)` — unlock check for any level
- `CAMPAIGN_KEYS` — all `match3_campaign_*` localStorage keys

---

## Session 1 — Parameterization + Level Config (done: 2026-03-20)

**Delivered:**
- `levels/campaignConfig.js` — complete
- `platforms/campaign/tablet/match3-v1-campaign-tablet.jsx` — complete (see gaps below)
  - Board fully parameterized (ROWS/COLS/moves/target from levelConfig)
  - All game logic preserved verbatim from v11.2
  - Campaign bonus moves pool tracked and persisted
  - Star calculation on level end
  - Unlock gates wired (canAdvanceToLevel)
  - `difficultyBonus`, `recordGameResult`, `restartGame` removed

**Known gaps / deviations to resolve before Session 2:**

1. **Level select screen vs. sequential progression** — the file has a level map grid
   (pick any unlocked level) rather than the spec's sequential "win → advance to next
   level" flow with a transition screen. Needs user decision: keep the map, or switch
   to sequential + transition screen?

2. **Missing `bankedMoves` (🏦 counter)** — the arcade tablet's save mechanic is not
   yet in the campaign file. User confirmed campaign should have banked moves.
   Wire in: `bankedMoves` state + localStorage, `addBankedMoves()`, 🏦 header counter,
   bonus prompt "Save Moves" button (blocked on Q1–Q4 decisions from banked-moves-design.md).

3. **No transition screen** — if switching to sequential flow, add `TransitionScreen`
   component: level number, stars, score vs target, bonus moves earned, "Next Level" button.

4. **Minor cleanup** — unused imports (`defaultStats`, `STATS_KEY`) on line 2.

---

## Session 2 — Stars, Bonus Move System, Banked Moves, Unlock Gates

**Scope:**
- Resolve the sequential vs. level-map architecture question
- Add `bankedMoves` (save mechanic) to campaign file — requires banked-moves Q1–Q4 decisions
- Implement campaign bonus move "extend play" mechanic:
  - Bonus moves should be a separate pool, NOT added to regular moves counter
  - When regular moves hit 0: if bonus moves remain, draw from pool (continue play)
  - Display: `Moves: 14 | Bonus: +3`
- Transition screen (if sequential flow chosen):
  - Level number + stars with light fanfare animation
  - Score vs target
  - Moves used efficiency
  - Bonus moves earned this level + total banked
  - "Next Level →" button
- Wire unlock gates properly into shell flow:
  - When L5/L6 won: check if L7 is now unlocked
  - When L7 won: check if L8 is now unlocked
  - Show "locked" state clearly if gate not yet met
- "Retry Level" and "Start Over" buttons on gameover overlay
- Persistent campaign progress: current level, stars, best scores, bonus moves, total score

---

## Session 3 — Time Attack Integration

**Scope:**
- Replace `TimeAttackPlaceholder` with actual time attack mode
- Timer replaces move counter for levels 3 and 6
- Bonus moves behavior in time attack: held in reserve while timer runs; if timer
  expires before target reached, each banked bonus move adds +5 seconds
- Star thresholds for time attack levels (TBD — set after gameplay testing)
- Wire time attack into level progression and star system

---

## Session 4 — Target Score Calibration + Polish

**Scope:**
- Play sessions to observe real scores and set `targetScore` for all 8 levels
- Set time attack star thresholds
- Set Supernova/Hypernova auto-placement score thresholds
- Star fanfare animation on transition screen
- Campaign complete screen (full design — currently placeholder)
- Any remaining unlock gate tuning (L7 star total threshold is ~18–20, exact TBD)

---

## Open questions (blocking or near-term)

### Architecture
- **Q0:** Sequential progression + transition screen (per spec), or level select map
  (as implemented)? Affects Session 2 scope.

### Banked moves (see banked-moves-design.md for full detail)
- **Q1:** After saving moves, does the current game end or continue?
- **Q2:** How are banked moves spent — at game start, manual mid-game, or auto-fallback?
- **Q3:** Score treatment when saving?
- **Q4:** Which moves are saveable (all remaining, bonus-earned only, or capped)?

### Targets (TBD pending gameplay testing — do not fill in without real data)
- Target scores for all 8 levels
- Time attack star thresholds for levels 3 and 6
- Supernova / Hypernova score thresholds
- Level 7 star-total unlock threshold (currently 18 — may adjust)
- Level 8 cumulative score and high-score thresholds

---

## localStorage keys

### Campaign (new)
| Key | Type | Description |
|---|---|---|
| `match3_campaign_level` | integer | Highest level reached |
| `match3_campaign_highScores` | JSON array | Best score per level (index 0 = level 1) |
| `match3_campaign_stars` | JSON array | Best stars per level |
| `match3_campaign_totalScore` | integer | Cumulative campaign score |
| `match3_campaign_bonusMoves` | integer | Banked campaign bonus moves |

### Arcade (unchanged, separate)
| Key | Type | Description |
|---|---|---|
| `match3_stats` | JSON | Full game stats + history (arcade only) |
| `match3_bankedMoves` | integer | Banked moves save counter (arcade) |
| `match3_highScore` | integer string | All-time high score |
| `match3_highCombo` | integer string | All-time high combo |
| `match3_highTurnScore` | integer string | All-time high single-turn score |

---

## File map

```
levels/
  campaignConfig.js                          ← shared logic, no UI

platforms/campaign/
  tablet/
    match3-v1-campaign-tablet.jsx            ← current (Session 1)
    archive/

platforms/tablet/
  match3-v11.2-tablet.jsx                    ← arcade mode, unchanged

core/
  AdminPanel.jsx                             ← shared admin panel

docs/
  CAMPAIGN_MODE_SPEC_v2.md                   ← feature spec (source of truth)
  campaign-implementation-plan.md           ← this file
  banked-moves-design.md                     ← banked moves decisions tracker
```
