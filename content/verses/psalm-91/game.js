// =============================================================================
// PSALM 91 — NKJV
// =============================================================================
//
// Multi-level memorize game. Authored 2026-04-24 during V-3 deep-scoping.
// Four thematic levels split on natural verse breakpoints:
//
//   Level 1 — Ps. 91:1–4   The secret place / refuge        13 chunks / 12 moves
//   Level 2 — Ps. 91:5–8   Protection from danger            12 chunks / 11 moves
//   Level 3 — Ps. 91:9–13  Angels / no harm                  14 chunks / 13 moves
//   Level 4 — Ps. 91:14–16 God speaks                        10 chunks /  9 moves
//
// Total: 49 chunks, 45 moves across 4 levels.
//
// Reference format "Ps. 91:N" is abbreviated to fit the existing 110px
// reference column on the in-game text bar without overflow on the
// 2-digit verses (estimated "(Psalm 91:16)" at 19px Georgia italic =
// ~112px, over the column width).
//
// Per-level targets default to `moves × 300` via the runtime formula —
// no per-level overrides at V-3b ship. Tune in playtest if needed.
//
// Six NKJV proofread fixes (vs. the user's first-pass authoring) are
// flagged inline so future re-checks against an NKJV print copy land
// in the right places. They are:
//   - Ps. 91:1   "of the Most High" lowercase (not "Of the Most High")
//   - Ps. 91:1   "under" the shadow (not "in" the shadow)
//   - Ps. 91:2   "and my fortress" (not "and fortress")
//   - Ps. 91:5   "Nor of the arrow" (not "Nor the arrow")
//   - Ps. 91:9   "Because you have made the LORD," — comma not period;
//                LORD all-caps (small-caps in print typography but
//                rendered all-caps in plain text)
//   - Ps. 91:14  "Because he has known My name." — capital "My"
// =============================================================================

export default {
  title: "Psalm 91",
  translation: "NKJV",
  book: "Psalms",
  chapter: 91,
  levels: [
    {
      title: "Psalm 91:1–4",
      verses: [
        {
          reference: "Ps. 91:1",
          chunks: [
            "He who dwells",
            "In the secret place of the Most High",
            "Shall abide under the shadow",
            "Of the Almighty",
          ],
        },
        {
          reference: "Ps. 91:2",
          chunks: [
            "I will say of the Lord",
            "\"He is my refuge and my fortress;",
            "My God, in Him I will trust.\"",
          ],
        },
        {
          reference: "Ps. 91:3",
          chunks: [
            "Surely He shall deliver you",
            "From the snare of the fowler",
            "And from the perilous pestilence",
          ],
        },
        {
          reference: "Ps. 91:4",
          chunks: [
            "He shall cover you with His feathers",
            "And under His wings you shall take refuge;",
            "His truth shall be your shield and buckler.",
          ],
        },
      ],
    },
    {
      title: "Psalm 91:5–8",
      verses: [
        {
          reference: "Ps. 91:5",
          chunks: [
            "You shall not be afraid",
            "of the terror by night,",
            "Nor of the arrow that flies by day.",
          ],
        },
        {
          reference: "Ps. 91:6",
          chunks: [
            "Nor of the pestilence",
            "That walks in darkness",
            "Nor of the destruction",
            "That lays waste at noonday",
          ],
        },
        {
          reference: "Ps. 91:7",
          chunks: [
            "A thousand may fall at your side,",
            "And ten thousand at your right hand;",
            "But it shall not come near you.",
          ],
        },
        {
          reference: "Ps. 91:8",
          chunks: [
            "Only with your eyes shall you look,",
            "And see the reward of the wicked",
          ],
        },
      ],
    },
    {
      title: "Psalm 91:9–13",
      verses: [
        {
          reference: "Ps. 91:9",
          chunks: [
            "Because you have made the LORD,",
            "Who is my refuge",
            "Even the Most High,",
            "Your dwelling place",
          ],
        },
        {
          reference: "Ps. 91:10",
          chunks: [
            "No evil shall befall you,",
            "Nor shall any plague come near your dwelling.",
          ],
        },
        {
          reference: "Ps. 91:11",
          chunks: [
            "For He shall give His angels charge over you",
            "To keep you in all your ways.",
          ],
        },
        {
          reference: "Ps. 91:12",
          chunks: [
            "In their hands they shall bear you up",
            "Lest you dash your foot against a stone.",
          ],
        },
        {
          reference: "Ps. 91:13",
          chunks: [
            "You shall tread upon",
            "The lion and the cobra",
            "The young lion and the serpent",
            "You shall trample underfoot.",
          ],
        },
      ],
    },
    {
      title: "Psalm 91:14–16",
      verses: [
        {
          reference: "Ps. 91:14",
          chunks: [
            "\"Because he has set his love upon Me",
            "Therefore I will deliver him;",
            "I will set him on high",
            "Because he has known My name.",
          ],
        },
        {
          reference: "Ps. 91:15",
          chunks: [
            "He shall call upon Me",
            "And I will answer him",
            "I will be with him in trouble;",
            "I will deliver him and honor him",
          ],
        },
        {
          reference: "Ps. 91:16",
          chunks: [
            "With long life I will satisfy him,",
            "And show him My salvation.",
          ],
        },
      ],
    },
  ],
};
