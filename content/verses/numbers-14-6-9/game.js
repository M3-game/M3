// =============================================================================
// NUMBERS 14:6–9 — NKJV
// =============================================================================
//
// Single-level memorize game. Authored 2026-05-24.
//
//   Level 1 — Num. 14:6–9  Joshua and Caleb's plea  18 chunks / 17 moves
//
// Total: 18 chunks / 17 moves in a single level.
//
// Chunking follows the user's line-by-line breaks in the source draft
// (each line in the source = one chunk). Verse-number prefixes stripped
// to the `reference` field.
//
// NKJV italics convention (translator-supplied words: "who were" in
// v. 6, "is" in v. 7, "are" and "is" in v. 9) stripped to plain text
// — matches the existing Matt 5 / Psalm 91 / Titus / 1 Peter /
// Genesis 1 / Genesis 50 convention in the project's data files.
//
// "LORD" rendered all-caps in plain text — NKJV print uses small caps
// to mark the divine name (YHWH/Yahweh) but the source-file convention
// in this project is plain all-caps, matching Psalm 91's
// "Because you have made the LORD," pattern.
//
// Quoted speech: Joshua and Caleb's address opens at v. 7 ("The land
// we passed through to spy out…") and runs through v. 9
// ("…Do not fear them."). The nested phrase in v. 8 ("a land which
// flows with milk and honey.") uses single curly quotes — likely
// echoing the recurring covenant promise from earlier in the Torah.
// Outer speech uses curly double quotes, nested phrase uses curly
// single quotes.
//
// Reference format "Num. 14:N" mirrors the abbreviation pattern used
// by other games in the project (Matt 5, Psalm 91, Isaiah, 1 Peter,
// Genesis 1, Genesis 50) to fit the 110px reference column on the
// in-game text bar.
//
// Per-level target defaults to `moves × 300` via the runtime formula —
// 17 × 300 = 5,100. No per-level override at authoring. Tune in playtest
// if needed.
// =============================================================================

export default {
  title: "Numbers 14:6–9",
  translation: "NKJV",
  book: "Numbers",
  chapter: 14,
  levels: [
    {
      title: "Numbers 14:6–9",
      verses: [
        {
          reference: "Num. 14:6",
          chunks: [
            "But Joshua the son of Nun",
            "and Caleb the son of Jephunneh,",
            "who were among those who had spied out the land,",
            "tore their clothes;",
          ],
        },
        {
          reference: "Num. 14:7",
          chunks: [
            "and they spoke to all the congregation",
            "of the children of Israel, saying:",
            "“The land we passed through to spy out",
            "is an exceedingly good land.",
          ],
        },
        {
          reference: "Num. 14:8",
          chunks: [
            "If the LORD delights in us,",
            "then He will bring us into this land",
            "and give it to us,",
            "‘a land which flows with milk and honey.’",
          ],
        },
        {
          reference: "Num. 14:9",
          chunks: [
            "Only do not rebel against the LORD,",
            "nor fear the people of the land,",
            "for they are our bread;",
            "their protection has departed from them,",
            "and the LORD is with us.",
            "Do not fear them.”",
          ],
        },
      ],
    },
  ],
};
