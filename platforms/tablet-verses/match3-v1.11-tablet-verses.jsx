import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import AdminPanel, { defaultStats, STATS_KEY, BONUS_MOVES_KEY } from '../../core/AdminPanel.jsx';

// =============================================================================
// MATCH-3 GAME v1.11 - TABLET VERSES (T-2 importer-only update)
//
// Session T-2 (2026-05-02): Importer-only version bump. Core's
// `BANKED_KEY` constant was renamed to `BONUS_MOVES_KEY` for code
// coherence. This file's import + all usages now reference
// `BONUS_MOVES_KEY`. No behavior change. Storage VALUE
// 'match3_bankedMoves' preserved verbatim — value migrates in T-3
// in lockstep with all platform constants.
//
// =============================================================================
// MATCH-3 GAME v1.10 - TABLET VERSES (MEMORIZE MODE)
//
// Session T-1 (2026-05-01): Bundled terminology rename. "Bonus Round" →
// "Victory Round" (the 1.5× multiplier phase) and `bankedMoves` →
// `bonusMoves` (the carry pool of earned +1 moves). Mirrors tablet
// v11.14's T-1 changes; same identifiers, same user-visible string
// updates.
//
// Tablet-verses-specific additions:
//   - Inner-component callback prop `onBankedMovesChange` →
//     `onBonusMovesChange` (the wrapper-to-Match3Game contract for
//     reporting pool changes). Surfaced during T-1 — wasn't on the
//     original inventory but is part of the same naming family.
//   - "banked-moves" hyphenated form in two comments → "bonus-moves".
//
// Intentionally untouched (per locked decision #5):
//   - `BONUS_MOVES_KEY` import and `match3_bankedMoves` localStorage key.
//   - Stats data: `endType: 'bonusRound'` written by recordGameResult,
//     `stats.bonusRoundsTaken` counter. AdminPanel still displays
//     these for historical entries. Will sweep when all 8 platforms
//     come over together in a future cross-platform terminology
//     session.
//
// No behavior changes. Pure rename.
//
// =============================================================================
// MATCH-3 GAME v1.9 - TABLET VERSES (MEMORIZE MODE)
//
// Session N-5 (2026-04-29): Apply N-4 are-you-sure expansion across
// platforms. Mirrors tablet v11.13's change — the bonus-moves prompt's
// "End and carry moves forward" button now also confirms when below
// target, instead of ending the round directly. Same one-line fix as
// N-4: prompt button onClick switched from `endLevelCarryBonus` to
// `requestEndLevelCarryBonus` (the wrapper that already handles
// below-target confirms for the in-header button).
//
// What changed in v1.9 vs v1.8:
//   - Bonus-moves prompt's "End and carry moves forward" button now
//     routes through `requestEndLevelCarryBonus`. Wrapper's `wouldWin`
//     check produces correct behavior in both prompt variants — confirms
//     if below target; ends directly if targetReached.
//   - v11.9 wrapper comment block updated to reflect the v1.9 expansion.
//
// No other behavior changes. Single-line code change; rest is doc.
//
// =============================================================================
// MATCH-3 GAME v1.8 - TABLET VERSES (MEMORIZE MODE)
//
// Session N-1 (2026-04-28): Content promotion. Verses game data
// (titus-2-11-13, psalm-91, matthew-5, _template) moved out of
// `platforms/tablet-verses/games/` to a neutral repo-root location at
// `content/verses/<slug>/game.js`. Tablet-verses still works
// identically — only the content discovery path changed. Sets up the
// upcoming phone-418-verses platform (Session N-2) to import from the
// same neutral location, so each new passage authored ships to both
// platforms instantly.
//
// Changes vs. v1.7:
//   - `import.meta.glob('./games/*/game.js', ...)` →
//     `import.meta.glob('../../content/verses/*/game.js', ...)`.
//   - Slug-extraction regex updated to match the new relative path.
//   - Doc-comment + in-app help-text references updated to the new
//     content path.
//   - The `platforms/tablet-verses/games/` directory is removed (was
//     emptied by the move).
//
// Behavior: zero changes. Same registry, same picker, same per-level
// flow, same persistence, same arcade-carry handoff.
//
// =============================================================================
// MATCH-3 GAME v1.7 - TABLET VERSES (MEMORIZE MODE)
//
// V-4 patch (2026-04-24, post-ship): suppress the inherited arcade
// "🌟 VICTORY ROUND - 1.5x ALL POINTS! 🌟" pulsing banner in
// VERSES_MODE. The banner was an arcade-side render gated only on
// `victoryRoundActive`; V-4 flipped that flag in VERSES_MODE to drive
// the silent 1.5× scoring branch, which inadvertently also lit up
// the big banner. The V-2 spec was always "silent 1.5×" (toast +
// persistent header indicator only) — the arcade banner dominates
// the view and competes with the rolling text bar, defeating the
// memorize-mode read. One-line guard: `!VERSES_MODE && victoryRoundActive`
// on the banner JSX. The multiplier itself + the toast + the
// persistent header "· 1.5×" all keep working unchanged.
//
// Why a version bump for a one-line fix: per CLAUDE.md the platform-
// file versioning rule has no "small fix" exception — every change
// archives + bumps. v1.6 stays in archive as the pre-fix snapshot.
//
// =============================================================================
// MATCH-3 GAME v1.6 - TABLET VERSES (MEMORIZE MODE)
//
// Session V-4 (2026-04-24): Persistence + stars + 1.5× victory round
// + arcade-mode handoff + board/text polish + see-entire-passage
// reveal. Largest single delivery in the V-* track — turns memorize
// mode into a fully replay-able platform with progress persistence,
// scoring rewards on target-hit, and a one-way bridge into tablet
// arcade. Six-decision scoping pass first; full locked decisions
// captured in `docs/DEFERRED.md` V-4 entry.
//
// Architecture changes vs. v1.5 (V-4 decisions #1–6):
//
//   PERSISTENCE LAYER (decision #1).
//   - Outer `Match3Verses` wrapper now owns `progress: Record<slug,
//     GameProgress>` mapping each game in the registry to its
//     stored stats. Hydrated eagerly at wrapper mount from
//     `localStorage["m3_verses_<slug>"]` per game. Persisted via a
//     `useEffect` that fires whenever progress changes, writing each
//     slug's blob back to its own key.
//   - Schema (per game):
//       { version: 1,
//         levels: Array<null | { best, stars, completions,
//                                lastPlayed }>,
//         completedLevels: number[],   // serialized; rehydrates as Set
//         fullCompleted: boolean }
//   - On game-pick, the wrapper hydrates `completedLevels` (as a
//     Set) and `fullCompleted` from `progress[slug]` instead of
//     resetting empty (V-3b behavior). Bonus moves still zero on
//     return to picker — bonusMoves does NOT persist.
//
//   STARS + BEST-SCORE (decisions #2 & #3).
//   - On level win (`onLevelComplete` from VersesGame), the wrapper
//     computes star count from `score / target` against locked
//     thresholds (1.00 / 1.15 / 1.30 / 1.50 / 1.75 = 1/2/3/4/5
//     stars) and updates the level's progress entry with no-
//     regression rule (best/stars only update if new value is
//     higher; completions and lastPlayed always update).
//   - Star rendering: 5 × `★` Unicode character per level row.
//     Earned: `color: '#FFD700'` (gold). Unearned: `color: '#ccc'`
//     (matches campaign pattern, reused exactly).
//
//   CARD UI (decision #3).
//   - Picker cards add an aggregate `X / Y ★` line below the
//     translation/level-count. Inline ✓ before the title when the
//     game is fully completed. Locked-card path unchanged.
//   - Level-select cards (unlocked, played-at-least-once) add a
//     5-star row + `Best: N,NNN` line below the title. Inline ✓
//     before title for completed levels (won at least once).
//     Unlocked-but-unplayed cards show 5 empty stars, no best
//     score. Locked cards stay title-only (V-3b spec).
//
//   VICTORY ROUND (decision #4).
//   - When `targetReached` flips true in VERSES_MODE, the existing
//     `victoryRoundActive` flag (already wired into the scoring
//     branch with `VICTORY_ROUND_MULTIPLIER = 1.5`) auto-flips true.
//     No prompt — silent activation per spec.
//   - Toast copy at target-hit: `✓ Target reached — 1.5×!` (V-2's
//     `✓ Target reached!` updated). Same 2.5s auto-dismiss, same
//     gold tint, same top position.
//   - Header Target field shows persistent `· 1.5×` after the gold
//     ✓ during the multiplier window. Disappears at round end via
//     the per-level remount.
//
//   ARCADE-MODE HANDOFF (decision #5).
//   - V-3b's inactive Arcade mode button on the final-level
//     first-pass win modal flips active. "Available in v1.6"
//     caption removed.
//   - onClick: writes `bonusMoves` to `BONUS_MOVES_KEY` (the same key
//     tablet arcade reads at mount), writes a separate carry-
//     receipt key (`m3_arcade_carry_from_verses`) holding the
//     count + timestamp, then navigates to `tablet.html`.
//   - Tablet arcade v11.12 (separate platform-file bump in this
//     same V-4 commit) reads the carry-receipt key on mount and
//     shows a 2.5s "+N bonus moves carried from memorize mode"
//     banner, then clears the key.
//
//   BOARD SHRINK + TEXT BAR BUMP (mid-V-4 playtest fix).
//   - VERSES_MODE: `ROWS` 12 → 10, `COLS` stays 10. Frees ~100px
//     of vertical space and changes scoring expectation slightly
//     (fewer cascade opportunities → lower expected per-move
//     score). Target formula stays at `moves × 300` for V-4
//     ship; tune to 250 in playtest if needed.
//   - Text bar fonts bumped (current 19/13 → 22/15px), padding
//     bumped (8/20 → 10/20), current chunk gains a subtle
//     left-border accent so it reads more prominently than v1.5.
//   - Arcade fallback path (`!VERSES_MODE`) stays at 12 rows /
//     v1.5 text-bar sizing — no regression risk.
//
//   "SEE ENTIRE X" REVEAL (mid-V-4 playtest fix).
//   - New `versesFlattenAllChunks(game)` helper concatenates
//     `flatChunks` across every level, preserving per-verse
//     reference markers.
//   - New "See entire <game.title>" button on the final-level
//     first-pass win modal (4th button alongside Play again / Back
//     to level selections / Arcade mode) AND on the level-select
//     screen when `fullCompleted` is true. Single-level games
//     don't get the button — their existing end-of-round modal
//     already shows the full passage.
//   - Modal reuses the V-2 passage-reveal component with
//     concatenated chunks instead of one level's. Single Close
//     button returns to whichever screen launched it.
//
// Earlier history (V-3b multi-level, V-3a picker, V-2 polish, V-1
// scaffold) preserved below.
// =============================================================================
//
// MATCH-3 GAME v1.5 - TABLET VERSES (MEMORIZE MODE)
//
// Session V-3b (2026-04-24): Multi-level games + level-select screen
// + hybrid progression + Psalm 91 content (4 levels, 49 chunks). The
// V-3 spec's largest delivery — turns the verses platform from a
// single-passage MVP into a multi-passage game with per-level
// navigation and a free-replay mode after first-pass completion.
//
// Architecture changes vs. v1.4 (Decision #1, Option B locked
// during V-3b scoping):
//   - The outer `Match3Verses` wrapper now owns navigation state at
//     two scopes: passage (`activeSlug`) and level (`activeLevelIndex`)
//     plus the cross-level state that has to survive level transitions
//     within a game (`completedLevels: Set<number>`,
//     `fullCompleted: boolean`) and the bonus-moves pool that V-3
//     spec'd as level-to-level-but-not-game-to-game (`bonusMoves`).
//   - `bonusMoves` lifted out of `VersesGame` — the v1.4 useState +
//     persist effect are gone from the game body. `VersesGame` now
//     receives `bonusMoves` as a prop and reports changes via an
//     `onBonusMovesChange` callback. Reset/zero behavior moves to
//     the wrapper.
//   - `VersesGame` keys on `${slug}:${levelIndex}` instead of just
//     `slug`, so each level transition forces a fresh mount —
//     per-level state (score, moves, target, revealedChunkIndex,
//     etc.) auto-resets without manual orchestration. The wrapper-
//     owned state (bonusMoves, completedLevels, fullCompleted)
//     survives across the remount.
//   - Three render branches in `Match3Verses`:
//       null slug              → VersesPicker
//       multi-level game,
//         no levelIndex        → VersesLevelSelect
//       slug + levelIndex set  → VersesGame
//
// Data shape:
//   - `versesFlattenLevel(game, levelIndex)` — extends the v1.2
//     single-level helper with an index parameter. Single-level
//     games (top-level `verses` array) ignore the index. Multi-
//     level games (`levels[]` array) pick `levels[levelIndex]`.
//
// Hybrid progression (in-memory only; V-4 will add localStorage):
//   - Level 0 always unlocked.
//   - Level N unlocked iff Level N−1 is in `completedLevels` for the
//     current session OR `fullCompleted === true` for this game.
//   - On level win (target hit), wrapper adds the index to
//     `completedLevels`. When the set fills, `fullCompleted` flips
//     true → all levels become unlocked (free-replay mode).
//   - Returning to the picker (`onBack` from any in-game / level-
//     select / start-modal back button) clears `activeSlug`,
//     `completedLevels`, `fullCompleted`, and zeros `bonusMoves`.
//     Session-only — refresh = reset. V-4 wraps this same shape
//     with localStorage.
//
// Level-select screen (`VersesLevelSelect` — Decision #4):
//   - Same purple gradient + Georgia title (36px, centered) +
//     `repeat(auto-fill, minmax(220px, 1fr))` card grid as the
//     picker.
//   - Page header = game title (e.g., "Psalm 91"). No subtitle.
//   - `← Back to passage selections` button top-left.
//   - Per-card content: level title from `level.title` (e.g.,
//     "Psalm 91:1–4") or fallback "Level N". Title only —
//     no chunk count / move count / target score (V-4 layers
//     stars + best-score + ✓-Completed marker into these cards).
//   - Locked cards (Decision #3): opacity 0.5 + grayscale(0.7),
//     no hover, `cursor: default`, no onClick.
//
// End-of-round modal (Decision #2 button matrix):
//   - Single-level (Titus): Play again + Back to passage selections.
//   - Multi-level, win, non-final, first-pass: Next level → +
//     Back to level selections.
//   - Multi-level, win, final, first-pass (game completes):
//     Play again + Back to level selections + Arcade mode (inactive
//     in V-3b — opacity 0.5, no onClick, "Available in v1.6"
//     caption; flips active in V-4).
//   - Multi-level, fail (any position), first-pass: Retry +
//     Back to level selections.
//   - Multi-level, win, free-replay: Replay + Back to level
//     selections.
//   - Multi-level, fail, free-replay: Retry + Back to level
//     selections.
//
// Multi-level play UX:
//   - In-game header (multi-level only): "Level N of M" indicator
//     under the game title.
//   - Start-of-round passage modal fires at the start of each
//     level, not just game start. Button label: "Begin game"
//     (single-level), "Begin level" (multi-level).
//   - "Next level →" button increments `activeLevelIndex` at the
//     wrapper level → key changes → `VersesGame` remounts with the
//     next level's data. Per-level state resets are a byproduct of
//     the remount.
//   - "Play again" on the final-level win modal restarts the game
//     from level 0, keeping `completedLevels` (so the player stays
//     in free-replay) and zeroing `bonusMoves` (full-game restart
//     is a soft session boundary).
//
// Content:
//   - New `content/verses/psalm-91/game.js` — 4 levels, NKJV, 49 chunks total
//     across thematic breaks (1–4 / 5–8 / 9–13 / 14–16). Reference
//     format "Ps. 91:N" to fit the existing 110px text-bar column.
//     Default targets via `moves × 300` formula; per-level overrides
//     omitted at V-3b ship and tuned in playtest if needed.
//
// Earlier history (V-3a picker, V-2 polish, V-1 scaffold) preserved
// below.
// =============================================================================
//
// MATCH-3 GAME v1.4 - TABLET VERSES (MEMORIZE MODE)
//
// Session V-3a (2026-04-24): Picker screen + back navigation.
// Replaces the V-2 hardcoded boot path with a runtime picker; Titus
// 2:11–13 now boots through it. Single-level games click straight
// to play; multi-level cards (none yet — Psalm 91 lands in V-3b)
// would route to a level-select stub, deferred to V-3b.
//
// Architecture changes vs. v1.3:
//   - The exported `Match3Verses` becomes a thin outer wrapper that
//     manages `activeSlug` state. When null, it renders the new
//     `VersesPicker` component. When a slug is picked, it renders
//     `VersesGame` (the renamed v1.3 component) with a `key={slug}`
//     so a fresh mount happens for each game (and, in V-3b,
//     between levels).
//   - Module-level `VERSES_BOOT_SLUG`, `versesActiveGame`, and
//     `versesActiveLevel` constants removed. `VersesGame` derives
//     game + level from its `slug` prop via `useMemo`.
//   - `VersesGame` accepts an `onBack` callback. Two new entry
//     points wire to it: a `← Back` button in the in-game header
//     top-left (always clickable, no confirm popup), and a `Back`
//     button alongside `Begin game` on the start-of-round modal.
//   - Bonus-moves init zeros in VERSES_MODE rather than reading
//     localStorage, so returning to the picker (which unmounts
//     `VersesGame` via the slug-key) leaves no dead currency
//     behind on the next pick. (Spec: pool zeroes on any return
//     to main picker.)
//
// Picker screen (`VersesPicker`):
//   - Purple gradient background matching the in-game body.
//   - Header: "Verses" title + subtitle "Select a passage to begin."
//   - Card grid: `repeat(auto-fill, minmax(220px, 1fr))` — same
//     as `index.html` landing page.
//   - Per-card content: title + translation (smaller, muted).
//     Multi-level games add a third line "N levels". No emoji.
//   - Click → single-level setActiveSlug → play. Multi-level
//     would open level-select; V-3a falls back to direct play
//     since no multi-level games exist yet.
//
// V-2 follow-up bundled in this commit (header shrink):
//   - VERSES_MODE header drops `minHeight: 80px`, switches
//     `justifyContent` from `space-between` to `flex-start`, adds
//     a small `gap`. The earlier 80px floor + space-between
//     stretched empty space between the title and the
//     Score/Moves/Target row.
//
// Earlier history (V-2 polish, V-1 scaffold) preserved below.
// =============================================================================
//
// MATCH-3 GAME v1.3 - TABLET VERSES (MEMORIZE MODE)
//
// Session V-2 continuing post-playtest polish (2026-04-24). Header
// trim to fit board + header + 3-chunk text bar within a standard
// laptop-browser viewport (user couldn't see both score at top and
// bottom-row tiles without scrolling at v1.2). Changes vs. v1.2:
//   - Hide the "✨ Specials on board: N" line in VERSES_MODE. Useful
//     debug info for arcade, noise for memorization.
//   - Hide the combo-indicator + idle-stats div entirely in
//     VERSES_MODE (the whole minHeight-24px slot goes away, not
//     just collapse-when-idle). Score popups over the board still
//     show per-match points + multiplier, so the mechanic feedback
//     stays where the player's eye already is.
//   - Header card minHeight 110 → 80 in VERSES_MODE to absorb the
//     freed vertical space.
//   - Kept: title, Score, Moves, Bonus moves (when >0), Target,
//     dark/light toggle.
//
// Session V-2 post-playtest polish (2026-04-24). Four fixes driven
// by the first live run of v1.1:
//   1. Header font: revert the Georgia override on the game-header
//      <h1>. Georgia was fighting the Arial header chrome and read
//      as "odd." Georgia stays on the text bar and passage modal
//      (content typography), not the header.
//   2. Reveal timing: fire the chunk reveal the instant a successful
//      swap decrements moves (i.e., while cascades are still
//      animating), not at post-settle + 200ms beat. Playtest finding:
//      waiting until settle made the new chunk feel late — the
//      player was already scanning the cascade. With reveal-on-
//      decrement, the next chunk is ready and waiting during the
//      cascade. Drops `pendingRevealRef` + the settle-wait effect
//      + the 200ms beat; keeps the 250ms CSS fade-in. (The moves-
//      decrement useEffect already ignores mount and restart via
//      `prevMovesRef`, so the same guard carries over.)
//   3. Text-bar layout: the 96px min-height + Georgia at 22/15px
//      created a taller container than the content required, so the
//      board + banner + text bar didn't fit in a standard viewport
//      without scrolling. Drop min-height (container sizes to
//      content), tighten padding (14px 20px → 8px 20px) and fonts
//      (current 22 → 19px, prior 15 → 13px, line-height 1.3 → 1.2).
//      Trade-off: the board shifts down as the 1st and 2nd prior
//      chunks accumulate, then stable thereafter. Net: ~40–50px
//      saved off the max layout footprint.
//   4. Start-of-game passage modal: new `showStartModal` state,
//      initialized true on mount. Reuses the end-of-round passage
//      modal with a "Begin game" button (instead of "Play again").
//      Purpose: player sees the full passage before memorizing, so
//      they know what they're working toward. Also re-fires on
//      Play Again — shows the passage between rounds too. Modal
//      overlay's z-index naturally locks canvas interaction;
//      swap handlers pick up a matching `showStartModal` guard as
//      defense-in-depth.
//
// Session V-2 (2026-04-24): Single-game MVP — Titus 2:11–13 NKJV.
// First playtest-able memorize-mode version. See docs/DEFERRED.md
// "Memorize Mode (Verses platform)" for the full V-1 through V-5 spec.
//
// Changes vs. v1.0:
//   - Content model: content/verses/<slug>/game.js discovered via
//     import.meta.glob (path updated in N-1 from games/<slug>/game.js).
//     V-2 hardcoded boot to titus-2-11-13/.
//     _template/ + README provided for authoring.
//   - VERSES_MODE constant gates the memorize-mode flow. Moves =
//     chunks − 1 (12 for Titus); target = game.targetScore or
//     moves × 300 formula default (3,600 for Titus).
//   - Rolling 3-chunk text bar between header and canvas. Georgia
//     serif, two-column (reference flush-left / content indented).
//     Current chunk emphasized (22px, full contrast); prior two
//     dimmed (15px, #888 on light / #ccc on dark — respects the
//     #ccc floor rule). Chunk 0 pre-visible at game start;
//     subsequent chunks reveal on successful-swap settle with a
//     200ms beat then a 250ms fade/slide. Non-match swaps don't
//     reveal (they don't decrement moves, so no trigger).
//   - In-game header is content-driven — reads the game title
//     (e.g. "Titus 2:11–13"). No version badge inline.
//   - Target-hit at V-2: brief "Target reached!" toast (~2.5s auto-
//     dismiss) + persistent header state-change (target number goes
//     gold + ✓). No 1.5× scoring mode — that's V-4.
//   - Arcade end-of-run flow (bonus-moves prompt, gameState win/lose
//     banner, recordGameResult stats writes) suppressed in
//     VERSES_MODE. Instead: when moves hits 0 and the final chunk
//     has been revealed, a 2.5s hold → passage-reveal modal fires.
//     Modal shows all 13 chunks in the same Georgia two-column
//     layout at full contrast, translation label
//     ("Titus 2:11–13 · NKJV"), and a Play Again button. No auto-
//     dismiss.
//   - Play Again regenerates the board, resets moves/score/reveal
//     index / toast / modal. V-2 has no persistence; bonus-moves
//     pool resets to 0 alongside score.
//   - No "back to arcade" or handoff button at V-2 — that's V-4.
//
// Session V-1 (2026-04-24): Scaffold fork from tablet v11.11. Plumbing
// only — platform played exactly like tablet arcade. Memorize mechanics
// landed in V-2.
//
// V-1 changes vs. tablet v11.11:
//   - Component renamed: Match3Game → Match3Verses.
//   - In-game header: "🎮 Match-3 v11.11" → "Verses v1.0" (no emoji,
//     per scoping — content-driven title arrived in V-2).
//   - Filename + location: platforms/tablet-verses/match3-v1.0-tablet-
//     verses.jsx. Carries the full tablet v11.11 comment history below.
//
// Original tablet history follows.
// -----------------------------------------------------------------------------
// MATCH-3 GAME v11.11 - TABLET OPTIMIZED
// Performance-optimized with HTML5 Canvas rendering
// 10x12 grid, R1 Sunflower, Blue Jewel, Green Clover (board v7 designs)
// v10.1-tablet: Special power rebalance
//   Bomb:      3×3 + full row + col, flat 750 pts, chains to row/col specials
//   Supernova: 5×5 + full row + col, flat 2000 pts, chains to row/col specials
//   Hypernova: 5×5 + row + col + random 50% of remaining regular tiles,
//              specials IMMUNE (never removed), flat 5000 pts, min 30 tiles
//   Combos rescaled to match new base power levels
// v10.5-tablet: Bug fixes + features
//   Fix A: Bonus move now deferred past game-end score flush (moves=0 doesn't end game
//           while a bonus move threshold is pending)
//   Fix B: Hypernova/supernova combos left the two swapped specials on the board
//           (all "clear regular tiles" combo branches now explicitly remove swapped tiles)
//   Feature: Bonus move popup replaced with animated burst at the Moves counter in header
// v11-tablet: Input handling fixes
//   Fix 1: dragStart converted from useState to useRef so rapid touchmove events see
//           the cleared value synchronously — prevents double-swap and 2→0 move skip
//   Fix 2: swapFiredRef guards handleCanvasClick against the phantom synthetic click
//           that fires after every touch drag-swap (modern browsers emit detail=1,
//           bypassing the old detail===0 guard)
// v11.1-tablet: Visual fix
//   Fix 3: Special tiles created from 4+ matches now start animY one tile-height above
//           their final position instead of at it — prevents instant pop-in and gives
//           a consistent short drop animation matching other new tiles
// v11.2-tablet: Stats + admin panel + bonus moves foundation
//   Stats: recordGameResult() writes match3_stats JSON to localStorage on every game end
//          (endType: won | lost | earlyEnd | bonusRound | savedMoves)
//   Admin: AdminPanel component (core/AdminPanel.jsx) — open via ?admin=1 or long-press score
//   Bonus moves: persistent counter + on-screen display (game-flow wiring TBD)
// v11.3-tablet: Bonus moves game-flow wiring
//   Bonus moves (per 10k) now accrue to a separate in-game pool (🎯) instead of
//   being added directly to the regular moves counter.
//   When regular moves hit 0 and the pool is non-empty, player chooses:
//     "Use extra moves" — transfers pool to moves, adds "End level" button to header
//     "Save moves / End level" — banks pool to match3_bankedMoves, ends game
//   "End level" button banks remaining moves and ends the game at any time.
// v11.4-tablet: Bug fixes
//   Fix 1: Save-moves prompt not appearing when moves hit 0 with pool > 0
//   Fix 2: Bonus move not awarded when 10k threshold crossed on the last turn
//   Root cause: game-end effect ran after bonus-move effect, seeing an already-
//   updated bonusMoveThresholdRef while bonusMovePool was still 0 in the stale
//   closure. Fix: moved game-end effect above bonus-move effect so React's
//   in-order execution lets game-end see the stale ref and defer correctly.
// v11.5-tablet: Fix — special+special swap now creates additional specials
//   When two specials are swapped, findMatches was skipped (early return), so
//   any 4+ tile match formed by the swap was lost. Fix: run findMatches on the
//   swapped grid, pass additional connected groups (≥4 tiles) into
//   activateSpecialCombination, and place specials at cleared positions after
//   the combination fires — same logic as removeMatches.
// v11.6-tablet: Bonus moves logic mirrors campaign (v1.9–v1.22)
//   Architecture: collapsed two-pool system into one. Bonus moves earned during
//   play (per 10k pts) go directly into bonusMoves (persistent across games)
//   instead of a separate in-game bonusMovePool.
//   Prompt fires whenever moves=0 and bonusMoves>0 — win OR fail (fixes the
//   old !hasReachedTarget gate that caused the prompt to never appear on a win).
//   Prompt also fires after the victory round ends if bonusMoves>0.
//   "Use bonus moves": sets usingBonusMoves=true; each valid swap draws 1 from
//   bonusMoves (moves counter stays at 0).
//   "End and carry moves forward": game ends, bonusMoves persist naturally.
//   Header: removed 🏦 icon and separate 🎯 pool display; replaced with single
//   "Bonus moves: N" label. Header button updated to match terminology.
// v11.7-tablet: Session C (2026-04-21) — hypernova rework: amplification, not interference
//   Implements the DESIGN.md "Variety through amplification, not interference"
//   corollary. Solo hypernova and all three hypernova combos now FIRE specials
//   within their blast footprint (previously: solo never fired specials,
//   combos cleared all non-specials). Specials OUTSIDE the blast footprint
//   are preserved, along with only half of the non-special tiles outside.
//   Net effect: combos leave more of the board intact + more specials alive,
//   setting up the next turn's cascade chain. Matches the principle that
//   specials are peaks, not cleanups.
//
//   Changes:
//   - Solo hypernova: 5×5 + row + col footprint fires specials (cascades,
//     chain popups) — was "no chainedSpecials" before. Half of non-specials
//     outside footprint still cleared. 30-tile floor unchanged. 5000 pts.
//   - hypernova+hypernova: two footprints (each fires specials in its zone)
//     + half of non-specials outside combined footprints. Distant specials
//     preserved. 30-tile floor. 10000 pts unchanged.
//   - hypernova+supernova: both footprints fire specials in their zones
//     + half outside. Distant specials preserved. 30-tile floor. 8000 pts
//     unchanged.
//   - bomb/cross/line+hypernova: X's full effect (fires specials in its
//     path) + hypernova footprint (fires specials in its zone) + half
//     outside. Distant specials preserved. 30-tile floor. 6000 pts unchanged.
//
//   Visual/timing polish on hypernova events:
//   - Two-phase clear: footprint clears first, then ~200ms later the
//     half-of-rest clears. Gives "primary blast, then shockwave" read.
//   - Cascade stagger 300 → 360ms between chained specials.
//   - Match-to-clear transition 400 → 500ms for hypernova events.
//
//   Threshold constants extracted: SUPERNOVA_MIN_TILES (6) and
//   HYPERNOVA_MIN_TILES (7) — defaults unchanged; one-line tuning for
//   future testing / reward-mode sandbox.
// v11.8-tablet: Session D (2026-04-21) — playback / scoring-history panel + slow-motion
//   Admin/developer tooling for watching cascades unfold and understanding
//   how each point was scored. Two features:
//
//   1) Scoring history panel (left-side overlay, admin-only).
//      Game-wide accumulating list of every scoring event. Each turn is a
//      collapsible section with the per-event breakdown:
//         Match 1: 3-clover (horizontal) — 30 × 1.0 = 30
//         Cascade 1 — 4-sun → line special — 80 × 1.5 = 120
//         Cascade 1 — line fired — 300 × 1.5 = 450
//         Cascade 3 — bomb fired — 750 × 2.5 = 1875
//      Latest turn auto-expanded, previous collapsed. Click any event row
//      to flash the tiles on the board (reuses existing flashingTiles state).
//      Game total displayed at bottom. Clears on restartGame only.
//
//   2) Slow-motion playback — 1× (normal) / 2× / 5× admin selector.
//      Multiplies all pipeline setTimeout delays (match transition, cascade
//      stagger, gravity, fill) by the inverse factor. Score popup durations
//      scale to match so they stay visible.
//      Implementation: pipelineTimeout(fn, ms) helper replaces setTimeout
//      across ~12 call sites. Reads playbackSpeedRef so speed changes apply
//      immediately without React re-render coupling.
//
//   Admin access:
//      ?admin=1 → open admin panel → Playback section toggles history +
//      sets speed. ?playback=1 URL param convenience enables history panel
//      immediately on load.
//
//   Step mode (Part 3 of original Session D scope) deferred to its own
//   platform entry (Session D-2) — needs a pipeline refactor from
//   callback-setTimeouts to await-based pauses. See docs/DEFERRED.md.
// v11.9-tablet: Session J (2026-04-22) — parity with campaign v1.25 + run tracking
//   Ports three features from campaign v1.25 into tablet arcade, plus a
//   tablet-specific run-tracking metric requested during playtest.
//
//   1) Bonus-move cap bumped 25 → 99 (BONUS_MOVES_CAP). Warning threshold
//      bumped 20 → 90 (BONUS_MOVES_WARN). Header messaging when nearing
//      cap ("Nearing cap — max 99") and at cap ("Cap reached — no
//      additional moves can be earned") mirrors campaign wording.
//
//   2) "Are you sure?" end-confirm popup — fires on the in-header "End and
//      carry moves forward" button during active bonus-moves use, when
//      score is below target. Not fired from the main bonus-moves prompt
//      (that's a save, not a loss). Click "Yes, end…" → endLevelCarryBonus.
//      Click "Keep playing" → dismisses popup. Mirrors campaign v1.25 logic.
//
//   3) Run tracking — tablet-specific. On the end-game banner (win OR loss),
//      show:
//         • "Current run: N wins" — consecutive successful rounds since
//           last loss. Increments on 'won', resets to 0 on 'gameover'.
//         • "Longest run: N wins" — all-time best streak of consecutive
//           wins. Updated after every win if exceeded.
//      Persisted via localStorage keys `match3_currentRun` / `match3_longestRun`.
//      Terminology intentional per user feedback: "run" (not "streak") for
//      consecutive won rounds in tablet arcade.
//
//   Session J scope does NOT yet port these to phone-341 / phone-418 —
//   a future session (after phone-418 blank-screen fix / Session B-2)
//   will duplicate.
//
// v11.10-tablet: Banner version string — update hardcoded "v11.2" in the
//   in-game banner to "v11.10" (was stale since v11.2 shipped; never
//   bumped through v11.3–v11.9). No behavioral change.
// v11.11-tablet: Session L (2026-04-22) — contrast fix across admin panel
//   and scoring-history drawer. User flagged off-white-on-dark text as
//   hard to read.
//   Rule applied: floor all text colors at #ccc (darker greys — #444/#555/
//   #666/#777/#888/#aaa/#bbb — replaced). Plus small-text bumps: 10px
//   uppercase labels → 11px + fontWeight 500; 11px helper text → 12px.
//   Shared core/AdminPanel.jsx edited in place (CLAUDE.md notes shared
//   core files exempt from the never-overwrite rule). Inline tablet
//   changes limited to ScoringHistoryPanel and TabletAdminWrapper
//   components. Banner version string v11.10 → v11.11.
// =============================================================================

