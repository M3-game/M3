# M3 — Game Design Reference

**Last updated:** 2026-03-22
**Status:** Authoritative — read this before implementing any gameplay changes.

This document records confirmed design decisions, corrections to earlier specs, and
known bugs. It supplements, and in places supersedes, the earlier docs:

- `docs/CAMPAIGN_MODE_SPEC_v2.md` — broader campaign structure, level configs, UI layout
- `docs/banked-moves-design.md` — original arcade bonus-move design (arcade-specific;
  some decisions have since diverged for campaign)

When this document conflicts with those, **this document wins.**

---

## Mechanics

### Bonus Moves (Campaign)

Players earn 1 bonus move per 10,000 pts scored during any level. These are stored
persistently in `campaignBonusMoves` (localStorage key `CAMPAIGN_KEYS.bonusMoves`).
The pool carries across levels and is never reset on level failure.

#### Decision point — when regular moves hit 0

When `moves = 0` and `campaignBonusMoves > 0`, the player is shown a prompt offering:

- **"Use bonus moves"** — keep playing; each swap consumes 1 from the pool
- **"End and carry moves forward"** — level ends immediately; pool carries to next level

**This prompt must fire regardless of whether the target score was reached.**
A player who won should still get the option to keep playing for more score.
A player who failed should get the option to extend play.

> ⚠️ An earlier implementation gated this prompt on `!hasReachedTarget`, so it only
> appeared on failure. That was wrong and caused the prompt to never appear in normal
> play (most players win before running out of moves). Do not reintroduce this gate.

#### While using bonus moves

Once the player chooses "Use bonus moves":

- `usingBankedMoves` (internal flag) is set to `true`
- Each swap draws from `campaignBonusMoves` rather than `moves` (`moves` stays at 0)
- A persistent **"End and carry moves forward"** button appears in the game header
- The player does not need to keep clicking — continuation is the default
- The button is an opt-out: clicking it ends the level and preserves all remaining
  `campaignBonusMoves` for the next level
- On the final level (Level 8), the button label shortens to **"End"**

When `campaignBonusMoves` is also exhausted, the level resolves normally:
win if the target was reached, game over if not.

#### No bonus moves during the bonus round

If the player reaches the target with regular moves still remaining and enters the
bonus round, no bonus move prompt appears. The player still has regular moves — there
is no reason to spend bonus moves. The prompt only fires when `moves = 0`.

---

### Bonus Round (Campaign & Arcade)

When the player reaches the target score while regular moves remain (`moves > 0`),
they are offered:

- **"Enter bonus round"** — keep playing; all scoring at 1.5× multiplier until moves = 0
- **"End level early"** — level ends immediately; remaining moves scored at 200 pts/move

The bonus round ends when regular moves reach 0. At that point:

- If `campaignBonusMoves > 0`, the bonus move prompt fires (see above)
- If `campaignBonusMoves = 0`, the level resolves as won

---

### Time Attack Levels (Campaign — Levels 3 & 6)

On time attack levels, the regular move counter is unused. Time is the resource.
`IS_TIME_ATTACK = cfg.type === 'timeattack'`.

#### Bonus moves on time attack levels

Bonus moves are held in reserve during play — they do not affect the timer while
time remains.

**When the timer hits 0 and score < target (failure only):**
Bonus moves convert to extra time, **one move at a time**, at +5 seconds per move.
Conversion stops as soon as the target score is reached — remaining moves are
preserved and carry to the next level.

> ⚠️ An earlier implementation consumed the entire pool at once unconditionally.
> That was wrong. Conversion must be one-at-a-time and must stop on target reached.

**When the timer hits 0 and score ≥ target (success):**
No conversion occurs. The level ends as a win. Bonus moves carry forward unchanged.

#### Time extensions during play

+5s per combo ×5+, +5s per special tile created, +5s per 5,000 pts milestone.
Capped at 15 seconds per player action.

---

## Scoring & Stars

### Scoring Constants

| Event | Value |
|---|---|
| Bonus per remaining regular move at win | 100 pts |
| Bonus per remaining regular move at early end | 200 pts |
| Bonus round score multiplier | 1.5× |
| Unused special: line | 100 pts |
| Unused special: bomb | 150 pts |
| Unused special: cross | 200 pts |
| Unused special: supernova | 300 pts |
| Unused special: hypernova | 500 pts |
| Bonus move earn interval | 1 move per 10,000 pts |
| Time extension amount | 5 seconds per trigger |
| Time extension cap per player action | 15 seconds |

### Star Thresholds — Standard & Bonus Levels

| Stars | Score / target |
|---|---|
| 1 ★ | ≥ 1.00× |
| 2 ★ | ≥ 1.15× |
| 3 ★ | ≥ 1.30× |
| 4 ★ | ≥ 1.50× |
| 5 ★ | ≥ 1.75× |

### Star Thresholds — Time Attack Levels

Currently uses the same formula as standard levels. Time-attack-specific thresholds
are **TBD** pending gameplay testing. Since players can score well above the target
after hitting it, star tiers should reflect meaningful score milestones rather than
a simple pass/fail. Do not define time attack thresholds by assumption — wait for
real play data.

---

## Level Progression & Unlock Gates

Full level structure and target scores are in `docs/CAMPAIGN_MODE_SPEC_v2.md` and
`levels/campaignConfig.js`. Summary for reference:

