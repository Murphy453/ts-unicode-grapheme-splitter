/**
 * Unicode extended grapheme cluster splitting.
 *
 * This module implements a practical subset of UAX #29 extended grapheme
 * cluster rules. It is intentionally dependency-free and does not bundle
 * Unicode data tables; instead it relies on JavaScript's own Unicode-aware
 * string iteration for code points and on explicit checks for the combining,
 * spacing, and joiner classes that matter in real text.
 *
 * Trade-off: a full implementation would ship the Grapheme_Cluster_Break
 * property table from the Unicode Character Database. That table is large and
 * changes with each Unicode release. The approach here covers the cases that
 * break naive `Array.from(str)` splitting in practice — combining marks,
 * surrogate pairs, regional indicator pairs, and ZWJ sequences — while staying
 * small enough to read in one sitting. Characters whose grapheme break
 * behaviour depends on properties not checked here will be split more
 * aggressively than a fully conformant implementation would split them.
 */

const ZWJ = 0x200d;
const ZWNJ = 0x200c;

/**
 * Returns true when `cp` is a code point that must attach to the preceding
 * base character rather than start a new grapheme cluster.
 *
 * The ranges below cover the combining marks, modifier letters, and
 * non-spacing marks that appear in the scripts most likely to be mixed into
 * a JavaScript string. They are deliberately expressed as explicit ranges so
 * the file has no generated tables to keep in sync.
 */