// =============================================================================
// V-2: VERSES / MEMORIZE MODE
// =============================================================================
// VERSES_MODE gates the memorize-mode flow. Flipping it false would
// restore vanilla tablet-arcade behavior (move count, target, end-of-
// run prompt, win/loss banner, stats writes). V-4 may add a runtime
// admin switch, but V-2 is always-on.
// V-4: hoisted above the board constants so ROWS can read it.
const VERSES_MODE = true;

// Game Constants
// V-4: VERSES_MODE board shrinks 12 → 10 rows to free vertical space for
// the bumped text bar and tighter laptop-viewport fit. Arcade fallback
// path stays at 12 rows (no regression risk, no scoring-tuning change).
// COLS unchanged at 10.
const ROWS = VERSES_MODE ? 10 : 12;
const COLS = 10;
const TILE_SIZE = 50;
const TILE_GAP = 4;
const TILE_TYPES = 6;

// Difficulty Constants
const MIN_MOVES = 18;
const MAX_MOVES = 24;
const BASE_TARGET = 5000;
const TARGET_VARIANCE = 1500;

// V-2: Chunk-reveal timing.
// v1.1 had CHUNK_REVEAL_BEAT_MS (200ms pause after settle before reveal)
// as part of the old post-settle reveal pipeline. v1.2 fires reveal on
// moves-decrement so no beat is needed. Constant removed; only the
// fade duration remains.
const CHUNK_REVEAL_FADE_MS   = 250;   // CSS fade/slide duration on new-chunk entry
const PASSAGE_HOLD_MS        = 2500;  // hold after final-chunk reveal before modal opens
const TARGET_TOAST_MS        = 2500;  // auto-dismiss for "Target reached!" toast
const TARGET_PER_MOVE_DEFAULT = 300;  // default target formula: moves × 300

// V-2: Content discovery. Eager glob — all games resolved at build time.
// Runtime filter excludes template folders (slug starts with "_") and
// games flagged hidden. V-2 boots hardcoded to BOOT_SLUG; V-3 adds the
// picker on top of this same registry.
// N-1 (v1.8): glob path moved from `./games/` to repo-root
// `content/verses/`, shared with the upcoming phone-418-verses platform.
const versesGameModules = import.meta.glob('../../content/verses/*/game.js', { eager: true });
const versesGameRegistry = (() => {
  const out = {};
  for (const path in versesGameModules) {
    // path shape: "../../content/verses/<slug>/game.js"
    const match = path.match(/^\.\.\/\.\.\/content\/verses\/([^/]+)\/game\.js$/);
    if (!match) continue;
    const slug = match[1];
    if (slug.startsWith('_')) continue;
    const mod = versesGameModules[path];
    const game = mod && mod.default;
    if (!game || game.hidden) continue;
    out[slug] = game;
  }
  return out;
})();
// V-3a: VERSES_BOOT_SLUG and the module-level versesActiveGame /
// versesActiveLevel constants are gone. `VersesGame` now receives a
// `slug` prop from the outer `Match3Verses` wrapper and derives the
// game + level via `useMemo` at component top. The registry above
// stays module-level (pure data, computed once at build time).

// V-2 / V-3b: Flatten one level of a game to
// { level, flatChunks, totalChunks, moves, target }. The runtime
// plays one level at a time.
//
// Single-level games (top-level `verses` array) ignore the index —
// we wrap the top-level data as a single virtual level. Multi-level
// games (`levels[]` array) pick `levels[levelIndex]`. Bounds-checking
// returns null for out-of-range indices so the wrapper can fall back
// to a safe state.
function versesFlattenLevel(game, levelIndex = 0) {
  if (!game) return null;
  let level;
  if (Array.isArray(game.levels) && game.levels.length > 0) {
    if (levelIndex < 0 || levelIndex >= game.levels.length) return null;
    level = game.levels[levelIndex];
  } else {
    // Single-level shape — wrap top-level fields as a virtual level.
    level = { title: game.title, verses: game.verses, targetScore: game.targetScore };
  }
  const verses = level.verses || [];
  const flatChunks = [];
  for (const v of verses) {
    const reference = v.reference || null;
    const chunks = v.chunks || [];
    chunks.forEach((content, idx) => {
      flatChunks.push({
        content,
        reference: idx === 0 ? reference : null,
      });
    });
  }
  const totalChunks = flatChunks.length;
  // Chunk 0 pre-visible → reveals = totalChunks − 1 → moves = totalChunks − 1.
  const moves = Math.max(1, totalChunks - 1);
  const target = level.targetScore ?? (moves * TARGET_PER_MOVE_DEFAULT);
  return { level, flatChunks, totalChunks, moves, target };
}

// V-3b: Helper — true iff the game has a multi-level shape
// (`levels[]` with more than one element). Used by the wrapper to
// choose between level-select and direct-to-play after a pick.
function versesIsMultiLevel(game) {
  return !!(game && Array.isArray(game.levels) && game.levels.length > 1);
}

// V-4: Persistence layer constants + helpers.
const VERSES_PROGRESS_KEY_PREFIX = 'm3_verses_';
const VERSES_PROGRESS_VERSION = 1;
// Star thresholds locked in V-4 scoping (matches campaign).
// Index = star count (1–5); value = required score-to-target ratio.
// 0 stars when score is below 1.00× target (target wasn't hit).
const VERSES_STAR_THRESHOLDS = [1.00, 1.15, 1.30, 1.50, 1.75];

// Build an empty-progress object for a game, sized to the right
// number of level slots. Used at hydration when no localStorage
// blob exists for this slug, and as a fallback when JSON.parse
// throws on a malformed stored blob.
function versesEmptyProgress(game) {
  const levelCount = (game && Array.isArray(game.levels) && game.levels.length > 0)
    ? game.levels.length
    : 1;
  return {
    version: VERSES_PROGRESS_VERSION,
    levels: new Array(levelCount).fill(null),
    completedLevels: [],
    fullCompleted: false,
  };
}

// Compute star count (0–5) for a given score against a target.
// Returns 0 when target wasn't hit (score < target). Otherwise picks
// the highest threshold the score-to-target ratio satisfies.
function versesComputeStars(score, target) {
  if (!target || target <= 0) return 0;
  const ratio = score / target;
  if (ratio < VERSES_STAR_THRESHOLDS[0]) return 0;
  let stars = 0;
  for (let i = 0; i < VERSES_STAR_THRESHOLDS.length; i++) {
    if (ratio >= VERSES_STAR_THRESHOLDS[i]) stars = i + 1;
  }
  return stars;
}

// Aggregate stars + max possible across all levels of a game.
// Used by the picker card "X / Y ★" line.
function versesAggregateStars(game, gameProgress) {
  if (!game) return { earned: 0, max: 0 };
  const levelCount = (Array.isArray(game.levels) && game.levels.length > 0)
    ? game.levels.length
    : 1;
  const max = levelCount * VERSES_STAR_THRESHOLDS.length;
  let earned = 0;
  if (gameProgress && Array.isArray(gameProgress.levels)) {
    for (const lvl of gameProgress.levels) {
      if (lvl && typeof lvl.stars === 'number') earned += lvl.stars;
    }
  }
  return { earned, max };
}

// V-4: Concatenate flatChunks across every level of a multi-level
// game. Used by the "See entire <game.title>" reveal modal that
// appears on the final-level first-pass win and on the level-select
// page when fullCompleted is true. Single-level games never need
// this — their existing end-of-round modal already shows the full
// passage as one read.
function versesFlattenAllChunks(game) {
  if (!game) return [];
  if (Array.isArray(game.levels) && game.levels.length > 0) {
    const all = [];
    for (let i = 0; i < game.levels.length; i++) {
      const lvl = versesFlattenLevel(game, i);
      if (lvl && Array.isArray(lvl.flatChunks)) {
        for (const ch of lvl.flatChunks) all.push(ch);
      }
    }
    return all;
  }
  // Single-level fallback — same as the level's flatChunks.
  const lvl = versesFlattenLevel(game, 0);
  return (lvl && lvl.flatChunks) ? lvl.flatChunks : [];
}

// Scoring Constants
const WIN_BONUS_PER_MOVE = 100;
const EARLY_END_BONUS_PER_MOVE = 200; // v8.10: Higher bonus for ending early instead of victory round
const VICTORY_ROUND_MULTIPLIER = 1.5;   // v8.10: Points multiplier during victory round
const DIFFICULTY_INCREMENT_MIN = 200;
const DIFFICULTY_INCREMENT_MAX = 500;

// v10.4: Award one bonus move for every BONUS_MOVE_INTERVAL points scored
const BONUS_MOVE_INTERVAL = 10000;

// v11.2 / v11.9: Bonus moves — persistent move savings across games.
// v11.9 bumped cap 25 → 99 (match campaign v1.25) and warn threshold 20 → 90.
const BONUS_MOVES_CAP  = 99; // hard cap on stored moves
const BONUS_MOVES_WARN = 90; // counter turns amber at/above this; red at cap

// v11.9: localStorage keys for run tracking (consecutive won rounds + all-time best)
const RUN_CURRENT_KEY = 'match3_currentRun';
const RUN_LONGEST_KEY = 'match3_longestRun';

// v11.7: Special-formation thresholds (connected-match size → special type).
// Extracted to constants for future tuning (reward-mode sandbox, per-level
// progression). Default values unchanged. To make supernovas / hypernovas
// more common for testing, lower these (e.g., 5 / 6).
const SUPERNOVA_MIN_TILES = 6;
const HYPERNOVA_MIN_TILES = 7;

// v11.7: Hypernova event pacing — applied only when the combo involves a hypernova
const HYPERNOVA_MIN_TILES_CLEARED   = 30;   // min tiles cleared per hypernova event (sparse-board floor)
const HYPERNOVA_CASCADE_SLOWDOWN    = 1.2;  // multiplier on cascade stagger during hypernova events (400ms → 480ms)
const HYPERNOVA_MATCH_TRANSITION_MS = 500;  // match-to-clear delay on hypernova events (was 400)
// Note: two-phase clear (split footprint vs half-of-rest visually) deferred —
// the cascade slowdown + match-transition bump should already give noticeably
// more visual weight. Revisit after playtest.

// v11.8: Playback controls — admin-only. playbackSpeedRef multiplier
// divides pipeline delays. Score popup durations scale similarly so they
// stay visible in slow mode. Default 1× (normal). Speeds are the actual
// DIVIDERS applied to ms, so higher value = slower playback.
const PLAYBACK_SPEEDS = [1, 2, 5]; // 1× normal, 2× slow, 5× slow
const HISTORY_TILE_HIGHLIGHT_MS = 1500; // flash duration when a history row is clicked

// Animation Constants
const ANIMATION_SPEED = 0.25; // Higher = faster (0-1)
// v10.2: Removed DROP_SPEED and MATCH_FADE_SPEED — these were declared but never read;
//        actual drop timing is controlled by setTimeout delays in applyGravity/fillEmptySpaces.

// v9.5: Performance Constants
const MAX_DPR = 2; // Cap device pixel ratio to reduce render load on high-DPI tablets

// v9.7.1-tablet: Simple frame skip (more reliable than timestamps on tablet)
const FRAME_SKIP = 2; // Render every Nth frame (2 = 30fps, 3 = 20fps)

// Tile Colors and Drawing Functions
const TILE_COLORS = [
  { name: 'hypocycloid', primary: '#E53935', light: '#FFCDD2', dark: '#B71C1C', accent: '#FF5252' },
  { name: 'diamond', primary: '#304FFE', light: '#90CAF9', dark: '#0D47A1', accent: '#42A5F5' },
  { name: 'clover', primary: '#00C853', light: '#81C784', dark: '#2E7D32', accent: '#66BB6A' },
  { name: 'star', primary: '#FFD700', light: '#FFF9C4', dark: '#FF8F00', accent: '#FFD54F' },
  { name: 'candy', primary: '#AA00FF', light: '#E1BEE7', dark: '#6A1B9A', accent: '#AB47BC' },
  { name: 'sun', primary: '#FF6D00', light: '#FFCC80', dark: '#BF360C', accent: '#FFB74D' }
];

// Canvas Tile Drawing Functions
const drawTile = (ctx, x, y, size, tileType, options = {}) => {
  const { isSelected, isMatched, isSpecial, isPending, opacity = 1, scale = 1 } = options;
  const color = TILE_COLORS[tileType];
  
  ctx.save();
  ctx.globalAlpha = opacity;
  
  // Center and scale
  const centerX = x + size / 2;
  const centerY = y + size / 2;
  ctx.translate(centerX, centerY);
  ctx.scale(scale, scale);
  ctx.translate(-centerX, -centerY);
  
  // Draw shape based on type
  switch (tileType) {
    case 0: drawHypocycloid(ctx, x, y, size, color); break;
    case 1: drawDiamond(ctx, x, y, size, color); break;
    case 2: drawClover(ctx, x, y, size, color); break;
    case 3: drawStar(ctx, x, y, size, color); break;
    case 4: drawCandy(ctx, x, y, size, color); break;
    case 5: drawSun(ctx, x, y, size, color); break;
  }
  
  // Selection/special effects
  if (isSelected) {
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 3;
    ctx.strokeRect(x + 2, y + 2, size - 4, size - 4);
    ctx.shadowColor = 'rgba(255,255,255,0.9)';
    ctx.shadowBlur = 15;
  }
  
  if (isPending) {
    ctx.strokeStyle = '#00ffff';
    ctx.lineWidth = 3;
    ctx.strokeRect(x + 2, y + 2, size - 4, size - 4);
  }
  
  if (isSpecial) {
    ctx.strokeStyle = 'gold';
    ctx.lineWidth = 3;
    ctx.strokeRect(x + 2, y + 2, size - 4, size - 4);
  }
  
  ctx.restore();
};

// Hypocycloid (Red) - 4-pointed star shape
const drawHypocycloid = (ctx, x, y, size, color) => {
  const cx = x + size / 2;
  const cy = y + size / 2;
  const r = size * 0.45;
  
  // Create gradient
  const gradient = ctx.createRadialGradient(cx - r * 0.3, cy - r * 0.3, 0, cx, cy, r);
  gradient.addColorStop(0, color.light);
  gradient.addColorStop(0.3, color.accent);
  gradient.addColorStop(0.7, color.primary);
  gradient.addColorStop(1, color.dark);
  
  ctx.beginPath();
  // 4-pointed astroid shape
  ctx.moveTo(cx, cy - r);
  ctx.quadraticCurveTo(cx + r * 0.2, cy - r * 0.2, cx + r, cy);
  ctx.quadraticCurveTo(cx + r * 0.2, cy + r * 0.2, cx, cy + r);
  ctx.quadraticCurveTo(cx - r * 0.2, cy + r * 0.2, cx - r, cy);
  ctx.quadraticCurveTo(cx - r * 0.2, cy - r * 0.2, cx, cy - r);
  ctx.closePath();
  
  ctx.fillStyle = gradient;
  ctx.fill();
  ctx.strokeStyle = color.dark;
  ctx.lineWidth = 1;
  ctx.stroke();
  
  // Highlight
  ctx.beginPath();
  ctx.ellipse(cx - r * 0.25, cy - r * 0.25, r * 0.2, r * 0.15, -0.5, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255,255,255,0.4)';
  ctx.fill();
};

// Diamond (Blue) - Bejeweled style gem
// Blue Jewel - Faceted cut gem (from board-preview-v7)
const drawDiamond = (ctx, x, y, size, color) => {
  const scale = size / 40; // Board SVG uses 40x40 viewBox
  
  // Gradient for main body (crown)
  const gradient1 = ctx.createLinearGradient(x, y, x + size, y + size);
  gradient1.addColorStop(0, '#42A5F5');
  gradient1.addColorStop(0.4, '#1E88E5');
  gradient1.addColorStop(1, '#0D47A1');
  
  // Gradient for pavilion (bottom)
  const gradient2 = ctx.createLinearGradient(x, y + size * 0.5, x, y + size);
  gradient2.addColorStop(0, '#64B5F6');
  gradient2.addColorStop(1, '#1565C0');
  
  // Crown (top trapezoid): points="8,12 32,12 38,20 2,20"
  ctx.beginPath();
  ctx.moveTo(x + 8 * scale, y + 12 * scale);
  ctx.lineTo(x + 32 * scale, y + 12 * scale);
  ctx.lineTo(x + 38 * scale, y + 20 * scale);
  ctx.lineTo(x + 2 * scale, y + 20 * scale);
  ctx.closePath();
  ctx.fillStyle = gradient1;
  ctx.fill();
  
  // Table facet (top cap): points="12,12 28,12 26,8 14,8"
  ctx.beginPath();
  ctx.moveTo(x + 12 * scale, y + 12 * scale);
  ctx.lineTo(x + 28 * scale, y + 12 * scale);
  ctx.lineTo(x + 26 * scale, y + 8 * scale);
  ctx.lineTo(x + 14 * scale, y + 8 * scale);
  ctx.closePath();
  ctx.fillStyle = '#90CAF9';
  ctx.fill();
  
  // Pavilion (bottom triangle): points="2,20 38,20 20,38"
  ctx.beginPath();
  ctx.moveTo(x + 2 * scale, y + 20 * scale);
  ctx.lineTo(x + 38 * scale, y + 20 * scale);
  ctx.lineTo(x + 20 * scale, y + 38 * scale);
  ctx.closePath();
  ctx.fillStyle = gradient2;
  ctx.fill();
  
  // Highlight: points="14,10 20,10 18,14 14,14"
  ctx.beginPath();
  ctx.moveTo(x + 14 * scale, y + 10 * scale);
  ctx.lineTo(x + 20 * scale, y + 10 * scale);
  ctx.lineTo(x + 18 * scale, y + 14 * scale);
  ctx.lineTo(x + 14 * scale, y + 14 * scale);
  ctx.closePath();
  ctx.fillStyle = 'rgba(255,255,255,0.4)';
  ctx.fill();
};

// Green Clover - 3 heart leaves (from board-preview-v7)
const drawClover = (ctx, x, y, size, color) => {
  const scale = size / 40; // Board SVG uses 40x40 viewBox
  
  // Gradient for leaves
  const gradient = ctx.createRadialGradient(
    x + 14 * scale, y + 14 * scale, 0,
    x + 20 * scale, y + 20 * scale, 26 * scale
  );
  gradient.addColorStop(0, '#81C784');
  gradient.addColorStop(0.4, '#4CAF50');
  gradient.addColorStop(1, '#2E7D32');
  
  ctx.fillStyle = gradient;
  
  // Top heart leaf
  ctx.beginPath();
  ctx.moveTo(x + 20 * scale, y + 5 * scale);
  ctx.bezierCurveTo(
    x + 18 * scale, y + 3 * scale,
    x + 15 * scale, y + 3 * scale,
    x + 13 * scale, y + 5 * scale
  );
  ctx.bezierCurveTo(
    x + 11 * scale, y + 7 * scale,
    x + 11 * scale, y + 10 * scale,
    x + 13 * scale, y + 13 * scale
  );
  ctx.lineTo(x + 20 * scale, y + 20 * scale);
  ctx.lineTo(x + 27 * scale, y + 13 * scale);
  ctx.bezierCurveTo(
    x + 29 * scale, y + 10 * scale,
    x + 29 * scale, y + 7 * scale,
    x + 27 * scale, y + 5 * scale
  );
  ctx.bezierCurveTo(
    x + 25 * scale, y + 3 * scale,
    x + 22 * scale, y + 3 * scale,
    x + 20 * scale, y + 5 * scale
  );
  ctx.closePath();
  ctx.fill();
  
  // Left heart leaf
  ctx.beginPath();
  ctx.moveTo(x + 5 * scale, y + 20 * scale);
  ctx.bezierCurveTo(
    x + 3 * scale, y + 18 * scale,
    x + 3 * scale, y + 15 * scale,
    x + 5 * scale, y + 13 * scale
  );
  ctx.bezierCurveTo(
    x + 7 * scale, y + 11 * scale,
    x + 10 * scale, y + 11 * scale,
    x + 13 * scale, y + 13 * scale
  );
  ctx.lineTo(x + 20 * scale, y + 20 * scale);
  ctx.lineTo(x + 13 * scale, y + 27 * scale);
  ctx.bezierCurveTo(
    x + 10 * scale, y + 29 * scale,
    x + 7 * scale, y + 29 * scale,
    x + 5 * scale, y + 27 * scale
  );
  ctx.bezierCurveTo(
    x + 3 * scale, y + 25 * scale,
    x + 3 * scale, y + 22 * scale,
    x + 5 * scale, y + 20 * scale
  );
  ctx.closePath();
  ctx.fill();
  
  // Right heart leaf
  ctx.beginPath();
  ctx.moveTo(x + 35 * scale, y + 20 * scale);
  ctx.bezierCurveTo(
    x + 37 * scale, y + 18 * scale,
    x + 37 * scale, y + 15 * scale,
    x + 35 * scale, y + 13 * scale
  );
  ctx.bezierCurveTo(
    x + 33 * scale, y + 11 * scale,
    x + 30 * scale, y + 11 * scale,
    x + 27 * scale, y + 13 * scale
  );
  ctx.lineTo(x + 20 * scale, y + 20 * scale);
  ctx.lineTo(x + 27 * scale, y + 27 * scale);
  ctx.bezierCurveTo(
    x + 30 * scale, y + 29 * scale,
    x + 33 * scale, y + 29 * scale,
    x + 35 * scale, y + 27 * scale
  );
  ctx.bezierCurveTo(
    x + 37 * scale, y + 25 * scale,
    x + 37 * scale, y + 22 * scale,
    x + 35 * scale, y + 20 * scale
  );
  ctx.closePath();
  ctx.fill();
  
  // Stem
  ctx.beginPath();
  ctx.moveTo(x + 20 * scale, y + 20 * scale);
  ctx.lineTo(x + 20 * scale, y + 32 * scale);
  ctx.strokeStyle = '#2E7D32';
  ctx.lineWidth = 3 * scale;
  ctx.lineCap = 'round';
  ctx.stroke();
  
  // Highlight on top leaf
  ctx.beginPath();
  ctx.ellipse(x + 17 * scale, y + 9 * scale, 2 * scale, 1.5 * scale, -0.3, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255,255,255,0.4)';
  ctx.fill();
};

// Star (Gold) - 5-pointed star
const drawStar = (ctx, x, y, size, color) => {
  const cx = x + size / 2;
  const cy = y + size / 2;
  const outerR = size * 0.45;
  const innerR = size * 0.2;
  
  // Gradient
  const gradient = ctx.createLinearGradient(x, y, x + size, y + size);
  gradient.addColorStop(0, color.light);
  gradient.addColorStop(0.3, color.accent);
  gradient.addColorStop(0.7, color.primary);
  gradient.addColorStop(1, color.dark);
  
  ctx.beginPath();
  for (let i = 0; i < 5; i++) {
    const outerAngle = (i * 72 - 90) * Math.PI / 180;
    const innerAngle = ((i * 72) + 36 - 90) * Math.PI / 180;
    
    if (i === 0) {
      ctx.moveTo(cx + outerR * Math.cos(outerAngle), cy + outerR * Math.sin(outerAngle));
    } else {
      ctx.lineTo(cx + outerR * Math.cos(outerAngle), cy + outerR * Math.sin(outerAngle));
    }
    ctx.lineTo(cx + innerR * Math.cos(innerAngle), cy + innerR * Math.sin(innerAngle));
  }
  ctx.closePath();
  
  ctx.fillStyle = gradient;
  ctx.fill();
  ctx.strokeStyle = '#E65100';
  ctx.lineWidth = 1;
  ctx.stroke();
  
  // Inner highlight star
  ctx.beginPath();
  const highlightR = outerR * 0.5;
  const highlightInnerR = innerR * 0.6;
  for (let i = 0; i < 5; i++) {
    const outerAngle = (i * 72 - 90) * Math.PI / 180;
    const innerAngle = ((i * 72) + 36 - 90) * Math.PI / 180;
    if (i === 0) {
      ctx.moveTo(cx + highlightR * Math.cos(outerAngle), cy + highlightR * Math.sin(outerAngle));
    } else {
      ctx.lineTo(cx + highlightR * Math.cos(outerAngle), cy + highlightR * Math.sin(outerAngle));
    }
    ctx.lineTo(cx + highlightInnerR * Math.cos(innerAngle), cy + highlightInnerR * Math.sin(innerAngle));
  }
  ctx.closePath();
  ctx.fillStyle = 'rgba(255,255,255,0.4)';
  ctx.fill();
};

