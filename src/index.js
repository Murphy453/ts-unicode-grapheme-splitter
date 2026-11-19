/**
 * Public entry point for ts-unicode-grapheme-splitter.
 *
 * Re-exports the grapheme splitting API. Keeping this file tiny means the
 * public surface stays explicit and easy to audit.
 */

export { splitGraphemes, countGraphemes, reverseGraphemes } from './core.js';
