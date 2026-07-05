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
| 4 | **Tutorial** — portable animated tutorial (shared `core/` component) covering match concepts + a verses-specific scoring-target & move-ceiling explainer + a campaign progression mini-tutorial. Subsumes F-3. **Session 1 shipped 2026-06-23 (drawing → `core/`, tablet v11.18). Session 2 shipped 2026-06-27 (`core/Tutorial.jsx` + tablet v11.19): 2 of 8 shared panels (basic match, line special). Session 3 shipped 2026-07-03: panels 3–6 (v11.21); scoring extraction (v11.22); panel 7 multipliers (v11.24); panel 8 fusion (v11.26) — **ALL 8 shared panels done on tablet arcade.** Session 4 shipped 2026-07-04: **PORT to tablet-verses (v2.0)** — shared modal wired in + the two verses-only panels built (V1 reveal-the-verse with Genesis 1:1, V2 target/moves) + opt-in "Tutorial" link on the passage-selection screen. Session 5 shipped 2026-07-04: **PORT to phone-verses (v2.0)** + responsive scaling in `core/Tutorial.jsx` so the modal fits a phone viewport. **DONE for the useful scope** — all 10 panels live on both verses platforms. Remaining sandbox + campaign ports carved out (not queued) — see Details.** | ✅ (done for useful scope; sandbox + campaign ports carved out) | L |
| BM | **Use bonus moves in verses** — bonus moves were earned + shown in verses but unspendable there. Now usable: LOSS drops the arcade "Use bonus moves / End and carry" banner (keep playing toward target); WIN adds a "Use bonus moves" button to the passage screen (keeps 1.5× victory round). Loss-path bonus play stays 1× (decision 4). **Shipped on all three verses platforms 2026-07-04: tablet-verses v2.2 (Session 7), phone-verses v2.2 (Session 11), sandbox v1.12 (Session 13). DONE.** See Details. | ✅ (all 3 verses platforms) | M (per port) |
| AB | **Arcade button on free-replay end screens** — "Arcade mode" now also shows on the free-replay end screen (any level replay once a multi-level passage is fully completed, win or fail). Was previously missing there, so arcade vanished on all replays after 100%-ing a passage. Scope: final-level/free-replay only — NOT on first-pass non-final wins or first-pass fails (user direction). **Shipped on all three verses platforms 2026-07-04: tablet-verses v2.3 (Session 8), phone-verses v2.2 + sandbox v1.12 (Sessions 11/13), → phone.html on the phone platforms. DONE.** | ✅ (all 3 verses platforms) | S (per port) |
| SP | **"See passage" button** — in-game button that opens the CURRENT LEVEL's full passage during play (memorization peek, no round end). Current level only — whole-game text already reachable via "See entire <title>" + end screen. Tablet: top-left, right of Back. Phone: top-left (the in-game Back button was REMOVED there to make room — header too tight); long titles get font tiers + a right-nudge to clear the button. **Shipped on all three verses platforms 2026-07-04: tablet-verses v2.4 (Session 9), phone-verses v2.2 + sandbox v1.12 (Sessions 11/13). DONE.** **Future option (user, 2026-07-04): make the rolling passage text bar itself tappable/expandable to show more lines — a zero-chrome alternative/addition if more passage visibility is wanted.** | ✅ (all 3 verses platforms) | S (per port) |
| GV | **"Go to Verses" button in arcade** — the reverse of the verses→arcade handoff. Button on the arcade end-game screen (win + loss) navigating to the verses selection screen; always shown; bonus moves carry via the shared wallet (automatic). NOTE: this is an **arcade-side** change (not a verses platform file). **Tablet arcade shipped v12.0 (Session 10; also lands the tutorial-graduation bump); phone arcade shipped v13.7 (Session 12), → phone-verses.html. DONE — both arcades.** | ✅ (both arcades shipped) | S (per arcade) |
| 10 | **Reward mode** — arcade reward round in **both tablet + phone arcades**; verses inherits it via the "Arcade mode" handoff. Phone needs its own enhancements (TBD in sandbox) → separate phone/tablet reward-level versions. Merges Session I; replaces the old verses-internal #10. | 📋 | XL (sandbox scoping) |
| 9 | **Simulation modes** (one-ply + Monte Carlo) — also informs reward-level tuning + the item-(b) target multiplier | 📋 | L |
| 11 | **Persistent progress** across browser refreshes | 📋 | M-L (TBD) |
| M | **Music — add music to verses** (verses-only; very large). Detailed scope is in an external claude.ai project discussion — not accessible to future sessions; import/re-derive with the user before building. | 📋 | XL (scope external) |
| 5 | Arcade mode after game completion — **⏸ PARKED 2026-06-23. Verify-only** (see detail). | 🧊 | S (verify) |
| 13 | Port sandbox enhancements to tablet-verses — **⏸ PARKED, superseded by item (c) 2026-06-22** (see detail). | 🧊 | M (parked) |