// Candy (Purple) - Jelly bean shape
const drawCandy = (ctx, x, y, size, color) => {
  const cx = x + size / 2;
  const cy = y + size / 2;
  const rx = size * 0.4;
  const ry = size * 0.3;
  
  // Gradient
  const gradient = ctx.createRadialGradient(cx - rx * 0.3, cy - ry * 0.3, 0, cx, cy, rx * 1.2);
  gradient.addColorStop(0, color.light);
  gradient.addColorStop(0.4, color.accent);
  gradient.addColorStop(1, color.dark);
  
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
  ctx.fillStyle = gradient;
  ctx.fill();
  ctx.strokeStyle = color.dark;
  ctx.lineWidth = 1;
  ctx.stroke();
  
  // Highlight
  ctx.beginPath();
  ctx.ellipse(cx - rx * 0.35, cy - ry * 0.3, rx * 0.35, ry * 0.3, -0.2, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255,255,255,0.45)';
  ctx.fill();
  
  // Shadow
  ctx.beginPath();
  ctx.ellipse(cx + rx * 0.25, cy + ry * 0.25, rx * 0.25, ry * 0.15, 0.2, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(0,0,0,0.15)';
  ctx.fill();
};

// Sun (Orange) - R1 Teardrop Warm Orange Sunflower
const drawSun = (ctx, x, y, size, color) => {
  const cx = x + size / 2;
  const cy = y + size / 2;
  const coreR = size * 0.22;
  
  // Center gradient (warm orange)
  const centerGradient = ctx.createRadialGradient(cx - coreR * 0.3, cy - coreR * 0.3, 0, cx, cy, coreR * 1.1);
  centerGradient.addColorStop(0, '#FFCC80');
  centerGradient.addColorStop(0.5, '#FF9800');
  centerGradient.addColorStop(1, '#E65100');
  
  // Petal gradient (warm orange)
  const petalGradient = ctx.createLinearGradient(cx, cy - size * 0.45, cx, cy);
  petalGradient.addColorStop(0, '#FFB74D');
  petalGradient.addColorStop(0.5, '#FF9800');
  petalGradient.addColorStop(1, '#BF360C');
  
  // Draw 12 teardrop petals
  ctx.fillStyle = petalGradient;
  for (let i = 0; i < 12; i++) {
    const angle = (i * 30) * Math.PI / 180;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(angle);
    ctx.beginPath();
    // Teardrop shape: pointed at top, rounded at bottom
    ctx.moveTo(0, -size * 0.44); // Top point
    ctx.quadraticCurveTo(size * 0.1, -size * 0.32, size * 0.06, -size * 0.24); // Right curve
    ctx.quadraticCurveTo(0, -size * 0.18, -size * 0.06, -size * 0.24); // Bottom curve
    ctx.quadraticCurveTo(-size * 0.1, -size * 0.32, 0, -size * 0.44); // Left curve back to top
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
  
  // Center circle
  ctx.beginPath();
  ctx.arc(cx, cy, coreR, 0, Math.PI * 2);
  ctx.fillStyle = centerGradient;
  ctx.fill();
  ctx.strokeStyle = '#BF360C';
  ctx.lineWidth = 0.5;
  ctx.stroke();
  
  // Highlight on center
  ctx.beginPath();
  ctx.ellipse(cx - coreR * 0.3, cy - coreR * 0.25, coreR * 0.35, coreR * 0.25, -0.3, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255,255,255,0.45)';
  ctx.fill();
};

// Draw special tile icon
// v7.3: Line/Cross in corner (21px), Bomb/Supernova/Hypernova centered (14px)
// v9.6-tablet: Canvas-drawn special icons (replaces emoji for tablet compatibility)
const drawSpecialIcon = (ctx, x, y, size, specialType) => {
  ctx.save();
  
  // Position: corner for line/cross, center for others
  const isCorner = specialType === 'line' || specialType === 'cross';
  const iconSize = isCorner ? 16 : 20;
  const cx = isCorner ? x + size - 12 : x + size / 2;
  const cy = isCorner ? y + size - 12 : y + size / 2;
  
  // Draw dark background circle for visibility
  ctx.beginPath();
  ctx.arc(cx, cy, iconSize / 2 + 2, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
  ctx.fill();
  
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  
  switch (specialType) {
    case 'line':
      // Lightning bolt - yellow zigzag
      ctx.strokeStyle = '#FFD700';
      ctx.fillStyle = '#FFD700';
      ctx.beginPath();
      ctx.moveTo(cx - 3, cy - 6);
      ctx.lineTo(cx + 1, cy - 1);
      ctx.lineTo(cx - 1, cy - 1);
      ctx.lineTo(cx + 3, cy + 6);
      ctx.lineTo(cx - 1, cy + 1);
      ctx.lineTo(cx + 1, cy + 1);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      break;
      
    case 'bomb':
      // Bomb - black circle with orange fuse spark
      ctx.fillStyle = '#333';
      ctx.beginPath();
      ctx.arc(cx, cy + 2, 6, 0, Math.PI * 2);
      ctx.fill();
      // Fuse
      ctx.strokeStyle = '#8B4513';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(cx + 3, cy - 3);
      ctx.quadraticCurveTo(cx + 6, cy - 6, cx + 4, cy - 7);
      ctx.stroke();
      // Spark
      ctx.fillStyle = '#FF6600';
      ctx.beginPath();
      ctx.arc(cx + 4, cy - 7, 2, 0, Math.PI * 2);
      ctx.fill();
      break;
      
    case 'cross':
      // 4-pointed sparkle - cyan/white
      ctx.strokeStyle = '#00FFFF';
      ctx.fillStyle = '#00FFFF';
      ctx.lineWidth = 2;
      // Vertical line
      ctx.beginPath();
      ctx.moveTo(cx, cy - 6);
      ctx.lineTo(cx, cy + 6);
      ctx.stroke();
      // Horizontal line
      ctx.beginPath();
      ctx.moveTo(cx - 6, cy);
      ctx.lineTo(cx + 6, cy);
      ctx.stroke();
      // Center dot
      ctx.beginPath();
      ctx.arc(cx, cy, 2, 0, Math.PI * 2);
      ctx.fill();
      break;
      
    case 'supernova':
      // Spiral starburst - purple/magenta
      ctx.strokeStyle = '#FF00FF';
      ctx.fillStyle = '#FF00FF';
      ctx.lineWidth = 2;
      // Draw 6-pointed star
      for (let i = 0; i < 6; i++) {
        const angle = (i * 60 - 90) * Math.PI / 180;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + Math.cos(angle) * 8, cy + Math.sin(angle) * 8);
        ctx.stroke();
      }
      // Center glow
      ctx.beginPath();
      ctx.arc(cx, cy, 3, 0, Math.PI * 2);
      ctx.fill();
      break;
      
    case 'hypernova':
      // v9.8: Exploding star - radiating lines + particles
      ctx.strokeStyle = '#FFD700';
      ctx.fillStyle = '#FFD700';
      ctx.lineWidth = 2;
      // Radiating lines (8 directions)
      for (let i = 0; i < 8; i++) {
        const angle = (i * 45) * Math.PI / 180;
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(angle) * 2, cy + Math.sin(angle) * 2);
        ctx.lineTo(cx + Math.cos(angle) * 7, cy + Math.sin(angle) * 7);
        ctx.stroke();
      }
      // Center bright circle
      ctx.beginPath();
      ctx.arc(cx, cy, 3, 0, Math.PI * 2);
      ctx.fillStyle = '#FFFFFF';
      ctx.fill();
      // Outer particles (4 dots)
      ctx.fillStyle = '#FFD700';
      ctx.beginPath();
      ctx.arc(cx + 6, cy - 6, 1.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(cx - 6, cy + 5, 1.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(cx + 5, cy + 6, 1.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(cx - 7, cy - 4, 1.5, 0, Math.PI * 2);
      ctx.fill();
      break;
  }
  
  ctx.restore();
};

// =============================================================================
// GAME LOGIC (preserved from v5.0)
// =============================================================================

const initializeGrid = () => {
  const grid = [];
  for (let row = 0; row < ROWS; row++) {
    grid[row] = [];
    for (let col = 0; col < COLS; col++) {
      let type;
      let attempts = 0;
      do {
        type = Math.floor(Math.random() * TILE_TYPES);
        attempts++;
        if (attempts > 50) break;
      } while (
        (col >= 2 && grid[row][col - 1]?.type === type && grid[row][col - 2]?.type === type) ||
        (row >= 2 && grid[row - 1]?.[col]?.type === type && grid[row - 2]?.[col]?.type === type)
      );
      
      grid[row][col] = {
        type,
        id: `${row}-${col}-${Date.now()}-${Math.random()}`,
        special: null,
        isNew: false,
        // Animation properties
        animX: col * (TILE_SIZE + TILE_GAP),
        animY: row * (TILE_SIZE + TILE_GAP),
        targetX: col * (TILE_SIZE + TILE_GAP),
        targetY: row * (TILE_SIZE + TILE_GAP),
        opacity: 1,
        scale: 1
      };
    }
  }
  return grid;
};

const hasValidMoves = (grid) => {
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      if (col < COLS - 1) {
        const testGrid = grid.map(r => r.map(t => t ? { ...t } : null));
        [testGrid[row][col], testGrid[row][col + 1]] = [testGrid[row][col + 1], testGrid[row][col]];
        if (findMatchesSimple(testGrid).length > 0) return true;
      }
      if (row < ROWS - 1) {
        const testGrid = grid.map(r => r.map(t => t ? { ...t } : null));
        [testGrid[row][col], testGrid[row + 1][col]] = [testGrid[row + 1][col], testGrid[row][col]];
        if (findMatchesSimple(testGrid).length > 0) return true;
      }
    }
  }
  return false;
};

const findMatchesSimple = (grid) => {
  const matches = [];
  
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS - 2; col++) {
      if (grid[row][col] && grid[row][col + 1] && grid[row][col + 2] &&
          grid[row][col].type === grid[row][col + 1].type &&
          grid[row][col].type === grid[row][col + 2].type) {
        matches.push({ row, col });
      }
    }
  }
  
  for (let row = 0; row < ROWS - 2; row++) {
    for (let col = 0; col < COLS; col++) {
      if (grid[row][col] && grid[row + 1][col] && grid[row + 2][col] &&
          grid[row][col].type === grid[row + 1][col].type &&
          grid[row][col].type === grid[row + 2][col].type) {
        matches.push({ row, col });
      }
    }
  }
  
  return matches;
};

const calculateUnusedSpecialsBonus = (grid) => {
  let bonus = 0;
  const specials = { line: 0, bomb: 0, cross: 0, supernova: 0, hypernova: 0 };
  
  grid.forEach(row => {
    row.forEach(tile => {
      if (tile?.special) {
        specials[tile.special]++;
        switch (tile.special) {
          case 'line': bonus += 100; break;
          case 'bomb': bonus += 150; break;
          case 'cross': bonus += 200; break;
          case 'supernova': bonus += 300; break;
          case 'hypernova': bonus += 500; break;
        }
      }
    });
  });
  
  return { bonus, specials };
};

