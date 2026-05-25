// =============================================================================
// MATTHEW 5 — NKJV
// =============================================================================
//
// Multi-level memorize game. Authored 2026-04-25.
// Expanded 2026-05-04 — Levels 6–7 added; now covers full Matt 5:1–48.
//
// COMPLETE — covers Matt 5:1–48 across seven levels.
//
//   Level 1 — Matt 5:1–12   Intro + Beatitudes         25 chunks / 24 moves
//   Level 2 — Matt 5:13–16  Salt and light             12 chunks / 11 moves
//   Level 3 — Matt 5:17–20  Fulfilling the Law         13 chunks / 12 moves
//   Level 4 — Matt 5:21–26  Murder / anger             25 chunks / 24 moves
//   Level 5 — Matt 5:27–30  Adultery                   15 chunks / 14 moves
//   Level 6 — Matt 5:31–37  Divorce / oaths            20 chunks / 19 moves
//   Level 7 — Matt 5:38–48  Retaliation / love enemies 29 chunks / 28 moves
//
// Total: 139 chunks / 132 moves across 7 levels.
//
// Reference format "Matt. 5:N" mirrors Psalm 91's "Ps. 91:N" abbreviation
// pattern to fit the existing 110px reference column on the in-game text
// bar.
//
// Per-level targets default to `moves × 300` via the runtime formula —
// no per-level overrides at present. Tune in playtest if needed.
//
// Wrapping note: many chunks exceed ~40 chars and will wrap to two
// lines in the text bar at the current 20px Georgia bold rendering.
// By design — long chunks preserve thematic phrasing ("Blessed are X"
// entire phrase, etc.; vv. 29–30 chunked identically to reinforce the
// "If your right [eye/hand]…" parallel). Conditional per-chunk font
// override is parked in DEFERRED.md as a fallback if wrapping height-
// shift in playtest proves jarring.
// =============================================================================

