# M3 — Version History & URLs

**Date:** 2026-08-22
**Supersedes:** `docs/archive/version-urls-2026-08-09.md`, whose contents are
carried forward below.

This document has two jobs:

1. **Version history** — the per-platform change notes that used to live inside
   the game select screen (`index.html`). Those card descriptions had grown to
   as much as 2,300 characters each, burying the version number a reader
   actually wants behind a wall of history. As of 2026-08-22 each card shows one
   line — version number plus the most recent change — and the accumulated
   history lives here.
2. **URLs** — where each platform is served, live and locally.

> **This file is a convenience copy, not the source of truth.** The
> authoritative list of pages is `vite.config.js` (the `rollupOptions.input`
> block); the authoritative version for each page is the filename imported by
> its entry file in `src/`. If this doc and those disagree, those win.
> Rotation: when rewritten, move the old copy to `docs/archive/` under its own
> date rather than overwriting it.

---

## Live URLs (GitHub Pages)

Base: `https://m3-game.github.io/M3/`

| Page | Platform | Version | URL |
|---|---|---|---|
| Game select | `index.html` | — | https://m3-game.github.io/M3/ |
| Arcade — Tablet | `platforms/tablet/` | v12.1 | https://m3-game.github.io/M3/tablet.html |
| Arcade — Phone | `platforms/phone/` | v14.1 | https://m3-game.github.io/M3/phone.html |
| Arcade — Desktop | `platforms/desktop/` | v12.3 | https://m3-game.github.io/M3/desktop.html |
| Arcade — Time Attack | `platforms/timeattack/` | v12.4 | https://m3-game.github.io/M3/timeattack.html |
| Verses — Tablet | `platforms/tablet-verses/` | v2.4 | https://m3-game.github.io/M3/verses.html |
| Verses — Phone | `platforms/phone-verses/` | v2.6 | https://m3-game.github.io/M3/phone-verses.html |
| Verses — Phone Sandbox | `platforms/phone-verses-sandbox/` | v1.16 | https://m3-game.github.io/M3/phone-verses-sandbox.html |
| Campaign — Tablet | `platforms/campaign/tablet/` | v1.28 | https://m3-game.github.io/M3/campaign.html |
| Reward-mode sandbox | `platforms/tablet-rewardmode/` | v1.5 | https://m3-game.github.io/M3/rewardmode.html |
| Tablet Sim | `platforms/tablet-sim/` | v1.6 | https://m3-game.github.io/M3/tablet-sim.html |

**Retired — these addresses no longer work:**

| Page | Retired |
|---|---|
| `phone341.html` | Session P-2, 2026-05-02. Files kept in `platforms/phone-341/archive/` for reference; no longer built. |
| `platforms/phone-418/match3-v11-418px-phone.html` | Session P-2, 2026-05-02. `phone-418` was renamed to `phone`; use `phone.html` above. |

---

## Local dev (`npm run dev`)

Base: `http://localhost:5173/M3/` — same page names as above.

The `/M3/` path segment is not optional locally — it comes from `base: '/M3/'`
in `vite.config.js`, which exists so the built site works under the
`m3-game.github.io/M3/` subpath. Dropping it gives a 404.

---

## What "live" actually means

The live site serves **the last successful deploy**, which is not always the
last commit. GitHub Pages publishes on push to `main` via
`.github/workflows/deploy.yml`, and that workflow's publish step has failed
transiently in the past — three times on 2026-07-05.

Every deploy publishes the whole repo, so a later successful run republishes
whatever a failed one missed. The gap is a failure on the **most recent** commit
with no later push to cover it: that happened once, and phone-verses v2.3 /
sandbox v1.13 stayed unpublished for a month while the live site served v2.2 /
v1.12.

The publish step now retries twice before failing (Session 18, 2026-08-09), so
this should be rare. If the version in the running game's header doesn't match
the table above, check the Actions tab before assuming the table is wrong.

---

## Regenerating the version list