function isExtend(cp) {
  return (
    (cp >= 0x0300 && cp <= 0x036f) || // Combining Diacritical Marks
    (cp >= 0x0483 && cp <= 0x0489) || // Cyrillic combining
    (cp >= 0x0591 && cp <= 0x05bd) || // Hebrew accents
    (cp >= 0x05bf && cp <= 0x05bf) ||
    (cp >= 0x05c1 && cp <= 0x05c2) ||
    (cp >= 0x05c4 && cp <= 0x05c5) ||
    (cp >= 0x05c7 && cp <= 0x05c7) ||
    (cp >= 0x0610 && cp <= 0x061a) || // Arabic marks
    (cp >= 0x064b && cp <= 0x065f) ||
    (cp >= 0x0670 && cp <= 0x0670) ||
    (cp >= 0x06d6 && cp <= 0x06dc) ||
    (cp >= 0x06df && cp <= 0x06e4) ||
    (cp >= 0x06e7 && cp <= 0x06e8) ||
    (cp >= 0x06ea && cp <= 0x06ed) ||
    (cp >= 0x0711 && cp <= 0x0711) ||
    (cp >= 0x0730 && cp <= 0x074a) ||
    (cp >= 0x07a6 && cp <= 0x07b0) ||
    (cp >= 0x07eb && cp <= 0x07f3) ||
    (cp >= 0x0816 && cp <= 0x0819) ||
    (cp >= 0x081b && cp <= 0x0823) ||
    (cp >= 0x0825 && cp <= 0x0827) ||
    (cp >= 0x0829 && cp <= 0x082d) ||
    (cp >= 0x0859 && cp <= 0x085b) ||
    (cp >= 0x08d3 && cp <= 0x08e1) ||
    (cp >= 0x08e3 && cp <= 0x0903) ||
    (cp >= 0x093a && cp <= 0x093c) ||
    (cp >= 0x093e && cp <= 0x094f) ||
    (cp >= 0x0951 && cp <= 0x0957) ||
    (cp >= 0x0962 && cp <= 0x0963) ||
    (cp >= 0x0981 && cp <= 0x0983) ||
    (cp >= 0x09bc && cp <= 0x09bc) ||
    (cp >= 0x09be && cp <= 0x09c4) ||
    (cp >= 0x09c7 && cp <= 0x09c8) ||
    (cp >= 0x09cb && cp <= 0x09cd) ||
    (cp >= 0x09d7 && cp <= 0x09d7) ||
    (cp >= 0x09e2 && cp <= 0x09e3) ||
    (cp >= 0x0a01 && cp <= 0x0a03) ||
    (cp >= 0x0a3c && cp <= 0x0a3c) ||
    (cp >= 0x0a3e && cp <= 0x0a42) ||
    (cp >= 0x0a47 && cp <= 0x0a48) ||
    (cp >= 0x0a4b && cp <= 0x0a4d) ||
    (cp >= 0x0a51 && cp <= 0x0a51) ||
    (cp >= 0x0a70 && cp <= 0x0a71) ||
    (cp >= 0x0a75 && cp <= 0x0a75) ||
    (cp >= 0x0a81 && cp <= 0x0a83) ||
    (cp >= 0x0abc && cp <= 0x0abc) ||
    (cp >= 0x0abe && cp <= 0x0ac5) ||
    (cp >= 0x0ac7 && cp <= 0x0ac9) ||
    (cp >= 0x0acb && cp <= 0x0acd) ||
    (cp >= 0x0ae2 && cp <= 0x0ae3) ||
    (cp >= 0x0b01 && cp <= 0x0b03) ||
    (cp >= 0x0b3c && cp <= 0x0b3c) ||
    (cp >= 0x0b3e && cp <= 0x0b44) ||
    (cp >= 0x0b47 && cp <= 0x0b48) ||
    (cp >= 0x0b4b && cp <= 0x0b4d) ||
    (cp >= 0x0b56 && cp <= 0x0b57) ||
    (cp >= 0x0b62 && cp <= 0x0b63) ||
    (cp >= 0x0b82 && cp <= 0x0b82) ||
    (cp >= 0x0bbe && cp <= 0x0bc2) ||
    (cp >= 0x0bc6 && cp <= 0x0bc8) ||
    (cp >= 0x0bca && cp <= 0x0bcd) ||
    (cp >= 0x0bd7 && cp <= 0x0bd7) ||
    (cp >= 0x0c00 && cp <= 0x0c04) ||
    (cp >= 0x0c3e && cp <= 0x0c44) ||
    (cp >= 0x0c46 && cp <= 0x0c48) ||
    (cp >= 0x0c4a && cp <= 0x0c4d) ||
    (cp >= 0x0c55 && cp <= 0x0c56) ||
    (cp >= 0x0c62 && cp <= 0x0c63) ||
    (cp >= 0x0c81 && cp <= 0x0c83) ||
    (cp >= 0x0cbc && cp <= 0x0cbc) ||
    (cp >= 0x0cbe && cp <= 0x0cc4) ||
    (cp >= 0x0cc6 && cp <= 0x0cc8) ||
    (cp >= 0x0cca && cp <= 0x0ccd) ||
    (cp >= 0x0cd5 && cp <= 0x0cd6) ||
    (cp >= 0x0ce2 && cp <= 0x0ce3) ||
    (cp >= 0x0d00 && cp <= 0x0d03) ||
    (cp >= 0x0d3b && cp <= 0x0d3c) ||
    (cp >= 0x0d3e && cp <= 0x0d44) ||
    (cp >= 0x0d46 && cp <= 0x0d48) ||
    (cp >= 0x0d4a && cp <= 0x0d4d) ||
    (cp >= 0x0d57 && cp <= 0x0d57) ||
    (cp >= 0x0d62 && cp <= 0x0d63) ||
    (cp >= 0x0d82 && cp <= 0x0d83) ||
    (cp >= 0x0dca && cp <= 0x0dca) ||
    (cp >= 0x0dcf && cp <= 0x0dd4) ||
    (cp >= 0x0dd6 && cp <= 0x0dd6) ||
    (cp >= 0x0dd8 && cp <= 0x0ddf) ||
    (cp >= 0x0df2 && cp <= 0x0df3) ||
    (cp >= 0x0e31 && cp <= 0x0e31) ||
    (cp >= 0x0e34 && cp <= 0x0e3a) ||
    (cp >= 0x0e47 && cp <= 0x0e4e) ||
    (cp >= 0x0eb1 && cp <= 0x0eb1) ||
    (cp >= 0x0eb4 && cp <= 0x0ebc) ||
    (cp >= 0x0ec8 && cp <= 0x0ecd) ||
    (cp >= 0x0f18 && cp <= 0x0f19) ||
    (cp >= 0x0f35 && cp <= 0x0f35) ||
    (cp >= 0x0f37 && cp <= 0x0f37) ||
    (cp >= 0x0f39 && cp <= 0x0f39) ||
    (cp >= 0x0f3e && cp <= 0x0f3f) ||
    (cp >= 0x0f71 && cp <= 0x0f84) ||
    (cp >= 0x0f86 && cp <= 0x0f87) ||
    (cp >= 0x0f8d && cp <= 0x0f97) ||
    (cp >= 0x0f99 && cp <= 0x0fbc) ||
    (cp >= 0x0fc6 && cp <= 0x0fc6) ||
    (cp >= 0x102b && cp <= 0x103e) ||
    (cp >= 0x1056 && cp <= 0x1059) ||
    (cp >= 0x105e && cp <= 0x1060) ||
    (cp >= 0x1062 && cp <= 0x1064) ||
    (cp >= 0x1067 && cp <= 0x106d) ||
    (cp >= 0x1071 && cp <= 0x1074) ||
    (cp >= 0x1082 && cp <= 0x108d) ||
    (cp >= 0x108f && cp <= 0x108f) ||
    (cp >= 0x109a && cp <= 0x109d) ||
    (cp >= 0x135d && cp <= 0x135f) ||
    (cp >= 0x1712 && cp <= 0x1714) ||
    (cp >= 0x1732 && cp <= 0x1734) ||
    (cp >= 0x1752 && cp <= 0x1753) ||
    (cp >= 0x1772 && cp <= 0x1773) ||
    (cp >= 0x17b4 && cp <= 0x17d3) ||
    (cp >= 0x17dd && cp <= 0x17dd) ||
    (cp >= 0x180b && cp <= 0x180d) ||
    (cp >= 0x1885 && cp <= 0x1886) ||
    (cp >= 0x18a9 && cp <= 0x18a9) ||
    (cp >= 0x1920 && cp <= 0x192b) ||
    (cp >= 0x1930 && cp <= 0x193b) ||
    (cp >= 0x1a17 && cp <= 0x1a1b) ||
    (cp >= 0x1a55 && cp <= 0x1a5e) ||
    (cp >= 0x1a60 && cp <= 0x1a7c) ||
    (cp >= 0x1a7f && cp <= 0x1a7f) ||
    (cp >= 0x1ab0 && cp <= 0x1abe) ||
    (cp >= 0x1b00 && cp <= 0x1b04) ||
    (cp >= 0x1b34 && cp <= 0x1b44) ||
    (cp >= 0x1b6b && cp <= 0x1b73) ||
    (cp >= 0x1b80 && cp <= 0x1b82) ||
    (cp >= 0x1ba1 && cp <= 0x1bad) ||
    (cp >= 0x1be6 && cp <= 0x1bf3) ||
    (cp >= 0x1c24 && cp <= 0x1c37) ||
    (cp >= 0x1cd0 && cp <= 0x1cd2) ||
    (cp >= 0x1cd4 && cp <= 0x1ce8) ||
    (cp >= 0x1ced && cp <= 0x1ced) ||
    (cp >= 0x1cf4 && cp <= 0x1cf4) ||
    (cp >= 0x1cf7 && cp <= 0x1cf9) ||
    (cp >= 0x1dc0 && cp <= 0x1df9) ||
    (cp >= 0x1dfb && cp <= 0x1dff) ||
    (cp >= 0x20d0 && cp <= 0x20f0) ||
    (cp >= 0x2cef && cp <= 0x2cf1) ||
    (cp >= 0x2d7f && cp <= 0x2d7f) ||
    (cp >= 0x2de0 && cp <= 0x2dff) ||
    (cp >= 0x302a && cp <= 0x302f) ||
    (cp >= 0x3099 && cp <= 0x309a) ||
    (cp >= 0xa66f && cp <= 0xa672) ||
    (cp >= 0xa674 && cp <= 0xa67d) ||
    (cp >= 0xa69e && cp <= 0xa69f) ||
    (cp >= 0xa6f0 && cp <= 0xa6f1) ||
    (cp >= 0xa802 && cp <= 0xa802) ||
    (cp >= 0xa806 && cp <= 0xa806) ||
    (cp >= 0xa80b && cp <= 0xa80b) ||
    (cp >= 0xa823 && cp <= 0xa827) ||
    (cp >= 0xa880 && cp <= 0xa881) ||
    (cp >= 0xa8b4 && cp <= 0xa8c5) ||
    (cp >= 0xa8e0 && cp <= 0xa8f1) ||
    (cp >= 0xa926 && cp <= 0xa92d) ||
    (cp >= 0xa947 && cp <= 0xa953) ||
    (cp >= 0xa980 && cp <= 0xa983) ||
    (cp >= 0xa9b3 && cp <= 0xa9c0) ||
    (cp >= 0xa9e5 && cp <= 0xa9e5) ||
    (cp >= 0xaa29 && cp <= 0xaa36) ||
    (cp >= 0xaa43 && cp <= 0xaa43) ||
    (cp >= 0xaa4c && cp <= 0xaa4d) ||
    (cp >= 0xaa7b && cp <= 0xaa7d) ||
    (cp >= 0xaab0 && cp <= 0xaab0) ||
    (cp >= 0xaab2 && cp <= 0xaab4) ||
    (cp >= 0xaab7 && cp <= 0xaab8) ||
    (cp >= 0xaabe && cp <= 0xaabf) ||
    (cp >= 0xaac1 && cp <= 0xaac1) ||
    (cp >= 0xaaeb && cp <= 0xaaef) ||
    (cp >= 0xaaf5 && cp <= 0xaaf6) ||
    (cp >= 0xabe3 && cp <= 0xabea) ||
    (cp >= 0xabec && cp <= 0xabed) ||
    (cp >= 0xfb1e && cp <= 0xfb1e) ||
    (cp >= 0xfe00 && cp <= 0xfe0f) ||
    (cp >= 0xfe20 && cp <= 0xfe2f) ||
    (cp >= 0x101fd && cp <= 0x101fd) ||
    (cp >= 0x102e0 && cp <= 0x102e0) ||
    (cp >= 0x10376 && cp <= 0x1037a) ||
    (cp >= 0x10a01 && cp <= 0x10a0f) ||
    (cp >= 0x10a38 && cp <= 0x10a3f) ||
    (cp >= 0x10ae5 && cp <= 0x10ae6) ||
    (cp >= 0x11000 && cp <= 0x11002) ||
    (cp >= 0x11038 && cp <= 0x11046) ||
    (cp >= 0x1107f && cp <= 0x11082) ||
    (cp >= 0x110b0 && cp <= 0x110ba) ||
    (cp >= 0x11100 && cp <= 0x11102) ||
    (cp >= 0x11127 && cp <= 0x11134) ||
    (cp >= 0x11145 && cp <= 0x11146) ||
    (cp >= 0x11173 && cp <= 0x11173) ||
    (cp >= 0x11180 && cp <= 0x11182) ||
    (cp >= 0x111b3 && cp <= 0x111c0) ||
    (cp >= 0x111ca && cp <= 0x111cc) ||
    (cp >= 0x1122c && cp <= 0x11237) ||
    (cp >= 0x1123e && cp <= 0x1123e) ||
    (cp >= 0x112df && cp <= 0x112ea) ||
    (cp >= 0x11300 && cp <= 0x11303) ||
    (cp >= 0x1133c && cp <= 0x1133c) ||
    (cp >= 0x1133e && cp <= 0x11344) ||
    (cp >= 0x11347 && cp <= 0x11348) ||
    (cp >= 0x1134b && cp <= 0x1134d) ||
    (cp >= 0x11357 && cp <= 0x11357) ||
    (cp >= 0x11362 && cp <= 0x11363) ||
    (cp >= 0x11435 && cp <= 0x11446) ||
    (cp >= 0x114b0 && cp <= 0x114c3) ||
    (cp >= 0x115af && cp <= 0x115b5) ||
    (cp >= 0x115b8 && cp <= 0x115c0) ||
    (cp >= 0x115dc && cp <= 0x115dd) ||
    (cp >= 0x11630 && cp <= 0x11640) ||
    (cp >= 0x116ab && cp <= 0x116b7) ||
    (cp >= 0x1171d && cp <= 0x1172b) ||
    (cp >= 0x11c2f && cp <= 0x11c36) ||
    (cp >= 0x11c38 && cp <= 0x11c3f) ||
    (cp >= 0x11c92 && cp <= 0x11ca7) ||
    (cp >= 0x11ca9 && cp <= 0x11cb6) ||
    (cp >= 0x11d31 && cp <= 0x11d36) ||
    (cp >= 0x11d3a && cp <= 0x11d3a) ||
    (cp >= 0x11d3c && cp <= 0x11d3d) ||
    (cp >= 0x11d3f && cp <= 0x11d45) ||
    (cp >= 0x11d47 && cp <= 0x11d47) ||
    (cp >= 0x11d90 && cp <= 0x11d91) ||
    (cp >= 0x11d95 && cp <= 0x11d95) ||
    (cp >= 0x11d97 && cp <= 0x11d97) ||
    (cp >= 0x16af0 && cp <= 0x16af4) ||
    (cp >= 0x16b30 && cp <= 0x16b36) ||
    (cp >= 0x16f51 && cp <= 0x16f7e) ||
    (cp >= 0x16f8f && cp <= 0x16f92) ||
    (cp >= 0x1bc9d && cp <= 0x1bc9e) ||
    (cp >= 0x1d165 && cp <= 0x1d169) ||
    (cp >= 0x1d16d && cp <= 0x1d172) ||
    (cp >= 0x1d17b && cp <= 0x1d182) ||
    (cp >= 0x1d185 && cp <= 0x1d18b) ||
    (cp >= 0x1d1aa && cp <= 0x1d1ad) ||
    (cp >= 0x1d242 && cp <= 0x1d244) ||
    (cp >= 0x1da00 && cp <= 0x1da36) ||
    (cp >= 0x1da3b && cp <= 0x1da6c) ||
    (cp >= 0x1da75 && cp <= 0x1da75) ||
    (cp >= 0x1da84 && cp <= 0x1da84) ||
    (cp >= 0x1da9b && cp <= 0x1da9f) ||
    (cp >= 0x1daa1 && cp <= 0x1daaf) ||
    (cp >= 0x1e000 && cp <= 0x1e006) ||
    (cp >= 0x1e008 && cp <= 0x1e018) ||
    (cp >= 0x1e01b && cp <= 0x1e021) ||
    (cp >= 0x1e023 && cp <= 0x1e024) ||
    (cp >= 0x1e026 && cp <= 0x1e02a) ||
    (cp >= 0x1e8d0 && cp <= 0x1e8d6) ||
    (cp >= 0x1e944 && cp <= 0x1e94a) ||
    (cp >= 0xe0020 && cp <= 0xe007f) || // tag characters
    (cp >= 0xe0100 && cp <= 0xe01ef) // variation selectors supplement
  );
}

