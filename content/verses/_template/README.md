# Verses — game authoring

Each subfolder under `content/verses/` is one memorize-mode game,
shared across all verses platforms (tablet-verses and phone-418-verses).
To add a game, copy this `_template/` folder to a sibling folder,
rename it to your passage's slug, and edit `game.js`.

(Path moved from `platforms/tablet-verses/games/` in N-1, 2026-04-28,
to be neutral between platforms.)

Folders whose name starts with `_` (like this one) are skipped by the
runtime picker, so the template is always safely present.

## Folder + slug

- Folder name is the slug. Use kebab-case (lowercase-with-hyphens,
  digits and hyphens only). Examples: `titus-2-11-13`, `psalm-91`,
  `john-3-16-18`.
- The `slug` field in `game.js` should match the folder name exactly.
  It's used as a stable key for persistence (stars, best score) once V-4
  ships, so don't rename it after publishing.

## Single-level vs. multi-level

- **Single-level** games put one `verses: [...]` array at the top level.
  Short passages, typically one sitting. At V-2 this is the only shape
  that boots (the picker arrives in V-3).
- **Multi-level** games use `levels: [...]` where each level has its
  own `verses: [...]` and an optional `targetScore`. Use for long
  passages (e.g., Psalm 91 split into 3–4 chunks of verses).

Pick one; do not mix. The template file has both shapes laid out —
delete the one you don't use.

## Chunks

A chunk is a short phrase that reveals one-at-a-time on each successful
match-3 swap. Rules of thumb:

- Keep chunks short — a few words to a short clause. Long chunks hurt
  the rhythm of reading-while-playing.
- Break at natural phrasing, not arbitrary word counts. Punctuation
  (commas, clauses) is a good place to split.
- Chunk 0 of the first verse is pre-visible at game start, so the
  player has something to read before the first match. The remaining
  chunks reveal over `chunks_total − 1` successful swaps (that's why
  moves = chunks − 1).

## Reference rendering

Each verse has a `reference` field (e.g., `"Titus 2:11"`). The runtime
renders the reference in the left column of the rolling text bar — only
on the first chunk of each verse. Subsequent chunks in the same verse
render in the right (content) column with no reference line. So: set
`reference` once per verse, regardless of how many chunks the verse has.

## Target score

Default target is `moves × 300`, where `moves = chunks_total − 1`. For
a 13-chunk game, that's 12 × 300 = 3,600. Override with a `targetScore`
field if the default feels off — short games especially may need a lower
multiplier since cascade setup is harder with few moves.

For multi-level games, each level can set its own `targetScore`.

## Translation

Optional top-level `translation` field (e.g., `'NKJV'`, `'KJV'`). Shown
in the passage-reveal modal subheading at end-of-round. If you omit it,
the modal just shows the passage with no translation label.

## Drafting

Set `hidden: true` at the top level while you're working on a game and
you don't want it on the picker. Remove (or set `false`) when ready to
publish. (Effective V-3; V-2 hardcodes boot to `titus-2-11-13`.)

## Example

See `content/verses/titus-2-11-13/game.js` for a working single-level
example (13 chunks across 3 verses).