// =============================================================================
// v11.8: SCORING HISTORY PANEL — admin-only, left-side overlay
// =============================================================================
// Displays game-wide scoring history with collapsible turn sections and
// per-event breakdown. Click any event row to flash the relevant tiles
// on the board (via the onHighlightTiles callback, which reuses the
// existing flashingTiles state).
// =============================================================================
const ScoringHistoryPanel = ({ history, expandedTurns, setExpandedTurns, onClose, onHighlightTiles }) => {
  const gameTotal = history.reduce((sum, t) => sum + t.totalPoints, 0);
  const [collapsed, setCollapsed] = useState(false);

  const toggleTurn = (turnNumber) => {
    setExpandedTurns(prev => {
      const next = new Set(prev);
      if (next.has(turnNumber)) next.delete(turnNumber);
      else next.add(turnNumber);
      return next;
    });
  };

  if (collapsed) {
    return (
      <div style={{
        position: 'fixed', top: '20px', left: 0, zIndex: 2000,
        background: 'rgba(0,0,0,0.85)', color: 'white',
        padding: '10px 12px', borderRadius: '0 8px 8px 0',
        cursor: 'pointer', fontFamily: 'monospace', fontSize: '12px',
        boxShadow: '2px 2px 10px rgba(0,0,0,0.5)',
      }} onClick={() => setCollapsed(false)} title="Open scoring history">
        📊 {gameTotal.toLocaleString()}
      </div>
    );
  }

  const S = {
    panel: {
      position: 'fixed', top: '20px', left: '20px', bottom: '20px',
      width: '320px', background: 'rgba(15,15,20,0.95)',
      color: '#e0e0e0', fontFamily: 'monospace',
      borderRadius: '10px', padding: '12px 14px',
      boxShadow: '4px 4px 20px rgba(0,0,0,0.5)',
      zIndex: 2000, display: 'flex', flexDirection: 'column',
      border: '1px solid #2e2e2e',
    },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', paddingBottom: '8px', borderBottom: '1px solid #2e2e2e' },
    title: { fontSize: '14px', fontWeight: 'bold', color: '#fff' },
    subtitle: { fontSize: '11px', color: '#ccc', fontWeight: 500, letterSpacing: '1px', textTransform: 'uppercase' },
    btn: { background: '#2a2a2a', color: '#ccc', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', padding: '4px 8px', fontFamily: 'monospace' },
    body: { flex: 1, overflowY: 'auto', paddingRight: '4px' },
    turnRow: { padding: '6px 4px', borderBottom: '1px solid #222', cursor: 'pointer', fontSize: '12px' },
    turnHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    turnLabel: { color: '#90caf9', fontWeight: 'bold' },
    turnTotal: { color: '#fff', fontWeight: 'bold' },
    eventRow: { padding: '3px 8px 3px 14px', fontSize: '12px', cursor: 'pointer', color: '#ccc', borderLeft: '2px solid #333', marginLeft: '4px' },
    eventRowHover: { background: '#2a2a2a' },
    eventDesc: { display: 'block', color: '#ccc' },
    eventMeta: { display: 'block', color: '#ccc', fontSize: '11px' },
    footer: { marginTop: '8px', paddingTop: '8px', borderTop: '1px solid #2e2e2e', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    gameTotal: { fontSize: '14px', fontWeight: 'bold', color: '#4fc3f7' },
  };

  return (
    <div style={S.panel}>
      <div style={S.header}>
        <div>
          <div style={S.subtitle}>Scoring history</div>
          <div style={S.title}>Game</div>
        </div>
        <div style={{ display: 'flex', gap: '4px' }}>
          <button style={S.btn} onClick={() => setCollapsed(true)} title="Collapse to badge">‹</button>
          <button style={S.btn} onClick={onClose} title="Close">×</button>
        </div>
      </div>

      <div style={S.body}>
        {history.length === 0 && (
          <div style={{ color: '#ccc', fontSize: '12px', textAlign: 'center', padding: '30px 10px' }}>
            No scoring events yet — make a move!
          </div>
        )}
        {[...history].reverse().map(turn => {
          const isExpanded = expandedTurns.has(turn.turnNumber);
          return (
            <div key={turn.turnNumber}>
              <div
                style={{ ...S.turnRow, ...S.turnHeader }}
                onClick={() => toggleTurn(turn.turnNumber)}
              >
                <span>
                  <span style={S.turnLabel}>{isExpanded ? '▼' : '▶'} Turn {turn.turnNumber}</span>
                  <span style={{ color: '#ccc', marginLeft: '6px' }}>({turn.events.length} events)</span>
                </span>
                <span style={S.turnTotal}>+{turn.totalPoints.toLocaleString()}</span>
              </div>
              {isExpanded && turn.events.map((event, idx) => (
                <div
                  key={idx}
                  style={S.eventRow}
                  onClick={() => onHighlightTiles(event.tiles)}
                  title="Click to flash these tiles"
                  onMouseEnter={e => e.currentTarget.style.background = '#2a2a2a'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <span style={S.eventDesc}>{event.description} — <span style={{ color: '#ffd54f' }}>+{event.points}</span></span>
                  <span style={S.eventMeta}>
                    base {event.baseScore ?? '?'}
                    {event.multiplier !== 1 && ` × ${event.multiplier.toFixed(2)}`}
                    {event.cascadeDepth > 0 && ` · depth ${event.cascadeDepth}`}
                  </span>
                </div>
              ))}
            </div>
          );
        })}
      </div>

      <div style={S.footer}>
        <span style={S.subtitle}>Game total</span>
        <span style={S.gameTotal}>{gameTotal.toLocaleString()}</span>
      </div>
    </div>
  );
};

// =============================================================================
// v11.8: TABLET ADMIN WRAPPER — adds Playback section on top of AdminPanel
// =============================================================================
const TabletAdminWrapper = ({
  onClose,
  showHistoryPanel, setShowHistoryPanel,
  playbackSpeed, setPlaybackSpeed,
  onClearHistory,
  constants,
}) => {
  const [showGameStats, setShowGameStats] = useState(false);

  const S = {
    overlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(10,10,10,0.93)', zIndex: 9998, overflowY: 'auto', fontFamily: 'monospace', color: '#e0e0e0', padding: '20px', boxSizing: 'border-box' },
    card: { background: '#1a1a1a', border: '1px solid #2e2e2e', borderRadius: '8px', padding: '14px 16px', marginBottom: '12px' },
    label: { color: '#ccc', fontSize: '11px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '10px', display: 'block' },
    row: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 0', fontSize: '13px' },
    btn: { padding: '8px 16px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '12px', fontFamily: 'monospace', fontWeight: 'bold' },
    speedBtn: (active) => ({ padding: '6px 14px', borderRadius: '6px', border: active ? '2px solid #4fc3f7' : '1px solid #333', background: active ? '#0d1b3e' : '#1e1e1e', color: active ? '#4fc3f7' : '#ccc', cursor: 'pointer', fontSize: '12px', fontFamily: 'monospace', fontWeight: 'bold', marginRight: '6px' }),
  };

  return (
    <div style={S.overlay}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
        <div>
          <div style={{ fontSize: '17px', fontWeight: 'bold', color: '#fff', marginBottom: '2px' }}>
            🔧 ADMIN — Tablet
          </div>
          <div style={{ fontSize: '12px', color: '#ccc' }}>
            Access: <span style={{ color: '#ccc' }}>?admin=1</span> · long-press score · <span style={{ color: '#ccc' }}>?playback=1</span> → history on
          </div>
        </div>
        <button onClick={onClose} style={{ ...S.btn, background: '#2a2a2a', color: '#ccc', fontSize: '17px', lineHeight: 1, padding: '4px 11px' }}>×</button>
      </div>

      {/* Playback controls */}
      <div style={S.card}>
        <span style={S.label}>Playback</span>
        <div style={S.row}>
          <span style={{ color: '#ccc' }}>Scoring history panel</span>
          <button
            style={{ ...S.btn, background: showHistoryPanel ? '#1b3a1a' : '#2a2a2a', color: showHistoryPanel ? '#81c784' : '#ccc' }}
            onClick={() => setShowHistoryPanel(v => !v)}
          >
            {showHistoryPanel ? 'ON' : 'OFF'}
          </button>
        </div>
        <div style={{ ...S.row, flexWrap: 'wrap' }}>
          <span style={{ color: '#ccc' }}>Playback speed</span>
          <div>
            {PLAYBACK_SPEEDS.map(s => (
              <button key={s} style={S.speedBtn(playbackSpeed === s)} onClick={() => setPlaybackSpeed(s)}>
                {s}×{s === 1 ? ' normal' : ''}
              </button>
            ))}
          </div>
        </div>
        <div style={{ ...S.row, marginTop: '4px' }}>
          <span style={{ color: '#ccc', fontSize: '12px' }}>Clear accumulated history</span>
          <button
            style={{ ...S.btn, background: '#2a1a1a', color: '#e57373' }}
            onClick={onClearHistory}
          >
            Clear
          </button>
        </div>
      </div>

      {/* Launcher for existing game stats admin */}
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', paddingTop: '4px' }}>
        <button onClick={() => setShowGameStats(true)} style={{ ...S.btn, background: '#2a2a2a', color: '#ccc' }}>
          📊 Open game stats →
        </button>
        <button onClick={onClose} style={{ ...S.btn, background: '#0d1b3e', color: '#90caf9', marginLeft: 'auto' }}>
          Close ×
        </button>
      </div>

      {showGameStats && (
        <AdminPanel onClose={() => setShowGameStats(false)} constants={constants} />
      )}
    </div>
  );
};

// =============================================================================
// MAIN COMPONENT
// =============================================================================

// V-3a: Renamed from `Match3Verses` to `VersesGame`. Accepts a `slug`
// prop (from the outer wrapper) and derives the active game + level
// from the registry. `onBack` is invoked by the in-game header
// `← Back` button and the start-modal `Back` button to return to the
// picker (single-level games) or to the level-select screen
// (multi-level games — V-3b). The outer wrapper passes
// `key={slug}:${levelIndex}` so each pick AND each level transition
// triggers a fresh mount; per-level state (score, moves, target,
// revealedChunkIndex, etc.) auto-resets without manual orchestration.
//
// V-3b: bonus moves (`bonusMoves`) lifted to the wrapper so they
// survive level-to-level remounts. `VersesGame` receives the current
// value as a prop and reports changes via `onBonusMovesChange`
// (a setter compatible with React's useState dispatch — accepts
// either a value or an updater function).
const VersesGame = ({
  slug,
  levelIndex = 0,
  isMultiLevel = false,
  onBack,
  bonusMoves,
  onBonusMovesChange,
  completedLevels,
  fullCompleted = false,
  onLevelComplete,
  onBackToPicker,
  onBackToLevelSelect,
  onAdvanceLevel,
  onShowFullPassage,
  onRestartGame: onWrapperRestartGame,
}) => {
  // V-3a/V-3b: derive active game + flattened level from the slug
  // and levelIndex props. Memoized on slug + levelIndex; identity is
  // stable for the lifetime of this mount because the outer wrapper
  // keys on `${slug}:${levelIndex}`.
  const versesGame = useMemo(() => (slug ? versesGameRegistry[slug] || null : null), [slug]);
  const versesLevel = useMemo(() => versesFlattenLevel(versesGame, levelIndex), [versesGame, levelIndex]);

  // Game state
  const [grid, setGrid] = useState(initializeGrid);
  const [selectedTile, setSelectedTile] = useState(null);
  const [score, setScore] = useState(0);
  // V-2: In VERSES_MODE, moves come from the flattened active level
  // (chunks − 1 because chunk 0 is pre-visible). Arcade random is
  // preserved as the fallback in case VERSES_MODE is ever flipped off.
  // V-3a: read directly from `versesLevel` computed above (was the
  // module-level `versesActiveLevel` constant in v1.3).
  const [moves, setMoves] = useState(() => (
    VERSES_MODE && versesLevel
      ? versesLevel.moves
      : MIN_MOVES + Math.floor(Math.random() * (MAX_MOVES - MIN_MOVES + 1))
  ));
  const [gameState, setGameState] = useState('playing');
  const [isAnimating, setIsAnimating] = useState(false);
  // V-2: In VERSES_MODE, target comes from the level (explicit override
  // or moves × 300 formula default). Arcade random kept as fallback.
  // V-3a: same per-mount derivation as moves above.
  const [levelTarget, setLevelTarget] = useState(() => {
    if (VERSES_MODE && versesLevel) return versesLevel.target;
    const rawTarget = BASE_TARGET + Math.floor(Math.random() * TARGET_VARIANCE);
    return Math.round(rawTarget / 100) * 100;
  });
  const [difficultyBonus, setDifficultyBonus] = useState(0);
  const [highScore, setHighScore] = useState(() => {
    const stored = localStorage.getItem('match3_highScore');
    return stored ? parseInt(stored, 10) : 0;
  });
  const [combo, setCombo] = useState(0);
  const [lastCombo, setLastCombo] = useState(0);
  const [maxComboReached, setMaxComboReached] = useState(0);
  const [lastMilestoneShown, setLastMilestoneShown] = useState(0); // v8.9: Track combo milestones
  const [scorePopups, setScorePopups] = useState([]);
  const [showNoMoves, setShowNoMoves] = useState(false);
  const [pendingSpecials, setPendingSpecials] = useState([]);
  const [targetReached, setTargetReached] = useState(false);
  const [matchedTiles, setMatchedTiles] = useState([]);
  const dragStart = useRef(null); // v11 Fix 1: useRef so rapid touchmove events see cleared value synchronously
  const [turnComplete, setTurnComplete] = useState(true); // Track when turn scoring is fully settled
  // v10.5: Counter incremented each time a bonus move is awarded; used to key the header burst animation
  const [bonusMoveFlash, setBonusMoveFlash] = useState(0);

  // v11.2 / V-3a / V-3b: bonus moves.
  // V-3b: state lifted to the outer Match3Verses wrapper so it
  // survives level-to-level remounts within a multi-level game.
  // VersesGame receives `bonusMoves` as a prop and updates it via
  // `onBonusMovesChange`. In !VERSES_MODE (arcade fallback path),
  // the wrapper still hydrates from BONUS_MOVES_KEY at its useState init
  // and persists via its own effect, so arcade behavior is unchanged.
  // Local alias keeps the arcade-mode call sites readable while
  // making the contract clear (this is a prop callback, not a
  // useState dispatch — semantics are equivalent because the wrapper
  // passes its own setter through).
  const setBonusMoves = onBonusMovesChange;

  // v11.6: True after player chooses "Use bonus moves" — each swap draws from bonusMoves
  const [usingBonusMoves, setUsingBonusMoves] = useState(false);
  // v11.6: True when moves=0 and bonusMoves>0, shows the bonus moves decision prompt
  const [showBonusMovesPrompt, setShowBonusMovesPrompt] = useState(false);
  // v11.9: "Are you sure?" confirm when in-header End-and-carry clicked while below target
  const [showEndConfirm, setShowEndConfirm] = useState(false);

  // V-2: Verses / memorize-mode state.
  // revealedChunkIndex: highest-index chunk currently visible. 0 is
  // pre-visible at game start; increments to totalChunks-1 over the
  // course of play.
  const [revealedChunkIndex, setRevealedChunkIndex] = useState(0);
  // showTargetToast: one-shot "Target reached!" toast, auto-dismisses.
  const [showTargetToast, setShowTargetToast] = useState(false);
  // showPassageModal: end-of-round full-passage reveal modal.
  const [showPassageModal, setShowPassageModal] = useState(false);
  // v1.2: showStartModal — full-passage viewer shown at mount (and
  // re-shown on Play Again per user request). Memorization aid: the
  // player sees the whole target passage before the round begins.
  // Closes on "Begin game" click; game is effectively paused while
  // open (modal overlay's z-index blocks canvas clicks, and swap
  // handlers guard on it).
  const [showStartModal, setShowStartModal] = useState(true);
  // prevMovesRef: used to detect a moves-decrement (successful swap)
  // so the reveal pipeline only runs on real turns, not on mount /
  // restart / bonus-moves restore.
  const prevMovesRef = useRef(null);
  // V-3a: `versesGame` and `versesLevel` are now derived at component
  // top via `useMemo` from the `slug` prop (see top of VersesGame).
  // The v1.3 module-level aliases are gone.

  // v11.9: Run tracking — consecutive won rounds (current) + all-time best (longest).
  // Persisted in localStorage. Terminology intentional: "run" per user feedback.
  const [currentRun, setCurrentRun] = useState(
    () => parseInt(localStorage.getItem(RUN_CURRENT_KEY) || '0', 10)
  );
  const [longestRun, setLongestRun] = useState(
    () => parseInt(localStorage.getItem(RUN_LONGEST_KEY) || '0', 10)
  );

  // v11.2: Admin panel visibility (URL param or long-press gesture)
  const [showAdmin, setShowAdmin] = useState(() => new URLSearchParams(window.location.search).get('admin') === '1');

  // v11.8: Playback / scoring-history panel — admin-only.
  // Visibility can be pre-enabled via ?playback=1 URL param.
  // Playback speed stored in a ref so timing functions read the current value
  // without depending on React re-render; mirrored to state only for the UI
  // selector.
  const [showHistoryPanel, setShowHistoryPanel] = useState(
    () => new URLSearchParams(window.location.search).get('playback') === '1'
         || sessionStorage.getItem('m3_playback') === '1'
  );
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const playbackSpeedRef = useRef(1);
  // scoringHistory: array of { turnNumber, events: [...], totalPoints }
  // events: { type, description, points, multiplier, baseScore, tiles, cascadeDepth, timestamp }
  const [scoringHistory, setScoringHistory] = useState([]);
  const [expandedTurns, setExpandedTurns] = useState(new Set()); // which turn numbers show events
  const currentTurnEventsRef = useRef([]); // events accumulated during the active turn
  const currentTurnBaseScoreRef = useRef(0); // score at start of current turn
  const turnCounterRef = useRef(0);

  // v11.8: sync playback speed state → ref so pipeline timers pick up changes
  // without needing every function to close over the state variable.
  useEffect(() => { playbackSpeedRef.current = playbackSpeed; }, [playbackSpeed]);

  // v11.9: Run tracking — increment currentRun on 'won'; the reset-to-0 on
  // loss is deferred to restartGame so the end-game banner can still
  // display the run length that just broke. A ref guards against double-
  // firing if the effect re-runs with the same gameState.
  const lastEndedGameStateRef = useRef(null);
  useEffect(() => {
    if (gameState !== 'won' && gameState !== 'gameover') {
      lastEndedGameStateRef.current = null;
      return;
    }
    if (lastEndedGameStateRef.current === gameState) return;
    lastEndedGameStateRef.current = gameState;

    if (gameState === 'won') {
      setCurrentRun(prev => {
        const next = prev + 1;
        try { localStorage.setItem(RUN_CURRENT_KEY, String(next)); } catch {}
        setLongestRun(longest => {
          if (next > longest) {
            try { localStorage.setItem(RUN_LONGEST_KEY, String(next)); } catch {}
            return next;
          }
          return longest;
        });
        return next;
      });
    }
    // 'gameover' intentionally does nothing here — currentRun is preserved
    // so the end-game banner can show "Run broken at N wins". restartGame
    // resets it once the player starts a new game.
  }, [gameState]);

  // v11.8: persist history-panel toggle in sessionStorage so it survives
  // refresh within the same session (without cluttering permanent storage).
  useEffect(() => {
    try {
      if (showHistoryPanel) sessionStorage.setItem('m3_playback', '1');
      else sessionStorage.removeItem('m3_playback');
    } catch {}
  }, [showHistoryPanel]);

  // v11.8: pipeline timeout — divides the requested delay by the current
  // playback speed. Read from ref so speed changes apply on the next call
  // without any render coupling.
  const pipelineTimeout = useCallback((fn, ms) => {
    const divisor = playbackSpeedRef.current || 1;
    return setTimeout(fn, Math.round(ms / divisor));
  }, []);

  // v11.8: record a single scoring event into the current turn's buffer.
  // Called from all sites in the match/cascade pipeline where points are
  // awarded. Tile list is optional (used for history-row-click highlighting).
  const recordScoringEvent = useCallback(({ type, description, points, multiplier, baseScore, tiles, cascadeDepth }) => {
    currentTurnEventsRef.current.push({
      type,
      description,
      points,
      multiplier: multiplier ?? 1,
      baseScore: baseScore ?? null,
      tiles: tiles ?? [],
      cascadeDepth: cascadeDepth ?? 0,
      timestamp: Date.now(),
    });
  }, []);

  // v11.8: start a new turn — called at the start of each attempted swap.
  // Increments the turn counter and captures the current score as baseline.
  const startTurn = useCallback(() => {
    turnCounterRef.current += 1;
    currentTurnEventsRef.current = [];
    currentTurnBaseScoreRef.current = scoreRef.current;
  }, []);

  // v11.8: flush the current turn's events into scoringHistory. Called when
  // a turn fully settles (animations done, no pending cascades). If no
  // events were recorded, skip — avoids empty turns for invalid swaps.
  const flushTurn = useCallback(() => {
    const events = currentTurnEventsRef.current;
    if (events.length === 0) return;
    const turnNumber = turnCounterRef.current;
    const totalPoints = events.reduce((sum, e) => sum + e.points, 0);
    setScoringHistory(prev => [
      ...prev,
      { turnNumber, events: [...events], totalPoints, baseScoreBefore: currentTurnBaseScoreRef.current },
    ]);
    // Auto-expand the latest turn, auto-collapse the previous one
    setExpandedTurns(prev => {
      const next = new Set();
      next.add(turnNumber);
      return next;
    });
    currentTurnEventsRef.current = [];
  }, []);

  // v11.8: highlight tiles on the board (brief flash) when a history row
  // is clicked. Reuses flashingTiles state so the existing canvas render
  // already handles the visual.
  const handleHighlightTilesFromHistory = useCallback((tiles) => {
    if (!tiles || tiles.length === 0) return;
    const stamped = tiles.map(t => ({ ...t, id: Date.now() + Math.random() }));
    setFlashingTiles(prev => [...prev, ...stamped]);
    setTimeout(() => {
      const stampIds = new Set(stamped.map(s => s.id));
      setFlashingTiles(prev => prev.filter(t => !stampIds.has(t.id)));
    }, HISTORY_TILE_HIGHLIGHT_MS);
  }, []);

  // v11.8: clear all scoring history — called on restartGame.
  const clearScoringHistory = useCallback(() => {
    setScoringHistory([]);
    currentTurnEventsRef.current = [];
    turnCounterRef.current = 0;
    currentTurnBaseScoreRef.current = 0;
    setExpandedTurns(new Set());
  }, []);
  
  // v8.10: Victory Round state
  const [showVictoryPrompt, setShowVictoryPrompt] = useState(false);
  const [victoryRoundActive, setVictoryRoundActive] = useState(false);
  const [victoryRoundScore, setVictoryRoundScore] = useState(0); // Points earned in victory round (before multiplier)
  const [preVictoryScore, setPreVictoryScore] = useState(0); // Score when victory round started
  
  // v8.0: Dark/Light mode toggle (dark is default)
  const [isDarkMode, setIsDarkMode] = useState(true);
  
  // v8.3: Visual cascade effects (v8.5: removed screenShake)
  const [flashingTiles, setFlashingTiles] = useState([]); // Tiles with white flash effect
  const [glowingTiles, setGlowingTiles] = useState([]); // Tiles with border glow before activation
  const [chainTexts, setChainTexts] = useState([]); // "CHAIN!" text popups between specials
  
  // v9.6-tablet: Set-based lookups for O(1) tile state checks (instead of Array.some)
  const flashingTileSet = useMemo(() => new Set(flashingTiles.map(t => `${t.row}-${t.col}`)), [flashingTiles]);
  const glowingTileSet = useMemo(() => new Set(glowingTiles.map(t => `${t.row}-${t.col}`)), [glowingTiles]);
  const matchedTileSet = useMemo(() => new Set(matchedTiles.map(t => `${t.row}-${t.col}`)), [matchedTiles]);
  const pendingSpecialSet = useMemo(() => new Set(pendingSpecials.map(t => `${t.row}-${t.col}`)), [pendingSpecials]);
  
  // Persistent stats
  const [allTimeHighCombo, setAllTimeHighCombo] = useState(() => {
    const stored = localStorage.getItem('match3_highCombo');
    return stored ? parseInt(stored, 10) : 0;
  });
  const [allTimeHighTurnScore, setAllTimeHighTurnScore] = useState(() => {
    const stored = localStorage.getItem('match3_highTurnScore');
    return stored ? parseInt(stored, 10) : 0;
  });
  const [currentTurnScore, setCurrentTurnScore] = useState(0);
  const [specialBonusMultiplier, setSpecialBonusMultiplier] = useState(0);
  
  // Canvas ref
  const canvasRef = useRef(null);
  const animationFrameRef = useRef(null);
  const frameCountRef = useRef(0); // v9.7.1-tablet: Simple frame counter for 30fps
  // v10.2 Fix #3: Separate ref map for animation positions — avoids mutating React state objects
  // directly inside the rAF loop. Keyed by tile id.
  const animStateRef = useRef({});
  
  // v6.8: Ref to track latest score (avoids stale closure in game end check)
  const scoreRef = useRef(0);
  useEffect(() => { scoreRef.current = score; }, [score]);

  // v10.2 Fix #1: Ref to track live combo value (avoids stale closure in fillEmptySpaces cascade)
  const comboRef = useRef(0);
  useEffect(() => { comboRef.current = combo; }, [combo]);

  // v10.4: Track the highest 10k threshold already awarded so we don't double-award
  const bonusMoveThresholdRef = useRef(0);
  // v10.5.3: Holds burst count awarded while the bonus prompt banner is open,
  // so the animation fires after the banner is dismissed (not hidden behind it)
  const bonusMoveFlashPendingRef = useRef(0);
  const usingBonusMovesRef = useRef(false); // v11.6: ref mirror for attemptSwap callbacks
  const swapFiredRef = useRef(false); // v11 Fix 2: blocks phantom click after drag-swap
  const adminPressTimerRef = useRef(null); // v11.2: long-press timer for admin panel gesture
  
  // Board dimensions
  const boardWidth = COLS * TILE_SIZE + (COLS - 1) * TILE_GAP;
  const boardHeight = ROWS * TILE_SIZE + (ROWS - 1) * TILE_GAP;
  
  // Save stats to localStorage
  useEffect(() => {
    localStorage.setItem('match3_highCombo', allTimeHighCombo.toString());
  }, [allTimeHighCombo]);
  
  useEffect(() => {
    localStorage.setItem('match3_highTurnScore', allTimeHighTurnScore.toString());
  }, [allTimeHighTurnScore]);
  
  useEffect(() => {
    localStorage.setItem('match3_highScore', highScore.toString());
  }, [highScore]);

  // V-3b: bonus-moves persistence moved to the Match3Verses wrapper
  // along with the bonusMoves state itself. The wrapper handles the
  // VERSES_MODE / arcade-fallback split so this component doesn't
  // touch BONUS_MOVES_KEY directly.


  // Update all-time stats when turn ends
  useEffect(() => {
    if (!isAnimating && gameState === 'playing') {
      if (maxComboReached > allTimeHighCombo) {
        setAllTimeHighCombo(maxComboReached);
      }
      if (currentTurnScore > allTimeHighTurnScore) {
        setAllTimeHighTurnScore(currentTurnScore);
      }
    }
  }, [isAnimating, gameState, maxComboReached, currentTurnScore, allTimeHighCombo, allTimeHighTurnScore]);
  
  // Check win condition
  useEffect(() => {
    if (score >= levelTarget && gameState === 'playing' && !targetReached) {
      setTargetReached(true);
    }
  }, [score, levelTarget, gameState, targetReached]);

  // V-2: Target-hit toast — fires once when targetReached flips true in
  // VERSES_MODE. The persistent header state-change is driven by
  // targetReached itself (rendered gold + ✓ below). The toast auto-
  // dismisses after TARGET_TOAST_MS.
  // V-4: also flips victoryRoundActive so the existing scoring branch
  // applies the 1.5× multiplier to remaining-round scoring. No prompt
  // — silent activation per V-4 decision #4. The flag clears on level
  // transition naturally because the slug:levelIndex remount
  // throws away all per-level state.
  useEffect(() => {
    if (!VERSES_MODE) return;
    if (!targetReached) return;
    setShowTargetToast(true);
    setVictoryRoundActive(true);
    const t = setTimeout(() => setShowTargetToast(false), TARGET_TOAST_MS);
    return () => clearTimeout(t);
  }, [targetReached]);

  // V-2 (v1.2): Reveal-on-decrement. Successful swaps trigger
  // setMoves(prev => prev - 1) at the start of the swap pipeline
  // (before cascades animate). Watching `moves` here lets us fire
  // the reveal immediately — so the next chunk is visible and
  // waiting while the player watches the cascade play out, rather
  // than appearing after settle. `prevMovesRef` gates: null at
  // mount and after restart, so the initial 0 → 12 bump isn't
  // misread as a decrement. Non-match swaps don't decrement moves,
  // so they don't reveal. Cap at totalChunks - 1 (defensive —
  // shouldn't be reachable since moves = chunks - 1).
  //
  // v1.1 used a two-effect pipeline (pendingRevealRef armed here,
  // settle-wait effect fired the reveal with a 200ms beat). Dropped
  // for v1.2 after playtest showed the settle-wait felt late — the
  // player was scanning the cascade and the reveal trailed the eye.
  useEffect(() => {
    if (!VERSES_MODE || !versesLevel) return;
    if (prevMovesRef.current !== null && moves < prevMovesRef.current) {
      setRevealedChunkIndex(prev => {
        const next = prev + 1;
        const cap = versesLevel.totalChunks - 1;
        return next > cap ? cap : next;
      });
    }
    prevMovesRef.current = moves;
  }, [moves]);

  // V-2: End-of-round trigger. Once moves hits 0 and the final chunk
  // has been revealed, hold PASSAGE_HOLD_MS (so the player absorbs
  // the last chunk), then open the passage-reveal modal. Guarded on
  // !showPassageModal + gameState 'playing' so it fires once and
  // doesn't re-arm while the modal is already open.
  // V-3b: also notifies the wrapper of a win so completedLevels can
  // update. The notification fires inside the same setTimeout callback
  // that opens the modal, so it lands exactly once per round-end and
  // happens at modal-open time (matching the visible state change).
  useEffect(() => {
    if (!VERSES_MODE || !versesLevel) return;
    if (showPassageModal) return;
    if (gameState !== 'playing') return;
    if (moves > 0) return;
    if (revealedChunkIndex < versesLevel.totalChunks - 1) return;
    // Also wait for the board to be quiet — no in-flight cascade —
    // so the modal doesn't cover an active animation. (v1.2 dropped
    // the pendingRevealRef gate since reveals fire immediately on
    // decrement; by the time the board quiets, the reveal is long
    // committed.)
    if (isAnimating || combo > 0 || pendingSpecials.length > 0) return;
    const t = setTimeout(() => {
      setShowPassageModal(true);
      if (targetReached && onLevelComplete) {
        // V-4: pass score + target so the wrapper can compute stars
        // and update best-score with the no-regression rule.
        onLevelComplete(levelIndex, score, levelTarget);
      }
    }, PASSAGE_HOLD_MS);
    return () => clearTimeout(t);
  }, [moves, revealedChunkIndex, showPassageModal, gameState, isAnimating, combo, pendingSpecials.length, targetReached, onLevelComplete, levelIndex, score, levelTarget]);

  // v8.10: Game end logic - Modified for victory round
  // v9.8: Fixed to count unused specials toward target before deciding gameover
  // v11.3 ordering: This effect must run BEFORE the bonus-move effect (see below) so that
  // the bail-out check at line ~911 sees the stale bonusMoveThresholdRef and correctly
  // defers when a new threshold is pending. React runs effects in definition order.
  useEffect(() => {
    // Don't check until turn is fully complete (all scoring settled)
    if (!turnComplete || isAnimating || combo > 0 || pendingSpecials.length > 0) return;
    if (gameState !== 'playing') return;
    if (showVictoryPrompt) return; // Don't check while bonus prompt is showing
    if (showBonusMovesPrompt) return; // v11.6: Don't check while bonus moves prompt is showing
    
    const checkTimer = setTimeout(() => {
      const currentScore = scoreRef.current;

      // v10.5 Fix A: If the current score has crossed a new bonus-move threshold that
      // hasn't been awarded yet, bail out — the bonus-move effect will fire first (it
      // depends on the same score state), increment moves, and re-trigger this effect.
      const pendingThreshold = Math.floor(currentScore / BONUS_MOVE_INTERVAL) * BONUS_MOVE_INTERVAL;
      if (pendingThreshold > bonusMoveThresholdRef.current) return;

      // v9.8: Calculate specials bonus FIRST, then check if we'd reach target with it
      const { bonus: specialsBonus } = calculateUnusedSpecialsBonus(grid);
      const scoreWithBonus = currentScore + specialsBonus;
      const hasReachedTarget = targetReached || scoreWithBonus >= levelTarget;

      console.log('Game end check:', { currentScore, specialsBonus, scoreWithBonus, levelTarget, hasReachedTarget, moves, targetReached, victoryRoundActive });

      // V-2: In VERSES_MODE the arcade end-of-run flow (bonus-round
      // prompt, bonus-moves prompt, gameState win/lose, recordGameResult)
      // is fully suppressed. End-of-round is driven by the verses
      // effect above (passage modal on moves=0 + all chunks revealed).
      // We still run the guard checks / pendingThreshold bail so the
      // bonus-move accrual path below keeps ticking — earned bonus
      // moves at V-2 sit idle (no prompt consumes them) but the score
      // threshold tracking continues to work.
      if (VERSES_MODE) return;

      // v8.10: If target reached with moves remaining and not in victory round, show prompt
      if (hasReachedTarget && moves > 0 && !victoryRoundActive && !showVictoryPrompt) {
        if (!targetReached) setTargetReached(true);
        setShowVictoryPrompt(true);
        return;
      }
      
      // v8.10 / v11.6: Victory round ended — check bonusMoves before resolving
      if (victoryRoundActive && moves <= 0) {
        if (bonusMoves > 0) {
          setVictoryRoundActive(false);
          setShowBonusMovesPrompt(true);
          return;
        }
        setScore(prev => prev + specialsBonus);

        const difficultyIncrease = DIFFICULTY_INCREMENT_MIN +
          Math.floor(Math.random() * (DIFFICULTY_INCREMENT_MAX - DIFFICULTY_INCREMENT_MIN + 1));
        setDifficultyBonus(prev => prev + difficultyIncrease);

        if (scoreWithBonus > highScore) setHighScore(scoreWithBonus);
        recordGameResult({ endType: 'bonusRound', finalScore: scoreWithBonus, won: true });
        setGameState('won');
        return;
      }

      // v11.6: moves = 0, not in victory round — check bonusMoves before resolving (win OR fail)
      if (moves <= 0 && !victoryRoundActive) {
        if (bonusMoves > 0 && !usingBonusMoves) {
          setShowBonusMovesPrompt(true);
          return;
        }
        if (usingBonusMoves && bonusMoves > 0) return; // still have bonus moves — game continues

        // No bonus moves (or exhausted) — resolve
        setScore(prev => prev + specialsBonus);
        if (scoreWithBonus > highScore) setHighScore(scoreWithBonus);
        if (hasReachedTarget) {
          if (!targetReached) setTargetReached(true);
          const difficultyIncrease = DIFFICULTY_INCREMENT_MIN +
            Math.floor(Math.random() * (DIFFICULTY_INCREMENT_MAX - DIFFICULTY_INCREMENT_MIN + 1));
          setDifficultyBonus(prev => prev + difficultyIncrease);
          recordGameResult({ endType: 'won', finalScore: scoreWithBonus, won: true });
          setGameState('won');
        } else {
          setDifficultyBonus(0);
          recordGameResult({ endType: 'lost', finalScore: scoreWithBonus, won: false });
          setGameState('gameover');
        }
      }
    }, 150);
    
    return () => clearTimeout(checkTimer);
  }, [moves, gameState, levelTarget, highScore, isAnimating, combo, targetReached, pendingSpecials.length, grid, turnComplete, victoryRoundActive, showVictoryPrompt, showBonusMovesPrompt, bonusMoves, usingBonusMoves]);

  // v10.4/v10.5: Award +1 move for every 10,000 points crossed.
  // v10.5 Fix A: Also guard on turnComplete so the end-of-game specials score flush
  // (which can push past a threshold while moves===0) doesn't fire a spurious award
  // before gameState transitions. The game-end effect (see above) defers when a pending
  // bonus move is detected — this works because game-end runs first and sees the stale ref.
  useEffect(() => {
    if (gameState !== 'playing') return;
    if (!turnComplete) return; // wait for scoring to settle
    const threshold = Math.floor(score / BONUS_MOVE_INTERVAL) * BONUS_MOVE_INTERVAL;
    if (threshold > 0 && threshold > bonusMoveThresholdRef.current) {
      const newMoves = Math.floor((threshold - bonusMoveThresholdRef.current) / BONUS_MOVE_INTERVAL);
      bonusMoveThresholdRef.current = threshold;
      // v11.6: Earned bonus moves go directly into bonusMoves (persistent across games)
      setBonusMoves(prev => Math.min(prev + newMoves, BONUS_MOVES_CAP));
      // v10.5: Trigger animated burst — queued if bonus prompt is open
      if (showVictoryPrompt) {
        bonusMoveFlashPendingRef.current += newMoves;
      } else {
        setBonusMoveFlash(prev => prev + newMoves);
      }
    }
  }, [score, gameState, turnComplete]);

  // v8.10: Handle victory round choice
  const startBonusRound = () => {
    setShowVictoryPrompt(false);
    setVictoryRoundActive(true);
    setPreVictoryScore(score);
    setVictoryRoundScore(0);
    // v10.5.3: Flush any burst queued while the banner was open
    if (bonusMoveFlashPendingRef.current > 0) {
      setBonusMoveFlash(prev => prev + bonusMoveFlashPendingRef.current);
      bonusMoveFlashPendingRef.current = 0;
    }
  };
  
  const endLevelEarly = () => {
    setShowVictoryPrompt(false);
    // v10.5.3: Discard any queued burst — game is ending, no need to show it
    bonusMoveFlashPendingRef.current = 0;
    const moveBonus = moves * EARLY_END_BONUS_PER_MOVE;
    const { bonus: specialsBonus } = calculateUnusedSpecialsBonus(grid);
    const totalBonus = moveBonus + specialsBonus;
    
    setScore(prev => prev + totalBonus);
    
    const difficultyIncrease = DIFFICULTY_INCREMENT_MIN + 
      Math.floor(Math.random() * (DIFFICULTY_INCREMENT_MAX - DIFFICULTY_INCREMENT_MIN + 1));
    setDifficultyBonus(prev => prev + difficultyIncrease);
    
    // v10 Fix 4: Use scoreRef.current (not stale 'score' closure) for high score check
    if (scoreRef.current + totalBonus > highScore) setHighScore(scoreRef.current + totalBonus);
    recordGameResult({ endType: 'earlyEnd', finalScore: scoreRef.current + totalBonus, won: true });
    setGameState('won');
  };

  // v11.2: Record a completed game into match3_stats (localStorage JSON)
  const recordGameResult = ({ endType, finalScore, won }) => {
    try {
      const raw = localStorage.getItem(STATS_KEY);
      const stats = raw ? { ...defaultStats(), ...JSON.parse(raw) } : defaultStats();
      stats.gamesPlayed++;
      if (won) stats.gamesWon++; else stats.gamesLost++;
      if (endType === 'bonusRound') stats.bonusRoundsTaken++;
      if (endType === 'earlyEnd')   stats.earlyEnds++;
      if (endType === 'savedMoves') stats.movesSaved++;
      const entry = {
        ts: Date.now(),
        won,
        finalScore,
        levelTarget,
        movesRemaining: moves,
        endType,
        difficultyBonus,
        maxCombo: maxComboReached,
      };
      stats.history = [...stats.history.slice(-49), entry];
      localStorage.setItem(STATS_KEY, JSON.stringify(stats));
    } catch (e) { /* localStorage full or parse error — fail silently */ }
  };

  // v11.6: Player chose "Use bonus moves" — each subsequent swap draws from bonusMoves
  const startUsingBonusMoves = () => {
    usingBonusMovesRef.current = true;
    setUsingBonusMoves(true);
    setShowBonusMovesPrompt(false);
  };

  // v11.6: Player chose "End and carry moves forward" — end game, bonusMoves persist naturally
  // v11.9: also closes the end-confirm popup if it was triggered via the in-header button
  const endLevelCarryBonus = () => {
    const { bonus: specialsBonus } = calculateUnusedSpecialsBonus(grid);
    const wonLevel = targetReached || scoreRef.current + specialsBonus >= levelTarget;
    usingBonusMovesRef.current = false;
    setUsingBonusMoves(false);
    setShowBonusMovesPrompt(false);
    setShowEndConfirm(false);
    setScore(prev => prev + specialsBonus);
    if (wonLevel) {
      if (!targetReached) setTargetReached(true);
      const diffInc = DIFFICULTY_INCREMENT_MIN +
        Math.floor(Math.random() * (DIFFICULTY_INCREMENT_MAX - DIFFICULTY_INCREMENT_MIN + 1));
      setDifficultyBonus(prev => prev + diffInc);
      if (scoreRef.current + specialsBonus > highScore) setHighScore(scoreRef.current + specialsBonus);
      recordGameResult({ endType: 'savedMoves', finalScore: scoreRef.current + specialsBonus, won: true });
      setGameState('won');
    } else {
      setDifficultyBonus(0);
      if (scoreRef.current + specialsBonus > highScore) setHighScore(scoreRef.current + specialsBonus);
      recordGameResult({ endType: 'savedMoves', finalScore: scoreRef.current + specialsBonus, won: false });
      setGameState('gameover');
    }
  };

  // v11.9: Wrapper for the in-header "End and carry moves forward" button.
  // If the player is below target during active bonus-moves use, show a
  // confirm first — clicking End here means losing a game they could still
  // win.
  // v1.9 (Session N-5, 2026-04-29): the bonus-moves prompt's End button
  // (in showBonusMovesPrompt) now also routes through this wrapper.
  // Original v11.9 wording excluded the prompt button as "a save after an
  // already-failed turn" — but user feedback (via tablet v11.13 / N-4) was
  // that the carry-forward decision is itself worth confirming. The
  // wrapper's `wouldWin` check produces correct behavior for both prompt
  // variants — confirms below target; just-ends if target already reached.
  // Mirrors campaign v1.27.
  const requestEndLevelCarryBonus = () => {
    const { bonus: specialsBonus } = calculateUnusedSpecialsBonus(grid);
    const wouldWin = targetReached || scoreRef.current + specialsBonus >= levelTarget;
    if (!wouldWin) {
      setShowEndConfirm(true);
      return;
    }
    endLevelCarryBonus();
  };

  // v9.6-tablet: Aggressive popup cleanup - check more frequently and limit total count
  useEffect(() => {
    if (scorePopups.length > 0) {
      const timer = setTimeout(() => {
        const now = Date.now();
        setScorePopups(prev => {
          // First filter by lifetime
          let filtered = prev.filter(popup => {
            const totalLifetime = popup.delay + popup.duration;
            const elapsed = now - popup.createdAt;
            return elapsed < totalLifetime;
          });
          // Hard limit: keep only most recent 8 popups to prevent buildup
          if (filtered.length > 8) {
            filtered = filtered.slice(-8);
          }
          return filtered;
        });
      }, 250); // v9.6-tablet: Check every 250ms (was 500ms)
      return () => clearTimeout(timer);
    }
  }, [scorePopups]);
  
  // v8.9: Combo milestone popups at 5, 10, 15
  useEffect(() => {
    const milestones = [5, 10, 15];
    for (const milestone of milestones) {
      if (combo >= milestone && lastMilestoneShown < milestone) {
        const message = milestone === 15 ? '💥 LEGENDARY COMBO!' :
                       milestone === 10 ? '⚡ ULTRA COMBO!' :
                       '🌟 MEGA COMBO!';
        // Show popup at center-top of board
        setScorePopups(prev => [...prev, {
          id: Date.now() + Math.random(),
          row: 1,
          col: 4,
          points: 0,
          text: message,
          delay: 0,
          duration: 3500,
          createdAt: Date.now()
        }]);
        setLastMilestoneShown(milestone);
        break; // Only show one milestone at a time
      }
    }
  }, [combo, lastMilestoneShown]);
  
  // Reset milestone tracking when combo resets
  useEffect(() => {
    if (combo === 0) {
      setLastMilestoneShown(0);
    }
  }, [combo]);
  
  // Animation failsafe
  // v10: Also restores setTurnComplete(true) so game-end check can fire after a stuck animation
  useEffect(() => {
    if (isAnimating) {
      const failsafe = setTimeout(() => {
        setIsAnimating(false);
        setPendingSpecials([]);
        setTurnComplete(true);
      }, 8000);
      return () => clearTimeout(failsafe);
    }
  }, [isAnimating]);
  
  // =============================================================================
  // v9.0: HELPER FUNCTIONS FOR SHUFFLE/NEW BOARD
  // =============================================================================
  
  // Count all special tiles on the board
  const countSpecialsOnBoard = useCallback(() => {
    let count = 0;
    grid.forEach(row => {
      row.forEach(tile => {
        if (tile?.special) count++;
      });
    });
    return count;
  }, [grid]);
  
  // =============================================================================
  // CANVAS RENDERING
  // =============================================================================
  
  const renderCanvas = useCallback(() => {
    // v9.7.1-tablet: Simple frame counter (more reliable than timestamps on tablet)
    frameCountRef.current++;
    if (frameCountRef.current % FRAME_SKIP !== 0) {
      // Skip this frame
      animationFrameRef.current = requestAnimationFrame(renderCanvas);
      return;
    }
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR); // v9.5: Cap DPR
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Scale for retina displays
    ctx.save();
    ctx.scale(dpr, dpr);
    
    // v8.0: Draw background - dynamic dark/light mode
    const bgGradient = ctx.createLinearGradient(0, 0, boardWidth, boardHeight);
    if (isDarkMode) {
      bgGradient.addColorStop(0, '#1a1a2e');
      bgGradient.addColorStop(1, '#16213e');
    } else {
      bgGradient.addColorStop(0, '#f5f7fa');
      bgGradient.addColorStop(1, '#c3cfe2');
    }
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, boardWidth, boardHeight);
    
    // Draw tiles
    grid.forEach((row, rowIndex) => {
      row.forEach((tile, colIndex) => {
        if (!tile) return;
        
        // v9.6-tablet: Use Set-based O(1) lookups instead of Array.some()
        const tileKey = `${rowIndex}-${colIndex}`;
        const isSelected = selectedTile?.row === rowIndex && selectedTile?.col === colIndex;
        const isMatched = matchedTileSet.has(tileKey);
        const isPending = pendingSpecialSet.has(tileKey);
        const isGlowing = glowingTileSet.has(tileKey);
        const isFlashing = flashingTileSet.has(tileKey);
        
        // Calculate animated position
        const targetX = colIndex * (TILE_SIZE + TILE_GAP);
        const targetY = rowIndex * (TILE_SIZE + TILE_GAP);

        // v10.2 Fix #3: Use animStateRef instead of mutating tile objects directly.
        // Seed from tile.animX/animY on first encounter (set during grid construction).
        const tileId = tile.id;
        if (!animStateRef.current[tileId]) {
          animStateRef.current[tileId] = {
            x: tile.animX !== undefined ? tile.animX : targetX,
            y: tile.animY !== undefined ? tile.animY : targetY,
          };
        }
        const anim = animStateRef.current[tileId];
        anim.x += (targetX - anim.x) * ANIMATION_SPEED;
        anim.y += (targetY - anim.y) * ANIMATION_SPEED;
        const drawX = anim.x;
        const drawY = anim.y;
        
        // Calculate scale for matched tiles
        let scale = 1;
        let opacity = 1;
        if (isMatched) {
          scale = 1.1;
          opacity = 0.7;
        } else if (isSelected) {
          scale = 1.1;
        } else if (isPending) {
          scale = 1.05;
        }
        
        // Draw the tile
        drawTile(ctx, drawX, drawY, TILE_SIZE, tile.type, {
          isSelected,
          isMatched,
          isSpecial: tile.special !== null,
          isPending,
          opacity,
          scale
        });
        
        // v8.3: Draw glow effect (pulsing border before activation)
        if (isGlowing) {
          ctx.save();
          ctx.strokeStyle = '#FFD700';
          ctx.lineWidth = 4;
          ctx.shadowColor = '#FFD700';
          ctx.shadowBlur = 15;
          ctx.strokeRect(drawX - 2, drawY - 2, TILE_SIZE + 4, TILE_SIZE + 4);
          ctx.restore();
        }
        
        // v8.3: Draw flash effect (white overlay during activation)
        if (isFlashing) {
          ctx.save();
          ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
          ctx.fillRect(drawX, drawY, TILE_SIZE, TILE_SIZE);
          ctx.restore();
        }
        
        // Draw special icon if applicable
        if (tile.special) {
          drawSpecialIcon(ctx, drawX, drawY, TILE_SIZE, tile.special);
        }
      });
    });
    
    ctx.restore();
    
    // Continue animation loop
    animationFrameRef.current = requestAnimationFrame(renderCanvas);
  }, [grid, selectedTile, matchedTileSet, pendingSpecialSet, boardWidth, boardHeight, flashingTileSet, glowingTileSet, isDarkMode]);
  
  // v10.2 Fix #3: Prune animStateRef entries for tiles no longer on the board
  useEffect(() => {
    const liveIds = new Set();
    grid.forEach(row => row.forEach(tile => { if (tile?.id) liveIds.add(tile.id); }));
    Object.keys(animStateRef.current).forEach(id => {
      if (!liveIds.has(id)) delete animStateRef.current[id];
    });
  }, [grid]);

  // Start/stop animation loop
  useEffect(() => {
    animationFrameRef.current = requestAnimationFrame(renderCanvas);
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [renderCanvas]);
  
  // Setup canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR); // v9.5: Cap DPR
    canvas.width = boardWidth * dpr;
    canvas.height = boardHeight * dpr;
    canvas.style.width = `${boardWidth}px`;
    canvas.style.height = `${boardHeight}px`;
  }, [boardWidth, boardHeight]);
  
  // =============================================================================
  // INPUT HANDLING
  // =============================================================================
  
  const handleCanvasClick = (e) => {
    // v10.2 Fix #9: Touch events are handled by handleDragStart/End. The browser also
    // fires a synthetic 'click' after touchend, which would double-process the tap.
    // Bail out here if this click was synthesized from a touch sequence.
    if (swapFiredRef.current || e.detail === 0) return; // v11 Fix 2: block phantom click after drag-swap
    if (isAnimating || gameState !== 'playing') return;
    if (VERSES_MODE && (moves <= 0 || showStartModal || showPassageModal)) return; // V-2: freeze input while a passage modal is open or during the 2.5s pre-modal hold
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const col = Math.floor(x / (TILE_SIZE + TILE_GAP));
    const row = Math.floor(y / (TILE_SIZE + TILE_GAP));
    
    if (row < 0 || row >= ROWS || col < 0 || col >= COLS) return;
    
    handleTileClick(row, col);
  };
  
  // Drag/Swipe handlers for touch and mouse
  const getEventCoords = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    if (e.touches && e.touches[0]) {
      return { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top };
    }
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };
  
  const handleDragStart = (e) => {
    if (isAnimating || gameState !== 'playing') return;
    if (VERSES_MODE && (moves <= 0 || showStartModal || showPassageModal)) return; // V-2: freeze input while a passage modal is open or during the 2.5s pre-modal hold
    e.preventDefault();
    
    const { x, y } = getEventCoords(e);
    const col = Math.floor(x / (TILE_SIZE + TILE_GAP));
    const row = Math.floor(y / (TILE_SIZE + TILE_GAP));
    
    if (row >= 0 && row < ROWS && col >= 0 && col < COLS) {
      dragStart.current = { row, col, x, y };
      setSelectedTile({ row, col });
    }
  };
  
  const handleDragMove = (e) => {
    if (!dragStart.current || isAnimating || gameState !== 'playing') return;
    e.preventDefault();

    const { x, y } = getEventCoords(e);
    const dx = x - dragStart.current.x;
    const dy = y - dragStart.current.y;
    const threshold = TILE_SIZE * 0.4; // 40% of tile size

    let targetRow = dragStart.current.row;
    let targetCol = dragStart.current.col;

    if (Math.abs(dx) > Math.abs(dy)) {
      if (dx > threshold) targetCol = dragStart.current.col + 1;
      else if (dx < -threshold) targetCol = dragStart.current.col - 1;
    } else {
      if (dy > threshold) targetRow = dragStart.current.row + 1;
      else if (dy < -threshold) targetRow = dragStart.current.row - 1;
    }

    if ((targetRow !== dragStart.current.row || targetCol !== dragStart.current.col) &&
        targetRow >= 0 && targetRow < ROWS && targetCol >= 0 && targetCol < COLS) {
      // v11 Fix 1: capture values before nulling ref, so subsequent touchmove events
      // see dragStart.current === null immediately and skip re-entering this branch
      const { row: startRow, col: startCol } = dragStart.current;
      dragStart.current = null;
      // v11 Fix 2: flag the pending synthetic click so handleCanvasClick ignores it
      swapFiredRef.current = true;
      setTimeout(() => { swapFiredRef.current = false; }, 300);
      setSelectedTile(null);
      attemptSwap(startRow, startCol, targetRow, targetCol);
    }
  };
  
  const handleDragEnd = () => {
    // v10.3 Fix F: If dragStart is still set here, no swap was triggered (tap without drag).
    // Clear selectedTile so it doesn't linger and cause an unintended swap on the next tap.
    if (dragStart.current) setSelectedTile(null);
    dragStart.current = null;
  };
  
  const handleTileClick = (row, col) => {
    if (isAnimating || gameState !== 'playing') return;
    if (VERSES_MODE && (moves <= 0 || showStartModal || showPassageModal)) return; // V-2: freeze input while a passage modal is open or during the 2.5s pre-modal hold
    
    if (!selectedTile) {
      setSelectedTile({ row, col });
      return;
    }
    
    const rowDiff = Math.abs(selectedTile.row - row);
    const colDiff = Math.abs(selectedTile.col - col);
    
    if ((rowDiff === 1 && colDiff === 0) || (rowDiff === 0 && colDiff === 1)) {
      attemptSwap(selectedTile.row, selectedTile.col, row, col);
    } else {
      setSelectedTile({ row, col });
    }
  };
  
  const attemptSwap = (row1, col1, row2, col2) => {
    setIsAnimating(true);
    setSelectedTile(null);
    setCurrentTurnScore(0);
    setTurnComplete(false); // v6.7: Mark turn as in-progress
    startTurn(); // v11.8: begin a new scoring-history turn
    
    const newGrid = grid.map(r => r.map(t => t ? { ...t } : null));
    
    // Check if BOTH tiles are special BEFORE swapping
    const tile1Special = newGrid[row1][col1]?.special;
    const tile2Special = newGrid[row2][col2]?.special;
    
    // Perform the swap
    [newGrid[row1][col1], newGrid[row2][col2]] = [newGrid[row2][col2], newGrid[row1][col1]];
    setGrid(newGrid);
    
    // If BOTH tiles are special, activate special combination!
    if (tile1Special && tile2Special) {
      if (usingBonusMovesRef.current) setBonusMoves(prev => Math.max(0, prev - 1));
      else setMoves(prev => prev - 1);
      // Fix: detect any 4+ matches created by the swap, beyond the two specials themselves.
      const { connectedGroups: swapGroups } = findMatches(newGrid);
      const specialPositions = new Set([`${row1}-${col1}`, `${row2}-${col2}`]);
      const additionalGroups = swapGroups.filter(g =>
        g.totalUniqueTiles >= 4 &&
        !g.tiles.every(t => specialPositions.has(`${t.row}-${t.col}`))
      );
      pipelineTimeout(() => {
        activateSpecialCombination(row1, col1, row2, col2, tile1Special, tile2Special, newGrid, additionalGroups, { row: row2, col: col2 });
      }, 300);
      return;
    }

    pipelineTimeout(() => {
      const { matches, matchGroups, lShapeMatches, connectedGroups } = findMatches(newGrid);
      
      if (matches.length > 0) {
        if (usingBonusMovesRef.current) setBonusMoves(prev => Math.max(0, prev - 1));
        else setMoves(prev => prev - 1);
        const comboIncrease = matchGroups.length + (lShapeMatches?.length || 0);
        setCombo(comboIncrease);
        setMaxComboReached(current => Math.max(current, comboIncrease));
        // v8.4: Pass swap positions for special creation
        processMatches(newGrid, matchGroups, lShapeMatches, comboIncrease, 0, connectedGroups, { row: row2, col: col2 });
      } else {
        // Swap back - invalid move, turn is complete
        const revertGrid = newGrid.map(r => r.map(t => t ? { ...t } : null));
        [revertGrid[row1][col1], revertGrid[row2][col2]] = [revertGrid[row2][col2], revertGrid[row1][col1]];
        setGrid(revertGrid);
        setIsAnimating(false);
        setTurnComplete(true); // No valid move, turn complete
      }
    }, 300);
  };
  
  // =============================================================================
  // MATCH FINDING AND PROCESSING
  // =============================================================================
  
  const findMatches = (currentGrid) => {
    const matches = [];
    const matchGroups = [];
    const visited = new Set();
    
    // Find horizontal matches
    for (let row = 0; row < ROWS; row++) {
      let col = 0;
      while (col < COLS) {
        const tile = currentGrid[row][col];
        if (!tile) { col++; continue; }
        
        let matchLength = 1;
        while (col + matchLength < COLS && 
               currentGrid[row][col + matchLength]?.type === tile.type) {
          matchLength++;
        }
        
        if (matchLength >= 3) {
          const tiles = [];
          for (let i = 0; i < matchLength; i++) {
            tiles.push({ row, col: col + i });
            matches.push({ row, col: col + i });
            visited.add(`${row}-${col + i}`);
          }
          matchGroups.push({ tiles, length: matchLength, direction: 'horizontal', tileType: tile.type });
        }
        col += matchLength;
      }
    }
    
    // Find vertical matches
    for (let col = 0; col < COLS; col++) {
      let row = 0;
      while (row < ROWS) {
        const tile = currentGrid[row][col];
        if (!tile) { row++; continue; }
        
        let matchLength = 1;
        while (row + matchLength < ROWS && 
               currentGrid[row + matchLength][col]?.type === tile.type) {
          matchLength++;
        }
        
        if (matchLength >= 3) {
          const tiles = [];
          for (let i = 0; i < matchLength; i++) {
            tiles.push({ row: row + i, col });
            if (!visited.has(`${row + i}-${col}`)) {
              matches.push({ row: row + i, col });
            }
          }
          matchGroups.push({ tiles, length: matchLength, direction: 'vertical', tileType: tile.type });
        }
        row += matchLength;
      }
    }
    
    // Find L-shapes (intersections of horizontal and vertical matches)
    const lShapeMatches = [];
    for (let i = 0; i < matchGroups.length; i++) {
      for (let j = i + 1; j < matchGroups.length; j++) {
        if (matchGroups[i].direction !== matchGroups[j].direction &&
            matchGroups[i].tileType === matchGroups[j].tileType) {
          const intersection = matchGroups[i].tiles.find(t1 => 
            matchGroups[j].tiles.some(t2 => t1.row === t2.row && t1.col === t2.col)
          );
          if (intersection) {
            const tileType = currentGrid[intersection.row][intersection.col]?.type;
            lShapeMatches.push({ ...intersection, tileType });
          }
        }
      }
    }
    
    // OPTION B: Find connected match groups (same tile type, sharing tiles)
    // This determines total unique tiles for supernova/hypernova creation
    const connectedGroups = [];
    const groupUsed = new Array(matchGroups.length).fill(false);
    
    for (let i = 0; i < matchGroups.length; i++) {
      if (groupUsed[i]) continue;
      
      // Start a new connected group
      const connectedTiles = new Set();
      const connectedGroupIndices = [i];
      const tileType = matchGroups[i].tileType;
      
      // Add all tiles from this group
      matchGroups[i].tiles.forEach(t => connectedTiles.add(`${t.row}-${t.col}`));
      groupUsed[i] = true;
      
      // Find all groups that connect to this one (same type, share a tile)
      let foundNew = true;
      while (foundNew) {
        foundNew = false;
        for (let j = 0; j < matchGroups.length; j++) {
          if (groupUsed[j] || matchGroups[j].tileType !== tileType) continue;
          
          // Check if this group shares any tile with our connected group
          const shares = matchGroups[j].tiles.some(t => connectedTiles.has(`${t.row}-${t.col}`));
          if (shares) {
            matchGroups[j].tiles.forEach(t => connectedTiles.add(`${t.row}-${t.col}`));
            connectedGroupIndices.push(j);
            groupUsed[j] = true;
            foundNew = true;
          }
        }
      }
      
      // Convert Set back to array of tile objects
      const tilesArray = Array.from(connectedTiles).map(key => {
        const [row, col] = key.split('-').map(Number);
        return { row, col };
      });
      
      connectedGroups.push({
        tiles: tilesArray,
        totalUniqueTiles: tilesArray.length,
        tileType,
        groupIndices: connectedGroupIndices
      });
    }
    
    return { matches, matchGroups, lShapeMatches, connectedGroups };
  };
  
  // v8.4: Added swapPosition parameter for special creation at swap location
  const processMatches = (currentGrid, matchGroups, lShapeMatches, currentCombo, generation = 0, connectedGroups = [], swapPosition = null) => {
    setMatchedTiles(matchGroups.flatMap(g => g.tiles));
    
    // Calculate score
    let totalPoints = 0;
    const multiplier = getMultiplier(currentCombo);
    
    matchGroups.forEach(group => {
      const basePoints = group.length * 10;
      totalPoints += Math.floor(basePoints * multiplier);
    });
    
    // Bonus for L-shapes
    if (lShapeMatches && lShapeMatches.length > 0) {
      totalPoints += lShapeMatches.length * 50;
    }
    
    // v8.10: Apply victory round multiplier
    const finalPoints = victoryRoundActive ? Math.floor(totalPoints * VICTORY_ROUND_MULTIPLIER) : totalPoints;
    setScore(prev => prev + finalPoints);
    setCurrentTurnScore(prev => prev + finalPoints);
    if (victoryRoundActive) {
      setVictoryRoundScore(prev => prev + finalPoints);
    }

    // v11.8: record one history event per match group so the breakdown
    // shows each separately rather than lumping all into a single line.
    matchGroups.forEach(group => {
      const tileTypeName = TILE_COLORS[group.tileType]?.name ?? 'tiles';
      const description = `${group.length}-${tileTypeName} (${group.direction})`;
      const basePoints = group.length * 10;
      const pointsForThisGroup = Math.floor(basePoints * multiplier);
      const final = victoryRoundActive ? Math.floor(pointsForThisGroup * VICTORY_ROUND_MULTIPLIER) : pointsForThisGroup;
      recordScoringEvent({
        type: generation === 0 ? 'match' : 'cascade-match',
        description,
        points: final,
        multiplier: multiplier * (victoryRoundActive ? VICTORY_ROUND_MULTIPLIER : 1),
        baseScore: basePoints,
        tiles: group.tiles,
        cascadeDepth: generation,
      });
    });
    if (lShapeMatches && lShapeMatches.length > 0) {
      const lShapeTotal = lShapeMatches.length * 50;
      const lShapeFinal = victoryRoundActive ? Math.floor(lShapeTotal * VICTORY_ROUND_MULTIPLIER) : lShapeTotal;
      recordScoringEvent({
        type: 'l-shape-bonus',
        description: `L-shape bonus (×${lShapeMatches.length})`,
        points: lShapeFinal,
        multiplier: victoryRoundActive ? VICTORY_ROUND_MULTIPLIER : 1,
        baseScore: lShapeTotal,
        tiles: lShapeMatches,
        cascadeDepth: generation,
      });
    }

    // Add popup
    if (matchGroups.length > 0) {
      const firstMatch = matchGroups[0].tiles[0];
      addScorePopup(firstMatch.row, firstMatch.col, finalPoints);
    }

    // Remove matches and create specials
    pipelineTimeout(() => {
      removeMatches(currentGrid, matchGroups, lShapeMatches, generation, connectedGroups, swapPosition);
    }, 400);
  };
  
  // Activate a special tile's effect
  const activateSpecialTile = (row, col, currentGrid, alreadyCleared = new Set()) => {
    const tile = currentGrid[row]?.[col];
    if (!tile || !tile.special) return { tilesToClear: [], points: 0, message: '', chainedSpecials: [] };
    
    const tilesToClear = [];
    const chainedSpecials = [];
    let points = 0;
    let message = '';
    const posKey = `${row}-${col}`;
    
    if (alreadyCleared.has(posKey)) return { tilesToClear: [], points: 0, message: '', chainedSpecials: [] };
    alreadyCleared.add(posKey);
    
    if (tile.special === 'line') {
      // Clear entire row
      for (let c = 0; c < COLS; c++) {
        if (currentGrid[row][c]) {
          tilesToClear.push({ row, col: c });
          if (currentGrid[row][c].special && c !== col && !alreadyCleared.has(`${row}-${c}`)) {
            chainedSpecials.push({ row, col: c, type: currentGrid[row][c].special });
          }
        }
      }
      points = tilesToClear.length * 30;
      message = `⚡ LINE CLEAR! +${points}`;
    } else if (tile.special === 'bomb') {
      // v10.1: 3×3 area + full row + full column, flat 750 pts
      // Specials in row/col arms also chain
      const addedKeys = new Set();
      const addTile = (r, c) => {
        const k = `${r}-${c}`;
        if (!addedKeys.has(k) && currentGrid[r]?.[c]) {
          addedKeys.add(k);
          tilesToClear.push({ row: r, col: c });
          if (currentGrid[r][c].special && !(r === row && c === col) && !alreadyCleared.has(k)) {
            chainedSpecials.push({ row: r, col: c, type: currentGrid[r][c].special });
          }
        }
      };
      // 3×3 area
      for (let r = Math.max(0, row - 1); r <= Math.min(ROWS - 1, row + 1); r++)
        for (let c = Math.max(0, col - 1); c <= Math.min(COLS - 1, col + 1); c++)
          addTile(r, c);
      // Full row
      for (let c = 0; c < COLS; c++) addTile(row, c);
      // Full column
      for (let r = 0; r < ROWS; r++) addTile(r, col);
      points = 750;
      message = `💣 BOOM! +${points}`;
    } else if (tile.special === 'cross') {
      // Clear entire row AND column
      for (let c = 0; c < COLS; c++) {
        if (currentGrid[row][c]) {
          tilesToClear.push({ row, col: c });
          if (currentGrid[row][c].special && c !== col && !alreadyCleared.has(`${row}-${c}`)) {
            chainedSpecials.push({ row, col: c, type: currentGrid[row][c].special });
          }
        }
      }
      for (let r = 0; r < ROWS; r++) {
        if (r !== row && currentGrid[r][col]) {
          tilesToClear.push({ row: r, col });
          if (currentGrid[r][col].special && !alreadyCleared.has(`${r}-${col}`)) {
            chainedSpecials.push({ row: r, col, type: currentGrid[r][col].special });
          }
        }
      }
      points = tilesToClear.length * 38;
      message = `✨ CROSS BLAST! +${points}`;
    } else if (tile.special === 'supernova') {
      // v10.1: 5×5 area + full row + full column, flat 2000 pts
      const addedKeys = new Set();
      const addTile = (r, c) => {
        const k = `${r}-${c}`;
        if (!addedKeys.has(k) && currentGrid[r]?.[c]) {
          addedKeys.add(k);
          tilesToClear.push({ row: r, col: c });
          if (currentGrid[r][c].special && !(r === row && c === col) && !alreadyCleared.has(k)) {
            chainedSpecials.push({ row: r, col: c, type: currentGrid[r][c].special });
          }
        }
      };
      // 5×5 area
      for (let r = Math.max(0, row - 2); r <= Math.min(ROWS - 1, row + 2); r++)
        for (let c = Math.max(0, col - 2); c <= Math.min(COLS - 1, col + 2); c++)
          addTile(r, c);
      // Full row
      for (let c = 0; c < COLS; c++) addTile(row, c);
      // Full column
      for (let r = 0; r < ROWS; r++) addTile(r, col);
      points = 2000;
      message = `🌌 SUPERNOVA! +${points}`;
    } else if (tile.special === 'hypernova') {
      // v11.7: 5×5 + row + col footprint FIRES specials (was: skipped them).
      // Specials caught in the footprint chain and cascade like any other
      // special sweep. Outside the footprint: half of non-special tiles
      // cleared randomly; specials preserved. 30-tile floor for sparse
      // boards. Matches "amplification, not interference" — hypernova
      // brings specials into the cascade chain instead of wasting them.
      const addedKeys = new Set();
      // Phase 1: footprint — add ALL tiles (specials included). Specials
      // in footprint become chainedSpecials (cascade activation).
      const addFootprintTile = (r, c) => {
        const k = `${r}-${c}`;
        if (!addedKeys.has(k) && currentGrid[r]?.[c]) {
          addedKeys.add(k);
          tilesToClear.push({ row: r, col: c });
          if (currentGrid[r][c].special && !(r === row && c === col) && !alreadyCleared.has(k)) {
            chainedSpecials.push({ row: r, col: c, type: currentGrid[r][c].special });
          }
        }
      };
      for (let r = Math.max(0, row - 2); r <= Math.min(ROWS - 1, row + 2); r++)
        for (let c = Math.max(0, col - 2); c <= Math.min(COLS - 1, col + 2); c++)
          addFootprintTile(r, c);
      for (let c = 0; c < COLS; c++) addFootprintTile(row, c);
      for (let r = 0; r < ROWS; r++) addFootprintTile(r, col);
      // Phase 2: collect remaining regular tiles (outside footprint, not specials).
      // Specials outside footprint are preserved — never added to remaining.
      const remaining = [];
      for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
          const k = `${r}-${c}`;
          if (!addedKeys.has(k) && currentGrid[r]?.[c] && !currentGrid[r][c].special) {
            remaining.push({ row: r, col: c });
          }
        }
      }
      // Fisher-Yates shuffle then take half
      for (let i = remaining.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [remaining[i], remaining[j]] = [remaining[j], remaining[i]];
      }
      const halfCount = Math.ceil(remaining.length / 2);
      remaining.slice(0, halfCount).forEach(t => {
        tilesToClear.push(t);
        addedKeys.add(`${t.row}-${t.col}`);
      });
      // Minimum tile floor guarantee — pull more non-specials from outside if needed
      if (tilesToClear.length < HYPERNOVA_MIN_TILES_CLEARED) {
        const extra = remaining.slice(halfCount);
        for (let i = 0; i < extra.length && tilesToClear.length < HYPERNOVA_MIN_TILES_CLEARED; i++) {
          tilesToClear.push(extra[i]);
        }
      }
      points = 5000;
      message = `🌠 HYPERNOVA!!! +${points}`;
    }
    
    return { tilesToClear, points, message, chainedSpecials };
  };
  
  // Activate enhanced effects when two special tiles are swapped together
  const activateSpecialCombination = (row1, col1, row2, col2, type1, type2, currentGrid, additionalGroups = [], swapPosition = null) => {
    setIsAnimating(true);
    
    const tilesToRemove = [];
    let points = 0;
    let message = '';
    
    // Sort types for consistent comparison
    const combo = [type1, type2].sort().join('+');
    
    // v8.4: Use row2, col2 (swap destination) as the center for effects and popup
    // This is where the player dragged TO, which feels like where the "collision" happens
    const effectRow = row2;
    const effectCol = col2;

    // v11.7: Hypernova events get slower cascade stagger + longer match
    // transition for extra visual impact.
    const isHypernovaEvent = combo.includes('hypernova');

    // v11.7: Hypernova combo helpers. Hypernova footprint = 5×5 + row + col
    // (same shape as supernova) including specials, which will be picked up by
    // the cascade scan and fired. hypernovaHalfOfRest adds half of non-specials
    // outside the already-cleared zone, enforcing the 30-tile min floor.
    const computeHypernovaFootprint = (r, c) => {
      const keys = new Set();
      const out = [];
      const add = (rr, cc) => {
        const k = `${rr}-${cc}`;
        if (!keys.has(k) && currentGrid[rr]?.[cc]) {
          keys.add(k);
          out.push({ row: rr, col: cc });
        }
      };
      for (let rr = Math.max(0, r - 2); rr <= Math.min(ROWS - 1, r + 2); rr++)
        for (let cc = Math.max(0, c - 2); cc <= Math.min(COLS - 1, c + 2); cc++)
          add(rr, cc);
      for (let cc = 0; cc < COLS; cc++) add(r, cc);
      for (let rr = 0; rr < ROWS; rr++) add(rr, c);
      return out;
    };
    const hypernovaHalfOfRest = (clearedKeys) => {
      const remaining = [];
      for (let rr = 0; rr < ROWS; rr++) {
        for (let cc = 0; cc < COLS; cc++) {
          const k = `${rr}-${cc}`;
          if (!clearedKeys.has(k) && currentGrid[rr]?.[cc] && !currentGrid[rr][cc].special) {
            remaining.push({ row: rr, col: cc });
          }
        }
      }
      for (let i = remaining.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [remaining[i], remaining[j]] = [remaining[j], remaining[i]];
      }
      const halfCount = Math.ceil(remaining.length / 2);
      const additions = remaining.slice(0, halfCount);
      let total = clearedKeys.size + additions.length;
      if (total < HYPERNOVA_MIN_TILES_CLEARED) {
        const extra = remaining.slice(halfCount);
        for (let i = 0; i < extra.length && total < HYPERNOVA_MIN_TILES_CLEARED; i++) {
          additions.push(extra[i]);
          total++;
        }
      }
      return additions;
    };

    if (combo === 'line+line') {
      // Clear entire row AND column (cross effect) - centered on swap destination
      for (let c = 0; c < COLS; c++) {
        if (currentGrid[effectRow][c]) tilesToRemove.push({ row: effectRow, col: c });
      }
      for (let r = 0; r < ROWS; r++) {
        if (currentGrid[r][effectCol] && r !== effectRow) tilesToRemove.push({ row: r, col: effectCol });
      }
      points = 700;
      message = '⚡⚡ DOUBLE LINE! +700';
    } else if (combo === 'bomb+bomb') {
      // v10.1: 7×7 area + row + col, 1500 pts
      const seen2 = new Set();
      const add = (r, c) => {
        const k = `${r}-${c}`;
        if (!seen2.has(k) && currentGrid[r]?.[c]) { seen2.add(k); tilesToRemove.push({ row: r, col: c }); }
      };
      for (let r = Math.max(0, effectRow - 3); r <= Math.min(ROWS - 1, effectRow + 3); r++)
        for (let c = Math.max(0, effectCol - 3); c <= Math.min(COLS - 1, effectCol + 3); c++)
          add(r, c);
      for (let c = 0; c < COLS; c++) add(effectRow, c);
      for (let r = 0; r < ROWS; r++) add(r, effectCol);
      points = 1500;
      message = '💣💣 MEGA BLAST! +1500';
    } else if (combo === 'cross+cross') {
      // Clear 3 rows + 3 columns centered on swap
      for (let r = Math.max(0, effectRow - 1); r <= Math.min(ROWS - 1, effectRow + 1); r++) {
        for (let c = 0; c < COLS; c++) {
          if (currentGrid[r][c]) tilesToRemove.push({ row: r, col: c });
        }
      }
      for (let r = 0; r < ROWS; r++) {
        for (let c = Math.max(0, effectCol - 1); c <= Math.min(COLS - 1, effectCol + 1); c++) {
          if (currentGrid[r][c] && !tilesToRemove.some(t => t.row === r && t.col === c)) {
            tilesToRemove.push({ row: r, col: c });
          }
        }
      }
      points = 850;
      message = '✨✨ DOUBLE CROSS! +850';
    } else if (combo === 'bomb+line') {
      // v10.1: 3 rows + 3×3 + row + col, 1200 pts
      const seen2 = new Set();
      const add = (r, c) => {
        const k = `${r}-${c}`;
        if (!seen2.has(k) && currentGrid[r]?.[c]) { seen2.add(k); tilesToRemove.push({ row: r, col: c }); }
      };
      for (let r = Math.max(0, effectRow - 1); r <= Math.min(ROWS - 1, effectRow + 1); r++)
        for (let c = 0; c < COLS; c++) add(r, c);
      for (let r = Math.max(0, effectRow - 1); r <= Math.min(ROWS - 1, effectRow + 1); r++)
        for (let c = Math.max(0, effectCol - 1); c <= Math.min(COLS - 1, effectCol + 1); c++)
          add(r, c);
      for (let c = 0; c < COLS; c++) add(effectRow, c);
      for (let r = 0; r < ROWS; r++) add(r, effectCol);
      points = 1200;
      message = '💣⚡ LINE BOMB! +1200';
    } else if (combo === 'cross+line') {
      // v7.2: Clear 2 rows + 2 columns
      for (let r = Math.max(0, effectRow); r <= Math.min(ROWS - 1, effectRow + 1); r++) {
        for (let c = 0; c < COLS; c++) {
          if (currentGrid[r][c]) tilesToRemove.push({ row: r, col: c });
        }
      }
      for (let r = 0; r < ROWS; r++) {
        for (let c = Math.max(0, effectCol); c <= Math.min(COLS - 1, effectCol + 1); c++) {
          if (currentGrid[r][c] && !tilesToRemove.some(t => t.row === r && t.col === c)) {
            tilesToRemove.push({ row: r, col: c });
          }
        }
      }
      points = 800;
      message = '✨⚡ CROSS LINE! +800';
    } else if (combo === 'bomb+cross') {
      // v10.1: 7×7 + row + col, 1400 pts
      const seen2 = new Set();
      const add = (r, c) => {
        const k = `${r}-${c}`;
        if (!seen2.has(k) && currentGrid[r]?.[c]) { seen2.add(k); tilesToRemove.push({ row: r, col: c }); }
      };
      for (let r = Math.max(0, effectRow - 3); r <= Math.min(ROWS - 1, effectRow + 3); r++)
        for (let c = Math.max(0, effectCol - 3); c <= Math.min(COLS - 1, effectCol + 3); c++)
          add(r, c);
      for (let c = 0; c < COLS; c++) add(effectRow, c);
      for (let r = 0; r < ROWS; r++) add(r, effectCol);
      points = 1400;
      message = '💣✨ CROSS BOMB! +1400';
    } else if (combo === 'supernova+supernova') {
      // v10.1: Clear all regular tiles, specials survive, 6000 pts
      // v10.5 Fix B: Also explicitly remove the two swapped tiles (they are specials,
      // so the !special filter would leave them on the board otherwise)
      for (let r = 0; r < ROWS; r++)
        for (let c = 0; c < COLS; c++)
          if (currentGrid[r][c] && !currentGrid[r][c].special) tilesToRemove.push({ row: r, col: c });
      tilesToRemove.push({ row: row1, col: col1 });
      tilesToRemove.push({ row: row2, col: col2 });
      points = 6000;
      message = '🌌🌌 DUAL SUPERNOVA! +6000';
    } else if (combo === 'hypernova+hypernova') {
      // v11.7: Two hypernova footprints (each fires specials in its zone via
      // the cascade scan below) + half of non-specials outside combined
      // footprints. Distant specials preserved. 30-tile min floor enforced.
      // 10000 pts unchanged.
      const combinedKeys = new Set();
      const pushIfNew = t => {
        const k = `${t.row}-${t.col}`;
        if (!combinedKeys.has(k)) { combinedKeys.add(k); tilesToRemove.push(t); }
      };
      computeHypernovaFootprint(row1, col1).forEach(pushIfNew);
      computeHypernovaFootprint(row2, col2).forEach(pushIfNew);
      hypernovaHalfOfRest(combinedKeys).forEach(t => tilesToRemove.push(t));
      points = 10000;
      message = '🌠🌠 DUAL HYPERNOVA!!! +10000';
    } else if (combo === 'hypernova+supernova') {
      // v11.7: Both specials blast from their respective positions. Supernova
      // and hypernova share the 5×5+row+col footprint shape, so we use the
      // same helper for both. Specials in either footprint fire via cascade
      // scan. Half of non-specials outside combined footprints cleared.
      // Distant specials preserved. 30-tile floor. 8000 pts unchanged.
      const combinedKeys = new Set();
      const pushIfNew = t => {
        const k = `${t.row}-${t.col}`;
        if (!combinedKeys.has(k)) { combinedKeys.add(k); tilesToRemove.push(t); }
      };
      computeHypernovaFootprint(row1, col1).forEach(pushIfNew);
      computeHypernovaFootprint(row2, col2).forEach(pushIfNew);
      hypernovaHalfOfRest(combinedKeys).forEach(t => tilesToRemove.push(t));
      points = 8000;
      message = '🌠🌌 NOVA FUSION! +8000';
    } else if (combo === 'bomb+supernova' || combo === 'cross+supernova' || combo === 'line+supernova') {
      // v10.1: 7×7 + row + col, 3500 pts
      const seen2 = new Set();
      const add = (r, c) => {
        const k = `${r}-${c}`;
        if (!seen2.has(k) && currentGrid[r]?.[c]) { seen2.add(k); tilesToRemove.push({ row: r, col: c }); }
      };
      for (let r = Math.max(0, effectRow - 3); r <= Math.min(ROWS - 1, effectRow + 3); r++)
        for (let c = Math.max(0, effectCol - 3); c <= Math.min(COLS - 1, effectCol + 3); c++)
          add(r, c);
      for (let c = 0; c < COLS; c++) add(effectRow, c);
      for (let r = 0; r < ROWS; r++) add(r, effectCol);
      points = 3500;
      const icon1 = type1 === 'supernova' ? '🌌' : (type1 === 'line' ? '⚡' : type1 === 'bomb' ? '💣' : '✨');
      const icon2 = type2 === 'supernova' ? '🌌' : (type2 === 'line' ? '⚡' : type2 === 'bomb' ? '💣' : '✨');
      message = `${icon1}${icon2} SUPERNOVA COMBO! +3500`;
    } else if (combo === 'bomb+hypernova' || combo === 'cross+hypernova' || combo === 'hypernova+line') {
      // v11.7: Hypernova footprint + X's natural solo effect (bomb/cross/line),
      // each firing specials in their own zones via the cascade scan. Half of
      // non-specials outside combined primary zones cleared. Distant specials
      // preserved. 30-tile floor. 6000 pts unchanged.
      const hyperIsType1 = (type1 === 'hypernova');
      const hyperR = hyperIsType1 ? row1 : row2;
      const hyperC = hyperIsType1 ? col1 : col2;
      const xR     = hyperIsType1 ? row2 : row1;
      const xC     = hyperIsType1 ? col2 : col1;

      const combinedKeys = new Set();
      const pushIfNew = t => {
        const k = `${t.row}-${t.col}`;
        if (!combinedKeys.has(k)) { combinedKeys.add(k); tilesToRemove.push(t); }
      };
      // Hypernova footprint fires specials in its zone
      computeHypernovaFootprint(hyperR, hyperC).forEach(pushIfNew);
      // X's solo effect (bomb 3×3+row+col, cross row+col, line row) — reuse
      // existing logic. Chained specials from X's cascade within its own
      // footprint will be picked up by the cascade scan below.
      const xResult = activateSpecialTile(xR, xC, currentGrid, new Set());
      xResult.tilesToClear.forEach(pushIfNew);
      // Half of non-specials outside combined primary zones
      hypernovaHalfOfRest(combinedKeys).forEach(t => tilesToRemove.push(t));

      points = 6000;
      const icon1 = type1 === 'hypernova' ? '🌠' : (type1 === 'line' ? '⚡' : type1 === 'bomb' ? '💣' : '✨');
      const icon2 = type2 === 'hypernova' ? '🌠' : (type2 === 'line' ? '⚡' : type2 === 'bomb' ? '💣' : '✨');
      message = `${icon1}${icon2} HYPERNOVA COMBO! +6000`;
    } else {
      // v9.8: Fallback - if combo not recognized, activate both specials individually
      // This ensures no special combination goes unhandled
      console.log('Unrecognized combo:', combo, '- activating both specials individually');
      
      // Activate first special
      const result1 = activateSpecialTile(row1, col1, currentGrid, new Set());
      result1.tilesToClear.forEach(t => tilesToRemove.push(t));
      
      // Activate second special (using same alreadyCleared set to avoid double-counting)
      const cleared = new Set(result1.tilesToClear.map(t => `${t.row}-${t.col}`));
      const result2 = activateSpecialTile(row2, col2, currentGrid, cleared);
      result2.tilesToClear.forEach(t => {
        if (!cleared.has(`${t.row}-${t.col}`)) {
          tilesToRemove.push(t);
        }
      });
      
      points = result1.points + result2.points;
      message = `${result1.message} + ${result2.message}`;
    }
    
    // Remove duplicates
    const uniqueTiles = [];
    const seen = new Set();
    tilesToRemove.forEach(tile => {
      const key = `${tile.row}-${tile.col}`;
      if (!seen.has(key)) {
        seen.add(key);
        uniqueTiles.push(tile);
      }
    });
    
    // v8.5: Check for specials in cleared tiles (cascade detection)
    // v8.12: Fixed - don't add to processedSpecials here, only during actual processing
    const chainedSpecials = [];
    const processedSpecials = new Set();
    const seenChained = new Set(); // v8.12: Prevent duplicate entries
    
    uniqueTiles.forEach(({ row, col }) => {
      const tile = currentGrid[row]?.[col];
      // Exclude the two tiles that were swapped (they triggered the combo)
      const isSwappedTile = (row === row1 && col === col1) || (row === row2 && col === col2);
      const posKey = `${row}-${col}`;
      if (tile?.special && !isSwappedTile && !seenChained.has(posKey)) {
        chainedSpecials.push({ row, col, type: tile.special });
        seenChained.add(posKey);
      }
    });
    
    // v8.5: Cascade multiplier helpers (same as in removeMatches)
    const getCascadeMultiplier = (depth) => {
      if (depth <= 1) return 1.0;
      if (depth === 2) return 1.5;
      if (depth === 3) return 2.0;
      if (depth === 4) return 2.5;
      return 3.0;
    };
    
    const getCascadeDelay = (depth) => {
      if (depth <= 1) return 0;
      // v11.7: slower stagger on hypernova events for visible impact
      const unitDelay = isHypernovaEvent ? 400 * HYPERNOVA_CASCADE_SLOWDOWN : 400;
      // v11.8: scale by playback speed so slow-motion extends cascade stagger
      return ((depth - 1) * unitDelay) * (playbackSpeedRef.current || 1);
    };

    // v8.9: 40% longer popup durations
    // v11.8: scale with playback speed so popups stay visible in slow mode
    const getCascadeDuration = (depth) => {
      const base = depth <= 1 ? 2800 : depth === 2 ? 3500 : 4200;
      return base * (playbackSpeedRef.current || 1);
    };

    // v8.5: Process chained specials with cascade effects
    let cascadePoints = 0;
    const allClearedTiles = new Set(uniqueTiles.map(t => `${t.row}-${t.col}`));
    
    const processChainedSpecial = (special, depth, sourceRow, sourceCol) => {
      // v8.9: Fixed - always skip already-processed specials (was only checking depth > 2)
      if (processedSpecials.has(`${special.row}-${special.col}`)) return;
      
      // Trigger visual effects
      const effectDelay = getCascadeDelay(depth);
      
      // Glow effect
      setTimeout(() => {
        setGlowingTiles(prev => [...prev, { row: special.row, col: special.col, id: Date.now() }]);
        setTimeout(() => {
          setGlowingTiles(prev => prev.filter(t => !(t.row === special.row && t.col === special.col)));
        }, 200);
      }, Math.max(0, effectDelay - 100));
      
      // Flash effect
      setTimeout(() => {
        setFlashingTiles(prev => [...prev, { row: special.row, col: special.col, id: Date.now() }]);
        setTimeout(() => {
          setFlashingTiles(prev => prev.filter(t => !(t.row === special.row && t.col === special.col)));
        }, 100);
      }, effectDelay);
      
      // Chain text
      const midRow = (sourceRow + special.row) / 2;
      const midCol = (sourceCol + special.col) / 2;
      setTimeout(() => {
        setChainTexts(prev => [...prev, {
          id: Date.now() + Math.random(),
          row: midRow,
          col: midCol,
          depth: depth
        }]);
        setTimeout(() => {
          setChainTexts(prev => prev.slice(1));
        }, 800);
      }, effectDelay - 50);
      
      // Activate the special and get its cleared tiles
      const result = activateSpecialTile(special.row, special.col, currentGrid, processedSpecials);
      const cascadeMultiplier = getCascadeMultiplier(depth);
      const multipliedPoints = Math.floor(result.points * cascadeMultiplier);
      
      cascadePoints += multipliedPoints;
      
      // Add cascade popup - v8.6: Position at top rows based on depth
      if (result.message) {
        const cascadeMessage = `🔥 CASCADE x${cascadeMultiplier.toFixed(1)}! ${result.message.split('!')[0]}! +${multipliedPoints}`;
        // v8.6: Depth 2 → row 0, Depth 3 → row 1, Depth 4+ → row 2
        const popupRow = Math.min(depth - 2, 2);
        addScorePopup(popupRow, special.col, multipliedPoints, cascadeMessage, effectDelay, getCascadeDuration(depth));
      }
      
      // Add tiles to clear and check for more chained specials
      result.tilesToClear.forEach(t => {
        allClearedTiles.add(`${t.row}-${t.col}`);
        if (!uniqueTiles.some(u => u.row === t.row && u.col === t.col)) {
          uniqueTiles.push(t);
        }
      });
      
      // v10.3 Fix E: Mark as processed BEFORE recursing so a looping chain (two specials
      // in each other's blast radius) is caught on first re-entry, not second.
      processedSpecials.add(`${special.row}-${special.col}`);
      
      // Recursively process any chained specials from this activation
      result.chainedSpecials.forEach(chained => {
        if (!processedSpecials.has(`${chained.row}-${chained.col}`)) {
          processChainedSpecial(chained, depth + 1, special.row, special.col);
        }
      });
    };
    
    // Process initial chained specials at depth 2 (combo is depth 1)
    chainedSpecials.forEach((special, index) => {
      processChainedSpecial(special, 2, effectRow, effectCol);
    });
    
    // v8.10: Apply victory round multiplier
    const totalComboPoints = points + cascadePoints;
    const finalComboPoints = victoryRoundActive ? Math.floor(totalComboPoints * VICTORY_ROUND_MULTIPLIER) : totalComboPoints;

    // v11.8: record the combo as a history event. Strip the "+NNN" suffix
    // from the message (added by the activation code) for a cleaner breakdown.
    const comboDescription = (message || `Special combo (${combo})`).replace(/ \+\d+$/, '');
    const comboBaseFinal = victoryRoundActive ? Math.floor(points * VICTORY_ROUND_MULTIPLIER) : points;
    recordScoringEvent({
      type: 'special-combo',
      description: comboDescription,
      points: comboBaseFinal,
      multiplier: victoryRoundActive ? VICTORY_ROUND_MULTIPLIER : 1,
      baseScore: points,
      tiles: [{ row: row1, col: col1 }, { row: row2, col: col2 }],
      cascadeDepth: 0,
    });
    if (cascadePoints > 0) {
      const cascadeFinal = victoryRoundActive ? Math.floor(cascadePoints * VICTORY_ROUND_MULTIPLIER) : cascadePoints;
      recordScoringEvent({
        type: 'combo-cascade',
        description: `Cascade chain from combo`,
        points: cascadeFinal,
        multiplier: victoryRoundActive ? VICTORY_ROUND_MULTIPLIER : 1,
        baseScore: cascadePoints,
        tiles: uniqueTiles.filter(t =>
          !(t.row === row1 && t.col === col1) && !(t.row === row2 && t.col === col2)
        ).slice(0, 20),
        cascadeDepth: 1,
      });
    }

    // v8.4: Award points and show popup at swap destination
    addScorePopup(effectRow, effectCol, finalComboPoints, message);
    setScore(prev => prev + finalComboPoints);
    setCurrentTurnScore(prev => prev + finalComboPoints);
    if (victoryRoundActive) {
      setVictoryRoundScore(prev => prev + finalComboPoints);
    }
    setMatchedTiles(uniqueTiles);

    // Remove tiles and apply gravity
    pipelineTimeout(() => {
      const newGrid = currentGrid.map(r => r.map(t => t ? { ...t } : null));
      uniqueTiles.forEach(({ row, col }) => { newGrid[row][col] = null; });
      // Fix: place specials from any additional 4+ matches the swap created.
      if (additionalGroups.length > 0) {
        const clearedSet = new Set(uniqueTiles.map(t => `${t.row}-${t.col}`));
        const claimedPositions = new Set();
        [...additionalGroups].sort((a, b) => b.totalUniqueTiles - a.totalUniqueTiles).forEach(group => {
          let bestTile = null;
          if (swapPosition) {
            const inGroup = group.tiles.some(t => t.row === swapPosition.row && t.col === swapPosition.col);
            if (inGroup && !claimedPositions.has(`${swapPosition.row}-${swapPosition.col}`)) bestTile = swapPosition;
          }
          if (!bestTile) {
            let cRow = 0, cCol = 0;
            group.tiles.forEach(t => { cRow += t.row; cCol += t.col; });
            cRow = Math.round(cRow / group.tiles.length); cCol = Math.round(cCol / group.tiles.length);
            let bestDist = Infinity;
            group.tiles.forEach(t => { const dist = Math.abs(t.row - cRow) + Math.abs(t.col - cCol); if (dist < bestDist && !claimedPositions.has(`${t.row}-${t.col}`)) { bestDist = dist; bestTile = t; } });
            if (!bestTile) bestTile = group.tiles.find(t => !claimedPositions.has(`${t.row}-${t.col}`));
          }
          if (bestTile) {
            const posKey = `${bestTile.row}-${bestTile.col}`;
            if (!claimedPositions.has(posKey) && clearedSet.has(posKey)) {
              let specialType = 'line';
              if (group.totalUniqueTiles >= HYPERNOVA_MIN_TILES) specialType = 'hypernova';
              else if (group.totalUniqueTiles >= SUPERNOVA_MIN_TILES) specialType = 'supernova';
              else if (group.totalUniqueTiles === 5) { const rows = new Set(group.tiles.map(t => t.row)), cols = new Set(group.tiles.map(t => t.col)); specialType = (rows.size > 1 && cols.size > 1) ? 'cross' : 'bomb'; }
              newGrid[bestTile.row][bestTile.col] = { type: group.tileType ?? 0, id: `special-${bestTile.row}-${bestTile.col}-${Date.now()}`, special: specialType, isNew: false, animX: bestTile.col * (TILE_SIZE + TILE_GAP), animY: bestTile.row * (TILE_SIZE + TILE_GAP) };
              group.tiles.forEach(t => claimedPositions.add(`${t.row}-${t.col}`));
            }
          }
        });
      }
      setGrid(newGrid);
      setMatchedTiles([]);

      pipelineTimeout(() => applyGravity(newGrid, 0), 400);
    }, isHypernovaEvent ? HYPERNOVA_MATCH_TRANSITION_MS : 400);
  };

  // v8.4: Added swapPosition parameter for special creation at swap location
  const removeMatches = (currentGrid, matchGroups, lShapeMatches, generation, connectedGroups = [], swapPosition = null) => {
    const newGrid = currentGrid.map(r => r.map(t => t ? { ...t } : null));
    const specialsToCreate = [];
    const claimedPositions = new Set();
    
    // Collect all tiles being cleared and check for specials
    const allTilesToClear = new Set();
    const specialsToActivate = [];
    const matchedSpecials = new Set(); // v8.3.2: Specials that were directly matched
    const processedSpecials = new Set(); // v8.3.2: Specials that have had popups shown
    
    // First pass: identify all matched tiles and any specials in them
    matchGroups.forEach(group => {
      group.tiles.forEach(({ row, col }) => {
        allTilesToClear.add(`${row}-${col}`);
        const tile = currentGrid[row]?.[col];
        if (tile?.special && !matchedSpecials.has(`${row}-${col}`)) {
          specialsToActivate.push({ row, col, type: tile.special });
          matchedSpecials.add(`${row}-${col}`);
        }
      });
    });
    
    // v8.1: Cascade Multiplier helper
    const getCascadeMultiplier = (cascadeDepth) => {
      if (cascadeDepth <= 1) return 1.0;
      if (cascadeDepth === 2) return 1.5;
      if (cascadeDepth === 3) return 2.0;
      if (cascadeDepth === 4) return 2.5;
      return 3.0; // Cap at 3x for depth 5+
    };
    
    // v8.3.2: Increased cascade delays for better visibility
    // v11.8: scale with playback speed so slow-motion extends cascade stagger
    const getCascadeDelay = (depth) => {
      if (depth <= 1) return 0;        // Immediate for first special
      return ((depth - 1) * 400) * (playbackSpeedRef.current || 1);
    };

    // v8.9: 40% longer popup durations
    // v11.8: scale with playback speed so popups stay visible
    const getCascadeDuration = (depth) => {
      const base = depth <= 1 ? 2800 : depth === 2 ? 3500 : 4200;
      return base * (playbackSpeedRef.current || 1);
    };
    
    // v8.3/v8.3.1: Trigger visual effects for cascade (with stagger support)
    const triggerCascadeEffects = (special, depth, sourceSpecial = null, staggerDelay = 0) => {
      const effectDelay = getCascadeDelay(depth) + staggerDelay;
      
      // E. Border glow before activation (200ms before the popup)
      setTimeout(() => {
        setGlowingTiles(prev => [...prev, { row: special.row, col: special.col, id: Date.now() }]);
        // Remove glow after 200ms
        setTimeout(() => {
          setGlowingTiles(prev => prev.filter(t => !(t.row === special.row && t.col === special.col)));
        }, 200);
      }, Math.max(0, effectDelay - 100));
      
      // A. Flash effect when activating (100ms white pulse)
      setTimeout(() => {
        setFlashingTiles(prev => [...prev, { row: special.row, col: special.col, id: Date.now() }]);
        // Remove flash after 100ms
        setTimeout(() => {
          setFlashingTiles(prev => prev.filter(t => !(t.row === special.row && t.col === special.col)));
        }, 100);
      }, effectDelay);
      
      // v8.5: Removed screen shake effect
      
      // F. "CHAIN!" text between specials (for depth > 1)
      if (depth > 1 && sourceSpecial) {
        const midRow = (sourceSpecial.row + special.row) / 2;
        const midCol = (sourceSpecial.col + special.col) / 2;
        setTimeout(() => {
          setChainTexts(prev => [...prev, {
            id: Date.now() + Math.random(),
            row: midRow,
            col: midCol,
            depth: depth
          }]);
          // Remove chain text after 800ms
          setTimeout(() => {
            setChainTexts(prev => prev.slice(1));
          }, 800);
        }, effectDelay - 50);
      }
    };
    
    // Activate all specials that were matched
    let totalSpecialPoints = 0;
    const allSpecialClears = new Set();
    let cascadeCount = 0; // v8.1: Track cascade depth
    
    // v8.3.2: Rewritten cascade processing with better tracking
    const processSpecialWithCascade = (special, depth, sourceSpecial = null, staggerIndex = 0) => {
      const posKey = `${special.row}-${special.col}`;
      
      // v10 Fix 3: Mark as processed immediately on entry — was only added after
      // result.message check, causing chaining to skip if message was empty
      if (processedSpecials.has(posKey)) return;
      processedSpecials.add(posKey);
      
      // v8.3: Trigger visual effects
      // v8.3.1: Add stagger for multiple depth-1 specials
      const staggerDelay = depth === 1 ? staggerIndex * 150 : 0; // 150ms between each depth-1 special
      triggerCascadeEffects(special, depth, sourceSpecial, staggerDelay);
      
      const result = activateSpecialTile(special.row, special.col, currentGrid, allSpecialClears);
      const cascadeMultiplier = getCascadeMultiplier(depth);
      const multipliedPoints = Math.floor(result.points * cascadeMultiplier);
      
      // v8.2: Get staggered delay and duration
      // v8.3.1: Add stagger for multiple depth-1 specials
      const popupDelay = getCascadeDelay(depth) + staggerDelay;
      const popupDuration = getCascadeDuration(depth);
      
      totalSpecialPoints += multipliedPoints;
      result.tilesToClear.forEach(t => allTilesToClear.add(`${t.row}-${t.col}`));
      
      if (result.message) {
        // v8.1: Show cascade multiplier in popup for chained specials
        // v8.2: Add delay and duration
        // v8.6: Cascade popups at top rows
        if (depth > 1) {
          const cascadeMessage = `🔥 CASCADE x${cascadeMultiplier.toFixed(1)}! ${result.message.split('!')[0]}! +${multipliedPoints}`;
          // v8.6: Depth 2 → row 0, Depth 3 → row 1, Depth 4+ → row 2
          const popupRow = Math.min(depth - 2, 2);
          addScorePopup(popupRow, special.col, multipliedPoints, cascadeMessage, popupDelay, popupDuration);
        } else {
          addScorePopup(special.row, special.col, multipliedPoints, result.message, popupDelay, popupDuration);
        }
        // v8.3.2: Mark as processed (popup shown) — moved to top of function in v10
      }

      // v11.8: record this special activation as a history event
      if (result.points > 0) {
        const finalPointsForEvent = victoryRoundActive ? Math.floor(multipliedPoints * VICTORY_ROUND_MULTIPLIER) : multipliedPoints;
        const specialLabel = (result.message || 'special').split('!')[0].trim();
        const description = depth > 1
          ? `Cascade ×${cascadeMultiplier.toFixed(1)} — ${specialLabel}`
          : specialLabel;
        recordScoringEvent({
          type: depth > 1 ? 'cascade-special' : 'special-activation',
          description,
          points: finalPointsForEvent,
          multiplier: cascadeMultiplier * (victoryRoundActive ? VICTORY_ROUND_MULTIPLIER : 1),
          baseScore: result.points,
          tiles: [{ row: special.row, col: special.col }, ...result.tilesToClear.slice(0, 15)],
          cascadeDepth: depth,
        });
      }

      cascadeCount = Math.max(cascadeCount, depth);
      
      // Process chained specials at next depth level
      // v8.3.2: Check processedSpecials instead of old alreadyActivated
      result.chainedSpecials.forEach((chained, chainIndex) => {
        const chainedKey = `${chained.row}-${chained.col}`;
        if (!processedSpecials.has(chainedKey)) {
          processSpecialWithCascade(chained, depth + 1, special, chainIndex);
        }
      });
    };
    
    // Process initial specials at depth 1
    // v8.3.1: Add stagger between multiple depth-1 specials so popups don't overlap
    specialsToActivate.forEach((special, index) => {
      processSpecialWithCascade(special, 1, null, index);
    });
    
    // Add special points to score - v8.10: Apply victory round multiplier
    if (totalSpecialPoints > 0) {
      const finalSpecialPoints = victoryRoundActive ? Math.floor(totalSpecialPoints * VICTORY_ROUND_MULTIPLIER) : totalSpecialPoints;
      setScore(prev => prev + finalSpecialPoints);
      setCurrentTurnScore(prev => prev + finalSpecialPoints);
      if (victoryRoundActive) {
        setVictoryRoundScore(prev => prev + finalSpecialPoints);
      }
    }
    
    // OPTION B: Use connectedGroups for special creation based on TOTAL UNIQUE TILES
    // v10 Fix 2: Removed generation cap — was blocking special creation after deep cascades.
    if (connectedGroups && connectedGroups.length > 0) {
      // Sort by total unique tiles (largest first)
      const sortedConnected = [...connectedGroups].sort((a, b) => b.totalUniqueTiles - a.totalUniqueTiles);
      
      sortedConnected.forEach(group => {
        if (group.totalUniqueTiles >= 4) {
          // v8.4: Prioritize swap position if it's within this match group
          let bestTile = null;
          
          if (swapPosition && generation === 0) {
            // Check if swap position is in this group
            const swapInGroup = group.tiles.some(t => t.row === swapPosition.row && t.col === swapPosition.col);
            if (swapInGroup && !claimedPositions.has(`${swapPosition.row}-${swapPosition.col}`)) {
              bestTile = swapPosition;
            }
          }
          
          // Fallback: Find center tile if swap position not usable
          if (!bestTile) {
            let centerRow = 0, centerCol = 0;
            group.tiles.forEach(t => { centerRow += t.row; centerCol += t.col; });
            centerRow = Math.round(centerRow / group.tiles.length);
            centerCol = Math.round(centerCol / group.tiles.length);
            
            // Find the actual tile closest to center that's in the group AND not claimed
            let bestDist = Infinity;
            group.tiles.forEach(t => {
              const dist = Math.abs(t.row - centerRow) + Math.abs(t.col - centerCol);
              if (dist < bestDist && !claimedPositions.has(`${t.row}-${t.col}`)) {
                bestDist = dist;
                bestTile = t;
              }
            });
            
            // v9.8: If all center tiles are claimed, find ANY unclaimed tile in the group
            if (!bestTile) {
              bestTile = group.tiles.find(t => !claimedPositions.has(`${t.row}-${t.col}`));
            }
          }
          
          // v9.8: Only proceed if we found an unclaimed tile
          // v10 Fix 2b: Also verify the target cell will actually be empty (in allTilesToClear)
          if (bestTile) {
            const posKey = `${bestTile.row}-${bestTile.col}`;
            const willBeEmpty = allTilesToClear.has(posKey);
            if (!claimedPositions.has(posKey) && willBeEmpty) {
              let specialType = 'line';
              // OPTION B: Use totalUniqueTiles for determination
              if (group.totalUniqueTiles >= HYPERNOVA_MIN_TILES) specialType = 'hypernova';
              else if (group.totalUniqueTiles >= SUPERNOVA_MIN_TILES) specialType = 'supernova';
              else if (group.totalUniqueTiles === 5) {
                // v8.3.1: Fixed L-shape detection - check if group itself spans both directions
                // A straight line has either: all same row (horizontal) or all same column (vertical)
                // An L-shape spans multiple rows AND multiple columns
                const rows = new Set(group.tiles.map(t => t.row));
                const cols = new Set(group.tiles.map(t => t.col));
                const isLShape = rows.size > 1 && cols.size > 1;
                specialType = isLShape ? 'cross' : 'bomb';
              }
              // 4 tiles = line (default) - no special for 4-tile L-shapes
              
              const tileColor = group.tileType ?? 0;
              specialsToCreate.push({ row: bestTile.row, col: bestTile.col, type: specialType, tileColor });
              group.tiles.forEach(t => claimedPositions.add(`${t.row}-${t.col}`));
            }
          }
        }
      });
    } else {
      // Fallback to old logic if no connectedGroups (shouldn't happen)
      const sortedGroups = [...matchGroups].sort((a, b) => b.length - a.length);
      
      sortedGroups.forEach(group => {
        if (group.length >= 4 && generation < 3) {
          const midIndex = Math.floor(group.tiles.length / 2);
          const midTile = group.tiles[midIndex];
          const posKey = `${midTile.row}-${midTile.col}`;
          
          if (!claimedPositions.has(posKey)) {
            let specialType = 'line';
            if (group.length >= HYPERNOVA_MIN_TILES) specialType = 'hypernova';
            else if (group.length >= SUPERNOVA_MIN_TILES) specialType = 'supernova';
            else if (group.length === 5) specialType = 'bomb';
            
            const tileColor = currentGrid[midTile.row]?.[midTile.col]?.type ?? 0;
            specialsToCreate.push({ row: midTile.row, col: midTile.col, type: specialType, tileColor });
            group.tiles.forEach(t => claimedPositions.add(`${t.row}-${t.col}`));
          }
        }
      });
      
      // v7.2: Removed old L-shape→cross logic (4-tile L-shapes are regular matches now)
    }
    
    // Clear all matched tiles (including special effect tiles)
    allTilesToClear.forEach(posKey => {
      const [row, col] = posKey.split('-').map(Number);
      newGrid[row][col] = null;
    });
    
    // Create special tiles from 4+ tile matches
    // NEW IN v6.6: Always create specials if match qualifies, even if a special was activated
    specialsToCreate.forEach(({ row, col, type, tileColor }) => {
      newGrid[row][col] = {
        type: tileColor,
        id: `special-${row}-${col}-${Date.now()}`,
        special: type,
        isNew: false,
        animX: col * (TILE_SIZE + TILE_GAP),
        // v11.1 Fix 3: start one tile-height above final position so the special
        // tile drops in rather than popping into existence instantly
        animY: (row - 1) * (TILE_SIZE + TILE_GAP)
      };
    });
    
    setGrid(newGrid);
    setMatchedTiles([]);
    
    pipelineTimeout(() => applyGravity(newGrid, generation), 500);
  };
  
  const applyGravity = (currentGrid, generation) => {
    const newGrid = currentGrid.map(r => r.map(t => t ? { ...t } : null));
    
    for (let col = 0; col < COLS; col++) {
      let emptyRow = ROWS - 1;
      for (let row = ROWS - 1; row >= 0; row--) {
        if (newGrid[row][col] !== null) {
          if (row !== emptyRow) {
            newGrid[emptyRow][col] = newGrid[row][col];
            newGrid[emptyRow][col].animY = row * (TILE_SIZE + TILE_GAP); // Animate from old position
            newGrid[row][col] = null;
          }
          emptyRow--;
        }
      }
    }
    
    setGrid(newGrid);
    pipelineTimeout(() => fillEmptySpaces(newGrid, generation), 400);
  };
  
  const fillEmptySpaces = (currentGrid, generation) => {
    const newGrid = currentGrid.map(r => r.map(t => t ? { ...t, isNew: false } : null));
    
    for (let col = 0; col < COLS; col++) {
      let emptyCount = 0;
      for (let row = 0; row < ROWS; row++) {
        if (newGrid[row][col] === null) emptyCount++;
      }
      
      for (let row = 0; row < ROWS; row++) {
        if (newGrid[row][col] === null) {
          newGrid[row][col] = {
            type: Math.floor(Math.random() * TILE_TYPES),
            id: `${row}-${col}-${Date.now()}-${Math.random()}`,
            special: null,
            isNew: true,
            animX: col * (TILE_SIZE + TILE_GAP),
            animY: -emptyCount * (TILE_SIZE + TILE_GAP) // Start above board
          };
          emptyCount--;
        }
      }
    }
    
    setGrid(newGrid);

    pipelineTimeout(() => {
      const { matches, matchGroups, lShapeMatches, connectedGroups } = findMatches(newGrid);
      if (matches.length > 0) {
        const comboIncrease = matchGroups.length + (lShapeMatches?.length || 0);
        setCombo(prev => {
          const newCombo = prev + comboIncrease;
          setMaxComboReached(current => Math.max(current, newCombo));
          return newCombo;
        });
        // v10.2 Fix #1: Use comboRef.current (not stale combo closure) for accurate cascade multiplier
        processMatches(newGrid, matchGroups, lShapeMatches, comboRef.current + comboIncrease, generation + 1, connectedGroups);
      } else {
        // No more matches - turn is complete
        // v10 Fix 1: setIsAnimating(false) moved inside the setTimeout alongside
        // setTurnComplete(true) — eliminates the 100ms window where isAnimating=false
        // but turnComplete=false, which could trigger a premature game-end check
        // v10.3 Fix A: Use comboRef.current (not stale combo closure) so lastCombo
        // correctly reflects the final accumulated combo value from the cascade.
        setLastCombo(comboRef.current);
        setCombo(0);
        setTimeout(() => {
          setIsAnimating(false);
          setTurnComplete(true);
          flushTurn(); // v11.8: commit this turn's scoring events to history
          checkForValidMoves(newGrid);
        }, 100);
      }
    }, 500);
  };
  
  const checkForValidMoves = (currentGrid) => {
    if (gameState !== 'playing') return;
    // v10 Fix 7: re-check gameState inside the timeout — game could end during the 300ms wait
    setTimeout(() => {
      if (gameState !== 'playing') return;
      if (!hasValidMoves(currentGrid)) {
        setShowNoMoves(true);
      }
    }, 300);
  };
  
  // =============================================================================
  // SHUFFLE FUNCTIONS (free shuffle on no-moves only)
  // =============================================================================
  
  // Free shuffle triggered by no-moves dialog
  const shuffleBoardFree = () => {
    setShowNoMoves(false);
    performShuffle();
  };
  
  // Core shuffle logic
  const performShuffle = () => {
    performShuffleOnGrid(grid);
  };
  
  const performShuffleOnGrid = (currentGrid) => {
    setIsAnimating(true);
    
    const tiles = [];
    currentGrid.forEach(row => {
      row.forEach(tile => {
        if (tile) tiles.push({ ...tile, isNew: false });
      });
    });
    
    for (let i = tiles.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [tiles[i], tiles[j]] = [tiles[j], tiles[i]];
    }
    
    const newGrid = [];
    let tileIndex = 0;
    for (let row = 0; row < ROWS; row++) {
      newGrid[row] = [];
      for (let col = 0; col < COLS; col++) {
        if (tileIndex < tiles.length) {
          newGrid[row][col] = { 
            ...tiles[tileIndex], 
            id: `${row}-${col}-${Date.now()}`, 
            isNew: true,
            animX: col * (TILE_SIZE + TILE_GAP),
            animY: row * (TILE_SIZE + TILE_GAP)
          };
          tileIndex++;
        }
      }
    }
    
    setGrid(newGrid);
    setTimeout(() => setIsAnimating(false), 600);
  };
  
  // =============================================================================
  // UTILITY FUNCTIONS
  // =============================================================================
  
  // v8.0: Increased combo multiplier (4.0 + 0.2 per level for 6+)
  const getMultiplier = (comboValue) => {
    if (comboValue === 0) return 1.0;
    if (comboValue === 1) return 1.5;
    if (comboValue === 2) return 2.0;
    if (comboValue === 3) return 2.5;
    if (comboValue === 4) return 3.0;
    if (comboValue === 5) return 3.5;
    if (comboValue >= 6) return 4.0 + (comboValue - 6) * 0.2;
    return 1.0;
  };
  
  // v8.9: Default duration increased 40% (2000 → 2800)
  const addScorePopup = (row, col, points, text = null, delay = 0, duration = 2800) => {
    setScorePopups(prev => [...prev, {
      id: Date.now() + Math.random(),
      row, col, points, text,
      combo,
      delay,      // v8.2: ms before popup appears
      duration,   // v8.2: how long popup lingers (ms)
      createdAt: Date.now()  // v8.2: track creation time for cleanup
    }]);
  };
  
  const restartGame = () => {
    setGrid(initializeGrid());
    setScore(0);
    // V-2: In VERSES_MODE restart re-seeds moves/target from the active
    // level (not the arcade random). Reveal index resets to 0 so chunk
    // 0 is pre-visible again.
    if (VERSES_MODE && versesLevel) {
      setMoves(versesLevel.moves);
      setLevelTarget(versesLevel.target);
    } else {
      setMoves(MIN_MOVES + Math.floor(Math.random() * (MAX_MOVES - MIN_MOVES + 1)));
      const rawTarget = BASE_TARGET + Math.floor(Math.random() * TARGET_VARIANCE) + difficultyBonus;
      setLevelTarget(Math.round(rawTarget / 100) * 100);
    }
    setGameState('playing');
    setSelectedTile(null);
    setIsAnimating(false);
    setMatchedTiles([]);
    setScorePopups([]);
    setCombo(0);
    setLastCombo(0);
    setShowNoMoves(false);
    setMaxComboReached(0);
    setTargetReached(false);
    setPendingSpecials([]);
    setCurrentTurnScore(0);
    setSpecialBonusMultiplier(0);
    setTurnComplete(true);
    // v8.10: Reset victory round state
    setShowVictoryPrompt(false);
    setVictoryRoundActive(false);
    setVictoryRoundScore(0);
    setPreVictoryScore(0);
    setLastMilestoneShown(0);
    // v10 Fix 6: Clear visual state that was orphaned on restart
    setFlashingTiles([]);
    setGlowingTiles([]);
    setChainTexts([]);
    // v10.3 Fix B: Clear animation position cache so new tiles don't inherit stale positions
    animStateRef.current = {};
    // v10.4: Reset bonus move tracking
    bonusMoveThresholdRef.current = 0;
    bonusMoveFlashPendingRef.current = 0;
    setBonusMoveFlash(0);
    // v11.6: Reset bonus moves flow (bonusMoves persists — not reset here)
    usingBonusMovesRef.current = false;
    setUsingBonusMoves(false);
    setShowBonusMovesPrompt(false);
    // v11.8: Clear scoring history for the new game
    clearScoringHistory();
    // v11.9: Reset end-confirm popup state
    setShowEndConfirm(false);
    // V-2: Reset verses memorize-mode state. Reveal tracking needs
    // prevMovesRef cleared so the bump from 0 back to initial moves
    // doesn't register as a decrement. Bonus-moves pool (bonusMoves)
    // is also zeroed under VERSES_MODE — V-2 has no consumption path
    // for earned bonus moves, so persisting them across a Play Again
    // would just stockpile dead currency. V-4 wires the consume +
    // arcade handoff.
    if (VERSES_MODE) {
      setRevealedChunkIndex(0);
      setShowTargetToast(false);
      setShowPassageModal(false);
      // v1.2: re-show the start-of-round passage modal so the player
      // sees the full target before the next run begins.
      setShowStartModal(true);
      prevMovesRef.current = null;
      setBonusMoves(0);
      try { localStorage.setItem(BONUS_MOVES_KEY, '0'); } catch {}
    }
    // v11.9: If the previous game was a loss, reset currentRun now that a new
    // game is starting. If the previous game was a win, currentRun stays so
    // the new game continues the streak. Key check: was the *just-ended*
    // gameState 'gameover'? We read it before restartGame overwrites it.
    // (No-op in VERSES_MODE — gameState never transitions to gameover.)
    if (gameState === 'gameover') {
      setCurrentRun(0);
      try { localStorage.setItem(RUN_CURRENT_KEY, '0'); } catch {}
    }
  };
  
  // =============================================================================
  // RENDER
  // =============================================================================
  
  // v9.0: Calculate special count for header display
  const specialCount = countSpecialsOnBoard();
  
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      fontFamily: 'Arial, sans-serif',
      padding: '20px',
      paddingBottom: '60px',
      touchAction: 'none',
      userSelect: 'none'
    }}>
      {/* Header */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.95)',
        borderRadius: '15px',
        padding: VERSES_MODE ? '10px 20px' : '12px 20px',
        marginBottom: VERSES_MODE ? '14px' : '20px',
        boxShadow: '0 8px 16px rgba(0,0,0,0.2)',
        width: `${boardWidth + 30}px`,
        // v1.4 (V-3a follow-up): drop the 80px minHeight in VERSES_MODE
        // so the header sizes to content; flex-start + small gap removes
        // the dead whitespace that v1.3's space-between left between the
        // title and the Score/Moves/Target row.
        minHeight: VERSES_MODE ? undefined : '110px',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: VERSES_MODE ? 'flex-start' : 'space-between',
        gap: VERSES_MODE ? '6px' : undefined,
        position: 'relative'
      }}>
        {/* V-3a: Back-to-picker button (VERSES_MODE only). Top-left,
            mirrors the dark/light toggle's positioning. Always
            clickable during play; no confirmation popup per spec
            (V-3 has no persistence, so a misclick = restart, not
            lost data). */}
        {VERSES_MODE && onBack && (
          <button
            onClick={onBack}
            style={{
              position: 'absolute',
              top: '8px',
              left: '8px',
              background: 'transparent',
              border: 'none',
              fontSize: '14px',
              cursor: 'pointer',
              padding: '4px 8px',
              borderRadius: '4px',
              color: '#667eea',
              fontWeight: 500,
              opacity: 0.85,
              transition: 'opacity 0.2s'
            }}
            onMouseEnter={(e) => e.target.style.opacity = 1}
            onMouseLeave={(e) => e.target.style.opacity = 0.85}
            title="Back to picker"
          >
            ← Back
          </button>
        )}
        {/* v8.0: Dark/Light Mode Toggle */}
        <button
          onClick={() => setIsDarkMode(!isDarkMode)}
          style={{
            position: 'absolute',
            top: '8px',
            right: '8px',
            background: 'transparent',
            border: 'none',
            fontSize: '20px',
            cursor: 'pointer',
            padding: '4px',
            borderRadius: '4px',
            opacity: 0.7,
            transition: 'opacity 0.2s'
          }}
          onMouseEnter={(e) => e.target.style.opacity = 1}
          onMouseLeave={(e) => e.target.style.opacity = 0.7}
          title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {isDarkMode ? '☀️' : '🌙'}
        </button>
        
        {/* V-2: Content-driven header — title from the active verses
            game (e.g. "Titus 2:11–13"). No version badge inline; the
            version lives in the filename and the landing-page card.
            v1.2: dropped the Georgia font override — the Arial header
            chrome reads better for the title; Georgia is reserved for
            content typography (text bar + passage modal). */}
        {/* V-3b: title + (optional) inline "Level N of M" indicator
            for multi-level games. Inlined as a small span after the
            title to keep the header at one row — same shrink
            principle as V-2's "fit in viewport without scrolling"
            work. */}
        <h1 style={{ margin: '0', color: '#333', fontSize: '20px', textShadow: '2px 2px 4px rgba(0,0,0,0.1)' }}>
          {VERSES_MODE && versesGame ? (
            <>
              {versesGame.title}
              {isMultiLevel && Array.isArray(versesGame.levels) && (
                <span style={{
                  fontSize: '13px',
                  color: '#777',
                  fontFamily: 'Georgia, serif',
                  fontStyle: 'italic',
                  fontWeight: 400,
                  marginLeft: '10px',
                }}>
                  · Level {levelIndex + 1} of {versesGame.levels.length}
                </span>
              )}
            </>
          ) : (
            <>Verses <span style={{ fontSize: '12px', color: '#ccc' }}>v1.5</span></>
          )}
        </h1>
        <div style={{
          display: 'flex',
          justifyContent: 'space-around',
          fontSize: '16px',
          fontWeight: 'bold',
          color: '#555'
        }}>
          {/* v11.2: Long-press score for 1.5s to open admin panel */}
          <div
            onPointerDown={() => { adminPressTimerRef.current = setTimeout(() => setShowAdmin(true), 1500); }}
            onPointerUp={() => clearTimeout(adminPressTimerRef.current)}
            onPointerLeave={() => clearTimeout(adminPressTimerRef.current)}
            style={{ cursor: 'default', userSelect: 'none' }}
          >
            Score: <span style={{ color: '#667eea' }}>{score}</span>
          </div>
          {/* v10.5: Moves counter with bonus-move burst animation */}
          <div style={{ position: 'relative' }}>
            Moves: <span style={{ color: '#667eea' }}>{moves}</span>
            {bonusMoveFlash > 0 && (
              <span
                key={bonusMoveFlash}
                style={{
                  position: 'absolute',
                  top: '-8px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  fontSize: '28px',
                  fontWeight: '900',
                  color: '#00C853',
                  textShadow: '0 0 12px #00C853, 0 0 24px #00C853, 1px 1px 0 #000',
                  pointerEvents: 'none',
                  whiteSpace: 'nowrap',
                  animation: 'bonusMoveBurst 4s ease-out forwards'
                }}
              >
                +1 bonus move
              </span>
            )}
          </div>
          {/* v11.6: Single bonus moves counter — persistent, shown when non-zero
              v11.9: amber messaging at/above WARN, red at cap (mirrors campaign v1.25) */}
          {bonusMoves > 0 && (
            <div title="Bonus moves carry forward to future games" style={{ position: 'relative' }}>
              Bonus moves:{' '}
              <span style={{
                color: bonusMoves >= BONUS_MOVES_CAP  ? '#d32f2f' :
                       bonusMoves >= BONUS_MOVES_WARN ? '#e65100' :
                       usingBonusMoves ? '#e65100' : '#667eea',
                fontWeight: 'bold'
              }}>
                {bonusMoves}
                {bonusMoves >= BONUS_MOVES_WARN && (
                  <span style={{
                    fontSize: '10px',
                    color: bonusMoves >= BONUS_MOVES_CAP ? '#d32f2f' : '#e65100',
                    marginLeft: '4px'
                  }}>
                    / {BONUS_MOVES_CAP}
                  </span>
                )}
              </span>
              {bonusMoves >= BONUS_MOVES_WARN && (
                <div style={{
                  fontSize: '10px',
                  fontWeight: 'normal',
                  color: bonusMoves >= BONUS_MOVES_CAP ? '#d32f2f' : '#e65100',
                  marginTop: '2px',
                  lineHeight: '1.2',
                }}>
                  {bonusMoves >= BONUS_MOVES_CAP
                    ? 'Cap reached — no additional moves can be earned'
                    : `Nearing cap — max ${BONUS_MOVES_CAP}`}
                </div>
              )}
            </div>
          )}
          {/* V-2/V-4: In VERSES_MODE, target display flips gold + ✓
              once targetReached is true and stays that way through
              end-of-round. V-4 appends "· 1.5×" while victoryRoundActive
              is true so the player has a persistent indicator that
              scoring is currently boosted (the toast disappears after
              2.5s). */}
          <div>Target: <span style={{
            color: (VERSES_MODE && targetReached) ? '#d4a017' : '#667eea',
            fontWeight: (VERSES_MODE && targetReached) ? 'bold' : 'inherit',
          }}>
            {levelTarget}{VERSES_MODE && targetReached ? ' ✓' : ''}
            {VERSES_MODE && victoryRoundActive ? ' · 1.5×' : ''}
          </span></div>
          {/* v11.3: "End level" button — visible while using extra moves
              v11.9: routes through requestEndLevelCarryBonus so an
              are-you-sure confirm fires if the player is below target. */}
          {usingBonusMoves && (
            <button
              onClick={requestEndLevelCarryBonus}
              style={{
                padding: '4px 12px',
                fontSize: '13px',
                background: '#667eea',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: 'bold',
              }}
            >
              End and carry moves forward
            </button>
          )}
        </div>
        
        {/* v9.0: Show special count.
            v1.3 (Verses): hidden in VERSES_MODE — useful for arcade,
            noise for memorization. */}
        {!VERSES_MODE && (
          <div style={{ fontSize: '12px', color: '#888' }}>
            ✨ Specials on board: {specialCount}
          </div>
        )}
        
        {/* v8.10: Victory Round banner.
            V-4: suppressed in VERSES_MODE — the multiplier is silent
            per V-2 spec (just the target-hit toast + persistent
            "· 1.5×" on the header Target field). The big arcade
            banner dominates the view and competes with the text bar,
            which defeats the point of memorize mode. */}
        {!VERSES_MODE && victoryRoundActive && (
          <div style={{
            background: 'linear-gradient(90deg, #FFD700 0%, #FFA500 50%, #FFD700 100%)',
            padding: '8px 16px',
            borderRadius: '8px',
            marginTop: '8px',
            textAlign: 'center',
            fontWeight: 'bold',
            fontSize: '16px',
            color: '#333',
            boxShadow: '0 0 15px rgba(255, 215, 0, 0.5)',
            animation: 'pulse 1.5s ease-in-out infinite'
          }}>
            🌟 VICTORY ROUND - {VICTORY_ROUND_MULTIPLIER}x ALL POINTS! 🌟
          </div>
        )}
        
        {/* Combo display - v8.0: now shows multiplier value */}
        {/* v10.2 Fix #4: Also check gameState so stale lastCombo never flashes on a fresh game */}
        {/* v1.3 (Verses): entire slot hidden in VERSES_MODE. Score
            popups over the board still show points + multiplier per
            match, so mechanic feedback stays where the player is
            looking. Also drops the idle-state high-score / best-combo
            line (arcade-only). */}
        {!VERSES_MODE && (
        <div style={{ minHeight: '24px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          {gameState === 'playing' && (combo > 0 || lastCombo > 0) && (
            <div style={{
              fontSize: '20px',  // v8.9: bigger (was 16px)
              color: (combo > 0 ? combo : lastCombo) >= 10 ? '#FF4500' : 
                     (combo > 0 ? combo : lastCombo) >= 5 ? '#FFD700' : '#FF8C00',
              fontWeight: 'bold',
              textShadow: (combo > 0 ? combo : lastCombo) >= 5 
                ? '0 0 10px currentColor, 2px 2px 4px rgba(0,0,0,0.3)' 
                : '1px 1px 2px rgba(0,0,0,0.2)',
              opacity: combo > 0 ? 1 : 0.7,
              transform: (combo > 0 ? combo : lastCombo) >= 10 ? 'scale(1.1)' : 'scale(1)'
            }}>
              {(combo > 0 ? combo : lastCombo) >= 15 ? '💥 LEGENDARY' :
               (combo > 0 ? combo : lastCombo) >= 10 ? '⚡ ULTRA COMBO' :
               (combo > 0 ? combo : lastCombo) >= 5 ? '🌟 MEGA COMBO' : '🔥 COMBO'} x{(combo > 0 ? combo : lastCombo) + 1}
              <span style={{ marginLeft: '8px', fontSize: '16px', color: '#667eea' }}>
                ({getMultiplier(combo > 0 ? combo : lastCombo).toFixed(1)}x pts)
              </span>
            </div>
          )}
          {!(combo > 0 || lastCombo > 0) && (highScore > 0 || allTimeHighCombo > 0) && (
            <div style={{ fontSize: '12px', color: '#888', display: 'flex', gap: '15px', justifyContent: 'center' }}>
              {highScore > 0 && <span>🏆 {highScore}</span>}
              {allTimeHighCombo > 0 && <span>🔥 Best: x{allTimeHighCombo + 1}</span>}
            </div>
          )}
        </div>
        )}
      </div>

      {/* V-2 / V-4: Rolling 3-chunk text bar. Current chunk + 2 prior.
          Georgia serif; two-column grid (reference flush-left, content
          indented).
          V-4 (post-playtest tune): main chunk 20px / prior 15px,
          reference always 15px regardless of row (no longer scales
          with current-row size). The left-border accent + tinted
          background were tried as a "highlight" but the playtester
          reported they didn't help — bigger font + bolder weight is
          enough on its own. */}
      {VERSES_MODE && versesLevel && (() => {
        const start = Math.max(0, revealedChunkIndex - 2);
        const end = Math.min(versesLevel.totalChunks - 1, revealedChunkIndex);
        const rows = [];
        for (let i = start; i <= end; i++) rows.push({ ...versesLevel.flatChunks[i], idx: i });
        return (
          <div style={{
            background: 'rgba(255, 255, 255, 0.95)',
            borderRadius: '15px',
            padding: '12px 20px',
            marginBottom: '12px',
            boxShadow: '0 8px 16px rgba(0,0,0,0.2)',
            width: `${boardWidth + 30}px`,
            fontFamily: 'Georgia, serif',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-end',
            gap: '4px',
            overflow: 'hidden',
          }}>
            {rows.map(row => {
              const isCurrent = row.idx === revealedChunkIndex;
              return (
                <div
                  key={row.idx}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '110px 1fr',
                    columnGap: '8px',
                    alignItems: 'baseline',
                    color: isCurrent ? '#1a1a1a' : '#888',
                    fontSize: isCurrent ? '20px' : '15px',
                    fontWeight: isCurrent ? 600 : 400,
                    lineHeight: 1.25,
                    animation: isCurrent ? `versesChunkIn ${CHUNK_REVEAL_FADE_MS}ms ease-out` : 'none',
                  }}
                >
                  <span style={{ textAlign: 'left', fontStyle: 'italic', whiteSpace: 'nowrap', fontSize: '15px' }}>
                    {row.reference ? `(${row.reference})` : ''}
                  </span>
                  <span>{row.content}</span>
                </div>
              );
            })}
          </div>
        );
      })()}

      {/* V-2: Target-hit toast — brief notification overlaying the top
          of the board area. Persistent target state-change (gold ✓) is
          rendered inline on the header Target field; this toast is the
          one-shot reinforcement. V-4 updates the copy to
          "Target reached — 1.5×!" when the scoring branch is wired. */}
      {VERSES_MODE && showTargetToast && (
        <div style={{
          position: 'fixed',
          top: '24px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'linear-gradient(135deg, #f5d76e 0%, #d4a017 100%)',
          color: '#333',
          padding: '12px 28px',
          borderRadius: '999px',
          fontFamily: 'Georgia, serif',
          fontSize: '18px',
          fontWeight: 'bold',
          boxShadow: '0 4px 18px rgba(0,0,0,0.3)',
          zIndex: 1500,
          pointerEvents: 'none',
          animation: 'versesToastIn 300ms ease-out',
        }}>
          ✓ Target reached — 1.5×!
        </div>
      )}

      {/* Game Board - Canvas */}
      <div 
        style={{
          background: isDarkMode ? 'rgba(0, 0, 0, 0.4)' : 'rgba(255, 255, 255, 0.95)',
          borderRadius: '15px',
          padding: '15px',
          boxShadow: isDarkMode ? '0 8px 16px rgba(0,0,0,0.3)' : '0 8px 16px rgba(0,0,0,0.15)',
          position: 'relative'
        }}>
        <canvas
          ref={canvasRef}
          onClick={handleCanvasClick}
          onMouseDown={handleDragStart}
          onMouseMove={handleDragMove}
          onMouseUp={handleDragEnd}
          onMouseLeave={handleDragEnd}
          onTouchStart={handleDragStart}
          onTouchMove={handleDragMove}
          onTouchEnd={handleDragEnd}
          style={{
            borderRadius: '10px',
            cursor: isAnimating ? 'default' : 'pointer',
            touchAction: 'none'
          }}
        />
        
        {/* v8.3: Chain text popups ("CHAIN!") */}
        {chainTexts.map(chain => (
          <div
            key={chain.id}
            style={{
              position: 'absolute',
              left: `${15 + chain.col * (TILE_SIZE + TILE_GAP) + TILE_SIZE / 2}px`,
              top: `${15 + chain.row * (TILE_SIZE + TILE_GAP) + TILE_SIZE / 2}px`,
              transform: 'translate(-50%, -50%)',
              fontSize: '14px',
              fontWeight: '900',
              color: '#FF6B6B',
              textShadow: '1px 1px 0px #000, -1px -1px 0px #000, 1px -1px 0px #000, -1px 1px 0px #000',
              pointerEvents: 'none',
              animation: 'chainPop 0.8s ease-out forwards',
              zIndex: 1100,
              whiteSpace: 'nowrap'
            }}
          >
            ⛓️ CHAIN x{chain.depth}!
          </div>
        ))}
        
        {/* Score Popups - v8.2: staggered delays and longer linger */}
        {/* v8.13: Supernova/Hypernova get higher z-index and longer duration */}
        {scorePopups.map(popup => {
          const isHypernova = popup.text?.includes('HYPERNOVA') || popup.text?.includes('🌠');
          const isSupernova = popup.text?.includes('SUPERNOVA') || popup.text?.includes('🌌');
          const priorityZIndex = isHypernova ? 2000 : isSupernova ? 1500 : 1000 + (popup.delay || 0);
          const priorityDuration = isHypernova ? 5000 : isSupernova ? 4500 : popup.duration;
          const priorityFontSize = isHypernova ? '22px' : isSupernova ? '20px' : (popup.text ? '18px' : '24px');
          
          return (
          <div
            key={popup.id}
            style={{
              position: 'absolute',
              left: `${15 + popup.col * (TILE_SIZE + TILE_GAP)}px`,
              top: `${15 + popup.row * (TILE_SIZE + TILE_GAP)}px`,
              fontSize: priorityFontSize,
              fontWeight: '900',
              color: isHypernova ? '#FF00FF' : isSupernova ? '#00FFFF' : (popup.delay > 0 ? '#FF6B6B' : '#FFD700'),
              textShadow: isHypernova || isSupernova 
                ? '0 0 20px currentColor, 2px 2px 0px #000, -1px -1px 0px #000' 
                : '2px 2px 0px #000, -1px -1px 0px #000, 1px -1px 0px #000, -1px 1px 0px #000, 0 0 15px rgba(255,215,0,0.9)',
              pointerEvents: 'none',
              animation: `scorePopup ${priorityDuration / 1000}s ease-out forwards`,
              animationDelay: `${popup.delay}ms`,
              opacity: 0,
              zIndex: priorityZIndex,
              whiteSpace: 'nowrap',
              background: popup.text ? 'rgba(0,0,0,0.9)' : 'transparent',
              padding: popup.text ? '10px 14px' : '0',
              borderRadius: popup.text ? '10px' : '0',
              border: popup.text ? `2px solid ${isHypernova ? '#FF00FF' : isSupernova ? '#00FFFF' : (popup.delay > 0 ? '#FF6B6B' : '#FFD700')}` : 'none',
              boxShadow: popup.text ? (isHypernova || isSupernova ? '0 0 30px currentColor' : '0 0 20px rgba(255,215,0,0.7)') : 'none'
            }}
          >
            {popup.text || `+${popup.points}`}
            {!popup.text && popup.combo > 0 && ` x${popup.combo + 1}`}
          </div>
        );})}
      </div>
      
      {/* No Valid Moves Dialog */}
      {showNoMoves && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 999
        }}>
          <div style={{
            background: 'white',
            borderRadius: '20px',
            padding: '30px',
            textAlign: 'center',
            maxWidth: '350px',
            boxShadow: '0 10px 40px rgba(0,0,0,0.3)'
          }}>
            <h3 style={{ fontSize: '24px', margin: '0 0 15px 0', color: '#FF8C00' }}>
              😓 No Valid Moves!
            </h3>
            <p style={{ fontSize: '16px', color: '#555', marginBottom: '20px' }}>
              Free shuffle to continue
            </p>
            <button
              onClick={shuffleBoardFree}
              style={{
                padding: '12px 30px',
                fontSize: '18px',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '10px',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              🔀 Shuffle Board
            </button>
          </div>
        </div>
      )}
      
      {/* v8.11: Victory Round Prompt - Top Banner (board visible for informed decision) */}
      {showVictoryPrompt && (() => {
        // v9.8.1: Calculate specials bonus to show accurate "potential score"
        const { bonus: pendingSpecialsBonus } = calculateUnusedSpecialsBonus(grid);
        const potentialScore = score + pendingSpecialsBonus;
        
        return (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0,
          minHeight: '100px',
          background: 'linear-gradient(135deg, rgba(255, 215, 0, 0.98) 0%, rgba(255, 165, 0, 0.98) 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '25px',
          zIndex: 1000,
          boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
          padding: '10px 20px',
          flexWrap: 'wrap'
        }}>
          <div style={{ textAlign: 'center', color: '#333', minWidth: '160px' }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', textShadow: '1px 1px 2px rgba(255,255,255,0.3)', marginBottom: '4px' }}>
              🎉 TARGET REACHED!
            </div>
            <div style={{ fontSize: '14px', color: '#555' }}>
              Enter Victory Round?
            </div>
          </div>
          
          <div style={{ 
            textAlign: 'center', 
            color: '#333', 
            fontSize: '14px', 
            lineHeight: '1.6',
            background: 'rgba(0,0,0,0.1)',
            padding: '8px 15px',
            borderRadius: '8px',
            minWidth: '150px'
          }}>
            <div>Score: <strong>{score}</strong>{pendingSpecialsBonus > 0 && <span style={{ color: '#228B22' }}> +{pendingSpecialsBonus}</span>} = <strong>{potentialScore}</strong> / {levelTarget}</div>
            <div>Moves left: <strong>{moves}</strong></div>
            <div style={{ color: '#8B4513', fontWeight: 'bold' }}>All points {VICTORY_ROUND_MULTIPLIER}x!</div>
          </div>
          
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'center' }}>
            <button
              onClick={startBonusRound}
              style={{
                padding: '10px 20px',
                fontSize: '15px',
                background: '#333',
                color: '#FFD700',
                border: '2px solid #333',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 'bold',
                boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
              }}
            >
              🌟 VICTORY ROUND
            </button>
            <button
              onClick={endLevelEarly}
              style={{
                padding: '10px 20px',
                fontSize: '15px',
                background: 'white',
                color: '#333',
                border: '2px solid #333',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 'bold',
                boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
              }}
            >
              End (+{moves * EARLY_END_BONUS_PER_MOVE + pendingSpecialsBonus})
            </button>
          </div>
        </div>
      );})()}
      
      {/* v11.6: Bonus Moves Prompt — fires when moves=0 and bonusMoves>0, win OR fail */}
      {showBonusMovesPrompt && (() => {
        const { bonus: promptSpecialsBonus } = calculateUnusedSpecialsBonus(grid);
        const promptWonAlready = targetReached || score + promptSpecialsBonus >= levelTarget;
        return (
          <div style={{
            position: 'fixed',
            top: 0, left: 0, right: 0,
            minHeight: '100px',
            background: 'linear-gradient(135deg, rgba(102,126,234,0.98) 0%, rgba(118,75,162,0.98) 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '25px',
            zIndex: 1000,
            boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
            padding: '10px 20px',
            flexWrap: 'wrap'
          }}>
            <div style={{ textAlign: 'center', color: 'white', minWidth: '160px' }}>
              <div style={{ fontSize: '22px', fontWeight: 'bold', marginBottom: '4px' }}>
                {promptWonAlready ? '🎯 Target reached!' : '⚠️ Out of moves!'}
              </div>
              <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.85)' }}>
                {promptWonAlready
                  ? `Keep playing with ${bonusMoves} bonus move${bonusMoves !== 1 ? 's' : ''}?`
                  : `You have ${bonusMoves} bonus move${bonusMoves !== 1 ? 's' : ''}`
                }
              </div>
            </div>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'center' }}>
              <button
                onClick={startUsingBonusMoves}
                style={{
                  padding: '10px 20px',
                  fontSize: '15px',
                  background: '#00C853',
                  color: 'white',
                  border: '2px solid #00C853',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
                }}
              >
                Use bonus moves
              </button>
              <button
                onClick={requestEndLevelCarryBonus}
                style={{
                  padding: '10px 20px',
                  fontSize: '15px',
                  background: 'white',
                  color: '#333',
                  border: '2px solid white',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
                }}
              >
                End and carry moves forward
              </button>
            </div>
          </div>
        );
      })()}

      {/* v11.9: "Are you sure?" confirm when in-header End-and-carry clicked while below target.
          Only fires from the in-header button (active bonus-moves use) — not from the
          bonus-moves prompt. Mirrors campaign v1.25. */}
      {showEndConfirm && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.75)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1200,
        }}>
          <div style={{
            background: 'linear-gradient(135deg, #e65100 0%, #bf360c 100%)',
            borderRadius: '16px', padding: '28px 32px', maxWidth: '360px', width: '90%',
            textAlign: 'center', boxShadow: '0 8px 32px rgba(0,0,0,0.5)', color: 'white',
          }}>
            <div style={{ fontSize: '36px', marginBottom: '6px' }}>⚠️</div>
            <div style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '10px' }}>
              End game now?
            </div>
            <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.9)', lineHeight: 1.5, marginBottom: '20px' }}>
              You're below target ({scoreRef.current.toLocaleString()} / {levelTarget.toLocaleString()})
              with {bonusMoves} bonus move{bonusMoves !== 1 ? 's' : ''} still available.
              <br />
              Ending now will end the game. Your bonus moves carry forward either way.
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button
                onClick={() => setShowEndConfirm(false)}
                style={{
                  padding: '12px 24px', fontSize: '15px', background: '#00C853',
                  color: 'white', border: 'none', borderRadius: '8px',
                  cursor: 'pointer', fontWeight: 'bold',
                }}
              >
                Keep playing
              </button>
              <button
                onClick={endLevelCarryBonus}
                style={{
                  padding: '10px 20px', fontSize: '14px', background: 'rgba(255,255,255,0.15)',
                  color: 'white', border: '2px solid rgba(255,255,255,0.5)', borderRadius: '8px',
                  cursor: 'pointer', fontWeight: 'bold',
                }}
              >
                Yes, end and carry moves forward
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Game Over / Won Screen */}
      {/* V-2: Arcade end banner is suppressed in VERSES_MODE — the
          passage-reveal modal below replaces it. In VERSES_MODE gameState
          stays 'playing' end-to-end (the game-end effect above short-
          circuits before any setGameState), so this branch never fires
          anyway; the !VERSES_MODE guard is defensive in case a future
          change lets the arcade flow run. */}
      {!VERSES_MODE && (gameState === 'gameover' || gameState === 'won') && (() => {
        // v8.10: Different move bonus depending on whether victory round was used
        const usedBonusRound = victoryRoundActive || victoryRoundScore > 0;
        const moveBonusAmount = usedBonusRound ? 0 : Math.max(0, moves) * (preVictoryScore > 0 ? EARLY_END_BONUS_PER_MOVE : WIN_BONUS_PER_MOVE);
        const { bonus: specialsBonusAmount, specials } = calculateUnusedSpecialsBonus(grid);
        const totalSpecials = specials.line + specials.bomb + specials.cross + specials.supernova + specials.hypernova;
        
        return (
          <div style={{
            position: 'fixed',
            top: 0, left: 0, right: 0,
            minHeight: '120px',
            background: gameState === 'won' 
              ? 'linear-gradient(135deg, rgba(68, 255, 68, 0.98) 0%, rgba(40, 180, 40, 0.98) 100%)'
              : 'linear-gradient(135deg, rgba(255, 68, 68, 0.98) 0%, rgba(180, 40, 40, 0.98) 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '25px',
            zIndex: 1000,
            boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
            padding: '10px 20px',
            flexWrap: 'wrap'
          }}>
            <div style={{ textAlign: 'center', color: 'white', minWidth: '200px' }}>
              <div style={{ fontSize: '26px', fontWeight: 'bold', textShadow: '2px 2px 4px rgba(0,0,0,0.3)', marginBottom: '4px' }}>
                {gameState === 'won' ? '🎉 Victory!' : '😓 Game Over'}
              </div>
              <div style={{ fontSize: '22px' }}>
                Final Score: <strong>{score}</strong>
                {highScore > 0 && score >= highScore && (
                  <span style={{ fontSize: '14px', marginLeft: '8px', color: '#FFD700' }}>🏆 High!</span>
                )}
              </div>
              {/* v11.9: Run tracking — current + all-time longest (consecutive won rounds).
                  On 'won', currentRun is already incremented by the run-tracking effect;
                  on 'gameover', currentRun shows the run that just broke (reset happens
                  at restartGame). */}
              <div style={{ fontSize: '13px', marginTop: '6px', color: 'rgba(255,255,255,0.92)' }}>
                {gameState === 'won' ? (
                  <>
                    Current run: <strong>{currentRun}</strong> win{currentRun !== 1 ? 's' : ''}
                    {currentRun >= longestRun && longestRun > 0 && (
                      <span style={{ color: '#FFD700', marginLeft: '6px' }}>🏆 new best!</span>
                    )}
                  </>
                ) : (
                  currentRun > 0 ? (
                    <>Run broken at <strong>{currentRun}</strong> win{currentRun !== 1 ? 's' : ''}</>
                  ) : (
                    <>No active run</>
                  )
                )}
                <span style={{ marginLeft: '10px' }}>
                  Longest run: <strong>{longestRun}</strong>
                </span>
              </div>
            </div>
            
            <div style={{ 
              textAlign: 'left', 
              color: 'white', 
              fontSize: '13px', 
              lineHeight: '1.5',
              background: 'rgba(0,0,0,0.2)',
              padding: '8px 12px',
              borderRadius: '8px',
              minWidth: '180px'
            }}>
              {/* v8.10: Show victory round score if used */}
              {victoryRoundScore > 0 && (
                <div>🌟 Victory Round: +{victoryRoundScore}</div>
              )}
              {gameState === 'won' && moveBonusAmount > 0 && (
                <div>⭐ Moves: {moves} × {preVictoryScore > 0 ? EARLY_END_BONUS_PER_MOVE : WIN_BONUS_PER_MOVE} = +{moveBonusAmount}</div>
              )}
              {totalSpecials > 0 && (
                <div>✨ Specials: {totalSpecials} = +{specialsBonusAmount}</div>
              )}
              <div>🔥 Best Combo: x{maxComboReached + 1}</div>
            </div>
            
            {/* v11.2: Post-game stats summary */}
            {(() => {
              try {
                const raw = localStorage.getItem(STATS_KEY);
                if (!raw) return null;
                const st = JSON.parse(raw);
                if (st.gamesPlayed < 2) return null;
                const recent = st.history.slice(-10);
                const winRateAll    = Math.round(st.gamesWon / st.gamesPlayed * 100);
                const recentWinRate = recent.length > 0 ? Math.round(recent.filter(g => g.won).length / recent.length * 100) : 0;
                const wins = st.history.filter(g => g.won);
                const avgPct = wins.length > 0 ? Math.round(wins.reduce((s, g) => s + g.finalScore / g.levelTarget, 0) / wins.length * 100) : null;
                return (
                  <div style={{ textAlign: 'center', color: 'white', fontSize: '12px', background: 'rgba(0,0,0,0.15)', padding: '8px 14px', borderRadius: '8px', lineHeight: 1.7 }}>
                    <div style={{ fontWeight: 'bold', marginBottom: '2px' }}>📊 Stats</div>
                    <div>Win rate: <strong>{recentWinRate}%</strong> last {recent.length} · <strong>{winRateAll}%</strong> all time</div>
                    <div>Games: {st.gamesPlayed} played · {st.gamesWon} won · {st.gamesLost} lost</div>
                    {avgPct !== null && <div>Avg score: <strong>{avgPct}%</strong> of target (wins)</div>}
                  </div>
                );
              } catch { return null; }
            })()}

            <button
              onClick={restartGame}
              style={{
                padding: '10px 25px',
                fontSize: '16px',
                background: 'white',
                color: gameState === 'won' ? '#28b428' : '#b42828',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 'bold',
                boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
              }}
            >
              🔄 Play Again
            </button>
          </div>
        );
      })()}

      {/* V-2: Passage-reveal modal — used in two modes:
            - Start-of-round (`showStartModal`): full passage as a
              memorization aid before the round begins; button reads
              "Begin game" and just closes the modal.
            - End-of-round (`showPassageModal`): fires after the final
              chunk reveal + PASSAGE_HOLD_MS hold; button reads "Play
              again" and calls restartGame (which re-opens the start
              modal per user request).
          Dimmed overlay (no blur). Full passage in the same Georgia
          two-column layout as the rolling text bar, at full contrast.
          No auto-dismiss — player clicks. */}
      {VERSES_MODE && versesLevel && (showPassageModal || showStartModal) && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2000,
          padding: '20px',
          animation: 'versesFadeIn 350ms ease-out',
        }}>
          <div style={{
            background: '#fff',
            borderRadius: '18px',
            padding: '28px 36px',
            maxWidth: '640px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: '0 12px 40px rgba(0,0,0,0.4)',
            fontFamily: 'Georgia, serif',
            color: '#333',
          }}>
            <div style={{
              textAlign: 'center',
              fontSize: '14px',
              color: '#888',
              marginBottom: '20px',
              letterSpacing: '0.5px',
            }}>
              {versesGame.title}
              {versesGame.translation ? ` · ${versesGame.translation}` : ''}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '24px' }}>
              {versesLevel.flatChunks.map((row, i) => (
                <div key={i} style={{
                  display: 'grid',
                  gridTemplateColumns: '110px 1fr',
                  columnGap: '8px',
                  alignItems: 'baseline',
                  fontSize: '19px',
                  fontWeight: 500,
                  lineHeight: 1.4,
                  color: '#333',
                }}>
                  <span style={{ textAlign: 'left', fontStyle: 'italic', whiteSpace: 'nowrap', color: '#667eea' }}>
                    {row.reference ? `(${row.reference})` : ''}
                  </span>
                  <span>{row.content}</span>
                </div>
              ))}
            </div>
            {/* V-3b: passage-modal button rows.
                  - Start-of-round (`showStartModal`): single primary
                    button labeled "Begin game" (single-level) or
                    "Begin level" (multi-level), plus the V-3a `Back`
                    button so the player can bail before starting.
                  - End-of-round (`showPassageModal`): full Decision #2
                    button matrix driven by isMultiLevel /
                    targetReached / isFinalLevel / isFreeReplay. */}
            {(() => {
              const totalLevels = isMultiLevel && versesGame && Array.isArray(versesGame.levels)
                ? versesGame.levels.length
                : 1;
              const isFinalLevel = levelIndex >= totalLevels - 1;
              const isFreeReplay = fullCompleted;
              const won = targetReached;

              // Shared button styles.
              const primaryStyle = {
                padding: '12px 28px',
                fontSize: '16px',
                fontFamily: 'Georgia, serif',
                background: '#667eea',
                color: 'white',
                border: 'none',
                borderRadius: '10px',
                cursor: 'pointer',
                fontWeight: 'bold',
                boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)',
              };
              const secondaryStyle = {
                padding: '12px 24px',
                fontSize: '16px',
                fontFamily: 'Georgia, serif',
                background: 'transparent',
                color: '#667eea',
                border: '2px solid #667eea',
                borderRadius: '10px',
                cursor: 'pointer',
                fontWeight: 500,
              };
              const inactiveStyle = {
                ...secondaryStyle,
                opacity: 0.5,
                cursor: 'default',
                position: 'relative',
              };

              if (showStartModal) {
                // Start-of-round modal — Back + Begin (game / level).
                const beginLabel = isMultiLevel ? 'Begin level' : 'Begin game';
                return (
                  <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
                    {onBack && (
                      <button onClick={onBack} style={secondaryStyle}>Back</button>
                    )}
                    <button onClick={() => setShowStartModal(false)} style={primaryStyle}>
                      {beginLabel}
                    </button>
                  </div>
                );
              }

              // End-of-round modal — Decision #2 matrix.
              const buttons = [];
              if (!isMultiLevel) {
                // Single-level (Titus): Play again + Back to passage selections.
                buttons.push({ kind: 'primary', label: 'Play again', onClick: () => restartGame() });
                buttons.push({ kind: 'secondary', label: 'Back to passage selections', onClick: onBackToPicker });
              } else if (isFreeReplay) {
                // Multi-level free-replay: Replay (win) or Retry (fail) + Back to level selections.
                const replayLabel = won ? 'Replay' : 'Retry';
                buttons.push({ kind: 'primary', label: replayLabel, onClick: () => restartGame() });
                buttons.push({ kind: 'secondary', label: 'Back to level selections', onClick: onBackToLevelSelect });
              } else if (won && isFinalLevel) {
                // Multi-level final-level first-pass win — game just
                // completed. Play again (full restart from level 0) +
                // Back to level selections + Arcade mode (active in V-4
                // — writes bonusMoves to BONUS_MOVES_KEY + carry-receipt
                // key + navigates to tablet.html) + See entire <title>
                // (V-4 — full-passage reveal).
                buttons.push({ kind: 'primary', label: 'Play again', onClick: () => onWrapperRestartGame && onWrapperRestartGame() });
                buttons.push({ kind: 'secondary', label: 'Back to level selections', onClick: onBackToLevelSelect });
                buttons.push({
                  kind: 'secondary',
                  label: 'Arcade mode',
                  onClick: () => {
                    // V-4: arcade-mode handoff. Roll bonusMoves into
                    // tablet arcade's BONUS_MOVES_KEY (the same key the
                    // arcade reads at mount) AND write a separate
                    // carry-receipt under m3_arcade_carry_from_verses
                    // so tablet arcade can show a transfer banner on
                    // entry. Then navigate.
                    try {
                      const carryAmount = bonusMoves || 0;
                      // Add to existing arcade bonus-moves (don't
                      // overwrite — the player may have prior arcade
                      // bonus moves already stored).
                      const existing = parseInt(localStorage.getItem(BONUS_MOVES_KEY) || '0', 10);
                      localStorage.setItem(BONUS_MOVES_KEY, (existing + carryAmount).toString());
                      localStorage.setItem('m3_arcade_carry_from_verses', JSON.stringify({
                        amount: carryAmount,
                        timestamp: new Date().toISOString(),
                      }));
                    } catch {}
                    // Use the same base path the rest of the app uses
                    // (Vite injects `/M3/` in production via base config).
                    const base = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.BASE_URL) || '/';
                    window.location.href = `${base}tablet.html`;
                  },
                });
                if (onShowFullPassage && versesGame && versesGame.title) {
                  buttons.push({ kind: 'secondary', label: `See entire ${versesGame.title}`, onClick: onShowFullPassage });
                }
              } else if (won) {
                // Multi-level non-final first-pass win — Next level → +
                // Back to level selections.
                buttons.push({ kind: 'primary', label: 'Next level →', onClick: () => onAdvanceLevel && onAdvanceLevel() });
                buttons.push({ kind: 'secondary', label: 'Back to level selections', onClick: onBackToLevelSelect });
              } else {
                // Multi-level fail (any position) first-pass — Retry +
                // Back to level selections.
                buttons.push({ kind: 'primary', label: 'Retry', onClick: () => restartGame() });
                buttons.push({ kind: 'secondary', label: 'Back to level selections', onClick: onBackToLevelSelect });
              }

              return (
                <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', flexWrap: 'wrap' }}>
                  {buttons.map((b, i) => {
                    if (b.kind === 'inactive') {
                      return (
                        <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                          <button disabled style={inactiveStyle}>{b.label}</button>
                          <div style={{ fontSize: '11px', color: '#888', marginTop: '4px', fontStyle: 'italic' }}>
                            {b.caption}
                          </div>
                        </div>
                      );
                    }
                    return (
                      <button
                        key={i}
                        onClick={b.onClick}
                        style={b.kind === 'primary' ? primaryStyle : secondaryStyle}
                      >
                        {b.label}
                      </button>
                    );
                  })}
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* v11.8: Scoring history panel — admin-only, left side, shown when toggled on */}
      {showHistoryPanel && (
        <ScoringHistoryPanel
          history={scoringHistory}
          expandedTurns={expandedTurns}
          setExpandedTurns={setExpandedTurns}
          onClose={() => setShowHistoryPanel(false)}
          onHighlightTiles={handleHighlightTilesFromHistory}
        />
      )}

      {/* v11.2/v11.8: Admin panel — shown via ?admin=1 URL param or long-press on score */}
      {showAdmin && (
        <TabletAdminWrapper
          onClose={() => setShowAdmin(false)}
          showHistoryPanel={showHistoryPanel}
          setShowHistoryPanel={setShowHistoryPanel}
          playbackSpeed={playbackSpeed}
          setPlaybackSpeed={setPlaybackSpeed}
          onClearHistory={clearScoringHistory}
          constants={{
            BASE_TARGET, TARGET_VARIANCE,
            MIN_MOVES, MAX_MOVES,
            BONUS_MOVE_INTERVAL,
            BONUS_MOVES_CAP, BONUS_MOVES_WARN,
          }}
        />
      )}
      
      {/* Instructions */}
      <div style={{
        marginTop: '20px',
        background: 'rgba(255, 255, 255, 0.9)',
        padding: '12px 16px',
        borderRadius: '10px',
        maxWidth: `${boardWidth + 30}px`,
        fontSize: '12px',
        color: '#555',
        textAlign: 'center',
        lineHeight: '1.5'
      }}>
        {VERSES_MODE ? (
          <>
            <strong>Match 3+ tiles to reveal more text.</strong>{' '}
            Line / bomb / cross specials reward bigger matches.{' '}
            Hit the target to earn a ✓ — keep playing to see the full passage.
          </>
        ) : (
          <>
            <strong>🎯 Match 3+ tiles!</strong> •{' '}
            <strong>⚡4-match:</strong> Line •{' '}
            <strong>💣5-match:</strong> Bomb •{' '}
            <strong>✨L-shape:</strong> Cross •
            <strong>🎯 Every 10k pts:</strong> +1 Move
          </>
        )}
      </div>
      
      <style>{`
        @keyframes scorePopup {
          0% { transform: translateY(0) scale(1); opacity: 1; }
          70% { transform: translateY(-50px) scale(1.3); opacity: 1; }
          100% { transform: translateY(-90px) scale(1.5); opacity: 0; }
        }
        
        /* v8.7: Simplified chain text animation - just fade, no scale bounce */
        @keyframes chainPop {
          0% { transform: translate(-50%, -50%); opacity: 0; }
          15% { transform: translate(-50%, -50%); opacity: 1; }
          85% { transform: translate(-50%, -50%); opacity: 1; }
          100% { transform: translate(-50%, -50%); opacity: 0; }
        }
        
        /* v8.10: Pulse animation for victory round banner */
        @keyframes pulse {
          0%, 100% { transform: scale(1); box-shadow: 0 0 15px rgba(255, 215, 0, 0.5); }
          50% { transform: scale(1.02); box-shadow: 0 0 25px rgba(255, 215, 0, 0.8); }
        }
        
        /* V-2: New-chunk reveal — fade + short upward slide. */
        @keyframes versesChunkIn {
          0%   { opacity: 0; transform: translateY(8px); }
          100% { opacity: 1; transform: translateY(0); }
        }

        /* V-2: Target-hit toast slides down from top. */
        @keyframes versesToastIn {
          0%   { opacity: 0; transform: translate(-50%, -8px); }
          100% { opacity: 1; transform: translate(-50%, 0); }
        }

        /* V-2: Passage-modal overlay fade. */
        @keyframes versesFadeIn {
          0%   { opacity: 0; }
          100% { opacity: 1; }
        }

        /* v10.5.2: Bonus move burst — slower float, 4s duration */
        @keyframes bonusMoveBurst {
          0%   { transform: translateX(-50%) translateY(0) scale(0.5); opacity: 0; }
          10%  { transform: translateX(-50%) translateY(-4px) scale(1.6); opacity: 1; }
          35%  { transform: translateX(-50%) translateY(-14px) scale(1.4); opacity: 1; }
          70%  { transform: translateX(-50%) translateY(-26px) scale(1.2); opacity: 1; }
          100% { transform: translateX(-50%) translateY(-38px) scale(1.0); opacity: 0; }
        }
        
        /* v8.5: Removed screen shake animation */
      `}</style>
    </div>
  );
};

