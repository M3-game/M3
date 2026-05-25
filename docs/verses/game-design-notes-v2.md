# Verses Game Design Notes

A working design document for the Verses Match-3 game mode.

---

## Version history

- **v1** (initial draft, 2026-05-09) — Captured design philosophy, current
  mechanic state, tuning history, player models, distribution targets,
  tuning levers, and open questions as of the design conversation that
  produced the document. Archived at
  `docs/archive/verses-game-design-notes-v1.md`.

  **Known errata in v1:** §2's "Rescue-seed mechanic" sub-section described
  the mechanic as "trigger N=6 turns without a 5+ tile match → 50% one-shot
  fire when triggered → 50% 5-tile / 50% super-special split." This was
  authored from a discussion in claude.ai without code access and did not
  match what shipped in `match3-v1.2-phone-verses-sandbox.jsx`. The actual
  v1.2 mechanic was: trigger after move 5 → arm a 4-turn rescue window →
  per-turn 50% roll (eventual fire ~94% when armed) → weighted pick across
  bomb 25 / cross 25 / supernova 30 / hypernova 20. v2 §2 below describes
  the actually-shipped mechanic correctly, including the v1.3 changes
  layered on top.

- **v2** (this document, 2026-05-09) — Corrects the v1 §2 errata.
  Documents the v1.3 ship: dynamic per-level rescue trigger, expanded
  7-turn rescue window, rebalanced drop weights (35/35/20/10), bias spike
  on rescue-drop turn, and a new Mechanic D (hypernova bias suppression).
  Updates §3 tuning history with the v1.3 entry. Marks resolved items in
  §7 (rescue N reduction → shipped; bias spike on rescue turns → shipped).

---

## Mechanic glossary

Letters are an internal shorthand for the four named tunable mechanics
that have been added to the verses-sandbox build. The descriptive name
is the one to use in conversation and docs; the letter is just for code
constants and console-log prefixes.

- **Mechanic A — Neighbor-match bias.** Probability that a newly-dropped
  tile inherits the type of a random non-null neighbor. Global rate set
  by `NEIGHBOR_BIAS_PCT`. Currently 13%. Shipped in v1.0 (10%), tuned
  in v1.1 (14%) and v1.2 (13%).
- **Mechanic B — Big-turn special drop ("huge-turn drop").** When a
  single turn clears `BIG_TURN_THRESHOLD` (12) or more tiles, the next
  turn rolls for a queued special-tile drop: 10% hypernova then 15%
  supernova. Shipped in v1.0.
- **Mechanic C — Floor-raise drop (rescue).** Per-level safety net for
  boards where no ≥5-tile match has happened by the trigger move. Arms
  a multi-turn rescue window; per-turn 50% roll queues a weighted
  bomb/cross/supernova/hypernova drop. Shipped in v1.2; redesigned in
  v1.3 (dynamic trigger, wider window, rebalanced weights, bias spike
  on drop turn).
- **Mechanic D — Hypernova bias suppression.** When a hypernova fires
  (single or combo), neighbor-bias is suppressed to 8% for the rest of
  that player turn — including all cascade refills. Dampens hypernova
  chain-ignition. Shipped in v1.3.

---

## 1. Purpose and design philosophy

### Layered purpose

The game serves a layered set of purposes. Higher layers do not depend on lower ones being met; lower layers are conditional bonuses if the higher layers succeed.

1. **Primary purpose: a personally-fun game that aids scripture memorization.** The game must be genuinely enjoyable as a single-player experience and must reinforce memorization of scripture passages. If only this purpose is met, the project is a success.

2. **Secondary purpose: potentially valuable to others.** If the design philosophy is sound and the game is broadly accessible, others may find it both fun and useful as a memorization tool. This shapes design choices in favor of broader accessibility but does not override the primary purpose.

These purposes are layered, not split. The design optimizes for the primary purpose with the secondary purpose as an accessibility constraint.

### Design principles that have emerged

