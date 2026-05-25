// =============================================================================
// 1 PETER 1:3–9 — NKJV
// =============================================================================
//
// Multi-level memorize game. Authored 2026-05-24.
//
// Two thematic sections matching the blank-line break in the user's
// edited source draft:
//
//   Level 1 — 1 Pet. 1:3–5  Living hope / inheritance / kept by God   13 chunks / 12 moves
//   Level 2 — 1 Pet. 1:6–9  Rejoicing through trials / faith's end    14 chunks / 13 moves
//
// Total: 27 chunks / 25 moves across 2 levels.
//
// Chunking follows the user's line-by-line breaks in the source draft
// (each line in the edited doc = one chunk). Verse-number prefixes
// stripped to the `reference` field; trailing whitespace stripped.
//
// Reference format "1 Pet. 1:N" mirrors the abbreviation pattern used
// by Matt 5 ("Matt. 5:N"), Psalm 91 ("Ps. 91:N"), and Isaiah
// ("Isa. 52:N" / "Isa. 53:N") to fit the 110px reference column on the
// in-game text bar. "1 Pet. 1:" = 10 chars before verse number — still
// within the column at 19px Georgia italic.
//
// Per-level targets default to `moves × 300` via the runtime formula —
// no per-level overrides at authoring. Tune in playtest if needed.
// =============================================================================

export default {
  title: "1 Peter 1:3–9",
  translation: "NKJV",
  levels: [
    {
      title: "1 Peter 1:3–5",
      verses: [
        {
          reference: "1 Pet. 1:3",
          chunks: [
            "Blessed be the God and Father",
            "of our Lord Jesus Christ,",
            "who according to His abundant mercy",
            "has begotten us again to a living hope",
            "through the resurrection",
            "of Jesus Christ from the dead,",
          ],
        },
        {
          reference: "1 Pet. 1:4",
          chunks: [
            "to an inheritance",
            "incorruptible and undefiled",
            "and that does not fade away,",
            "reserved in heaven for you,",
          ],
        },
        {
          reference: "1 Pet. 1:5",
          chunks: [
            "who are kept by the power of God",
            "through faith for salvation",
            "ready to be revealed in the last time.",
          ],
        },
      ],
    },
    {
      title: "1 Peter 1:6–9",
      verses: [
        {
          reference: "1 Pet. 1:6",
          chunks: [
            "In this you greatly rejoice,",
            "though now for a little while, if need be,",
            "you have been grieved by various trials,",
          ],
        },
        {
          reference: "1 Pet. 1:7",
          chunks: [
            "that the genuineness of your faith,",
            "being much more precious than gold that perishes,",
            "though it is tested by fire,",
            "may be found to praise, honor, and glory",
            "at the revelation of Jesus Christ,",
          ],
        },
        {
          reference: "1 Pet. 1:8",
          chunks: [
            "whom having not seen you love.",
            "Though now you do not see Him,",
            "yet believing, you rejoice",
            "with joy inexpressible and full of glory,",
          ],
        },
        {
          reference: "1 Pet. 1:9",
          chunks: [
            "receiving the end of your faith—",
            "the salvation of your souls.",
          ],
        },
      ],
    },
  ],
};
