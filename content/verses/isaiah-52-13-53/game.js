// =============================================================================
// ISAIAH 52:13–53:12 — ESV
// =============================================================================
//
// Multi-level memorize game. Authored 2026-05-24.
//
// First non-NKJV game in the project — translation: "ESV".
// The Servant Song (52:13–15 lead-in + all of ch. 53). 15 verses split
// across five thematic levels matching the classical 3-verse stanza
// structure marked in the source draft:
//
//   Level 1 — Isa. 52:13–15  Exalted / disfigured / sprinkles nations  13 chunks / 12 moves
//   Level 2 — Isa. 53:1–3    Who has believed / despised, rejected     13 chunks / 12 moves
//   Level 3 — Isa. 53:4–6    Borne our griefs / pierced for us         12 chunks / 11 moves
//   Level 4 — Isa. 53:7–9    Oppressed / lamb to slaughter / grave     14 chunks / 13 moves
//   Level 5 — Isa. 53:10–12  Will of the LORD / vindication            19 chunks / 18 moves
//
// Total: 71 chunks / 66 moves across 5 levels.
//
// Chunking follows the user's line-by-line breaks in the source draft
// (each line in the edited doc = one chunk). Verse-number prefixes
// stripped to the `reference` field; indentation and trailing whitespace
// stripped from chunk text.
//
// Reference format "Isa. 52:N" / "Isa. 53:N" mirrors the abbreviation
// pattern used by Matt 5 ("Matt. 5:N") and Psalm 91 ("Ps. 91:N") to fit
// the 110px reference column on the in-game text bar.
//
// Per-level targets default to `moves × 300` via the runtime formula —
// no per-level overrides at authoring. Tune in playtest if needed.
//
// Wrapping note: several chunks (notably 52:15 lines, 53:2, 53:7, 53:8,
// 53:11, 53:12) exceed ~40 chars and will wrap to two lines in the text
// bar at the current 20px Georgia bold rendering. By design — line
// breaks preserve the source's poetic phrasing. Per-chunk font override
// remains parked in DEFERRED.md as the fallback if wrapping height-
// shift proves jarring in playtest.
// =============================================================================

export default {
  title: "Isaiah 52:13–53:12",
  translation: "ESV",
  book: "Isaiah",
  chapter: 52,
  levels: [
    {
      title: "Isaiah 52:13–15",
      verses: [
        {
          reference: "Isa. 52:13",
          chunks: [
            "Behold, my servant shall act wisely;",
            "he shall be high and lifted up,",
            "and shall be exalted.",
          ],
        },
        {
          reference: "Isa. 52:14",
          chunks: [
            "As many were astonished at you—",
            "his appearance was so marred,",
            "beyond human semblance,",
            "and his form beyond that",
            "of the children of mankind—",
          ],
        },
        {
          reference: "Isa. 52:15",
          chunks: [
            "so shall he sprinkle many nations.",
            "Kings shall shut their mouths because of him,",
            "for that which has not been told them they see,",
            "and that which they have not heard",
            "they understand.",
          ],
        },
      ],
    },
    {
      title: "Isaiah 53:1–3",
      verses: [
        {
          reference: "Isa. 53:1",
          chunks: [
            "Who has believed",
            "what he has heard from us?",
            "And to whom has the arm of the LORD been revealed?",
          ],
        },
        {
          reference: "Isa. 53:2",
          chunks: [
            "For he grew up before him like a young plant,",
            "and like a root out of dry ground;",
            "he had no form or majesty",
            "that we should look at him,",
            "and no beauty",
            "that we should desire him.",
          ],
        },
        {
          reference: "Isa. 53:3",
          chunks: [
            "He was despised and rejected by men,",
            "a man of sorrows and acquainted with grief;",
            "and as one from whom men hide their faces",
            "he was despised, and we esteemed him not.",
          ],
        },
      ],
    },
    {
      title: "Isaiah 53:4–6",
      verses: [
        {
          reference: "Isa. 53:4",
          chunks: [
            "Surely he has borne our griefs",
            "and carried our sorrows;",
            "yet we esteemed him stricken,",
            "smitten by God, and afflicted.",
          ],
        },
        {
          reference: "Isa. 53:5",
          chunks: [
            "But he was pierced for our transgressions;",
            "he was crushed for our iniquities;",
            "upon him was the chastisement that brought us peace,",
            "and with his wounds we are healed.",
          ],
        },
        {
          reference: "Isa. 53:6",
          chunks: [
            "All we like sheep have gone astray;",
            "we have turned—every one—to his own way;",
            "and the LORD has laid on him",
            "the iniquity of us all.",
          ],
        },
      ],
    },
    {
      title: "Isaiah 53:7–9",
      verses: [
        {
          reference: "Isa. 53:7",
          chunks: [
            "He was oppressed,",
            "and he was afflicted,",
            "yet he opened not his mouth;",
            "like a lamb that is led to the slaughter,",
            "and like a sheep that before its shearers is silent,",
            "so he opened not his mouth.",
          ],
        },
        {
          reference: "Isa. 53:8",
          chunks: [
            "By oppression and judgment he was taken away;",
            "and as for his generation, who considered",
            "that he was cut off out of the land of the living,",
            "stricken for the transgression of my people?",
          ],
        },
        {
          reference: "Isa. 53:9",
          chunks: [
            "And they made his grave with the wicked",
            "and with a rich man in his death,",
            "although he had done no violence,",
            "and there was no deceit in his mouth.",
          ],
        },
      ],
    },
    {
      title: "Isaiah 53:10–12",
      verses: [
        {
          reference: "Isa. 53:10",
          chunks: [
            "Yet it was the will of the LORD to crush him;",
            "he has put him to grief;",
            "when his soul makes an offering for guilt,",
            "he shall see his offspring;",
            "he shall prolong his days;",
            "the will of the LORD",
            "shall prosper in his hand.",
          ],
        },
        {
          reference: "Isa. 53:11",
          chunks: [
            "Out of the anguish of his soul",
            "he shall see and be satisfied;",
            "by his knowledge",
            "shall the righteous one, my servant,",
            "make many to be accounted righteous,",
            "and he shall bear their iniquities.",
          ],
        },
        {
          reference: "Isa. 53:12",
          chunks: [
            "Therefore I will divide him a portion with the many,",
            "and he shall divide the spoil with the strong,",
            "because he poured out his soul to death",
            "and was numbered with the transgressors;",
            "yet he bore the sin of many,",
            "and makes intercession for the transgressors.",
          ],
        },
      ],
    },
  ],
};