These principles emerged through iterative tuning and playtesting, not from up-front design. They are descriptive of the approach taken, and prescriptive for future decisions.

- **Optimize for fun, with calibrated challenge.** The target is "fun most of the time, still challenging, with brutal games happening rarely but not never." A game that is always winnable is not fun. A game that is often brutal is not fun either. The target is a sweet spot, not an extremum.

- **Floor matters more than ceiling.** A bad game is a worse experience than a great game is a good experience, especially for retention. Tuning effort prioritizes raising the floor over raising the ceiling.

- **Streaks matter more than individual outcomes.** A single low-scoring game feels like variance. Two or three consecutive low-scoring games feels like the game is broken. The design target accounts for streak frequency, not just per-game distribution.

- **Tune mechanisms that target specific parts of the distribution.** Rather than using one global lever for everything, use distinct mechanics with distinct effects: neighbor-match bias affects the middle and ceiling; the rescue-seed mechanic targets the floor; super-special power affects the ceiling specifically. Each lever has a defined job.

- **Preserve the felt rarity of dramatic events.** Super-specials and hypernovas should feel rare and mostly earned - though they sometimes appear spontaneously, which is fine and adds to variety and fun.

- **Designs that get simpler under iteration are usually converging toward something right.** When a problem can be solved by repurposing an existing system rather than adding a new one, that is preferred.

- **In general, it's good to tune more with the naive player in mind, as well as what personal experience suggests.** The designer-player has internalized the system and plays differently from a naive player. The naive-player experience is harder, and tuning must over-correct in their favor because direct feedback from that experience is unavailable. Practically, this means raising the floor to limit unfun games for naive players.

---

## 2. Game mechanics summary (as of v1.3)

### Board

- 9×10 board, optimized for small mobile screens. Testing has been on
  12-move boards, reflecting the design of Verses to repeat manageable
  passages of material. Longer games may need to be tuned differently.
- Smaller than typical tablet Match-3 boards (10×12 or 10×14). The
  reduced board size has cascading implications: fewer matches available
  per state, lower base activity, and dramatic mechanics (hypernova
  effects) take up a larger share of the board.

### Mechanic A — Neighbor-match bias

- **Current value: 13%** (set in v1.2; reduced from a brief 14% test in v1.1).
- Increases the probability that newly-dropped tiles will match their neighbors.
- Applies to all tile drops, including initial board fill and post-cascade refill.
- Has two effects: more matches occur, and special tiles are more likely to spontaneously generate during cascades.
- The spontaneous-generation effect is significant and was identified as one of the bigger design impacts of the bias system.
- v1.3: now subject to two turn-scoped overrides (Mechanic C bias spike,
  Mechanic D hypernova suppression). The 13% value applies whenever no
  override is active.

### Match-size scoring and special-tile creation

- 3-tile matches: base scoring, no special.
- 4-, 5-, 6-, and 7-tile matches: create special tiles with effects of increasing power.
- 6- and 7-tile matches are designated "super-specials" with powerful effects and elevated scoring.

### Mechanic B — Big-turn special drop ("huge-turn drop")

- When 12 or more tiles are cleared in a single turn, the next turn has
  elevated chance of a super-special dropping:
  - 15% chance of a 6-tile super-special (supernova).
  - 10% chance of a 7-tile super-special (hypernova).
- Triggered popup ("💥 HUGE turn!") on the same fire event.

### Hypernova clear behavior

- The 7-tile super-special triggers a hypernova clear when used.
- Clears: a localized area (~12 tiles), each row that intersects the area-of-effect, plus half the remaining board, and triggers other specials in the area-of-effect.
- On a 9×10 board, this can clear 70-80% of the board in a single event.
- Implication: hypernova replacements are large, and bias-driven spontaneous-special generation in the refill can create runaway feedback (hypernova → large refill → more specials including new hypernovas → potential ignition of further hypernovas). Mechanic D (introduced in v1.3) targets this loop directly.

### Mechanic C — Floor-raise drop (rescue)

