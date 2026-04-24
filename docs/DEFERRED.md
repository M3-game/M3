# M3 — Deferred Work

Running list of items scoped out of current sessions, admin UI placeholders,
and known gaps waiting on later sessions.

**Format:** lightweight, one bullet per item, with enough context that a later
session can pick it up cold.

Add new items as bullets under the right section. When an item is addressed,
move it to the "Done" section at the bottom with a date and session ref, or
delete it once handoff is written.

---

## Admin UI — tunables not yet surfaced

These constants exist in code but have no UI:

- **Transition pause (`TRANSITION_PAUSE_MS`, campaign v1.25)** — 2000ms
  default. Add admin slider to tune between 1000–5000ms.
- **Bonus-move cap (`BONUS_MOVE_CAP`, campaign v1.25)** — 99. Admin input to
  change.
- **Bonus-move warning threshold (`BONUS_MOVE_WARN`, campaign v1.25)** — 90.
  Admin input.
- **Timed-mode grace window** — 1500ms hard-coded in campaign v1.25. Admin
  slider.
- **Cascade multiplier table** — hard-coded in `getCascadeMultiplier`. Admin
  matrix editor for tuning.

Consolidate these into a "Tunables" section in AdminPanel when someone
touches it next.

---

## Cross-platform parity

- **Tablet hypernova behavior audit** — user suspects tablet arcade
  `activateSpecialTile` hypernova branch diverges from campaign (half-board
  clear + preserve specials + min-tiles floor). Audit both, converge on
  campaign logic. Files: `platforms/tablet/match3-v11.6-tablet.jsx`,
  `platforms/campaign/tablet/match3-v1.25-campaign-tablet.jsx` lines
  1683–1696.
- **Desktop + Phone 341 bonus-moves update** — still have pre-campaign gating
  (`!hasReachedTarget`), no bonus-round post-check, 🏦 emoji, "banked"
  terminology. Carried forward from the 2026-03-23 handoff.
- **Arcade end-run confirm** — "Are you sure?" popup on truly final
  end-game actions in the tablet arcade file, when score < target and moves
  remain. (Campaign v1.25 has its in-header version; arcade needs its own.)

---

## Build / deploy

- **Auto-copy all phone-418 versions into dist.** Today `vite.config.js` has a
  single `phone418` rollup input pointing at one specific file. Each version
  bump requires editing `vite.config.js` manually — forgetting that step
  silently ships a stale version to production (this happened 2026-04-21:
  v12.0, v12.1, v12.2 were all built locally but deploy still shipped v11,
  causing a user-visible 404 when the index card was updated to v12.2).
  Fix options:
  - Move `platforms/phone-418/` (or a subset of it) into `public/` — Vite
    copies `public/` verbatim into `dist/` without requiring rollup inputs.
  - Or add `vite-plugin-static-copy` and glob the versioned files.

## Persistence & platform

- **PWA install scaffolding** — add `manifest.json`, service worker, icon
  assets (192/512/apple-touch). Blocks on real icon assets. Reduces (not
  eliminates) iOS Safari ITP localStorage purge risk.
- **IndexedDB migration** — long-term consideration if ITP purges persist
  even after PWA install.
- **Cross-platform sync** — Firebase Anonymous Auth + Firestore if manual
  backup / PWA don't adequately solve persistence. Needs cost/maintenance
  evaluation.
- **Backup auto-reminder** — once manual export/import lands, add a banner
  that prompts the user to back up when the last-backed-up timestamp is
  older than 7 days.

---

## Gameplay / UX additions

- **Step-mode platform (Session D-2).** Step-through playback deferred to
  its own sibling platform rather than living in the main tablet file,
  because it requires a pipeline refactor (callback-setTimeouts →
  await-based pauses) that carries regression risk for normal play.
  Structure when built:
  ```
  platforms/tablet-stepmode/match3-v1.0-tablet-stepmode.jsx
  src/entry-stepmode.jsx
  stepmode.html
  ```
  Fork of the then-current tablet version. Admin-gated card on the
  version-select page. Use the scoring-history panel from v11.8+ plus
  a "Next step →" button for advancing cascade phases manually. See also
  Session D (v11.8) which shipped slow-motion and history panel; step
  mode is the missing third mode.
- **Slow-mode and history panel** — shipped in tablet v11.8 (Session D,
  2026-04-22). See `docs/archive/PROGRESS-2026-04-22.md`. Campaign port
  pending.
- **Simulation harness — Session E-1a scaffold + 1-ply bot (SHIPPED
  2026-04-22).** See Done section. The sibling platform
  `platforms/tablet-sim/` and the pure `_SIM` namespace are live;
  `window.runSimGame()` callable from DevTools.
- **Simulation harness — Session E-1a2 bot-plays-to-exhausted fix
  (SHIPPED 2026-04-23).** See Done section. Bumps tablet-sim to v1.1.

