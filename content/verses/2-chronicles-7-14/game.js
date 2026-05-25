// =============================================================================
// 2 CHRONICLES 7:14 — NKJV
// =============================================================================
//
// Single-level memorize game. Authored 2026-05-24.
//
//   Level 1 — 2 Chr. 7:14  If My people humble themselves  8 chunks / 7 moves
//
// Total: 8 chunks / 7 moves in a single level. Shortest game in the
// project to date (compare Titus 2:11–13's 13 chunks).
//
// Chunking follows the user's line-by-line breaks in the source draft
// (each line in the source = one chunk).
//
// Mid-speech-clip handling: 2 Chr. 7:14 sits inside God's address that
// opens back in v. 13 ("When I shut up heaven and there is no rain…")
// and continues past v. 14. The first chunk preserves the opening
// curly double quote (“if My people) to mark the mid-speech entry;
// the final chunk ends with "and heal their land." with no closing
// quote since the speech continues. First mid-speech-clip game in the
// project — all prior quoted-speech games (Genesis 1, Genesis 50,
// Numbers 14) had self-contained speech that opened and closed within
// the passage.
//
// Lowercase "if" at the start of the first chunk is also a mid-verse
// continuation marker — v. 14 is the apodosis of a conditional clause
// that begins in v. 13 ("When I shut up heaven…if My people…then…").
// Preserved as-is from the source draft for fidelity.
//
// "My" capitalized throughout (My people, My name, My face) per NKJV
// deity-pronoun convention — matches existing pattern across the
// project's NKJV games (Matt 5, Psalm 91, 1 Peter, Genesis 1, Genesis
// 50, Numbers 14).
//
// Reference format "2 Chr. 7:14" — 9 chars before the verse number,
// same width as "1 Pet. 1:" used by the 1 Peter game. Fits the 110px
// reference column on the in-game text bar.
//
// Per-level target defaults to `moves × 300` via the runtime formula —
// 7 × 300 = 2,100. No per-level override at authoring. Tune in
// playtest if needed (this is a short game; target may feel low).
// =============================================================================

export default {
  title: "2 Chronicles 7:14",
  translation: "NKJV",
  book: "2 Chronicles",
  chapter: 7,
  levels: [
    {
      title: "2 Chronicles 7:14",
      verses: [
        {
          reference: "2 Chr. 7:14",
          chunks: [
            "“if My people",
            "who are called by My name",
            "will humble themselves,",
            "and pray and seek My face,",
            "and turn from their wicked ways,",
            "then I will hear from heaven,",
            "and will forgive their sin",
            "and heal their land.",
          ],
        },
      ],
    },
  ],
};
