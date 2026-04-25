// =============================================================================
// MATTHEW 5 — NKJV
// =============================================================================
//
// Multi-level memorize game. Authored 2026-04-25.
//
// PARTIAL — v1.0 ships Matt 5:1–20 across three levels. Additional
// levels (5:21+) are planned and will be added additively in future
// sessions; the wrapper engine has no notion of "complete" beyond the
// levels[] array length, so adding more entries Just Works.
//
//   Level 1 — Matt 5:1–12   Intro + Beatitudes        25 chunks / 24 moves
//   Level 2 — Matt 5:13–16  Salt and light            12 chunks / 11 moves
//   Level 3 — Matt 5:17–20  Fulfilling the Law        13 chunks / 12 moves
//
// Total at v1.0: 50 chunks / 47 moves across 3 levels.
//
// Reference format "Matt. 5:N" mirrors Psalm 91's "Ps. 91:N" abbreviation
// pattern to fit the existing 110px reference column on the in-game text
// bar.
//
// Per-level targets default to `moves × 300` via the runtime formula —
// no per-level overrides at v1.0. Tune in playtest if needed.
//
// Wrapping note: ~22 of 50 chunks at v1.0 exceed ~40 chars and will
// wrap to two lines in the text bar at the current 20px Georgia bold
// rendering. By design — long chunks preserve thematic phrasing
// ("Blessed are X" entire phrase, etc.). Conditional per-chunk font
// override is parked in DEFERRED.md as a fallback if wrapping height-
// shift in playtest proves jarring.
// =============================================================================

export default {
  title: "Matthew 5",
  translation: "NKJV",
  levels: [
    {
      title: "Matthew 5:1–12",
      verses: [
        {
          reference: "Matt. 5:1",
          chunks: [
            "And seeing the multitudes, He went up on a mountain,",
            "and when He was seated His disciples came to Him.",
          ],
        },
        {
          reference: "Matt. 5:2",
          chunks: [
            "Then He opened His mouth",
            "and taught them, saying:",
          ],
        },
        {
          reference: "Matt. 5:3",
          chunks: [
            "Blessed are the poor in spirit,",
            "For theirs is the kingdom of heaven.",
          ],
        },
        {
          reference: "Matt. 5:4",
          chunks: [
            "Blessed are those who mourn,",
            "For they shall be comforted.",
          ],
        },
        {
          reference: "Matt. 5:5",
          chunks: [
            "Blessed are the meek,",
            "For they shall inherit the earth.",
          ],
        },
        {
          reference: "Matt. 5:6",
          chunks: [
            "Blessed are those who hunger and thirst for righteousness,",
            "For they shall be filled.",
          ],
        },
        {
          reference: "Matt. 5:7",
          chunks: [
            "Blessed are the merciful,",
            "For they shall obtain mercy.",
          ],
        },
        {
          reference: "Matt. 5:8",
          chunks: [
            "Blessed are the pure in heart,",
            "For they shall see God.",
          ],
        },
        {
          reference: "Matt. 5:9",
          chunks: [
            "Blessed are the peacemakers,",
            "For they shall be called sons of God.",
          ],
        },
        {
          reference: "Matt. 5:10",
          chunks: [
            "Blessed are those who are persecuted for righteousness' sake,",
            "For theirs is the kingdom of heaven.",
          ],
        },
        {
          reference: "Matt. 5:11",
          chunks: [
            "Blessed are you when they revile and persecute you,",
            "and say all kinds of evil against you falsely for My sake.",
          ],
        },
        {
          reference: "Matt. 5:12",
          chunks: [
            "Rejoice and be exceedingly glad,",
            "for great is your reward in heaven,",
            "for so they persecuted the prophets who were before you.",
          ],
        },
      ],
    },
    {
      title: "Matthew 5:13–16",
      verses: [
        {
          reference: "Matt. 5:13",
          chunks: [
            "You are the salt of the earth;",
            "but if the salt loses its flavor, how shall it be seasoned?",
            "It is then good for nothing",
            "but to be thrown out and trampled underfoot by men.",
          ],
        },
        {
          reference: "Matt. 5:14",
          chunks: [
            "You are the light of the world.",
            "A city that is set on a hill cannot be hidden.",
          ],
        },
        {
          reference: "Matt. 5:15",
          chunks: [
            "Nor do they light a lamp and put it under a basket,",
            "but on a lampstand,",
            "and it gives light to all who are in the house.",
          ],
        },
        {
          reference: "Matt. 5:16",
          chunks: [
            "Let your light so shine before men,",
            "that they may see your good works",
            "and glorify your Father in heaven.",
          ],
        },
      ],
    },
    {
      title: "Matthew 5:17–20",
      verses: [
        {
          reference: "Matt. 5:17",
          chunks: [
            "Do not think that I came to destroy the Law or the Prophets.",
            "I did not come to destroy but to fulfill.",
          ],
        },
        {
          reference: "Matt. 5:18",
          chunks: [
            "For assuredly, I say to you, till heaven and earth pass away,",
            "one jot or one tittle",
            "will by no means pass from the law till all is fulfilled.",
          ],
        },
        {
          reference: "Matt. 5:19",
          chunks: [
            "Whoever therefore breaks one of the least of these commandments,",
            "and teaches men so,",
            "shall be called least in the kingdom of heaven;",
            "but whoever does and teaches them,",
            "he shall be called great in the kingdom of heaven.",
          ],
        },
        {
          reference: "Matt. 5:20",
          chunks: [
            "For I say to you, that unless your righteousness",
            "exceeds the righteousness of the scribes and Pharisees,",
            "you will by no means enter the kingdom of heaven.",
          ],
        },
      ],
    },
  ],
};
