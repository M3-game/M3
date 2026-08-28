# M3 Game — Architecture

**Date:** 2026-08-22
**Supersedes:** `docs/archive/Architecture-2026-03-20.md`, which was written
during initial scaffolding and had gone substantially out of date — it still
described core extraction as not yet started, listed retired platforms, and
carried the wrong deployment path.

Read this at session start alongside the latest `docs/PROGRESS-*.md` and
`docs/DEFERRED.md`.

---

## Overview

Monorepo for a match-3 game targeting multiple form factors. Each platform is a
standalone React component in `platforms/<platform>/`, built by Vite into a
static site and served by GitHub Pages. There is **no server and no backend** —
see "Storage & identity model" below, which is the single most consequential
fact about this architecture.

## Repository structure

```
M3/
  .github/workflows/deploy.yml   Auto-deploy to GitHub Pages on push to main
                                 (publish step retries twice; see PROGRESS 2026-08-09)
  core/                          Shared code, EDITED IN PLACE (never versioned)
    AdminPanel.jsx               Dev stats/admin panel; also owns the shared
                                 storage-key constants STATS_KEY, BONUS_MOVES_KEY
    gameLogic.js                 Match finding, scoring math, multipliers
    gameLogic.test.js            Vitest unit tests (npm test)
    tileDrawing.js               Canvas tile rendering
    Tutorial.jsx                 Shared tutorial panels (8 match + 2 verses-only)
    versesOrder.js               Canonical passage ordering
  platforms/                     One directory per platform, each with archive/
    tablet/  tablet-verses/  tablet-rewardmode/  tablet-sim/
    phone/   phone-verses/   phone-verses-sandbox/
    campaign/tablet/
    desktop/ timeattack/
    phone-341/                   RETIRED (Session P-2, 2026-05-02) — archive only,
                                 no longer builds
  content/verses/                Passage content, auto-discovered at runtime
  levels/campaignConfig.js       Campaign level definitions
  src/                           One entry file per platform + main.jsx
  docs/                          Project documentation (archive/ for superseded)
  assets/                        Shared images, icons, audio
  *.html                         One page per platform at the repo root
```

Every platform is reached by its own HTML page: `index.html` (the game select screen),
`tablet.html`, `verses.html`, `phone.html`, `phone-verses.html`,
`phone-verses-sandbox.html`, `campaign.html`, `desktop.html`, `timeattack.html`,
`rewardmode.html`, `tablet-sim.html`. Each page loads its matching
`src/entry-*.jsx`, which imports one versioned platform file.

**Navigation between platforms is a full page load** (`window.location.href`).
This is why in-memory state does not survive moving between arcade and verses —
the cause of the v12.1 escalating-target bug. Anything that must persist across
a mode switch has to be written to storage.

## Version convention

Platform files are versioned, never overwritten: archive the current file, create
an incremented one, update `src/entry-*.jsx` and the `index.html` label, the
in-file comment block, and the in-game version label. **`core/` is the exception
— edited in place**, because versioning it would force renames across every
importer. Full rules and the pre-commit checklist are in `CLAUDE.md`.

Files inside any `archive/` folder are read-only history. Never modify them.

## Shared code

Core extraction has happened and is ongoing: `gameLogic.js` (v11.22),
`tileDrawing.js` (v11.18), `Tutorial.jsx` (v11.19), `versesOrder.js`, and
`AdminPanel.jsx`. What remains scattered across platform files is documented in
`DEFERRED.md` → "Cross-platform parity"; the bonus-moves cap divergence of
2026-08-22 is the worked example of why that matters.

## Storage & identity model

**This section describes what is true today, not what is intended.**

There is no concept of a *person* anywhere in this codebase. No accounts, no
profiles, no login, no server, and no network calls of any kind — `package.json`
carries React and Vite and nothing else. All progress lives in the browser's
`localStorage`, which belongs to one browser on one device.

Storage is split into two families by key prefix, which is a naming convention
rather than a designed boundary:

| Family | Platforms | Bonus moves | Run tracking |
|---|---|---|---|
| Tablet | tablet arcade, tablet-verses, campaign, reward mode, sim | `match3_bonusMoves` (from `core/AdminPanel.jsx`) | `match3_currentRun` / `match3_longestRun` |
| Phone | phone arcade, phone-verses | `match3_phone_bonusMoves` (defined per file) | `match3_phone_currentRun` / `match3_phone_longestRun` |

Other keys in use include `match3_highScore`, `match3_highCombo`,
`match3_highTurnScore`, `match3_stats`, `match3_difficultyBonus`,
`match3_highestTarget`, the `m3_verses_` / `m3_phone_verses_` progress prefixes,
and sandbox-suffixed variants.

Consequences, all currently true:

- **Two people sharing one device share one set of everything** — scores, runs,
  bonus moves. Neither can have their own.
- **One person using a phone and a tablet has two unconnected sets of
  progress**, with no way to link them.
- **Clearing browser data deletes everything**, with no backup or recovery.
- **A storage key defined in more than one place can silently diverge.** This
  has already caused real data loss once (bonus-moves cap, 2026-08-22).

## Direction: multiple players and optional device linking

**Recorded 2026-08-22 as direction, not committed work.** Nothing here is
scheduled. It is written down so that day-to-day decisions — particularly any
choice about how a new piece of state is stored or scoped — are made with the
destination in view rather than by local convenience.

The goal: different people can use the app on phones or tablets, and can connect
their phone and tablet progress if they choose, or leave them separate.

Four stages, in dependency order. Each is a real body of work and the later ones
change what this project *is*:

1. **Centralize storage access.** Today's keys are scattered across ten platform
   files as loose `localStorage` calls. Nothing global can change safely until
   one module in `core/` owns every read and write. Worth doing on its own
   merits regardless of whether accounts are ever built, and a prerequisite for
   everything below.
2. **Local profiles.** A player-identity concept with keys namespaced per
   profile, allowing several people to use one device. Still entirely local, no
   server.
3. **Accounts and a backend.** The threshold decision. Requires a server, sign-in,
   a database, and a hosting change — GitHub Pages serves static files only. It
   also introduces user data, privacy obligations, and running costs that this
   project currently does not have at all.
4. **Linking and merging.** Deciding what happens when two devices disagree —
   phone says 50 bonus moves, tablet says 120. Merge rules have to be chosen per
   statistic, and this is harder design work than it first appears.

Work items tracking these stages are in `DEFERRED.md` → "Multi-player and device
linking".

## Build, dev, and deployment

- **Dev server:** `npm run dev` (Vite) — `http://localhost:5173`, plus a local
  network URL for device testing.
- **Build:** `npm run build` → `dist/` (generated, not committed).
- **Tests:** `npm test` (Vitest) — currently covers `core/gameLogic.js`.
- **Base path:** `vite.config.js` sets `base: '/M3/'`.
- **Deployment:** GitHub Pages at `https://m3-game.github.io/M3/`, auto-deployed
  on every push to `main` by `.github/workflows/deploy.yml`. Every deploy
  publishes the whole repository, so a later successful run covers an earlier
  failed one — except when the failed run is the last push for a while, which
  has happened. Per-version URLs are in `docs/version-urls-*.md`.

## Notes

- Single `main` branch.
- All platforms share tile types, special mechanics, and scoring rules.
- Verses content under `content/verses/` is auto-discovered at runtime, but
  adding content still requires a version bump on every Verses platform — see
  `CLAUDE.md`.