export default {
  title: "Matthew 5",
  translation: "NKJV",
  book: "Matthew",
  chapter: 5,
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
    {
      title: "Matthew 5:21–26",
      verses: [
        {
          reference: "Matt. 5:21",
          chunks: [
            "You have heard that it was said to those of old,",
            "'You shall not murder,",
            "and whoever murders will be in danger of the judgment.'",
          ],
        },
        {
          reference: "Matt. 5:22",
          chunks: [
            "But I say to you",
            "that whoever is angry with his brother without a cause",
            "shall be in danger of the judgment.",
            "And whoever says to his brother, 'Raca!'",
            "shall be in danger of the council.",
            "But whoever says, 'You fool!'",
            "shall be in danger of hell fire.",
          ],
        },
        {
          reference: "Matt. 5:23",
          chunks: [
            "Therefore if you bring your gift to the altar,",
            "and there remember",
            "that your brother has something against you,",
          ],
        },
        {
          reference: "Matt. 5:24",
          chunks: [
            "leave your gift there before the altar,",
            "and go your way.",
            "First be reconciled to your brother,",
            "and then come and offer your gift.",
          ],
        },
        {
          reference: "Matt. 5:25",
          chunks: [
            "Agree with your adversary quickly,",
            "while you are on the way with him,",
            "lest your adversary deliver you to the judge,",
            "the judge hand you over to the officer,",
            "and you be thrown into prison.",
          ],
        },
        {
          reference: "Matt. 5:26",
          chunks: [
            "Assuredly, I say to you,",
            "you will by no means get out of there",
            "till you have paid the last penny.",
          ],
        },
      ],
    },
    {
      title: "Matthew 5:27–30",
      verses: [
        {
          reference: "Matt. 5:27",
          chunks: [
            "You have heard that it was said,",
            "'You shall not commit adultery.'",
          ],
        },
        {
          reference: "Matt. 5:28",
          chunks: [
            "But I say to you",
            "that whoever looks at a woman to lust for her",
            "has already committed adultery with her in his heart.",
          ],
        },
        {
          reference: "Matt. 5:29",
          chunks: [
            "If your right eye causes you to sin,",
            "pluck it out and cast it from you;",
            "for it is more profitable for you",
            "that one of your members perish,",
            "than for your whole body to be cast into hell.",
          ],
        },
        {
          reference: "Matt. 5:30",
          chunks: [
            "And if your right hand causes you to sin,",
            "cut it off and cast it from you;",
            "for it is more profitable for you",
            "that one of your members perish,",
            "than for your whole body to be cast into hell.",
          ],
        },
      ],
    },
    {
      title: "Matthew 5:31–37",
      verses: [
        {
          reference: "Matt. 5:31",
          chunks: [
            "Furthermore it has been said,",
            "'Whoever divorces his wife,",
            "let him give her a certificate of divorce.'",
          ],
        },
        {
          reference: "Matt. 5:32",
          chunks: [
            "But I say to you that whoever divorces his wife",
            "for any reason except sexual immorality",
            "causes her to commit adultery;",
            "and whoever marries a woman who is divorced",
            "commits adultery.",
          ],
        },
        {
          reference: "Matt. 5:33",
          chunks: [
            "Again you have heard that it was said to those of old,",
            "'You shall not swear falsely,",
            "but shall perform your oaths to the Lord.'",
          ],
        },
        {
          reference: "Matt. 5:34",
          chunks: [
            "But I say to you, do not swear at all:",
            "neither by heaven, for it is God's throne;",
          ],
        },
        {
          reference: "Matt. 5:35",
          chunks: [
            "nor by the earth, for it is His footstool;",
            "nor by Jerusalem, for it is the city of the great King.",
          ],
        },
        {
          reference: "Matt. 5:36",
          chunks: [
            "Nor shall you swear by your head,",
            "because you cannot make one hair white or black.",
          ],
        },
        {
          reference: "Matt. 5:37",
          chunks: [
            "But let your 'Yes' be 'Yes,'",
            "and your 'No,' 'No.'",
            "For whatever is more than these is from the evil one.",
          ],
        },
      ],
    },
    {
      title: "Matthew 5:38–48",
      verses: [
        {
          reference: "Matt. 5:38",
          chunks: [
            "You have heard that it was said,",
            "'An eye for an eye",
            "and a tooth for a tooth.'",
          ],
        },
        {
          reference: "Matt. 5:39",
          chunks: [
            "But I tell you not to resist an evil person.",
            "But whoever slaps you on your right cheek,",
            "turn the other to him also.",
          ],
        },
        {
          reference: "Matt. 5:40",
          chunks: [
            "If anyone wants to sue you and take away your tunic,",
            "let him have your cloak also.",
          ],
        },
        {
          reference: "Matt. 5:41",
          chunks: [
            "And whoever compels you to go one mile,",
            "go with him two.",
          ],
        },
        {
          reference: "Matt. 5:42",
          chunks: [
            "Give to him who asks you,",
            "and from him who wants to borrow from you",
            "do not turn away.",
          ],
        },
        {
          reference: "Matt. 5:43",
          chunks: [
            "You have heard that it was said,",
            "'You shall love your neighbor and hate your enemy.'",
          ],
        },
        {
          reference: "Matt. 5:44",
          chunks: [
            "But I say to you, love your enemies,",
            "bless those who curse you,",
            "do good to those who hate you,",
            "and pray for those who spitefully use you and persecute you,",
          ],
        },
        {
          reference: "Matt. 5:45",
          chunks: [
            "that you may be sons of your Father in heaven;",
            "for He makes His sun rise on the evil and on the good,",
            "and sends rain on the just and the unjust.",
          ],
        },
        {
          reference: "Matt. 5:46",
          chunks: [
            "For if you love those who love you, what reward have you?",
            "Do not even the tax collectors do the same?",
          ],
        },
        {
          reference: "Matt. 5:47",
          chunks: [
            "And if you greet your brethren only,",
            "what do you do more than others?",
            "Do not even the tax collectors do so?",
          ],
        },
        {
          reference: "Matt. 5:48",
          chunks: [
            "Therefore you shall be perfect,",
            "just as your Father in heaven is perfect.",
          ],
        },
      ],
    },
  ],
};
