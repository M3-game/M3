# M3 — Game Design Reference

**Last updated:** 2026-04-21
**Status:** Authoritative — read this before implementing any gameplay changes.

> **Naming note (Session P-2, 2026-05-02):** The two phone platforms were
> renamed: `phone-418` → `phone` (arcade), `phone-418-verses` → `phone-verses`.
> Phone-341 was retired (archived only, no longer builds). Earlier prose
> below uses the old `phone-418` / `phone-341` names where it describes
> events that happened under those names — kept as-is for historical
> accuracy. Active platform paths going forward use the new names.

This document records confirmed design decisions, corrections to earlier specs, and
known bugs. It supplements, and in places supersedes, the earlier docs:

- `docs/CAMPAIGN_MODE_SPEC_v2.md` — broader campaign structure, level configs, UI layout
- `docs/banked-moves-design.md` — original arcade bonus-move design (arcade-specific;
  some decisions have since diverged for campaign)

When this document conflicts with those, **this document wins.**

---

## Design Principle — Optimize for Fun

These are *guiding principles, subject to revision based on gameplay data.*
They are not rules. When a principle conflicts with actual playtest feel,
playtest feel wins.

- **Big scores come from cascades, not linear matches.** Combo multiplier
  and cascade multiplier stack. A 5-tile match scoring in isolation is small;
  the same match that triggers 3 more matches is an order of magnitude bigger.
  Tuning decisions should preserve this gap — flatten it and the game loses
  its high-skill ceiling.
- **Specials amplify specials.** Supernova and hypernova placements, plus
  special+special combos, should be the peaks of a session — not rare corner
  cases. Tune placement thresholds so mid-campaign players see at least one
  supernova-class event per level.
- **Bonus moves extend fun.** Moves earned per 10,000 points let players
  keep playing when they're in a cascading groove. Generosity here is the
  success state, not an exploit. The 99 cap exists for UI sanity, not to
  throttle the player.
- **Variety extends fun too, when done right.** See "Variety through
  amplification, not interference" below.
- **Variance is a feature, not a bug.** Even a Monte Carlo bot with
  ~9,000× more compute than the 1-ply heuristic loses ~14% of games
  at a 1-ply-calibrated target — initial-board + refill variance
  denies cascade chains on bad hands. (Evidence: 2026-04-23
  tablet-sim v1.3 100-game MC batch at target 6000 / moves 20.) The
  game therefore retains real stochastic stakes across all skill
  levels; variance keeps even strong play honest rather than
  degenerating into pure skill-ceiling determinism. Tuning decisions
  that would eliminate the bad-hand tail (e.g., guaranteed-match
  refills, mulligan mechanics) should be weighed against this.
- **Visible scoring.** Score popups, multiplier callouts, cascade chain text,
  and the bonus-move flash should make the *source* of each point legible —
  the player should feel why they're winning, not just see the number climb.
- **Playback for understanding.** When scoring becomes visually overwhelming
  (long cascades, combo chains), slow-mode and step-through playback give
  players the option to watch *how* they scored, after the fact. (Admin
  tooling today; may surface to players later.)

This principle set drives concrete decisions: supernova/hypernova placement
thresholds, bonus-move cap, cascade multiplier table, slow-mode playback,
and the simulation harness used for tuning.

### Corollary — Variety through amplification, not interference

The Optimize-for-Fun principle implies a specific heuristic for how variety
should be added to the game.

- **Do not add variety by restricting the core fun loop.** Match-3 mechanics
  like ice-locked tiles (must match twice), stone tiles (must break before
  clearing), jelly layers, or locked obstacles exist because they add
  surface-level variety. But they work by *taking the game's most rewarding
  mechanic — matching — and making it happen less often.* That is anti-fun
  by construction.

- **Do add variety by amplifying the core loop and rewarding skilled play.**
  Reward rounds with reduced palette, seeded clusters, special-drop
  refills, bigger cascade multipliers, and progressive special-generation
  all create variety by making the good parts happen more. What triggers
  the good parts is still the player's skill — setting up cascades,
  planning multi-move sequences to create bigger specials, swapping into a
  prepared arrangement. Skill makes the fun happen; the game rewards that
  with more fun.

- **Skilled play is multi-move planning — often deeper than it looks.**
  A basic 5-match into a cross or bomb typically requires 2–3 moves of
  lookahead. Advanced play goes much deeper: setting up specials to land
  *next to* other specials, aligning specials across rows or columns
  so one swap triggers 4+ chained special activations, preparing 6–8 move
  sequences that end in mega-cascade chains. This is where the 6,000–
  8,000+ point turns come from, and it's the primary way skilled players
  clear levels with high target scores. Game design should preserve and
  reward this depth: stable physics so planning transfers, clear visible
  board state so setups remain legible across moves, and visible scoring
  so the payoff of deep planning is obvious. Anything that obscures or
  disrupts the plan (e.g., random obstacles falling in, tile types
  suddenly changing) breaks this reward chain.

- **Challenge comes from higher targets, not from obstacles blocking
  matches.** Raising target scores, shortening timers, reducing moves —
  these increase challenge while keeping all fun mechanics fully
  accessible. Skilled play is the primary way the player meets challenge.

- **Reward scales with challenge.** As targets rise and moves tighten, the
  player's tools should expand proportionally: increased chance of
  super/hypernova drops in late levels, reward rounds every N wins,
  bonus-move accumulation carrying forward, cascade multiplier tables
  that reward deeper play. This mirrors the classic video-game arc — the
  world gets harder and the player gets more powerful at the same time.
  Without the reward scaling, the game becomes frustrating; without the
  challenge scaling, it becomes boring.

