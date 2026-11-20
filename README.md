# ts-unicode-grapheme-splitter

Splits JavaScript strings into extended grapheme clusters, so that combining marks, surrogate pairs, and ZWJ sequences stay together as one user-perceived character.

```js
import { splitGraphemes, countGraphemes, reverseGraphemes } from 'ts-unicode-grapheme-splitter';

splitGraphemes('a\u0301\u{1F1FA}\u{1F1F8}\u{1F469}\u200D\u{1F4BB}b');
// => ['a\u0301', '\u{1F1FA}\u{1F1F8}', '\u{1F469}\u200D\u{1F4BB}', 'b']

countGraphemes('e\u0301');
// => 1

reverseGraphemes('a\u0301b');
// => 'ba\u0301'
```

## Why this exists

`str.length` counts UTF-16 code units, and `Array.from(str)` counts code points. Neither matches what a user sees as one character. A combining acute accent is a separate code point from its base letter, a grinning face is two code units, and a single emoji such as a woman technologist is three code points joined by a zero-width joiner. Code that slices, reverses, or truncates by code unit will corrupt all of these.

The trade-off: a fully conformant UAX #29 implementation ships the Unicode `Grapheme_Cluster_Break` property table, which is large and versioned. This library instead checks the combining, spacing, and joiner ranges that appear in real text, plus the regional indicator pairing rule. That keeps the source small and dependency-free. The cost is that code points whose break behaviour depends on properties not checked here may be split more aggressively than a table-driven implementation would split them.

## API

- `splitGraphemes(input)` — returns an array of grapheme clusters. Throws `TypeError` if `input` is not a string.
- `countGraphemes(input)` — returns the number of clusters without allocating the array. Throws `TypeError` if `input` is not a string.
- `reverseGraphemes(input)` — reverses by cluster, so combining marks stay attached to their base. Throws `TypeError` if `input` is not a string.

## The awkward edge

A ZWJ sequence is treated as a single cluster only when the joiner sits between two code points. A trailing ZWJ at the end of input is attached to the preceding cluster, which is what you want for streaming input but means `splitGraphemes('a\u200D')` returns `['a\u200D']` rather than `['a', '\u200D']`. If you need to detect a dangling joiner, check the last cluster's final code point yourself.
