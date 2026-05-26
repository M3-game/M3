# Verses — TODO

Working backlog for the Verses platforms (tablet-verses, phone-verses,
phone-verses-sandbox). Created 2026-05-25.

When an item ships, its row moves from this doc to the **Done** section
of `docs/DEFERRED.md`, per the session-lifecycle workflow in CLAUDE.md.
New deferred items surfaced during scoping go here; not in DEFERRED.md.

Status key: **📋 planned** · **🚧 in flight** · **✅ shipped** · **🧊 deferred**

## Roster

| # | Item | Status | Effort |
|---|---|---|---|
| ~~8~~ | ~~Nova-drop timing fix (sandbox first, then main)~~ — **SHIPPED 2026-05-25 (sandbox v1.6)** | ✅ | S |
| 12 | Mech C bias-spike survives invalid-swap (sandbox) — follow-up from #8 | 📋 | S-M |
| 6 | Port sandbox enhancements to main | 📋 | M |
| 5 | Arcade mode after game completion | 📋 | M-L |
| 4 | Tutorial — big-moves / combos explainer | 📋 | L |
| 11 | Persistent progress across browser refreshes | 📋 | M-L (TBD) |
| 9 | Simulation modes (one-ply + Monte Carlo) | 📋 | L |
| 10 | Reward mode at game-end | 📋 | L (future scoping) |

Effort order is the working "next-up" sequence — items at the top are
the simplest / smallest to ship. #9 and #10 are deliberately held at
the end of the list per user direction during the 2026-05-25 scoping
pass (sims and reward-mode need other items to settle first). #12
discovered during #8 investigation 2026-05-25; details below.

## Details

### ✅ #8 — Nova-drop timing fix (sandbox)

**SHIPPED 2026-05-25 in sandbox v1.6.** Fix shape: added a "ready gate"
flag (`_pendingSpecialDropReady`) next to the existing `_pendingSpecialDrop`
queue. The gate is closed by default and only opens at the start of the
player's next `attemptSwap` (and only if a drop is queued). `fillEmptySpaces`
consumes the queue only when the gate is open, and closes the gate
immediately on consume. Net effect: a queued nova can only land in the
first refill of the player's next deliberate match — never in a refill
that's still part of the triggering turn, no matter how late.

**Player-level outcome:** the popup ("Hypernova drops on your next move")
now reliably matches what the player sees. The nova appears on the next
match the player makes, in that match's tile-fall.

Port to main pending TODO #6.

### #12 — Mech C bias-spike survives invalid-swap (sandbox)

**Pre-existing edge case** uncovered during #8 investigation. Mechanic
C's rescue drop comes with a bias spike (`FLOOR_RAISE_BIAS_SPIKE_PCT`
= 30%) intended to apply on the drop turn so the rescued special lands
among matchable neighbors. The spike is queued in `pendingBiasOverridePctRef`
and transferred to the live `biasOverridePctRef` at the end of every
turn-complete cycle.

