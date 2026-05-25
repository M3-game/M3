// =============================================================================
// HABAKKUK 3:17–19 — NKJV
// =============================================================================
//
// Single-level memorize game. Authored 2026-05-24.
//
//   Level 1 — Hab. 3:17–19  Yet I will rejoice in the LORD  11 chunks / 10 moves
//
// Total: 11 chunks / 10 moves in a single level.
//
// Chunking follows the user's line-by-line breaks in the source draft
// (each line in the source = one chunk). Per-verse breakdown:
//   v. 17 — 6 chunks (the "Though…" sextet of failed agriculture)
//   v. 18 — 2 chunks (rejoice / joy in salvation)
//   v. 19 — 3 chunks (LORD God is my strength / deer's feet / high hills)
//
// NKJV italics convention (translator-supplied "feet" in v. 19's
// "deer's feet,") stripped to plain text — matches the existing
// convention across the project's NKJV games (Matt 5, Psalm 91,
// 1 Peter, Genesis 1, Genesis 50, Numbers 14, 2 Chronicles 7:14).
//
// "LORD" rendered all-caps in plain text (NKJV print uses small caps
// to mark the divine name; source-file convention is plain all-caps,
// matching Psalm 91 / Numbers 14 / 2 Chronicles 7:14).
//
// Em dash preserved at end of v. 17 line 6 ("And there be no herd in
// the stalls—") as the syntactic pivot from the long "Though…" clause
// into v. 18's "Yet I will rejoice in the LORD," — the rhetorical
// turning point of the passage. Curly apostrophe (U+2019) in "deer's"
// per the project's typography pattern.
//
// Reference format "Hab. 3:N" mirrors the abbreviation pattern used
// by other games in the project to fit the 110px reference column on
// the in-game text bar.
//
// Per-level target defaults to `moves × 300` via the runtime formula —
// 10 × 300 = 3,000. No per-level override at authoring. Tune in
// playtest if needed.
// =============================================================================

export default {
  title: "Habakkuk 3:17–19",
  translation: "NKJV",
  levels: [
    {
      title: "Habakkuk 3:17–19",
      verses: [
        {
          reference: "Hab. 3:17",
          chunks: [
            "Though the fig tree may not blossom,",
            "Nor fruit be on the vines;",
            "Though the labor of the olive may fail,",
            "And the fields yield no food;",
            "Though the flock may be cut off from the fold,",
            "And there be no herd in the stalls—",
          ],
        },
        {
          reference: "Hab. 3:18",
          chunks: [
            "Yet I will rejoice in the LORD,",
            "I will joy in the God of my salvation.",
          ],
        },
        {
          reference: "Hab. 3:19",
          chunks: [
            "The LORD God is my strength;",
            "He will make my feet like deer’s feet,",
            "And He will make me walk on my high hills.",
          ],
        },
      ],
    },
  ],
};
