# Verses Tutorial — Storyboard & Design Capture

Captured 2026-06-23 from a long scoping session. Companion to
`docs/verses/TODO.md` #4 (which holds the architecture, build sequence, and
trigger decisions) and `docs/DESIGN.md` "Scoring vocabulary — cascade ·
combo · fusion." **Purpose: let a future session build the tutorial with
minimal re-litigating.**

Code references below point at `platforms/tablet/match3-v11.18-tablet.jsx`
(the Session-1 tablet file) unless noted.

---

## Status

- **Session 1 SHIPPED 2026-06-23** (commit 20b3654): drawing code extracted
  to `core/tileDrawing.js`, tablet arcade migrated v11.17 → v11.18. This is
  the foundation — the tutorial reuses the *real* tile art, pixel-exact.
- **Next code = Session 2:** build the `core/` tutorial component and add it
  to tablet arcade (shared match panels only). See TODO #4 build sequence.
- **This doc = the storyboard scoped for the 8 SHARED panels.** The
  verses-only panels, the campaign panel, and the modal flow/navigation are
  **not yet storyboarded** — see "Still open" at the bottom.

---

## Governing principles (apply to every panel)

- **Replay, not auto-loop.** Each panel plays once, then shows "↻ Replay."
- **Scores appear on every panel.** The whole point is the contrast/ladder:
  a basic match (~+60) vs. big specials/fusion (thousands). The escalating
  numbers are the teaching.
