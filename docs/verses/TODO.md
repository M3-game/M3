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
| ~~12~~ | ~~Mech C bias-spike survives invalid-swap (sandbox)~~ — **SHIPPED 2026-05-25 (sandbox v1.7)** | ✅ | S |
| ~~6~~ | ~~Port sandbox enhancements to main~~ — **SHIPPED 2026-05-25 (phone-verses v1.8). Tablet-verses deferred.** | ✅ | M-L |
| 5 | Arcade mode after game completion | 📋 | M-L |
| 4 | Tutorial — big-moves / combos explainer | 📋 | L |
| 11 | Persistent progress across browser refreshes | 📋 | M-L (TBD) |
| 13 | Port sandbox enhancements to tablet-verses | 📋 | M (TBD later) |
| 9 | Simulation modes (one-ply + Monte Carlo) | 📋 | L |
| 10 | Reward mode at game-end | 📋 | L (future scoping) |

Effort order is the working "next-up" sequence — items at the top are
the simplest / smallest to ship. #9 and #10 are deliberately held at
the end of the list per user direction during the 2026-05-25 scoping
pass (sims and reward-mode need other items to settle first). #12
discovered during #8 investigation 2026-05-25 and shipped the same day.

**End-of-day 2026-05-25 state:** items #1, #2, #3, #7, #8, #6, #12 all
shipped today across phone-verses v1.6 → v1.8, sandbox v1.4 → v1.7,
tablet-verses v1.12 → v1.13. Remaining backlog: #5, #4, #11, #9, #10
(see details below). Tablet-verses inheritance of sandbox mechanics
remains deferred — phone-verses v1.8 has the full sandbox layer, but
tablet-verses v1.13 is still on the pre-port state (uniform × 300
target, no Mech A/B/C/D). Track as a future port pass when there's
appetite.

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

### ✅ #12 — Mech C bias-spike survives invalid-swap (sandbox)

**SHIPPED 2026-05-25 in sandbox v1.7.** Pre-existing edge case
uncovered during #8 investigation. Mechanic C's rescue drop carries
a bias spike (`FLOOR_RAISE_BIAS_SPIKE_PCT` = 30%) intended to apply
on the drop turn so the rescued special lands among matchable
neighbors. Previously the spike transferred from
`pendingBiasOverridePctRef` → `biasOverridePctRef` at the end of
every turn-complete cycle, which meant an invalid swap (no-match
swap-revert) between trigger turn and consume turn would wipe the
spike before the consume turn read it.

Fix shape (aligned with v1.6 ready-gate timing): the transfer
moves from "end of every turn-cycle" → "start of the next
`attemptSwap`, only when a drop is queued." On consume in
`fillEmptySpaces`, both the live override and the pending ref get
cleared. Mech D's mid-turn hypernova-suppression still gets wiped
before the next turn's fills run, via the new attemptSwap-start
wipe. Three code touches: `attemptSwap` block, `fillEmptySpaces`
consume, removal of the Mech C useEffect end-of-cycle transfer.

Port to main pending TODO #6 — included in the #6 port (sandbox v1.7
includes the bias-spike fix, so phone-verses v1.8 inherits it
automatically when sandbox copies in).

### ✅ #6 — Port sandbox enhancements to main

**SHIPPED 2026-05-25 in phone-verses v1.8.** Migrated 8 sandbox-only
features into main phone-verses, keeping storage keys and header
label distinct so sandbox progress doesn't bleed into main play:

- Mechanic A — neighbor-match bias on refill tiles (13%).
- Mechanic B — big-turn special drop (12+ tile clear → roll for
  hyper/super → queue) with v1.4 edge-case suppression.
- Mechanic C — floor-raise rescue drop with v1.3 redesign (dynamic
  trigger move, 7-turn window, weighted drop, 30% bias spike).
- Mechanic D — hypernova bias suppression (8% for rest of fire turn).
- v1.6 ready gate — drop consumes only on player's next deliberate match.
- v1.7 bias-spike survives invalid-swap (#12 fix included).
- `BONUS_MOVE_INTERVAL` 10000 → 25000.
- Target-score formula split (`moves < 17 → × 300`, `moves ≥ 17 → × 500`).

**Approach:** file copied wholesale from sandbox v1.7 as baseline
(sandbox is the historical descendant of phone-verses, so this is the
correct lineage direction). Then storage-key suffixes stripped, header
label flipped, top comment block rewritten. Verification ran two
diffs post-port: (1) v1.8 vs sandbox v1.7 showed only the intended
differences (new comment, 8 storage strings, header); (2) v1.8 vs
archived v1.7 confirmed 102 mentions of sandbox identifiers in v1.8
vs 0 in v1.7 — full migration confirmed.

**Player-state discontinuity at the upgrade boundary:**
- Bonus moves: existing players keep their accumulated count, but
  the next earned bonus move arrives at the next 25,000-multiple
  above current score (was per 10,000). No retroactive award for
  the gap.
- Targets: levels in flight at the upgrade keep their pre-port
  target (snapshot at level start); new levels use the split formula.

**Tablet-verses deferred.** Per user direction, tablet-verses
v1.13 stays on the pre-port state (uniform × 300 target, no Mech
A/B/C/D, no gate). Future port pass when there's appetite.

**Sandbox future.** Sandbox v1.7 stays as a separate testing fork.
Today it effectively re-converges to main (same mechanics + tuning)
but with its own storage namespace so its progress doesn't mix.
Next experimental change will diverge sandbox from main again.

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

### #13 — Port sandbox enhancements to tablet-verses

> **⏸ PARKED — superseded by June-20 update item (c) (decision
> 2026-06-22, shipped as tablet-verses v1.16).** Tablet-verses and
> phone-verses are now intentionally maintained as two *different*
> games with different mechanics. The phone version's smaller screen
> plays as boring without the enhanced sandbox mechanics (Mech
> A/B/C/D), which is why phone got them. The tablet version is engaging
> on the larger screen without them, so it does **not** need this port.
> Tablet-verses parity work instead targets tablet *arcade* (item (c) —
> which shipped the matching 12-row grid), not phone-verses. Revisit
> #13 only if that stance changes.

Deferred from #6 on 2026-05-25 — phone-verses got the full sandbox
layer (Mech A/B/C/D, edge-case suppressions, ready gate, bias-spike
fix, BONUS_MOVE_INTERVAL = 25000, target × 300 / × 500 split) but
tablet-verses stayed on the pre-port state (uniform × 300 target,
no Mech A/B/C/D). User direction at the time: "keep tablet and
phone-verses separate; TBD later."

If/when picked up: same approach as #6 likely applies — start from a
copy of phone-verses v1.8 (the post-#6 main), apply tablet-specific
edits (tablet's storage keys, board dimensions, header label, target
multiplier if it should differ from phone). Or copy from sandbox v1.7
with full diff verification, mirroring how #6 worked.

**Open questions** (resolve at scoping time):
- Tablet keeps × 300 / × 500 (matching phone) or its own multiplier?
- Are there tablet-specific UI considerations for the big-turn popup
  and 🔓 indicator at larger viewports?
- Do tablet-verses players want a per-platform bonus-move cadence
  (e.g., 25,000 might feel sparser on tablet's longer play sessions)?
- localStorage keys stay tablet-specific (no merge with phone).

No active timeline. Track here so we don't lose the thread.

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