- **Simulation harness — Session E-1b (admin UI + batch + stats +
  histogram) — SHIPPED 2026-04-23.** See Done section. Bumps tablet-sim
  to v1.2.

  ⚠ **Skill-gap caveat** (from DESIGN.md, restated — permanent note
  that carries into E-2 as well). Skilled human play involves 5–8 move
  lookahead. A 1-ply bot captures none of that. Interpret sim results
  as *lower-bound casual play* — **never** tune level targets down
  based on bot win-rate alone. Use for: balance floor checks ("is this
  level winnable at all?"), relative-difficulty comparisons across
  levels, score-distribution anomaly spotting. Not for absolute-target
  tuning.

- **Simulation harness — Session E-2a (Monte Carlo bot + Web Worker
  pool + framework integration with E-1b) — SHIPPED 2026-04-23.** See
  Done section. Bumps tablet-sim to v1.3.

- **Simulation harness — Session E-2b (MC tuning session) — deferred
  2026-04-23 after E-2a playtest covered ~80–90% of the "does MC
  work?" question.** Not blocking anything downstream; Session I,
  campaign hypernova, reward-mode integration all proceed with MC's
  current defaults as-is. Resume if/when tuned defaults become
  practically useful (e.g., if MC becomes a daily-driver for balance
  testing) or if a future bot variant needs a matched baseline.

  **Findings captured from the 2026-04-23 playtest (for cold
  resumption):**
  - **MC at defaults (N=30, depth-cap=5, 1-Ply rollouts) vs. 1-Ply at
    matched target=6000, moves=20 — from three batches (10g / 50g /
    100g) at fixed target 6000 and fixed 20 moves:**
    - 1-Ply (earlier 100-game v1.1 batch, random 18–24 moves / random
      5000–6500 target): 54% win rate, mean 6,837, 21% earning ≥1
      bonus move.
    - MC (10-game pilot): misleadingly rosy 100% win / mean 13,481 /
      80% earning ≥1 bonus. Small-N luck — no losses sampled.
    - MC (50-game): 86% win / mean 12,229 / median 11,795 / 64%
      earning ≥1 bonus.
    - **MC (100-game — the locked-in estimate): 86% win / mean 11,745
      / median 10,920 / p10 4,585 / p90 18,385 / 52% earning ≥1
      bonus. Range 1,665 → 30,005.** Win rate held exactly stable
      between 50g and 100g; mean and median drifted down ~10% from
      50g estimate; bonus-earn rate was the most mis-estimated
      metric at small N (80% → 64% → 52%). Worth noting for future
      small-batch interpretations: bonus-earn ratio needs >50 games
      to stabilize.
  - **MC is not invincible at 1-Ply-calibrated targets.** 14 losses
    in the 100-game batch (all finished 1,665–5,750, i.e., at or below
    target, all used full 20 moves, none got stuck). Losses share a
    profile: **3–7 specials created + maxCombo 3–6**, vs. wins
    **6–23 specials + maxCombo 4–13**. These are "bad-hand" games
    where the initial board + refill variance denied the cascade
    chains MC needs. Real design insight: even an AI ~9,000× more
    expensive than the 1-Ply heuristic can't brute-force a win from
    a bad hand — variance is a genuine game-design feature retained
    at skilled-equivalent play. (Now also captured in
    `docs/DESIGN.md` Optimize-for-Fun list.)
  - **Runtime cost.** ~65–80s avg per game at N=30 / depth=5 / 1-Ply
    rollouts. ~16 min wall-clock for 100 games with 7 workers (50-game
    batch was ~7 min with 9 workers). Usable for scheduled tuning
    runs, not casual exploration. Per-game cost stable across batch
    sizes — no degradation at scale.
  - **Target 6,000 is 1-Ply-calibrated; too easy for MC tuning.**
    Median MC score at defaults is ~10,920. For E-2b to observe
    meaningful parameter-sensitivity differences, recommend
    **starting calibration target ~10,500–12,500** (centered on the
    100-game median) for roughly 50% win rate. Around 9k would give
    ~65–70%; around 13k would give ~35–40%.
  - **Matched 1-Ply baseline at the chosen calibration target is
    still worth running first** (fixed 20 moves + new target, 100
    games, ~12s). Gives the tuning table a direct comparison column.
  - **Unusual tail observation — maxCombo vs. score correlation is
    weak.** Best maxCombo in 100g was 13 (game 29) but that game
    scored only 12,025 — 13 short cascades compounding rather than
    one big chain. MC doesn't reliably convert deep combo depth into
    peak scores; cascade depth alone isn't a proxy for "big turn."

  **When resuming E-2b, the starting brief's sensitivity sweeps still
  apply** — N (10/20/30/60/100 at depth=5, 1-Ply), depth-cap (3/5/8/12
  at N=30, 1-Ply), rollout strategy (1-Ply vs. Random at N=30, depth=5).
  Decision output: either keep defaults (v1.3 stays) or bump to v1.4
  with updated source constants + documented reasoning.

- **`_SIM` internal target generation — round to 100.** The live arcade
  rounds generated target scores to 100-point increments; `_SIM`
  currently generates unrounded targets (e.g., 4837). Flagged
  2026-04-23 during E-1b scoping. Not a blocker for E-1b itself (admin
  sets a fixed target that bypasses `_SIM`'s internal generator for
  batch runs), but worth tightening so any context that still uses the
  auto-generator matches live behavior. Fix: round the target in
  `runGame`'s default assignment at `opts.levelTarget ?? ...`.
- **Animated tutorials** — mini-grid demo inline on each intro screen.
  Reuses `drawTile` / `drawSpecialIcon`. Per-level distribution:
  - L1: basic 3-match
  - L2: 4-match → line + 5-match → bomb
  - L3: time-extension triggers
  - L4: cascade chain
  - L5: bonus-move earning
  - L6: 6-match supernova + 7-match hypernova
- **Campaign entry screen** — a pre-level-select landing screen with campaign
  branding, best-run display, and a "Play" CTA. Today the level select *is*
  the entry. Low priority.
- **Post-campaign arcade continuation** — after Level 8 wins, offer to
  continue into arcade mode with the campaign bonus-moves pool carried
  forward. Scope: tablet arcade.
- **Variable transition pause** — allow 1.5s for early/simple levels, 2s for
  later, 3s for campaign complete. Data-driven per level.
- **Bonus-move cap warning popup** — beyond the header text, consider a
  one-time popup at 95 bonus moves explaining the cap. Only show once per
  run.

---

## Reward systems & progressive generosity

Implements the "Variety through amplification" corollary in DESIGN.md.
Sequence matters: build the simulation harness (Session E) first so the
sandbox (Session H) can be tuned against data rather than by guess.

- **Progressive special-drop lever (arcade).** Starting at level 5, after
  a "big turn" (≥10 tiles cleared in a single event), roll once for a
  super/hypernova to drop into the refill. Chance scales with level:
  - Proposed defaults: +5% supernova / +3% hypernova per 5 levels.
  - Alternative slower ramp to test: +4% / +2%.
  - Cap at level 30 (~30% super / 18% hyper) to prevent runaway
    compounding.
  - Announce at level 5; reminder at every 5× level after (level 10, 15…).
  - One roll per qualifying turn, not per match within a cascade.
  - Drop lands in a random cleared cell during refill, giving the player
    something to build around next turn (agency compounds).
  - Needs playtest + simulation to tune percentages.

- **Reward round — discrete special event.** Every 5 arcade wins, next
  round enters a reward mode (reduced palette, seeded clusters, etc.).
  Campaign equivalent: bonus levels insertable at configurable positions.
  Announced at level 5 (same trigger as progressive lever).

- **Reward-mode sandbox (Session H).** H₁ scaffold shipped 2026-04-22.
  H-2 (levers wired) shipped 2026-04-22. Both in the Done section.
  Playtest + lever-range tuning is ongoing work for the user (no
  further code session scoped yet; iterate as needed on individual
  lever ranges or defaults).

  **Note:** the originally-scoped sixth lever `BIG_MATCH_POINT_MULT`
  was dropped 2026-04-22 per user call. Can be added back later if
  needed.

  **Interaction edge cases to watch during playtest:** high
  `cluster_seed` + high `neighbor_bias` could produce near-mono-color
  boards. No guards in place yet — may need bounds or a variety
  check if it becomes an issue.

- **Reward-mode integration (Session I).** After Session H values lock
  in, integrate reward-round behavior into the main games:
  - **Tablet arcade:** every 5 consecutive wins, next round runs in
    reward mode (reuses the existing `currentRun` state shipped in
    v11.9 / v12.4).
  - **Campaign:** per-level `rewardMode: true` flag in
    `levels/campaignConfig.js`. Starting position TBD — level 3
    suggested as a "first-reward checkpoint."
  - **Progressive special-drop lever:** from level 5 onward, the
    `SPECIAL_DROP_ON_BIG_TURN` chances scale up per 5 levels. Caps at
    level 30 (~30% super / 18% hyper).
  - **Announcements:** first-time explanation modal at arcade level 5
    ("🎁 REWARD ROUND! Next win triggers a special round"). Subtle
    banner reminder at each 5× level after. On reward-round entry,
    full-screen banner with copy TBD ("🎁 REWARD ROUND — reduced
    palette + seeded clusters!" as a starting draft).

- **Layered reward levels (very deferred).** Once the base sandbox is
  validated, allow combinations of levers per level (e.g., "seeded +
  reduced-palette level" or "special-drop + cluster-drop level"). Gives
  campaign pacing tool.

---

## Memorize Mode (Verses platform)

Scoped 2026-04-24. New sibling platform for memorization games delivered
via match-3. Verses reveal one chunk per successful swap; memorization
is purely additive and does not change match-3 gameplay. Fits the
"amplify fun, not interfere" corollary in DESIGN.md — the game rewards
skilled play with verse exposure and high scores rather than gating
progress behind obstacles.

**Platform.** `platforms/tablet-verses/`, forked from tablet v11.11.
Entry: `verses.html` + `src/entry-verses.jsx`. Card "Verses" on main
`index.html` (normal-visible, not admin-gated). Single React app;
picker and play are internal states (no separate HTML file for the
picker).

**Content model.** Games live under `platforms/tablet-verses/games/
<slug>/game.js`. JS data file with shape:

```js
export default {
  title: "Titus 3:11–13",
  translation: "KJV",       // optional
  verses: [                 // single-level games use top-level `verses`
    {
      reference: "Titus 3:11",
      chunks: ["For the grace of God", "That brings salvation", ...],
    },
    ...
  ],
  // OR for multi-level games:
  levels: [
    {
      title: "Psalm 91:1–4",           // optional level title
      targetScore: 4200,               // optional override; default
                                       // = moves × 300 = chunks × 300
      verses: [ ... ],
    },
    ...
  ],
};
```

Glob-discovery (no manifest). `hidden: true` flag at the top level
keeps a game out of the picker while drafting. `_template/` folder +
README documenting the shape and common patterns provided for
authoring. No CLI scaffolder or validator script — the data shape is
simple enough that a working template is sufficient; if authoring
proves error-prone in practice, we can add a runtime schema check
surfaced in an admin panel.

**Core mechanics (memorization purely additive):**
- Moves = chunks; each passage sets its own move budget via the data
  (Titus 3:11–13 = 13 chunks = 13 moves).
- One chunk reveals per successful swap, at turn settle (after all
  cascades finish and the board stabilizes). Swaps that don't produce
  a match (snap back, no move counter decrement) also don't trigger a
  reveal.
- Text bar between banner and board; rolling 3-chunk window (current
  + 2 prior); current chunk emphasized (brighter / bolder), prior two
  dimmed.
- Silent 1.5× victory round at target-hit (no prompt — "end early"
  would stop chunk reveals, which defeats memorization). Brief
  "Target reached — 1.5×!" banner, then play continues.
- Bonus moves (tablet-arcade mechanic, earned at 10k score thresholds)
  exist in memorize mode but do not reveal new chunks — they just
  allow the player to keep scoring after chunks are done. They carry
  level-to-level within a game and persist on "Play again," zero on
  picker-exit or browser close, and roll into tablet arcade on the
  "Tablet arcade" handoff button. Cap 99 (inherited from tablet
  arcade).
- Target score: `moves × 300` formula default, optional per-level
  `targetScore` override in data file. Short games may need a lower
  multiplier since cascade setup is harder with few moves — that's
  what the override is for.

**Progression + picker UX:**
- **Two-tier picker.** Main picker shows one card per game. Click a
  multi-level game → level-select screen with per-level cards
  (showing locked / completed / star / best-score state). Click a
  single-level game → goes straight to play, bypassing level-select.
- **Hybrid progression** (user picked: "middle parts are often the
  hardest"). First pass through a multi-level game is strict —
  must hit target to unlock the next level. After the full game is
  completed once, any level is freely selectable on replay.
- **Target-based level completion.** "Completed" = hit target score.
  Falling short = must replay the level to advance (during first pass)
  or just replay it (during free-replay mode).

**End-of-level flows:**
- **Win (hit target):** silent 1.5× plays out, remaining moves used,
  final score settles → ~2.5s delay → passage for this level reveals
  → buttons: **Next level →** (primary) and **Back to level-select**.
  Player clicks to advance — no auto-timer (memorize mode should let
  the reader breathe).
- **Fail (missed target):** ~2.5s delay → passage for this level
  reveals anyway (memorization is additive) → buttons: **Retry** and
  **Back to level-select**. Stars and best-score never regress if a
  replay scores worse.
- **Final-level game end:** ~2.5s delay → passage for the final level
  reveals → stays visible indefinitely with **Play again** (restart
  game from Level 1) and **Tablet arcade** (leave memorize mode,
  open standard arcade) buttons. No auto-dismiss; player chooses.
- **Individual level replay** (post-completion free-replay mode):
  ~2.5s delay → passage reveals → **Back to level-select** button
  only (no "Next level" — player chose this level standalone, not as
  part of a sequence).

**Stars.** Campaign-style 1–5★ per level at 1.00× / 1.15× / 1.30× /
1.50× / 1.75× target. Shown on level-select cards and as aggregate
state on the picker's game card (e.g., "12 / 20 stars" for a 4-level
game). **Tentative** — removable later if they start feeling like
noise; first flag for reassessment is after V-4 ships and playtest
feedback comes in.

**Persistence.** Per-level: best score, star count, completion-count,
last-played timestamp. Per-game: completed-once flag (triggers hybrid
free-replay mode). localStorage-keyed under `m3_verses_*`.

**Arcade handoff.** When a game is completed in full and the player
clicks the **Tablet arcade** button on the final-level end screen,
the accumulated bonus-moves pool transfers into the tablet arcade
session. One-way handoff (no rollback). Brief "+N bonus moves carried
from memorize mode" banner on arcade entry so the extra moves don't
appear silently. Memorize pool zeroes after the transfer. **Shares
future plumbing** with Session F's planned campaign → arcade
continuation (DEFERRED "Gameplay / UX additions" section); build
memorize → arcade standalone first, unify the helper in a later
session once both handoffs are concrete.

**Admin.** Memorize mode is user-facing (not admin-gated), but a
small admin panel behind the existing long-press-logo unlock on
`index.html` (or `?admin=1` URL param on `verses.html`) provides
dev/test tooling:
- **Reveal delay slider** (default 2.5s, range 1–5s) — tune the
  end-of-level passage-reveal delay.
- **"Simulate game completed" button** — flips a game to the
  hybrid-unlocked state for testing free-replay without actually
  playing through every level.
- **"Reset all stats" button** — clears best scores, stars,
  completion-count. Scoped per-game or all.
- **Debug log toggle** — console logs for chunk reveals, level
  transitions, bonus-move carry events.

Not proposed for v1 admin: target-score override at runtime, chunk-
reveal timing tuning, force-win buttons. Add if specific needs
surface.

**First games:**
- **Titus 3:11–13** — single-level, 13 chunks (3 / 6 / 4 across verses
  11 / 12 / 13). Ships with V-2 as the first playable content.
- **Psalm 91** — multi-level, 3–4 levels TBD during V-3 (user
  suggested this split during scoping). Ships with V-3 as the first
  multi-level content.

**Session plan (5 sessions):**

- **V-1 — Scaffold.** Fork `platforms/tablet/match3-v11.11-tablet.jsx`
  → new platform `platforms/tablet-verses/`. Create `verses.html`,
  `src/entry-verses.jsx`, Vite config entry, "Verses" card on
  `index.html`. Platform plays like tablet arcade; no memorize-
  specific logic yet — just plumbing. Ships
  `match3-v1.0-tablet-verses.jsx`.

- **V-2 — Single-game MVP.** Content model: `games/` directory with
  `_template/`, `titus-3-11-13/game.js`, games README. Glob-
  discovery manifest loads games from disk. Hardcoded Titus boot
  (no picker yet — next session). Text bar between banner and
  board, rolling 3-chunk window, current emphasized. Moves = chunks
  (13 for Titus); successful swap reveals next chunk on settle.
  Basic end-of-round: passage reveal after 2.5s + **Play again**
  button (no arcade handoff yet). Ships
  `match3-v1.1-tablet-verses.jsx`. **Earliest playtest-able
  version — start memorizing Titus between V-2 and V-3 sessions.**

- **V-3 — Picker + level-select + multi-level.** Two-tier landing:
  main picker (game cards) → level-select (for multi-level games
  only). Single-level games bypass level-select. Extend data shape
  to support `levels[]`; add `psalm-91/game.js` as first multi-
  level game. Hybrid progression. Level-to-level flow: Next level /
  Back to level-select / Retry per the locked end-of-level specs.
  Bonus-moves carry within game. Ships
  `match3-v1.2-tablet-verses.jsx`. Can split into V-3a (picker) +
  V-3b (multi-level + Psalm 91) if session feels too heavy.

- **V-4 — Stars, persistence, victory round, arcade handoff.** Per-
  level best score, star count (campaign thresholds), completion-
  count, last-played — localStorage-keyed. Picker + level-select
  show progress (stars, best score, "✓ Completed" marker). Silent
  1.5× victory round at target-hit with brief banner. "Tablet
  arcade" button: pool rolls into arcade session; handoff banner on
  arcade entry. Ships `match3-v1.3-tablet-verses.jsx`.

- **V-5 — Admin + polish.** Admin panel behind long-press-logo
  unlock: reveal-delay slider, simulate-completed button, reset-
  stats button, debug log toggle. Animation and timing tuning based
  on V-2 through V-4 playtests. Any remaining small fixes surfaced
  during development. Ships `match3-v1.4-tablet-verses.jsx`.

**Scoping notes worth keeping:**
- Scoping done as a seven-item roadmap, one decision per message,
  completed 2026-04-24. Two decisions reversed mid-scoping:
  - **Stars:** initially drafted as "no" for simplicity → flipped to
    "yes campaign-style" for replay motivation after user accepted
    hybrid progression's replay emphasis.
  - **Bonus moves on Play Again:** initially drafted as "zero on
    Play Again" → flipped to "persist" after user framed them as an
    earned reward rather than per-session currency.
- "Verses." was considered with a period for stylistic weight;
  user dropped the period, final name is "Verses" (no period).
  Keep the dual meaning (scripture / competition) in mind when
  picker copy is written.
- Memorization is *not* what counts as progress — target score is.
  If a player wants to revisit a verse they memorized, they have to
  hit target on that level (during first pass) or use free-replay
  (post-completion). Don't add a "mark as memorized" affordance;
  progress is measured by play.

---

## Research / external context

- **Match-3 literature survey — scoped multi-session research task.**
  Goal: broadly educational dive into existing match-3 research,
  commercial design writing, academic papers on balance/AI, and related
  game-design wisdom. Value is partly design input for this project,
  partly general education on how the field thinks about these problems.
  Informative *even on topics we're explicitly not adopting* (e.g.,
  monetization / retention / compulsion-loop research) because those
  frameworks are foreign to the user's thinking and useful as reference.

  **When to run:** end-of-day session with a full token budget, not
  interleaved with active-work sessions. OK to run across multiple
  sessions.

  **Structure (three focused queries, ~80–100k tokens each):**
  1. Published research on match-3 level-difficulty prediction and
     target-score calibration (most directly actionable for
     `levels/campaignConfig.js` target tuning).
  2. AI / bot architectures used for match-3 game-playing and game-
     balancing (direct input for Session E simulation scope).
  3. Design patterns / mechanics that amplify the core fun loop rather
     than interfere — validates or challenges our "variety through
     amplification" framework. Include monetization / compulsion-loop
     research as foreign-perspective reference, even though we won't
     adopt those patterns.

  **Sources to survey:**
  - Academic: Google Scholar for `"Bejeweled" AI`, `"match-3"
    difficulty`, `Candy Crush player modeling`. Conferences: FDG,
    AIIDE, IEEE CIG/COG, KDD (for King's papers).
  - Industry: King engineering blog, GDC talk transcripts/summaries,
    Gamasutra / Game Developer postmortems.
  - Researchers to follow: Julian Togelius (NYU), Jeppe Theiss
    Kristensen (ITU Copenhagen), and others in game-AI.
  - arXiv game-AI tags for unvetted but accessible papers.

  **Output format:** written summary with source citations, organized
  by the three focus queries. Include both "directly applicable" and
  "interesting-but-not-for-us" findings.

---

## Long-form campaign (very deferred)

- **Campaign extension beyond 8 levels.** If the campaign extends (e.g.,
  to 16 or 24 levels), reward-based levels remain the default. A small
  number of interference-based levels (ice, stone, jelly, locked tiles)
  may be used sparingly as pacing contrast — the standard reward-levels
  feel more rewarding after an interference level. Constraints:
  - Rare (<10% of total levels).
  - Explicitly marked *variety-through-interference* in level config.
  - Never the default.
  - Reward-based levels remain dominant.
  Intended as variety / pacing contrast so reward levels feel better by
  comparison, not as a general difficulty mechanic. See DESIGN.md
  corollary "Variety through amplification, not interference."

---

## Terminology

- **Rename "bonus round" → "victory round"** — dedicated one-pass session
  across campaign file + DESIGN.md. Variables: `bonusRoundActive`,
  `setBonusRoundActive`, `startBonusRound`, `showBonusPrompt`,
  `bonusRoundScore`, `preBonusScore`. Avoid piecemeal renames.
- **Remove "banked" variable names** — `usingBankedMoves`, `usingBankedMovesRef`,
  `showBankedMovesPrompt`, `startUsingBankedMoves`, `endLevelCarryBanked`,
  `BANKED_KEY`. Replace with "bonus" framing throughout.

---

## Known bugs (carried forward)

- **Time attack: score undercounted if timer fires mid-cascade** — partially
  fixed in v1.14 via `pendingTimeExpiry` + `isAnimating`/`combo` check.
  v1.25 extends with the 1.5s grace window. Verify in playtest.
- **Time-attack arcade timer dep array includes `score`** — pre-existing,
  low severity. File: `platforms/timeattack/match3-v12.1-desktop-timeattack.jsx`.
- **`bonusMoveFlashPendingRef` vestigial** — declared and reset in campaign
  file but never consumed meaningfully. Remove next time the file is
  touched for other reasons.

---

## Done

- **Phone-418 bonus-moves UI — prompt never fires.** 2026-04-22, Session
  B-2. Root cause was a JS syntax error in v12.2 (missing `)` on the
  in-header End-and-carry button chain) preventing React from mounting,
  not the bonus-moves logic itself. v12.3 restores the paren; v12.2's
  campaign-parity bonus-moves logic is now reachable. Pending device
  verification.
- **Admin panel + scoring-history drawer contrast fix.** 2026-04-22,
  Session L. All text-color greys darker than `#ccc` (`#444`, `#555`,
  `#666`, `#777`, `#888`, `#aaa`, `#bbb`) lifted to `#ccc` across
  `core/AdminPanel.jsx` (in place — see CLAUDE.md shared-core
  exemption), tablet `ScoringHistoryPanel` + `TabletAdminWrapper`
  (v11.10 → v11.11), and campaign inline `CampaignAdmin` (v1.25 →
  v1.26). Small-text bumps: 10px uppercase labels → 11px + fontWeight
  500; 11px helper text → 12px. Borders/backgrounds unchanged.
- **Reward-mode sandbox scaffold (Session H₁).** 2026-04-22. New sibling
  platform `platforms/tablet-rewardmode/match3-v1.0-tablet-rewardmode.
  jsx` forked from tablet v11.11. New `rewardmode.html` + `src/entry-
  rewardmode.jsx` + `vite.config.js` rollup input. Landing-page admin
  gate on `index.html`: inline `<script>` detects long-press on
  "🎮 M3" (1.5s, 10px move tolerance) or `?admin=1`; unlock persists
  to `sessionStorage['m3_admin_unlocked']`; reveals a hidden "Admin /
  Dev" section containing the rewardmode card (badge-admin variant).
  `RewardmodeAdminWrapper` adds a "Reward Mode Levers" card with 7
  sliders (4 singles + 3 grouped under "Special drop on big turn").
  Values persist to `sessionStorage` under `m3_rwd_*` keys; URL
  kebab-case params override sessionStorage on load. Non-default
  indicator (amber label + "(def N)" subtext + card-header "●
  modified" mark) + "Reset to defaults" button (disabled at defaults).
  Levers NOT yet wired into game logic at this version — board played
  like tablet v11.11.
- **Simulation harness scaffold + 1-ply bot (Session E-1a).**
  2026-04-22. New sibling platform `platforms/tablet-sim/match3-v1.0-
  tablet-sim.jsx` forked from tablet v11.11 (rather than the
  originally-planned "on the main tablet directly" — moved to
  sibling for risk isolation; also preempts Session E-2 which will
  extend this sibling rather than forking its own). Pure `_SIM`
  namespace reimplements init / match-find / specials / cascade /
  gravity / refill / scoring as pure functions. Phase-aware 1-ply
  heuristic scores each valid swap by match points + creation
  bonus + proximity + line-of-effect + combo-swap bonus +
  (desperate) bonus-move threshold. Exposed as `window.runSimGame()`
  for DevTools verification. Verified: 60% win rate on a 10-game
  batch, avg finalScore ~5700, maxCombo 3–8, 0 stuck games.
  E-1b (admin UI + batch + stats) still planned.

- **Reward-mode lever wiring (Session H-2).** 2026-04-22. Tablet
  rewardmode sandbox bumped `v1.0 → v1.1`. All 5 levers now affect
  gameplay. `tile_count` overrides the palette width at both random-
  tile draw sites; `neighbor_bias` and `cluster_drop_bias` apply per-
  new-tile in `fillEmptySpaces` (rolled in UI order; refill rewritten
  bottom-up so `below` is always available); `cluster_seed` applies
  4 pre-designed 3×3 density masks post-`initializeGrid` with up to 3
  boundary-mutation passes; `big_turn` accumulates `allTilesToClear`
  across cascades, rolls hyper% then super% at turn-settle, sets a
  `_pendingSpecialDrop` ref consumed on the next refill, and fires a
  top-center "💥 HUGE turn!" popup (2.5s auto-dismiss, blue gradient
  super / purple hyper). Admin row added for dev-time lever-fire
  console log toggle (`[rwd] <lever> ...`, off by default).
  Mid-session bug: initial board ignored URL/sessionStorage because
  the module-level lever mirror was initialized to defaults; fix —
  call `loadRewardmodeLevers()` at module load time.

- **Tablet-sim bot plays until moves exhausted (Session E-1a2).**
  2026-04-23. Tablet-sim bumped `v1.0 → v1.1`. The `runGame` loop
  `while (score < levelTarget && …)` was exiting as soon as score
  crossed target, so the bot never accumulated past target and never
  crossed the 10k bonus-move threshold across 50 games of console
  testing. The "0 bonus moves in 50 games" finding from E-1a was an
  artifact of this setting, not a real "bot can't reach it" signal.
  One-line fix: dropped the `score < levelTarget` clause from the
  while condition. `won` flag at end still reflects target-reached;
  `finalScore` captures full play-through. Build clean; sim bundle
  71.13 kB (from 71.14 kB — comment + one-line change).

- **Simulation harness — Monte Carlo bot + Web Worker pool (Session
  E-2a).** 2026-04-23. Tablet-sim bumped `v1.2 → v1.3`. Major structural
  change: the `_SIM` namespace plus its shared constants (ROWS, COLS,
  TILE_TYPES, MIN/MAX_MOVES, BASE_TARGET, TARGET_VARIANCE,
  BONUS_MOVE_INTERVAL, SUPER/HYPERNOVA_MIN_TILES) and pure helpers
  (`hasValidMoves`, `findMatchesSimple`, `calculateUnusedSpecialsBonus`)
  extracted into new co-located shared module
  `platforms/tablet-sim/simCore.js` — single source of truth, imported
  by both the main-thread v1.3 JSX and the new Web Worker. simCore is
  edited in place going forward (not a versioned platform file —
  CLAUDE.md's never-overwrite rule applies to platform files, not
  shared libraries). Monte Carlo implementation in simCore:
  `mcPickBestSwap` runs N rollouts per candidate swap, each simulating
  up to `depthCap` moves via chosen strategy, picks swap with highest
  expected total score at horizon. `_SIM.runGame` now dispatches on
  `opts.bot` between `'heuristic-1-ply'` (default) and `'monte-carlo'`
  (consumes `opts.botParams = { n, depthCap, rolloutStrategy }`). New
  file `platforms/tablet-sim/sim-worker.js` is a module worker that
  imports simCore and handles `{type:'run', id, bot, target, moves,
  botParams}` messages, posting back `{type:'result', id, result}` or
  `{type:'error', id, message}`. Vite auto-emits a separate worker
  chunk via `new Worker(new URL('./sim-worker.js', import.meta.url),
  { type: 'module' })`. SimBatchRunner gains: a "Monte Carlo" option in
  the bot dropdown; an MC Parameters sub-section (shown only when MC
  selected) with N (default 30, range 10–200), depth-cap (default 5,
  range 3–20), rollout strategy (default 1-Ply Heuristic; alt Random),
  and workers (default `navigator.hardwareConcurrency − 1`, range
  1–hardwareConcurrency) — all four sessionStorage-persisted under
  `m3_sim_mc_*` keys. Run-path dispatch: 1-ply continues on the
  synchronous `setTimeout(0)` loop unchanged; MC uses a worker pool
  (poolSize = min(mcWorkers, batchSize)) with dispatch-on-complete
  pattern — main thread initial-dispatches poolSize games, each
  `result` message pushes the result and dispatches the next pending
  game; `finish()` terminates all workers on completion. Cancel
  force-resolves the pending promise via `mcFinishRef.current()` since
  Worker.terminate() fires no event. Clipboard JSON metadata adds
  `botParams: { n, depthCap, rolloutStrategy, workers }` when bot is
  Monte Carlo. Results display gains a summary banner at the top
  showing bot name + key params (e.g., "Monte Carlo — N=30, depth 5,
  1-Ply Heuristic rollouts, 7 workers"). Build clean; sim bundle
  90.43 kB (from 85.90 kB), separate worker chunk `sim-worker-*.js`
  also emitted.

- **Simulation harness — admin batch runner + stats + histogram
  (Session E-1b).** 2026-04-23. Tablet-sim bumped `v1.1 → v1.2`. New
  "Simulation Batch Runner" card added to the tablet-sim admin wrapper
  (between the inherited Playback card and the launcher buttons). Bot
  dropdown (1-Ply Heuristic — MC slot reserved for E-2a), admin-
  tunable Target score (default 6000) and Moves per game (default
  20), both persisted to sessionStorage. Preset batch-size buttons
  `[10][50][100][200][1000]`. Async orchestration: `setTimeout(0)`
  yield per game with live progress text (`Running… N / total`) and a
  Cancel button; cancel discards the in-flight batch's results.
  Aggregate stats block covers outcomes (win/loss/stuck rates), score
  (mean · median · p10 · p90 · range), moves (avg-to-win · avg-in-
  loss), cascades (avg + best maxCombo), specials, bonus moves (%
  earning ≥1 · max earned), runtime (total · avg/game). Vertical-bar
  histogram with auto-sized 500/1000-pt buckets (1000 if observed
  range ≥10k), color-split at target (win side blue, loss side red),
  dashed yellow target line overlay, p10/median/p90 labels below.
  Collapsible per-game detail table (default expanded for batches
  ≤100, collapsed for 200/1000). Copy JSON button emits Option C
  shape: `{ metadata, aggregates, games }`. `_SIM.runGame` signature
  extended to `{ bot, target, moves, botParams }` — final shape set
  here so E-2a's Monte Carlo addition slots in without retrofit.
  Legacy keys (`tileCount`, `levelTarget`) still honored. Return
  shape adds `outcome` ('win'/'loss'/'stuck'), `bonusMovesEarned`
  accumulator (remaining field was always 0 post-v1.1 because bot
  consumes everything — earned is the useful counter for the "%
  earning ≥1" stat), `runtimeMs`, plus `bot` and `botParams` echoed
  for JSON metadata. Build clean; sim bundle 84.97 kB (from 71.13 kB
  — batch runner UI + helpers). Also updated `index.html` sim card
  desc + badge from stale `v1.0 · E-1a` to current `v1.2 · E-1b`
  (missed update during E-1a2 rolled forward).
