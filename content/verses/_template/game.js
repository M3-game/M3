// Template for a Verses memorize-mode game.
// Copy this folder to a sibling folder under games/, rename the folder to
// your passage's slug (kebab-case: lowercase-with-hyphens, e.g.
// "john-3-16-18"), and fill in the fields below.
//
// Two shapes are supported: single-level (top-level `verses`) and
// multi-level (`levels[]`). Pick one and delete the other. The example
// below ships single-level; the multi-level alternative is commented at
// the bottom of this file.
//
// See README.md in this folder for the full authoring guide.

export default {
  // Stable id used to key progress/stars. Keep it kebab-case and match
  // the folder name.
  slug: 'book-1-1-2',

  // Display title on picker cards and in the in-game header.
  title: 'Book 1:1–2',

  // Optional. Shown in the passage-reveal modal subheading.
  translation: 'KJV',

  // Canonical Bible book name (exactly as listed in core/versesOrder.js
  // BIBLE_BOOKS — e.g. 'Genesis', 'Psalms', '1 Thessalonians'). Combined
  // with `chapter` to sort the picker in biblical order. Games missing
  // these fields sort to the end.
  book: 'Book',
  chapter: 1,

  // Optional. Overrides the default target formula (moves × 300,
  // where moves = chunks - 1 because chunk 0 is pre-visible at game
  // start). Short passages may need a lower target since cascade setup
  // is harder with few moves.
  // targetScore: 1800,

  // Optional. If true, the game is filtered out of the picker at
  // runtime — use while drafting content.
  // hidden: true,

  // Single-level shape: one top-level `verses` array. Each verse has a
  // `reference` (rendered flush-left on the first chunk) and a `chunks`
  // array of short strings that reveal one-at-a-time on successful
  // match-3 swaps. Chunk 0 of the first verse is pre-visible at game
  // start; the remaining chunks.length - 1 chunks reveal across the
  // rest of the game.
  verses: [
    {
      reference: 'Book 1:1',
      chunks: [
        'First chunk of verse 1',
        'Second chunk of verse 1',
      ],
    },
    {
      reference: 'Book 1:2',
      chunks: [
        'First chunk of verse 2',
        'Second chunk of verse 2',
        'Third chunk of verse 2',
      ],
    },
  ],

  // Multi-level shape (delete `verses` above and uncomment the block
  // below to use). Each level can carry its own optional
  // `targetScore` override and optional `title`. Multi-level games
  // light up level-select in the picker (V-3+).
  //
  // levels: [
  //   {
  //     title: 'Book 1:1–2',
  //     // targetScore: 1500,
  //     verses: [
  //       {
  //         reference: 'Book 1:1',
  //         chunks: ['First chunk', 'Second chunk'],
  //       },
  //     ],
  //   },
  //   {
  //     title: 'Book 1:3–4',
  //     verses: [
  //       {
  //         reference: 'Book 1:3',
  //         chunks: ['First chunk', 'Second chunk', 'Third chunk'],
  //       },
  //     ],
  //   },
  // ],
};