If the player makes an **invalid swap** (a swap that doesn't form a
match, gets reverted) between the trigger turn and the consume turn,
the spike gets wiped before the consume turn's fill cycle reads it.
The nova drop itself still lands on the right turn (the gate fix in
#8 handles that), but the bias-spike placement help is lost — the
rescue special can land in a barren patch.

**Why not fixed in #8.** The cleanest fix interacts with Mech D's
mid-turn hypernova-suppression logic (Mech D also writes to
`biasOverridePctRef`, and the end-of-turn wipe is intentional for
Mech D's mid-turn override). Resolving cleanly needs its own scoping
pass.

**Dependency note.** #6 (port sandbox to main) should resolve or
explicitly carry this forward, since porting Mech C to main without
fixing the edge case carries the same bug to main.

**Open questions** (resolve at scoping):
- Should the bias-spike piggyback on the same gate as the drop (only
  apply when the drop's gate opens)?
- Or use a separate "queued-override survives turn-cycles while a
  drop is pending" rule on the existing pending ref?
- How to differentiate Mech D's mid-turn override (must wipe at
  turn-end) from Mech C's cross-turn override (must survive)?

### #6 — Port sandbox enhancements to main

Sandbox (phone-verses-sandbox v1.6) currently differs from main
(phone-verses v1.7, tablet-verses v1.13) on these mechanics:

- Neighbor-match bias 14% (`NEIGHBOR_BIAS_PCT`)
- Big-turn drop on 12+ tile clears (Mechanic B)
- Floor-raise drop with rescue redesign (Mechanic C, v1.3 form)
- Hypernova bias suppression (Mechanic D)
- Mech B edge-case suppression (v1.4)
- Bonus-moves threshold 25,000 (v1.4)
- Target × 300 / × 500 split at 17 moves (v1.5 / shipped item #3)
- Nova-drop "ready gate" so the queued drop lands only on the player's
  next deliberate match (v1.6 / shipped item #8)

**User decision (2026-05-25):** all 7 of these mechanics migrate to main.
(Plus the v1.6 gate from #8 to keep the nova-drop turn alignment intact.)

**Dependency:** TODO #12 (Mech C bias-spike invalid-swap edge case)
should either be resolved before this port lands, or carried forward
explicitly into main with a known-edge-case caveat. Porting Mech C
to main without #12 carries the same bug to main.

**Open questions:**
- Tablet-verses inherits identical changes or gets its own tuning pass?
- Main + tablet should match exactly after the port, or diverge by
  platform (e.g., target multipliers per device class)?
- Sandbox stays as the testing fork after the port — does its config
  diverge from main again on the next experiment, or do main/sandbox
  re-converge after each ported feature?

### #5 — Arcade mode after game completion

After a player clears all levels in a given book, unlock a "free-play"
/ "arcade mode" button on the end-of-game screen that drops them into
an arcade-style loop using that book's tiles.

**Open questions:**
- Per-book unlock (clear Matt 5 → arcade-mode unlocked for Matt 5
  only) or global (clear any one book → arcade-mode unlocked everywhere)?
- Arcade loop = existing phone-arcade gameplay imported wholesale, or
  a new verses-flavored arcade with the verses tiles + scoring rules?
- Persistence: where does the per-book unlock state live? Reuse the
  existing per-game progress slot in localStorage, or add a new key?
- Does arcade mode share the existing "secret unlock" gesture (#2),
  or have its own unlock affordance?

### #4 — Tutorial — big-moves / combos explainer

Optional tutorial that explains how big moves and combos lead to big
scores. Surfaced from the picker or on first-time entry.

**Open questions:**
- Multi-step animated walkthrough, or a single static explanation
  screen?
- Skippable on first run, with a "?" button to re-open later? Or
  always-on banner-style?
- Content authoring: illustrations, animated demo, or text + still
  screenshots?
- Where does the trigger live? Picker, first-time game entry, both?
- Per-platform copy (phone vs. tablet) or shared?

### #11 — Persistent progress across browser refreshes

**Bug.** localStorage progress sometimes wipes itself across browser
sessions. User has observed the wipe happen in under a day between
play sessions, with no manual clear. Affects both Verses platforms
**and main tablet arcade** — not Verses-only.

**Open questions** (resolve at scoping time):
- Why is localStorage getting cleared? Possible causes: browser
  eviction policy, "clear cookies on close" setting, iOS Safari's
  7-day non-interaction wipe, Cursor-preview hot-reload, etc.
  Investigation before fix.
- Fix shape: file export/import (manual save/restore), IndexedDB
  (more durable than localStorage), server-side persistence, or
  some combination?
- Scope: which platforms get the fix? At minimum Verses + tablet
  arcade (the user's stated cases); phone arcade and campaign
  likely benefit too.
- Backward compat: existing localStorage state needs to migrate
  into whatever storage we choose, otherwise users lose progress
  on the fix day.

### #9 — Simulation modes (one-ply + Monte Carlo)

Two new analysis tools for verses gameplay:

- **One-ply heuristic** — for a given board state, score each possible
  swap (or limited subset) and pick the best by some heuristic; no
  lookahead beyond one move.
- **Monte Carlo** — simulate N random playthroughs of a chosen level
  and report outcome distribution (score, win-rate, average move count,
  star distribution).

Held at the bottom until #8, #6, #5, #4, #11 settle. The gameplay needs
to be stable enough that simulation results are meaningful (running MC
against a moving target is wasted effort).

**Open questions:**
- Run in a Web Worker, or batch from CLI?
- Where do results land — overlay UI on the game, separate page,
  exported JSON?
- Cross-platform (run sim on tablet against phone scoring) or
  per-platform?

### #10 — Reward mode at game-end (future scoping)

After a player completes a game 3 / 5 / 7 / 10 times (and every 2–3
plays after that), offer an optional "reward mode" button at the
end-of-game screen. Similar in spirit to tablet-arcade's existing
reward mode.

Deliberately deferred for future scoping. Earlier items need to
ship and settle first; the precise reward shape will likely shift
once arcade-mode (#5) ships.

**Open questions** (preliminary, expect more at scoping):
- Reward content: bonus moves carry-over, a star multiplier on the
  next play, cosmetic unlock, narrated passage reveal?
- Trigger cadence: 3 / 5 / 7 / 10 then every 2–3, or different
  intervals once data shows what players actually do?
- Persistence: where does the play-count state live?
- Per-game or global completion count?

## Process notes

This doc replaces what was previously the "Verses planned-content"
and "Verses tuning" entries in `docs/DEFERRED.md`. New verses-related
work goes here. DEFERRED.md remains the project-wide deferred roster
for non-Verses items + the "Done" archive for shipped items across
all platforms.
