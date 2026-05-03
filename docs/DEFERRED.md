# M3 — Deferred Work

> **Naming note (Session P-2, 2026-05-02):** The two phone platforms were
> renamed: `phone-418` → `phone` (arcade), `phone-418-verses` → `phone-verses`.
> Phone-341 was retired (archived only, no longer builds). Earlier entries
> below use the old `phone-418` / `phone-341` names where they describe
> work scoped under those names — kept as-is for historical accuracy.
> The "Cross-platform terminology + naming sweep" entry has been updated
> to reflect the new path names + the five `phone418` storage-string
> values that still need to migrate together.

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
- **Phone-418 AdminPanel + recordGameResult() port.** Surfaced 2026-04-27
  during M-1 parity comparison. Phone-418 doesn't import from `core/AdminPanel.jsx`
  — no `?admin=1` URL access, no long-press-score panel, no scoring history,
  no slow-motion playback. Also lacks the unified `match3_stats` localStorage
  JSON written by `recordGameResult()` on every game end (tablet writes
  endType: won / lost / earlyEnd / bonusRound / savedMoves; phone has only
  separate `match3_highScore`/`match3_highCombo`/`match3_highTurnScore` keys).
  Lower priority than M-2 hypernova port (no gameplay impact).
- ~~**Phone-418 verses → arcade carry banner.**~~ **Shipped N-2 2026-04-28.**
  Phone-418 v13.1 → v13.2 reads phone-scoped
  `m3_arcade_carry_from_verses_phone418` on mount, shows 2.5s gold-pill
  banner, clears the key. Phone-418-verses v1.0 (also shipped same
  commit) writes the receipt. See Done section for full N-2 entry.
- **Desktop + Phone 341 bonus-moves update** — still have pre-campaign gating
  (`!hasReachedTarget`), no bonus-round post-check, 🏦 emoji, "banked"
  terminology. Carried forward from the 2026-03-23 handoff.
- **Arcade end-run confirm** — "Are you sure?" popup on truly final
  end-game actions in the tablet arcade file, when score < target and moves
  remain. (Campaign v1.25 has its in-header version; arcade needs its own.)
- ~~**Cross-platform: extend N-4 prompt-button confirm to other platforms.**~~
  **Partially shipped N-5 2026-04-29.** Campaign tablet (v1.27),
  tablet-verses (v1.9), phone-418-verses (v1.2) updated. Desktop /
  phone-418 arcade / phone-341 not in scope for N-5 — they don't have
  the `requestEndLevelCarryBanked` wrapper or the `showEndConfirm`
  modal at all. Adding the confirm there requires porting both the
  wrapper function and the modal markup from tablet (or
  campaign/tablet-verses), which is part of the larger
  "Desktop + Phone 341 bonus-moves update" item above. See N-5
  Done entry for full fix details.

- ~~**Unified responsive phone — supersedes phone-341 and phone-418.**~~
  **Shipped 2026-05-02 (Session P-2).** Phone-418 → phone, phone-418-verses
  → phone-verses, phone-341 retired (archived only). Both responsive
  phone platforms now cover the entire iPhone production range; the
  fixed-width phone-341 niche is absorbed.

- ~~**Session P-2 — phone-418 + phone-418-verses → phone / phone-verses
  rename + phone-341 retirement.**~~ **Shipped 2026-05-02.** Bundled
  rename event committed alongside the doc-rotation, CLAUDE.md
  prescriptive-table update, and the cross-platform sweep entry's
  storage-string list expansion. Locked decisions below kept for
  historical reference; they were the scoping basis for the shipped
  work. Bundled session that completes the
  responsive-phone consolidation surfaced during N-6 scoping. After
  P-1 (2026-05-01) shipped the responsive board sizing to phone-418
  arcade, both phone-418 platforms are responsive across the iPhone
  production range; the "418" in their paths is now a misleading
  historical artifact. P-2 retires that artifact and consolidates
  the phone-platform footprint.

  **Locked scoping decisions (from 2026-05-01 scoping discussion):**

  1. **New name = `phone`** (not `phone-responsive`, not `mobile`).
     Parallels the existing `tablet` directory cleanly — short noun,
     no qualifier. Future-proof: "phone-responsive" implicitly suggests
     a sibling "phone-fixed" might exist, which we're explicitly
     erasing by retiring phone-341. Shortest paths. The responsive
     nature lives in the code (the IIFE-derived `TILE_SIZE` constant
     + comment block) and in `DESIGN.md`, not the path.

  2. **Storage keys preserve `phone418` strings verbatim.** The four
     localStorage key string values (`'match3_phone418_currentRun'`,
     `'match3_phone418_longestRun'`, `'match3_phone418_bankedMoves'`,
     `'m3_arcade_carry_from_verses_phone418'`) all keep `phone418`
     in their values for P-2. Renaming them risks orphaning player
     progress unless we run a migration; two of the four are
     cross-platform shared keys (the `bankedMoves` key is shared
     between phone-418-verses and phone-418 arcade per the same
     constraint that punted T-1's storage strings; the carry-receipt
     key is also shared). The four `phone418` storage-string renames
     fold into the future Cross-platform terminology + naming sweep
     so all the migrations happen as one coordinated event in lockstep
     across all platforms.

  3. **Version handling — one-off three-part patch.** Active files
     become `match3-v13.3.1-phone.jsx` and `match3-v1.4.1-phone-verses.jsx`.
     The third digit captures "this is a refinement / move of v13.3 / v1.4
     with no behavior change" — useful at-a-glance signal. Treated as a
     one-off for this rename event; the next behavior change graduates
     back to two-part (`v13.4` or `v14.0`, `v1.5` or `v2.0`). Not
     adopting three-part as a project-wide convention.

  4. **Doc-reference scope — selective.** Update `CLAUDE.md` fully
     (the file-naming table is prescriptive, not historical — it tells
     future readers and Claude what naming to use). Active docs
     `docs/DESIGN.md`, `docs/DEFERRED.md`, and the current
     `docs/PROGRESS-<today>.md` get a short note near the top
     announcing the rename event and acknowledging that older entries
     describing past sessions naturally use the old names; the
     existing prose in those docs is left untouched. The
     "Cross-platform terminology + naming sweep" entry in
     DEFERRED.md is a forward-looking entry, so it gets a real update
     to capture the four `phone418` storage-string renames as part
     of the eventual sweep. Inside the new active source files
     (`match3-v13.3.1-phone.jsx`, `match3-v1.4.1-phone-verses.jsx`),
     all `phone-418` / `phone418` / `418PX` references are rewritten
     for code coherence (same approach T-1 used for source-code
     comments). Archive code files and archived PROGRESS docs are
     left completely alone.

  5. **Phone-341 retirement — archive both build wrappers, remove
     from build, remove from landing page, drop from CLAUDE.md table.**
     Three small files move into `platforms/phone-341/archive/`:
     `phone341.html`, `src/entry-phone341.jsx`, and the active
     `platforms/phone-341/match3-v12.1-phone341.jsx`. The archive
     folder becomes the "everything phone-341 related, frozen in
     time" location. Build configuration drops the `phone341` rollup
     input from `vite.config.js`. Landing page (`index.html`) removes
     the phone-341 card. `CLAUDE.md` file-naming table loses the
     "Phone 341" row. Existing `platforms/phone-341/archive/` contents
     stay where they are. Player localStorage keys saved on devices
     that played phone-341 are left alone (orphan, harmless).

  **Files touched in P-2 (concrete list):**
  - Directory rename: `platforms/phone-418/` → `platforms/phone/`
  - Directory rename: `platforms/phone-418-verses/` → `platforms/phone-verses/`
  - Active platform file: `match3-v13.3-418px-phone.jsx` →
    `match3-v13.3.1-phone.jsx` (with internal `phone-418` references
    rewritten for coherence)
  - Active platform file: `match3-v1.4-phone-418-verses.jsx` →
    `match3-v1.4.1-phone-verses.jsx` (same)
  - Archive subfolders move along with their parent directories;
    contents preserved with original filenames untouched
  - Entry files: `src/entry-phone418.jsx` → `src/entry-phone.jsx`,
    `src/entry-phone418-verses.jsx` → `src/entry-phone-verses.jsx`
  - HTML pages: `phone418.html` → `phone.html`,
    `phone418-verses.html` → `phone-verses.html`
  - Build config: `vite.config.js` updates `phone418` and
    `phone418Verses` rollup inputs to `phone` and `phoneVerses`;
    drops the `phone341` input
  - Landing page: `index.html` updates two cards' hrefs + names +
    descriptions; removes the phone-341 card
  - Active docs: `CLAUDE.md` (full update), `docs/DESIGN.md` +
    `docs/DEFERRED.md` + current PROGRESS doc (top-of-file rename
    note only, prose left alone)
  - Phone-341 retirement: three files move into existing
    `platforms/phone-341/archive/`

  **Implementation order suggestion:** rename phone-418 first
  (arcade), then phone-418-verses (verses), then phone-341 retirement
  last. Each is independent of the others. After each platform's
  rename, run `npm run build` to verify before moving to the next.
  One commit covers the whole session per the same principle T-1
  used.

  **Hard sync requirement at session start:** verify scope locked
  decisions against any same-day commits to phone-418, phone-418-verses,
  or phone-341 (the latter two are stable but worth a quick check).
  Also re-verify that phone-418-verses' `PHONE418_BONUS_MOVES_KEY`
  storage value is still `'match3_phone418_bankedMoves'` and that
  phone-418 arcade's `BANKED_MOVES_KEY` storage value matches —
  if either has shifted, the cross-platform key share assumptions
  in decision #2 need revisiting.