Per-level safety net for "cold" boards where no ≥5-tile match has happened
by the trigger move. The mechanic was introduced in v1.2 with a fixed
trigger move and 4-turn window; v1.3 redesigned it for variable level
lengths and improved rescue usability.

**Trigger.**
- v1.3: trigger move is **dynamic per level**:
  `triggerMove = max(0, totalMoves − 9)`.
  - 12-move level → trigger after move 3.
  - 24-move level → trigger after move 15.
  - ≤9-move level → trigger immediately at game start.
- v1.2: trigger was a fixed `FLOOR_RAISE_TRIGGER_MOVE = 5`. The dynamic
  formula was introduced because verses-game level lengths range from 5
  to 28 moves (Matt 5 levels), and a single constant didn't fit. Short
  levels need rescue more, not less, since they have less room for
  natural big scoring.
- A "big match" means any match-event with `totalUniqueTiles ≥ 5`,
  i.e., a bomb / cross / supernova / hypernova creation event per the
  engine's special-tile classification.

**Cancellation.**
- Any natural ≥5-tile match at any point disarms the rescue. "Until one
  appears" means "until the player no longer needs help."

**Rescue window and per-turn roll.**
- v1.3: armed rescue gets a **7-turn window** of rolls
  (`FLOOR_RAISE_WINDOW_TURNS = 7`; was 4 in v1.2).
- On each turn-complete during the window: roll
  `FLOOR_RAISE_ROLL_PCT = 50`%. On hit, queue a drop and mark fired. On
  miss, decrement; give up at 0.
- Cumulative fire probability when armed: 1 − 0.5⁷ ≈ 99% over 7 turns
  (was ~94% over 4 turns in v1.2). In practice rescue almost always
  fires when armed; the wider window protects against unlucky early
  misses leaving the player without help in the back half of the game.
- If Mechanic B (big-turn drop) has already queued a drop on the same
  turn-complete, rescue **skips its roll without decrementing** rolls.
  Rescue waits its turn rather than overwriting Mechanic B's queue.

**Drop weights when rescue fires.**
- v1.3: bomb 35 / cross 35 / supernova 20 / hypernova 10 (was 25/25/30/20
  in v1.2). Combined super-special rate drops from 50% to 30%.
  Rationale: rescue fires more reliably with the wider window, so
  preserve super-special rarity by skewing more strongly toward the
  common 5-tile specials.
- All four constants must sum to 100.

**Bias spike on rescue-drop turn (v1.3, NEW).**
- When rescue fires (queues a drop), the upcoming player turn — including
  the drop fill that brings the rescue special in, plus any same-turn
  cascade refills if the player activates the rescue special — uses
  `FLOOR_RAISE_BIAS_SPIKE_PCT = 30`% neighbor-bias instead of the 13%
  global.
- Rationale: bad boards have small matched areas; a rescue special
  dropping into a 3-tile match crater often lands with poor neighbor
  variety. The spike gives it extra-clustering neighbors so it's
  meaningfully usable when the player gets to it.
- Implementation: rescue queues the override into
  `pendingBiasOverridePctRef`; the end-of-turnComplete transfer logic
  promotes it to the live ref so the next player turn's fills read 30%.
  The override is wiped at the next turnComplete (one-turn lifetime).

**Player visibility.** Silent — no popup. A "your board is bad, here's
help" telegraph would risk reading as patronizing. The drop appears in
the next refill via the existing `_pendingSpecialDrop` consumer.

### Mechanic D — Hypernova bias suppression (v1.3, NEW)

When a hypernova fires (single via `activateSpecialTile`, or any combo
via `activateSpecialCombination` where `isHypernovaEvent` is true),
neighbor-bias is suppressed to `HYPERNOVA_BIAS_SUPPRESS_PCT = 8`% for
the rest of that player turn — including all cascade refills triggered
by the hypernova clear.