**Priority order (revised 2026-06-23, user-set).** The active sequence
above is now an explicit priority order (previously it was "smallest
effort first"): #4 tutorial → #10 reward mode → #9 simulation → #11
persistent progress → Music. #5 and #13 are parked at the end. Reward
mode (#10) depends on the Session H sandbox lever tuning being settled,
and its phone version needs its own enhancement pass in sandbox before
it can ship; simulation (#9) will help tune both reward levels and the
item-(b) target multiplier.

**End-of-day 2026-05-25 state:** items #1, #2, #3, #7, #8, #6, #12 all
shipped today across phone-verses v1.6 → v1.8, sandbox v1.4 → v1.7,
tablet-verses v1.12 → v1.13. Remaining backlog: #5, #4, #11, #9, #10
(see details below). Tablet-verses inheritance of sandbox mechanics
remains deferred — phone-verses v1.8 has the full sandbox layer, but
tablet-verses v1.13 is still on the pre-port state (uniform × 300
target, no Mech A/B/C/D). Track as a future port pass when there's
appetite.

## Details

### 🚧 BM — Use bonus moves in verses

**Scope set + tablet-verses shipped 2026-07-04 (Session 7, v2.1 → v2.2).**
Bonus moves are earned (shared wallet with arcade) and shown in the verses
header, but until now could not be spent inside a verses game — the arcade
"use bonus moves" flow was suppressed under `VERSES_MODE`. Now wired in.

**Behavior (decisions locked with user 2026-07-04):**
- **Loss (0 moves, below target):** instead of jumping to the passage screen,
  the arcade banner drops down over the still-visible board ("⚠️ Out of moves!
  / Use bonus moves / End and carry moves forward"). "Use bonus moves" resumes
  play (each swap draws from the wallet; the passage stays fully revealed since
  the reveal is tied to regular moves, which stay at 0). The in-header "End and
  carry" button (with below-target confirm) ends the round → passage screen.
- **Win (0 moves, at/above target):** the passage screen appears with an added
  "Use bonus moves" button (only when the wallet is non-zero). Clicking it
  returns to the board with the 1.5× victory round still on; ending re-opens the
  passage screen.
- **Completion:** reaching target on bonus moves completes the level (stars +
  next-level unlock).
- **Decision 4 (victory round):** a victory round already active on a WIN is
  kept (leftover novas pop at 1.5×). On a LOSS, crossing target during bonus
  moves completes the level but does NOT switch the 1.5× on (and the "Target
  reached — 1.5×!" toast is suppressed on that path). It wasn't a victory
  earned in regular play.

**Remaining: PORT to phone-verses (v2.1 → v2.2) and phone-verses-sandbox
(v1.11 → v1.12).** Same structural change — the verses end-of-round effect, the
3 input-freeze guards, `endLevelCarryBonus` (VERSES branch), a new
`resumeBonusFromPassage` handler, the passage-screen button matrix, and the
target→victory-round loss-path guard. The bonus-move + end-of-round code is
near-identical across the three platforms, so the port is mechanical; re-verify
line numbers per file. Tablet-first pilot done; port when ready.

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

### #5 — Arcade mode after game completion — ⏸ PARKED 2026-06-23

**Parked per user direction (2026-06-23).** The original framing below —
"unlock an arcade-style loop using that book's tiles / a verses-flavored
arcade" — was **not** the intent and doesn't map onto the game: tiles are
the same 6 gem types for every passage, so there's no "book's own tiles,"
and there's no distinct "verses flavor" of tiles. The user does not want
a verses-flavored arcade.

**Remaining task — verify-only (S):** confirm the *existing* verses →
arcade transition is good. There's already an **"Arcade mode" button** on
verses end screens (single-level passages + the multi-level final-level
win) that navigates to the standalone arcade (tablet.html / phone arcade).
If that transition and the arcade gameplay it lands in feel fine in
playtest, **no further work is needed and this item can be closed.** Only
reopen with a concrete, intent-checked scope if the check finds a real gap.

_(Original framing, superseded — kept for history: "After a player clears
all levels in a given book, unlock a free-play / arcade-mode button that
drops them into an arcade-style loop using that book's tiles," with open
questions on per-book vs. global unlock, imported vs. new arcade,
persistence, and unlock gesture.)_

### #4 — Tutorial (portable animated; + scoring/ceiling explainer)

Scope set 2026-06-23. Build **one portable, reusable tutorial component**
(in `core/` so every platform can use it), primarily for verses but
designed to drop into any platform. **F-3 (campaign animated tutorials)
is subsumed:** campaign reuses this shared component and adds only a
small campaign-specific progression mini-tutorial on top.

**▶ Ports status (2026-07-04): DONE for the useful scope.** All 10 panels
(8 shared match panels + V1 reveal-the-verse + V2 target/moves) are built and
live on the two platforms players actually use — **tablet-verses v2.0** and
**phone-verses v2.0**. The two remaining ports are carved out and **not queued**:

- **Sandbox tutorial port — not queued.** The tutorial lives in shared
  `core/Tutorial.jsx`, so tweaks are made there and seen immediately on
  tablet-verses / phone-verses. Potential future use (user, 2026-07-04): a
  **dev-mode sandbox** as a place to try different versions of the tutorial or
  additional content. The button itself isn't the point — the value would be
  the experimentation space. Revisit if/when that kind of experimentation
  becomes useful; otherwise a tutorial is not needed in the dev-focused sandbox
  mode.
- **Campaign tutorial port — blocked on product direction, not engineering.** A
  campaign "progression mini-tutorial" can't be designed until it's decided what
  campaign mode is *for*. Parked; revisit only alongside the campaign-direction
  decision captured in `DEFERRED.md` ("Campaign mode — what is it for?").

**Content split (shared vs. platform-specific):**
- **Shared (every platform):** how matching works · 4/5-match → special
  tiles · "big moves" (large single clears) · combos/cascades multiplying
  score.
- **Verses-only (shown in the verses instance):** how the target score is
  set (the tiered length × multiplier) · the "play 2–4×" drill + the
  60-move ceiling · chunk reveals / memorization. (These are verses
  mechanics — the arcades use a random target and have no drill ceiling.)
- **Campaign-only mini-tutorial:** level progression + unlock gating.

**📋 Full shared-panel storyboard (all 8 panels) + governing principles +
scoring-mechanics reference: [`tutorial-storyboard.md`](tutorial-storyboard.md)
(captured 2026-06-23). The 8 shared panels are storyboarded; verses-only
panels, the campaign panel, and modal flow are not yet — see that doc's
"Still open."**

**Locked scoping decisions (2026-06-23 session):**

1. **v1 animation cut — hybrid.** Animate the *shared* match concepts
   (match → 4/5-match specials → "big move" large clear → cascade/combo
   multiplying score), because those are motion concepts a static picture
   teaches poorly. Keep the *verses-only* and *campaign-only* panels
   **static** for v1 — they're rules-and-numbers (target formula, 60-move
   ceiling, unlock gating) where animation adds little. (Reasoning: the
   risky/uncertain part of a tutorial is content/order/wording, but the
   match concepts genuinely need motion; the existing canvas tile-drawing
   already animates in the live game, so animation isn't a from-scratch
   render layer.)
2. **Trigger + skippability — opt-in button, never a forced modal.**
   Skippable and entirely opt-in: the tutorial is opened by a **button on
   a screen the player already passes through**, *not* an auto-appearing
   modal they must dismiss every time they play (that would tax the most
   frequent action). Placement rule: put the button on an existing
   pre-game screen where one exists — for **verses** that's the
   start-of-round passage screen (the "Begin" screen); otherwise use a
   small, unobtrusive button in the game header **labeled the plain word
   "Tutorial"** — *not* a "?" icon (ambiguous noise; could read as a
   question or a quiz rather than help). Always available, never blocking.
   **Tablet arcade's** exact placement is TBD at build time — confirm
   whether it has a pre-game screen; if not, the header "Tutorial" button.
3. **Component architecture — Option A (core holds all sections).** The
   one `core/` tutorial component contains every section type (shared +
   verses + campaign). Each platform passes it two small things: an
   ordered list naming which sections to show, and a little bundle of its
   own numbers/copy (e.g. that platform's real target multipliers, which
   differ tablet vs. phone). Platform files gain only a button + a few
   lines — they don't carry the panel code. Chosen over "core stays
   generic, platforms pass their own panels in" specifically to keep the
   big (~6,000-line) platform files from growing. Ties to the DEFERRED.md
   "Move shared code into `core/`" architecture item.
4. **Visual rendering — Option A (reuse the real game's tile drawing) for
   pixel-exact fidelity.** The animated demos paint with the *same*
   `drawTile` / `drawSpecialIcon` canvas code the live game uses, so
   tutorial tiles are identical to gameplay tiles. That code currently
   lives copied inside every platform file, not in `core/` — so this
   requires extracting those two functions into `core/` first (see build
   sequence). User chose exactness over the lighter HTML/CSS-tile option.

**Divergence finding (read-only check, 2026-06-23) — informs the
extraction:** the `drawTile` body is **byte-for-byte identical across 7
of 10 active platforms**, including **tablet arcade** (the chosen pilot)
and **all three verses platforms** (the tutorial's targets). Drifted
copies: **phone arcade** (354 vs 397 lines — smaller responsive variant),
**desktop** (~1-line diff), **campaign** (needs its own look). None of the
drifted three are in the tutorial's critical path, so a single shared
core version is pixel-exact for the pilot + all verses platforms today;
the drifted three keep their own copies and migrate later (handle drift
then). Re-verify before each of those three migrates.

**Build sequence (locked order — tablet arcade first, as ONE platform for
the whole pilot; planned as two sessions split at the test gate; user
direction 2026-06-23):**

Everything in the pilot phase lands on **tablet arcade** — the most-played
platform, so any regression gets noticed. Each step below changes at most
one platform; the `core/` modules touch none. Tablet arcade takes **two
version bumps** (one per session).

**Session 1 — drawing extraction + tablet-arcade migration (steps 1–2) —
✅ SHIPPED 2026-06-23:** `core/tileDrawing.js` created (verbatim extract),
tablet arcade migrated v11.17 → v11.18, byte-identical + clean build.

1. **Extract `drawTile` + `drawSpecialIcon`** (and any shared helpers /
   color constants they depend on) into a new `core/` drawing module.
   `core/` is edit-in-place — no version bump for the new module itself.
2. **Migrate tablet arcade's gameplay to the core drawing code.** Full
   versioning treatment (archive current tablet version, new version that
   imports from `core/` instead of defining its own copy). **Verify it
   renders identically in real play — this is the live validation** (test
   minimally here), and the first concrete test of the "incremental
   extraction works in practice" thesis from the DEFERRED.md architecture
   item. **Rollback is cheap:** the prior tablet version file still exists
   and works standalone (it kept its own drawing code), so reverting =
   repoint app references back to it; the new core module just sits unused.
   **Gate: do not start Session 2 until tablet arcade is confirmed good.**

**Session 2 — tutorial component + tablet-arcade tutorial (step 3) — ✅
SHIPPED 2026-06-27 (`core/Tutorial.jsx`, tablet v11.19):** built the portable
component (Option A) + opt-in header button; ships the first **2 of 8** shared
panels (basic match, line special) on a 6×6 board, look iterated to approval.
Hard-coded boards + deterministic match-free refill (existing tiles never
recolor). Board sizing revised to **constant tile size + grid grows in tiers**
(6×6 → 7×7 → 8×8) — see PROGRESS-2026-06-27 addendum. Panels 3–8 remain.

**Session 3 — shared panels 3–6 reviewed & merged — ✅ SHIPPED 2026-07-03
(tablet v11.21):** panels 3–6 (bomb, cross, supernova, hypernova) reviewed
with the user and refined, then merged to `main`. Refinements (all in
`core/Tutorial.jsx`, edit-in-place): (a) blast refill now spreads across all
six colors instead of a red/blue wash; (b) panel 4 cross — a stray green
removed a 4-match alternative to the taught 3-match trigger, and another tile
recolored so the trigger swap leaves no uncleared incidental match; panels 3,
5, 6 sim-verified clean of the same issue. 6 of 8 shared panels done. Remaining:
panel 7 (multipliers — gated on the scoring core extraction) + panel 8 (fusion).

3. **Build the portable tutorial component in `core/`** on the now-
   validated core drawing code, and **add it to tablet arcade.** On tablet
   arcade the tutorial shows **only the shared match sections** (match →
   specials → big move → cascade/combo) — the verses-only and campaign-only
   panels don't apply, so arcade is the *simplest* content and the ideal
   first proving ground for the component + the config-driven architecture
   (Option A) before the verses panels exist. Animated shared sections
   (canvas, reusing the core `drawTile`/`drawSpecialIcon`); opt-in button
   per the trigger rule above. Full versioning treatment on tablet arcade
   (its second bump). Test more thoroughly here.

(Session 1 and 2 *can* be combined into one day if Session 1 goes cleanly
and there's clearly context to spare — but plan as two; treat combining as
the exception, not the assumption.)

**Then the ports (later sessions, one platform each, tablet-first
pattern like item (b)):**

4. **tablet-verses** — add the tutorial; this is where the **verses-only
   static panels** (target formula, 2–4× drill + 60-move ceiling, chunk
   reveals) get authored and first exercised. Drawing code is identical to
   tablet arcade's, so tiles are pixel-exact for free.
5. **phone-verses** — port the tutorial.
6. **phone-verses-sandbox** — port the tutorial.
7. **Later / incremental:** migrate the remaining platforms' gameplay to
   the core drawing code (phone arcade, desktop, campaign — reconcile their
   drift at that point), and add the tutorial + the campaign-specific
   progression mini-tutorial to campaign (where subsumed F-3 lands).

**No separate test/dev fork** — rejected as not worth a ~6,000-line file
to maintain; the one-platform pilot validates more than a throwaway fork
would, and existing sandbox forks cover any future throwaway need.

**Deferred to build time (genuinely build-time, not blockers):** exact
per-platform tutorial copy (drafted once structure is in code); whether
every shared concept gets animated in v1 or a subset first; confirming
tablet arcade's pre-game flow to settle the "Tutorial" button's exact
home (pre-game screen vs. header); the campaign progression mini-tutorial's
detail. The verses-only target panel explains the tiered length ×
multiplier from item (b) and the 60-move drill ceiling; note the
multiplier has no upper ceiling yet (deferred to verses sims, #9), so
keep that panel's wording tolerant of later tuning.

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

### #10 — Reward mode (arcade reward round, both arcades)

Redefined 2026-06-23. The old "verses-internal reward at game-end" idea
is **dropped** — not what was wanted. Instead: build the **arcade reward
round** (every N consecutive wins, the next round becomes a special
"reward round") into **both the tablet AND phone arcades**; verses
players experience it by handing off into those arcades via the "Arcade
mode" button (no separate verses-internal reward mode). This **merges
Session I**, which previously scoped reward integration for tablet arcade
only.

**Phone needs its own scoping.** The phone game already carries
enhancements (Mech A/B/C/D) to stay fun on the small grid; a phone reward
*level* will need additional enhancements not yet figured out — to be
worked out in **sandbox mode**. So expect **different reward-level
versions for phone vs. tablet**.

**Reward levels can carry variation + randomness** (options to scope, not
final): increased hypernova drop chance; neighbor-match probability
adjustments; possibly others (reduced palette, seeded clusters,
progressive special-drops — the existing Session H sandbox levers).

**Dependencies / sequencing:** reward levers get tuned in the Session H
sandbox first; simulation (#9) can help validate. Needs a real scoping
pass (especially the phone enhancement set) before building.

### Music — add music to verses (verses-only)

Added 2026-06-23. Very large, verses-only enhancement. **The detailed
scope lives in an external claude.ai project discussion that future
Claude Code sessions cannot open** — so the first step when picking this
up is to **import that discussion's substance into a repo doc** (or
re-derive it with the user) before any building; the bare pointer is not
actionable on its own. No scoping done here beyond "add music to verses,
per the user's claude.ai project discussion."

## Process notes

This doc replaces what was previously the "Verses planned-content"
and "Verses tuning" entries in `docs/DEFERRED.md`. New verses-related
work goes here. DEFERRED.md remains the project-wide deferred roster
for non-Verses items + the "Done" archive for shipped items across
all platforms.
