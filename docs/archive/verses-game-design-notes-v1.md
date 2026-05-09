# Verses Game Design Notes

A working design document for the Verses Match-3 game mode.

---

## Version history

- **v1** (initial draft) — Captures design philosophy, current mechanic state, tuning history, player models, distribution targets, tuning levers, and open questions as of the design conversation that produced this document.

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

## 2. Game mechanics summary (as of v1)

### Board

- 9×10 board, optimized for small mobile screens. Testing has been on 12-move boards, reflecting the design of Verses to repeat manageable passages of material. Longer games may need to be tuned differently.  
- Smaller than typical tablet Match-3 boards (10×12 or 10×14). The reduced board size has cascading implications: fewer matches available per state, lower base activity, and dramatic mechanics (hypernova effects) take up a larger share of the board.

### Neighbor-match bias

- **Current value: 13%** (reduced from a brief 14% test).
- Increases the probability that newly-dropped tiles will match their neighbors.
- Applies to all tile drops, including initial board fill and post-cascade refill.
- Has two effects: more matches occur, and special tiles are more likely to spontaneously generate during cascades.
- The spontaneous-generation effect is significant and was identified as one of the bigger design impacts of the bias system.

### Match-size scoring and special-tile creation

- 3-tile matches: base scoring, no special.
- 4-, 5-, 6-, and 7-tile matches: create special tiles with effects of increasing power.
- 6- and 7-tile matches are designated "super-specials" with powerful effects and elevated scoring.

### Super-special drop bonus

- When 12 or more tiles are cleared in a single turn, the next turn has elevated chance of a super-special dropping:
  - 15% chance of a 6-tile super-special.
  - 10% chance of a 7-tile super-special.

### Hypernova mechanic

- The 7-tile super-special triggers a hypernova clear when used.
- Clears: a localized area (~12 tiles), each row that intersects the area-of-effect, plus half the remaining board, and triggers other specials in the area-of-effect.
- On a 9×10 board, this can clear 70-80% of the board in a single event.
- Implication: hypernova replacements are large, and bias-driven spontaneous-special generation in the refill can create runaway feedback (hypernova → large refill → more specials including new hypernovas → potential ignition of further hypernovas).

### Rescue-seed mechanic

- **Trigger: N=6 turns without a 5+ tile match.** After 6 turns of nothing larger than a 4-tile clear, the rescue mechanic becomes eligible to fire.
- **Cancellation:** any 5+ tile match in the first N turns cancels rescue eligibility for that game.
- **Fire probability: 50%** when triggered. (When eligible, a 50/50 roll determines whether rescue actually fires.)
- **What drops if rescue fires:**
  - 50% chance of a 5-tile special (split between two visual/effect variants).
  - 50% chance of a super-special (split between 6-tile at 25% and 7-tile at 25%).
- **Net per rescue-eligible game:** ~50% receive a special drop, of which ~25% are super-specials.
- **Known limitation:** seeded specials drop into the top row (because cold boards typically only have 3-tile horizontal matches, which only generate top-row replacements). On many cold boards, seeded specials are visually present but practically unusable. Roughly half of observed rescue fires (in limited testing -- 20-game sample) have been usable.

### Player visibility

- Specials and super-specials are visually distinct from regular tiles. The player must see them to use them. Hidden specials would feel arbitrary when their effects fired.

---

## 3. Tuning history and reasoning

### Initial state (pre-bias)

- Game without the neighbor-match bias, super-special drop bonus, or rescue-seed mechanic.
- Verdict: not fun. Matches and combinations were too infrequent on the small board to produce engaging gameplay.

### Introduction of neighbor-match bias

- Initial value: 10%. Purpose: increase match frequency on small board.
- Effect: meaningfully more matches and combinations. Game became fun.
- Side effect identified: bias also increased spontaneous-special generation during cascades (not just match frequency). This second channel turned out to be a significant contributor to game feel.

### Introduction of super-special drop bonus and rescue-seed

- Designed to improve fun and reduce unfun games, and: (a) preserve felt rarity of super-specials while making them dramatic when they appear, and (b) provide a floor-raising mechanism for cold boards.

### First measured distribution at 10% bias (n=20)

- Mean: 11.85K, Median: 10.5K, Min: 1, Max: 28, SD: ~7.21.
- Distribution right-skewed, as expected from feedback-loop mechanics.
- Floor: ~30% of games scored ≤7K. Ceiling: occasional 25K+ games.
- Correction note: original sample had a transcription error (1 should have been 2). Corrected stats: Mean 11.90K, Median 10.5K, Min 2, SD ~7.18.

### Bias bump from 10% to 14% (n=15)

- Hypothesis: small bias increase would lift the median into the 12-14K target zone with manageable ceiling growth.
- Observed: Mean 22.87K, Median 16K, Min 3, Max 51, SD ~17.6.
- Distribution became bimodal: cluster at 0-24K, second cluster at 35-54K, near-empty middle.
- Floor did not lift meaningfully (~33% of games still ≤9K).
- Ceiling ran high (51K).
- Verdict: lifted the median into target range but at the cost of widened distribution and unchanged floor. Not a full success.

### Rescue-seed introduced; bias settled at 13% (n=20, across multiple sessions)