**Rationale.** A hypernova clears 70-80% of a 9×10 board. The high-bias
refill that follows spawns many new specials due to clustering, which
can include new hypernovas — which then ignite, repeating the cycle.
The suppression dampens this loop without altering the felt drama of
the single hypernova event itself. Surgical alternative to reducing
hypernova clear-area; preserves the visual spectacle.

**Interaction with Mechanic C.** If a hypernova fires during the same
turn that a Mechanic C bias spike is active (e.g., the rescue dropped
a hypernova special and the player activated it that same turn), the
hypernova suppression overwrites the rescue spike. Chain-prevention
takes priority over placement-help once the hypernova is firing.

**Implementation.** Sets `biasOverridePctRef.current = 8` directly
(not via the queue). Wiped at end of next turnComplete via the same
transfer logic that handles Mechanic C.

### Player visibility (general)

Specials and super-specials are visually distinct from regular tiles. The player must see them to use them. Hidden specials would feel arbitrary when their effects fired.

---

## 3. Tuning history and reasoning

### Initial state (pre-bias)

- Game without the neighbor-match bias, super-special drop bonus, or rescue-seed mechanic.
- Verdict: not fun. Matches and combinations were too infrequent on the small board to produce engaging gameplay.

### Introduction of neighbor-match bias (v1.0)

- Initial value: 10%. Purpose: increase match frequency on small board.
- Effect: meaningfully more matches and combinations. Game became fun.
- Side effect identified: bias also increased spontaneous-special generation during cascades (not just match frequency). This second channel turned out to be a significant contributor to game feel.

### Introduction of super-special drop bonus and rescue-seed (v1.0 / v1.2)

- Designed to improve fun and reduce unfun games, and: (a) preserve felt rarity of super-specials while making them dramatic when they appear, and (b) provide a floor-raising mechanism for cold boards.

### First measured distribution at 10% bias (n=20)

- Mean: 11.85K, Median: 10.5K, Min: 1, Max: 28, SD: ~7.21.
- Distribution right-skewed, as expected from feedback-loop mechanics.
- Floor: ~30% of games scored ≤7K. Ceiling: occasional 25K+ games.
- Correction note: original sample had a transcription error (1 should have been 2). Corrected stats: Mean 11.90K, Median 10.5K, Min 2, SD ~7.18.

### Bias bump from 10% to 14% (v1.1, n=15)

- Hypothesis: small bias increase would lift the median into the 12-14K target zone with manageable ceiling growth.
- Observed: Mean 22.87K, Median 16K, Min 3, Max 51, SD ~17.6.
- Distribution became bimodal: cluster at 0-24K, second cluster at 35-54K, near-empty middle.
- Floor did not lift meaningfully (~33% of games still ≤9K).
- Ceiling ran high (51K).
- Verdict: lifted the median into target range but at the cost of widened distribution and unchanged floor. Not a full success.

### Rescue-seed introduced (v1.2); bias settled at 13% (n=20, across multiple sessions)

- Bias adjusted from 14% to 13% concurrent with rescue-seed introduction.
  Rescue-seed configured at fixed-move trigger 5, 4-turn window, 50%
  per-turn roll, weights bomb 25 / cross 25 / supernova 30 / hypernova 20.
- Twenty games played at these settings across multiple sessions. Treated as a single sample.
- Aggregate stats: Mean 23.1K, Median 14.5K, Min 3, Max 110, SD ~28.
- Without the two hypernova-chain outliers (110K, 100K): Mean ~14.5K, Median ~13K, with a much narrower distribution.
- Distribution narrowed compared to 14%-bias-only state. Bimodality reduced. Floor improved modestly.
- Rescue-seed observations: fired roughly 4 times across the 20 games. Of those fires, about half produced usable seeded specials; the other half placed seeds in unusable top-row positions on cold boards.
- Two hypernova-chain events in 20 games. The first was player-set-up (rare skill expression, then system amplification); the second was emergent within an active board. Both felt like memorable spectacles rather than problems at this frequency.
- Floor observation: 7K games can feel fun if rescue fires usably or if the board has interesting micro-opportunities. The brutal threshold is closer to 2-3K than to 7K.
- Streak observation: the unfun trigger is two consecutive sub-5K games or three consecutive sub-7K games, not single low scores. Across the 20 games, observed streaks were rare but present.
- Verdict: rescue-seed compresses distribution and modestly lifts the floor, but seed-placement on cold boards is the binding constraint on usability. Hypernova chain frequency at 13% bias is acceptable at observed rates; worth monitoring.