- **Real scoring, real popups.** The tutorial uses the ACTUAL in-game scoring
  — same point values, same multipliers, same popup text (`⚡ LINE CLEAR!`,
  `💣 BOOM!`, `🔥 CASCADE x2.5!`, `🌠🌌 NOVA FUSION!`, etc.). Strong user
  direction: the player should see what's really happening, not a fiction.
  **Implies a SECOND core extraction** — the pure scoring functions
  (`getMultiplier`, `getCascadeMultiplier`, and the point values) into
  `core/gameLogic.js` — done when the multipliers panel is built, so tutorial
  and game can never drift. (Same pattern as Session 1's drawing extraction.)
- **Real tiles.** Pixel-exact via `core/tileDrawing.js` (Session 1). The tile
  art the user spent weekends getting right shows up identically. **Appearance
  is first-class** (the user's explicit "Steve Jobs" point — not polish-if-time).
- **Hand/finger icon** shows the swap on every "make a move" beat.
- **Specificity/clarity is the point.** Captions are concrete ("clears an
  entire row"), never vague ("clears more").
- **"Tiles," never "gems."** Only the diamond is gem-shaped; the other five
  are not. (Now in DESIGN.md terminology.)
- **One moderate, consistent demo board** across all panels — big enough that
  a 3-match feels satisfying, small enough to keep the modal clean. Big
  specials **imply** their scale (a large burst + most of the board flashing
  clear) while the caption states the exact effect; the player sees the true
  full-scale effect in the real game. **Do NOT use a huge board** — it makes
  the small matches look puny (user-flagged).
- **Per-panel template:** make it (small score) → use it (bigger score) →
  distinct effect → real popup → "↻ Replay."
- **Cascade panel uses slow motion** so a longer chain stays legible and the
  score increments are watchable (the game already has slow-mo playback).
- **Visual-mockup checkpoint:** before building all panels, mock up ONE panel
  (tile demo + caption + score + Replay/Next controls) for user approval of
  the *look* first.

---

## Shared panels (8) — order = escalating impact ladder

The order doubles as the scoring ladder, so the numbers visibly grow.

### 1. Basic match (3)
- **Do:** hand swaps to make 3 in a row → they clear → tiles above fall →
  new tiles fall in.
- **Score:** small (~+60, illustrative).
- **Caption:** *"Swap two tiles to line up 3 or more of a kind. Matches clear,
  and new tiles fall in."*
- No special tile in this panel.

### 2. Line special (4 in a row)
- **Make:** 4 in a row → a **line** tile (⚡).
- **Use:** clears an **entire row** (confirmed: row, not column). Popup
  `⚡ LINE CLEAR!`. (Activation code ~line 1852.)
- **Caption:** *"Match 4 in a row to make a line special. Use it, and it clears
  an entire row."*
- This panel sets the make→use→effect→Replay template for panels 2–6.

### 3. Bomb (5 in a straight line)
- **Make:** 5 in a straight line → **bomb** (💣).
- **Use:** clears a **3×3 area + its full row + its full column**, flat **750
  pts**. Popup `💣 BOOM!`. (Code ~lines 1863–1886.)
- **Caption:** *"Match 5 in a straight line to make a bomb. Use it to blast a
  3×3 area plus its whole row and column."*

### 4. Cross (5 in an L or T shape)
- **Make:** 5 in an **L/T shape** → **cross** (✨).
- **Use:** clears its **full row AND full column**. Popup `✨ CROSS BLAST!`.
  (Code ~lines 1887–1906.)
- **Caption:** *"Match 5 in an L or T shape to make a cross. Use it to clear an
  entire row and column at once."*
- **Place adjacent to bomb (panel 3)** so the contrast is unmistakable: same
  5 tiles, different *shape* → different special. This shape-distinction is
  why each special gets its own panel.

### 5. Supernova (6)
- **Make:** 6 in a row → **supernova** (🌌).
- **Use:** clears a **5×5 area + full row + full column**, flat **2000 pts**.
  Popup `🌌 SUPERNOVA!`. (Code ~lines 1907–1929.)
- **Caption:** *"Match 6 to make a supernova. Use it to clear a 5×5 area plus
  its full row and column."*

### 6. Hypernova (7) — most powerful single special
- **Make:** 7 in a row → **hypernova** (🌠).
- **Use:** clears the 5×5 + row + column footprint **AND half of all the other
  tiles on the board** (specials are spared), with a 30-tile minimum floor.
  Popup `🌠 HYPERNOVA!`. (Code ~lines 1930–1981.)
- **Caption:** *"Match 7 to make a hypernova — the strongest. Use it to wipe out
  a huge swath: a 5×5 area, its full row and column, and half of everything
  else on the board."*

### 7. Scoring multipliers (combo + cascade) — ONE panel
Decision: combo and cascade are two real mechanics but share one panel,
because the player will see BOTH popups in play and the umbrella idea is
"multipliers → bigger scores." Locked caption:

> **Scoring multipliers — how big turns happen**
>
> *Two things multiply your score within a single turn, and you'll see both
> pop up as you play:*
> - **Combo `×N`** — counts **how many matches** you make in one turn. Each
>   match pushes your multiplier up (×2, ×3, and higher), so a turn full of
>   matches is worth far more than a single one.
> - **`🔥 Cascade`** — when one move makes tiles **clear more than once**:
>   tiles fall into new matches, or a special sets off another special. Each
>   extra round of clearing adds a cascade bonus on top.
>
> *The more you make happen in one turn — more matches, more clearing,
> specials setting off specials — the higher both climb. One big, well-set-up
> turn beats a dozen small moves.*

- **Plain distinction:** combo = *how many matches*; cascade = *clearing
  happening again from one move*. Two questions, two popups, one goal.
- **Visual:** one slowed-down turn where BOTH fire — a swap lands several
  matches at once (`×N` ticks up), then specials go off in later rounds
  (`🔥 CASCADE` popups stack), and the running score rockets past the basic
  match's +60. Seeing both labels in one turn is the lesson.
- Exact `×N` display format → match the real in-game display at build.

### 8. Fusion (finale) — show a PROGRESSION of three fusions
**Decision (user, 2026-06-23):** do NOT show only NOVA FUSION. If the
spectacular nova is the only fusion a player sees, their first real in-game
fusion (likely a modest line+line) will feel disappointing. Show the RANGE so
expectations are set right — fusion scales with the specials you combine.
Three fusions in ascending order, each with its real effect + popup + score:

1. **Basic — line + line** (two 4-tile specials): clears a row + column.
   `⚡⚡ DOUBLE LINE! +700`. (Code ~line 2058.)
2. **Bigger — bomb + bomb** (two 5-tile specials): 7×7 area + row + column.
   `💣💣 MEGA BLAST! +1500`. (Code ~line 2068.)
3. **Nova — hypernova + supernova:** clears a huge swath of the board.
   `🌠🌌 NOVA FUSION! +8000`. (Code ~line 2170. Absolute max is
   hypernova+hypernova → `🌠🌠 DUAL HYPERNOVA!!! +10000`, ~line 2155.)

Ladder: **+700 → +1500 → +8000.** The player learns a modest fusion is still
a solid score AND sees the ceiling — killing the "my real fusion was
disappointing" problem.

- **Make/Use (each tier):** two special tiles sit adjacent; the hand swaps
  **one special directly into the other**, combining them → a combined blast.
- **Caption:** *"Fusion is when you swap two special tiles into each other.
  They combine into one blast — and the bigger the specials, the bigger the
  result, from a solid +700 to a board-clearing +8000. Line up two specials,
  then swap them together."*
- **Distinct from cascade:** fusion = you *deliberately swap two specials
  together*; cascade = a special's blast *happens to set off* another.
- **Full fusion table** (every combination + points + messages) is in code
  ~lines 2058–2204; pull exact effects at build. Examples: cross+cross 850
  (`✨✨ DOUBLE CROSS!`), bomb+cross 1400 (`💣✨ CROSS BOMB!`), any
  5-tile+supernova 3500 (`SUPERNOVA COMBO!`), supernova+supernova 6000
  (`🌌🌌 DUAL SUPERNOVA!`).
- **Open:** one panel cycling three fusions (as written) vs. brief sub-beats —
  adjustable at build; the decision that matters is "show the range," not one.

---

## Scoring vocabulary (locked — full version in DESIGN.md)

- **Cascade** — clearing happens **more than once** from one move (tiles fall
  into new matches, or a special sets off another). The `🔥 CASCADE` popup.
- **Combo** — **how many matches** you make in a turn, shown as the `×N`
  multiplier. (Game convention for an accumulating counter — NOT "combining
  tiles.")
- **Fusion** — **combining two special tiles** by swapping one into another.
  The game already uses the word (`🌠🌌 NOVA FUSION!`). Adopted as the umbrella
  term for ALL special-combination popups (DEFERRED.md tracks rewording the
  others to match).
- **"chain" is retired** — it was a loose synonym for cascade; do not use it.
- **"tile," not "gem."**

---

## Scoring mechanics reference (from code — so no one re-investigates)

- **Special creation by match (primary path ~lines 2701–2714):** 4 in a row →
  line · 5 straight → bomb · 5 L/T-shape → cross · 6 → supernova · 7 →
  hypernova. (`SUPERNOVA_MIN_TILES = 6`, `HYPERNOVA_MIN_TILES = 7`.)
- **Special effects + points:** line = row (tiles×30) · bomb = 3×3+row+col
  (750) · cross = row+col (tiles×38) · supernova = 5×5+row+col (2000) ·
  hypernova = 5×5+row+col + half the remaining board, 30-tile floor.
- **Combo:** `comboValue` = number of match-groups summed across the turn;
  `getMultiplier(comboValue)` (1=×1.5, 2=×2.0 … 6+=×4.0+) multiplies the
  **regular match points** (tiles×10). Code ~lines 1620, 2826–2828, 1773–1777,
  2921–2928.
- **Cascade:** `depth`/`generation` = how many rounds of clearing in the turn;
  `getCascadeMultiplier(depth)` (depth 2=×1.5, 3=×2.0, 4=×2.5) multiplies the
  **special-activation points** during the chain. Code ~lines 2350–2351,
  2496–2500, 2581–2582.
- **Key fact:** the two multipliers apply to **different point types** (combo →
  match points; cascade → special-blast points), not stacked on the same
  points. Both are player-visible (the `×N` display vs. the `🔥 CASCADE`
  popup). This is why they stay two mechanics under one "multipliers" panel.

---

## Panel 7 — build plan (scoped 2026-07-03)

Full scoping session for panel 7 (scoring multipliers). Settled decisions,
so a future session (or a post-compaction continuation) can build without
re-litigating. Two branches: `scoring-core-extraction` (the prerequisite
refactor) then a panel-7 branch on top.

1. **Scoring extraction — scope & source of truth.** Lift the *pure scoring
   math* into shared `core/` so tutorial and game read one source and can't
   drift: the multiplier functions **and** the base point values. Current
   reality (verified in `match3-v11.21-tablet.jsx`): `getMultiplier` already
   exists in `core/gameLogic.js` but the tablet uses its own **byte-identical
   duplicate**; `getCascadeMultiplier` is **not** in core and the tablet
   defines it **twice** locally (both identical); point values are inline
   literals (match = tiles×10, line = tiles×30, bomb = 750, cross = tiles×38,
   supernova = 2000, hypernova = footprint routine). Tablet source of truth.
   **Phone parity confirmed:** `match3-v13.6-phone.jsx` has the *same* values
   and multipliers (and the same duplication) — so the core module is
   phone-compatible, but **phone migrates later** (out of scope now). We
   extract only the pure values + functions, NOT the application logic
   (how combo count / cascade depth are computed) — that stays per-platform.
2. **Branch layout — two sequential branches.** Branch 1 =
   `scoring-core-extraction`: scoring → core, **no behavior change**, verified
   scores byte-identical before/after (tablet v11.22, parallel to the v11.18
   drawing extraction). Merge. Branch 2 = panel 7 on the updated main (v11.23).
   Collapse to one branch only if the extraction proves trivial.
3. **Demo turn — one paced turn, combo phase then cascade phase.** A single
   slowed turn: several matches land at once (combo `×N` climbs), then tiles
   fall and a special fires/chains (cascade `🔥` stacks), score rockets past
   the basic +60. Two-beat version (isolate combo, then cascade) held as a
   fallback if the single turn reads as visual soup. Reuses a special (focus
   is the multiplier, not teaching a new special).
4. **Authoring — hand-authored choreography fed by the real scoring math.**
   Script exactly what clears when (panels 1–6 style, full visual control),
   but every on-screen number comes from the extracted `getMultiplier` /
   `getCascadeMultiplier` + point values. NOT an emergent full-engine
   simulation. Verify by computing the expected score from the real functions
   for the authored match-sizes/cascade-depths and asserting the display
   matches; deterministic, same every replay. Needs two new engine
   capabilities in `core/Tutorial.jsx`: multi-group clear with `×N` climbing,
   and successive cascade rounds with `🔥` stacking.
5. **Display — mirror the real in-game popups faithfully.** Combo HUD
   `🔥 COMBO x2 (1.5x pts)` (escalates to 🌟 MEGA / ⚡ ULTRA / 💥 LEGENDARY at
   milestones 5/10/15; count shown as combo+1); cascade popups
   `🔥 CASCADE x1.5! [special]! +N`. Use the lowercase-"x" popup form the
   player sees mid-turn. Game is internally inconsistent (popups use "x", a
   secondary history label uses "×") → **logged to DEFERRED** as a small
   standalone wording cleanup (alongside the "standardize special-combination
   popups" item); NOT fixed in the tutorial branch.
6. **Pacing & size — 8×8, brief holds at the teaching beats.** 8×8 tier (room
   for the cascade to unfold without wiping the board). Ride the existing slow
   tutorial pace + brief holds so each `×N` / `🔥` reads one at a time; no
   heavy extra slow-motion (the current panels already read with a natural
   per-match beat — user-confirmed). Exact timing tuned in the watch-and-adjust
   review loop, like panels 1–6.

### Concrete demo turn (designed & approved 2026-07-03)

Authored beat-by-beat (decision #4), 8×8, one swap, paced with holds. Every
score is computed from the extracted core functions (`getMultiplier` /
`getCascadeMultiplier` + point constants), NOT literals. Combo display follows
**decision C** (2026-07-03): show the honest points multiplier + plain match
count and de-emphasize the game's confusing `x{count+1}` headline (see DEFERRED
"Combo HUD shows count + 1"). Cascade popups mirror the game faithfully.

| Beat | On screen | Real score math | Running total |
|---|---|---|---|
| 1 — Combo | swap lands **3 matches at once**; multiplier reads **×2.5** | 3 groups × (3 tiles × 10 × 2.5) = 225 | **225** |
| 2 — Combo climbs | tiles fall into **a new match** (clearing again); **×3.0** | 3 × 10 × 3.0 = 90 | **315** |
| 3 — Cascade | a **bomb** fires in a later round: `🔥 CASCADE x1.5! 💣 BOOM! +1125` | 750 × 1.5 = 1125 | **1,440** |
| 4 — Cascade climbs | the bomb sets off a **line** deeper: `🔥 CASCADE x2.0! ⚡ LINE CLEAR! +480` | 240 × 2.0 = 480 | **1,920** |

Ends ~**1,920** vs. a basic match's **+60** — an on-screen "+60" reference
(user request) makes the contrast explicit. Reuses a bomb + line purely as
cascade vehicles (not teaching them). Two-beat fallback (isolate combo, then
cascade) stays available if four beats read busy. First draft — tune
visuals/timing in the watch-and-adjust loop.

**Implementation still to do** (branch `tutorial-panel-7-multipliers` →
tablet v11.23): new `core/Tutorial.jsx` engine bits — a combo/multiplier
readout (honest ×N pts + match count) and successive cascade rounds driving the
`🔥` popups; the authored 8×8 board dressed to look right at each beat; the
on-screen +60 reference; sim-verify; add `multipliers` to the tablet `sections`.

### Review round 1 (2026-07-03) — ✅ all 9 items addressed (tablet v11.24)

**State:** first on-screen draft is built and committed — branch
`tutorial-panel-7-multipliers`, tablet **v11.23** (local only; `main` clean at
v11.22). Engine additions already in `core/Tutorial.jsx` and reusable:
`onMultiplier` combo readout, `panel.specials`, `panel.reference`, per-step
`combo` field. The honest 4-beat turn (swap→2 matches, fall→3rd match,
bomb→line; scores 120→1,800) is sim-verified for mechanics. User reviewed it
running and gave 9 items:

1. **Dots aren't clickable** — the progress dots render but have no handler; add
   `onClick={() => goTo(i)}`.
2. **Caption wording** — replace "clearing that happens again" with **"when
   other matches or specials are triggered."**
3. **Pluralize** "combos" / "cascades" in the caption prose. (Keep the singular
   mechanic *names* per DESIGN.md vocabulary unless user later asks to rename.)
4. **Hand doesn't move** — the `hand` step points at the drag *destination*, so
   the finger never travels. Point it at the *source* (3,3) so it carries the
   tile to (3,4), like panels 1–6.
5+9. **Popups cover the action; highlight the matches.** Place each popup AWAY
   from its action: beats 1–2 (matches up top, tiles fall from above) → popups
   **low**; beats 3–4 (specials at the bottom) → popups **high**. AND draw a
   highlight rectangle around each matching group as it clears, to direct the
   eye. (These two fix the same "can't see the match" problem.)
6. **Popup wording** — "the fall makes a third match" → **"falling tiles make a
   third match."**
7+8. **Specials fire with nothing triggering them (WRONG).** Decision (user):
   KEEP the bomb + line, but re-author so they're GENUINELY triggered — the
   falling tiles form a match that INCLUDES the bomb (fires it), and the bomb's
   blast then catches the line (fires it). Every explosion must be earned.
   **Verify first in the game code:** exactly how a special is triggered by a
   match (part of a same-color 3-run?) and whether a bomb blast chains into an
   adjacent special — then author the cascade to satisfy it, and re-sim.

Note: user was mid-giving more feedback when the session ended ("more…") — there
may be additional items next session. Popup-placement + highlight (5+9) and the
7+8 re-author are the biggest pieces; 1,2,3,4,6 are quick.

---

## Verses-only tutorial panels (scoped 2026-07-03)

For tablet-verses (and the phone-verses / sandbox ports that inherit it). These
run AFTER the 8 shared match panels — learn to play, then learn the verses
layer. Tutorial button lives on the **"Begin" passage screen** (not the header);
dots-navigable. **Two panels:**

**V1 — Reveal the verse** — lightly ANIMATED (one match → the next line fades
into the rolling text bar). The core memorize mechanic. Needs a small **new
panel type** in `core/Tutorial.jsx` (a rolling-chunk-bar demo, distinct from the
match-animation panels).
> "In Verses, every match reveals the next line of the passage. The first line
> starts visible; each match uncovers the next — so you read and memorize as you
> play."

**V2 — The target & your moves** — STATIC labeled still (target + move counter
highlighted). Folds in how the target is figured + the move ceiling + replay.
> "The target score is based on the passage's length — the longer the passage,
> the higher the target. You get one move per line of text to reveal; reach the
> target before the passage completes. You can play through a level multiple
> times as a single game, to help memorization."

**Notes:** the target is explained CONCEPTUALLY (scales with length), NOT the
exact `moves × 300` formula — beginner-friendly + drift-proof; add the number at
build if wanted. Use a real sample passage's chunks for the V1 illustration.
"line" (not "piece"/"chunk") is the player-facing word.

### Build plan — tablet-verses port (locked 2026-07-04)

Recovered/confirmed after a prior scoping pass that was under-documented. These
are the settled decisions for building the tablet-verses tutorial port:

1. **V1 (reveal the verse).** Sample passage = **Genesis 1:1** (short, universal,
   chunks cleanly). Build it to look **as close to the real verses game as
   possible** — reuse the actual rolling text-bar look (same fonts, same reveal
   animation), not a rough mock. Needs the new rolling-text-bar panel type in
   `core/Tutorial.jsx`.
2. **Sample text location.** Genesis 1:1 is written **once inside the shared
   `core/Tutorial.jsx`**, so every verses platform (tablet-verses, phone-verses,
   sandbox) shows the same sample automatically. Platforms do NOT each pass their
   own sample verse.
3. **V2 (target & moves).** Plain wording only — "the longer the passage, the
   higher the **target score**." No exact number/formula shown. Plus the
   one-move-per-line rule and the replay-a-level-for-memorization point.
4. **Trigger / button placement.** A small unobtrusive **"Tutorial"** link at the
   **top-left of the passage-selection screen** ("Select a passage to begin"),
   mirroring the top-left tutorial button on the tablet arcade header. (Refines
   the earlier "Begin passage screen" note — the selection screen is the spot.)
5. **Panel order.** The two verses panels run AFTER the 8 shared match panels.
6. **Versioning.** One bump: tablet-verses **v1.17 → v1.18**, adding all 8 shared
   panels + V1 + V2 in the same change. `core/Tutorial.jsx` edited in place to add
   the two new panels. Later ports (phone-verses, sandbox) are their own bumps.

---

## Still open — NOT yet storyboarded (next scoping)

- ~~**Verses-only panels**~~ — **✅ SCOPED 2026-07-03** (2 panels: V1 reveal
  mechanic + V2 target/moves). See "Verses-only tutorial panels" section above.
- **Campaign-only panel:** level progression + unlock gating.
- ~~**Modal flow / navigation.**~~ **✅ BUILT (not just scoped).** The modal in
  `core/Tutorial.jsx` already has full navigation: a `‹ Back` button, clickable
  progress dots (`goTo(i)`), `↻ Replay`, `Next ›`, and a top-right `×` close
  (see `core/Tutorial.jsx` ~lines 947–983). Trigger stays opt-in, never a forced
  modal (TODO #4).
- ~~**Component interface (Option A).**~~ **✅ SETTLED for verses.** Each platform
  passes the shared `Tutorial` component an ordered `sections` list of panel-id
  strings plus `onClose` (tablet arcade: the 8 shared ids — see
  `platforms/tablet/match3-v11.26-tablet.jsx` ~line 3146). Tablet-verses passes
  the 8 shared ids + the two verses panel ids. The sample verse (Genesis 1:1) is
  baked into `core/Tutorial.jsx`, not passed per-platform. Campaign's extra
  progression panel is the only interface piece still open.
- **Real-scoring core extraction:** lift the scoring functions into
  `core/gameLogic.js` when the multipliers panel is built.
- **Exact copy polish + exact `×N` display format.**