// =============================================================================
// V-3a: VERSES PICKER + OUTER WRAPPER
// =============================================================================

// V-3a: Picker screen — card grid of all discoverable games.
// Click a single-level card → setActiveSlug → game mounts.
// Click a multi-level card → would route to level-select; V-3a has
// no multi-level games yet (Psalm 91 ships in V-3b), so the same
// callback fires straight to play and the level-select stub gets
// added in V-3b without picker changes.
// V-4: Full-passage reveal modal. Shown when the player taps
// "See entire <game.title>" on the final-level first-pass win modal
// or on the level-select page (when fullCompleted is true). Reuses
// the same Georgia two-column layout as the V-2 end-of-round
// passage modal — just renders all chunks across every level
// instead of one. Single Close button returns to whichever screen
// launched it (the wrapper's modal-state lives above both
// VersesGame and VersesLevelSelect).
const VersesFullPassageModal = ({ game, onClose }) => {
  if (!game) return null;
  const allChunks = versesFlattenAllChunks(game);
  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 2100,
      padding: '20px',
      animation: 'versesFadeIn 350ms ease-out',
    }}>
      <div style={{
        background: '#fff',
        borderRadius: '18px',
        padding: '28px 36px',
        maxWidth: '720px',
        width: '100%',
        maxHeight: '90vh',
        overflowY: 'auto',
        boxShadow: '0 12px 40px rgba(0,0,0,0.4)',
        fontFamily: 'Georgia, serif',
        color: '#333',
      }}>
        <div style={{
          textAlign: 'center',
          fontSize: '14px',
          color: '#888',
          marginBottom: '20px',
          letterSpacing: '0.5px',
        }}>
          {game.title}
          {game.translation ? ` · ${game.translation}` : ''}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '24px' }}>
          {allChunks.map((row, i) => (
            <div key={i} style={{
              display: 'grid',
              gridTemplateColumns: '110px 1fr',
              columnGap: '8px',
              alignItems: 'baseline',
              fontSize: '19px',
              fontWeight: 500,
              lineHeight: 1.4,
              color: '#333',
            }}>
              <span style={{ textAlign: 'left', fontStyle: 'italic', whiteSpace: 'nowrap', color: '#667eea' }}>
                {row.reference ? `(${row.reference})` : ''}
              </span>
              <span>{row.content}</span>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <button
            onClick={onClose}
            style={{
              padding: '12px 32px',
              fontSize: '16px',
              fontFamily: 'Georgia, serif',
              background: '#667eea',
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              cursor: 'pointer',
              fontWeight: 'bold',
              boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)',
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

const VersesPicker = ({ games, progress, onPick }) => {
  const slugs = Object.keys(games);
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      fontFamily: 'Arial, sans-serif',
      padding: '40px 20px 60px',
      color: '#fff',
    }}>
      <h1 style={{
        margin: '0 0 8px 0',
        fontSize: '36px',
        fontFamily: 'Georgia, serif',
        textShadow: '2px 2px 4px rgba(0,0,0,0.2)',
      }}>
        Verses
      </h1>
      <p style={{
        margin: '0 0 32px 0',
        fontSize: '16px',
        opacity: 0.9,
        fontStyle: 'italic',
      }}>
        Select a passage to begin.
      </p>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
        gap: '16px',
        width: '100%',
        maxWidth: '900px',
      }}>
        {slugs.length === 0 && (
          <div style={{
            gridColumn: '1 / -1',
            textAlign: 'center',
            opacity: 0.85,
            fontSize: '14px',
            padding: '40px 0',
          }}>
            No games found. Drop a folder under
            {' '}<code style={{ background: 'rgba(255,255,255,0.15)', padding: '2px 6px', borderRadius: '4px' }}>
              content/verses/&lt;slug&gt;/
            </code>{' '}
            to add one.
          </div>
        )}
        {slugs.map(slug => {
          const game = games[slug];
          const levelCount = Array.isArray(game.levels) ? game.levels.length : 0;
          const isMultiLevel = levelCount > 1;
          // V-4: per-game progress lookup for aggregate stars + ✓.
          const gameProgress = progress ? progress[slug] : null;
          const { earned: starsEarned, max: starsMax } = versesAggregateStars(game, gameProgress);
          const fullCompleted = !!(gameProgress && gameProgress.fullCompleted);
          return (
            <button
              key={slug}
              onClick={() => onPick(slug)}
              style={{
                background: 'rgba(255, 255, 255, 0.95)',
                color: '#333',
                border: 'none',
                borderRadius: '15px',
                padding: '20px 18px',
                cursor: 'pointer',
                textAlign: 'left',
                fontFamily: 'Arial, sans-serif',
                boxShadow: '0 8px 16px rgba(0,0,0,0.2)',
                transition: 'transform 0.15s ease, box-shadow 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 12px 24px rgba(0,0,0,0.25)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 8px 16px rgba(0,0,0,0.2)';
              }}
            >
              <div style={{
                fontSize: '18px',
                fontWeight: 600,
                marginBottom: '6px',
                color: '#333',
              }}>
                {/* V-4: inline ✓ before title when fullCompleted. */}
                {fullCompleted && <span style={{ color: '#2e7d32', marginRight: '6px' }}>✓</span>}
                {game.title || slug}
              </div>
              {game.translation && (
                <div style={{ fontSize: '13px', color: '#888', marginBottom: isMultiLevel ? '4px' : '4px' }}>
                  {game.translation}
                </div>
              )}
              {isMultiLevel && (
                <div style={{ fontSize: '13px', color: '#888', marginBottom: '4px' }}>
                  {levelCount} levels
                </div>
              )}
              {/* V-4: aggregate "X / Y ★" line. Always shown so the
                  card has a consistent shape across played and
                  unplayed games. */}
              <div style={{ fontSize: '13px', color: '#888' }}>
                {starsEarned} / {starsMax} <span style={{ color: starsEarned > 0 ? '#FFD700' : '#ccc' }}>★</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

// V-3b: Level-select screen for multi-level games. Decision #4
// layout: same purple gradient + Georgia 36px centered title +
// `repeat(auto-fill, minmax(220px, 1fr))` card grid as the picker.
// Decision #3 locked-card visuals: opacity 0.5 + grayscale(0.7),
// no hover, `cursor: default`, no onClick.
//
// Hybrid progression rules (V-3b in-memory only — V-4 adds
// localStorage persistence):
//   - Level 0 always unlocked.
//   - Level N unlocked iff Level N−1 is in `completedLevels` for
//     the current session OR `fullCompleted === true`.
//   - When `fullCompleted` flips true, all levels become unlocked
//     (free-replay mode).
// V-4: small star-row component reused by level-select cards (and
// indirectly by aggregate displays). Renders 5 ★ Unicode chars,
// gold (#FFD700) for earned and #ccc for unearned. Matches the
// campaign pattern.
const VersesStarRow = ({ stars, size = 16 }) => (
  <div style={{ display: 'flex', gap: '2px', fontSize: `${size}px`, lineHeight: 1, letterSpacing: '1px' }}>
    {[0, 1, 2, 3, 4].map(i => (
      <span key={i} style={{ color: i < (stars || 0) ? '#FFD700' : '#ccc' }}>★</span>
    ))}
  </div>
);

const VersesLevelSelect = ({ game, gameProgress, completedLevels, fullCompleted, onPickLevel, onBack, onShowFullPassage }) => {
  const levels = (game && Array.isArray(game.levels)) ? game.levels : [];
  // Per the locked progression spec.
  const isUnlocked = (idx) => {
    if (fullCompleted) return true;
    if (idx === 0) return true;
    return completedLevels.has(idx - 1);
  };
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      fontFamily: 'Arial, sans-serif',
      padding: '40px 20px 60px',
      color: '#fff',
      position: 'relative',
    }}>
      {/* Top-left back button. Mirrors the in-game header back button
          but with the explicit destination label per locked naming. */}
      <button
        onClick={onBack}
        style={{
          position: 'absolute',
          top: '20px',
          left: '20px',
          background: 'transparent',
          border: '2px solid rgba(255,255,255,0.6)',
          color: '#fff',
          fontSize: '14px',
          cursor: 'pointer',
          padding: '6px 12px',
          borderRadius: '8px',
          fontWeight: 500,
          opacity: 0.85,
          transition: 'opacity 0.2s, border-color 0.2s',
        }}
        onMouseEnter={(e) => { e.target.style.opacity = 1; e.target.style.borderColor = 'rgba(255,255,255,1)'; }}
        onMouseLeave={(e) => { e.target.style.opacity = 0.85; e.target.style.borderColor = 'rgba(255,255,255,0.6)'; }}
      >
        ← Back to passage selections
      </button>
      <h1 style={{
        margin: '0 0 32px 0',
        fontSize: '36px',
        fontFamily: 'Georgia, serif',
        textShadow: '2px 2px 4px rgba(0,0,0,0.2)',
      }}>
        {game?.title || 'Levels'}
      </h1>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
        gap: '16px',
        width: '100%',
        maxWidth: '900px',
      }}>
        {levels.map((level, idx) => {
          const unlocked = isUnlocked(idx);
          const cardLabel = level.title || `Level ${idx + 1}`;
          // V-4: per-level progress lookup. levelProgress is null
          // when the player has never finished this level.
          const levelProgress = (gameProgress && Array.isArray(gameProgress.levels))
            ? gameProgress.levels[idx]
            : null;
          const hasPlayed = !!levelProgress;
          const stars = hasPlayed ? (levelProgress.stars || 0) : 0;
          const best = hasPlayed ? (levelProgress.best || 0) : 0;
          const completed = hasPlayed && (levelProgress.completions || 0) > 0;
          const baseStyle = {
            background: 'rgba(255, 255, 255, 0.95)',
            color: '#333',
            border: 'none',
            borderRadius: '15px',
            padding: '20px 18px',
            textAlign: 'left',
            fontFamily: 'Arial, sans-serif',
            boxShadow: '0 8px 16px rgba(0,0,0,0.2)',
            transition: 'transform 0.15s ease, box-shadow 0.15s ease',
          };
          if (!unlocked) {
            // Locked card — title only, dimmed (V-3b spec).
            return (
              <div
                key={idx}
                style={{
                  ...baseStyle,
                  opacity: 0.5,
                  filter: 'grayscale(0.7)',
                  cursor: 'default',
                }}
              >
                <div style={{ fontSize: '18px', fontWeight: 600, color: '#333' }}>
                  {cardLabel}
                </div>
              </div>
            );
          }
          return (
            <button
              key={idx}
              onClick={() => onPickLevel(idx)}
              style={{ ...baseStyle, cursor: 'pointer' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 12px 24px rgba(0,0,0,0.25)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 8px 16px rgba(0,0,0,0.2)';
              }}
            >
              <div style={{ fontSize: '18px', fontWeight: 600, color: '#333', marginBottom: '8px' }}>
                {completed && <span style={{ color: '#2e7d32', marginRight: '6px' }}>✓</span>}
                {cardLabel}
              </div>
              {/* V-4: 5-star row + best-score line. Always render the
                  star row on unlocked cards (empty stars = "play this
                  for stars" affordance). Best-score only when there's
                  one to show. */}
              <VersesStarRow stars={stars} size={16} />
              {best > 0 && (
                <div style={{ fontSize: '13px', color: '#888', marginTop: '6px' }}>
                  Best: {best.toLocaleString()}
                </div>
              )}
            </button>
          );
        })}
      </div>
      {/* V-4: "See entire <title>" button below the card grid,
          shown only when fullCompleted is true (free-replay mode).
          Always-available bridge to the full-passage modal. */}
      {fullCompleted && onShowFullPassage && game && game.title && (
        <button
          onClick={onShowFullPassage}
          style={{
            marginTop: '24px',
            padding: '10px 20px',
            background: 'transparent',
            border: '2px solid rgba(255,255,255,0.6)',
            color: '#fff',
            fontSize: '14px',
            fontFamily: 'Georgia, serif',
            fontStyle: 'italic',
            borderRadius: '10px',
            cursor: 'pointer',
            opacity: 0.9,
            transition: 'opacity 0.2s, border-color 0.2s',
          }}
          onMouseEnter={(e) => { e.target.style.opacity = 1; e.target.style.borderColor = 'rgba(255,255,255,1)'; }}
          onMouseLeave={(e) => { e.target.style.opacity = 0.9; e.target.style.borderColor = 'rgba(255,255,255,0.6)'; }}
        >
          See entire {game.title}
        </button>
      )}
    </div>
  );
};

