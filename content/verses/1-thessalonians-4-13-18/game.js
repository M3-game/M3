// =============================================================================
// 1 THESSALONIANS 4:13–18 — NKJV
// =============================================================================
//
// Multi-level memorize game. Authored 2026-05-24.
//
// Two thematic sections matching the blank-line break in the user's
// edited source draft:
//
//   Level 1 — 1 Thes. 4:13–15  Sorrow not as others / coming of the Lord  12 chunks / 11 moves
//   Level 2 — 1 Thes. 4:16–18  The Lord descends / caught up / comfort    11 chunks / 10 moves
//
// Total: 23 chunks / 21 moves across 2 levels.
//
// Chunking follows the user's line-by-line breaks in the source draft
// (each line in the source = one chunk). Verse-number prefixes
// (implicit in the source — no numerals visible in the user's edited
// draft) inferred from NKJV verse boundaries.
//
// NKJV italics convention (translator-supplied "and" in v. 15's "we
// who are alive and remain" and again in v. 17's "we who are alive
// and remain") stripped to plain text — matches the existing
// convention across the project's NKJV games.
//
// Reference format "1 Thes. 4:N" uses NKJV's own print abbreviation
// (single "s") rather than SBL's "1 Thess." (double "s") — chosen
// for column-width fit. SBL "1 Thess. 4:17" would render as
// "(1 Thess. 4:17)" at ~15 chars, beyond the 110px reference column
// width estimated in the Psalm 91 file ("(Psalm 91:16)" at ~13 chars
// already over). NKJV "1 Thes." trims one char and clears the column.
//
// Per-level targets default to `moves × 300` via the runtime formula —
// no per-level overrides at authoring. Tune in playtest if needed.
// =============================================================================

export default {
  title: "1 Thessalonians 4:13–18",
  translation: "NKJV",
  levels: [
    {
      title: "1 Thessalonians 4:13–15",
      verses: [
        {
          reference: "1 Thes. 4:13",
          chunks: [
            "But I do not want you to be ignorant, brethren,",
            "concerning those who have fallen asleep,",
            "lest you sorrow as others who have no hope.",
          ],
        },
        {
          reference: "1 Thes. 4:14",
          chunks: [
            "For if we believe that Jesus died and rose again,",
            "even so",
            "God will bring with Him",
            "those who sleep in Jesus.",
          ],
        },
        {
          reference: "1 Thes. 4:15",
          chunks: [
            "For this we say to you",
            "by the word of the Lord,",
            "that we who are alive and remain",
            "until the coming of the Lord",
            "will by no means precede those who are asleep.",
          ],
        },
      ],
    },
    {
      title: "1 Thessalonians 4:16–18",
      verses: [
        {
          reference: "1 Thes. 4:16",
          chunks: [
            "For the Lord Himself",
            "will descend from heaven with a shout,",
            "with the voice of an archangel,",
            "and with the trumpet of God.",
            "And the dead in Christ will rise first.",
          ],
        },
        {
          reference: "1 Thes. 4:17",
          chunks: [
            "Then we who are alive and remain",
            "shall be caught up",
            "together with them in the clouds",
            "to meet the Lord in the air.",
            "And thus we shall always be with the Lord.",
          ],
        },
        {
          reference: "1 Thes. 4:18",
          chunks: [
            "Therefore comfort one another with these words.",
          ],
        },
      ],
    },
  ],
};
