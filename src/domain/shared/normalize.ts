/**
 * Canonical text normalisation used when comparing a player's answer with the
 * expected answer: trims surrounding whitespace and lowercases. Keeping it in
 * one place guarantees every quest type compares answers the same way.
 */
export function normalize(value: string): string {
  return value.trim().toLowerCase();
}