/**
 * Returns true when `cp` is a regional indicator symbol. Pairs of these form
 * a single grapheme cluster (a flag), which is why they cannot be handled by
 * the generic extend rule.
 */
function isRegionalIndicator(cp) {
  return cp >= 0x1f1e6 && cp <= 0x1f1ff;
}

/**
 * Splits `input` into extended grapheme clusters.
 *
 * The string is walked by code point using `for...of`, which already handles
 * surrogate pairs correctly. Clusters are then accumulated according to the
 * rules implemented in `isExtend` and the regional-indicator pairing rule.
 *
 * @param {string} input
 * @returns {string[]} one entry per grapheme cluster, in input order
 */
export function splitGraphemes(input) {
  if (typeof input !== 'string') {
    throw new TypeError('splitGraphemes expects a string');
  }

  const clusters = [];
  let current = '';
  let previousCodePoint = -1;
  let regionalIndicatorRun = 0;

  for (const ch of input) {
    const cp = ch.codePointAt(0);

    if (current === '') {
      current = ch;
      previousCodePoint = cp;
      regionalIndicatorRun = isRegionalIndicator(cp) ? 1 : 0;
      continue;
    }

    const regionalPair =
      isRegionalIndicator(cp) && regionalIndicatorRun % 2 === 1;

    const joins =
      isExtend(cp) ||
      cp === ZWJ ||
      cp === ZWNJ ||
      previousCodePoint === ZWJ ||
      regionalPair;

    if (joins) {
      current += ch;
    } else {
      clusters.push(current);
      current = ch;
    }
    if (isRegionalIndicator(cp)) {
      regionalIndicatorRun += 1;
    } else {
      regionalIndicatorRun = 0;
    }
    previousCodePoint = cp;
  }

  if (current !== '') {
    clusters.push(current);
  }

  return clusters;
}

