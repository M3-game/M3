// Titus 2:11–13 (NKJV) — first memorize-mode content for Verses platform.
// Single-level. 13 chunks across verses 11 / 12 / 13 (3 / 6 / 4).
// Target default at V-2: moves × 300 = 12 × 300 = 3,600 (moves = chunks − 1
// because chunk 0 is pre-visible at game start).
//
// Reference rendering: each verse's first chunk surfaces the "(Titus 2:NN)"
// tag in the reference column; subsequent chunks render in the content
// column only. The runtime derives this from the `reference` field per verse.

export default {
  slug: 'titus-2-11-13',
  title: 'Titus 2:11–13',
  translation: 'NKJV',
  targetScore: 3600,
  verses: [
    {
      reference: 'Titus 2:11',
      chunks: [
        'For the grace of God',
        'That brings salvation',
        'Has appeared to all men',
      ],
    },
    {
      reference: 'Titus 2:12',
      chunks: [
        'Teaching us that',
        'Denying ungodliness',
        'And worldly lusts',
        'We should live',
        'Soberly, righteously, and Godly',
        'In this present age',
      ],
    },
    {
      reference: 'Titus 2:13',
      chunks: [
        'Looking for the Blessed Hope',
        'and glorious appearing',
        'of our great God and Savior',
        'Jesus Christ',
      ],
    },
  ],
};
