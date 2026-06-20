// =============================================================================
// PSALM 46 — WEB (updated)
// =============================================================================
//
// Single-level memorize game. Authored 2026-06-20.
//
//   Level 1 — Ps. 46  God is our refuge and strength  24 chunks / 23 moves
//
// Total: 24 chunks / 23 moves in a single level. Whole psalm as one
// continuous level per user direction during 2026-06-20 scoping
// (matches the Psalm 23 single-level style rather than a Selah-stanza
// split).
//
// Translation label "WEB (updated)": the source is the World English
// Bible, which renders the divine name "Yahweh" (vv. 7, 8, 11). Per
// user direction those were changed to "the LORD" / "the LORD's", and
// the game is labeled "WEB (updated)" to mark the change:
//   v. 7   "Yahweh of Armies"  → "The LORD of Armies"
//   v. 8   "Yahweh’s works"    → "the LORD’s works"
//   v. 11  "Yahweh of Armies"  → "The LORD of Armies"
//
// "Selah" (vv. 3, 7, 11) kept inline at the end of its chunk per user
// direction — faithful to the source and reinforces the stanza rhythm.
//
// Chunking follows the line-by-line breaks in the WEB source (each
// poetic line = one chunk).
//
// Curly apostrophe (U+2019) and curly double quotes (U+201C / U+201D)
// per the project's typography convention. v. 10 ("Be still…") carries
// the opening/closing quotes across its chunks.
//
// Reference format "Ps. 46:N" mirrors the other psalms' pattern to fit
// the 110px reference column on the in-game text bar.
//
// Per-level target defaults to `moves × 300` via the runtime formula
// (23 × 300 = 6,900). No override at authoring. Tune in playtest if
// needed.
// =============================================================================

export default {
  title: "Psalm 46",
  translation: "WEB (updated)",
  book: "Psalms",
  chapter: 46,
  levels: [
    {
      title: "Psalm 46",
      verses: [
        {
          reference: "Ps. 46:1",
          chunks: [
            "God is our refuge and strength,",
            "a very present help in trouble.",
          ],
        },
        {
          reference: "Ps. 46:2",
          chunks: [
            "Therefore we won’t be afraid, though the earth changes,",
            "though the mountains are shaken into the heart of the seas;",
          ],
        },
        {
          reference: "Ps. 46:3",
          chunks: [
            "though its waters roar and are troubled,",
            "though the mountains tremble with their swelling. Selah.",
          ],
        },
        {
          reference: "Ps. 46:4",
          chunks: [
            "There is a river, the streams of which make the city of God glad,",
            "the holy place of the tents of the Most High.",
          ],
        },
        {
          reference: "Ps. 46:5",
          chunks: [
            "God is within her. She shall not be moved.",
            "God will help her at dawn.",
          ],
        },
        {
          reference: "Ps. 46:6",
          chunks: [
            "The nations raged. The kingdoms were moved.",
            "He lifted his voice and the earth melted.",
          ],
        },
        {
          reference: "Ps. 46:7",
          chunks: [
            "The LORD of Armies is with us.",
            "The God of Jacob is our refuge. Selah.",
          ],
        },
        {
          reference: "Ps. 46:8",
          chunks: [
            "Come, see the LORD’s works,",
            "what desolations he has made in the earth.",
          ],
        },
        {
          reference: "Ps. 46:9",
          chunks: [
            "He makes wars cease to the end of the earth.",
            "He breaks the bow, and shatters the spear.",
            "He burns the chariots in the fire.",
          ],
        },
        {
          reference: "Ps. 46:10",
          chunks: [
            "“Be still, and know that I am God.",
            "I will be exalted among the nations.",
            "I will be exalted in the earth.”",
          ],
        },
        {
          reference: "Ps. 46:11",
          chunks: [
            "The LORD of Armies is with us.",
            "The God of Jacob is our refuge. Selah.",
          ],
        },
      ],
    },
  ],
};
