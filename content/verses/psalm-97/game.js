// =============================================================================
// PSALM 97 — NKJV
// =============================================================================
//
// Multi-level memorize game. Authored 2026-06-20.
//
//   Level 1 — Ps. 97:1–6   The LORD reigns (theophany)         13 chunks / 12 moves
//   Level 2 — Ps. 97:7–12  Idols shamed; rejoice in the LORD   15 chunks / 14 moves
//
// Total: 28 chunks / 26 moves across 2 thematic levels. Split between
// the theophany (the LORD's reign in power, vv. 1–6) and the response
// to it (idolaters shamed, Zion glad, the righteous rejoice, vv. 7–12)
// per user direction during 2026-06-20 scoping.
//
// Chunking follows the line-by-line breaks in the source (each line =
// one chunk).
//
// NKJV "LORD" / "Lord" distinction preserved in v. 5: "the LORD"
// (all-caps, the divine name) then "the Lord of the whole earth"
// (mixed-case, Adonai) exactly as in the NKJV source.
//
// "LORD" rendered all-caps in plain text (NKJV print uses small caps),
// matching the existing NKJV games (Psalm 91, Psalm 23, Matt 5, etc.).
//
// Reference format "Ps. 97:N" mirrors the other psalms' "Ps. N:N"
// pattern to fit the 110px reference column on the in-game text bar.
//
// Per-level targets default to `moves × 300` via the runtime formula.
// No per-level overrides at authoring. Tune in playtest if needed.
// =============================================================================

export default {
  title: "Psalm 97",
  translation: "NKJV",
  book: "Psalms",
  chapter: 97,
  levels: [
    {
      title: "Psalm 97:1–6",
      verses: [
        {
          reference: "Ps. 97:1",
          chunks: [
            "The LORD reigns;",
            "Let the earth rejoice;",
            "Let the multitude of isles be glad!",
          ],
        },
        {
          reference: "Ps. 97:2",
          chunks: [
            "Clouds and darkness surround Him;",
            "Righteousness and justice are the foundation of His throne.",
          ],
        },
        {
          reference: "Ps. 97:3",
          chunks: [
            "A fire goes before Him,",
            "And burns up His enemies round about.",
          ],
        },
        {
          reference: "Ps. 97:4",
          chunks: [
            "His lightnings light the world;",
            "The earth sees and trembles.",
          ],
        },
        {
          reference: "Ps. 97:5",
          chunks: [
            "The mountains melt like wax at the presence of the LORD,",
            "At the presence of the Lord of the whole earth.",
          ],
        },
        {
          reference: "Ps. 97:6",
          chunks: [
            "The heavens declare His righteousness,",
            "And all the peoples see His glory.",
          ],
        },
      ],
    },
    {
      title: "Psalm 97:7–12",
      verses: [
        {
          reference: "Ps. 97:7",
          chunks: [
            "Let all be put to shame who serve carved images,",
            "Who boast of idols.",
            "Worship Him, all you gods.",
          ],
        },
        {
          reference: "Ps. 97:8",
          chunks: [
            "Zion hears and is glad,",
            "And the daughters of Judah rejoice",
            "Because of Your judgments, O LORD.",
          ],
        },
        {
          reference: "Ps. 97:9",
          chunks: [
            "For You, LORD, are most high above all the earth;",
            "You are exalted far above all gods.",
          ],
        },
        {
          reference: "Ps. 97:10",
          chunks: [
            "You who love the LORD, hate evil!",
            "He preserves the souls of His saints;",
            "He delivers them out of the hand of the wicked.",
          ],
        },
        {
          reference: "Ps. 97:11",
          chunks: [
            "Light is sown for the righteous,",
            "And gladness for the upright in heart.",
          ],
        },
        {
          reference: "Ps. 97:12",
          chunks: [
            "Rejoice in the LORD, you righteous,",
            "And give thanks at the remembrance of His holy name.",
          ],
        },
      ],
    },
  ],
};