### v1.3 ship — rescue redesign + hypernova suppression (2026-05-09, no playtest data yet)

Five mechanic changes bundled in one ship after a scoping discussion that
locked the next-step adjustments. Bias rate stayed at 13%. No playtest
data yet — distribution observations to be added in a future entry.

1. **Mechanic C trigger move → dynamic** per level
   (`max(0, totalMoves − 9)`). Replaces the fixed-5 constant so the
   rescue arms appropriately for level lengths from 5 to 28 moves.
2. **Mechanic C window → 7 turn-completes** (was 4). Eventual fire rate
   when armed climbs from ~94% to ~99%.
3. **Mechanic C drop weights → 35/35/20/10** (bomb/cross/super/hyper).
   Combined super-special rate drops 50% → 30%, preserving rarity now
   that rescue fires more reliably.
4. **Mechanic C bias spike on rescue-drop turn → 30%.** Targets the
   v1.2 placement-usability problem (rescue specials landing in barren
   3-tile match craters).
5. **Mechanic D — hypernova bias suppression → 8%** for the
   hypernova-fire turn. Surgical dampening of the chain-ignition loop.

### Decisions made and not made

- **Neighbor-match bias settled at 13%.** Not lower (would weaken the
  bias channel that makes the game fun). Not higher (overshoots the
  median into 16K+ territory and fuels hypernova frequency).
- **Mechanic C trigger move N reduction → shipped in v1.3** as the
  dynamic formula `max(0, totalMoves − 9)`. The earlier framing
  ("3 or 4, or total-moves minus 9 or 10") was simplified to the cleaner
  `−9` formula.
- **Companion-tile mechanic considered and superseded.** Original idea
  was to drop a same-color tile alongside the seeded special to improve
  usability. Rejected because (a) explicit companion tiles are
  pattern-recognizable and erode immersion, and (b) a better solution
  emerged: temporarily boost neighbor-match bias on the rescue-fire
  turn → shipped as Mechanic C bias spike in v1.3.

---

## 4. Player models

### The optimized player (current designer)

- Has internalized the bias mechanic.
- Plays for cascades over individual specials. Will skip a tempting 4-tile match opportunity to chase a 3-tile match that triggers cascades, because cascades produce more total clearing, and therefore specials) under the bias system.
- Effectively amplifies the bias system through strategic choices.
- Distribution skews higher than the underlying mechanics would produce for a strategy-naive player.
- Hypernova chains are achievable (rare but possible).

### The naive player (hypothetical)

- Plays standard Match-3 heuristics. Goes for visible 4- and 5-tile matches when available. Treats the board as static rather than as a stochastic generator.
- Does not recognize the bias mechanic. Does not chase cascades.
- Effectively underutilizes the bias system.
- Distribution likely shifted lower than the optimized player's, with more time spent in the floor region.
- Hypernova chains less likely but possible, especially with the 'huge move' special-seeding mechanic.

### Implications

- The designer's distribution under-counts how often a naive player hits the floor. A 4-out-of-20 bad-game rate for the designer may be 8-out-of-20 for a naive player.
- The 1-ply heuristic simulation (see open questions) would help quantify this gap.
- Tuning should be directed on raising the floor more than the designer's experience suggests is necessary, because the audience that matters for retention is not the audience playing during tuning. Designer is mindful of this, and decisions have taken it into account.
- The Mechanic C bias-spike (v1.3) is more important for naive players,
  not less, because they have less ability to creatively use a
  marginally-placed special.

---