/**
 * Counts the grapheme clusters in `input` without materialising the array.
 * Useful for length checks in UI code where allocating an array per keystroke
 * would be wasteful.
 *
 * @param {string} input
 * @returns {number}
 */
export function countGraphemes(input) {
  if (typeof input !== 'string') {
    throw new TypeError('countGraphemes expects a string');
  }

  let count = 0;
  let inCluster = false;
  let previousCodePoint = -1;
  let regionalIndicatorRun = 0;

  for (const ch of input) {
    const cp = ch.codePointAt(0);

    if (!inCluster) {
      inCluster = true;
      previousCodePoint = cp;
      regionalIndicatorRun = isRegionalIndicator(cp) ? 1 : 0;
      count += 1;
      continue;
    }

    const regionalPair =
      isRegionalIndicator(cp) && regionalIndicatorRun % 2 === 1;

    const joins =
      isExtend(cp) ||
      cp === ZWJ ||
      cp === ZWNJ ||
      previousCodePoint === ZWJ ||
      regionalPair;

    if (!joins) {
      count += 1;
    }
    if (isRegionalIndicator(cp)) {
      regionalIndicatorRun += 1;
    } else {
      regionalIndicatorRun = 0;
    }
    previousCodePoint = cp;
  }

  return count;
}

/**
 * Reverses a string by grapheme cluster rather than by code unit. Naive
 * `str.split('').reverse().join('')` mangles surrogate pairs and separates
 * combining marks from their base character.
 *
 * @param {string} input
 * @returns {string}
 */
export function reverseGraphemes(input) {
  return splitGraphemes(input).reverse().join('');
}
