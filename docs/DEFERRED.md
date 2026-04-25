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
  title: "Titus 2:11–13",
  translation: "KJV",       // optional
  verses: [                 // single-level games use top-level `verses`
    {
      reference: "Titus 2:11",
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
- **First chunk pre-visible at game start** (locked during V-2 scoping
  2026-04-24 — easier memorization entry point, gives the player
  something to read before the first match).
- **Moves = chunks − 1** (because the first chunk is pre-visible, so
  matches reveal chunks 2 through N). For Titus 2:11–13 = 13 chunks =
  12 moves; default target = `12 × 300 = 3,600`.
- One chunk reveals per successful swap, at turn settle — after all
  cascades finish and the board stabilizes, then a **200ms beat** so
  the player reads the settled board before the text updates. Swaps
  that don't produce a match (snap back, no move counter decrement)
  also don't trigger a reveal.
- Text bar between banner and board; rolling 3-chunk window (current
  + 2 prior); current chunk emphasized (brighter / bolder), prior two
  dimmed. **Typography:** Georgia serif (locked 2026-04-24). Two-
  column layout — reference (e.g., `(Titus 2:11)`) flush left, chunk
  content indented so content-rows align under content-rows. Current
  chunk 22px fontWeight 500 full-contrast; prior two 15px regular
  dimmed (`#888` light / `#ccc` dark — respects `#ccc` floor rule).
  New-chunk reveal animation: ~250ms fade/slide from bottom; previous
  chunks shift up and demote. Container min-height ~96px so reveals
  don't shift the canvas.
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
- **Titus 2:11–13 NKJV — SHIPPED V-2 2026-04-24.** Single-level, 13
  chunks (3 / 6 / 4 across verses 11 / 12 / 13). Data lives at
  `platforms/tablet-verses/games/titus-2-11-13/game.js`. Translation
  NKJV. Reference is stored per verse (`reference: "Titus 2:11"`);
  the runtime renders it in the left column of the rolling text bar
  on the first chunk of each verse only. Explicit
  `targetScore: 3600` in the data (matches the `moves × 300`
  formula default with moves = chunks − 1 = 12). (Note for future
  readers: during scoping the user pasted the chunk content with
  "Titus 3:11–13" reference lines — that was a typo, corrected
  during Q1 fact-check. The text is NKJV Titus 2, not Titus 3.)
- **Psalm 91** — multi-level, 3–4 levels TBD during V-3 (user
  suggested this split during scoping). Ships with V-3 as the first
  multi-level content.

**Session plan (5 sessions):**

- **V-1 — Scaffold — SHIPPED 2026-04-24.** See Done section. Ships
  `match3-v1.0-tablet-verses.jsx`.

- **V-2 — Single-game MVP — SHIPPED 2026-04-24.** See Done section.
  Ships `match3-v1.3-tablet-verses.jsx`.

- **V-3a — Picker + back-nav + V-2 header shrink — SHIPPED
  2026-04-24.** See Done section. Bumps tablet-verses to v1.4.

- **V-3b — Multi-level + level-select + hybrid progression + Psalm 91
  — SHIPPED 2026-04-24.** See Done section. Bumps tablet-verses to v1.5.

- **V-3 — Picker + level-select + multi-level. Both halves shipped
  2026-04-24.** Original deep-scoping captured below for historical
  reference (decisions referenced by V-4 onward). All sub-decisions
  locked through V-3b.

  **Session split.** V-3 ran as two sessions to keep each under the
  context-budget ceiling (v1.3's post-V-2 inheritance already pushed
  the active file to ~4,200 lines, v1.5 lands at ~5,000):
  - **V-3a — picker only — SHIPPED 2026-04-24** (see Done). Main
    picker screen live, Titus boots through picker (hardcoded
    `VERSES_BOOT_SLUG` removed), V-2 follow-up header-shrink
    bundled. Single-level games click straight to play. Shipped
    `match3-v1.4-tablet-verses.jsx`.
  - **V-3b — `levels[]` + level-select + multi-level play flow +
    Psalm 91 + in-memory hybrid progression — SHIPPED 2026-04-24**
    (see Done). Wrapper-state lift (Option B), `versesFlattenLevel`
    extended for multi-level, `VersesLevelSelect` component, end-of-
    round button matrix per Decision #2, "Level N of M" inlined
    into header, instructions strip dejargoned. Shipped
    `match3-v1.5-tablet-verses.jsx`.

  **Picker screen (V-3a).**
  - Card grid: `repeat(auto-fill, minmax(220px, 1fr))`, same as
    `index.html` landing page.
  - Purple gradient background matching the in-game body (visual
    continuity across the stack).
  - Page header: "Verses" title + subtitle "Select a passage to
    begin." — subtitle open to change; alternatives parked if a
    better line surfaces: "Memorize through play.", "Match tiles.
    Learn Scripture.", "Play to memorize.", or omit the subtitle.
  - Per-card content (pre-V-4 — no stars/best-score/completed):
    - **Single-level game:** Title ("Titus 2:11–13") + translation
      below in smaller muted text ("NKJV"). Nothing else.
    - **Multi-level game:** same as single-level plus a third line
      reading `N levels` (e.g., "4 levels" for Psalm 91).
  - No emoji or icons on cards.
  - **Click behavior:** single-level → play; multi-level →
    level-select screen.
  - **Titus through picker.** The current V-2 hardcoded
    `VERSES_BOOT_SLUG = 'titus-2-11-13'` + direct boot becomes
    `activeSlug | null` state — null = show picker. When slug is
    selected, component enters play mode.

  **Level-select screen (V-3b — multi-level games only).**
  - Same visual language as main picker: purple gradient
    background, card grid.
  - Page header: game title ("Psalm 91") + `← Back` to main
    picker (top-left).
  - Per-level card content (pre-V-4): level title from
    `level.title` field if set (e.g., "Psalm 91:1–4"), else
    fallback "Level N". **Title only** — no chunk count, no move
    count, no target score. V-4 layers stars + best-score +
    completion marker into these same cards.
  - **Lock-state visuals:** unlocked cards render normally; locked
    cards render dimmed (opacity 0.5 + reduced color saturation
    via `filter: grayscale(0.7)` or similar — settle in playtest).
    Locked cards non-clickable (cursor default, no onClick).

  **Navigation + back-button flow.**
  - **In-game header, top-left:** `← Back` button, always
    clickable during play, no confirmation popup.
  - **Start-of-round passage modal:** `Back` button alongside
    `Begin game` / `Begin level` (since the modal covers the
    in-game header).
  - **Level-select screen header:** `← Back` to main picker.
  - **Routing targets:**
    - Single-level game (in-game or start modal) → main picker.
    - Multi-level game (in-game or start modal) → level-select.
    - Level-select → main picker.
  - **End-of-round modal buttons** stay as locked per the prior
    DEFERRED end-of-level flows (Play again / Next level / Retry /
    Back to level-select / Tablet arcade per state).
  - **Bonus-moves pool** behavior:
    - Zeroes on any return to main picker (exiting the game).
    - Persists moving between play ↔ level-select within the same
      game (level-to-level carry, per locked spec).
  - **No mid-round confirmation.** V-3 has no persistence; a
    misclick = restart, not lost data. Playtest will flag if a
    confirm is needed.

  **Hybrid progression at V-3 (in-memory only — V-4 adds persistence).**
  - Per game, track `completedLevels: Set<number>` of completed
    level indices in React state. Scoped to the currently-active
    game; cleared when player returns to main picker.
  - **Unlock logic:** Level 0 always unlocked. Level N unlocked
    iff Level N−1 is in `completedLevels` this session OR
    `fullCompleted` is true for this game.
  - **Full-game completion:** when `completedLevels.size ===
    game.levels.length`, flip `fullCompleted = true` → all levels
    unlocked for the rest of the session (free-replay mode).
  - **Refresh = reset.** Session-only. V-4 wraps the same state
    shape with localStorage for persistence.

  **Multi-level play UX.**
  - **In-game header (multi-level games only):** game title + a
    small "Level N of M" indicator.
  - **Start-of-round passage modal fires at the start of each
    level** (not just game start), showing that level's passage.
    Button label: "Begin game" for single-level (as shipped v1.2),
    "Begin level" in multi-level.
  - **Per-level state resets** on level transition (Next level
    button): score → 0, levelTarget → level's target, moves →
    `chunks.length − 1`, revealedChunkIndex → 0, targetReached →
    false, showTargetToast → false.
  - **Persists across levels within a game:** `bankedMoves`
    (locked per the bonus-moves spec), `completedLevels` Set,
    `fullCompleted` flag.

  **Psalm 91 content (V-3b — `games/psalm-91/game.js`).**
  - Translation: NKJV (consistent with Titus).
  - Reference format in data: **"Ps. 91:N"** (abbreviated, to
    fit the 110px reference column in the text bar without
    overflow on 2-digit verses — estimated "(Psalm 91:16)" at
    19px Georgia italic = ~112px, over the 110px column).
  - **4 thematic levels** on natural breakpoints (total 49 chunks):
    - **Level 1 — Ps. 91:1–4 (the secret place / refuge) — 13
      chunks / 12 moves / default target 3,600.**
    - **Level 2 — Ps. 91:5–8 (protection from danger) — 12
      chunks / 11 moves / default target 3,300.**
    - **Level 3 — Ps. 91:9–13 (angels / no harm) — 14 chunks /
      13 moves / default target 3,900.**
    - **Level 4 — Ps. 91:14–16 (God speaks) — 10 chunks / 9
      moves / default target 2,700.**
  - Per-level `targetScore` defaults to `moves × 300`; override
    per level in data if playtest shows mis-tuning.

  **Psalm 91 chunks** (user-authored 2026-04-24, 6 NKJV proofread
  fixes applied, reference format normalized to "Ps. 91:N"):

  ```
  Level 1 — Ps. 91:1–4 (13 chunks)

  (Ps. 91:1)
    He who dwells
    In the secret place of the Most High          [fix: lowercase "of"]
    Shall abide under the shadow                   [fix: "under" not "in"]
    Of the Almighty

  (Ps. 91:2)
    I will say of the Lord
    "He is my refuge and my fortress;              [fix: added "my" before "fortress"]
    My God, in Him I will trust."

  (Ps. 91:3)
    Surely He shall deliver you
    From the snare of the fowler
    And from the perilous pestilence

  (Ps. 91:4)
    He shall cover you with His feathers
    And under His wings you shall take refuge;
    His truth shall be your shield and buckler.

  Level 2 — Ps. 91:5–8 (12 chunks)

  (Ps. 91:5)
    You shall not be afraid
    of the terror by night,
    Nor of the arrow that flies by day.            [fix: "Nor of" not "Nor"]

  (Ps. 91:6)
    Nor of the pestilence
    That walks in darkness
    Nor of the destruction
    That lays waste at noonday

  (Ps. 91:7)
    A thousand may fall at your side,
    And ten thousand at your right hand;
    But it shall not come near you.

  (Ps. 91:8)
    Only with your eyes shall you look,
    And see the reward of the wicked

  Level 3 — Ps. 91:9–13 (14 chunks)

  (Ps. 91:9)
    Because you have made the LORD,                [fix: comma not period; LORD all-caps]
    Who is my refuge
    Even the Most High,
    Your dwelling place

  (Ps. 91:10)
    No evil shall befall you,
    Nor shall any plague come near your dwelling.

  (Ps. 91:11)
    For He shall give His angels charge over you
    To keep you in all your ways.

  (Ps. 91:12)
    In their hands they shall bear you up
    Lest you dash your foot against a stone.

  (Ps. 91:13)
    You shall tread upon
    The lion and the cobra
    The young lion and the serpent
    You shall trample underfoot.

  Level 4 — Ps. 91:14–16 (10 chunks)

  (Ps. 91:14)
    "Because he has set his love upon Me
    Therefore I will deliver him;
    I will set him on high
    Because he has known My name.                  [fix: capital "My"]

  (Ps. 91:15)
    He shall call upon Me
    And I will answer him
    I will be with him in trouble;
    I will deliver him and honor him

  (Ps. 91:16)
    With long life I will satisfy him,
    And show him My salvation.
  ```

  **V-2 follow-up bundled into V-3a first commit.** Further header
  shrink — the v1.3 header still has whitespace between the title
  and the Score/Moves/Target row (the `justifyContent:
  space-between` + `minHeight: 80px` stretches content apart).
  Cheap fix: drop to `justifyContent: flex-start` with a small
  explicit gap, or drop `minHeight` entirely and let the header
  size to content. ~3 lines of style changes. Lands in the first
  V-3a commit before picker work.

  **Version numbering across V-3:**
  - V-3a ships `match3-v1.4-tablet-verses.jsx`.
  - V-3b ships `match3-v1.5-tablet-verses.jsx`.

- **V-4 — Stars, persistence, victory round, arcade handoff —
  SHIPPED 2026-04-24.** See Done section. Bumps tablet-verses to
  v1.6 + tablet arcade to v11.12.

- **V-5 — Admin + polish — DEFERRED 2026-04-24, "if needed."**
  Originally scoped: admin panel behind long-press-logo unlock with
  reveal-delay slider, simulate-completed button, reset-stats
  button, and debug log toggle. **Polish was rolled into V-2 → V-4
  inline as playtest signal arrived**, and on review the remaining
  admin features didn't justify a session of their own — most of
  the cost is the panel scaffolding itself, and only "simulate
  game completed" had standing value (a transient testing tool).
  Hand-editing localStorage in DevTools covers that use case if it
  ever surfaces. Re-open as a session if a specific need comes up.
  Ships `match3-v1.7-tablet-verses.jsx` if/when shipped.

**Future option (surfaced during v1.3 playtest, not committed to a
session):** **Smaller board in VERSES_MODE — remove two rows
(10×12 → 10×10).** Would shave another ~90–100px off the vertical
layout. Gameplay-affecting: fewer positions → fewer cascade
opportunities per move → lower expected score per move. Target
formula would need re-tuning (currently `moves × 300 = 3,600` at
12 chunks — a smaller board may warrant a lower per-move
multiplier, e.g. `moves × 250`). User noted target-score tuning is
fine since scoring isn't the emphasis of memorize mode. Not
committed to V-3/V-4/V-5; pick up if viewport fit is still tight
after v1.3's chrome trim, or ignore if playtest shows v1.3 is
enough on the user's primary display. The change is scoped to
VERSES_MODE (not a shared-core tablet change) so it doesn't affect
tablet arcade tuning.

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

- **Memorize Mode stars + persistence + 1.5× victory + arcade
  handoff + board shrink + see-entire-passage (Session V-4).**
  2026-04-24. Tablet-verses bumped `v1.5 → v1.6`
  (`match3-v1.6-tablet-verses.jsx`); tablet arcade bumped
  `v11.11 → v11.12` (`match3-v11.12-tablet.jsx`) for the entry
  banner. Largest single delivery in the V-* track. Same-day ship
  after V-3b + V-4 scoping. Six-decision scoping pass first
  (persistence shape / star rendering / card layout / victory round
  / arcade handoff / impl order); two mid-V-4 fold-ins driven by
  V-3b playtest (board shrink, see-entire-passage reveal).

  **Persistence layer (Decision #1).** `progress: Record<slug,
  GameProgress>` map on the wrapper, hydrated eagerly at mount from
  `m3_verses_<slug>` localStorage keys. Persisted via single
  `useEffect` that writes every slug's blob on any progress change
  (small N — 2 games at V-4 — so per-slug-write tracking is
  premature). Schema:
  ```js
  {
    version: 1,
    levels: Array<null | { best, stars, completions, lastPlayed }>,
    completedLevels: number[],
    fullCompleted: boolean
  }
  ```
  Empty/malformed/wrong-version blobs fall back to a freshly-built
  empty progress object via `versesEmptyProgress(game)`. On
  game-pick, the wrapper hydrates session-mirror state
  (`completedLevels` Set, `fullCompleted` boolean) from
  `progress[slug]` so a returning player sees their unlocks intact.
  bankedMoves stays session-only (zero on return to picker).

  **Stars (Decision #2).** `★` Unicode character (not emoji),
  five per level. Earned: `color: '#FFD700'` (gold). Unearned:
  `color: '#ccc'`. Same character + colors as `core/AdminPanel.jsx`
  and the campaign file — reused exactly for visual consistency.
  Thresholds locked at `[1.00, 1.15, 1.30, 1.50, 1.75]` × target
  → 1/2/3/4/5 stars. 0 stars when target wasn't hit.
  `versesComputeStars(score, target)` and `versesAggregateStars(game,
  gameProgress)` helpers added near the top of the file.
  No-regression rule: best/stars only update if new value is higher;
  completions and lastPlayed always update.

  **Card UI (Decision #3).**
  - **Picker cards (`VersesPicker`):** new `X / Y ★` aggregate line
    (always rendered for shape consistency — "0 / 5 ★" for unplayed
    games, gold ★ when at least one earned). Inline ✓ before title
    when `fullCompleted`. Locked-card path (V-3b) unchanged.
  - **Level-select cards (`VersesLevelSelect`):** new `VersesStarRow`
    component renders 5 `★` per unlocked card. `Best: 4,250` line
    below stars when there's a best to show. Inline ✓ before title
    for completed levels (won at least once). Unlocked-but-unplayed
    cards show 5 empty stars (clear "play this for stars" affordance)
    + omit the best line. Locked cards stay title-only (V-3b spec).

  **Victory round (Decision #4).** `bonusRoundActive` flag (already
  wired into the scoring branch with `BONUS_ROUND_MULTIPLIER = 1.5`)
  auto-flips true when `targetReached` flips true in VERSES_MODE —
  silent activation, no prompt. Toast copy updated from V-2's
  `✓ Target reached!` to `✓ Target reached — 1.5×!`. Persistent
  `· 1.5×` appended after the gold ✓ on the header Target field
  during the multiplier window. Both clear on level transition via
  the `slug:levelIndex` remount.

  **Arcade-mode handoff (Decision #5).** V-3b's inactive Arcade mode
  button on the final-level first-pass win modal flips active.
  onClick: writes bankedMoves to BANKED_KEY (additive — adds to any
  existing arcade balance, doesn't overwrite) + writes
  `m3_arcade_carry_from_verses` carry-receipt key with amount +
  ISO timestamp + navigates to `${BASE_URL}tablet.html`. Tablet
  arcade v11.12 (separate platform-file bump in this same V-4
  commit) reads the carry-receipt key in a useEffect at component
  mount, shows a 2.5s top banner reading `+N bonus moves carried
  from memorize mode`, and clears the receipt key (refresh doesn't
  replay the banner). Banner styling matches the V-2 target-toast
  (gold gradient pill, Georgia 16px, bold).

  **Board shrink + text bar bump (mid-V-4 fold-in from V-3b
  playtest).** VERSES_MODE: `ROWS` 12 → 10 (conditional, arcade
  fallback path stays at 12 rows for theoretical regression
  isolation — VERSES_MODE is always true at runtime). Frees ~100px
  of vertical space and changes scoring expectation slightly
  (fewer cascade opportunities → lower expected per-move score).
  Target formula stays at `moves × 300` for V-4 ship; tune to
  250 in playtest if needed.

  Text bar (post-playtest tune in this same session): main chunk
  19 → 20px, prior chunks 13 → 15px, padding 8 → 12px vertical,
  reference column always 15px regardless of row (no longer scales
  with the current-row size). First pass tried 22px main + a gold
  left-border accent + tinted background on the current row;
  playtest reaction was "too big and the bar doesn't help" — same-
  session retune dropped to 20px and removed the highlight
  decorations. Bigger font + bolder weight handles prominence on
  its own.

  **"See entire X" reveal (mid-V-4 fold-in).** New
  `versesFlattenAllChunks(game)` helper concatenates `flatChunks`
  across every level, preserving per-verse reference markers. New
  `VersesFullPassageModal` component renders the concatenated
  chunks in the same Georgia two-column layout as the V-2 end-of-
  round modal. State (`showFullPassage`) lives on the wrapper so
  both `VersesGame` (final-level win modal) and `VersesLevelSelect`
  (free-replay mode) can trigger the same opener.

  **Button placement:**
  - **Final-level first-pass win modal:** 4th button after Play
    again / Back to level selections / Arcade mode, labeled
    `See entire <game.title>` (e.g., "See entire Psalm 91"). User
    explicitly OK'd 4-button width; if cluttered, split into rows
    later (back-style top, forward-style bottom).
  - **Level-select page (free-replay mode only):** secondary
    bordered button below the card grid, italic Georgia,
    `See entire <game.title>`. Always-available bridge once the
    game is fully completed.

  Single-level games (Titus) don't get the button — their existing
  end-of-round modal already shows the full passage as one read.

  **Naming locked during V-4 scoping.** "Arcade mode" replaced V-3b's
  "Tablet arcade" in player-facing UI ("Tablet arcade" leaks the
  platform name; "Arcade mode" reads cleaner). Inactive caption
  "Available in v1.6" was V-3b's placeholder; V-4 ships v1.6 active,
  caption removed. V-5 should sweep for any holdover references.

  **Wiring.** `src/entry-verses.jsx` imports v1.6; `src/main.jsx`
  imports tablet v11.12; `index.html` Verses card desc → `v1.6 ·
  stars + persistence + 1.5× victory + arcade handoff · 10-row
  board`; tablet card desc → `v11.12 · verses → arcade carry banner
  · v11.11 contrast fix · bonus cap 99 · run tracking · scoring-
  history panel`. Build clean: verses 75.72 → 81.60 kB (+5.88 kB);
  tablet 64.37 → 65.26 kB (+0.89 kB).

  **Open for V-4 playtest:**
  - Star thresholds vs. the smaller 10-row board (5★ = 1.75× target;
    achievable on Psalm 91 levels with fewer cascade opportunities?).
  - 1.5× scoring feel — toast + persistent header indicator + actual
    score acceleration coherence.
  - Arcade-mode handoff round-trip: complete Psalm 91, click
    Arcade mode, verify banner on tablet entry, verify bonus moves
    are spendable in arcade.
  - Star contrast on the dim level-select cards (locked vs unlocked
    sibling visual difference).

- **Memorize Mode multi-level + level-select + Psalm 91 (Session
  V-3b).** 2026-04-24. Tablet-verses bumped `v1.4 → v1.5`
  (`match3-v1.5-tablet-verses.jsx`). Same-day ship after V-3a +
  scoping. Five-decision scoping pass first (state architecture /
  end-of-round button matrix / locked-card visuals / level-select
  layout / implementation order) — all decisions captured in the
  V-3 entry above as locked sub-decisions.

  **Wrapper-state lift (Decision #1, Option B locked).** Outer
  `Match3Verses` wrapper now owns navigation state at two scopes
  — passage (`activeSlug`) and level (`activeLevelIndex`) — plus
  cross-level state that survives level transitions within a game
  (`completedLevels: Set<number>`, `fullCompleted: boolean`) and
  the bonus-moves pool that has to survive level-to-level remount
  (`bankedMoves`). Three render branches: `VersesPicker` (no
  slug) / `VersesLevelSelect` (multi-level + no levelIndex) /
  `VersesGame` (slug + levelIndex set). `VersesGame` keys on
  `${slug}:${levelIndex}` so each pick AND each level transition
  triggers a fresh mount; per-level state (score, moves, target,
  revealedChunkIndex) auto-resets without manual orchestration.

  **`bankedMoves` lift.** State moved out of `VersesGame` onto the
  wrapper. The persist-to-`BANKED_KEY` effect also moved (still
  short-circuits in VERSES_MODE; arcade fallback still hydrates
  from / writes to `BANKED_KEY` if VERSES_MODE is ever flipped
  off). Inside `VersesGame`, kept all existing call sites readable
  via `const setBankedMoves = onBankedMovesChange` alias —
  functional updaters (`setBankedMoves(prev => ...)`) keep
  working because both React's useState dispatch and the wrapper's
  setter accept updater functions. Roughly half-dozen call sites
  total, none changed syntactically.

  **Wrapper navigation handlers.**
  - `handlePick(slug)` — picker → play (single-level) or →
    level-select (multi-level). Resets cross-level state.
  - `handleBackToPicker()` — full reset: clears slug, level,
    completedLevels, fullCompleted, bankedMoves.
  - `handleBackToLevelSelect()` — clears activeLevelIndex only;
    keeps game-scoped state.
  - `handleInGameBack()` — routes to picker (single-level) or
    level-select (multi-level).
  - `handleLevelComplete(idx)` — adds idx to completedLevels;
    flips fullCompleted when set fills.
  - `onAdvanceLevel` — increments activeLevelIndex (Next level →).
  - `onRestartGame` — final-level "Play again": resets
    activeLevelIndex to 0, zeros bankedMoves, keeps
    completedLevels (player stays in free-replay).

  **Data shape extension.** `versesFlattenLevel(game, levelIndex
  = 0)` extended from v1.4's single-level signature. Single-level
  games (top-level `verses` array) ignore the index. Multi-level
  games (`levels[]` array) pick `levels[levelIndex]` with bounds
  checking — out-of-range returns null. `versesIsMultiLevel(game)`
  helper added for picker → play vs. level-select branching.

  **`VersesLevelSelect` component (Decision #4).** Same purple
  gradient + Georgia 36px centered title + `repeat(auto-fill,
  minmax(220px, 1fr))` card grid as `VersesPicker`. Top-left
  `← Back to passage selections` button. Page header = game
  title (e.g., "Psalm 91"). Per-card content: `level.title`
  (e.g., "Psalm 91:1–4") or fallback "Level N". Title only —
  no chunk count / move count / target score (V-4 layers stars
  + best-score + ✓-completed marker). No subtitle (Decision #4
  — game title already orients).

  **Locked-card visuals (Decision #3).** Locked cards: opacity
  0.5 + `filter: grayscale(0.7)`, no hover-lift, `cursor:
  default`, no `onClick` handler. Renders as a `<div>` instead
  of `<button>` so it's not focusable. Unlocked cards keep the
  picker's hover-lift (`translateY(-2px)` + shadow lift). Unlock
  rule: Level 0 always unlocked; Level N unlocked iff N−1 is in
  `completedLevels` for the current session OR `fullCompleted`
  is true.

  **Hybrid progression wire-up.** `VersesGame` calls
  `onLevelComplete(levelIndex)` from inside the existing end-of-
  round timer callback that opens the passage modal — fires once
  per round, only when `targetReached` is true (= win). Wrapper
  adds the index to `completedLevels` and flips `fullCompleted`
  when the set fills. In-memory only; V-4 wraps the same shape
  with `m3_verses_*` localStorage keys.

  **Multi-level play UX.**
  - In-game header: "Level N of M" inlined as a small italic
    Georgia span (13px, #777) directly after the game title.
    Inlined rather than a second row to keep the header at one
    line — same shrink principle as V-2's specials-on-board /
    combo-indicator removal. (Initial implementation put it on
    a second row; user flagged the height regression during
    V-3b playtest, fixed same-session.)
  - Start-of-round modal button: "Begin game" (single-level)
    or "Begin level" (multi-level). Back button alongside (V-3a
    spec).
  - Per-level state resets fall out of the slug:levelIndex
    remount; no manual reset effects.

  **End-of-round modal button matrix (Decision #2).** Driven by
  a small lookup based on isMultiLevel / targetReached /
  isFinalLevel / fullCompleted state at modal-open time. Six
  rows in the matrix:
  - Single-level (Titus): Play again + Back to passage selections.
  - Multi-level, win, non-final, first-pass: Next level → +
    Back to level selections.
  - Multi-level, win, final, first-pass (game completes):
    Play again + Back to level selections + Arcade mode (inactive,
    opacity 0.5, no onClick, "Available in v1.6" caption).
  - Multi-level, fail (any position), first-pass: Retry +
    Back to level selections.
  - Multi-level, win, free-replay: Replay + Back to level selections.
  - Multi-level, fail, free-replay: Retry + Back to level selections.

  **Naming locked during scoping.** "Back to passage selections"
  for the verses-game-list screen and "Back to level selections"
  for the level-select screen — wordier than "passages" /
  "levels" alone but unambiguous (user flagged "passages" as
  having multiple meanings). "Arcade mode" replaced "Tablet
  arcade" — the latter leaks the platform name into player-
  facing UI. The "Choose passage" / "Choose level" alternative
  was considered and rejected ("Back to..." is more explicit
  about the navigation direction).

  **Instructions-strip dejargoning** (V-2 carry-over).
  Replaced "Match 3+ tiles to reveal each chunk" / "keep playing
  through all chunks to see the full passage" with "Match 3+
  tiles to reveal more text" / "keep playing to see the full
  passage." Standing rule: "chunk" stays in code, comments,
  DEFERRED.md but never in user-facing strings.

  **Psalm 91 content** (`games/psalm-91/game.js`). 4 thematic
  levels split on natural verse breakpoints: Ps. 91:1–4 (13
  chunks / 12 moves), Ps. 91:5–8 (12 chunks / 11 moves),
  Ps. 91:9–13 (14 chunks / 13 moves), Ps. 91:14–16 (10 chunks
  / 9 moves). Total 49 chunks / 45 moves. NKJV, reference
  format "Ps. 91:N" to fit the existing 110px text-bar column.
  Default per-level targets via `moves × 300` formula — no
  per-level overrides at V-3b ship; tune in playtest.
  Six NKJV proofread fixes (vs. user's first-pass authoring)
  applied during V-3 deep-scoping and re-applied here:
  Ps. 91:1 "of the Most High" lowercase + "under" the shadow
  (not "in"); Ps. 91:2 "and my fortress" (added missing "my");
  Ps. 91:5 "Nor of the arrow" (not "Nor"); Ps. 91:9 comma not
  period after "the LORD" + LORD all-caps; Ps. 91:14 capital
  "My" in "My name."

  **Wiring.** `src/entry-verses.jsx` imports v1.5; `index.html`
  Verses card desc → `v1.5 · multi-level + Psalm 91 · Titus
  2:11–13`. Build clean: verses bundle 65.56 (v1.4) → 75.72 kB
  (+10.16 kB across V-3b). Picker, level-select, end-of-round
  matrix all visually verified during user playtest.

  **Open for V-3b playtest / V-4 implementation:**
  - "Available in v1.6" caption tone on the inactive Arcade
    mode button — could read internal/jargon-y. Revisit for V-4
    when it flips active.
  - Locked-card dimming aggressiveness (opacity 0.5 +
    grayscale 0.7) — settle in playtest if the visual cue
    reads strong enough vs. unlocked siblings.
  - Free-replay end-of-round modal feel (Replay/Retry).

- **Memorize Mode picker + back-nav (Session V-3a).** 2026-04-24.
  Tablet-verses bumped `v1.3 → v1.4`
  (`match3-v1.4-tablet-verses.jsx`). The exported `Match3Verses`
  is now a thin outer wrapper that manages `activeSlug` state;
  null = picker, set = mount the renamed game component. The
  v1.3 component was renamed `Match3Verses → VersesGame` and now
  takes `{ slug, onBack }` props. Module-level
  `VERSES_BOOT_SLUG`, `versesActiveGame`, `versesActiveLevel`
  constants removed; `VersesGame` derives game + level via
  `useMemo` from the slug prop. `useState` initializers for
  `moves` and `levelTarget` read the same per-mount `versesLevel`
  (was the module constant in v1.3). The outer wrapper passes
  `key={slug}` so each pick triggers a fresh mount (and V-3b's
  level-to-level transitions will too without wrapper changes).

  **`VersesPicker` component.** Card grid
  `repeat(auto-fill, minmax(220px, 1fr))` matching the index.html
  landing page; purple gradient background matching the in-game
  body for visual continuity. Header: "Verses" (Georgia, 36px) +
  italic subtitle "Select a passage to begin." Card content:
  title (18px, fontWeight 600) + translation (13px, #888) +
  optional "N levels" line for multi-level games. No emoji or
  icons. Hover: translateY(-2px) + box-shadow lift. Empty-
  registry fallback message. Onclick: setActiveSlug(slug) — same
  for single- and multi-level (V-3a has only single-level Titus;
  V-3b adds the level-select branch when multi-level games exist).

  **Back navigation.** Two entry points to the picker:
  - **In-game header `← Back`** (top-left, mirrors the dark/light
    toggle's positioning). Always clickable during play, no
    confirmation popup per V-3 spec.
  - **Start-of-round modal `Back`** (alongside `Begin game`). The
    modal covers the in-game header, so its own Back button is
    needed when the player wants to bail at game-start before
    swapping a tile.
  Both call the `onBack` prop, which the outer wrapper sets to
  `() => setActiveSlug(null)`. End-of-round modal does not get a
  Back button — V-2's post-round buttons (`Play again`) are the
  routing surface there.

  **Bonus-moves localStorage decoupling.** V-3 spec: pool zeroes on
  any return to picker. Naive remount-via-key was insufficient —
  the v1.3 useState initializer read from `BANKED_KEY` and the
  persist-to-localStorage effect would have re-hydrated it on the
  next pick. Fix: in VERSES_MODE, init to 0 and short-circuit the
  write effect. Memorize-mode bonus moves are now session-scoped
  and never bleed into the shared `BANKED_KEY` that arcade mode
  reads.

  **V-2 follow-up header shrink (bundled).** v1.3 header still had
  whitespace between the title and the Score/Moves/Target row
  because of `justifyContent: 'space-between'` + `minHeight: 80px`
  stretching content apart. v1.4 in VERSES_MODE drops `minHeight`
  (header sizes to content) and switches to
  `justifyContent: 'flex-start'` + `gap: '6px'`. Three-line style
  change, scoped to VERSES_MODE only.

  **Wiring.** `src/entry-verses.jsx` imports v1.4; `index.html`
  Verses card desc → `v1.4 · picker + back-nav · Titus 2:11–13`.
  Build clean: verses bundle 65.56 → 68.30 kB (+2.74 kB).
  Picker strings (`Select a passage to begin`, `Back to picker`)
  verified bundled.

  **Open for V-3a playtest:** picker subtitle copy (alternatives
  parked); card hover-lift feel; card-grid spacing on small
  viewports; in-game header fit after the shrink; header-trim
  whitespace verification.

- **Memorize Mode MVP — single game (Session V-2).** 2026-04-24.
  Tablet-verses bumped `v1.0 → v1.3` (`match3-v1.3-tablet-verses.jsx`)
  over three same-session iterations: v1.1 first-pass implementation,
  v1.2 polish (font / reveal-timing / text-bar / start-modal), v1.3
  header trim for viewport fit (see "v1.2 polish pass" and "v1.3
  header trim" at the bottom of this entry). First playtest-able
  memorize-mode version. New content layer:
  `platforms/tablet-verses/games/` with `_template/` (skeleton
  `game.js` covering both single-level `verses` and multi-level
  `levels[]` shapes + authoring `README.md`) and
  `titus-2-11-13/game.js` (NKJV, 13 chunks across verses 11 / 12 /
  13 in a 3 / 6 / 4 split, explicit `targetScore: 3600`). Discovery
  via `import.meta.glob('./games/*/game.js', { eager: true })`;
  runtime filters `_`-prefixed slugs and `hidden: true`. V-2 hard-
  codes boot to slug `titus-2-11-13`; V-3 adds the picker on top of
  the same registry. Game-loop interface takes a **level**
  (`{ verses, targetScore, totalChunks, moves, target }`) — single-
  level data is wrapped as `levels[0]` at the flatten boundary so
  V-3 drops in without a game-loop refactor.

  New `VERSES_MODE` module constant gates the memorize flow (always
  true at V-2; flip false to restore pure tablet-arcade behavior).
  Initial `moves` and `levelTarget` seed from the active level
  (moves = 12, target = 3,600 for Titus). Three new state slots —
  `revealedChunkIndex`, `showTargetToast`, `showPassageModal` — plus
  `pendingRevealRef` and `prevMovesRef` carry the chunk-reveal
  pipeline.

  **Chunk reveal** is driven by two `useEffect`s (no splice into
  the tablet cascade pipeline):
  - Moves-decrement detector on `[moves]` arms `pendingRevealRef`
    when a move is consumed. Uses `prevMovesRef` to ignore mount
    and restart. Non-match snap-backs don't decrement moves, so
    they don't arm a reveal.
  - Post-settle reveal effect on
    `[turnComplete, isAnimating, combo, pendingSpecials.length,
    gameState, moves]` fires a 200ms beat then commits the reveal
    (cap at `totalChunks - 1`) and clears the ref.

  **Target-hit toast + header state.** Fires when the existing
  `targetReached` flag transitions true (unchanged win-condition
  effect still owns it). Gold "✓ Target reached!" toast at top,
  auto-dismisses at 2.5s; persistent gold + ✓ on the header
  Target field stays through end-of-round. No 1.5× scoring — that
  lands in V-4 with a one-line scoring-branch wire and an updated
  toast copy.

  **Arcade end-of-run flow suppressed in VERSES_MODE.** The
  existing game-end effect short-circuits with `if (VERSES_MODE)
  return;` after the `pendingThreshold` bail but before all three
  resolution branches (target-hit prompt, bonus-round end,
  moves=0 resolution). Bonus-move-accrual effect stays live — the
  10k-threshold counter keeps ticking so earned bonus moves
  register (and then sit idle at V-2 since nothing consumes them).
  Arcade end banner render is additionally wrapped with
  `!VERSES_MODE` for defense in depth (currently redundant).
  `gameState` stays `'playing'` through the entire verses round;
  the passage modal is the only exit.

  **End-of-round trigger.** A separate effect on
  `[moves, revealedChunkIndex, showPassageModal, gameState,
  isAnimating, combo, pendingSpecials.length]` opens the passage
  modal after a 2.5s hold, gated on: moves=0 + revealedChunkIndex at
  final + no in-flight animation + no pending reveal. Opens once
  per round.

  **Rolling 3-chunk text bar.** New component between header and
  canvas. Width matches the board; min-height 96px keeps canvas
  position stable. Georgia serif, two-column grid (110px reference
  column, 1fr content column). Reference shows only on chunks that
  begin a new verse. Current chunk 22px fontWeight 500 full
  contrast `#333`; prior two 15px regular `#888` (light card
  background, so #ccc floor rule doesn't apply). Newest chunk
  animates via `@keyframes versesChunkIn` (250ms fade + 8px
  upward slide); stable-keyed rows don't re-animate on re-render.

  **Passage-reveal modal.** Centered dimmed-overlay modal
  (`rgba(0,0,0,0.5)`, no blur). Shows all 13 chunks in the same
  Georgia two-column layout as the rolling bar, full contrast,
  references in accent blue. Translation label above
  (`Titus 2:11–13 · NKJV`). Single `Play again` button. No auto-
  dismiss. The rolling text bar stays rendered underneath (modal
  overlay hides it).

  **In-game header** is now content-driven — reads
  `versesGame.title` ("Titus 2:11–13"), Georgia serif. No version
  badge inline (version lives in the filename and the landing-page
  card).

  **Play Again** (`restartGame` in VERSES_MODE) reseeds moves and
  target from the active level, resets reveal index to 0 (chunk 0
  pre-visible again), clears toast + modal + pending / prev refs,
  and **zeros `bankedMoves`** (V-2 has no consumption path;
  persisting would stockpile dead currency — V-4's arcade handoff
  changes this).

  **Instructions strip** rewritten for VERSES_MODE: "Match 3+ tiles
  to reveal each chunk. Line / bomb / cross specials reward bigger
  matches. Hit the target to earn a ✓ — keep playing through all
  chunks to see the full passage." Arcade instructions preserved
  under `!VERSES_MODE`.

  **Wiring.** `src/entry-verses.jsx` imports v1.3;
  `index.html` Verses card desc → `Titus 2:11-13 v1.3` (badge
  unchanged). Build clean: verses bundle
  64.37 kB → 65.56 kB (+1.19 kB over v1.0); Titus chunk strings
  verified bundled.

  **v1.2 polish pass (same-session, post-playtest).** Four fixes
  driven by the v1.1 playtest:
  1. **Header font.** Georgia override on the game-header `<h1>`
     removed; header stays Arial to match the rest of the header
     chrome. Georgia is reserved for content typography (text bar
     + modal).
  2. **Reveal-on-decrement.** v1.1 fired the reveal at post-settle
     + 200ms beat; v1.2 fires it the instant `moves` decrements, so
     the next chunk is visible during the cascade rather than
     trailing it. Dropped: `pendingRevealRef`, the settle-wait
     effect, `CHUNK_REVEAL_BEAT_MS` constant. Kept: 250ms CSS
     fade-in. Net simpler (one effect instead of two).
  3. **Text-bar tightening.** Drop `minHeight: 96px` (container
     sizes to content); padding 14px 20px → 8px 20px; fonts
     current 22 → 19px, prior 15 → 13px; line-height 1.3 → 1.2;
     gap 4 → 3px; margin-bottom 16 → 12px. Solves (a) the empty
     whitespace at top during early game and (b) the board +
     banner + text bar not fitting in a viewport. Trade-off: board
     shifts down across the first two reveals, then stable.
  4. **Start-of-round passage modal.** New `showStartModal` state,
     init true; re-opened by `restartGame`. Reuses the end-of-
     round modal with a `Begin game` button that just closes the
     modal; end-of-round keeps `Play again` → `restartGame`.
     Memorization aid — player sees the full target passage before
     each run. Swap handlers add `showStartModal || showPassageModal`
     to their existing `moves <= 0` freeze guard.

  **v1.3 header trim (same-session, post-v1.2-playtest).** After
  v1.2 still didn't fit the header + text bar + board in a standard
  laptop-browser viewport, trimmed arcade-flavored header chrome in
  VERSES_MODE:
  - Hide the "✨ Specials on board: N" line (`!VERSES_MODE &&`
    guard on the div).
  - Hide the combo-indicator + idle-stats slot entirely (min-height
    24px div gone). Score popups over the board still show per-
    match points + multiplier, so mechanic feedback remains
    where the player is looking.
  - Header card padding `12px 20px → 10px 20px`, margin-bottom
    `20 → 14px`, minHeight `110 → 80px` — all VERSES_MODE only.
  - Kept: title, Score, Moves, Bonus moves (when >0), Target,
    dark/light toggle.

  Chose chrome-cut path over shrinking tiles or removing rows
  (both would change gameplay dynamics — target / bonus-move
  thresholds are tuned to the current 10×12 grid). Build impact:
  verses bundle shrank 66.59 → 65.56 kB since the guarded render
  branches tree-shake under `VERSES_MODE = true` at module load.

  **Playtest defaults open for adjustment** (flagged during V-2
  scoping as round-number guesses):
  - 200ms settle beat — board-read before text shifts.
  - 250ms chunk fade-in — chunk entry pacing.
  - 2.5s passage-modal hold — absorb final chunk.
  - 2.5s target-toast duration.
  - Georgia sizes (22px current / 15px prior / 19px modal body).

- **Memorize Mode scaffold (Session V-1).** 2026-04-24. New sibling
  platform `platforms/tablet-verses/match3-v1.0-tablet-verses.jsx`
  forked from tablet v11.11. Plumbing only — platform plays exactly
  like tablet arcade; no memorize-specific logic. Changes vs. source:
  component renamed `Match3Game → Match3Verses`; in-game header
  `"🎮 Match-3 v11.11"` → `"Verses v1.0"` (no emoji per scoping,
  content-driven title deferred to V-2); version comment block
  prepended with V-1 provenance, full tablet history carried forward.
  New files: `verses.html` (root), `src/entry-verses.jsx`,
  `platforms/tablet-verses/archive/` (empty, ready for future
  versioning). `vite.config.js` gains `verses` rollup input. Landing-
  page card added to `index.html` at end of main grid (after Campaign):
  label "Verses", name "📖 Verses", desc "v1.0 · scaffold — plays like
  tablet arcade · memorize mechanics land in V-2", badge In Progress
  (wip). Build clean: `dist/verses.html` emitted, verses bundle
  64.37 kB matches tablet bundle byte-for-byte outside the rebrand.
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
