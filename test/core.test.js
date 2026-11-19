import test from 'node:test';
import assert from 'node:assert/strict';

import { splitGraphemes, countGraphemes, reverseGraphemes } from '../src/index.js';

test('splits plain ASCII into individual characters', () => {
  assert.deepEqual(splitGraphemes('abc'), ['a', 'b', 'c']);
});

test('returns an empty array for an empty string', () => {
  assert.deepEqual(splitGraphemes(''), []);
});

test('keeps a combining mark attached to its base character', () => {
  // U+0065 LATIN SMALL LETTER E + U+0301 COMBINING ACUTE ACCENT
  const input = 'e\u0301';
  assert.deepEqual(splitGraphemes(input), ['e\u0301']);
});

test('keeps multiple combining marks in a single cluster', () => {
  // U+0061 + U+0308 + U+0301
  const input = 'a\u0308\u0301';
  assert.deepEqual(splitGraphemes(input), ['a\u0308\u0301']);
});

test('does not split a surrogate pair', () => {
  // U+1F600 GRINNING FACE is a surrogate pair in UTF-16.
  const input = '\u{1F600}';
  assert.deepEqual(splitGraphemes(input), ['\u{1F600}']);
  assert.equal(splitGraphemes(input)[0].length, 2);
});

test('joins a ZWJ sequence into one cluster', () => {
  // U+1F469 + ZWJ + U+1F4BB (woman technologist)
  const input = '\u{1F469}\u200D\u{1F4BB}';
  assert.deepEqual(splitGraphemes(input), [input]);
});

test('joins a longer ZWJ sequence into one cluster', () => {
  // U+1F468 + ZWJ + U+1F469 + ZWJ + U+1F467 (family)
  const input = '\u{1F468}\u200D\u{1F469}\u200D\u{1F467}';
  assert.deepEqual(splitGraphemes(input), [input]);
});

test('keeps a variation selector attached to its base character', () => {
  // U+2764 + U+FE0F (heavy black heart with emoji presentation)
  const input = '\u2764\uFE0F';
  assert.deepEqual(splitGraphemes(input), [input]);
});

test('groups a regional indicator pair as one cluster', () => {
  // U+1F1FA U+1F1F8 (United States flag)
  const input = '\u{1F1FA}\u{1F1F8}';
  assert.deepEqual(splitGraphemes(input), [input]);
});

test('does not group three regional indicators into one cluster', () => {
  // Three regional indicators: the first two form a flag, the third is alone.
  const input = '\u{1F1FA}\u{1F1F8}\u{1F1EB}';
  assert.deepEqual(splitGraphemes(input), ['\u{1F1FA}\u{1F1F8}', '\u{1F1EB}']);
});

test('separates an emoji from a following ASCII letter', () => {
  const input = '\u{1F600}a';
  assert.deepEqual(splitGraphemes(input), ['\u{1F600}', 'a']);
});

test('countGraphemes agrees with splitGraphemes on a mixed string', () => {
  const input = 'a\u0301\u{1F1FA}\u{1F1F8}\u{1F469}\u200D\u{1F4BB}b';
  assert.equal(countGraphemes(input), splitGraphemes(input).length);
  assert.equal(countGraphemes(input), 4);
});

test('countGraphemes returns 0 for an empty string', () => {
  assert.equal(countGraphemes(''), 0);
});

test('reverseGraphemes preserves clusters', () => {
  const input = 'a\u0301\u{1F1FA}\u{1F1F8}b';
  assert.equal(reverseGraphemes(input), 'b\u{1F1FA}\u{1F1F8}a\u0301');
});

test('reverseGraphemes is an involution on cluster-safe strings', () => {
  const input = '\u{1F469}\u200D\u{1F4BB}x\u0301';
  assert.equal(reverseGraphemes(reverseGraphemes(input)), input);
});

test('splitGraphemes rejects non-string input', () => {
  assert.throws(() => splitGraphemes(42), TypeError);
  assert.throws(() => splitGraphemes(null), TypeError);
});

test('countGraphemes rejects non-string input', () => {
  assert.throws(() => countGraphemes(undefined), TypeError);
});
