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

## Still open — NOT yet storyboarded (next scoping)

- **Verses-only panels:** how the target score is set (tiered length ×
  multiplier), the "play 2–4×" drill + 60-move ceiling, chunk reveals /
  memorization. (Static panels, per TODO #4.)
- **Campaign-only panel:** level progression + unlock gating.
- **Modal flow / navigation:** how the player moves between panels (Next/Back,
  progress dots), skip/close behavior, and confirming tablet arcade's pre-game
  flow to settle where the **"Tutorial"** button lives (pre-game screen vs.
  header). Trigger is opt-in, never a forced modal (TODO #4).
- **Component interface (Option A):** exactly what each platform passes the
  shared component (ordered section list + per-platform values).
- **Real-scoring core extraction:** lift the scoring functions into
  `core/gameLogic.js` when the multipliers panel is built.
- **Exact copy polish + exact `×N` display format.**
