// =============================================================================
// PSALM 23 — NKJV
// =============================================================================
//
// Single-level memorize game. Authored 2026-05-24.
//
//   Level 1 — Ps. 23  The LORD is my shepherd  20 chunks / 19 moves
//
// Total: 20 chunks / 19 moves in a single level. Whole-chapter Psalm
// 23 as one continuous level — matches the user-chosen single-section
// structure rather than Psalm 91's multi-level split.
//
// Chunking follows the user's line-by-line breaks in the source draft
// (each line in the source = one chunk). Per-verse breakdown:
//   v. 1 — 2 chunks (The LORD is my shepherd; / I shall not want.)
//   v. 2 — 2 chunks (green pastures; / still waters.)
//   v. 3 — 3 chunks (restores my soul; / paths of righteousness / name's sake.)
//   v. 4 — 6 chunks (valley sextet — Yea, though I walk through the valley,
//                    fear no evil, You are with me, rod and staff comfort me)
//   v. 5 — 4 chunks (prepare a table / in presence of enemies / anoint head /
//                    cup runs over)
//   v. 6 — 3 chunks (goodness and mercy / all the days / dwell in house of LORD)
//
// NKJV italics convention (translator-supplied "is" in v. 1 and "are"
// in v. 4) stripped to plain text — matches the existing convention
// across the project's NKJV games (Matt 5, Psalm 91, 1 Peter, Genesis
// 1, Genesis 50, Numbers 14, 2 Chronicles 7:14, Habakkuk 3:17–19).
//
// "LORD" rendered all-caps in plain text (NKJV print uses small caps
// to mark the divine name; source-file convention is plain all-caps,
// matching Psalm 91 / Numbers 14 / 2 Chronicles 7:14 / Habakkuk 3:19).
// Final v. 6 chunk preserves NKJV's capital-F "Forever" — distinctive
// to NKJV (some other translations use lowercase here).
//
// Curly apostrophe (U+2019) in "name's" per the project's typography
// pattern.
//
// Reference format "Ps. 23:N" mirrors Psalm 91's "Ps. 91:N" pattern
// to fit the 110px reference column on the in-game text bar.
//
// Per-level target defaults to `moves × 300` via the runtime formula —
// 19 × 300 = 5,700. No per-level override at authoring. Tune in
// playtest if needed.
// =============================================================================

export default {
  title: "Psalm 23",
  translation: "NKJV",
  book: "Psalms",
  chapter: 23,
  levels: [
    {
      title: "Psalm 23",
      verses: [
        {
          reference: "Ps. 23:1",
          chunks: [
            "The LORD is my shepherd;",
            "I shall not want.",
          ],
        },
        {
          reference: "Ps. 23:2",
          chunks: [
            "He makes me to lie down in green pastures;",
            "He leads me beside the still waters.",
          ],
        },
        {
          reference: "Ps. 23:3",
          chunks: [
            "He restores my soul;",
            "He leads me in the paths of righteousness",
            "For His name’s sake.",
          ],
        },
        {
          reference: "Ps. 23:4",
          chunks: [
            "Yea, though I walk",
            "through the valley of the shadow of death,",
            "I will fear no evil;",
            "For You are with me;",
            "Your rod and Your staff,",
            "they comfort me.",
          ],
        },
        {
          reference: "Ps. 23:5",
          chunks: [
            "You prepare a table before me",
            "in the presence of my enemies;",
            "You anoint my head with oil;",
            "My cup runs over.",
          ],
        },
        {
          reference: "Ps. 23:6",
          chunks: [
            "Surely goodness and mercy shall follow me",
            "All the days of my life;",
            "And I will dwell in the house of the LORD Forever.",
          ],
        },
      ],
    },
  ],
};
