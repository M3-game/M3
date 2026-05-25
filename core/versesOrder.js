// =============================================================================
// VERSES — biblical-order sort
// =============================================================================
//
// Picker render order for verses games. Sorts by the canonical Protestant
// Bible book order (`BIBLE_BOOKS` below), then by chapter number within a
// book. Each game.js declares its own `book` and `chapter` fields; this
// module reads them and returns a sorted slug array.
//
// Games missing the `book` field, or with a book name not in BIBLE_BOOKS,
// sort to the end (stable relative order among themselves).
//
// Added: #1 (biblical-order card sort, 2026-05-25).
// =============================================================================

export const BIBLE_BOOKS = [
  // Old Testament — 39 books.
  'Genesis', 'Exodus', 'Leviticus', 'Numbers', 'Deuteronomy',
  'Joshua', 'Judges', 'Ruth',
  '1 Samuel', '2 Samuel', '1 Kings', '2 Kings',
  '1 Chronicles', '2 Chronicles',
  'Ezra', 'Nehemiah', 'Esther', 'Job',
  'Psalms', 'Proverbs', 'Ecclesiastes', 'Song of Songs',
  'Isaiah', 'Jeremiah', 'Lamentations', 'Ezekiel', 'Daniel',
  'Hosea', 'Joel', 'Amos', 'Obadiah', 'Jonah', 'Micah',
  'Nahum', 'Habakkuk', 'Zephaniah', 'Haggai', 'Zechariah', 'Malachi',
  // New Testament — 27 books.
  'Matthew', 'Mark', 'Luke', 'John', 'Acts',
  'Romans', '1 Corinthians', '2 Corinthians', 'Galatians', 'Ephesians',
  'Philippians', 'Colossians', '1 Thessalonians', '2 Thessalonians',
  '1 Timothy', '2 Timothy', 'Titus', 'Philemon', 'Hebrews', 'James',
  '1 Peter', '2 Peter', '1 John', '2 John', '3 John', 'Jude', 'Revelation',
];

// Returns a slug array sorted by [book canonical index, chapter].
// `registry` is the slug-keyed games object built by the platform's
// import.meta.glob block. Games missing book/chapter (or with an unknown
// book) sort to the end, preserving their relative slug order.
export function sortVersesSlugs(registry) {
  const slugs = Object.keys(registry);
  return slugs.slice().sort((slugA, slugB) => {
    const a = registry[slugA] || {};
    const b = registry[slugB] || {};
    const ia = BIBLE_BOOKS.indexOf(a.book);
    const ib = BIBLE_BOOKS.indexOf(b.book);
    const ra = ia === -1 ? Infinity : ia;
    const rb = ib === -1 ? Infinity : ib;
    if (ra !== rb) return ra - rb;
    const ca = Number.isFinite(a.chapter) ? a.chapter : Infinity;
    const cb = Number.isFinite(b.chapter) ? b.chapter : Infinity;
    if (ca !== cb) return ca - cb;
    return slugA < slugB ? -1 : slugA > slugB ? 1 : 0;
  });
}