// V-3a / V-3b: Outer wrapper. Owns navigation state at two scopes
// — passage (`activeSlug`) and level (`activeLevelIndex`) — plus
// the cross-level state that survives level transitions within a
// game (`completedLevels`, `fullCompleted`) and the bonus-moves
// pool that survives level transitions but zeroes on return to the
// picker (`bonusMoves`).
//
// Three render branches:
//   - `activeSlug === null` → VersesPicker (passage selections).
//   - `activeSlug` set, multi-level game, `activeLevelIndex === null`
//     → VersesLevelSelect (level selections).
//   - `activeSlug` set + `activeLevelIndex` set → VersesGame.
//
// `key={slug}:${levelIndex}` on VersesGame forces a fresh mount on
// each pick AND each level transition. Per-level state inside the
// game (score, moves, target, revealed-chunk index, etc.) auto-
// resets via the remount; cross-level state (bonusMoves,
// completedLevels, fullCompleted) survives because it lives here.
const Match3Verses = () => {
  const [activeSlug, setActiveSlug] = useState(null);
  const [activeLevelIndex, setActiveLevelIndex] = useState(null);
  // V-3b: cross-level state. completedLevels is a Set<number> of
  // level indices the player has finished (target hit) in the
  // current game session. fullCompleted flips true when the set
  // fills, switching the game into free-replay mode.
  const [completedLevels, setCompletedLevels] = useState(() => new Set());
  const [fullCompleted, setFullCompleted] = useState(false);
  // V-3b: bonus-moves pool lifted here. In VERSES_MODE, init to 0
  // and skip BONUS_MOVES_KEY persistence — memorize-mode bonus moves are
  // session-scoped (zero on return to picker). In !VERSES_MODE
  // (arcade fallback), hydrate from BONUS_MOVES_KEY at mount and persist
  // via the effect below.
  const [bonusMoves, setBonusMoves] = useState(() => (
    VERSES_MODE ? 0 : parseInt(localStorage.getItem(BONUS_MOVES_KEY) || '0', 10)
  ));
  useEffect(() => {
    if (VERSES_MODE) return;
    localStorage.setItem(BONUS_MOVES_KEY, bonusMoves.toString());
  }, [bonusMoves]);

  // V-4: full-passage modal state. Triggered from the final-level
  // first-pass win modal AND from the level-select page (when
  // fullCompleted). Lives on the wrapper so both sources can call
  // the same opener and the modal renders as a sibling to whichever
  // screen is currently showing.
  const [showFullPassage, setShowFullPassage] = useState(false);

  // V-4: persistence layer. The `progress` map is the source of
  // truth for per-game stats (best, stars, completions, lastPlayed,
  // completedLevels, fullCompleted). Hydrated eagerly at wrapper
  // mount from localStorage; persisted via the effect below whenever
  // any slug's blob changes. Session state (completedLevels Set,
  // fullCompleted boolean) mirrors the active game's progress for
  // the duration of play and is rehydrated on game-pick.
  const [progress, setProgress] = useState(() => {
    const out = {};
    for (const slug of Object.keys(versesGameRegistry)) {
      const game = versesGameRegistry[slug];
      let parsed = null;
      try {
        const raw = localStorage.getItem(`${VERSES_PROGRESS_KEY_PREFIX}${slug}`);
        if (raw) parsed = JSON.parse(raw);
      } catch {
        parsed = null;
      }
      // Validate: must be an object with the expected fields. Anything
      // weird (different version, malformed) falls back to empty.
      if (
        parsed &&
        typeof parsed === 'object' &&
        parsed.version === VERSES_PROGRESS_VERSION &&
        Array.isArray(parsed.levels) &&
        Array.isArray(parsed.completedLevels)
      ) {
        out[slug] = parsed;
      } else {
        out[slug] = versesEmptyProgress(game);
      }
    }
    return out;
  });

  // Persist progress whenever it changes. Writes every slug's blob
  // — small N at V-4 (2 games), cheap. If we add many games later
  // this could be tightened to write only the changed slug, but
  // for now simple-and-correct beats clever.
  useEffect(() => {
    for (const slug of Object.keys(progress)) {
      try {
        localStorage.setItem(`${VERSES_PROGRESS_KEY_PREFIX}${slug}`, JSON.stringify(progress[slug]));
      } catch {}
    }
  }, [progress]);

  // V-3b: derive the active game and whether it's multi-level. Used
  // by the picker→play vs. picker→level-select branching and the
  // back-button routing decisions.
  const activeGame = activeSlug ? (versesGameRegistry[activeSlug] || null) : null;
  const isMultiLevel = versesIsMultiLevel(activeGame);

  // V-3b/V-4: pick handler from the picker. Single-level → straight
  // to play (level 0). Multi-level → level-select first.
  // V-4: hydrate session state from persisted progress so a returning
  // player sees their unlocked levels and free-replay state intact.
  const handlePick = (slug) => {
    const game = versesGameRegistry[slug] || null;
    const slugProgress = progress[slug] || versesEmptyProgress(game);
    setActiveSlug(slug);
    setCompletedLevels(new Set(slugProgress.completedLevels || []));
    setFullCompleted(!!slugProgress.fullCompleted);
    setBonusMoves(0);
    if (versesIsMultiLevel(game)) {
      setActiveLevelIndex(null); // show level-select
    } else {
      setActiveLevelIndex(0); // direct to play for single-level
    }
  };

  // V-3b: back-to-picker handler. Used by every "Back to passage
  // selections" entry point. Clears all per-game state (full reset).
  const handleBackToPicker = () => {
    setActiveSlug(null);
    setActiveLevelIndex(null);
    setCompletedLevels(new Set());
    setFullCompleted(false);
    setBonusMoves(0);
  };

  // V-3b: back-to-level-select handler. Used by in-game header /
  // start-modal back buttons in multi-level games and by the
  // end-of-round modal "Back to level selections" button. Keeps
  // game-scoped state (completedLevels, fullCompleted, bonusMoves)
  // so the player returns to a level-select that shows their
  // progress so far.
  const handleBackToLevelSelect = () => {
    setActiveLevelIndex(null);
  };

  // V-3b: in-game back handler chooses the right destination based
  // on whether this is a multi-level game.
  const handleInGameBack = () => {
    if (isMultiLevel) {
      handleBackToLevelSelect();
    } else {
      handleBackToPicker();
    }
  };

  // V-3b/V-4: level-completion handler called from VersesGame when
  // the player wins a level (target hit, round resolves). Updates
  // BOTH the session state (completedLevels Set, fullCompleted) AND
  // the persistent progress map (no-regression rule for stars + best;
  // completions + lastPlayed always update). VersesGame passes the
  // final score so we can compute stars; if the score arg is missing
  // we still record completion but skip the score/star update.
  const handleLevelComplete = (levelIndex, score, target) => {
    if (!activeSlug || !activeGame) return;
    const total = Array.isArray(activeGame.levels) ? activeGame.levels.length : 1;

    // Session state — mirrors the new persisted state.
    setCompletedLevels((prev) => {
      const next = new Set(prev);
      next.add(levelIndex);
      if (next.size >= total) setFullCompleted(true);
      return next;
    });

    // Persistent progress.
    setProgress((prev) => {
      const slugProgress = prev[activeSlug] || versesEmptyProgress(activeGame);
      const newCompletedLevels = Array.from(new Set([...(slugProgress.completedLevels || []), levelIndex]));
      const newFullCompleted = newCompletedLevels.length >= total;

      // Per-level update with no-regression rule.
      const newLevels = (slugProgress.levels && Array.isArray(slugProgress.levels))
        ? slugProgress.levels.slice()
        : new Array(total).fill(null);
      while (newLevels.length < total) newLevels.push(null);
      const existing = newLevels[levelIndex] || { best: 0, stars: 0, completions: 0, lastPlayed: null };
      const newStars = (typeof score === 'number' && typeof target === 'number')
        ? Math.max(existing.stars || 0, versesComputeStars(score, target))
        : (existing.stars || 0);
      const newBest = (typeof score === 'number')
        ? Math.max(existing.best || 0, score)
        : (existing.best || 0);
      newLevels[levelIndex] = {
        best: newBest,
        stars: newStars,
        completions: (existing.completions || 0) + 1,
        lastPlayed: new Date().toISOString(),
      };

      return {
        ...prev,
        [activeSlug]: {
          ...slugProgress,
          version: VERSES_PROGRESS_VERSION,
          levels: newLevels,
          completedLevels: newCompletedLevels,
          fullCompleted: newFullCompleted,
        },
      };
    });
  };

  // V-3b/V-4: render branch resolution. The full-passage modal
  // renders as a sibling overlay so it composes over whichever
  // screen is active when the player taps "See entire <title>".
  const showFullPassageHandler = () => setShowFullPassage(true);

  if (!activeSlug) {
    return (
      <>
        <VersesPicker games={versesGameRegistry} progress={progress} onPick={handlePick} />
        {showFullPassage && (
          <VersesFullPassageModal game={activeGame} onClose={() => setShowFullPassage(false)} />
        )}
      </>
    );
  }
  if (isMultiLevel && activeLevelIndex === null) {
    return (
      <>
        <VersesLevelSelect
          game={activeGame}
          gameProgress={progress[activeSlug] || versesEmptyProgress(activeGame)}
          completedLevels={completedLevels}
          fullCompleted={fullCompleted}
          onPickLevel={setActiveLevelIndex}
          onBack={handleBackToPicker}
          onShowFullPassage={fullCompleted ? showFullPassageHandler : null}
        />
        {showFullPassage && (
          <VersesFullPassageModal game={activeGame} onClose={() => setShowFullPassage(false)} />
        )}
      </>
    );
  }
  return (
    <>
      <VersesGame
        key={`${activeSlug}:${activeLevelIndex}`}
        slug={activeSlug}
        levelIndex={activeLevelIndex ?? 0}
        isMultiLevel={isMultiLevel}
        bonusMoves={bonusMoves}
        onBonusMovesChange={setBonusMoves}
        completedLevels={completedLevels}
        fullCompleted={fullCompleted}
        onLevelComplete={handleLevelComplete}
        onBack={handleInGameBack}
        onBackToPicker={handleBackToPicker}
        onBackToLevelSelect={handleBackToLevelSelect}
        onAdvanceLevel={() => setActiveLevelIndex((i) => (i ?? 0) + 1)}
        onShowFullPassage={isMultiLevel ? showFullPassageHandler : null}
        onRestartGame={() => {
          // Final-level "Play again" — restart from level 0, keep
          // completedLevels (player stays in free-replay), zero
          // bonusMoves (full-game restart is a soft session boundary).
          setActiveLevelIndex(0);
          setBonusMoves(0);
        }}
      />
      {showFullPassage && (
        <VersesFullPassageModal game={activeGame} onClose={() => setShowFullPassage(false)} />
      )}
    </>
  );
};

export default Match3Verses;
