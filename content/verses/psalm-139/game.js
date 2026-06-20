// =============================================================================
// PSALM 139 — WEB (updated)
// =============================================================================
//
// Multi-level memorize game. Authored 2026-06-20.
//
//   Level 1 — Ps. 139:1–6    God knows me (omniscience)        13 chunks / 12 moves
//   Level 2 — Ps. 139:7–12   I can't flee from God             13 chunks / 12 moves
//   Level 3 — Ps. 139:13–18  God made me (fearfully made)      17 chunks / 16 moves
//   Level 4 — Ps. 139:19–24  The wicked / "search me" prayer   12 chunks / 11 moves
//
// Total: 55 chunks / 51 moves across 4 thematic levels (even 6-verse
// stanzas). Whole psalm including the imprecatory verses (19–22) per
// user direction during 2026-06-20 scoping.
//
// Translation label "WEB (updated)": the source text is the World
// English Bible with the divine name rendered "LORD" (vv. 1, 4, 21)
// instead of the standard WEB "Yahweh". User chose to keep the "LORD"
// reading as supplied and label it "WEB (updated)" to mark the change.
//
// Chunking follows the line-by-line breaks in the WEB source (each
// poetic line = one chunk). Short fragments ("It's lofty." in v. 6)
// kept as their own chunk per user direction.
//
// Curly apostrophe (U+2019) and curly double quotes (U+201C / U+201D)
// per the project's typography convention (matches Psalm 23, etc.).
//
// Reference format "Ps. 139:N" mirrors Psalm 91's "Ps. 91:N" to fit
// the 110px reference column on the in-game text bar.
//
// Per-level targets default to `moves × 300` via the runtime formula
// (every level is ≤16 moves, so all platforms apply × 300). No
// per-level overrides at authoring. Tune in playtest if needed.
// =============================================================================

export default {
  title: "Psalm 139",
  translation: "WEB (updated)",
  book: "Psalms",
  chapter: 139,
  levels: [
    {
      title: "Psalm 139:1–6",
      verses: [
        {
          reference: "Ps. 139:1",
          chunks: [
            "LORD, you have searched me,",
            "and you know me.",
          ],
        },
        {
          reference: "Ps. 139:2",
          chunks: [
            "You know my sitting down and my rising up.",
            "You perceive my thoughts from afar.",
          ],
        },
        {
          reference: "Ps. 139:3",
          chunks: [
            "You search out my path and my lying down,",
            "and are acquainted with all my ways.",
          ],
        },
        {
          reference: "Ps. 139:4",
          chunks: [
            "For there is not a word on my tongue,",
            "but behold, LORD, you know it altogether.",
          ],
        },
        {
          reference: "Ps. 139:5",
          chunks: [
            "You hem me in behind and before.",
            "You laid your hand on me.",
          ],
        },
        {
          reference: "Ps. 139:6",
          chunks: [
            "This knowledge is beyond me.",
            "It’s lofty.",
            "I can’t attain it.",
          ],
        },
      ],
    },
    {
      title: "Psalm 139:7–12",
      verses: [
        {
          reference: "Ps. 139:7",
          chunks: [
            "Where could I go from your Spirit?",
            "Or where could I flee from your presence?",
          ],
        },
        {
          reference: "Ps. 139:8",
          chunks: [
            "If I ascend up into heaven, you are there.",
            "If I make my bed in Sheol, behold, you are there!",
          ],
        },
        {
          reference: "Ps. 139:9",
          chunks: [
            "If I take the wings of the dawn,",
            "and settle in the uttermost parts of the sea,",
          ],
        },
        {
          reference: "Ps. 139:10",
          chunks: [
            "even there your hand will lead me,",
            "and your right hand will hold me.",
          ],
        },
        {
          reference: "Ps. 139:11",
          chunks: [
            "If I say, “Surely the darkness will overwhelm me.",
            "The light around me will be night,”",
          ],
        },
        {
          reference: "Ps. 139:12",
          chunks: [
            "even the darkness doesn’t hide from you,",
            "but the night shines as the day.",
            "The darkness is like light to you.",
          ],
        },
      ],
    },
    {
      title: "Psalm 139:13–18",
      verses: [
        {
          reference: "Ps. 139:13",
          chunks: [
            "For you formed my inmost being.",
            "You knit me together in my mother’s womb.",
          ],
        },
        {
          reference: "Ps. 139:14",
          chunks: [
            "I will give thanks to you,",
            "for I am fearfully and wonderfully made.",
            "Your works are wonderful.",
            "My soul knows that very well.",
          ],
        },
        {
          reference: "Ps. 139:15",
          chunks: [
            "My frame wasn’t hidden from you,",
            "when I was made in secret,",
            "woven together in the depths of the earth.",
          ],
        },
        {
          reference: "Ps. 139:16",
          chunks: [
            "Your eyes saw my body.",
            "In your book they were all written,",
            "the days that were ordained for me,",
            "when as yet there were none of them.",
          ],
        },
        {
          reference: "Ps. 139:17",
          chunks: [
            "How precious to me are your thoughts, God!",
            "How vast is their sum!",
          ],
        },
        {
          reference: "Ps. 139:18",
          chunks: [
            "If I would count them, they are more in number than the sand.",
            "When I wake up, I am still with you.",
          ],
        },
      ],
    },
    {
      title: "Psalm 139:19–24",
      verses: [
        {
          reference: "Ps. 139:19",
          chunks: [
            "If only you, God, would kill the wicked.",
            "Get away from me, you bloodthirsty men!",
          ],
        },
        {
          reference: "Ps. 139:20",
          chunks: [
            "For they speak against you wickedly.",
            "Your enemies take your name in vain.",
          ],
        },
        {
          reference: "Ps. 139:21",
          chunks: [
            "LORD, don’t I hate those who hate you?",
            "Am I not grieved with those who rise up against you?",
          ],
        },
        {
          reference: "Ps. 139:22",
          chunks: [
            "I hate them with perfect hatred.",
            "They have become my enemies.",
          ],
        },
        {
          reference: "Ps. 139:23",
          chunks: [
            "Search me, God, and know my heart.",
            "Try me, and know my thoughts.",
          ],
        },
        {
          reference: "Ps. 139:24",
          chunks: [
            "See if there is any wicked way in me,",
            "and lead me in the everlasting way.",
          ],
        },
      ],
    },
  ],
};
