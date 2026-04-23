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
  2026-04-22). See `docs/PROGRESS-2026-04-22.md`. Campaign port pending.
- **Simulation harness — Session E₁ (1-ply, deferred).** In-browser admin
  button on the tablet: run N simulated games with a 1-ply heuristic bot
  (pick best swap by match length + cascade-potential + special-creation).
  Output: win rate per level, average score, best/worst runs. **Uses the
  existing game functions in the tablet file directly — no refactor.**
  The impure parts (React state, animation timers) are bypassed by
  driving `initializeGrid` / `findMatches` / `applyGravity` /
  `removeMatches` synchronously in a loop with in-memory state. Slower
  than a clean pure module would be, but practical for hundreds of games.

  ⚠ **Skill-gap caveat.** Skilled human play involves 5–8 move lookahead
  to set up multi-special cascade chains (see DESIGN.md). A 1-ply bot
  captures none of that. Interpret 1-ply results as *lower-bound casual*
  play — **never** tune level targets down based on bot win-rate alone,
  because the bot will always find the game harder than a skilled human
  does. Use 1-ply for: balance floor checks ("is this level winnable at
  all?"), spotting score distribution outliers, and comparing RELATIVE
  difficulty across levels. Not for absolute-difficulty tuning.

  **Deprioritized 2026-04-22.** Reward-mode sandbox (Session H) will be
  tuned by playtest feel instead. Pull E₁ forward if H reveals a need
  for score-distribution data.

- **Simulation harness — Session E₂ (Monte Carlo on sibling platform,
  deferred; after E₁).** New sibling platform at
  `platforms/tablet-sim/`, forked from the then-current tablet file. In
  the sim platform, the game logic (grid init, match detection, gravity,
  cascade resolution, scoring) is extracted into a pure framework-free
  module. **Only this sibling platform is refactored; the main tablet
  file is never touched.** The refactor's regression risk is contained
  to the sim platform — if the sim plays wrong, normal play is
  unaffected.

  MC loop: ~100 random playouts from each candidate swap; the swap with
  the highest average final score is the bot's pick. Captures cascade
  potential emergently without explicit deep lookahead.

  **Calibration instead of verification.** Don't require bit-identical
  snapshot equivalence between sim and main game. Instead, check that
  sim score distributions land in a similar range to observed human
  play on a few levels (if you score 15-30k on level 3 and the sim says
  12-32k, the model is faithful enough). If the sim reports wildly
  different ranges, it has a bug and we fix it.

  **Deprioritized 2026-04-22** alongside E₁. Pattern-based heuristic,
  deeper-search, and human-replay-capture approaches remain on the
  roadmap as E₂ alternatives if MC proves insufficient.
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

- **Reward-mode sandbox (Session H) — split into H₁ + H₂.** H₁ scaffold
  shipped 2026-04-22 (see Done section). H₂ remains:

  **Session H₂ — wire the 5 levers into game logic.** The admin UI,
  persistence, URL overrides, landing-page gate, and sibling platform
  are all live. H₂ hooks each lever into the actual game loop:
  - `tile_count`: override the tile-type draw at the two random-tile
    sites (initializeGrid and applyGravity refill). Guard the no-match
    scan on start.
  - `neighbor_bias`: modify `applyGravity` refill — roll per new tile,
    if hit, inherit a random neighbor's type.
  - `cluster_seed`: after `initializeGrid`, place N 3×3 same-color
    clusters; re-run no-match scan + reshuffle if violations.
  - `cluster_drop_bias`: in `applyGravity` refill — roll per new tile,
    if hit, inherit the type of the tile directly below.
  - `big_turn_threshold` + `super_pct` + `hyper_pct`: hook the cascade-
    end — if tiles cleared this turn ≥ threshold, roll once; on super/
    hyper hit, replace one random cleared cell's refill with a
    super/hyper tile.

  After wiring, playtest and iterate slider ranges + defaults. Lever
  interactions (e.g., high `cluster_seed` + high `neighbor_bias` could
  produce near-mono-color boards) may need bounds or a variety guard;
  evaluate after playtest.

  **Note:** the originally-scoped sixth lever `BIG_MATCH_POINT_MULT`
  was dropped 2026-04-22 per user call. Can be added back later if
  needed.

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
  **Levers are not yet wired into game logic** — board plays like
  tablet v11.11. Session H₂ (still planned) handles lever wiring.
