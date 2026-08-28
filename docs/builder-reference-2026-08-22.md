# M3 — Builder Reference

**Date:** 2026-08-22
**Audience:** you, not a future Claude session.

Practical how-to for operating the project: sharing it, collecting results from
play-testers, checking what's live, and running it locally. Everything else in
`docs/` records project state or instructs a coding session; this one is the
operator's manual.

**Rotation:** dated, like the progress and architecture docs. When it's
rewritten, the old copy moves to `docs/archive/` under its own date.

---

## Sharing the game with someone

**Send the direct page, not the game select screen.** The game select screen
(`https://m3-game.github.io/M3/`) lists seven playable builds — useful to you, a
guessing game for anyone else.

| Give them | If they're on |
|---|---|
| https://m3-game.github.io/M3/phone.html | a phone — arcade |
| https://m3-game.github.io/M3/phone-verses.html | a phone — memorize mode |
| https://m3-game.github.io/M3/tablet.html | a tablet — arcade |
| https://m3-game.github.io/M3/verses.html | a tablet — memorize mode |

The full list, including admin pages, is in the current
`docs/version-history-*.md`.

**Their progress is their own.** Game data lives in each browser's own storage,
so a tester's scores, runs and bonus moves never mix with yours, and yours never
reach them. Nothing needs setting up for this — it is a consequence of there
being no accounts and no server. See `docs/Architecture-*.md` → "Storage &
identity model".

**They will always be on your latest deployed version.** One URL, one build.
There's no way to hold a tester on an older version short of not deploying.

---

## Collecting results from a play-tester

There is no server, so nothing is reported automatically. The tester has to send
you a file. Three steps to give them:

1. Open the game with `?admin=1` on the end of the address — for example
   `https://m3-game.github.io/M3/phone.html?admin=1`
2. Tap **📥 Export JSON** in the panel that appears.
3. Send you the downloaded file.

The file contains their accumulated stats blob (`match3_stats`) — games played,
wins and losses by end type, scores, combos, bonus-move usage — plus an
`exportedAt` timestamp. It does not contain any personal information; there
isn't any to contain.

**Alternative way in:** long-press the score in the game header for about 1.5
seconds. Same panel, no URL editing, easier to describe over the phone.

**Unlocking the admin cards on the game select screen:** long-press the "🎮 M3" title for
1.5 seconds, or add `?admin=1`. This reveals the sandbox and sim entries, which
are hidden by default — a tester will not stumble into them.

---

## Checking which version is live

Three places, and they can disagree:

1. **In the running game** — the small `vX.Y` beside the title in the header.
   This is the truth about what a player is actually using.
2. **On the game select screen** — each card's first line.
3. **In the repo** — the `match3-v*` filename imported by the page's entry file
   in `src/`.

If the running game shows an older version than the repo, the last deploy
probably failed. Check the Actions tab on GitHub, or run `gh run list`. Every
deploy publishes the whole site, so the next successful push fixes it.

**Clearing a stale version from your own browser:** a hard reload usually does
it. The version label in the header is the check.

---

## Running it locally

```
npm install      # once
npm run dev      # http://localhost:5173/M3/
npm run build    # production build into dist/
npm test         # unit tests for core/gameLogic.js
```

The `/M3/` in the local address is required — it comes from `base: '/M3/'` in
`vite.config.js`. Dropping it gives a 404.

`npm run dev` also prints a second address on your local network. Open that on a
real phone or tablet on the same Wi-Fi to test on the actual device.

---

## Resetting your own progress for a clean test

Everything is in browser storage, so clearing site data for the M3 address
resets scores, runs, bonus moves and verses progress in one go. There is no
undo, and no backup.

To clear selectively, open the browser console on the game page and remove the
key you want. What each holds:

| Key | Holds |
|---|---|
| `match3_bonusMoves` | Bonus-move pool — tablet family (arcade, verses, campaign, reward mode, sim) |
| `match3_phone_bonusMoves` | Bonus-move pool — phone family (arcade, verses, sandbox) |
| `match3_desktop_bonusMoves` | Bonus-move pool — desktop only |
| `match3_timeattack_bonusMoves` | Bonus-move pool — time attack only |
| `match3_currentRun` / `match3_longestRun` | Consecutive wins — tablet |
| `match3_phone_currentRun` / `match3_phone_longestRun` | Consecutive wins — phone |
| `match3_difficultyBonus` | Accumulated escalating target (tablet arcade) |
| `match3_highestTarget` | Highest target reached |
| `match3_highScore`, `match3_highCombo`, `match3_highTurnScore` | Records, shared by both families |
| `match3_stats` | The stats blob the Export button writes |
| `m3_verses_*` / `m3_phone_verses_*` | Verses passage progress |

Example — clear just the arcade run and let the difficulty ramp start over:

```js
localStorage.removeItem('match3_currentRun');
localStorage.removeItem('match3_difficultyBonus');
```

Then reload.

---

## What makes each platform play differently

Same match-3 engine everywhere, but three things differ by platform, and the
differences are easy to forget when judging whether something "feels off".

### Board size

| Platform | Grid | Tiles |
|---|---|---|
| Tablet arcade, tablet-verses | 12 × 10 | 120 |
| Phone arcade, phone-verses | 12 × 9 | 108 |

A smaller board means fewer simultaneous match opportunities and shorter cascade
chains — and cascades are where the big scores come from.

### Difficulty numbers

Phone arcade uses **tablet's numbers unchanged**: target 5,000–6,500, moves
18–24, one bonus move per 10,000 points, and (from v14.1) the same escalating
target tiers. Those values were inherited, not tuned for the smaller board, and
have never been validated by play.

Phone-verses is different again: authored per-level targets rather than a random
range, and a bonus move per 25,000 points rather than 10,000.

### Generosity mechanics — phone-verses only

The small grid felt flat, so four mechanics were added to compensate. **They
exist only in phone-verses and its sandbox** — not in phone arcade, not in
either tablet platform. Constants at
`platforms/phone-verses/match3-v2.6-phone-verses.jsx:2199-2290`.

| Mechanic | What it does |
|---|---|
| **Neighbor-match bias — 13%** | Each refilled tile has a 13% chance of copying a random neighbour's colour, so clusters form more often and matches are easier to find. Tuned 10 → 14 → 13 across playtests. |
| **Big-turn special drops** | Clear 12+ tiles in one swap and the game rolls 10% for a hypernova, then 15% for a supernova, dropping it into the next refill. |
| **Floor-raise rescue** | If no big match has appeared by nine moves from the end, a rescue arms: 50% per turn for seven turns to drop a bomb, cross, supernova or hypernova (weighted 35/35/20/10). Bias spikes to 30% on the drop turn so the special lands somewhere useful. Silent — no popup. |
| **Hypernova bias suppression** | After a hypernova fires, bias drops to 8% for the rest of that turn, stopping hypernovas from chaining into more hypernovas. |

The reward-mode sandbox has adjustable versions of these ideas as tuning knobs
(`tile_count`, `neighbor_bias`, `cluster_seed`, `cluster_drop_bias`, big-turn
drops), all defaulting to off. That is where they were prototyped.

**The practical upshot:** phone arcade is the platform with the smaller board
*and* none of the compensations. If it feels harder than the tablet, that is the
first place to look — not a bug, an untested inheritance.

## Where things are written down

| Document | What it's for |
|---|---|
| `docs/PROGRESS-*.md` | What shipped, session by session, and why |
| `docs/DEFERRED.md` | Everything planned or deferred |
| `docs/DESIGN.md` | Game mechanics, scoring, unlock gates |
| `docs/Architecture-*.md` | Repo layout, storage model, direction |
| `docs/version-history-*.md` | Per-platform change history and all URLs |
| `CLAUDE.md` | Instructions for a coding session |
| This file | How to operate the project |