- **Which pages exist** → the `rollupOptions.input` block in `vite.config.js`.
- **Which version each page runs** → the `match3-v*` filename imported by that
  page's entry file. `tablet.html` uses `src/main.jsx`; every other page uses
  `src/entry-<name>.jsx`.

One command that prints the current versions:

```
grep -h "match3-v" src/main.jsx src/entry-*.jsx | grep import
```

---

## Version history by platform

Carried over verbatim from the `index.html` card descriptions as they stood on
2026-08-22, before those were shortened to a single line each. Entries are
newest-first within each platform, separated by `·`, exactly as they were
written at the time. Going forward, add the new version's line here when a
platform ships.

### 📱 Tablet — `tablet.html`

**Track:** Arcade

v12.1 · escalating target now survives navigation (was reset to base by the verses↔arcade round trip, and by any refresh) + tiered increments tapering at 12/24/36 wins + "Highest target reached" stat on the end screen · v12.0 · "Go to Verses" button on the end-game screen (reverse of the verses→arcade handoff; bonus moves carry via the shared wallet) + major-bump graduation marking the in-app tutorial as part of the game · v11.26 · tutorial panel 8 (fusion) reviewed & final — all 8 shared panels complete · v11.24 · tutorial panel 7 (scoring multipliers) reviewed & final · v11.22 · scoring math (multipliers + point values) extracted to shared core/ (no gameplay change) · v11.21 · tutorial panels 3-6 reviewed & final (bomb, cross, supernova, hypernova) · v11.19 · opt-in Tutorial button + shared core/ tutorial component (first 2 shared panels) · v11.18 · tile-drawing extracted to shared core/ module (no visual change) · v11.17 · bonus-move cap 99 → 999 (shared wallet w/ Tablet Verses) · v11.16 · T-3a stats-blob writes (bonusRoundsTaken → victoryRoundsTaken, endType bonusRound → victoryRound) · v11.15 T-2 importer-only update · v11.14 T-1 bundled terminology rename · v11.13 N-4 prompt-button confirm · v11.12 verses → arcade carry banner · v11.11 contrast fix · cap 99 · run tracking · scoring-history panel

### 🖥️ Desktop — `desktop.html`

**Track:** Arcade

v12.3 · T-3b storage-key migration (banked → bonus) · v12.2 T-2 bundled terminology rename · v12.1 full-size board · mouse + drag input

### ⏱️ Time Attack — `timeattack.html`

**Track:** Arcade

v12.4 · F-1 1.5s grace window after timer hits 0 (catches late cascade extensions) · v12.3 T-3b storage-key migration · v12.2 T-2 bundled terminology rename · v12.1 race against the clock · bonus moves pool · prompted on expiry

### 📲 Phone — `phone.html`

**Track:** Arcade

v14.1 · escalating target now survives navigation (was reset to base by the phone-verses round trip and by any refresh) + tiered increments at 12/24/36 wins + "Highest target reached" stat on the end screen · v14.0 · in-app Tutorial lands on the phone arcade (the eight shared match panels, opt-in button top-left) · header brought in line with tablet arcade — combo gets its own row with tier names, points multiplier and a high-score / best-combo fallback, and the ⭐/🎯 icons drop for plain "Score: / Moves: / Target:" labels · v13.7 · "Go to Verses" button on the end-game screen (reverse of the verses→arcade handoff; bonus moves carry via the shared wallet) · v13.6 · bonus-move cap 99 → 999 (shared wallet w/ Phone Verses) · v13.5 · T-3b storage-key migration (banked → bonus, lockstep w/ phone-verses) · v13.4 T-2 bundled terminology rename · v13.3.1 P-2 phone-418 → phone rename + header label fix · v13.3 P-1 responsive board (9×12, viewport-derived tile size, cap 40px) · v13.2 verses → arcade carry banner · v11.7 hypernova rework · cap 99 · end-confirm · run tracking

### 🗺️ Campaign — Tablet — `campaign.html`

**Track:** Campaign