## 5. Distribution targets and observations (may change over time)

### Target distribution shape

- Most games (60-70%) land in a "fun and engaging" range, roughly 10-25K with current scoring.
- Some games (15-25%) land in a "great game" range, 25K+, with rare hypernova-chain events as memorable spectacles.
- Some games (10-15%) land in a "lower-scoring but still interesting" range, 5-10K, where the player has small wins or a partial rescue but doesn't break out.
- Few games (5% or less) land in genuinely brutal territory, 2-3K. Rare enough to be variance, not pattern.

### Streak constraints

- **Two consecutive sub-5K games:** unfun. Should be rare.
- **Three consecutive sub-7K games:** unfun. Should be rare.
- A single 2-3K game is acceptable variance. A second 2-3K game in a row feels unfun.

### Current state vs. target (last data: v1.2 batch; v1.3 not yet measured)

- Median (~14K): in target zone.
- Floor: still under-performing for the designer (~10-15% of games are 2-3K-territory) at v1.2, and likely worse for naive players. v1.3 changes target this directly.
- Hypernova-chain events at roughly 1-in-10 rate in v1.2 sample. Small sample, but consistent with rare-spectacle target. v1.3's Mechanic D should reduce chain frequency further; worth monitoring.
- Rescue mechanic: at v1.2, firing at expected rate but only ~50% usable on cold boards. v1.3's bias spike directly targets this. Test priority next playtest.

---

## 6. Tuning levers and contingency plans

### Active levers

| Lever | Effect | Use when |
|---|---|---|
| Mechanic A bias level (`NEIGHBOR_BIAS_PCT`) | Lifts middle and ceiling; modestly lifts floor; affects spontaneous specials and fun | Median is off-target; ceiling is too compressed or too explosive |
| Mechanic C trigger formula (`max(0, totalMoves − 9)`) | When rescue arms; earlier means more games eligible but more risk of over-firing | Rescue is firing too rarely or too often relative to cold-board incidence; level lengths shift |
| Mechanic C window length (`FLOOR_RAISE_WINDOW_TURNS`) | Cumulative fire probability when armed | Want to raise floor coverage without changing trigger or roll |
| Mechanic C roll % and within-rescue weights | Frequency and power of rescue interventions | Super-specials feel too common or rescues feel too weak |
| Mechanic C bias spike (`FLOOR_RAISE_BIAS_SPIKE_PCT`) | Improves rescue-seed placement usability without changing global bias | Rescued games still produce too many wasted specials |
| Mechanic D hypernova suppression (`HYPERNOVA_BIAS_SUPPRESS_PCT`) | Compresses ceiling by dampening hypernova feedback loops | Hypernova chains becoming routine; surgical alternative to area reduction |
| Hypernova clear area | Compresses ceiling without affecting floor | Hypernova chains becoming routine even with Mechanic D suppression |
| Super-special power | Compresses ceiling | Top games run too far when ceiling needs reining in |

### Contingency plans

- **If hypernova-chain frequency exceeds ~1 per 20-50 games even with
  Mechanic D suppression at 8%:** Lower the suppression value further
  (5% or 3%) before reducing hypernova clear area. Suppression is the
  cheaper lever — clear-area reduction would change the visual spectacle.
- **If floor remains too brutal after Mechanic C v1.3 changes:** Adjust
  the trigger formula constant (`−9` → `−10` or `−11`) to arm earlier,
  or raise `FLOOR_RAISE_ROLL_PCT` from 50% to 60%. Drop weights are
  another lever (e.g., re-skew toward super if rescue feels too modest).
- **If naive-player simulation shows much worse floor than designer
  experience:** Tune Mechanic C more aggressively (earlier trigger,
  higher roll %) even if it slightly over-rescues for the designer.
- **If hypernova chains become a problem only on the 9×10 board:** This
  is expected; the small board amplifies feedback. Levers above apply
  specifically to this board size.

### Levers held in reserve (not currently planned)