- ~~**Phone-418 arcade — apply N-6 responsive redesign.**~~ **Shipped
  2026-05-01 (Session P-1).** v13.2 → v13.3. Verbatim N-6 board-sizing
  port: COLS 10 → 9, TILE_SIZE viewport-derived + capped at 40px,
  new `TARGET_MARGIN_PX = 24` and `MAX_TILE_PX = 40` constants.
  ROWS = 12 unchanged (arcade-specific; no scrolling-text bar competes
  for vertical space). Scoring constants (BASE_TARGET = 5000,
  TARGET_VARIANCE = 1500, BONUS_MOVE_INTERVAL) deferred for post-
  playtest recalibration if 9-col feels notably easier or harder.
  See entry in Done section.

---

## Build / deploy

- **In-game version-label drift — audit + fix (surfaced 2026-05-02).**
  Several active platform files render an `<h1>` or `<span>` showing
  `vX.Y` in the in-game header; that label is hardcoded inline in
  the JSX and easy to forget when bumping versions. P-2 found two
  silent drifts: phone arcade rendering `v13.1-418px` while the
  active file was v13.3 (3 versions behind), and phone-verses
  rendering `v1.5` since v1.0 (a dormant fallback that's never
  user-visible but still wrong in code). Tablet flagged by user
  on 2026-05-02 still rendering `v11.11` while active file is
  v11.14 (3 versions behind; not addressed yet because the user
  asked to plan the fix rather than bundle it). Other candidates
  not yet inspected: campaign tablet, desktop, time-attack,
  rewardmode, sim. Fix shape: one-time audit pass — for each
  active platform, grep its in-game header text and confirm the
  label string matches the active file version. Bump any stale
  ones. Add the CLAUDE.md "Checklist before every commit" line
  added 2026-05-02 ("In-game header label inside the new file
  updated to match the new version") prevents re-drift going
  forward, but doesn't auto-fix the existing backlog.

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
- **Psalm 91 NKJV — SHIPPED V-3b 2026-04-24.** Multi-level, 4 thematic
  levels (1–4 / 5–8 / 9–13 / 14–16). 49 chunks, 45 moves total. Data
  lives at `platforms/tablet-verses/games/psalm-91/game.js`. No per-
  level `targetScore` overrides; defaults to `moves × 300`. Reference
  format `Ps. 91:N` (abbreviated to fit the 110px text-bar column).
- **Matthew 5 NKJV (PARTIAL) — SHIPPED 2026-04-25.** Multi-level.
  Currently covers 5:1–30 across five levels: 5:1–12 Beatitudes (25
  chunks), 5:13–16 Salt and light (12), 5:17–20 Fulfilling the Law
  (13), 5:21–26 Murder / anger (25), 5:27–30 Adultery (15). Total: 90
  chunks / 85 moves across 5 levels. v1.0 (5:1–20) shipped first; 5:21–26
  + 5:27–30 appended same day from ready-to-code drafts. Data at
  `platforms/tablet-verses/games/matthew-5/game.js`. Reference format
  `Matt. 5:N`. Many chunks exceed ~40 chars and wrap to 2 lines at the
  current 20px Georgia bold rendering — wrapping accepted to preserve
  thematic phrasing ("Blessed are X" entire phrase, vv. 29–30 chunked
  identically to reinforce the "If your right [eye/hand]…" parallel,
  etc.). See "Per-chunk font override" parked option below for the
  fallback if wrapping proves jarring in playtest. Future Matt 5 levels
  are additive (engine reads `levels[]` length without any "complete"
  gate); see "Planned content" below.

**Planned content (authoring queue, no engine work expected):**

**Pending user edits (added 2026-04-26):** Drafts for **Matt 5:31–48**
(NKJV, three sections) and **Isaiah 52:13–53:12 ESV** (Servant Song,
multi-level) were presented in chat 2026-04-26 and the user took them
to edit externally. **At the start of any new coding session, ask the
user to paste their edited drafts before doing any verses-content
work.** Do not regenerate drafts from scratch — the user has human-
edited versions ready. (See also: `project_pending_verses_drafts.md`
in user memory.) Remove this note once both passages have shipped.

- **Matthew 5 future levels — additive to existing game file.** Per
  scoping 2026-04-25, remaining sections are: **5:31–37 (combined
  divorce + oaths — user thematic decision: "Jesus treats marriage as
  an oath")**, 5:38–42 (turn the other cheek), 5:43–48 (love your
  enemies). Append entries to the existing `levels[]` array; picker
  auto-updates. Same chunk-authoring pattern as v1.0 + sections 4 + 5
  (I draft per-section, user edits toward thematic-phrase chunks).

- **Isaiah 52:13–53:12 — ESV.** First non-NKJV game in the project.
  User preference noted 2026-04-25: ESV, not NKJV. The Servant Song
  unit (52:13–15 lead-in + all of ch. 53). 15 verses; multi-level.
  Data file's existing `translation` field already supports per-game
  translation choice; just a content choice. No engine impact.
- **James 1 — NKJV.** Whole chapter, 27 verses; multi-level. Sequence
  TBD; expect to author after Matt 5 progresses meaningfully.

**Parked options (engine changes, only if needed):**
- **Per-chunk conditional font override.** Surfaced 2026-04-25 during
  Matt 5 v1.0 authoring as a fallback for the long-chunk wrapping
  problem. The proposal: add an optional per-chunk field (e.g.,
  `fontSize: 16`) read by the text-bar renderer to shrink the current-
  chunk font on a specific row, fitting longer chunks single-line
  without changing the global default. Estimated ~5 lines in the text-
  bar render block + a data-shape addition in the README. Not built
  yet — the V-* track shipped with global 20px and content authors
  can accept wrapping as a first-line response. Re-open if playtest
  reveals the wrap-induced height-shift is jarring enough to warrant
  the engine change. Reasoning trail: font-size reduction tested via
  estimate (20 → 19 → 18px) saves only ~1 wrap because long chunks
  are 50–60 chars, well past any of those thresholds; visual
  hierarchy floors at 18px (prior chunks fixed at 15px). So a global
  reduction isn't a win — the targeted per-chunk override is the
  better lever if wrapping proves bad enough to fix.

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

## Phone-418-verses (Sessions N-1, N-2 — both shipped 2026-04-28)

Scoped + shipped 2026-04-28. Second platform in the Verses family —
phone form factor at 418px. Both sessions landed same day. Phone-418
became JSX in M-1 (2026-04-27), making this peer feasible. Decision
log preserved below for future-session context (e.g., when adding
phone-341-verses, deciding whether to ramp tablet's `× 250` parked
target option, or migrating compact-card picker to tablet).

**Six decisions locked at scoping (one-decision-per-message pass):**

1. **Content sharing.** Game data lives at repo-root
   `content/verses/<slug>/game.js`. Both platforms import from there;
   one source of truth, no per-platform copies. **N-1 shipped this**
   (tablet-verses v1.7 → v1.8, all 4 game folders moved).

2. **Text-bar layout (form-factor adapt).** Tablet's two-column
   layout (110px reference column + content column) doesn't fit the
   418px phone — most chunks would wrap to 2 lines, container would
   heave. Phone uses a **single-column stack**: chunks fill the full
   ~400px usable width; reference rendered as a **small italic label
   above each verse's first chunk**. Reduces wrap frequency
   dramatically — at 18px Georgia, ~44–50 chars per line vs. ~24–29 in
   the tablet two-column on phone.

   **Typography (phone-only):** current chunk **18px Georgia**
   (down from tablet's 22px); prior chunks **14px** (down from 15px).
   Dimmed contrast inherits the existing `#888` on light bg / `#ccc`
   on dark bg rule. Reference label font ~13–14px italic, settled in
   build.

3. **Board dimensions.** **10×10**, matching tablet-verses (which
   already dropped to 10 ROWS in V-4). Not a divergence from tablet
   on board shape — *is* a divergence on **target multiplier**: phone
   locks `moves × 250` from the start, tablet stays at `moves × 300`
   (with `× 250` parked). Lets the two form factors A/B the
   multipliers in real playtest. Settle in build if `× 250` plays
   poorly.

4. **Bonus-moves carry handoff key.** Phone-418-verses writes to a
   **phone-scoped** key `m3_arcade_carry_from_verses_phone418`
   (not the shared `m3_arcade_carry_from_verses` that tablet uses).
   Per the 2026-03-23 design principle that phone runs stay distinct
   from tablet runs. Phone-418 v13.1 → v13.2 in N-2 adds the
   mount-time read + "+N bonus moves carried from memorize mode"
   banner — same UX shape as tablet v11.12, scoped to phone storage.

5. **Session staging.** **Two sessions:** N-1 (content promotion,
   shipped 2026-04-28) + N-2 (fork + form-factor adapt + entry
   plumbing + arcade-carry wiring, planned). N-1 is a small refactor
   with low blast radius (touches tablet-verses only); N-2 is the
   meaty port. Splitting them keeps each session small enough to
   verify independently.

6. **Index.html card + in-app picker layout.**
   - **Index.html:** new separate card "Phone Verses" (or similar
     label, settled in build). Matches the existing one-card-per-
     platform pattern. Card count 6 → 7.
   - **In-app picker:** **compact cards** (2–3 per row at 418px),
     so the passage list doesn't become a tall single-column stack
     as content grows. Tablet picker keeps its current layout for
     now; revisit when its passage count crowds the screen — same
     compact treatment expected to migrate.

**Session N-2 scope (planned):**
- Fork `match3-v1.8-tablet-verses.jsx` →
  `platforms/phone-418-verses/match3-v1.0-phone-418-verses.jsx`.
- Apply form-factor adapts per Decisions #2, #3, #6 (text bar,
  board, picker cards). Settle exact CSS values (compact-card
  minmax, reference label font size, target tuning) in build.
- Entry plumbing: `phone418-verses.html` (mirrors `phone418.html`
  + `verses.html`), `src/entry-phone418-verses.jsx`,
  `vite.config.js` rollup input. New "Phone Verses" card on
  `index.html`.
- Arcade-carry wiring: phone-418-verses writes the new key on
  game-completion + final-level button click. Phone-418 v13.1 →
  v13.2 reads the new key on mount, shows banner, clears.
- Verify: `npm run build` clean. Manual playtest on real iPhone (or
  418px Chrome devtools) for form-factor fit.

**Settle in build (not scope-blocking):**
- Exact compact-card grid sizing (tentative `minmax(140px, 1fr)`
  for 2–3 per row at 418px).
- Reference label font size (~13–14px italic).
- Final "Phone arcade" button label (vs. "Arcade" / "Continue in
  arcade").
- Target tuning if `moves × 250` plays poorly.

**Independent of pending Matt 5:31–48 + Isaiah ESV content edits.**
Phone-418-verses can ship before, after, or concurrent with those
content edits — both consume the same `content/verses/` directory
that N-1 just established.

**Out of scope for N-2 (stays deferred):**
- AdminPanel + `recordGameResult()` on phone-418 — long-standing
  deferred work in Cross-platform parity section.
- Compact-card adoption on tablet picker — wait for tablet passage
  count to crowd.

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

- **Cross-platform terminology + naming sweep — T-3 (data event)
  remaining.** Originally scoped as a single post-T-1/post-P-2
  follow-on; in T-2 scoping (2026-05-02) split into T-2 (code only)
  + T-3 (data event). T-1 (2026-05-01) renamed 3 platforms; P-2
  (2026-05-02) renamed the phone paths and retired phone-341; T-2
  (2026-05-02) completed the code-coherence sweep — all 8 platforms
  now use the new bonus-moves identifier scheme + user-visible
  strings, core's constant is `BONUS_MOVES_KEY`, derived stats field
  is `victoryRoundRate`, AdminPanel labels say "Victory Round" /
  "Bonus moves". T-3 is the data event: storage-string value
  migrations + stats-schema rename + one-time idempotent migration
  code that runs at platform mount.

  **Scope of T-3 (data event):**

  1. ~~**Four deferred platforms** still on "banked" / "bonus round"~~
     **DONE in T-2.** Desktop v12.2, time-attack v12.2, phone arcade
     v13.4, campaign tablet v1.28 all shipped the identifier +
     user-visible-string rename. Plus 4 importer-only version bumps
     for the T-1 platforms whose imports referenced core's renamed
     `BANKED_KEY`: tablet v11.15, tablet-verses v1.11,
     tablet-rewardmode v1.2, tablet-sim v1.4.

  2. ~~**Core (`core/AdminPanel.jsx`) renames** — name side.~~ **DONE
     in T-2.** `BANKED_KEY` constant → `BONUS_MOVES_KEY`. Derived
     stats field `bonusRoundRate` → `victoryRoundRate`. AdminPanel
     display labels updated. **REMAINING for T-3b** (storage values
     only — schema-name half done in T-3a):
     - `BONUS_MOVES_KEY` value `'match3_bankedMoves'` →
       `'match3_bonusMoves'` migration. Migration code in core reads
       old key, writes new, deletes old. Idempotent.
     - AdminPanel JSON export key `bankedMoves` → `bonusMoves` (T-2
       deliberately preserved for backward compatibility with prior
       export files; T-3b closes this).

  3. ~~**Stats data layer migration**~~ **DONE in T-3a (2026-05-02).**
     Top-level counter `bonusRoundsTaken` → `victoryRoundsTaken`,
     per-game history `endType: 'bonusRound'` → `'victoryRound'`.
     Migration code `migrateStatsBlob()` in core/AdminPanel.jsx runs
     at module load, idempotent via field-presence checks. 5 platforms
     with `recordGameResult()` writes versioned to write new field
     names: tablet v11.16, tablet-verses v1.12, phone-verses v1.5,
     tablet-rewardmode v1.3, tablet-sim v1.5. Existing player data
     migrates automatically on next platform visit. Discovery:
     campaign tablet does NOT call `recordGameResult()` (pre-existing
     gap; not addressed in T-3a).

  4. **HARD sync requirement — phone shared storage key.** This
     was surfaced during T-1 and is the trickiest part of the future
     sweep. Phone-verses (P-2-renamed from phone-418-verses) and
     phone arcade (P-2-renamed from phone-418) share one localStorage
     key for their bonus-moves pool — both files declare a constant
     pointing at the SAME string `'match3_phone418_bankedMoves'`, and
     the verses → arcade carry-out flow writes to it so arcade can
     pick up the merged total on entry.
     - **In T-1 (already shipped):** phone-418-verses' constant *name*
       was renamed `PHONE418_BANKED_MOVES_KEY` →
       `PHONE418_BONUS_MOVES_KEY`. Its *value* was deliberately KEPT
       as `'match3_phone418_bankedMoves'`. Otherwise the carry-out
       would have written to a key arcade doesn't read.
     - **In P-2 (scoped, ships next session):** the constant *name*
       in arcade gets implicit name-update via the platform rename
       (the `BANKED_MOVES_KEY` constant in `match3-v13.3.1-phone.jsx`
       still has the value `'match3_phone418_bankedMoves'`). The
       string value preservation extends. Same constraint, same
       resolution.
     - **In the future sweep:** phone arcade and phone-verses MUST
       migrate together in the same commit. Both constants get new
       values (e.g., `'match3_phone_bonusMoves'` — combines the
       banked → bonus terminology rename AND the phone418 → phone
       platform-name rename in one migration step). Migration code
       reads the old key and writes the new one (in arcade only,
       since both platforms share the same key). The storage-string
       value match between the two files is a hard correctness
       contract.
     - Comment block at phone-verses' constant declaration (was
       lines ~877-886 in v1.4; same lines in the renamed v1.4.1)
       calls this requirement out so the future sweep can't miss it.

  5. **Phone-platform storage strings (P-2 scoping 2026-05-01 +
     mid-session 2026-05-02 expansion).** Beyond the terminology
     rename, P-2 deferred FIVE `phone418`-bearing localStorage key
     strings to this future sweep so all on-disk migrations happen
     as one coordinated event:
     - `'match3_phone418_currentRun'` → `'match3_phone_currentRun'`
       (run tracking; used only by phone arcade)
     - `'match3_phone418_longestRun'` → `'match3_phone_longestRun'`
       (run tracking; used only by phone arcade)
     - `'match3_phone418_bankedMoves'` → `'match3_phone_bonusMoves'`
       (bonus pool; SHARED between phone arcade + phone-verses;
       combined with the banked → bonus terminology rename per #4
       above)
     - `'m3_arcade_carry_from_verses_phone418'` →
       `'m3_arcade_carry_from_verses_phone'` (carry-receipt; SHARED
       between phone arcade reads it, phone-verses writes it)
     - `'m3_phone418_verses_*'` → `'m3_phone_verses_*'` (verses
       progress prefix — `VERSES_PROGRESS_KEY_PREFIX` in phone-verses;
       used to namespace per-game level-completion data; surfaced
       during P-2 mid-session inspection of phone-verses, was NOT on
       the original P-2 inventory; preserved for the same reason as
       the others — renaming orphans player progress without a
       migration). This one's a prefix used as `${prefix}${gameId}`
       at runtime, so the migration walks `localStorage` keys matching
       the old prefix and re-keys each one with the new prefix.
     The shared keys (#3 and #4 in this list) require the same
     lockstep migration constraint as the bankedMoves key: both
     readers and writers update at the same time, otherwise the
     verses → arcade carry-out breaks. The arcade-only keys (#1, #2)
     and the verses-only prefix (#5) could in principle migrate
     independently, but bundling them with the others keeps
     migrations to one event instead of multiple — fewer
     opportunities for player-data edge cases.

  6. **Session shape — T-3a/T-3b split (decided 2026-05-02; T-3a
     shipped same day, T-3b remains).** T-3 split into two truly
     orthogonal halves so the lower-risk half could ship without
     gating on the higher-risk lockstep work. T-3a (shipped) =
     stats-blob field rename + idempotent migration code in core.
     T-3b (remains) = the 6 storage-string value migrations + phone
     arcade ↔ phone-verses lockstep constraint. Migration code
     pattern from T-3a (`migrateStatsBlob()` in core, runs at module
     load, idempotent via presence checks) extends naturally for
     T-3b — likely a generic `migrateLocalStorageKey()` helper +
     per-key calls.

  7. ~~**Stats data note (Option A continuation)**~~ **CLOSED in
     T-3a (2026-05-02).** Both T-1 and T-2 shipped Option A; T-3a
     ships the schema rename + migration. All 5 platforms with
     `recordGameResult()` calls now write new field names; existing
     blobs migrate automatically on first load via core's
     `migrateStatsBlob()`.

  **Open questions for scoping the future session:**
  - Does the BANKED_KEY rename in core warrant a single-purpose session,
    or bundle with the 5-platform sweep? (Probably bundle — core +
    all importers need to land together.)
  - Does desktop / time-attack / phone-341 see playtest before this
    sweep? If so, scoping pass may pick up additional renames.
  - Does the new constant name for `BANKED_KEY` get decided here in
    DEFERRED.md or at scoping time? (Lean: at scoping time, since
    candidate names depend on what other constants exist by then.)

---

## Known bugs (carried forward)

- ~~**Phone-418-verses v1.2 padding bump not visibly different on real
  iPhone.**~~ **Resolved by N-6 (2026-05-01)** — superseded by
  responsive redesign. v1.2 baseline kept the chrome at fixed 418px
  (edge-to-edge on a 418px viewport), so the internal padding bump
  only moved content inward inside the card while the card itself
  still sat flush at the screen edges. N-6 (v1.3) goes to 9 columns
  + viewport-derived tile size, which shrinks both board and chrome
  so the whole composition floats inside the viewport with natural
  margin on every iPhone. v1.2's padding values were preserved into
  v1.3 (still comfortable inside the smaller card).
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

- **Phone-418 arcade v13.3 — responsive board sizing (Session P-1).**
  2026-05-01. Second session of 2026-05-01 after T-1. Verbatim N-6
  port from phone-418-verses v1.3 to phone-418 arcade v13.2 → v13.3.
  Same constants block restructure: `COLS = 10` → `COLS = 9`;
  `TILE_SIZE = 40` (fixed) → IIFE-computed from `window.innerWidth`
  capped at `MAX_TILE_PX = 40`; new `TARGET_MARGIN_PX = 24` and
  `MAX_TILE_PX = 40` surfaced. ROWS = 12 retained (arcade-specific,
  unchanged from v13.2 — no scrolling-text bar competes for vertical
  space). Per-iPhone runtime sizing: SE 375px → TILE_SIZE 34, board
  322 × 430px; iPhone 12-15 → 36, 340 × 454px; 418px reference → 39,
  367 × 490px; Plus / Pro Max → 40 (capped), 376 × 502px.
  - **Scoping pass.** Five decisions worked through one at a time:
    (1) field-test sequencing — user confirmed v1.4 verses works on
    real iPhone, proceed; (2) scope boundary — verbatim N-6 board-
    sizing port; ROWS = 12 stays per user's "no scrolling text to
    worry about, fits reasonably on testing phone"; (3) T-1 rename
    bundling — declined, kept N-6 port standalone; "banked" /
    "bonus round" terminology in arcade waits for cross-platform
    sweep where it can coordinate with verses on the shared
    `'match3_phone418_bankedMoves'` storage-key migration;
    (4) scoring/difficulty — defer recalibration; ship 9-col board
    with arcade's existing scoring constants intact; recalibrate via
    `BASE_TARGET` if playtest reveals notable shift; (5) label P-1
    (Phone-responsive port, first), version v13.2 → v13.3 (patch
    bump, consistent with verses' N-6 v1.2 → v1.3).
  - **Implementation.** Single constants-block restructure (lines
    159-247 of v13.3). All downstream code (boardWidth derivation,
    canvas dimensions, hit detection, popup positioning, match
    detection, header/footer card widths) automatically picks up
    the new values via existing COLS / ROWS / TILE_SIZE / TILE_GAP
    references — no other code edits. Carry banner (v13.2 N-2)
    untouched: uses `position: fixed` + `100vw - 24px` max-width,
    not tied to boardWidth.
  - **Audit.** Pre-edit grep confirmed no hardcoded `418` literal in
    active code (only historical comment references). The two `40`
    references in SVG render functions are viewBox scales (size /
    40), independent of TILE_SIZE — left unchanged.
  - **Build verification.** `npm run build` clean (66 modules, 0
    warnings). Phone-418 bundle 52.66 kB / 16.15 kB gz (was 52.51 /
    16.06 in v13.2; +0.15 kB / +0.09 kB gz, accounted for by the
    new comment block + IIFE).
  - **Stepping stone to Unified Responsive Phone.** P-2 (next session
    in the P track, when ready): rename `phone-418` → `phone-responsive`
    + retire phone-341 (the responsive board scales down to 375px,
    covering phone-341's narrow-phone niche). High mechanical churn
    (every file path, entry import, index.html label, doc reference),
    low risk (pure rename + delete).

- **Session T-1 — bundled "victory round" / "bonus moves" rename
  (3 of 8 platforms).** 2026-05-01. Tablet v11.13 → v11.14, tablet-
  verses v1.9 → v1.10, phone-418-verses v1.3 → v1.4. All identifier
  renames per the original locked inventory plus two additions
  surfaced during execution: the verses-pattern callback prop
  `onBankedMovesChange` → `onBonusMovesChange` (tablet-verses + phone-
  418-verses), and the hyphenated-comment form `banked-moves` →
  `bonus-moves`. User-visible strings updated: "🌟 BONUS ROUND - 1.5×
  ALL POINTS! 🌟" → "🌟 VICTORY ROUND - 1.5× ALL POINTS! 🌟",
  "Enter Bonus Round?" → "Enter Victory Round?", post-game
  "Bonus Round: +N" → "Victory Round: +N".
  - **Stats data layer (Option A — leave alone in T-1).** Mid-session
    discovery: `endType: 'bonusRound'` written by `recordGameResult()`
    and `stats.bonusRoundsTaken` counter aren't on the original
    inventory but use the same terminology. Three options surfaced
    (A: leave unchanged, B: rename without migration, C: migrate).
    All three either touched core (against locked decision #5) or
    accepted partial inconsistency. Picked **A** — preserves locked
    decision #5 and matches Option A's spirit. AdminPanel power users
    see "bonusRound" in historical history-entry rows for now;
    counter keeps incrementing under the old name. Full sweep will
    fix in the future cross-platform terminology session.
  - **Phone-418-verses cross-platform key share — storage VALUE
    preserved.** Mid-session discovery during phone-418-verses pass:
    the constant `PHONE418_BANKED_MOVES_KEY` shares its storage value
    `'match3_phone418_bankedMoves'` with phone-418 arcade's
    `BANKED_MOVES_KEY` constant (deferred T-1 platform). Verses →
    arcade carry-out writes to this shared key so arcade can pick up
    the merged pool. Original locked decision #2 ("rename + migrate")
    didn't anticipate this share — would have broken the carry-out.
    Resolution: rename the constant *name* in T-1 for code coherence
    (`PHONE418_BONUS_MOVES_KEY`) but KEEP the *value* as
    `'match3_phone418_bankedMoves'`. No migration needed (no on-disk
    change). The future cross-platform sweep migrates both constants
    together in the same commit. Captured as a hard requirement in
    the "Cross-platform terminology sweep" entry above.
  - **Build verification.** Three clean `npm run build` runs after
    each platform; 66 modules, zero warnings each time. Tablet
    bundle 65.27 kB / 20.03 kB gz unchanged. Verses bundle 78.06 kB /
    23.48 kB gz; phone-418-verses bundle 78.14 kB / 23.57 kB gz —
    bundle sizes essentially flat (rename is identifier-level, no
    new code beyond the version comment blocks).
  - **Files touched:** 3 platform files (new versions) + 3 archive
    copies + 3 entry-file imports + `index.html` (3 version labels) +
    `docs/DESIGN.md` (terminology section updated to reflect
    shipped vs. deferred status) + `docs/DEFERRED.md` (T-1 entry
    moved here, new Cross-platform terminology sweep entry added) +
    `docs/PROGRESS-2026-05-01.md` (session row + addendum). One
    commit covers all of it per locked decision #7.

- **Phone-418-verses v1.3 — responsive board sizing (Session N-6).**
  2026-05-01. Reactive ship after user reported on real iPhone that
  v1.2's padding bump didn't visibly help — chrome cards still sat
  flush at the screen edges (matched to fixed 418px boardWidth), so
  the ← / ☀️ buttons positioned absolutely inside the cards still
  felt pressed against the rounded screen corner.
  - **Scoping pass (multi-message).** Three paths surfaced — A: shrink
    grid to 9×10 (gameplay change); B: keep 10×10 with smaller tiles;
    C: read viewport at runtime and scale tiles to fit. User leaned
    A+C combined: 9 columns + viewport-derived tile size, capped at
    40px. Reasoning: A+C gives 36-42px tiles across the iPhone range
    (SE 375px → Pro Max 430px), versus C alone bottoming out at 33px
    on SE (below Apple's 44pt tap target). 9×10 is industry norm
    (Candy Crush 9×9, Bejeweled started 8×8).
  - **Locked decisions.** Standard 24px each-side margins (48px chrome
    budget); 40px tile cap matching tablet; chrome cards stay matched
    to boardWidth (Option B principle from N-5 preserved); tile size
    locked at module load via IIFE reading `window.innerWidth` (no
    resize listener — rotation mid-game keeps original size); level
    targets unchanged at `target × 250`, recalibrate post-playtest if
    needed.
  - **Per-iPhone math at runtime.** SE 375px → 34px tiles, 322px
    board, 26.5px margins. iPhone 12-15 390-393px → 36px, 340px,
    25-26.5px. 418px reference → 39px, 367px, 25.5px. iPhone 14/15
    Plus & Pro Max 428-430px → 40px (capped), 376px, 26-27px.
    Buttons inside chrome at `left: 16px` end up ~41-43px from screen
    edge across the range — clears iPhone's ~24-30px rounded corner
    with room to spare without needing CSS safe-area insets.
  - **Implementation.** Constants block updated:
    `const COLS = 9` (was 10); `const TILE_SIZE = 40` replaced by
    `const TILE_SIZE = (function () { ... })()` IIFE; new constants
    `TARGET_MARGIN_PX = 24` and `MAX_TILE_PX = 40` surfaced for
    future tuning. All downstream code (boardWidth derivation, canvas
    sizing, hit detection, popup positioning, match detection)
    automatically picks up the new values — no other code edits.
    v1.2's internal-card padding values preserved (still comfortable
    inside the smaller card).
  - **Files.** Archived `match3-v1.2-phone-418-verses.jsx` to
    `platforms/phone-418-verses/archive/`; created
    `match3-v1.3-phone-418-verses.jsx` active. `src/entry-phone418-verses.jsx`
    repointed to v1.3. `index.html` phone-418-verses card description
    updated.
  - **Build:** clean. 66 modules transformed, zero warnings.
    `phone418Verses` bundle 78.14 kB / 23.56 kB gz (was 77.99 / 23.49
    in v1.2; +0.15 kB from new comment block + IIFE).
  - **Process notes.**
    - User asked the broader strategic question mid-scoping: should
      this approach also supersede phone-341 + phone-418 arcade?
      Recommendation: yes eventually, but field-test on verses first
      (lower-stakes platform) before touching arcade. Logged two
      deferred items (Unified responsive phone; Phone-418 arcade
      responsive port).
    - On overconfidence: I asserted "C is the right answer for
      production-quality" early, but user correctly pushed back that
      smaller tiles on small phones might hurt playability — A+C
      addresses that better than C alone, with concrete math
      backing it up.
    - On the corrected PROGRESS-doc rotation rule: rule was rewritten
      mid-session (CLAUDE.md edit) — rotation now happens when
      shipping on a later date, not just because the day ticks over.
      This commit is the first to apply the new rule (04-29 → 05-01).

- **Apply N-4 prompt-button confirm to campaign tablet + tablet-verses +
  phone-418-verses, plus phone-418-verses padding bump (Session N-5).**
  2026-04-29. Two bundled items: (a) extend N-4's are-you-sure confirm
  fix to the three other platforms that have the
  `requestEndLevelCarryBanked` wrapper and `showEndConfirm` modal
  already wired up; (b) phone-418-verses padding adjustment from the
  user-rec thread (Option B — bump card internal padding rather than
  shrinking card widths, preserving alignment with the board edges).
  Audit found three platforms in scope (campaign tablet, tablet-verses,
  phone-418-verses); three out of scope (desktop, phone-418 arcade,
  phone-341 — they don't have the wrapper or modal at all, would
  require larger port).
  - **Cross-platform fix.** Same one-line change in each:
    `onClick={endLevelCarryBanked}` → `onClick={requestEndLevelCarryBanked}`
    on the bonus-moves prompt's "End and carry moves forward" button.
    Wrapper's `wouldWin` check produces correct behavior in both
    prompt variants (confirm if below target; just-end if `targetReached`).
  - **Phone-418-verses padding (Option B).** Card widths unchanged
    (still match boardWidth = 418px so card edges align with board).
    Internal padding bumped: header `'10px 20px'` / `'12px 20px'` →
    `'10px 28px'` / `'12px 28px'`; rolling text bar `'12px 20px'` →
    `'12px 28px'`; bottom instructions `'12px 16px'` → `'12px 24px'`.
    Back button (←) `left: '8px'` → `left: '16px'`. Theme toggle
    `right: '8px'` → `right: '16px'`. Net: content sits 28px from
    screen edge instead of 20px; ← / ☀️ buttons sit 16px from edge
    instead of 8px.
  - **Files:** archived `match3-v1.26-campaign-tablet.jsx` /
    `match3-v1.8-tablet-verses.jsx` / `match3-v1.1-phone-418-verses.jsx`
    to their respective archive dirs; created v1.27 / v1.9 / v1.2
    active files. `src/entry-campaign.jsx`, `src/entry-verses.jsx`,
    `src/entry-phone418-verses.jsx` repointed. `index.html`
    descriptions updated for all three cards.
  - **Build:** clean. 66 modules transformed, zero warnings. Bundle
    sizes unchanged from v1.26 / v1.8 / v1.1 baselines (no code
    growth — only the one-line onClick change + comment text +
    JSX prop tweaks for padding).
  - **Process note.** User pushed back on the phrase "cross-platform
    consistency sweep" — overbuilt language for "apply the same fix
    to the other files." Memory updated to flag invented compound
    nouns. Also: my Option A pitch leaned on a "what most iPhone
    apps look like" claim I couldn't actually source; user asked to
    verify, recommendation switched to Option B (which has identical
    content-spacing math but aligns card edges with the board).

- **Tablet v11.13 — extend v11.9 are-you-sure confirm to bonus-moves
  prompt (Session N-4).** 2026-04-29. Investigation triggered by user
  report that the confirm modal didn't fire when clicking "End and
  carry moves forward" on the bonus-moves prompt at moves=0.
  Investigation finding (no regression): tablet v11.12 had two buttons
  with that exact label, and v11.9 had intentionally wired the
  confirm only to one of them — the in-header button visible during
  active bonus-moves use, not the prompt button. Original v11.9
  rationale ("a save after an already-failed turn") rejected; user
  feedback: the carry-forward decision is itself worth confirming
  because bonus moves earned this round roll into the next round's
  pool, and ending below target trades a chance at this round's win
  for that. Fix: prompt button now routes through
  `requestEndLevelCarryBanked` wrapper (the same wrapper the
  in-header button uses). Wrapper's `wouldWin` check handles both
  prompt variants correctly — confirm if below target; no confirm
  if `promptWonAlready` (target reached, prompt asks "keep playing
  with N bonus moves?" instead of "out of moves"). Single line of
  code change + version bump per no-overwrites rule + comment
  updates. Files: archived `match3-v11.12-tablet.jsx` →
  `platforms/tablet/archive/`; new `match3-v11.13-tablet.jsx`
  active. `src/main.jsx` repointed to v11.13. `index.html` tablet
  card description updated. Build clean — tablet bundle 65.26 kB /
  20.02 kB gz, unchanged. Cross-platform follow-up logged in
  Cross-platform parity section (phone-418-verses + tablet-verses
  + others have the same prompt button still calling direct).

- **Phone-418-verses v1.1 — overflow fix (Session N-3).** 2026-04-29.
  Reactive fix from user device-testing v1.0 on real iPhone. Two display
  bugs fixed:
  - **Chrome overflow.** v1.0 inherited tablet-verses's chrome-sizing
    pattern of `width: ${boardWidth + 30}px` (= 448px) on header,
    rolling text bar, and bottom instructions, plus a 20px page-wrapper
    padding. Total horizontal budget 488px overshot iPhone viewports
    (most are 390–430px). Fix: collapsed page padding to
    `'0 0 60px 0'`; trimmed all three chrome elements to
    `${boardWidth}px` exactly (matches the board's 418px).
  - **Score-row crowding when bonus moves earned.** Single flex row of
    Score / Moves / Bonus moves / Target (and 5th End-button when
    `usingBankedMoves`) totalled ~470–585px content on ~378px usable
    inner-header width — `space-around` collapsed to zero spacing,
    trailing items spilled past edge. Fix: split the row into a
    vertical column of two rows. Row 1 (always): Score / Moves /
    Target. Row 2 (only when `bankedMoves > 0` OR `usingBankedMoves`):
    "Bonus moves: N" left-aligned + "End and carry moves forward"
    button right-aligned (button uses `marginLeft: 'auto'` so it
    anchors right whether or not the count precedes it). Row 2
    children semantically grouped (status + action, both bonus-related).
  - **No canvas / board changes.** `TILE_SIZE` / `TILE_GAP` / ROWS /
    COLS untouched. Board still 418px. On viewports narrower than
    418px the board itself still overflows; that's a separate scope
    (would require canvas responsive-scaling — CSS-scale or recompute
    `TILE_SIZE` on resize).
  - **Files:** archived
    `platforms/phone-418-verses/match3-v1.0-phone-418-verses.jsx` →
    `archive/`; new
    `platforms/phone-418-verses/match3-v1.1-phone-418-verses.jsx` is
    active. `src/entry-phone418-verses.jsx` repointed to v1.1;
    `index.html` card description updated.
  - **Build:** clean. 66 modules transformed, zero warnings.
    `phone418Verses-*.js` 77.83 → 77.99 kB (+0.16 kB from new comment
    text + row 2 wrapper logic). Other bundles unchanged.
  - **Re-verification on real iPhone still pending** before N-3
    declared closed.
  - **Dev-on-phone gotcha noted** for next session: Vite dev server
    defaults to localhost-only; needs `--host` flag (`npm run dev --
    --host`) or `server: { host: true }` in `vite.config.js` to be
    reachable from iPhone on same Wi-Fi.

- **Phone-418-verses port (Session N-2).** 2026-04-28. Second of the
  two-session program scoped same morning. Phone form factor of the
  Verses platform — fork of tablet-verses v1.8 (the N-1 baseline) into
  `platforms/phone-418-verses/match3-v1.0-phone-418-verses.jsx`.
  Both Verses platforms now share `content/verses/<slug>/game.js`
  (the N-1 architecture validated by Vite auto-extracting a shared
  `game-*.js` chunk: 8.37 kB / 2.84 kB gz, used by both bundles).

  **Form-factor adapts vs. tablet-verses v1.8** (full per-decision
  rationale in the v1.0 file's top comment block):
  - Tile sizing 50→40 / gap 4→2 (matches phone-418 arcade; board
    fits 418px width exactly).
  - Target multiplier 300→250 (divergent from tablet, which stays
    at 300; A/B opportunity).
  - Text-bar render: two-column (110px / 1fr) → single-column stack;
    reference rendered as 13px italic label above each verse's first
    chunk; current chunk 18px (was 20px), prior 14px (was 15px).
  - Passage-modal + full-passage-modal: same single-column treatment
    at 16px chunks / 12px italic purple reference.
  - Picker + level-select grids: `minmax(220px, 1fr)` →
    `minmax(140px, 1fr)`, gap 16→12px, maxWidth 900→600px (2 cards
    per row at 418px instead of 1).
  - Storage phone-scoped: `m3_phone418_verses_<slug>` per game (was
    `m3_verses_<slug>`); local `PHONE418_BANKED_MOVES_KEY` constant
    `'match3_phone418_bankedMoves'` replaces 5 active code references
    to the imported tablet `BANKED_KEY` (AdminPanel/STATS_KEY/
    defaultStats imports kept inert per scope discipline).
  - Carry-receipt key `m3_arcade_carry_from_verses` →
    `m3_arcade_carry_from_verses_phone418`; navigation target
    `tablet.html` → `phone418.html`.

  **Phone-418 v13.1 → v13.2** (carry-banner receiving end, in the
  same N-2 commit): mount-time `useEffect` reads the phone-scoped
  receipt key, shows a 2.5s gold-pill top banner ("+N bonus moves
  carried from memorize mode") at 14px Georgia (smaller than tablet's
  16px to suit phone width; `maxWidth: calc(100vw - 24px)` for safety
  on narrow phones), clears the key on first read so refreshes don't
  replay.

  **Entry plumbing:** new `phone418-verses.html`,
  `src/entry-phone418-verses.jsx`, and `vite.config.js`
  `phone418Verses` rollup input. New "📖 Verses — Phone (418px)"
  card on `index.html` (sibling to the existing "📖 Verses — Tablet"
  card; tablet card renamed accordingly). Card count 6 → 7.
  `src/entry-phone418.jsx` repointed to v13.2; `index.html` arcade
  description updated.

  **Build:** clean. 66 modules transformed (was 63 — three new
  files), zero warnings.
  - `phone418Verses-*.js` 77.83 kB / 23.45 kB gz (new) — comparable
    to verses bundle.
  - `verses-*.js` 86.34 → 78.06 kB (-8.28 kB) due to shared content
    chunk extraction.
  - `phone418-*.js` 51.54 → 52.51 kB (+0.97 kB) for carry-banner
    code.

  **Inherited "hint" diagnostics** (the 9 from v1.7's unused vars)
  carry into v1.0. Out of scope.

  **Inherited behavior preserved verbatim:** the V-4 line that zeroes
  the arcade banked-moves pool on Verses `restartGame()` (now
  `localStorage.setItem(PHONE418_BANKED_MOVES_KEY, '0')` on phone)
  matches tablet's same path. Apparently not user-affecting in
  tablet practice; T-1 may revisit. (T-1 shipped 2026-05-01 without
  revisiting this — preserved verbatim with constant renamed to
  PHONE418_BONUS_MOVES_KEY but storage-string value unchanged.)

- **Verses content promotion (Session N-1).** 2026-04-28. First of two
  sessions enabling phone-418-verses (N-2 shipped same day, see
  above). Pure refactor: game data folders (`titus-2-11-13`,
  `psalm-91`, `matthew-5`, `_template`) moved out of
  `platforms/tablet-verses/games/` to a neutral repo-root location at
  `content/verses/<slug>/game.js`. Tablet-verses v1.7 → v1.8 — only
  changes are the `import.meta.glob` path (`./games/*/game.js` →
  `../../content/verses/*/game.js`), the slug-extraction regex, and
  three doc-comment / in-app help-text references. Zero behavior
  change. `src/entry-verses.jsx` repointed to v1.8. Build clean (63
  modules, 0 warnings; verses bundle 84.33 → 86.34 kB / 26.25 kB gz —
  uptick attributable to the new v1.8 version-comment block, not code).
  N-2 (same day) validated the architecture: Vite auto-extracted a
  shared `game-*.js` chunk used by both verses bundles. **Six-decision
  scoping pass** for the full Phone-418-verses program done same
  morning; full locked decisions in the Memorize Mode → Phone-418-
  verses scope entry above. **Pre-existing TypeScript "hint"
  diagnostics** (9 unused-var hints inherited from v1.7) left in
  place — out of scope for N-1.

- **Phone-418 v11.7 hypernova rework port (Session M-2).** 2026-04-27.
  Surfaced same-day during M-1 parity comparison; shipped as immediate
  follow-up. Backport of tablet's "amplification, not interference"
  hypernova logic (Session C, 2026-04-21). Solo hypernova now fires
  specials within the 5×5+row+col footprint (chains into cascade);
  combos use footprint + half-of-rest with 30-tile floor; specials
  outside footprint preserved. Cascade stagger 400→480ms and
  match-to-clear transition 400→500ms on hypernova events. Three
  constants extracted (`HYPERNOVA_MIN_TILES_CLEARED`,
  `HYPERNOVA_CASCADE_SLOWDOWN`, `HYPERNOVA_MATCH_TRANSITION_MS`).
  Points unchanged. Phone-418 v13.0 → v13.1 (v13.0 archived). Build
  clean (51.54 kB bundle, +1.02 kB / +0.47 kB gzipped). v11.8 admin
  slow-motion playback hooks intentionally NOT ported (no AdminPanel
  on phone yet — separate deferred work).

- **Phone-418 → JSX migration (Session M-1).** 2026-04-27. Format-only
  conversion, zero behavior change. Phone-418 was the lone holdout from
  the repo's JSX/Vite norm — single standalone HTML file with CDN React
  and `React.createElement(...)` chains. Migration brings it in line so
  phone-418-verses can be a JSX peer and the toolchain is unified across
  the repo. Created `phone418.html`, `src/entry-phone418.jsx`, and
  `platforms/phone-418/match3-v13.0-418px-phone.jsx`; updated
  `vite.config.js` and `index.html`; archived v12.4 HTML. Build clean
  (50.52 kB bundle, gzipped 15.32 kB). "banked" naming preserved verbatim
  — Session T-1 (2026-05-01) renamed across 3 of 8 platforms (tablet,
  tablet-verses, phone-418-verses); the other 5 including phone-418
  arcade still use "banked" — see Cross-platform terminology sweep in
  the Terminology section. **Surfaced sync gaps
  with tablet** (now in Cross-platform parity section): v11.7 hypernova
  rework not ported (M-2), AdminPanel + `recordGameResult()` not present,
  verses → arcade carry banner not present.

- **Memorize Mode content — Matthew 5 v1.0 (PARTIAL).** 2026-04-25.
  First content-only session against the V-* engine — no
  `match3-vX.Y-tablet-verses.jsx` changes. New
  `platforms/tablet-verses/games/matthew-5/game.js` with three NKJV
  levels covering Matt 5:1–20: Beatitudes (5:1–12, 25 chunks / 24
  moves / 7,200 default target), Salt and light (5:13–16, 12 / 11 /
  3,300), Fulfilling the Law (5:17–20, 13 / 12 / 3,600). 50 chunks /
  47 moves total at v1.0.

  **Authoring workflow (new pattern, may apply to future content).**
  I draft chunks per-section against an NKJV reference; user edits
  each toward thematic-phrase chunks ("Blessed are X" entire phrase,
  combined "Whoever therefore breaks one of the least of these
  commandments," etc.). Pattern stabilized after the Beatitudes (level
  1) and held through levels 2 and 3 without re-decision.

  **Wrapping decision.** ~22 of 50 chunks exceed ~40 chars (the
  single-line limit at 20px Georgia bold in the 408px content
  column) and will wrap to 2 lines when current. Considered three
  paths: accept wrapping (chosen — lowest cost, preserves phrasing
  intent), cap chunks at ~40 chars (rejected — splits "Blessed are X"
  pattern), per-chunk font override (parked — engine work; see "Parked
  options" in the Memorize Mode section). Font-size reduction tested
  by estimate (20 → 19 → 18px) saves only ~1 wrap because long chunks
  are 50–60 chars, well past any of those thresholds; also visual
  hierarchy floors at 18px (prior chunks fixed at 15px).

  **Translation note for upcoming content.** Isaiah 52:13–53:12
  (planned next-after-Matt 5 work) will be **ESV**, not NKJV — user
  preference noted 2026-04-25. James 1 stays NKJV. First multi-
  translation project; data shape's existing `translation` field
  supports per-game choice without engine changes.

  **Future Matt 5 levels are additive.** Engine reads `levels[]`
  length without any "complete" gate. Adding 5:21+ in future sessions
  just appends entries — no engine touches, no platform-file version
  bump.

  **Bundle impact.** verses bundle 81.60 → 84.33 kB (+2.73 kB).
  Build clean.

- **Memorize Mode V-4 patch — suppress arcade BONUS ROUND banner
  in VERSES_MODE.** 2026-04-24 (post-V-4 ship). Tablet-verses
  bumped `v1.6 → v1.7` (`match3-v1.7-tablet-verses.jsx`). One-line
  fix: V-4 flipped `bonusRoundActive` true on `targetReached` to
  drive the silent 1.5× scoring branch, but the inherited arcade
  banner ("🌟 BONUS ROUND - 1.5x ALL POINTS! 🌟", pulsing gold)
  was gated only on the same flag and lit up alongside the silent
  multiplier — competing with the rolling text bar and dominating
  the view, contrary to the V-2 "silent 1.5×" spec. Guard added:
  `!VERSES_MODE && bonusRoundActive` on the banner JSX. Multiplier
  itself + the V-4 target-reached toast + the persistent header
  "· 1.5×" all keep working unchanged. Bundle dropped slightly
  (81.60 → 81.24 kB) — the guarded JSX tree-shakes under
  `VERSES_MODE = true` at module load.

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