v1.28 · T-2 bundled terminology rename (victory round / bonus moves) · v1.27 N-5 prompt-button confirm · v1.26 contrast fix · bonus cap 99 · best-run tracking · backup/restore · 1.5s timed grace

### 📖 Verses — Tablet — `verses.html`

**Track:** Verses

v2.4 · "See passage" button (top-left, during play) opens the current level's full passage — memorization peek without ending the round · v2.3 · "Arcade mode" button added to free-replay end screens (after a fully-completed multi-level passage, arcade is reachable on any level replay) · v2.2 · bonus moves usable in verses — banner offer on a loss (keep playing to reach target), "Use bonus moves" button on the passage screen after a win (pop leftover novas at 1.5×) · v2.1 · bug fix — first-move line reveal was skipped (second line never appeared) and single-level games froze at 0 moves with no end screen; both from one root cause · v2.0 · in-app Tutorial — 8 shared match panels + 2 verses panels (verse-reveal with Genesis 1:1 + target/moves); opt-in link on the passage-selection screen · v1.17 · play-through options — drill a level 2–4× (continuous) + "Repeat level" button + tiered target multiplier · v1.16 · board 10 → 12 rows (match Tablet Arcade grid) · v1.15 · persistent shared bonus-move wallet (Verses ⇄ Arcade) + cap 999 + Arcade button on single-level passages · v1.14 · Psalms 46, 97, 139 added (WEB/NKJV) · v1.13 card-title font shrink (>20 chars) + biblical-order picker sort + secret-unlock long-press · v1.12 T-3a stats-blob writes · v1.11 T-2 importer-only update · v1.10 T-1 bundled terminology rename · v1.9 N-5 prompt-button confirm · v1.8 N-1 content promotion to content/verses/ · stars + persistence + 1.5× + arcade handoff

### 📖 Verses — Phone — `phone-verses.html`

**Track:** Verses

v2.6 · fix — on the level-select screen the "← Back to passage selections" button overlapped the passage title (affected every passage); plus preventive safe-area padding so the top-left controls on both select screens can't slide under the iOS status bar · v2.5 · vertical layout — spare space split evenly top and bottom (was 29pt above / 86pt below), overflow can no longer push the header off the top, and on a screen too short for the layout the instructions panel retires after two moves and tiles size to the height as well as the width · v2.4 · fix — the top of the in-game header card was intermittently cut off on iPhone, with the status bar over the title (body margin zeroed, safe-area top padding, 100vh → 100dvh) · v2.3 · title-nudge tweak — medium-length titles (Isaiah, Habakkuk) eased back toward center · v2.2 · port from tablet-verses — bonus moves usable in verses (loss-path banner + win-path passage-screen button), "Arcade mode" on free-replay end screens, and a "See passage" button (top-left, during play) for the current level · v2.1 · bug fix — first-move line reveal was skipped (second line never appeared) and single-level games froze at 0 moves with no end screen; both from one root cause · v2.0 · in-app Tutorial — 8 shared match panels + 2 verses panels (verse-reveal with Genesis 1:1 + target/moves); opt-in link on the passage-selection screen; shared modal scales to fit the phone viewport · v1.11 · play-through options — drill a level 2–4× (continuous) + "Repeat level" button + tiered target multiplier · v1.10 · persistent shared bonus-move wallet (Verses ⇄ Arcade) + cap 999 + Arcade button on single-level passages · v1.9 · Psalms 46, 97, 139 added (WEB/NKJV) · v1.8 sandbox → main port (Mech A/B/C/D, ready gate, bias-spike fix, bonus interval 25K, target ×300/×500 split) · v1.7 card-title font shrink + biblical-order picker sort + secret-unlock long-press · v1.6 T-3b storage-key migration (banked → bonus, lockstep w/ phone arcade) · v1.5 T-3a stats-blob writes · v1.4.1 P-2 phone-418-verses → phone-verses rename + dormant header label fix · v1.4 T-1 bundled terminology rename · v1.3 N-6 responsive board (9×10, viewport-derived tile size, cap 40px) · v1.2 N-5 prompt-button confirm + Option B padding · v1.1 N-3 overflow fix · target × 250 · compact picker · phone-scoped storage + carry handoff

