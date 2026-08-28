# M3 — Version URLs

**Date:** 2026-08-09
**Supersedes:** `docs/archive/version-urls-2026-03-20.md`

> **Why this was rewritten.** The 2026-03-20 version had gone stale: it listed
> two pages that no longer build (`phone341.html`, and a "Phone 418px" address
> pointing into `platforms/phone-418/`, retired in Session P-2 on 2026-05-02),
> and it was missing six pages added since — tablet verses, phone arcade,
> phone verses, phone verses sandbox, reward-mode, and tablet sim.
>
> **This file is a convenience copy, not the source of truth.** The
> authoritative list of pages is `vite.config.js` (the `rollupOptions.input`
> block); the authoritative version for each page is the filename imported by
> its entry file in `src/`. If this doc and those disagree, those win — and
> this doc needs rewriting again. See "Regenerating this list" at the bottom.

---

## Live (GitHub Pages)

Base: `https://m3-game.github.io/M3/`

| Page | Platform | Version | URL |
|---|---|---|---|
| Menu | landing page | — | https://m3-game.github.io/M3/ |
| Arcade — Tablet | `platforms/tablet/` | v12.0 | https://m3-game.github.io/M3/tablet.html |
| Arcade — Phone | `platforms/phone/` | v14.0 | https://m3-game.github.io/M3/phone.html |
| Arcade — Desktop | `platforms/desktop/` | v12.3 | https://m3-game.github.io/M3/desktop.html |
| Arcade — Time Attack | `platforms/timeattack/` | v12.4 | https://m3-game.github.io/M3/timeattack.html |
| Verses — Tablet | `platforms/tablet-verses/` | v2.4 | https://m3-game.github.io/M3/verses.html |
| Verses — Phone | `platforms/phone-verses/` | v2.6 | https://m3-game.github.io/M3/phone-verses.html |
| Verses — Phone Sandbox | `platforms/phone-verses-sandbox/` | v1.16 | https://m3-game.github.io/M3/phone-verses-sandbox.html |
| Campaign — Tablet | `platforms/campaign/tablet/` | v1.28 | https://m3-game.github.io/M3/campaign.html |
| Reward-mode sandbox | `platforms/tablet-rewardmode/` | v1.4 | https://m3-game.github.io/M3/rewardmode.html |
| Tablet Sim | `platforms/tablet-sim/` | v1.5 | https://m3-game.github.io/M3/tablet-sim.html |

**Retired — these addresses no longer work:**

| Page | Retired |
|---|---|
| `phone341.html` | Session P-2, 2026-05-02. Files kept in `platforms/phone-341/archive/` for reference; no longer built. |
| `platforms/phone-418/match3-v11-418px-phone.html` | Session P-2, 2026-05-02. `phone-418` was renamed to `phone`; use `phone.html` above. |

---

## Local dev (`npm run dev`)

Base: `http://localhost:5173/M3/` — same page names as above.

Examples: http://localhost:5173/M3/ · http://localhost:5173/M3/phone-verses.html ·
http://localhost:5173/M3/tablet.html

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
whatever a failed one missed. The gap is a failure on the **most recent**
commit with no later push to cover it: that happened once, and phone-verses
v2.3 / sandbox v1.13 stayed unpublished for a month while the live site served
v2.2 / v1.12.

The publish step now retries twice before failing (Session 18, 2026-08-09), so
this should be rare. If the version in the running game's header doesn't match
the table above, check the Actions tab before assuming the table is wrong.

---

## Regenerating this list

This doc goes stale whenever a page is added or a platform version is bumped,
which is most sessions — so treat it as a snapshot with a date, not a living
index. To rebuild it:

- **Which pages exist** → the `rollupOptions.input` block in `vite.config.js`.
  Every entry there is a page; the key is its name, the value its HTML file.
- **Which version each page runs** → the `match3-v*` filename imported by that
  page's entry file. `tablet.html` uses `src/main.jsx`; every other page uses
  `src/entry-<name>.jsx`, named in the HTML's `<script src>` tag.

One command that prints the current versions:

```
grep -h "match3-v" src/main.jsx src/entry-*.jsx | grep import
```

Per the rotation convention used for `PROGRESS-YYYY-MM-DD.md`: when this file
is rewritten, move the old one to `docs/archive/` under its own date rather
than overwriting it.