- Reducing super-special power: would compress ceiling but also reduce the felt drama of hypernovas. Hold unless ceiling becomes a clear problem.
- Adjusting board size: out of scope; the 9×10 mobile constraint is fixed.

---

## 7. Open questions and future work

### Naive-player simulation

- Build a simple 1-ply heuristic bot: prefer larger visible matches, otherwise random valid match. Do not chase cascades. Do not recognize bias.
- Run 100+ simulated games. Record full distribution.
- Key metrics: floor frequency (% sub-5K), unfun-streak frequency (consecutive sub-5K and sub-7K games), rescue conversion rate (% of seeded specials that are used).
- Comparison against designer's distribution gives a quantitative read on the strategy-gap and where naive players may bounce off.
- Optional extension: Monte Carlo simulation across several parameter settings to find tuning configurations that minimize bounce-off risk.

### Untested hypotheses

- v1.3 Mechanic C bias spike (30%) improves rescue usability without
  producing unintended hot-board ignitions on borderline-cold boards.
  *Status: shipped in v1.3, awaiting playtest data.*
- v1.3 Mechanic D suppression (8%) reduces hypernova-chain frequency
  meaningfully without dulling the single-event spectacle.
  *Status: shipped in v1.3, awaiting playtest data.*
- v1.3 wider rescue window (4 → 7) almost guarantees rescue fires when
  armed (~99%), making bad-board incidence the binding constraint
  rather than rescue reliability. *Status: shipped in v1.3.*
- Per-level dynamic trigger (`max(0, totalMoves − 9)`) feels right
  across the full Matt 5 range (5-28 moves). *Status: shipped in
  v1.3, awaiting playtest data on long-level rescue feel.*

### Things to monitor

- Multiple-hypernova frequency: target is rare enough to feel like a memorable event, not a recurring spectacle. v1.2 observed rate was roughly 1-in-10 games. v1.3's Mechanic D should reduce this; monitor whether it falls into the 1-in-20 to 1-in-50 range without dulling the event.
- Bottom-tail clustering: how often two or three sub-5K games occur in sequence. This is the unfun-streak metric.
- Rescue usability rate on cold boards: did Mechanic C v1.3 (bias spike + dynamic trigger + wider window) move the ~50% v1.2 usability rate meaningfully toward 80%+?

### Mechanic B follow-ups (added 2026-05-09 during v1.3 ship)

These were noted by the user during the v1.3 ship as next-iteration changes:

- **Mechanic B should not fire when no moves remain.** Queueing a special the player can't use is pointless and reads as annoying.
- **Mechanic B should not fire on the very first turn.** A huge bonus immediately feels unnatural / unearned.

Both deferred to a later sandbox version (likely v1.4). Tracked in `docs/DEFERRED.md` under the phone-verses-sandbox section.

### Larger questions

- At what point should the design freeze for a meaningful playtest with someone other than the designer? Simulation would help inform this; current state may be close enough to tune-and-test rather than continue refining in isolation.
- Is there a way to gather quantitative data on "fun" beyond score? Inferring fun from score patterns has limits.
- If the game ever moves toward broader release, what adjustments to the design philosophy would the secondary audience justify?

---

## 8. Notes for future updates

This document is intended to be updated iteratively as the design evolves. When updating:

- Bump the version number in the version history at the top and place the prior version in an archive file (create one, if needed).
- Add a brief note on what changed in this version.
- Preserve prior reasoning even when superseded — the history of *why* a decision was made matters as much as the current state.
- New tuning data: append to section 3 (tuning history) rather than overwriting.
- New mechanics: add to section 2 (mechanics summary) and reference in section 6 (tuning levers). Add an entry to the §0 mechanic glossary.
- Resolved open questions: move from section 7 to wherever they belong, with a note on what was learned.
- Use descriptive mechanic names (e.g., "Mechanic C — floor-raise drop") rather than letter-only references in prose; the letters are convenient for code constants and console-log prefixes but opaque in prose, especially across long gaps between sessions.

---

*End of v2.*