### 🧪 Reward Mode Sandbox — `rewardmode.html`

**Track:** Admin / Sandbox

v1.5 · fix — bonus-moves cap was still 99 here while every other platform uses 999, and since all platforms share one stored count, earning a bonus move here cut a &gt;99 total down to 99 and saved it back for arcade and verses (lockstep with tablet-sim v1.6) · v1.4 · VS-1 bundle: big-turn popup-delay fix (popup was firing before cascade animations finished settling) · v1.3 T-3a stats-blob writes · v1.2 T-2 importer-only update · v1.1 5 tunable levers wired into game logic (tile count, neighbor-bias, cluster-seed, cluster-drop-bias, big-turn special drops + HUGE-turn popup). Admin slider toggle for dev-time lever-fire console log.

### 🧪 Phone Verses Sandbox — `phone-verses-sandbox.html`

**Track:** Admin / Sandbox

v1.16 · fix — level-select back button overlapped the passage title, plus preventive safe-area padding on both select screens (lockstep with phone-verses v2.6) · v1.15 · vertical layout — even top/bottom spacing, overflow-safe centring, measured instructions-panel retirement after two moves on short screens, height-aware tile size (lockstep with phone-verses v2.5) · v1.14 · fix — in-game header card clipped at the top on iPhone (lockstep with phone-verses v2.4: body margin zeroed, safe-area top padding, 100vh → 100dvh) · v1.13 · title-nudge tweak — medium-length titles eased back toward center (mirrors phone-verses v2.3) · v1.12 · port from phone-verses — bonus moves usable in verses (loss banner + win passage-screen button), "Arcade mode" on free-replay end screens, and a "See passage" button (in-game Back removed to make room) · v1.11 · bug fix — first-move line reveal was skipped (second line never appeared) and single-level games froze at 0 moves with no end screen; both from one root cause · v1.10 · play-through options — drill a level 2–4× (continuous) + "Repeat level" button + tiered target multiplier · v1.9 · persistent bonus-move wallet (self-contained) + cap 999 + Arcade button on single-level passages · v1.8 · Psalms 46, 97, 139 added (WEB/NKJV) · v1.7 Mech C bias-spike survives invalid swaps · v1.6 nova-drop ready gate (drop lands on player's next match, not the trigger turn) · v1.5 card font + biblical sort + secret-unlock + target ×300/×500 split (was ×1000) · v1.4 Mech B (huge-turn drop) edge-case suppression: skip on first turn of level + skip when no playable turns remain (bonus-moves-aware) · bonus-moves earning threshold 10K → 25K (aligns with "great game" tier) · v1.3 rescue redesign + Mechanic D hypernova bias suppression · v1.2 floor-raise drop + bias 14% → 13% · v1.1 bias 10% → 14% · v1.0 Experimental tunables.

### 🤖 Tablet Sim — 1-ply + Monte Carlo — `tablet-sim.html`

**Track:** Admin / Sim

v1.6 · fix — bonus-moves cap 99 → 999 to match every other platform sharing the stored count (lockstep with reward-mode sandbox v1.5; fixed here before it was hit) · v1.5 · T-3a stats-blob writes · v1.4 T-2 importer-only update · v1.3 Headless simulation of tablet v11.11. Two bots: 1-ply heuristic (phase-weighted: match points + specials creation + proximity + line-of-effect + combo bonus, desperate-phase bonus-move awareness) and Monte Carlo (E-2a — N playouts per candidate swap, depth-cap-bounded rollouts, 1-ply-heuristic or random rollout strategy, Web Worker pool for parallelism). Admin batch runner — bot dropdown + MC params, adjustable target + moves, preset batch sizes, aggregate stats, score histogram, per-game table, clipboard-copy JSON.