- Bias adjusted from 14% to 13% concurrent with rescue-seed introduction. Rescue-seed configured at N=6, with 50% fire probability and a 50/50 split between 5-tile specials and super-specials when firing.
- Twenty games played at these settings across multiple sessions. Treated as a single sample.
- Aggregate stats: Mean 23.1K, Median 14.5K, Min 3, Max 110, SD ~28.
- Without the two hypernova-chain outliers (110K, 100K): Mean ~14.5K, Median ~13K, with a much narrower distribution.
- Distribution narrowed compared to 14%-bias-only state. Bimodality reduced. Floor improved modestly.
- Rescue-seed observations: fired roughly 4 times across the 20 games. Of those fires, about half produced usable seeded specials; the other half placed seeds in unusable top-row positions on cold boards.
- Two hypernova-chain events in 20 games. The first was player-set-up (rare skill expression, then system amplification); the second was emergent within an active board. Both felt like memorable spectacles rather than problems at this frequency.
- Floor observation: 7K games can feel fun if rescue fires usably or if the board has interesting micro-opportunities. The brutal threshold is closer to 2-3K than to 7K.
- Streak observation: the unfun trigger is two consecutive sub-5K games or three consecutive sub-7K games, not single low scores. Across the 20 games, observed streaks were rare but present.
- Verdict: rescue-seed compresses distribution and modestly lifts the floor, but seed-placement on cold boards is the binding constraint on usability. Hypernova chain frequency at 13% bias is acceptable at observed rates; worth monitoring.

### Decisions made and not made

- **Neighbor-match bias settled at 13%.** Not lower (would weaken the bias channel that makes the game fun). Not higher (overshoots the median into 16K+ territory and fuels hypernova frequency).
- **Rescue-seed N to be reduced to 3 or 4. Or: (total moves) minus 9 or 10** To give the player something to try for earlier (a powerful and visible special) and more opportunities to alter the board to be able to use it.
- **Companion-tile mechanic considered and superseded.** Original idea was to drop a same-color tile alongside the seeded special to improve usability. Rejected because (a) explicit companion tiles are pattern-recognizable and erode immersion, and (b) a better solution emerged: temporarily boost neighbor-match bias on the rescue-fire turn.
- **Bias spike on rescue turns proposed (not yet tested).** When rescue fires, increase neighbor-match bias to ~30% for that turn only. This addresses placement usability through the existing bias system rather than adding a new mechanic.

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
- The rescue mechanic's placement fix (bias spike) is more important for naive players, not less, because they have less ability to creatively use a marginally-placed special.

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

### Current state vs. target (as of last test batch)

- Median (~14K): in target zone.
- Floor: still under-performing for the designer (~10-15% of games are 2-3K-territory), and likely worse for naive players.
- Hypernova-chain events at roughly 1-in-10 rate in current sample. Small sample, but consistent with rare-spectacle target. Worth continuing to monitor; not yet a concern.
- Rescue mechanic: firing at expected rate but only ~50% usable on cold boards. The bias spike is the next test.

---

## 6. Tuning levers and contingency plans

### Active levers

| Lever | Effect | Use when |
|---|---|---|
| Neighbor-match bias level | Lifts middle and ceiling; modestly lifts floor; affects spontaneous specials and fun | Median is off-target; ceiling is too compressed or too explosive |
| Rescue-seed N | When rescue fires; earlier means more games eligible but more risk of over-firing | Rescue is firing too rarely or too often relative to cold-board incidence |
| Rescue-seed fire probability and within-rescue distribution | Frequency and power of rescue interventions | Super-specials feel too common or rescues feel too weak |
| Bias spike on rescue turns | Improves rescue-seed usability without changing global bias | Rescued games still produce too many wasted specials |
| Hypernova clear area | Compresses ceiling without affecting floor | Hypernova chains becoming routine rather than rare because large cleared area tends to produce more specials due to neighbor-match bias |
| Post-hypernova bias suppression | Specifically dampens hypernova feedback loops | Hypernova chains becoming routine; alternative to area reduction |
| Super-special power | Compresses ceiling | Top games run too far when ceiling needs reining in |

### Contingency plans

- **If multiple hypernova frequency exceeds ~1 per 20-50 games:** Apply post-hypernova bias suppression first (more surgical), or reduce hypernova clear area as a fallback. This is a planned change.
- **If floor remains too brutal after bias-spike-on-rescue is implemented:** Adjust rescue-seed N, with paired ratio adjustment (e.g., 35-35-20-10 within-rescue distribution) to preserve super-special rarity. This is a planned next change.
- **If naive-player simulation shows much worse floor than designer experience:** Tune rescue-seed more aggressively (lower N, higher fire probability, more reliable bias spike) even if it slightly over-rescues for the designer.
- **If hypernova chains become a problem only on the 9×10 board:** This is expected; the small board amplifies feedback. Levers above apply specifically to this board size.

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

- Bias spike on rescue turns (~30% for one turn) will improve rescue usability without producing unintended hot-board ignitions on borderline-cold boards.
- Reducing rescue-seed N from 6 to 4, with paired ratio adjustment (35-35-20-10), would lift the floor further if needed.
- Post-hypernova bias suppression; reduce neighbor-match bias when a hypernova fires, for that turn only (maybe to 3-5%?) to reduce runaway feedback loop through excessive hypernova generation.
- Hypernova chains are rare enough at 13% bias that no ceiling-compression is required. Pending more data.

### Things to monitor

- Multiple Hypernova frequency: target is rare enough to feel like a memorable event, not a recurring spectacle. Current observed rate is roughly 1-in-10 games. If it climbs toward 1-in-5 or higher, ceiling-compression levers from section 6 should be considered
- Bottom-tail clustering: how often two or three sub-5K games occur in sequence. This is the unfun-streak metric.
- Whether the rescue mechanic's usability rate rises after the bias-spike change.

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
- New mechanics: add to section 2 (mechanics summary) and reference in section 6 (tuning levers).
- Resolved open questions: move from section 7 to wherever they belong, with a note on what was learned.

---

*End of v1.*
