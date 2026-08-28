# Scoping brief — core storage consolidation

**Date:** 2026-08-22
**Status:** Brief only. Nothing decided, nothing built.
**For:** the next session, starting cold.

Written at the end of a long session so the thinking already done isn't paid for
twice. Read `docs/Architecture-*.md` → "Storage & identity model" and
`DEFERRED.md` → "Agreed task order" first; this adds the inventory and the open
questions.

**Scope reminder:** the *narrow* slice — one module in `core/` owning storage
keys and access. **Not** the full core extraction; game logic stays put. This is
stage 1 of "Multi-player and device linking", cut down to the part that pays off
now.

---

## Why this is next, in one line

Reward-mode integration adds roughly half a dozen new stored values. Added the
way storage is added today, each one is a fresh chance to repeat the divergence
that already cost real bonus moves (reward-mode cap, 2026-08-22).

---

## The inventory

Counted 2026-08-22 across the ten active platform files plus `core/AdminPanel.jsx`,
with line comments stripped:

| Platform | Storage calls | Literal-string keys | Via a constant |
|---|---:|---:|---:|
| tablet arcade | 26 | 13 | 13 |
| tablet-verses | 23 | 11 | 12 |
| campaign | 22 | 2 | 20 |
| reward-mode sandbox | 22 | 9 | 13 |
| tablet-sim | 27 | 9 | 18 |
| phone arcade | 21 | 10 | 11 |
| phone-verses | 23 | 11 | 12 |
| phone-verses-sandbox | 23 | 11 | 12 |
| desktop | 9 | 6 | 3 |
| time attack | 7 | 4 | 3 |
| `core/AdminPanel.jsx` | 16 | 2 | 14 |
| **Total** | **219** | **88** | **131** |

**88 literal-string keys are the risk surface.** Every one is a place where a
name can be typed differently in two files and diverge silently.

Regenerate this table with the script in the "Regenerating the inventory"
section below — do not trust these numbers after further edits.

## Bonus-move pools — there are FOUR, not two

Corrected 2026-08-22; earlier docs in this repo said two, and that was wrong.

| Pool | Key | Platforms |
|---|---|---|
| Tablet | `match3_bonusMoves` (exported by `core/AdminPanel.jsx`) | tablet arcade, tablet-verses, campaign, reward-mode sandbox, tablet-sim |
| Phone | `match3_phone_bonusMoves` (defined per file) | phone arcade, phone-verses, phone-verses-sandbox |
| Desktop | `match3_desktop_bonusMoves` (defined in file) | desktop only |
| Time Attack | `match3_timeattack_bonusMoves` (defined in file) | time attack only |

Only the tablet pool comes from a shared import. The other three are local
definitions — which is exactly the shape of the bug that has already bitten
once.

Run tracking is scoped in parallel (`match3_currentRun` vs
`match3_phone_currentRun`); high scores and combo records are **not** scoped at
all and are shared by everything, which is an inconsistency rather than a
decision.

---

## Open questions — decide these before writing code

### 1. What does the module export?

- **Constants only.** Smallest change: platforms keep their own
  `localStorage` calls but import the key names. Fixes divergence, fixes
  nothing else.
- **Accessor functions** — `readBonusMoves(family)`, `writeBonusMoves(family, n)`.
  Bigger change per platform file, but the module can then own the cap, the
  parse-and-validate logic (`readStoredInt` is already duplicated in tablet
  arcade and phone arcade), and the try/catch that several call sites skip.

**Leaning:** accessors. The cap bug was not a naming problem — it was a *rule*
living in ten places. Constants alone would not have prevented it.

### 2. How is the device family represented?

Today it is a hardcoded prefix per file. In one module it has to become
something a caller passes or the module infers. This is the decision that
determines how hard stage 2 (local profiles) is later, because a profile is the
same idea one level down. Worth an explicit look at whether family and profile
can be one mechanism rather than two.

### 3. Migration

Existing players have data under today's keys, so the module must read those
same names. **Recommendation: no key renaming in this pass at all.** Renaming
and consolidating at once makes any resulting data loss hard to attribute, and
this project has already lost player data to a storage change once. Rename
later, if ever, with an explicit migration.

### 4. Batch size — probably the dominant cost

Ten platform files means ten archives, ten new versioned files, ten sets of
reference and label updates. That ceremony likely exceeds the code work.

Options: all at once; by family (tablet five, phone three, then desktop and time
attack); or arcade-only first as a proving run. **Leaning:** one family first as
a proving run, then the rest — the first conversion will teach things the
inventory cannot.

### 5. Tests

`core/gameLogic.test.js` and Vitest already exist. A storage module is one of
the few genuinely unit-testable pieces of this codebase — mock `localStorage`,
assert reads/writes/caps/fallbacks. Cheap here, and it makes the reward-mode
session safer. Recommend writing them alongside.

### 6. The bundled rename

`VersesPicker` → `PassageSelect` rides along on the three Verses files
(tablet-verses, phone-verses, phone-verses-sandbox). Nine or ten occurrences
each, mostly comments; the real code is one component declaration and one usage
per file. Decided already — see `DEFERRED.md` → "Agreed task order".

---

## Traps found in this codebase, worth carrying into the work

- **A value that persists must be restored everywhere it is computed.** The
  v12.1 bug had two sites: `restartGame` and the initial `useState`. Fixing one
  left the bug half-present.
- **Near-identical files are not identical.** phone-verses and its sandbox differ
  in small ways; a blind find-and-replace across them has already failed once
  (Session 17).
- **Historical comment blocks lie.** Older version-comment blocks in each
  platform file correctly describe what was true when written — `match3_bankedMoves`
  appears in several and is no longer the live key. Do not copy names out of
  them; check the live constant.
- **Grep by name misses renamed things.** The cap bug survived because the bump
  was applied by searching for `BONUS_MOVES_CAP` while two files still said
  `BANKED_MOVES_CAP`. Search by *value* as well as by name.

---

## Regenerating the inventory

```bash
python3 - <<'PY'
import re, os
files = {
 'tablet arcade':'platforms/tablet/match3-v12.1-tablet.jsx',
 'tablet-verses':'platforms/tablet-verses/match3-v2.4-tablet-verses.jsx',
 'campaign':'platforms/campaign/tablet/match3-v1.28-campaign-tablet.jsx',
 'rewardmode':'platforms/tablet-rewardmode/match3-v1.5-tablet-rewardmode.jsx',
 'tablet-sim':'platforms/tablet-sim/match3-v1.6-tablet-sim.jsx',
 'phone arcade':'platforms/phone/match3-v14.1-phone.jsx',
 'phone-verses':'platforms/phone-verses/match3-v2.6-phone-verses.jsx',
 'phone-vs-sandbox':'platforms/phone-verses-sandbox/match3-v1.16-phone-verses-sandbox.jsx',
 'desktop':'platforms/desktop/match3-v12.3-desktop.jsx',
 'timeattack':'platforms/timeattack/match3-v12.4-desktop-timeattack.jsx',
 'core/AdminPanel':'core/AdminPanel.jsx',
}
for name,path in files.items():
    s=re.sub(r'^\s*//.*$','',open(path,encoding='utf-8').read(),flags=re.M)
    calls=re.findall(r'(?:local|session)Storage\.(?:get|set|remove)Item\(\s*([^,)]+)',s)
    lit=[c for c in calls if c.strip().startswith(("'",'"','`'))]
    print(f"{name:<18} {len(calls):>3} calls, {len(lit):>3} literal")
PY
```

Update the active filenames first — they change with every version bump.
