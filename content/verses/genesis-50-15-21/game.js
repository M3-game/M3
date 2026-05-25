// =============================================================================
// GENESIS 50:15–21 — NKJV
// =============================================================================
//
// Multi-level memorize game. Authored 2026-05-24.
//
// Two thematic sections matching the blank-line break in the user's
// edited source draft. The break falls MID-VERSE in v. 17 — a first
// for the project (all prior level splits in Matt 5 / Psalm 91 /
// Isaiah / 1 Peter fell on verse boundaries):
//
//   Level 1 — Gen. 50:15–17a  Brothers' relayed message      14 chunks / 13 moves
//   Level 2 — Gen. 50:17b–21  Joseph's response & comfort    13 chunks / 12 moves
//
// Total: 27 chunks / 25 moves across 2 levels.
//
// Level 1's last verse object and Level 2's first verse object both
// carry `reference: "Gen. 50:17"` — the user's split puts the brothers'
// relayed speech ("Thus you shall say to Joseph...") at the end of
// Level 1 and the narrative response ("And Joseph wept when they spoke
// to him.") at the start of Level 2, both parts of NKJV v. 17. Level
// titles use scholarly "a" / "b" suffixes to mark the split.
//
// Chunking follows the user's line-by-line breaks in the source draft
// (each line in the source = one chunk). Verse-number prefixes stripped
// to the `reference` field.
//
// NKJV italics convention (translator-supplied words like "messengers"
// in v. 16, "are" in v. 18, "am" in v. 19, "but" and "it is" in v. 20)
// stripped to plain text — matches the existing Matt 5 / Psalm 91 /
// Titus / 1 Peter / Genesis 1 convention in the project's data files.
//
// Nested quoted speech (three layers deep in vv. 16–17: brothers'
// message to Joseph → Jacob's command to brothers → the actual
// forgiveness ask) uses Unicode curly quotes for typography fidelity:
// outer “…”, middle ‘…’, inner “…”. The apostrophe in "Joseph's"
// uses U+2019.
//
// Reference format "Gen. 50:N" mirrors the abbreviation pattern used
// by other games in the project (Matt 5, Psalm 91, Isaiah, 1 Peter,
// Genesis 1) to fit the 110px reference column on the in-game text
// bar.
//
// Per-level targets default to `moves × 300` via the runtime formula —
// no per-level overrides at authoring. Tune in playtest if needed.
// =============================================================================

export default {
  title: "Genesis 50:15–21",
  translation: "NKJV",
  book: "Genesis",
  chapter: 50,
  levels: [
    {
      title: "Genesis 50:15–17a",
      verses: [
        {
          reference: "Gen. 50:15",
          chunks: [
            "When Joseph’s brothers",
            "saw that their father was dead,",
            "they said, “Perhaps Joseph will hate us,",
            "and may actually repay us",
            "for all the evil which we did to him.”",
          ],
        },
        {
          reference: "Gen. 50:16",
          chunks: [
            "So they sent messengers to Joseph, saying,",
            "“Before your father died",
            "he commanded, saying,",
          ],
        },
        {
          reference: "Gen. 50:17",
          chunks: [
            "‘Thus you shall say to Joseph:",
            "“I beg you,",
            "please forgive the trespass of your brothers",
            "and their sin; for they did evil to you.” ’",
            "Now, please, forgive the trespass",
            "of the servants of the God of your father.”",
          ],
        },
      ],
    },
    {
      title: "Genesis 50:17b–21",
      verses: [
        {
          reference: "Gen. 50:17",
          chunks: [
            "And Joseph wept when they spoke to him.",
          ],
        },
        {
          reference: "Gen. 50:18",
          chunks: [
            "Then his brothers also went",
            "and fell down before his face,",
            "and they said, “Behold, we are your servants.”",
          ],
        },
        {
          reference: "Gen. 50:19",
          chunks: [
            "Joseph said to them, “Do not be afraid,",
            "for am I in the place of God?",
          ],
        },
        {
          reference: "Gen. 50:20",
          chunks: [
            "But as for you,",
            "you meant evil against me; but God meant it for good,",
            "in order to bring it about as it is this day,",
            "to save many people alive.",
          ],
        },
        {
          reference: "Gen. 50:21",
          chunks: [
            "Now therefore, do not be afraid;",
            "I will provide for you and your little ones.”",
            "And he comforted them and spoke kindly to them.",
          ],
        },
      ],
    },
  ],
};