- **Narrow exception acceptable for long-form campaigns.** If the campaign
  extends beyond the current 8 levels and needs pacing variety, a small
  number of interference-based levels (ice, stone, jelly) may be used
  sparingly to create contrast — standard levels feel more rewarding
  after an interference level. Mark such levels explicitly as
  *variety-through-interference*, keep them rare (<10% of total levels),
  and never the default. See `docs/DEFERRED.md`.

### Note — Why interference-based variety is common in commercial match-3

Worth naming why most match-3 games you'll encounter use the mechanics we're
not adopting as defaults. Ice, stone, jelly, locked tiles, and similar
obstacles are commercially common because they *slow the player down*.
Slower progress extends time-to-engagement, which increases session
touch-points for in-app purchases — boosters, extra moves for a fee,
time-skip payments, "continue playing" prompts, etc. The fun-blocker
mechanic is literally designed to make players hit walls, feel stuck, and
reach for wallets.

The same mechanic that keeps some players engaged (and paying) reliably
makes other players put the game down. We are not monetizing and have no
reason to incentivize walls. The fun-blocker taxonomy is useful as a
negative-example reference library — knowing what *not* to reach for when
designing a difficulty bump.

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

### Scoring vocabulary — cascade · combo · fusion

Three distinct mechanics raise a turn's score, each with its own multiplier
in the code. They were historically all loosely called "combo," which caused
real ambiguity. Settled 2026-06-23 — use these three terms consistently
(UI, code, docs, tutorial):

- **Cascade** — the automatic chain reaction: clearing tiles makes the tiles
  above fall, those falls form *new* matches, which clear and fall again.
  Multiplier grows with chain depth (`getCascadeMultiplier`: depth 2 = ×1.5,
  3 = ×2.0, 4 = ×2.5…). Happens on its own once a move sets it off.
- **Combo** — the running multiplier that builds as *additional matches* are
  made within a turn (`getMultiplier(comboValue)`: 1 = ×1.5 … 6+ = ×4.0+).
  "Combo" keeps the game-convention meaning of an accumulating-action
  counter — *not* "combining tiles" (that's fusion).
- **Fusion** — combining two special tiles by swapping one into another
  (line+line, bomb+cross, supernova+hypernova…) for an amplified combined
  effect. The game already speaks this language: the nova-combination popup
  reads `🌠🌌 NOVA FUSION!` (tablet match3, ~line 2185).

**Rule — special-combination popups standardize on "fusion."** Today only
the nova combination says "FUSION"; the other special-combination popups
(line+line, bomb+cross, etc.) should be reworded to match so the whole
family reads consistently. Code task tracked in DEFERRED.md ("Gameplay /
UX additions").

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
| **victory round** | "bonus round" | "Bonus round" creates confusion with "bonus moves." "Victory round" captures the right idea: the player has already won and is playing on to score more. Rename shipped 2026-05-01 (Session T-1) on tablet, tablet-verses, phone-418-verses; deferred for the other 5 platforms — see "Cross-platform terminology sweep" in DEFERRED.md. |
| **"End and carry moves forward"** | "End and save", "carry banked moves" | This is the actual button label in the code. Use it verbatim for clarity. |
| **"Use bonus moves"** | "Use banked moves", "Use extra moves" | Consistent with the bonus-moves framing. |
| **tile** (or "special tile") | "gem" | Only the diamond is gem-shaped; the other five tiles (hypocycloid, clover, star, candy, sun) are not gems. The code uses "tile" throughout (`tileType`, `TILE_COLORS`, `drawTile`). Locked 2026-06-23 during tutorial scoping. |
| **cascade / combo / fusion** | "chain", overloaded "combo" | See "Scoring vocabulary" under Scoring & Stars. "Chain" is retired (it was a loose synonym for cascade). |

### Rename status: "bonus round" → "victory round" + `bankedMoves` → `bonusMoves`

Shipped 2026-05-01 in Session T-1 across 3 of 8 platforms: tablet
(v11.13 → v11.14), tablet-verses (v1.9 → v1.10), phone-418-verses
(v1.3 → v1.4). Identifiers, user-visible strings, and comments all
updated to "victory round" / "bonus moves". Same session also
renamed the carry-pool identifiers (`bankedMoves` → `bonusMoves`,
incl. setters/refs and the verses-pattern `onBankedMovesChange` →
`onBonusMovesChange` callback prop).

**Why victory round:** captures that the player has already reached
the target — this extra phase is their victory lap, not a bonus. It
is clearly distinct from "bonus moves," which are the earned moves
the player carries between levels.

**Deferred (still on old terminology):** campaign tablet, phone-418
arcade, phone-341, desktop, time-attack — plus `core/AdminPanel.jsx`
and the stats data layer (`endType: 'bonusRound'`, `stats.bonusRoundsTaken`,
`bonusRoundRate`). Per locked T-1 decision #5/#6: core stays untouched
during T-1 because renaming `BANKED_KEY` would force the 5 deferred
platforms to follow in lockstep. See DEFERRED.md "Cross-platform
terminology sweep" for the full follow-on scope.

**Hard sync requirement** for the future cross-platform sweep: the
`'match3_phone418_bankedMoves'` localStorage key is shared between
phone-418-verses and phone-418 arcade. Phone-418-verses' constant
*name* was modernized in T-1 (`PHONE418_BANKED_MOVES_KEY` →
`PHONE418_BONUS_MOVES_KEY`) but its *value* was deliberately preserved
to keep the verses → arcade carry-out flow working. The string MUST
be migrated in lockstep with phone-418 arcade — both platforms touch
it on the same commit, with the migration code in one of the two
files reading the old key and writing the new one.

Do not rename piecemeal — same principle the original lock established.
