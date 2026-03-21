# Campaign Mode — Implementation Status

Last updated: 2026-03-20
Current version: `platforms/campaign/tablet/match3-v1.4-campaign-tablet.jsx`
Spec reference: `docs/CAMPAIGN_MODE_SPEC_v2.md`

---

## Done

### Core gameplay
- [x] Board fully parameterized per level (rows, cols, moves from `LEVEL_CONFIGS`)
- [x] All 8 levels defined — type, grid size, move count
- [x] Star calculation: 1–5 stars based on score vs target ratio
- [x] Level unlock gates: L7 (either/or), L8 (any-one-of)
- [x] Cascade fix: specials swept by a special combo now activate and chain (v1.3)

### Progression flow
- [x] Sequential win → next level directly (no map required unless player chooses)
- [x] Level select map with locked levels shown as faint dashed cards
- [x] Transition screen on win: level complete header, stars, score, bonus moves earned, timed-mode callout for next level, Next Level / View Map buttons
- [x] Tap-to-start overlay for time attack levels
- [x] Retry overlay on loss: Retry / View Map

### Bonus move system (in-level)
- [x] `bonusMovePool` earned at +1 per 10k points during a level
- [x] Pool consumed after main moves hit zero (extends play)
- [x] "Use extra moves" or "🏦 Save moves / End level" prompt at moves=0 with pool remaining
- [x] Saved/unused pool banks to `campaignBonusMoves` for future levels
- [x] Header shows live in-level pool and campaign banked total

### Persistence (`localStorage`)
- [x] `match3_campaign_level` — highest level reached
- [x] `match3_campaign_highScores` — best score per level
- [x] `match3_campaign_stars` — best stars per level
- [x] `match3_campaign_totalScore` — cumulative campaign score
- [x] `match3_campaign_bonusMoves` — banked bonus moves, persists across sessions

---

## Not Done / Incomplete

### Transition screen — missing fields (spec calls for all 8)
- [ ] Moves used efficiency (e.g. "17/20")
- [ ] Best combo achieved this level
- [ ] Specials created this level
- [ ] Total bonus moves now banked (shows earned this level, not running total)
- [ ] Star fanfare animation

### Game over screen — missing fields
- [ ] Best score this level ("Best Score This Level: 4,980")
- [ ] Stars earned vs personal best on that level
- [ ] "Start Over" button (resets to L1, keeps records) — currently only Retry + View Map

### Campaign complete screen
- [ ] Currently redirects to map; spec calls for a dedicated screen with total score, stars/40, replay prompt, achievements

### Header UI
- [ ] "Level X of 8" indicator or progress bar
- [ ] Running campaign total score
- [ ] (Banked moves counter IS present — ✅)

### Time attack — time extensions (v1.4 — both mechanics implemented)
- [x] Arcade mechanic: +5s per combo x5+, +5s per special created, +5s per 5k pts. Capped at 15s per action.
- [x] Spec mechanic: on timer expiry with score below target, banked moves consumed → +5s each (all at once)

**TODO (design improvement):** Change the expiry mechanic to add one banked move at a time (+5s), checking score after each addition, stopping as soon as target is reached. Avoids over-spending moves when only a second or two was needed.
File: `match3-v1.4-campaign-tablet.jsx`, timer expiry block inside `setTimeLeft(prev => ...)`.

**TODO (bug):** Stars are recorded at the moment `setGameState('won')` is called after the timer expires, but match animations and combos may still be resolving. Score can increase post-snapshot, bumping the player into a higher star tier that never gets saved or shown on the map.
Fix: delay the star/score snapshot until animations settle (`isAnimating === false && combo === 0`), or route time attack wins through the same deferred `handleLevelEnd` path as standard levels.

### Target scores
- [ ] All 8 levels still using placeholder targets — pending gameplay testing
- [ ] Time attack star thresholds for L3 and L6 — TBD
- [ ] Supernova/Hypernova auto-placement score thresholds — TBD

---

## Open Questions

| # | Question | Status |
|---|----------|--------|
| Q0 | Sequential vs level-map progression | Resolved — sequential with optional map |
| Q1 | After saving moves, does current game end or continue? | Resolved — ends level, banks moves |
| Q2 | How are banked moves spent — auto-fallback at moves=0? | Resolved — auto-fallback with prompt |
| Q3 | Score treatment when saving? | Resolved — score stands |
| Q4 | Which moves are saveable? | Resolved — in-level bonus pool only |
| — | Time attack: arcade mechanic vs spec mechanic? | **Open** |
| — | Campaign complete screen design | Deferred to L8 implementation |
| — | Target scores for all 8 levels | Deferred pending gameplay testing |
| — | L7 star-total unlock threshold (currently 18) | Deferred pending testing |
| — | L8 high score + cumulative score thresholds | Deferred pending testing |

---

## File Map (current)

```
levels/
  campaignConfig.js                                         ← shared logic, no UI

platforms/campaign/tablet/
  match3-v1.3-campaign-tablet.jsx                          ← active
  archive/
    match3-v1.1-campaign-tablet.jsx
    match3-v1.2-campaign-tablet.jsx

src/
  entry-campaign.jsx                                        ← points to v1.3
```