| Level | Type | Board | Moves / Time |
|---|---|---|---|
| 1 | Standard | 10×8 | 12 moves |
| 2 | Standard | 12×10 | 20 moves |
| 3 | Time Attack | 12×10 | 60 s |
| 4 | Standard | 12×10 | 20 moves |
| 5 | Standard | 14×12 | 25 moves |
| 6 | Time Attack | 14×12 | 120 s |
| 7 | Standard | 14×12 | 25 moves |
| 8 | Standard | 14×12 | 25 moves |

All `targetScore` values are placeholders — see `PLACEHOLDER_TARGETS` in
`levels/campaignConfig.js`. Replace with real values after gameplay testing.

### Current Unlock Gates

- **Levels 1–6:** Sequential, no gate.
- **Level 7:** 3★ on Level 5 **or** Level 6, **or** 18 total stars across Levels 1–6.
- **Level 8:** 25 total stars across Levels 1–7.

### Future Change — Level 7 Gate

Raise the per-level gate from **3★** to **4★** on Level 5 or Level 6. Star total
thresholds remain the same.

Also needed: transition screens before Levels 5, 6, and 7 should clearly explain the
unlock requirements for the next gated level, so the player knows what they are working
toward before they play the level that determines it.

---

## Known Bugs

### Bonus move prompt does not fire after bonus round ends (campaign, unresolved)

When the bonus round ends (`bonusRoundActive && moves <= 0`), the code calls
`setGameState('won')` immediately — skipping the bonus move prompt entirely.

The correct behavior per this document: if `campaignBonusMoves > 0` when the bonus
round ends, the bonus move prompt must fire before the level resolves. The prompt
condition is simply `moves = 0 && campaignBonusMoves > 0` — it does not matter how
moves reached 0 or whether the target was already reached.

Fix required in `match3-v1.2x-campaign-tablet.jsx`:
- In the game end logic useEffect, the `bonusRoundActive && moves <= 0` branch must
  check `campaignBonusMoves > 0` before calling `setGameState`. If bonus moves are
  available, show the prompt instead of ending the level.

### Bonus move prompt never fires in normal play (campaign v1.8)

The `showBankedMovesPrompt` prompt was gated on `!hasReachedTarget`, meaning it only
appeared when the player failed to reach the target score. Most players win levels
before running out of regular moves, so the prompt never fires. Fix in v1.9: remove
the gate, fire the prompt whenever `moves = 0` and `campaignBonusMoves > 0`.

### Time attack: score undercounted at game end

When the timer fires, tiles may still be falling and their matches have not yet
registered. The score captured at game end is lower than it should be, causing star
ratings to undercount. Fix requires waiting for the board to fully settle before
evaluating the final score and awarding stars.

### Time attack: all bonus moves consumed at once on expiry

Current code sets `setCampaignBonusMoves(0)` in the timer callback, consuming the
entire pool regardless of whether the target is reached mid-conversion. Correct
behavior: convert one move at a time (+5s each), stop when target is reached.

### All target scores are placeholders

No level has a real target score. All values in `PLACEHOLDER_TARGETS` in
`levels/campaignConfig.js` are estimates. Replace after real play sessions.

---

## Future Work

| Item | Notes |
|---|---|
| Remove "banked" terminology | Rename `campaignBonusMoves` → something without "banked"; update all comments, variable names, UI strings. See Terminology section. |
| Remove 🏦 icon | The bank emoji was introduced with the "banked moves" framing. Replace with a more appropriate icon once terminology is cleaned up. |
| L7 unlock gate: 3★ → 4★ | Raise per-level gate; keep star-total gate the same. |
| Transition screen unlock context | Add clear unlock-requirement callouts on transition screens before Levels 5, 6, and 7. |
| Time attack star thresholds | Define separate thresholds for timed play after real data. |
| Real target scores | Replace all placeholders in `campaignConfig.js` after play testing. |
| Time attack bonus conversion: one at a time | Replace one-shot pool consumption with step-by-step conversion that stops on target reached. |

---

## Terminology

| Use | Avoid | Why |
|---|---|---|
| **bonus moves** | "banked moves", "saved moves" | "Banked" implies a reserve only available on failure. These are bonus moves the player earns and can spend any time regular moves run out — win or fail. The "banked" framing led directly to a design bug where the prompt only appeared on loss. |
| **victory round** | "bonus round" | "Bonus round" creates confusion with "bonus moves." "Victory round" captures the right idea: the player has already won and is playing on to score more. Rename pending — see below. |
| **"End and carry moves forward"** | "End and save", "carry banked moves" | This is the actual button label in the code. Use it verbatim for clarity. |
| **"Use bonus moves"** | "Use banked moves", "Use extra moves" | Consistent with the bonus-moves framing. |

### Planned rename: "bonus round" → "victory round"

The in-code term "bonus round" (variables: `bonusRoundActive`, `showBonusPrompt`,
`bonusRoundScore`, `preBonusScore`, `startBonusRound`) and all UI strings that say
"bonus round" should be renamed to "victory round" in a future dedicated session.

**Why victory round:** it captures that the player has already reached the target —
this extra phase is their victory lap, not a bonus. It is clearly distinct from
"bonus moves," which are the earned moves the player carries between levels.

Do not rename piecemeal — do it in one pass to avoid mixed terminology in the code.
