// =============================================================================
// GENESIS 1:1–5 — NKJV
// =============================================================================
//
// Single-level memorize game. Authored 2026-05-24.
//
//   Level 1 — Gen. 1:1–5  Creation day one  13 chunks / 12 moves
//
// Total: 13 chunks / 12 moves in a single level.
//
// Chunking follows the user's line-by-line breaks in the source draft
// (each line in the source = one chunk). Verse-number prefixes stripped
// to the `reference` field.
//
// NKJV italics convention (translator-supplied words like "was" in v. 2
// and "it was" in v. 4) stripped to plain text — matches the existing
// Matt 5 / Psalm 91 / Titus / 1 Peter convention in the project's data
// files.
//
// Quoted speech in v. 3 ("Let there be light") uses Unicode curly quotes
// to match NKJV print typography without needing to escape JS string
// delimiters.
//
// Reference format "Gen. 1:N" mirrors the abbreviation pattern used by
// Matt 5 ("Matt. 5:N"), Psalm 91 ("Ps. 91:N"), Isaiah ("Isa. 52:N" /
// "Isa. 53:N"), and 1 Peter ("1 Pet. 1:N") to fit the 110px reference
// column on the in-game text bar.
//
// Per-level target defaults to `moves × 300` via the runtime formula —
// 12 × 300 = 3,600. No per-level override at authoring. Tune in playtest
// if needed.
// =============================================================================

export default {
  title: "Genesis 1:1–5",
  translation: "NKJV",
  book: "Genesis",
  chapter: 1,
  levels: [
    {
      title: "Genesis 1:1–5",
      verses: [
        {
          reference: "Gen. 1:1",
          chunks: [
            "In the beginning God",
            "created the heavens and the earth.",
          ],
        },
        {
          reference: "Gen. 1:2",
          chunks: [
            "The earth was without form, and void;",
            "and darkness was on the face of the deep.",
            "And the Spirit of God",
            "was hovering over the face of the waters.",
          ],
        },
        {
          reference: "Gen. 1:3",
          chunks: [
            "Then God said,",
            "“Let there be light”; and there was light.",
          ],
        },
        {
          reference: "Gen. 1:4",
          chunks: [
            "And God saw the light, that it was good;",
            "and God divided the light from the darkness.",
          ],
        },
        {
          reference: "Gen. 1:5",
          chunks: [
            "God called the light Day,",
            "and the darkness He called Night.",
            "So the evening and the morning were the first day.",
          ],
        },
      ],
    },
  ],
};
